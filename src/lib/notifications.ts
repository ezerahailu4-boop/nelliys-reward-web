import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/firebase'
import { sendSMS, smsTemplates } from '@/lib/sms'
import { sendTierUpgradeEmail } from '@/lib/email'
import { TIER_EMOJI, TIER_BENEFITS, REFERRAL_BONUS } from '@/lib/constants'

export async function notifyReferral(referrerId: string, newMemberName: string) {
  const user = await prisma.user.findUnique({
    where: { id: referrerId },
    select: { fcmToken: true, phone: true },
  })
  if (!user) return

  const title = '🎉 Referral Bonus!'
  const message = `${newMemberName} joined using your code! You earned ${REFERRAL_BONUS} bonus points.`

  if (user.fcmToken) {
    sendPushNotification(user.fcmToken, title, message, { type: 'referral' }).catch(() => {})
  }
  sendSMS(user.phone, `Nelliy's Rewards: ${message}`).then((r) => { if (!r.success) console.error('[sms] send failed:', r.error) }).catch((e) => console.error('[sms] send threw:', e))
}

export async function notifyTierUpgrade(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, fcmToken: true, phone: true, email: true, name: true },
  })
  if (!user) return

  const emoji = TIER_EMOJI[user.tier] ?? '🏆'
  const title = `${emoji} You've reached ${user.tier} tier!`
  const message = `Congrats ${user.name}! ${TIER_BENEFITS[user.tier] ?? 'Enjoy your new benefits!'}`

  await prisma.notification.create({
    data: { userId, type: 'tier_upgrade', title, message },
  })

  if (user.fcmToken) {
    sendPushNotification(user.fcmToken, title, message, { type: 'tier_upgrade', tier: user.tier }).catch(() => {})
  }

  sendSMS(user.phone, smsTemplates.tierUpgrade(user.tier)).then((r) => { if (!r.success) console.error('[sms] send failed:', r.error) }).catch((e) => console.error('[sms] send threw:', e))

  if (user.email) {
    sendTierUpgradeEmail(user.email, user.name, user.tier).catch(() => {})
  }
}
