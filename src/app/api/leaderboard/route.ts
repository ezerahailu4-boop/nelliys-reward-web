import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  const { error, session } = await requireAuth()
  if (error) return error

  const top = await prisma.user.findMany({
    where: { role: 'CUSTOMER', isActive: true },
    orderBy: { points: 'desc' },
    take: 10,
    select: { id: true, name: true, points: true, tier: true, avatar: true },
  })

  const currentUserId = (session!.user as any).id
  const userRank = await prisma.user.count({
    where: { role: 'CUSTOMER', isActive: true, points: { gt: (await prisma.user.findUnique({ where: { id: currentUserId }, select: { points: true } }))?.points ?? 0 } },
  })

  return NextResponse.json({ leaderboard: top, userRank: userRank + 1 })
}
