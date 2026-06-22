import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendSMS, smsTemplates } from '@/lib/textbee'
import { sendBirthdayEmail } from '@/lib/email'
import { sendPushNotification } from '@/lib/firebase'
import { BIRTHDAY_BONUS } from '@/lib/constants'

// Vercel Cron: runs daily at 5am UTC (8am Addis Ababa)
// vercel.json: { "crons": [{ "path": "/api/cron/birthday", "schedule": "0 5 * * *" }] }

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()
  const year = today.getFullYear()

  const users = await prisma.user.findMany({
    where: { birthday: { not: null }, isActive: true },
    select: { id: true, name: true, phone: true, email: true, fcmToken: true, birthday: true },
  })

  const birthdayUsers = users.filter(u => {
    if (!u.birthday) return false
    const b = new Date(u.birthday)
    return b.getMonth() + 1 === month && b.getDate() === day
  })

  let awarded = 0

  for (const user of birthdayUsers) {
    const alreadyClaimed = await prisma.transaction.findFirst({
      where: {
        userId: user.id,
        type: 'bonus',
        description: { contains: 'Birthday' },
        createdAt: { gte: new Date(`${year}-01-01`) },
      },
    })
    if (alreadyClaimed) continue

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { points: { increment: BIRTHDAY_BONUS } } }),
      prisma.transaction.create({
        data: { userId: user.id, type: 'bonus', amount: BIRTHDAY_BONUS, description: `🎂 Birthday Bonus — Happy Birthday ${user.name}!` },
      }),
      prisma.notification.create({
        data: { userId: user.id, type: 'birthday', title: `🎂 Happy Birthday ${user.name}!`, message: `You got ${BIRTHDAY_BONUS} bonus points as a birthday gift from Nelliy's Coffee!` },
      }),
    ])

    sendSMS(user.phone, smsTemplates.birthday(user.name, BIRTHDAY_BONUS)).catch(() => {})
    if (user.email) sendBirthdayEmail(user.email, user.name, BIRTHDAY_BONUS).catch(() => {})
    if (user.fcmToken) {
      sendPushNotification(user.fcmToken, `🎂 Happy Birthday ${user.name}!`, `You got ${BIRTHDAY_BONUS} bonus points!`, { type: 'birthday' }).catch(() => {})
    }
    awarded++
  }

  return NextResponse.json({ awarded, date: today.toISOString().split('T')[0] })
}
