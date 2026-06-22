import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  const { error, session } = await requireAuth()
  if (error) return error

  const user = await prisma.user.findUnique({
    where: { id: (session!.user as any).id },
    select: { points: true, tier: true },
  })

  const rewards = await prisma.reward.findMany({
    where: { userId: (session!.user as any).id, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  })

  const catalog = [
    { id: 'free-espresso',   title: 'Free Espresso',         pointsCost: 100,  value: 80,   emoji: '☕', category: 'drink' },
    { id: 'free-cappuccino', title: 'Free Cappuccino',        pointsCost: 150,  value: 120,  emoji: '🥛', category: 'drink' },
    { id: 'free-latte',      title: 'Free Latte',             pointsCost: 180,  value: 150,  emoji: '🍵', category: 'drink' },
    { id: 'free-croissant',  title: 'Free Croissant',         pointsCost: 120,  value: 100,  emoji: '🥐', category: 'food' },
    { id: 'free-cake',       title: 'Free Slice of Cake',     pointsCost: 250,  value: 200,  emoji: '🎂', category: 'food' },
    { id: 'discount-20',     title: '20% Off Next Order',     pointsCost: 300,  value: 0,    emoji: '🏷️', category: 'discount' },
    { id: 'discount-50',     title: '50% Off Next Order',     pointsCost: 600,  value: 0,    emoji: '🎫', category: 'discount' },
    { id: 'gift-card-100',   title: '100 ETB Gift Card',      pointsCost: 800,  value: 100,  emoji: '🎁', category: 'gift' },
    { id: 'gift-card-200',   title: '200 ETB Gift Card',      pointsCost: 1500, value: 200,  emoji: '💝', category: 'gift' },
    { id: 'gift-card-500',   title: '500 ETB Gift Card',      pointsCost: 3500, value: 500,  emoji: '🎀', category: 'gift' },
    { id: 'sub-weekly',      title: 'Weekly Coffee Pass',     pointsCost: 500,  value: 560,  emoji: '📅', category: 'subscription', description: '1 coffee/day for 7 days' },
    { id: 'sub-monthly',     title: 'Monthly Coffee Pass',    pointsCost: 1800, value: 2400, emoji: '🗓️', category: 'subscription', description: '1 coffee/day for 30 days' },
    { id: 'vip-upgrade',     title: 'VIP Day Pass',           pointsCost: 1000, value: 500,  emoji: '👑', category: 'vip' },
  ]

  return NextResponse.json({ rewards, catalog, userPoints: user?.points || 0 })
}
