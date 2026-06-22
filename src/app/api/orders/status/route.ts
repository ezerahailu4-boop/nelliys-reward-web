import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get('id')
  if (!orderId) return NextResponse.json({ error: 'Missing order id' }, { status: 400 })

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: (session!.user as any).id },
    select: { id: true, orderNumber: true, status: true, pointsEarned: true, totalAmount: true, updatedAt: true },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  return NextResponse.json({ order })
}
