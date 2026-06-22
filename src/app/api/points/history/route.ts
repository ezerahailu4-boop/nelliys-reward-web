import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: (session!.user as any).id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where: { userId: (session!.user as any).id } }),
  ])

  return NextResponse.json({ transactions, total, page, pages: Math.ceil(total / limit) })
}
