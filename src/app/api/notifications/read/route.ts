import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth()
  if (error) return error

  const userId = (session!.user as any).id
  const { id } = await req.json().catch(() => ({}))

  if (id) {
    await prisma.notification.updateMany({ where: { id, userId }, data: { isSent: true, sentAt: new Date() } })
  } else {
    // Mark all as read
    await prisma.notification.updateMany({ where: { userId, isSent: false }, data: { isSent: true, sentAt: new Date() } })
  }

  return NextResponse.json({ success: true })
}
