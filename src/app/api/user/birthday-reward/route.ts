import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { sendSMS, smsTemplates } from '@/lib/textbee'

export async function POST() {
  const { error, session } = await requireAuth()
  if (error) return error

  const userId = (session!.user as any).id
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user?.birthday) return NextResponse.json({ error: 'No birthday set. Add it in Settings.' }, { status: 400 })

  const today = new Date()
  const bday = new Date(user.birthday)
  const isBirthday = today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate()
  if (!isBirthday) return NextResponse.json({ error: 'Today is not your birthday!' }, { status: 400 })

  // Check if already claimed this year
  const thisYear = today.getFullYear()
  const alreadyClaimed = await prisma.transaction.findFirst({
    where: {
      userId,
      type: 'bonus',
      description: { contains: 'Birthday' },
      createdAt: { gte: new Date(`${thisYear}-01-01`), lte: new Date(`${thisYear}-12-31`) },
    },
  })
  if (alreadyClaimed) return NextResponse.json({ error: 'Birthday reward already claimed this year!' }, { status: 400 })

  const BIRTHDAY_POINTS = 150
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { points: { increment: BIRTHDAY_POINTS } } }),
    prisma.transaction.create({ data: { userId, type: 'bonus', amount: BIRTHDAY_POINTS, description: `🎂 Birthday Bonus — Happy Birthday ${user.name}!` } }),
  ])

  sendSMS(user.phone, smsTemplates.birthday(user.name, BIRTHDAY_POINTS)).catch(() => {})

  return NextResponse.json({ message: `🎂 Happy Birthday ${user.name}! ${BIRTHDAY_POINTS} bonus points added!`, points: BIRTHDAY_POINTS })
}
