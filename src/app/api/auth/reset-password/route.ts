import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sendSMS } from '@/lib/textbee'

const requestSchema = z.object({ phone: z.string().min(9) })
const resetSchema = z.object({ phone: z.string().min(9), code: z.string().length(6), password: z.string().min(6) })

// POST /api/auth/reset-password  — request code
// PATCH /api/auth/reset-password — verify code + set new password

export async function POST(req: NextRequest) {
  try {
    const { phone } = requestSchema.parse(await req.json())
    const user = await prisma.user.findUnique({ where: { phone } })
    // Always return 200 to avoid user enumeration
    if (user) {
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 min
      await prisma.settings.upsert({
        where: { key: `reset_${phone}` },
        update: { value: { code, expires: expires.toISOString() } },
        create: { key: `reset_${phone}`, value: { code, expires: expires.toISOString() } },
      })
      sendSMS(phone, `Your Nelliy's password reset code is: ${code}. Valid for 15 minutes.`).catch(() => {})
    }
    return NextResponse.json({ message: 'If an account exists, a code was sent.' })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { phone, code, password } = resetSchema.parse(await req.json())
    const record = await prisma.settings.findUnique({ where: { key: `reset_${phone}` } })
    if (!record) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })

    const { code: savedCode, expires } = record.value as any
    if (savedCode !== code || new Date(expires) < new Date())
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })

    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({ where: { phone }, data: { password: hashed } })
    await prisma.settings.delete({ where: { key: `reset_${phone}` } })

    return NextResponse.json({ message: 'Password reset successfully' })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
