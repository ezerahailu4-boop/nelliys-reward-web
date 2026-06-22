import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { rateLimit } from '@/lib/rateLimit'

const QR_SECRET = process.env.RECEIPT_QR_SECRET || 'dev-only-secret-do-not-use-in-prod'
const POS_PIN = process.env.POS_PIN || '1234'

const schema = z.object({
  pin: z.string().min(1),
  receiptNumber: z.string().min(1).max(50),
  branchId: z.string().min(1),
  amount: z.number().positive().max(100000),
  items: z.array(z.object({
    name: z.string().min(1).max(200),
    qty: z.number().int().positive().max(99),
    price: z.number().positive().max(100000),
  })).optional().default([]),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(ip, 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = schema.parse(await req.json())

    // Verify PIN with timing-safe compare
    const pinBuf = Buffer.from(body.pin)
    const expectedBuf = Buffer.from(POS_PIN)
    const match = pinBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(pinBuf, expectedBuf)
    if (!match) return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })

    const ts = Date.now()
    const payload = `${body.receiptNumber}:${body.branchId}:${body.amount}:${ts}`
    const sig = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex')

    const qrData = JSON.stringify({
      type: 'receipt',
      receiptNumber: body.receiptNumber,
      branchId: body.branchId,
      amount: body.amount,
      items: body.items,
      ts,
      sig,
    })

    return NextResponse.json({ qrData })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 })
  }
}
