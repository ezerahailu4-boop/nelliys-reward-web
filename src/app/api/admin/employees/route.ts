import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminToken } from '@/lib/adminAuth'

export async function GET(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  const employees = await prisma.employeeStats.findMany({
    include: {
      user: { select: { id: true, name: true, phone: true, email: true, isActive: true, createdAt: true } },
      branch: { select: { id: true, name: true } },
      attendance: { orderBy: { date: 'desc' }, take: 30 },
    },
    orderBy: { totalSales: 'desc' },
  })
  return NextResponse.json({ employees })
}
