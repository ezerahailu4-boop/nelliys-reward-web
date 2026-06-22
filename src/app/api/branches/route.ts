import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true, address: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ branches })
}
