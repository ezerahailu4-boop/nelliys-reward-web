import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSMS } from '@/lib/twilio'
import { sendPushNotification } from '@/lib/firebase'

// Runs 1st of every month at 6am UTC
// vercel.json: { "path": "/api/cron/expire-points", "schedule": "0 6 1 * *" }

const EXPIRY_MONTHS = 12   // points expire after 12 months of inactivity
const WARN_DAYS = 30       // warn users 30 days before expiry

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const expiryThreshold = new Date(now)
  expiryThreshold.setMonth(expiryThreshold.getMonth() - EXPIRY_MONTHS)

  const warnThreshold = new Date(now)
  warnThreshold.setDate(warnThreshold.getDate() + WARN_DAYS)

  // Find users with no activity in EXPIRY_MONTHS
  const inactiveUsers = await prisma.user.findMany({
    where: {
      points: { gt: 0 },
      isActive: true,
      transactions: {
        none: { createdAt: { gte: expiryThreshold } },
      },
    },
    select: { id: true, name: true, phone: true, points: true, fcmToken: true },
  })

  let expired = 0
  let warned = 0

  for (const user of inactiveUsers) {
    // Expire their points
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { points: 0 } }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'expired',
          amount: -user.points,
          description: `${user.points} points expired due to 12 months of inactivity`,
        },
      }),
      prisma.notification.create({
        data: {
          userId: user.id,
          type: 'expiry',
          title: '⏰ Points Expired',
          message: `Your ${user.points} points have expired due to inactivity. Visit us to start earning again!`,
        },
      }),
    ])

    sendSMS(user.phone, `Nelliy's Rewards: Your ${user.points} points have expired due to 12 months of inactivity. Visit us to earn more! ☕`).catch(() => {})
    if (user.fcmToken) {
      sendPushNotification(user.fcmToken, '⏰ Points Expired', `Your ${user.points} points expired. Come back and earn more!`, { type: 'expiry' }).catch(() => {})
    }
    expired++
  }

  // Warn users whose points will expire in 30 days
  const soonToExpire = await prisma.user.findMany({
    where: {
      points: { gt: 0 },
      isActive: true,
      transactions: {
        none: { createdAt: { gte: new Date(now.getTime() - (EXPIRY_MONTHS - 1) * 30 * 24 * 60 * 60 * 1000) } },
      },
    },
    select: { id: true, name: true, phone: true, points: true, fcmToken: true },
  })

  for (const user of soonToExpire) {
    const alreadyWarned = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: 'expiry_warning',
        createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
    })
    if (alreadyWarned) continue

    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'expiry_warning',
        title: '⚠️ Points Expiring Soon',
        message: `Your ${user.points} points will expire in 30 days. Visit Nelliy's Coffee to keep them!`,
      },
    })

    sendSMS(user.phone, `Nelliy's Rewards: ⚠️ Your ${user.points} points expire in 30 days! Visit us to keep earning. ☕`).catch(() => {})
    if (user.fcmToken) {
      sendPushNotification(user.fcmToken, '⚠️ Points Expiring Soon', `Your ${user.points} points expire in 30 days!`, { type: 'expiry_warning' }).catch(() => {})
    }
    warned++
  }

  return NextResponse.json({ expired, warned, date: now.toISOString().split('T')[0] })
}
