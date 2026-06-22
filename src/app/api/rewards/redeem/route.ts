import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { sendSMS, smsTemplates } from '@/lib/textbee'
import { sendRewardRedeemedEmail } from '@/lib/email'

const catalog: Record<string, { title: string; pointsCost: number; value: number }> = {
  'free-espresso':   { title: 'Free Espresso',       pointsCost: 100,  value: 80 },
  'free-cappuccino': { title: 'Free Cappuccino',      pointsCost: 150,  value: 120 },
  'free-latte':      { title: 'Free Latte',           pointsCost: 180,  value: 150 },
  'free-croissant':  { title: 'Free Croissant',       pointsCost: 120,  value: 100 },
  'discount-20':     { title: '20% Off Next Order',   pointsCost: 300,  value: 0 },
  'discount-50':     { title: '50% Off Next Order',   pointsCost: 600,  value: 0 },
  'free-cake':       { title: 'Free Slice of Cake',   pointsCost: 250,  value: 200 },
  'gift-card-100':   { title: '100 ETB Gift Card',    pointsCost: 800,  value: 100 },
  'gift-card-200':   { title: '200 ETB Gift Card',    pointsCost: 1500, value: 200 },
  'gift-card-500':   { title: '500 ETB Gift Card',    pointsCost: 3500, value: 500 },
  'sub-weekly':      { title: 'Weekly Coffee Pass',   pointsCost: 500,  value: 560 },
  'sub-monthly':     { title: 'Monthly Coffee Pass',  pointsCost: 1800, value: 2400 },
  'vip-upgrade':     { title: 'VIP Day Pass',         pointsCost: 1000, value: 500 },
}

const schema = z.object({ rewardId: z.string() })

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  try {
    const { rewardId } = schema.parse(await req.json())
    const item = catalog[rewardId]
    if (!item) return NextResponse.json({ error: 'Invalid reward' }, { status: 404 })

    const userId = (session!.user as any).id
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { points: true, phone: true, email: true, name: true } })
    if (!user || user.points < item.pointsCost) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 })
    }

    const code = `NLY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    const [reward] = await prisma.$transaction([
      prisma.reward.create({
        data: {
          userId,
          rewardType: rewardId,
          title: item.title,
          pointsCost: item.pointsCost,
          value: item.value,
          code,
          expiresAt,
        },
      }),
      prisma.user.update({ where: { id: userId }, data: { points: { decrement: item.pointsCost } } }),
      prisma.transaction.create({
        data: { userId, type: 'redeemed', amount: -item.pointsCost, description: `Redeemed: ${item.title}`, reference: `reward:${code}` },
      }),
    ])

    // Send redemption SMS + email
    if (user?.phone) sendSMS(user.phone, smsTemplates.rewardRedeemed(item.title)).catch(() => {})
    if (user?.email) sendRewardRedeemedEmail(user.email, item.title, code).catch(() => {})

    return NextResponse.json({ reward })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    return NextResponse.json({ error: 'Redemption failed' }, { status: 500 })
  }
}
