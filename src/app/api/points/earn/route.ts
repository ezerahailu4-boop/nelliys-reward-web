import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, calcPoints, calcTier } from '@/lib/auth'
import { z } from 'zod'
import { sendSMS, smsTemplates } from '@/lib/textbee'
import { sendPointsEarnedEmail } from '@/lib/email'
import { notifyTierUpgrade } from '@/lib/notifications'
import { TIER_MULTIPLIER, QR_SCAN_POINTS } from '@/lib/constants'
import crypto from 'crypto'

const RECEIPT_QR_SECRET = process.env.RECEIPT_QR_SECRET
if (!RECEIPT_QR_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('RECEIPT_QR_SECRET env var is required in production')
}
const QR_SECRET = RECEIPT_QR_SECRET || 'dev-only-secret-do-not-use-in-prod'

function verifyReceiptQr(payload: string, sig: string): boolean {
  const expected = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex')
  return expected === sig
}

// CNET QR codes are from an external POS system with an encrypted payload.
// We treat them as verified visit scans — the QR itself proves the customer
// was physically present at the shop with a valid receipt.
function isCnetQr(qrCode: string): boolean {
  return qrCode.startsWith('CNET,')
}

async function getActiveCampaignMultiplier(userTier: string): Promise<number> {
  const now = new Date()
  const campaigns = await prisma.campaign.findMany({
    where: {
      isActive: true,
      type: 'multiplier',
      startDate: { lte: now },
      endDate: { gte: now },
      OR: [{ targetTier: null }, { targetTier: userTier }],
    },
    orderBy: { multiplier: 'desc' },
    take: 1,
  })
  return campaigns[0]?.multiplier ?? 1
}

const schema = z.object({ qrCode: z.string().min(1) })

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  try {
    const { qrCode } = schema.parse(await req.json())
    const userId = (session!.user as any).id

    let parsed: any = null
    try { parsed = JSON.parse(qrCode) } catch {}

    // --- CNET QR: external POS receipt QR (encrypted, treat as visit scan) ---
    if (!parsed && isCnetQr(qrCode)) {
      // Use a hash of the QR as the dedup key so reference length stays bounded
      const cnetHash = crypto.createHash('sha256').update(qrCode).digest('hex').slice(0, 32)
      const recentCnet = await prisma.transaction.findFirst({
        where: { userId, reference: `cnet:${cnetHash}`, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      })
      if (recentCnet) return NextResponse.json({ error: 'This QR code was already scanned recently. Try again in 1 hour.' }, { status: 429 })

      const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { tier: true } })
      const tierMultiplier = TIER_MULTIPLIER[userRecord?.tier || 'BRONZE']
      const campaignMultiplier = await getActiveCampaignMultiplier(userRecord?.tier || 'BRONZE')
      const multiplier = Math.max(tierMultiplier, campaignMultiplier)
      const pointsEarned = Math.round(QR_SCAN_POINTS * multiplier)

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { points: { increment: pointsEarned } },
        select: { points: true, tier: true, phone: true, email: true, name: true },
      })
      await prisma.transaction.create({
        data: { userId, type: 'earned', amount: pointsEarned, description: "Receipt QR scan at Nelliy's Coffee", reference: `cnet:${cnetHash}` },
      })
      await prisma.notification.create({
        data: { userId, type: 'points', title: 'Points Added!', message: `+${pointsEarned} points from receipt scan` },
      })
      const newTier = calcTier(updatedUser.points)
      if (newTier !== updatedUser.tier) {
        await prisma.user.update({ where: { id: userId }, data: { tier: newTier as any } })
        notifyTierUpgrade(userId).catch(() => {})
      } else {
        sendSMS(updatedUser.phone, smsTemplates.pointsEarned(pointsEarned, updatedUser.points)).catch(() => {})
        if (updatedUser.email) sendPointsEarnedEmail(updatedUser.email, pointsEarned, updatedUser.points, "Nelliy's Coffee").catch(() => {})
      }
      return NextResponse.json({ points: pointsEarned, total: updatedUser.points, branch: "Nelliy's Coffee", multiplier })
    }

    // --- Member QR: staff scans customer's QR ---
    if (parsed?.type === 'member' && parsed?.userId) {
      const targetId = parsed.userId
      if (targetId === userId)
        return NextResponse.json({ error: 'You cannot scan your own QR code' }, { status: 400 })

      const recentScan = await prisma.transaction.findFirst({
        where: { userId: targetId, reference: `member-qr:${targetId}:scanned-by:${userId}`, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
      })
      if (recentScan) return NextResponse.json({ error: 'This member QR was already scanned recently' }, { status: 429 })

      const pointsEarned = QR_SCAN_POINTS
      const updatedUser = await prisma.user.update({
        where: { id: targetId },
        data: { points: { increment: pointsEarned } },
        select: { points: true, tier: true, phone: true, email: true, name: true },
      })

      await prisma.transaction.create({
        data: { userId: targetId, type: 'earned', amount: pointsEarned, description: 'Member QR scan', reference: `member-qr:${targetId}:scanned-by:${userId}` },
      })
      await prisma.notification.create({
        data: { userId: targetId, type: 'points', title: 'Points Added!', message: `+${pointsEarned} points from QR scan` },
      })

      const newTier = calcTier(updatedUser.points)
      if (newTier !== updatedUser.tier) {
        await prisma.user.update({ where: { id: targetId }, data: { tier: newTier as any } })
        notifyTierUpgrade(targetId).catch(() => {})
      } else {
        sendSMS(updatedUser.phone, smsTemplates.pointsEarned(pointsEarned, updatedUser.points)).catch(() => {})
        if (updatedUser.email) sendPointsEarnedEmail(updatedUser.email, pointsEarned, updatedUser.points, "Nelliy's Coffee").catch(() => {})
      }

      return NextResponse.json({ points: pointsEarned, total: updatedUser.points, branch: "Nelliy's Coffee", memberName: updatedUser.name })
    }

    // --- Receipt QR: customer scans QR on their printed receipt ---
    if (parsed?.type === 'receipt') {
      const { receiptNumber, branchId, items, amount, ts, sig } = parsed

      if (!receiptNumber || !branchId || !amount || !ts || !sig)
        return NextResponse.json({ error: 'Invalid receipt QR code' }, { status: 400 })

      if (Date.now() - ts > 30 * 24 * 60 * 60 * 1000)
        return NextResponse.json({ error: 'This receipt QR has expired' }, { status: 400 })

      const payload = `${receiptNumber}:${branchId}:${amount}:${ts}`
      if (!verifyReceiptQr(payload, sig))
        return NextResponse.json({ error: 'Invalid or tampered receipt QR' }, { status: 400 })

      const alreadyScanned = await prisma.receiptQrScan.findUnique({ where: { qrToken: sig } })
      if (alreadyScanned)
        return NextResponse.json({ error: 'This receipt has already been scanned for points' }, { status: 409 })

      const branch = await prisma.branch.findUnique({ where: { id: branchId } })
      if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 })

      const userRecord = await prisma.user.findUnique({ where: { id: userId }, select: { tier: true } })
      const tierMultiplier = TIER_MULTIPLIER[userRecord?.tier || 'BRONZE']
      const campaignMultiplier = await getActiveCampaignMultiplier(userRecord?.tier || 'BRONZE')
      const multiplier = Math.max(tierMultiplier, campaignMultiplier)

      let bonusPoints = 0
      if (Array.isArray(items) && items.length > 0) {
        const itemNames = items.map((i: any) => i.name)
        const menuProducts = await prisma.product.findMany({
          where: { name: { in: itemNames }, isAvailable: true },
          select: { name: true, rewardPoints: true },

        })
        const bonusMap = Object.fromEntries(menuProducts.map(p => [p.name, p.rewardPoints]))
        for (const item of items) {
          bonusPoints += (bonusMap[item.name] || 0) * (item.qty || 1)
        }

      }

      const basePoints = Math.floor(calcPoints(amount) * multiplier)
      const pointsEarned = basePoints + bonusPoints

      const [updatedUser] = await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { points: { increment: pointsEarned }, totalSpent: { increment: amount } },
          select: { points: true, tier: true, phone: true, email: true, name: true },
        }),
        prisma.receiptQrScan.create({
          data: { qrToken: sig, scannedBy: userId, receiptNumber, branchId, amount, pointsEarned },
        }),
        prisma.transaction.create({
          data: { userId, type: 'earned', amount: pointsEarned, description: `Receipt scan at ${branch.name} (${amount} ETB)`, reference: `receipt-qr:${sig}` },
        }),
        prisma.notification.create({
          data: { userId, type: 'points', title: 'Points Earned!', message: `+${pointsEarned} pts from receipt at ${branch.name}` },
        }),
      ])

      const newTier = calcTier(updatedUser.points)
      if (newTier !== updatedUser.tier) {
        await prisma.user.update({ where: { id: userId }, data: { tier: newTier as any } })
        notifyTierUpgrade(userId).catch(() => {})
      } else {
        sendSMS(updatedUser.phone, smsTemplates.pointsEarned(pointsEarned, updatedUser.points)).catch(() => {})
        if (updatedUser.email) sendPointsEarnedEmail(updatedUser.email, pointsEarned, updatedUser.points, branch.name).catch(() => {})
      }

      return NextResponse.json({ points: pointsEarned, total: updatedUser.points, branch: branch.name, amount, multiplier, bonusPoints })
    }

    // --- Branch QR scan ---
    const branch = await prisma.branch.findUnique({ where: { qrCode } })
    if (!branch) return NextResponse.json({ error: 'Invalid QR code' }, { status: 404 })

    const recentScan = await prisma.transaction.findFirst({
      where: { userId, reference: `qr:${qrCode}`, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    })
    if (recentScan) return NextResponse.json({ error: 'QR code already scanned recently. Try again in 1 hour.' }, { status: 429 })

    const pointsEarned = QR_SCAN_POINTS
    const user = await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: pointsEarned } },
      select: { points: true, tier: true, phone: true, email: true, name: true },
    })

    await prisma.transaction.create({
      data: { userId, type: 'earned', amount: pointsEarned, description: `QR scan at ${branch.name}`, reference: `qr:${qrCode}` },
    })
    await prisma.notification.create({
      data: { userId, type: 'points', title: 'Points Added!', message: `+${pointsEarned} points from QR scan at ${branch.name}` },
    })

    const newTier = calcTier(user.points)
    if (newTier !== user.tier) {
      await prisma.user.update({ where: { id: userId }, data: { tier: newTier as any } })
      notifyTierUpgrade(userId).catch(() => {})
    } else {
      sendSMS(user.phone, smsTemplates.pointsEarned(pointsEarned, user.points)).catch(() => {})
      if (user.email) sendPointsEarnedEmail(user.email, pointsEarned, user.points, branch.name).catch(() => {})
    }

    return NextResponse.json({ points: pointsEarned, total: user.points, branch: branch.name })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    return NextResponse.json({ error: 'Failed to process QR scan' }, { status: 500 })
  }
}
