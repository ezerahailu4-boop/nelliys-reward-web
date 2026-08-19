import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sendSMS } from '@/lib/sms'
import { toE164 } from '@/lib/phone'
import { verifyFirebaseToken } from '@/lib/firebase'

const requestSchema = z.object({ phone: z.string().min(9) })
const resetSchema = z.object({ 
  phone: z.string().min(9), 
  code: z.string().length(6).optional(), 
  firebaseToken: z.string().optional(),
  password: z.string().min(6) 
})

// POST /api/auth/reset-password  — request code
// PATCH /api/auth/reset-password — verify code + set new password

export async function POST(req: NextRequest) {
  try {
    const { phone: rawPhone } = requestSchema.parse(await req.json())
    const phone = toE164(rawPhone)
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
      const result = await sendSMS(phone, `Your Nelliy's password reset code is: ${code}. Valid for 15 minutes.`)
      if (!result.success) {
        console.error('[reset-password] Failed to send reset SMS:', result.error)
      }
    }
    return NextResponse.json({ message: 'If an account exists, a code was sent.' })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { phone: rawPhone, code, firebaseToken, password } = resetSchema.parse(await req.json())
    const phone = toE164(rawPhone)

    let verified = false

    if (firebaseToken) {
      const decoded = await verifyFirebaseToken(firebaseToken)
      if (decoded) {
        verified = true
      }
    } else if (code) {
      const record = await prisma.settings.findUnique({ where: { key: `reset_${phone}` } })
      if (record) {
        const { code: savedCode, expires } = record.value as any
        if (savedCode === code && new Date(expires) >= new Date()) {
          verified = true
          await prisma.settings.delete({ where: { key: `reset_${phone}` } })
        }
      }
    }

    if (!verified) {
      return NextResponse.json({ error: 'Invalid or expired verification' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({ where: { phone }, data: { password: hashed } })

    return NextResponse.json({ message: 'Password reset successfully' })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
