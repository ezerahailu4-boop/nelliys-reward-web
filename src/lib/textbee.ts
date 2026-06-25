const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

export async function sendSMS(recipients: string | string[], message: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('Twilio credentials are not set')
    return { success: false, data: null }
  }

  // Handle recipients: Twilio only allows one 'To' per request.
  // If an array is provided, we'll use the first recipient and log a warning.
  let recipient: string
  if (Array.isArray(recipients)) {
    if (recipients.length === 0) {
      return { success: false, data: null }
    }
    recipient = recipients[0]
    if (recipients.length > 1) {
      console.warn('sendSMS: received an array of recipients, using the first one only.')
    }
  } else {
    recipient = recipients
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
  const body = new URLSearchParams()
  body.set('To', recipient)
  body.set('From', TWILIO_PHONE_NUMBER)
  body.set('Body', message)

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
  return { success: response.ok, data }
}

// Pre-built messages for Nelliy Rewards
export const smsTemplates = {
  welcome: (name: string, points: number) =>
    `Welcome to Nelliy's Rewards, ${name}! 🐝 You have ${points} points. Start earning more today!`,

  pointsEarned: (points: number, total: number) =>
    `Nelliy's Rewards: You earned ${points} points! Total: ${total} pts. Keep buzzing! 🐝`,

  rewardRedeemed: (reward: string) =>
    `Nelliy's Rewards: Your "${reward}" has been redeemed! Enjoy 🐝`,

  tierUpgrade: (tier: string) =>
    `Congrats! You've been upgraded to ${tier} tier at Nelliy's Rewards! 🐝🎉`,

  birthday: (name: string, points: number) =>
    `Happy Birthday ${name}! 🎂🐝 We added ${points} bonus points to your Nelliy's Rewards account!`,

  campaign: (message: string) =>
    `Nelliy's Rewards: ${message} 🐝`,
}