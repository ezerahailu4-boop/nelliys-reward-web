import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminToken } from '@/lib/adminAuth'
import { z } from 'zod'

const patchSchema = z.object({
  id: z.string().cuid(),
  isActive: z.boolean(),
})

const deleteSchema = z.object({
  id: z.string().cuid(),
})

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['multiplier', 'discount', 'bonus']),
  multiplier: z.number().min(1).max(10).default(1),
  discount: z.number().min(0).max(100).optional(),
  startDate: z.string(),
  endDate: z.string(),
  targetTier: z.string().max(20).optional(),
})

export async function GET(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  const campaigns = await prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ campaigns })
}

export async function POST(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  try {
    const body = createSchema.parse(await req.json())
    const campaign = await prisma.campaign.create({
      data: { ...body, startDate: new Date(body.startDate), endDate: new Date(body.endDate) },
    })
    return NextResponse.json({ campaign }, { status: 201 })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  try {
    const { id, isActive } = patchSchema.parse(await req.json())
    const campaign = await prisma.campaign.update({ where: { id }, data: { isActive } })
    return NextResponse.json({ campaign })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  try {
    const { id } = deleteSchema.parse(await req.json())
    await prisma.campaign.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
