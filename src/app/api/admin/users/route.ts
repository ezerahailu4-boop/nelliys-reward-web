import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminToken } from '@/lib/adminAuth'

export async function GET(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  // Sanitize search: strip special regex/SQL chars, limit length
  const rawSearch = searchParams.get('search') || ''
  const search = rawSearch.replace(/[^a-zA-Z0-9@.+\-_ ]/g, '').slice(0, 100)
  const limit = 20

  const where = search
    ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { phone: { contains: search } }, { email: { contains: search } }] }
    : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, phone: true, tier: true, points: true, totalSpent: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({ users, total, pages: Math.ceil(total / limit) })
}
