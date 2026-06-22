import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminToken } from '@/lib/adminAuth'

export async function GET(req: import('next/server').NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  const [totalUsers, totalOrders, pendingReceipts, totalRevenue, recentOrders, topBranches] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.count(),
    prisma.receipt.count({ where: { status: 'PENDING' } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: 'COMPLETED' } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } }, branch: { select: { name: true } } },
    }),
    prisma.branch.findMany({
      include: { _count: { select: { orders: true } } },
      take: 4,
    }),
  ])

  return NextResponse.json({
    stats: {
      totalUsers,
      totalOrders,
      pendingReceipts,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    },
    recentOrders,
    topBranches,
  })
}
