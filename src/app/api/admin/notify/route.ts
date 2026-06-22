import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminToken } from '@/lib/adminAuth'
import { sendSMS } from '@/lib/textbee'
import { sendPushToMany } from '@/lib/firebase'
import { z } from 'zod'

const VALID_TIERS = ['BRONZE', 'SILVER', 'GOLD', 'VIP', 'ALL'] as const

const schema = z.object({
  title: z.string().min(2).max(100),
  message: z.string().min(5).max(500),
  targetTier: z.enum(VALID_TIERS).optional(),
  channels: z.array(z.enum(['sms', 'inapp', 'push'])).min(1),
})

export async function POST(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error

  try {
    const body = schema.parse(await req.json())
    const { title, message, targetTier, channels } = body

    const where: any = { role: 'CUSTOMER', isActive: true }
    if (targetTier && targetTier !== 'ALL') where.tier = targetTier

    const users = await prisma.user.findMany({
      where,
      select: { id: true, phone: true, name: true, fcmToken: true },
    })

    if (users.length === 0) return NextResponse.json({ error: 'No users match the target' }, { status: 400 })

    let smsSent = 0, inAppSent = 0, pushSent = 0
    const errors: string[] = []

    if (channels.includes('inapp')) {
      await prisma.notification.createMany({
        data: users.map(u => ({ userId: u.id, type: 'campaign', title, message, isSent: false })),
      })
      inAppSent = users.length
    }

    if (channels.includes('sms')) {
      const BATCH = 10
      for (let i = 0; i < users.length; i += BATCH) {
        const phones = users.slice(i, i + BATCH).map(u => u.phone)
        try {
          const result = await sendSMS(phones, message)
          if (result.success) smsSent += phones.length
          else errors.push(`Batch ${i / BATCH + 1} failed`)
        } catch { errors.push(`Batch ${i / BATCH + 1} error`) }
        if (i + BATCH < users.length) await new Promise(r => setTimeout(r, 500))
      }
    }

    if (channels.includes('push')) {
      const tokens = users.map((u: any) => u.fcmToken).filter(Boolean) as string[]
      if (tokens.length > 0) {
        const result = await sendPushToMany(tokens, title, message)
        pushSent = result.success
        if (result.failed > 0) errors.push(`${result.failed} push notifications failed`)
      }
    }

    return NextResponse.json({ success: true, totalUsers: users.length, smsSent, inAppSent, pushSent, errors: errors.length > 0 ? errors : undefined })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error

  const [total, unread, byType] = await Promise.all([
    prisma.notification.count(),
    prisma.notification.count({ where: { isSent: false } }),
    prisma.notification.groupBy({ by: ['type'], _count: true }),
  ])

  return NextResponse.json({ total, unread, byType })
}
