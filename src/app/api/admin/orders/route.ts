import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminToken } from '@/lib/adminAuth'

export async function GET(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search') || ''
  const page   = parseInt(searchParams.get('page') || '1')
  const limit  = parseInt(searchParams.get('limit') || '50')
  const skip   = (page - 1) * limit

  const where: any = {}
  if (status && status !== 'ALL') where.status = status
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { phone: { contains: search } } },
    ]
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user:   { select: { id: true, name: true, phone: true, email: true } },
        branch: { select: { id: true, name: true } },
        items:  { include: { product: { select: { name: true, price: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])

  return NextResponse.json({ orders, total, page, limit })
}

export async function PATCH(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error

  const { orderId, status } = await req.json()
  if (!orderId || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    include: {
      user:   { select: { name: true, phone: true } },
      branch: { select: { name: true } },
    },
  })

  return NextResponse.json({ order })
}
