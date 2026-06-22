import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminToken } from '@/lib/adminAuth'
import { z } from 'zod'

const postSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(1).max(200),
  phone: z.string().min(1).max(20),
  openingTime: z.string().max(10),
  closingTime: z.string().max(10),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

const patchSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(100).optional(),
  address: z.string().min(1).max(200).optional(),
  phone: z.string().min(1).max(20).optional(),
  openingTime: z.string().max(10).optional(),
  closingTime: z.string().max(10).optional(),
  isActive: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  const branches = await prisma.branch.findMany({
    include: { _count: { select: { orders: true, receipts: true, employees: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ branches })
}

export async function POST(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  try {
    const data = postSchema.parse(await req.json())
    const branch = await prisma.branch.create({
      data: { ...data, qrCode: `branch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
    })
    return NextResponse.json({ branch })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  try {
    const { id, ...data } = patchSchema.parse(await req.json())
    const branch = await prisma.branch.update({ where: { id }, data })
    return NextResponse.json({ branch })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 })
  }
}
