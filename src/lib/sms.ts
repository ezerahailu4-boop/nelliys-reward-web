import { toE164, isValidE164 } from '@/lib/phone'

export const smsTemplates = {
  welcome: (name: string, points: number) =>
    `Welcome to Nelliy's Rewards, ${name}! ☕ You have ${points} points. Start earning more today!`,

  pointsEarned: (points: number, total: number) =>
    `Nelliy's Rewards: You earned ${points} points! Total: ${total} pts. Keep sipping! ☕`,

  rewardRedeemed: (reward: string) =>
    `Nelliy's Rewards: Your "${reward}" has been redeemed! Enjoy ☕`,

  tierUpgrade: (tier: string) =>
    `Congrats! You've been upgraded to ${tier} tier at Nelliy's Rewards! ☕🎉`,

  birthday: (name: string, points: number) =>
    `Happy Birthday ${name}! 🎂☕ We added ${points} bonus points to your Nelliy's Rewards account!`,

  campaign: (message: string) =>
    `Nelliy's Rewards: ${message} ☕`,
}

const TEXTBEE_API_KEY = process.env.TEXTBEE_API_KEY
const TEXTBEE_DEVICE_ID = process.env.TEXTBEE_DEVICE_ID
const TEXTBEE_BASE_URL = 'https://api.textbee.dev/api/v1/gateway'

type SendSMSResult = {
  success: boolean
  data: any
  error?: string
}

/**
 * Sends an SMS via TextBee (textbee.dev) — an Android phone acting as an
 * SMS gateway over its own SIM. Chosen over Twilio/Africa's Talking because
 * neither has a reliable direct route into Ethiopian carriers; TextBee sends
 * as a normal local text from a real Ethiopian SIM instead of international
 * carrier-to-carrier routing.
 */
export async function sendSMS(recipients: string | string[], message: string): Promise<SendSMSResult> {
  if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) {
    const err = 'TextBee credentials are not set (TEXTBEE_API_KEY / TEXTBEE_DEVICE_ID)'
    console.error('[textbee]', err)
    return { success: false, data: null, error: err }
  }

  const rawList = Array.isArray(recipients) ? recipients : [recipients]
  if (rawList.length === 0) {
    return { success: false, data: null, error: 'No recipients provided' }
  }

  const normalized: string[] = []
  for (const raw of rawList) {
    const e164 = toE164(raw)
    if (!isValidE164(e164)) {
      const err = `Invalid phone number after normalization: "${raw}" -> "${e164}"`
      console.error('[textbee]', err)
      return { success: false, data: null, error: err }
    }
    normalized.push(e164)
  }

  const url = `${TEXTBEE_BASE_URL}/devices/${TEXTBEE_DEVICE_ID}/send-sms`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': TEXTBEE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: normalized,
        message,
      }),
    })

    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      const err = `TextBee error ${response.status}: ${payload?.error || payload?.message || 'Unknown error'}`
      console.error('[textbee]', err, '| to:', normalized)
      return { success: false, data: payload, error: err }
    }

    // Success payload looks like: { data: { success, message, smsBatchId, recipientCount } }
    const inner = payload?.data ?? payload
    if (inner?.success === false) {
      const err = `TextBee reported failure: ${inner?.message ?? 'Unknown reason'}`
      console.error('[textbee]', err, '| to:', normalized)
      return { success: false, data: payload, error: err }
    }

    return { success: true, data: payload }
  } catch (e: any) {
    const err = `TextBee request failed: ${e?.message ?? String(e)}`
    console.error('[textbee]', err)
    return { success: false, data: null, error: err }
  }
}
