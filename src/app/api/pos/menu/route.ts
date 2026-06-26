import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const POS_PIN = process.env.POS_PIN || '1234'

export async function GET(req: NextRequest) {
  const pin = req.headers.get('x-pos-pin') || ''
  const pinBuf = Buffer.from(pin)
  const expectedBuf = Buffer.from(POS_PIN)
  const match = pinBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(pinBuf, expectedBuf)
  if (!match) return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })

  const [products, branches] = await Promise.all([
    prisma.product.findMany({
      where: { isAvailable: true },
      select: { id: true, name: true, category: true, price: true, bonusPoints: true },

      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true, address: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return NextResponse.json({ products, branches })
}
