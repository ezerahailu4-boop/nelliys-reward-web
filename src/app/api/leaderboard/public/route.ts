import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const leaderboard = await prisma.user.findMany({
      where: { role: 'CUSTOMER', isActive: true },
      orderBy: { points: 'desc' },
      take: 10,
      select: { id: true, name: true, points: true, tier: true },
    })
    return NextResponse.json({ leaderboard })
  } catch {
    return NextResponse.json({ leaderboard: [] })
  }
}
