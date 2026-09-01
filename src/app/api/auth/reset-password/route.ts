import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sendSMS } from '@/lib/sms'
import { sendPasswordResetEmail } from '@/lib/email'
import { toE164, isValidE164 } from '@/lib/phone'
import { verifyFirebaseToken } from '@/lib/firebase'
import { rateLimit } from '@/lib/rateLimit'

const requestSchema = z.object({
  identifier: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
})

const resetSchema = z.object({
  identifier: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  code: z.string().length(6).optional(),
  firebaseToken: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// POST /api/auth/reset-password  — request reset code (via Email or Phone)
// PATCH /api/auth/reset-password — verify code + set new password

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
    if (!rateLimit(`reset-post:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many reset requests. Please try again later.' }, { status: 429 })
    }

    const body = await req.json()
    const { identifier, email: directEmail, phone: directPhone } = requestSchema.parse(body)

    const rawInput = (directEmail || directPhone || identifier || '').trim()
    if (!rawInput) {
      return NextResponse.json({ error: 'Email or phone number is required' }, { status: 400 })
    }

    const isEmail = rawInput.includes('@')
    let user = null
    let key = ''
    let resetType: 'email' | 'phone' = 'phone'

    if (isEmail) {
      const email = rawInput.toLowerCase()
      resetType = 'email'
      key = `reset_email_${email}`
      user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      })

      if (user && user.email) {
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 min
        await prisma.settings.upsert({
          where: { key },
          update: { value: { code, expires: expires.toISOString(), userId: user.id } },
          create: { key, value: { code, expires: expires.toISOString(), userId: user.id } },
        })

        // Dispatch Email
        sendPasswordResetEmail(user.email, user.name, code).catch((err) =>
          console.error('[reset-password] Email send failed:', err)
        )
      }
    } else {
      const phone = toE164(rawInput)
      resetType = 'phone'
      key = `reset_phone_${phone}`

      if (isValidE164(phone)) {
        user = await prisma.user.findFirst({
          where: { phone },
        })

        if (user) {
          const code = Math.floor(100000 + Math.random() * 900000).toString()
          const expires = new Date(Date.now() + 15 * 60 * 1000) // 15 min
          await prisma.settings.upsert({
            where: { key },
            update: { value: { code, expires: expires.toISOString(), userId: user.id } },
            create: { key, value: { code, expires: expires.toISOString(), userId: user.id } },
          })

          const smsMsg = `Your Nelliy's password reset code is: ${code}. Valid for 15 minutes.`
          sendSMS(phone, smsMsg).then((r) => {
            if (!r.success) console.error('[reset-password] SMS send failed:', r.error)
          }).catch((err) => console.error('[reset-password] SMS send error:', err))
        }
      }
    }

    // Always return success message to prevent user enumeration
    return NextResponse.json({
      message: `If an account exists with this ${resetType}, a 6-digit verification code has been sent.`,
      method: resetType,
    })
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ error: err.errors[0]?.message || 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to process password reset' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
    if (!rateLimit(`reset-patch:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 })
    }

    const body = await req.json()
    const { identifier, email: directEmail, phone: directPhone, code, firebaseToken, password } =
      resetSchema.parse(body)

    const rawInput = (directEmail || directPhone || identifier || '').trim()
    const isEmail = rawInput.includes('@')
    let user = null
    let key = ''

    if (isEmail) {
      const email = rawInput.toLowerCase()
      key = `reset_email_${email}`
      user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      })
    } else if (rawInput) {
      const phone = toE164(rawInput)
      key = `reset_phone_${phone}`
      user = await prisma.user.findFirst({
        where: { phone },
      })
    }

    let verified = false

    // 1. Verify via Firebase Token (if Phone Auth OTP was used client-side)
    if (firebaseToken) {
      const decoded = await verifyFirebaseToken(firebaseToken)
      if (decoded) {
        if (!user && decoded.phone_number) {
          user = await prisma.user.findFirst({ where: { phone: decoded.phone_number } })
        }
        if (user) verified = true
      }
    }

    // 2. Verify via 6-digit code stored in Supabase Settings table
    if (!verified && code && key) {
      const record = await prisma.settings.findUnique({ where: { key } })
      if (record && record.value) {
        const { code: savedCode, expires } = record.value as any
        if (savedCode === code && new Date(expires) >= new Date()) {
          verified = true
          // Cleanup used reset code
          await prisma.settings.delete({ where: { key } }).catch(() => {})
        }
      }
    }

    if (!verified || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code. Please request a new one.' },
        { status: 400 }
      )
    }

    // Hash new password securely
    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    console.log(`[reset-password] Password successfully updated for user ${user.id} (${user.email || user.phone})`)
    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully. You can now sign in with your new password.',
    })
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ error: err.errors[0]?.message || 'Invalid input' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}

