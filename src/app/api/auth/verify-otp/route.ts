import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/sms'
import { rateLimit } from '@/lib/rateLimit'
import { z } from 'zod'
import { OTP_EXPIRY_MS, OTP_LENGTH } from '@/lib/constants'
import { toE164, isValidE164 } from '@/lib/phone'

const sendSchema = z.object({ phone: z.string().min(9).max(15) })
const verifySchema = z.object({ phone: z.string().min(9).max(15), code: z.string().length(OTP_LENGTH) })

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST — send OTP
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  if (!rateLimit(`otp:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Try again in 10 minutes.' }, { status: 429 })
  }

  try {
    const { phone: rawPhone } = sendSchema.parse(await req.json())
    const phone = toE164(rawPhone)
    if (!isValidE164(phone)) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
    }
    const code = generateOtp()
    const expires = new Date(Date.now() + OTP_EXPIRY_MS).toISOString()

    await prisma.settings.upsert({
      where: { key: `otp:${phone}` },
      update: { value: { code, expires } },
      create: { key: `otp:${phone}`, value: { code, expires } },
    })

    const result = await sendSMS(phone, `Your Nelliy's verification code is: ${code}. Valid for 10 minutes. Do not share this code.`)

    if (!result.success) {
      console.error('[verify-otp] Failed to send OTP SMS:', result.error)
      return NextResponse.json(
        { error: 'Could not send verification code. Please check the phone number and try again.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ message: 'OTP sent successfully' })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

// PATCH — verify OTP
export async function PATCH(req: NextRequest) {
  try {
    const { phone: rawPhone, code } = verifySchema.parse(await req.json())
    const phone = toE164(rawPhone)
    const record = await prisma.settings.findUnique({ where: { key: `otp:${phone}` } })

    if (!record) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })

    const { code: savedCode, expires } = record.value as any
    if (savedCode !== code || new Date(expires) < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    // Mark phone as verified on user if exists
    await prisma.user.updateMany({ where: { phone }, data: { isVerified: true } })
    await prisma.settings.delete({ where: { key: `otp:${phone}` } })

    return NextResponse.json({ verified: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
