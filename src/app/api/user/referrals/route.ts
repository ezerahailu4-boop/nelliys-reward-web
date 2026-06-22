import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  const { error, session } = await requireAuth()
  if (error) return error

  const userId = (session!.user as any).id

  const referrals = await prisma.user.findMany({
    where: { referredBy: userId },
    select: { id: true, name: true, tier: true, points: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const totalEarned = referrals.length * 200

  return NextResponse.json({ referrals, totalEarned, count: referrals.length })
}
