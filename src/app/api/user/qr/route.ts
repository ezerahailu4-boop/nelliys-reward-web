import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import QRCode from 'qrcode'

export async function GET() {
  const { error, session } = await requireAuth()
  if (error) return error

  const userId = (session!.user as any).id
  const payload = JSON.stringify({ userId, type: 'member', ts: Date.now() })

  const dataUrl = await QRCode.toDataURL(payload, {
    width: 300,
    margin: 2,
    color: { dark: '#78350f', light: '#fffbeb' },
  })

  return NextResponse.json({ qr: dataUrl, userId })
}
