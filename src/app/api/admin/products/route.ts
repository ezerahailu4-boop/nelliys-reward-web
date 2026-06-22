import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminToken } from '@/lib/adminAuth'

export async function GET(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  const products = await prisma.product.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  const { name, category, price, bonusPoints, description, isAvailable } = await req.json()
  if (!name || !price) return NextResponse.json({ error: 'Name and price required' }, { status: 400 })
  const product = await prisma.product.create({
    data: { name, category: category || 'Coffee', price, bonusPoints: bonusPoints || 0, description: description || '', isAvailable: isAvailable ?? true, rewardPoints: 0, stock: 0 },
  })
  return NextResponse.json({ product }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  const { id, name, category, price, bonusPoints, description, isAvailable } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  const product = await prisma.product.update({
    where: { id },
    data: { ...(name && { name }), ...(category && { category }), ...(price && { price }), ...(bonusPoints !== undefined && { bonusPoints }), ...(description !== undefined && { description }), ...(isAvailable !== undefined && { isAvailable }) },
  })
  return NextResponse.json({ product })
}

export async function DELETE(req: NextRequest) {
  const { error } = requireAdminToken(req)
  if (error) return error
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
