import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const userId = (session!.user as any).id
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 20
  const skip = (page - 1) * limit

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.notification.count({ where: { userId } }),
  ])

  const unread = await prisma.notification.count({ where: { userId, isSent: false } })

  return NextResponse.json({ notifications, unread, total, page, pages: Math.ceil(total / limit) })
}
