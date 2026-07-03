import { toE164, isValidE164 } from '@/lib/phone'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

type SendSMSResult = {
  success: boolean
  data: any
  error?: string
}

export async function sendSMS(recipients: string | string[], message: string): Promise<SendSMSResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    const err = 'Twilio credentials are not set (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER)'
    console.error('[twilio]', err)
    return { success: false, data: null, error: err }
  }

  // Handle recipients: Twilio only allows one 'To' per request.
  // If an array is provided, we'll use the first recipient and log a warning.
  let rawRecipient: string
  if (Array.isArray(recipients)) {
    if (recipients.length === 0) {
      return { success: false, data: null, error: 'No recipients provided' }
    }
    rawRecipient = recipients[0]
    if (recipients.length > 1) {
      console.warn('[twilio] sendSMS: received an array of recipients, using the first one only.')
    }
  } else {
    rawRecipient = recipients
  }

  const recipient = toE164(rawRecipient)
  if (!isValidE164(recipient)) {
    const err = `Invalid phone number after normalization: "${rawRecipient}" -> "${recipient}"`
    console.error('[twilio]', err)
    return { success: false, data: null, error: err }
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  const body = new URLSearchParams()
  body.set('To', recipient)
  body.set('From', TWILIO_PHONE_NUMBER)
  body.set('Body', message)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Basic Auth: Base64 of AccountSID:AuthToken
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
      },
      body,
    })

    const data = await response.json()

    if (!response.ok) {
      // Twilio error payloads look like: { code, message, more_info, status }
      const err = `Twilio error ${data?.code ?? response.status}: ${data?.message ?? 'Unknown error'}`
      console.error('[twilio]', err, '| to:', recipient, '| more_info:', data?.more_info)
      return { success: false, data, error: err }
    }

    return { success: true, data }
  } catch (e: any) {
    const err = `Twilio request failed: ${e?.message ?? String(e)}`
    console.error('[twilio]', err)
    return { success: false, data: null, error: err }
  }
}

// Pre-built messages for Nelliy Rewards
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