import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { NextResponse } from 'next/server'
import { TIER_THRESHOLDS, POINTS_PER_ETB } from '@/lib/constants'

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
  }
  return { error: null, session }
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), session: null }
  }
  const role = (session.user as any).role
  if (!['ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), session: null }
  }
  return { error: null, session }
}

export function calcPoints(amount: number) {
  return Math.floor(amount / POINTS_PER_ETB)
}

export function calcTier(points: number) {
  if (points >= TIER_THRESHOLDS.VIP) return 'VIP'
  if (points >= TIER_THRESHOLDS.GOLD) return 'GOLD'
  if (points >= TIER_THRESHOLDS.SILVER) return 'SILVER'
  return 'BRONZE'
}

export function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
