import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminToken } from '@/lib/adminAuth'

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [products, branches] = await Promise.all([
    prisma.product.findMany({
      where: { isAvailable: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return NextResponse.json({ products, branches })
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { branchId, items, totalAmount, customerPhone } = await req.json()

  if (!branchId || !items?.length || !totalAmount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  const pointsEarned = Math.floor(totalAmount / 10)

  let userId: string | null = null
  if (customerPhone) {
    const user = await prisma.user.findUnique({ where: { phone: customerPhone } })
    if (user) userId = user.id
  }

  const order = await prisma.order.create({
    data: {
      orderNumber,
      branchId,
      userId: userId || 'guest',
      totalAmount,
      pointsEarned,
      status: 'COMPLETED',
      items: {
        create: items.map((item: any) => ({
          productId: item.productId,
          quantity: item.qty,
          price: item.price,
        })),
      },
    },
    include: {
      branch: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  })

  // Award points if user found
  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: pointsEarned } },
    })
  }

  return NextResponse.json({ order, pointsEarned })
}
