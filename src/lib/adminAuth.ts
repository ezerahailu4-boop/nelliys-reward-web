import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export function requireAdminToken(req: NextRequest): { error: NextResponse | null } {
  const token = req.headers.get('x-admin-token')
  const secret = process.env.ADMIN_SECRET

  if (!secret) {
    return { error: NextResponse.json({ error: 'Server misconfigured' }, { status: 500 }) }
  }

  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  // Timing-safe comparison to prevent timing attacks
  const tokenBuf = Buffer.from(token)
  const secretBuf = Buffer.from(secret)
  const match =
    tokenBuf.length === secretBuf.length &&
    crypto.timingSafeEqual(tokenBuf, secretBuf)

  if (!match) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { error: null }
}
