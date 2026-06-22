import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { generateReferralCode } from '@/lib/auth'
import { sendSMS, smsTemplates } from '@/lib/textbee'
import { sendWelcomeEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rateLimit'
import { WELCOME_BONUS, REFERRAL_BONUS } from '@/lib/constants'
import { notifyReferral } from '@/lib/notifications'

const schema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(9).max(15),
  password: z.string().min(8).max(72),
  referralCode: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!rateLimit(ip, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const existing = await prisma.user.findFirst({
      where: { OR: [{ phone: data.phone }, ...(data.email ? [{ email: data.email }] : [])] },
    })
    if (existing) return NextResponse.json({ error: 'Account already exists with this phone or email' }, { status: 409 })

    let referredById: string | undefined
    if (data.referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: data.referralCode } })
      if (referrer) referredById = referrer.id
    }

    const hashed = await bcrypt.hash(data.password, 12)
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        password: hashed,
        referralCode: generateReferralCode(),
        referredBy: referredById,
        points: WELCOME_BONUS,
      },
      select: { id: true, name: true, email: true, phone: true, tier: true, points: true },
    })

    await prisma.transaction.create({
      data: { userId: user.id, type: 'bonus', amount: WELCOME_BONUS, description: 'Welcome bonus' },
    })
    await prisma.notification.create({
      data: { userId: user.id, type: 'welcome', title: `Welcome to Nelliy's! ☕`, message: `You have ${WELCOME_BONUS} welcome points. Start earning more today!` },
    })

    if (referredById) {
      await prisma.$transaction([
        prisma.user.update({ where: { id: referredById }, data: { points: { increment: REFERRAL_BONUS } } }),
        prisma.transaction.create({
          data: { userId: referredById, type: 'bonus', amount: REFERRAL_BONUS, description: `Referral bonus — invited ${user.name}` },
        }),
        prisma.notification.create({
          data: { userId: referredById, type: 'referral', title: '🎉 Referral Bonus!', message: `${user.name} joined using your code! You earned ${REFERRAL_BONUS} bonus points.` },
        }),
      ])
      notifyReferral(referredById, user.name).catch(() => {})
    }

    // Send welcome SMS + email (non-blocking)
    sendSMS(user.phone, smsTemplates.welcome(user.name, user.points)).catch(() => {})
    if (user.email) sendWelcomeEmail(user.email, user.name, user.points).catch(() => {})

    return NextResponse.json({ user }, { status: 201 })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: err.errors[0]?.message || 'Validation error' }, { status: 400 })
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
