import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/textbee';

export async function POST(req: NextRequest) {
  const { phone, message } = await req.json();

  if (!phone || !message)
    return NextResponse.json({ error: 'Phone and message required' }, { status: 400 });

  if (!process.env.TEXTBEE_DEVICE_ID)
    return NextResponse.json({ error: 'Textbee device not configured' }, { status: 503 });

  const result = await sendSMS(phone, message);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
