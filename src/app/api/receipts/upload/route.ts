import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, calcPoints, calcTier } from '@/lib/auth'
import { TIER_MULTIPLIER, QR_SCAN_POINTS } from '@/lib/constants'
import crypto from 'crypto'

export const maxDuration = 60

function parseAmount(text: string): number {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').map(l =>
    l.replace(/[\u066B\u066C]/g, '.').replace(/,(?=\d{3})/g, '').replace(/\s+/g, ' ').trim()
  ).filter(Boolean)

  const exactTotal = /^\s*(?:total|cash|grand\s*total|amount\s*due|\u1308\u1245\u120b\u120b|\u12f5\u121d\u122d|\u12ad\u134d\u12eb)\b/i
  const broadTotal = /(?:total|cash|grand\s*total|net\s*total|amount\s*due|balance\s*due|\u1308\u1245\u120b\u120b|\u12f5\u121d\u122d|\u12ad\u134d\u12eb|ETB|birr)/i

  const getNum = (line: string) => {
    const nums = Array.from(line.matchAll(/(\d+\.?\d*)/g)).map(m => parseFloat(m[1])).filter(v => v > 0)
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

 const all = Array.from(text.matchAll(/(\d+\.?\d*)/g))
    .map(m => parseFloat(m[1]))
    .filter(v => v >= 20 && v <= 100000)
  return all.length ? Math.max(...all) : 0
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const branchId = formData.get('branchId') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const userId = (session!.user as any).id
    const bytes = await file.arrayBuffer()

    // Deduplicate by image hash
    const imageHash = crypto.createHash('sha256').update(Buffer.from(bytes)).digest('hex')
    const alreadyUsed = await prisma.receipt.findFirst({ where: { imageHash } })
    if (alreadyUsed) {
      return NextResponse.json({ error: 'This receipt has already been submitted.' }, { status: 409 })
    }

    const receiptNumber = `RCP-${Date.now()}`

    // Try OCR — if it fails or finds no amount, fall back to flat points
    let ocrText = ''
    let amount = 0
    try {
      const { createWorker } = await import('tesseract.js')
      const worker = await createWorker('eng')
      const { data } = await worker.recognize(Buffer.from(bytes))
      await worker.terminate()
      ocrText = data.text
      amount = parseAmount(ocrText)
      console.log('OCR amount:', amount)
    } catch (ocrErr) {
      console.error('OCR failed, using flat points:', ocrErr)
    }

    const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { tier: true } })
    const multiplier = TIER_MULTIPLIER[userRecord?.tier || 'BRONZE'] ?? 1

    // If OCR got an amount use it, otherwise award flat QR_SCAN_POINTS
    const pointsEarned = amount > 0
      ? Math.floor(calcPoints(amount) * multiplier)
      : Math.round(QR_SCAN_POINTS * multiplier)

    const branch = branchId
      ? await prisma.branch.findUnique({ where: { id: branchId } })
      : await prisma.branch.findFirst()
    if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 })

    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber,
        userId,
        branchId: branch.id,
        amount,
        pointsEarned,
        imageHash,
        ocrData: { rawText: ocrText.slice(0, 2000) },
        status: 'APPROVED',
        reviewedAt: new Date(),
        fraudScore: 0,
        fraudReasons: [],
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
          description: amount > 0
            ? `Receipt at ${branch.name} for ${amount} ETB`
            : `Receipt upload at ${branch.name}`,
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
  } catch (err) {
    console.error('Upload route error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
