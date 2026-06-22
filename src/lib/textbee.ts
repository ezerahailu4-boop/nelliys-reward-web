const TEXTBEE_API = 'https://api.textbee.dev/api/v1'
const ALLOWED_HOST = 'api.textbee.dev'

function safeTextbeeUrl(path: string): string {
  const url = new URL(`${TEXTBEE_API}${path}`)
  if (url.hostname !== ALLOWED_HOST) throw new Error('Invalid SMS API host')
  return url.toString()
}

export async function sendSMS(recipients: string | string[], message: string) {
  const deviceId = process.env.TEXTBEE_DEVICE_ID
  if (!deviceId) return { success: false, data: null }
  const endpoint = safeTextbeeUrl(`/gateway/devices/${encodeURIComponent(deviceId)}/sendSms`)
  const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': process.env.TEXTBEE_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: Array.isArray(recipients) ? recipients : [recipients],
        message,
      }),
    })
  const data = await response.json()
  return { success: response.ok, data }
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
    `Congrats! You've been upgraded to ${tier} tier at Nelliy's Rewards! 🎉`,

  birthday: (name: string, points: number) =>
    `Happy Birthday ${name}! 🎂 We added ${points} bonus points to your Nelliy's Rewards account!`,

  campaign: (message: string) =>
    `Nelliy's Rewards: ${message}`,
};
