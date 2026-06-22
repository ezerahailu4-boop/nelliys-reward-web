import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'
import { LANGUAGES } from '@/lib/constants'

const patchSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  birthday: z.string().datetime({ offset: true }).optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  language: z.enum(['en', 'am', 'or']).optional(),
  avatar: z.string().url().max(500).optional(),
  fcmToken: z.string().max(500).optional(),
})

export async function GET() {
  const { error, session } = await requireAuth()
  if (error) return error
  const user = await prisma.user.findUnique({
    where: { id: (session!.user as any).id },
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, tier: true, points: true, totalSpent: true,
      referralCode: true, birthday: true, language: true,
      avatar: true, isVerified: true, createdAt: true,
    },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ user })
}

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  try {
    const contentType = req.headers.get('content-type') || ''
    let body: z.infer<typeof patchSchema> = {}
    let avatarBase64: string | undefined

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const raw: any = {}
      for (const key of ['name', 'birthday', 'language', 'fcmToken']) {
        const val = formData.get(key)
        if (val && typeof val === 'string') raw[key] = val
      }
      body = patchSchema.parse(raw)
      const file = formData.get('avatar')
      if (file && typeof file !== 'string') {
        const bytes = await file.arrayBuffer()
        avatarBase64 = `data:${(file as File).type || 'image/jpeg'};base64,${Buffer.from(bytes).toString('base64')}`
      }
    } else {
      body = patchSchema.parse(await req.json())
    }

    const user = await prisma.user.update({
      where: { id: (session!.user as any).id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.birthday && { birthday: new Date(body.birthday) }),
        ...(body.language && { language: body.language }),
        ...(body.avatar && { avatar: body.avatar }),
        ...(avatarBase64 && { avatar: avatarBase64 }),
        ...(body.fcmToken && { fcmToken: body.fcmToken }),
      },
      select: { id: true, name: true, email: true, phone: true, tier: true, points: true, language: true, avatar: true },
    })
    return NextResponse.json({ user })
  } catch (err: any) {
    if (err.name === 'ZodError') return NextResponse.json({ error: err.errors[0]?.message || 'Invalid input' }, { status: 400 })
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
