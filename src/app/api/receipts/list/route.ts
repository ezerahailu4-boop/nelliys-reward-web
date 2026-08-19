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

  try {
    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where: { userId },
        include: {
          branch: {
            select: { name: true, address: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.receipt.count({ where: { userId } }),
    ])

    return NextResponse.json({
      receipts,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (err) {
    console.error('Error fetching receipts list:', err)
    return NextResponse.json({ error: 'Failed to fetch receipts' }, { status: 500 })
  }
}
