// Transactional Email Service supporting Resend, EmailJS, and fallback logging
import emailjs from '@emailjs/nodejs'

const SERVICE_ID = process.env.EMAILJS_SERVICE_ID || 'service_ncaqeyl'
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || 'Eu8tA2sJe50wIATMz'
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || ''
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || 'template_oqmbgz4'
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const FROM_EMAIL = process.env.EMAIL_FROM || "Nelliy's Rewards <rewards@nelliy.com>"

export async function sendEmail({
  to,
  subject,
  html,
  name = '',
}: {
  to: string
  subject: string
  html: string
  name?: string
}): Promise<{ success: boolean; error?: any }> {
  // 1. Try Resend API if API key is provided
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [to],
          subject,
          html,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        console.log(`[email] Successfully sent email to ${to} via Resend (ID: ${data.id})`)
        return { success: true }
      }
      console.warn('[email] Resend API error response:', data)
    } catch (err) {
      console.error('[email] Resend fetch error:', err)
    }
  }

  // 2. Try EmailJS if private key is provided
  if (PRIVATE_KEY) {
    try {
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        { to_email: to, to_name: name, subject, message: html },
        { publicKey: PUBLIC_KEY, privateKey: PRIVATE_KEY }
      )
      console.log(`[email] Successfully sent email to ${to} via EmailJS`)
      return { success: true }
    } catch (error) {
      console.error('[email] EmailJS send error:', error)
    }
  }

  // 3. Fallback dev logger: Log email content to console so development & testing work smoothly
  console.log(`\n================== [EMAIL DISPATCH] ==================`)
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log(`======================================================\n`)

  return { success: true }
}

const base = (content: string) => `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#1a0a00;font-family:system-ui,-apple-system,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a0a00;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.3);">
<tr><td align="center" style="background:linear-gradient(135deg,#92400e,#b45309,#d97706);padding:32px 40px;">
  <img src="https://nelliy.com/Nelliys Logo Coffee-01.png" alt="Nelliy's Coffee" height="55" style="height:55px;display:block;margin:0 auto 12px;"/>
  <p style="margin:0;color:#fde68a;font-size:14px;letter-spacing:1px;font-weight:600;">Addis Ababa's Finest Coffee & Rewards</p>
</td></tr>
<tr><td style="background:#ffffff;padding:36px 40px;">${content}</td></tr>
<tr><td style="background:#1a0a00;padding:24px 40px;text-align:center;">
  <p style="margin:0 0 6px;color:#fde68a;font-size:14px;font-weight:700;">Nelliy's Coffee</p>
  <p style="margin:0 0 6px;color:#a16207;font-size:12px;">📍 Gazebo, Addis Ababa &nbsp;|&nbsp; 📞 +251 976 222 266</p>
  <p style="margin:0;color:#78716c;font-size:11px;">© 2026 Nelliy's Coffee. Made with ☕ in Ethiopia</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`

const welcomeHtml = (name: string, points: number) => base(`
  <p style="margin:0 0 16px;color:#78350f;font-size:22px;font-weight:800;">Welcome to Nelliy's, ${name}! 👋☕</p>
  <p style="margin:0 0 24px;color:#44403c;font-size:15px;line-height:1.7;">
    Your <strong>Nelliy's Rewards</strong> account is all set! You're now ready to earn points and enjoy exclusive rewards on every cup of coffee.
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fcd34d;border-radius:16px;margin-bottom:28px;">
    <tr><td style="padding:20px 24px;text-align:center;">
      <p style="margin:0 0 4px;color:#92400e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">🎁 Welcome Gift</p>
      <p style="margin:0;color:#78350f;font-size:36px;font-weight:800;">${points} Points</p>
      <p style="margin:4px 0 0;color:#a16207;font-size:13px;">Added to your balance automatically!</p>
    </td></tr>
  </table>
  <p style="margin:0 0 12px;color:#78350f;font-size:14px;font-weight:700;">How to earn & redeem:</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr><td style="padding:8px 0;border-bottom:1px solid #fef3c7;color:#44403c;font-size:14px;">☕ <strong>1 point</strong> for every 10 ETB spent</td></tr>
    <tr><td style="padding:8px 0;border-bottom:1px solid #fef3c7;color:#44403c;font-size:14px;">📱 <strong>Scan receipt QR</strong> in the app instantly</td></tr>
    <tr><td style="padding:8px 0;color:#44403c;font-size:14px;">🎉 <strong>Redeem points</strong> for free drinks & pastries</td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <a href="https://nelliy.com/dashboard" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;box-shadow:0 4px 12px rgba(234,88,12,0.3);">☕ Go to My Dashboard</a>
  </td></tr></table>`)

const resetPasswordHtml = (name: string, code: string) => base(`
  <div style="text-align:center;margin-bottom:20px;">
    <div style="display:inline-block;width:60px;height:60px;line-height:60px;background:#fef3c7;border-radius:50%;font-size:28px;">🔐</div>
  </div>
  <p style="margin:0 0 16px;color:#78350f;font-size:22px;font-weight:800;text-align:center;">Password Reset Code</p>
  <p style="margin:0 0 20px;color:#44403c;font-size:15px;line-height:1.6;text-align:center;">
    Hello ${name || 'there'}, we received a request to reset the password for your Nelliy's Rewards account. Use the 6-digit code below to set a new password:
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px dashed #f59e0b;border-radius:16px;margin:24px 0;">
    <tr><td style="padding:24px;text-align:center;">
      <p style="margin:0 0 6px;color:#92400e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">Verification Code</p>
      <p style="margin:0;font-size:38px;font-weight:900;letter-spacing:8px;color:#78350f;font-family:monospace;">${code}</p>
      <p style="margin:8px 0 0;color:#a16207;font-size:13px;">Valid for <strong>15 minutes</strong></p>
    </td></tr>
  </table>
  <p style="margin:0 0 10px;color:#78716c;font-size:13px;text-align:center;">
    If you did not request this password reset, please ignore this email or contact support if you have concerns.
  </p>`)

const pointsHtml = (points: number, total: number, branch: string) => base(`
  <p style="margin:0 0 16px;color:#78350f;font-size:20px;font-weight:700;text-align:center;">Points Earned! ☕</p>
  <p style="margin:0 0 20px;color:#44403c;font-size:15px;text-align:center;">Thanks for visiting <strong>${branch}</strong>.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fcd34d;border-radius:16px;margin-bottom:24px;">
    <tr><td style="padding:24px;text-align:center;">
      <p style="margin:0;color:#78350f;font-size:40px;font-weight:800;">+${points}</p>
      <p style="margin:8px 0 0;color:#a16207;font-size:14px;">Total Balance: <strong>${total} pts</strong></p>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <a href="https://nelliy.com/dashboard" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;">View My Points</a>
  </td></tr></table>`)

const rewardHtml = (reward: string, code: string) => base(`
  <p style="margin:0 0 16px;color:#78350f;font-size:20px;font-weight:700;text-align:center;">Reward Redeemed! 🎉</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fcd34d;border-radius:16px;margin-bottom:24px;">
    <tr><td style="padding:24px;text-align:center;">
      <p style="margin:0 0 8px;color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;">Your Reward Code</p>
      <p style="margin:0;font-size:32px;font-weight:800;letter-spacing:6px;color:#78350f;">${code}</p>
      <p style="margin:10px 0 0;color:#a16207;font-size:12px;">Valid for 30 days. Show this to your barista.</p>
    </td></tr>
  </table>`)

const tierHtml = (name: string, tier: string) => base(`
  <p style="margin:0 0 16px;color:#78350f;font-size:20px;font-weight:700;text-align:center;">Tier Upgrade! 🏆</p>
  <p style="margin:0 0 20px;color:#44403c;font-size:15px;text-align:center;">Congratulations <strong>${name}</strong>! You've reached:</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fcd34d;border-radius:16px;margin-bottom:24px;">
    <tr><td style="padding:24px;text-align:center;">
      <p style="margin:0;font-size:36px;font-weight:800;color:#78350f;">${tier}</p>
      <p style="margin:8px 0 0;color:#a16207;font-size:13px;">Enjoy your new exclusive benefits!</p>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <a href="https://nelliy.com/rewards" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;">See My Benefits</a>
  </td></tr></table>`)

const birthdayHtml = (name: string, points: number) => base(`
  <p style="margin:0 0 16px;color:#78350f;font-size:20px;font-weight:700;text-align:center;">Happy Birthday, ${name}! 🎂</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fcd34d;border-radius:16px;margin-bottom:24px;">
    <tr><td style="padding:24px;text-align:center;">
      <p style="margin:0 0 4px;color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;">🎁 Birthday Bonus</p>
      <p style="margin:0;color:#78350f;font-size:40px;font-weight:800;">+${points} pts</p>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <a href="https://nelliy.com/rewards" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;">Redeem My Gift ☕</a>
  </td></tr></table>`)

export async function sendWelcomeEmail(to: string, name: string, points: number) {
  return sendEmail({ to, subject: `Welcome to Nelliy's Coffee, ${name}! ☕`, html: welcomeHtml(name, points), name })
}

export async function sendPasswordResetEmail(to: string, name: string, code: string) {
  return sendEmail({ to, subject: `Nelliy's Rewards: Password Reset Code (${code})`, html: resetPasswordHtml(name, code), name })
}

export async function sendPointsEarnedEmail(to: string, points: number, total: number, branch: string) {
  return sendEmail({ to, subject: `You earned ${points} points at Nelliy's! ☕`, html: pointsHtml(points, total, branch) })
}

export async function sendRewardRedeemedEmail(to: string, reward: string, code: string) {
  return sendEmail({ to, subject: `Your reward is ready: ${reward} 🎉`, html: rewardHtml(reward, code) })
}

export async function sendTierUpgradeEmail(to: string, name: string, tier: string) {
  return sendEmail({ to, subject: `You've reached ${tier} tier! 🏆`, html: tierHtml(name, tier), name })
}

export async function sendBirthdayEmail(to: string, name: string, points: number) {
  return sendEmail({ to, subject: `Happy Birthday ${name}! 🎂`, html: birthdayHtml(name, points), name })
}

