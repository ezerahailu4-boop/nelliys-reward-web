import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcTier } from '@/lib/auth'
import { requireAdminToken } from '@/lib/adminAuth'
import { notifyTierUpgrade } from '@/lib/notifications'
import { z } from 'zod'

const patchSchema = z.object({
  receiptId: z.string().cuid(),
  action: z.enum(['approve', 'reject']),
})

const ALLOWED_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'] as const

export async function GET(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  const { searchParams } = new URL(req.url)
  const rawStatus = searchParams.get('status') || 'PENDING'
  const status = ALLOWED_STATUSES.includes(rawStatus as any) ? rawStatus : 'PENDING'

  const receipts = await prisma.receipt.findMany({
    where: { status: status as any },
    include: { user: { select: { name: true, phone: true } }, branch: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ receipts })
}

export async function PATCH(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  try {
    const { receiptId, action } = patchSchema.parse(await req.json())

    const receipt = await prisma.receipt.findUnique({ where: { id: receiptId } })
    if (!receipt) return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })

    if (action === 'approve') {
      await prisma.$transaction([
        prisma.receipt.update({
          where: { id: receiptId },
          data: { status: 'APPROVED', reviewedAt: new Date() },
        }),
        prisma.user.update({
          where: { id: receipt.userId },
          data: { points: { increment: receipt.pointsEarned }, totalSpent: { increment: receipt.amount } },
        }),
        prisma.transaction.create({
          data: { userId: receipt.userId, type: 'earned', amount: receipt.pointsEarned, description: 'Receipt approved', reference: `receipt:${receiptId}` },
        }),
      ])

      const user = await prisma.user.findUnique({ where: { id: receipt.userId }, select: { points: true, tier: true } })
      if (user) {
        const newTier = calcTier(user.points)
        if (newTier !== user.tier) {
          await prisma.user.update({ where: { id: receipt.userId }, data: { tier: newTier as any } })
          notifyTierUpgrade(receipt.userId).catch(() => {})
        }
      }
    } else {
      const rejectedReceipt = await prisma.receipt.update({
        where: { id: receiptId },
        data: { status: 'REJECTED', reviewedAt: new Date() },
      })
      await prisma.notification.create({
        data: {
          userId: rejectedReceipt.userId,
          type: 'receipt',
          title: '❌ Receipt Not Approved',
          message: `Your receipt of ${rejectedReceipt.amount} ETB could not be verified. Contact support if you think this is a mistake.`,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 })
  }
}
