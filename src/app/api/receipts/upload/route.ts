import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, calcPoints, calcTier } from '@/lib/auth'
import { TIER_MULTIPLIER } from '@/lib/constants'
import { rateLimit } from '@/lib/rateLimit'
import crypto from 'crypto'

export const maxDuration = 60

/**
 * Runs OCR on an image buffer using the OCR.space API (REST).
 * Requires OCR_SPACE_API_KEY env var.
 */
async function runVisionOcr(imageBuffer: Buffer): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY
  if (!apiKey) {
    throw new Error('OCR_SPACE_API_KEY is not set')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  try {
    const form = new FormData()
    form.append('apikey', apiKey)
    form.append('language', 'eng')
    form.append('OCREngine', '2') // engine 2 = high accuracy for receipts
    form.append('scale', 'true')
    form.append('isTable', 'true')
    form.append(
      'file',
      new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' }),
      'receipt.jpg'
    )

    const res = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      signal: controller.signal,
      body: form,
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`OCR.space error ${res.status}: ${body.slice(0, 300)}`)
    }

    const json = await res.json()

    if (json.IsErroredOnProcessing) {
      const msg = Array.isArray(json.ErrorMessage) ? json.ErrorMessage.join('; ') : json.ErrorMessage
      throw new Error(`OCR.space processing error: ${msg}`)
    }

    return json?.ParsedResults?.[0]?.ParsedText ?? ''
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Extracts the total monetary amount from receipt OCR text.
 */
function parseAmount(text: string): number {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').map(l =>
    l.replace(/[\u066B\u066C]/g, '.').replace(/,(?=\d{3})/g, '').replace(/\s+/g, ' ').trim()
  ).filter(Boolean)

  const exactTotal = /^\s*[*#]?\s*(?:total|grand\s*total|net\s*total|amount\s*due|cash|\u1308\u1245\u120b\u120b|\u12f5\u121d\u122d|\u12ad\u134d\u12eb)\b/i
  const broadTotal = /(?:total|cash|grand\s*total|net\s*total|amount\s*due|balance\s*due|\u1308\u1245\u120b\u120b|\u12f5\u121d\u122d|\u12ad\u134d\u12eb|ETB|birr)/i

  const moneyPattern = /(\d+\.\d{2})\b/g

  const getNum = (line: string) => {
    const nums = Array.from(line.matchAll(moneyPattern)).map(m => parseFloat(m[1])).filter(v => v > 0)
    return nums.length ? nums[nums.length - 1] : 0
  }

  let best = 0
  for (const line of [...lines].reverse()) {
    const n = getNum(line)
    if (!n) continue
    if (exactTotal.test(line)) return n
    if (broadTotal.test(line) && !best) best = n
  }
  if (best) return best

  const all = Array.from(text.matchAll(moneyPattern))
    .map(m => parseFloat(m[1]))
    .filter(v => v >= 20 && v <= 25000)
  return all.length ? Math.max(...all) : 0
}

/**
 * Extracts Fiscal / Invoice / FS number from the OCR text to stop duplicate receipts.
 */
function extractFiscalOrReceiptNumber(text: string): string | null {
  const patterns = [
    /(?:FS\s*N[oO\.]*|FS\s*#|FSNO)\s*[:\-\s]*([A-Z0-9\-\/]{3,20})/i,
    /(?:BILL\s*N[oO\.]*|BILL\s*#|INV\s*N[oO\.]*|INVOICE\s*#*)\s*[:\-\s]*([A-Z0-9\-\/]{3,20})/i,
    /(?:RECEIPT\s*N[oO\.]*|RECEIPT\s*#|REF\s*N[oO\.]*)\s*[:\-\s]*([A-Z0-9\-\/]{3,20})/i,
    /\b(FS\d{4,12})\b/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      return match[1].trim().toUpperCase()
    }
  }
  return null
}

/**
 * Checks whether the OCR text contains authentic keywords of a coffee shop / Ethiopian receipt.
 */
function validateReceiptAuthenticity(text: string): { isValid: boolean; matchedKeywords: string[] } {
  const lower = text.toLowerCase()
  const authenticKeywords = [
    'nelliy', 'coffee', 'macchiato', 'cappuccino', 'latte', 'espresso', 'tea',
    'cake', 'pastry', 'croissant', 'sandwich', 'burger', 'juice', 'water',
    'mocha', 'americano', 'drip', 'roast', 'buna', 'cafe', 'kaffa',
    'fs', 'tin', 'erca', 'vat', 'tot', 'birr', 'etb', 'total', 'cashier',
    'receipt', 'subtotal', 'bill', 'ድምር', 'ክፍያ', 'ቡና', 'ሻይ', 'ማኪያቶ'
  ]

  const matched = authenticKeywords.filter(kw => lower.includes(kw))
  // A genuine receipt should match at least 2 relevant tokens or contain 'nelliy' / 'fs'
  const isValid = matched.length >= 2 || lower.includes('nelliy') || lower.includes('fs')
  return { isValid, matchedKeywords: matched }
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  try {
    const userId = (session!.user as any).id

    // 1. Rate Limiting: Max 1 upload per 10s cooldown
    if (!rateLimit(`receipt-upload-cooldown:${userId}`, 1, 10_000)) {
      return NextResponse.json(
        { error: 'Please wait a few moments before uploading another receipt.' },
        { status: 429 }
      )
    }

    // 2. Velocity Check: Max 10 receipt uploads per day per user
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const dailyUploadCount = await prisma.receipt.count({
      where: { userId, createdAt: { gte: oneDayAgo } },
    })
    if (dailyUploadCount >= 10) {
      return NextResponse.json(
        { error: 'You have reached the daily limit of 10 receipt uploads. Please try again tomorrow.' },
        { status: 429 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const branchId = formData.get('branchId') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 3. Exact Image Byte Hash Deduplication
    const imageHash = crypto.createHash('sha256').update(buffer).digest('hex')
    const alreadyUsedHash = await prisma.receipt.findFirst({ where: { imageHash } })
    if (alreadyUsedHash) {
      return NextResponse.json(
        { error: 'This receipt image has already been submitted and rewarded.' },
        { status: 409 }
      )
    }

    // 4. Run OCR Scan
    let ocrText = ''
    try {
      ocrText = await runVisionOcr(buffer)
    } catch (ocrErr: any) {
      console.error('[OCR Error]:', ocrErr?.message || ocrErr)
      return NextResponse.json(
        { error: 'Could not read receipt image. Please ensure the photo is clear, well-lit, and try again.' },
        { status: 400 }
      )
    }

    if (!ocrText || ocrText.trim().length < 10) {
      return NextResponse.json(
        { error: 'No readable text found on the receipt. Please upload a clearer photo.' },
        { status: 400 }
      )
    }

    // 5. Authenticity / Keyword Check
    const { isValid: isAuthentic, matchedKeywords } = validateReceiptAuthenticity(ocrText)
    if (!isAuthentic) {
      return NextResponse.json(
        { error: 'This does not appear to be a valid Nelliy’s Coffee receipt. Please upload a clear photo of your receipt.' },
        { status: 400 }
      )
    }

    // 6. Extract Amount
    const amount = parseAmount(ocrText)
    if (amount < 20) {
      return NextResponse.json(
        { error: 'Could not identify a valid total amount on the receipt (minimum 20 ETB). Please make sure the total line is clearly visible.' },
        { status: 400 }
      )
    }

    if (amount > 30000) {
      return NextResponse.json(
        { error: 'Receipt amount exceeds maximum allowed threshold. Please contact store manager for assistance.' },
        { status: 400 }
      )
    }

    // 7. Fiscal / FS / Bill Number Duplicate Detection
    const extractedFiscalNumber = extractFiscalOrReceiptNumber(ocrText)
    let receiptNumber = `RCP-${Date.now()}`

    if (extractedFiscalNumber) {
      receiptNumber = `FS-${extractedFiscalNumber}`

      // Check if any receipt with this fiscal/bill number exists (by same or any user)
      const existingFiscalReceipt = await prisma.receipt.findFirst({
        where: {
          OR: [
            { receiptNumber: `FS-${extractedFiscalNumber}` },
            { receiptNumber: extractedFiscalNumber },
          ],
        },
      })

      if (existingFiscalReceipt) {
        return NextResponse.json(
          { error: `This receipt (FS/Bill #${extractedFiscalNumber}) has already been claimed.` },
          { status: 409 }
        )
      }
    } else {
      // Fingerprint deduplication: check if same user submitted same exact amount in the last 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      const recentSameAmount = await prisma.receipt.findFirst({
        where: {
          userId,
          amount,
          createdAt: { gte: twoHoursAgo },
        },
      })
      if (recentSameAmount) {
        return NextResponse.json(
          { error: `A receipt for ${amount} ETB was already submitted recently. If this is a different visit, please ensure the receipt number or timestamp is clearly visible.` },
          { status: 409 }
        )
      }
    }

    // 8. Fraud Risk Scoring
    let fraudScore = 0.0
    const fraudReasons: string[] = []

    const lowerOcr = ocrText.toLowerCase()
    if (!lowerOcr.includes('nelliy')) {
      fraudScore += 0.2
      fraudReasons.push('Brand name "Nelliy" not detected in text')
    }

    if (!extractedFiscalNumber) {
      fraudScore += 0.15
      fraudReasons.push('Fiscal/FS reference number not clearly identified')
    }

    if (amount > 5000) {
      fraudScore += 0.35
      fraudReasons.push(`High transaction amount (${amount} ETB)`)
    }

    // Check if user uploaded another receipt in last 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000)
    const recentUploadCount = await prisma.receipt.count({
      where: { userId, createdAt: { gte: tenMinsAgo } },
    })
    if (recentUploadCount >= 2) {
      fraudScore += 0.3
      fraudReasons.push('Rapid consecutive receipt submissions')
    }

    const branch = branchId
      ? await prisma.branch.findUnique({ where: { id: branchId } })
      : await prisma.branch.findFirst()
    if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 })

    const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { tier: true } })
    const multiplier = TIER_MULTIPLIER[userRecord?.tier || 'BRONZE'] ?? 1
    const pointsEarned = Math.floor(calcPoints(amount) * multiplier)

    // 9. Handle Suspicious / Flagged vs Auto-Approved Receipts
    const isSuspicious = fraudScore >= 0.55

    if (isSuspicious) {
      // Save as FLAGGED for Admin Review
      const receipt = await prisma.receipt.create({
        data: {
          receiptNumber,
          userId,
          branchId: branch.id,
          amount,
          pointsEarned,
          imageHash,
          ocrData: {
            rawText: ocrText.slice(0, 2000),
            extractedFiscalNumber,
            matchedKeywords,
          },
          status: 'FLAGGED' as any,
          fraudScore,
          fraudReasons,
        },
      })

      return NextResponse.json({
        receipt: {
          id: receipt.id,
          amount,
          pointsEarned,
          status: 'FLAGGED',
          receiptNumber,
          branch: branch.name,
          message: 'Receipt received! Due to verification checks, points will be credited upon quick review.',
        },
      })
    }

    // 10. Clean Receipt: Auto-Approve & Credit Points
    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber,
        userId,
        branchId: branch.id,
        amount,
        pointsEarned,
        imageHash,
        ocrData: {
          rawText: ocrText.slice(0, 2000),
          extractedFiscalNumber,
          matchedKeywords,
        },
        status: 'APPROVED',
        reviewedAt: new Date(),
        fraudScore,
        fraudReasons,
      },
    })

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { points: { increment: pointsEarned }, totalSpent: { increment: amount } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'earned',
          amount: pointsEarned,
          description: `Receipt at ${branch.name} for ${amount} ETB`,
          reference: `receipt:${receipt.id}`,
        },
      }),
      prisma.notification.create({
        data: {
          userId,
          type: 'points',
          title: 'Points Added!',
          message: `+${pointsEarned} pts from your receipt at ${branch.name}`,
        },
      }),
    ])

    const updatedUser = await prisma.user.findUnique({ where: { id: userId }, select: { points: true, tier: true } })
    if (updatedUser) {
      const newTier = calcTier(updatedUser.points)
      if (newTier !== updatedUser.tier) {
        await prisma.user.update({ where: { id: userId }, data: { tier: newTier as any } })
        await prisma.notification.create({
          data: { userId, type: 'tier', title: '🎉 Tier Upgrade!', message: `You've reached ${newTier} tier!` },
        })
      }
    }

    return NextResponse.json({
      receipt: { id: receipt.id, amount, pointsEarned, status: 'APPROVED', receiptNumber, branch: branch.name },
    })
  } catch (err: any) {
    console.error('Upload route error:', err)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}

