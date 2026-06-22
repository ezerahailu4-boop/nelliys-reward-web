import { NextRequest, NextResponse } from 'next/server'
import { requireAdminToken } from '@/lib/adminAuth'
import crypto from 'crypto'
import { z } from 'zod'

const RECEIPT_QR_SECRET = process.env.RECEIPT_QR_SECRET
if (!RECEIPT_QR_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('RECEIPT_QR_SECRET env var is required in production')
}
const QR_SECRET = RECEIPT_QR_SECRET || 'dev-only-secret-do-not-use-in-prod'

const schema = z.object({
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
  const { error } = requireAdminToken(req)
  if (error) return error

  try {
    const { receiptNumber, branchId, amount, items } = schema.parse(await req.json())

    const ts = Date.now()
    const payload = `${receiptNumber}:${branchId}:${amount}:${ts}`
    const sig = crypto.createHmac('sha256', QR_SECRET).update(payload).digest('hex')

    const qrData = JSON.stringify({ type: 'receipt', receiptNumber, branchId, amount, items, ts, sig })

    return NextResponse.json({ qrData })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 })
  }
}
