import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminToken } from '@/lib/adminAuth'

export async function GET(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [tierDistribution, dailyOrders, topProducts, churnRisk, newUsersThisWeek, totalUsers] =
    await Promise.all([
      prisma.user.groupBy({ by: ['tier'], _count: true, where: { role: 'CUSTOMER' } }),
      prisma.order.findMany({
        where: { createdAt: { gte: thirtyDaysAgo }, status: 'COMPLETED' },
        select: { createdAt: true, totalAmount: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      prisma.user.count({
        where: { role: 'CUSTOMER', orders: { none: { createdAt: { gte: thirtyDaysAgo } } }, createdAt: { lt: thirtyDaysAgo } },
      }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo }, role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ])

  const productIds = topProducts.map(p => p.productId)
  const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })
  const productMap = Object.fromEntries(products.map(p => [p.id, p.name]))

  const revenueByDay: Record<string, { revenue: number; orders: number }> = {}
  dailyOrders.forEach(o => {
    const day = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!revenueByDay[day]) revenueByDay[day] = { revenue: 0, orders: 0 }
    revenueByDay[day].revenue += o.totalAmount
    revenueByDay[day].orders += 1
  })

  return NextResponse.json({
    tierDistribution,
    dailyRevenue: Object.entries(revenueByDay).map(([day, v]) => ({ day, ...v })),
    topProducts: topProducts.map(p => ({ name: productMap[p.productId] || 'Unknown', qty: p._sum.quantity || 0 })),
    churnRisk, newUsersThisWeek, totalUsers,
    retentionRate: totalUsers > 0 ? Math.round(((totalUsers - churnRisk) / totalUsers) * 100) : 0,
  })
}
