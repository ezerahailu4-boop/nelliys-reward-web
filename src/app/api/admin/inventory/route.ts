import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminToken } from '@/lib/adminAuth'
import { z } from 'zod'

const patchSchema = z.object({
  id: z.string().cuid(),
  quantity: z.number().int().min(0).max(999999),
  lowStockThreshold: z.number().int().min(0).max(999999).optional(),
})

export async function GET(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  const inventory = await prisma.inventory.findMany({
    include: {
      product: { select: { id: true, name: true, category: true, price: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { quantity: 'asc' },
  })
  return NextResponse.json({ inventory })
}

export async function PATCH(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  try {
    const { id, quantity, lowStockThreshold } = patchSchema.parse(await req.json())
    const updated = await prisma.inventory.update({
      where: { id },
      data: { quantity, ...(lowStockThreshold !== undefined && { lowStockThreshold }) },
      include: { product: { select: { name: true } }, branch: { select: { name: true } } },
    })
    return NextResponse.json({ inventory: updated })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}
