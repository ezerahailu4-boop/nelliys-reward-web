import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { rateLimit } from '@/lib/rateLimit'
import { z } from 'zod'

const REVIEW_POINTS = 50
const GOOGLE_MAPS_URL = 'https://www.google.com/maps/place/Nelliy%27s+Coffee/@9.0012867,38.7672743'

const schema = z.object({
  googleUsername: z.string().min(2, 'Please enter your Google display name'),
})

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
  if (!rateLimit(ip, 3, 24 * 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Review bonus already claimed or too many attempts.' }, { status: 429 })
  }

  try {
    const { googleUsername } = schema.parse(await req.json())
    const userId = (session!.user as any).id

    // Check if user already claimed review points
    const alreadyClaimed = await prisma.transaction.findFirst({
      where: { userId, reference: 'google-review' },
    })
    if (alreadyClaimed) {
      return NextResponse.json({ error: 'You have already claimed your Google review bonus' }, { status: 409 })
    }

    // Award points
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { points: { increment: REVIEW_POINTS } },
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'bonus',
          amount: REVIEW_POINTS,
          description: `Google review bonus — @${googleUsername}`,
          reference: 'google-review',
        },
      }),
    ])

    return NextResponse.json({ points: REVIEW_POINTS, message: `+${REVIEW_POINTS} points added for your Google review!` })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: err.errors[0]?.message }, { status: 400 })
    return NextResponse.json({ error: 'Failed to claim review bonus' }, { status: 500 })
  }
}
