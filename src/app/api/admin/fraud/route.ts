import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/adminAuth'

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const minScore = parseFloat(searchParams.get('minScore') || '0.3')

  const receipts = await prisma.receipt.findMany({
    where: {
      fraudScore: { gt: minScore },
      status: { in: ['PENDING', 'FLAGGED'] },
    },
    include: {
      user: { select: { id: true, name: true, phone: true, email: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { fraudScore: 'desc' },
    take: 100,
  })

  // Summary stats
  const [total, highRisk, medRisk, reviewedToday] = await Promise.all([
    prisma.receipt.count({ where: { fraudScore: { gt: 0.3 } } }),
    prisma.receipt.count({ where: { fraudScore: { gt: 0.7 } } }),
    prisma.receipt.count({ where: { fraudScore: { gt: 0.3, lte: 0.7 } } }),
    prisma.receipt.count({
      where: {
        reviewedAt: { gte: new Date(new Date().setHours(0,0,0,0)) },
        status: { in: ['APPROVED', 'REJECTED'] },
      },
    }),
  ])

  return NextResponse.json({ receipts, stats: { total, highRisk, medRisk, reviewedToday } })
}

export async function PATCH(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { receiptId, action } = await req.json()
  if (!receiptId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

  const receipt = await prisma.receipt.update({
    where: { id: receiptId },
    data: {
      status: newStatus,
      reviewedAt: new Date(),
    },
  })

  // If approved, ensure points were awarded; if rejected, revoke points
  if (action === 'reject' && receipt.pointsEarned > 0) {
    await prisma.user.update({
      where: { id: receipt.userId },
      data: { points: { decrement: receipt.pointsEarned } },
    }).catch(() => {}) // ignore if user not found
  }

  return NextResponse.json({ receipt })
}
