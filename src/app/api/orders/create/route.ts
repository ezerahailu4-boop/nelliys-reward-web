import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { calcPoints } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  try {
    const { items, branchId, notes, paymentMethod = 'cash' } = await req.json()
    if (!items?.length || !branchId) return NextResponse.json({ error: 'Missing items or branch' }, { status: 400 })

    const products = await prisma.product.findMany({ where: { id: { in: items.map((i: any) => i.productId) } } })
    const totalAmount = items.reduce((sum: number, item: any) => {
      const product = products.find((p: any) => p.id === item.productId)
      return sum + (product?.price || 0) * item.quantity
    }, 0)

    const pointsEarned = calcPoints(totalAmount)
    const orderNumber = `ORD-${Date.now()}`
    const userId = (session!.user as any).id

    const order = await prisma.order.create({
      data: {
        orderNumber, userId, branchId, totalAmount, pointsEarned,
        paymentMethod, notes,
        items: { create: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity, price: products.find((p: any) => p.id === i.productId)?.price || 0 })) },
      },
      include: { items: { include: { product: true } } },
    })

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { points: { increment: pointsEarned }, totalSpent: { increment: totalAmount } } }),
      prisma.transaction.create({ data: { userId, type: 'earned', amount: pointsEarned, description: `Order ${orderNumber}`, reference: order.id } }),
    ])

    return NextResponse.json({ order, pointsEarned }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
