import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendSMS } from '@/lib/textbee'

const schema = z.object({
  name: z.string().min(2),
  contact: z.string().min(5),
  message: z.string().min(10),
})

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json())
    // Notify admin via SMS
    const adminPhone = process.env.ADMIN_PHONE || '+251976222266'
    sendSMS(adminPhone, `New contact from ${body.name} (${body.contact}): ${body.message}`).catch(() => {})
    return NextResponse.json({ message: 'Message sent successfully' })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
