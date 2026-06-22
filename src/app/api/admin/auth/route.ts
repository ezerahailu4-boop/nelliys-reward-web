import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { rateLimit } from '@/lib/rateLimit'

const schema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(128),
})

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    // Still run comparison to avoid timing leak on length
    crypto.timingSafeEqual(bufA, bufA)
    return false
  }
  return crypto.timingSafeEqual(bufA, bufB)
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  if (!rateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  }

  try {
    const { username, password } = schema.parse(await req.json())

    const validUser = process.env.ADMIN_USERNAME
    const validPass = process.env.ADMIN_PASSWORD
    const secret = process.env.ADMIN_SECRET

    if (!validUser || !validPass || !secret) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    const userMatch = timingSafeEqual(username, validUser)
    const passMatch = timingSafeEqual(password, validPass)

    if (userMatch && passMatch) {
      return NextResponse.json({ success: true, token: secret })
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
}
