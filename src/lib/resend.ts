import emailjs from '@emailjs/nodejs'

const SERVICE_ID = 'service_ncaqeyl'
const PUBLIC_KEY = 'Eu8tA2sJe50wIATMz'
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || ''
const TEMPLATE_ID = 'template_oqmbgz4'

async function send(to: string, subject: string, html: string) {
  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, { to_email: to, to_name: '', subject, message: html }, { publicKey: PUBLIC_KEY, privateKey: PRIVATE_KEY })
    return { success: true }
  } catch (error) {
    console.error('EmailJS error:', error)
    return { success: false, error }
  }
}

const base = (content: string) => `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#1a0a00;font-family:system-ui,-apple-system,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a0a00;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
<tr><td align="center" style="background:linear-gradient(135deg,#92400e,#b45309,#d97706);border-radius:24px 24px 0 0;padding:32px 40px;">
  <img src="https://nelliy.com/Nelliys Logo Coffee-01.png" alt="Nelliy's Coffee" height="50" style="height:50px;display:block;margin:0 auto 12px;"/>
  <p style="margin:0;color:#fde68a;font-size:14px;">Addis Ababa's Finest Coffee & Rewards</p>
</td></tr>
<tr><td style="background:#ffffff;padding:36px 40px;">${content}</td></tr>
<tr><td style="background:#1a0a00;border-radius:0 0 24px 24px;padding:24px 40px;text-align:center;">
  <p style="margin:0 0 6px;color:#fde68a;font-size:13px;font-weight:600;">Nelliy's Coffee</p>
  <p style="margin:0 0 6px;color:#a16207;font-size:12px;">📍 Gazebo, Addis Ababa &nbsp;|&nbsp; 📞 +251 976 222 266</p>
  <p style="margin:0;color:#57534e;font-size:11px;">© 2026 Nelliy's Coffee. Made with ☕ in Ethiopia</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`

const welcomeHtml = (name: string, points: number) => base(`
  <p style="margin:0 0 16px;color:#78350f;font-size:18px;font-weight:700;">Hey ${name}! 👋</p>
  <p style="margin:0 0 24px;color:#44403c;font-size:15px;line-height:1.7;">Your <strong>Nelliy's Rewards</strong> account is all set! You're now part of an exclusive community of coffee lovers earning points and enjoying the best coffee in Addis Ababa.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fcd34d;border-radius:16px;margin-bottom:28px;">
    <tr><td style="padding:20px 24px;">
      <p style="margin:0 0 4px;color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">🎁 Welcome Bonus</p>
      <p style="margin:0;color:#78350f;font-size:28px;font-weight:800;">${points} Points</p>
      <p style="margin:4px 0 0;color:#a16207;font-size:13px;">Already added to your account!</p>
    </td></tr>
  </table>
  <p style="margin:0 0 12px;color:#78350f;font-size:14px;font-weight:700;">How to earn more:</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    ${['Scan the QR code on your receipt', 'Earn 1 point for every 10 ETB spent', 'Redeem for free drinks & pastries'].map((t, i) => `
    <tr><td style="padding:8px 0;border-bottom:1px solid #fef3c7;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="width:32px;height:32px;background:linear-gradient(135deg,#f59e0b,#ea580c);border-radius:8px;text-align:center;vertical-align:middle;color:#fff;font-weight:800;font-size:13px;">${i + 1}</td>
        <td style="padding-left:12px;color:#44403c;font-size:14px;">${t}</td>
      </tr></table>
    </td></tr>`).join('')}
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr><td align="center"><a href="https://nelliy.com/dashboard" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;">☕ Go to My Dashboard</a></td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f1;border-radius:12px;padding:16px;">
    <tr><td style="padding:0 0 10px;color:#78350f;font-size:13px;font-weight:700;">Your loyalty journey:</td></tr>
    <tr><td><table width="100%" cellpadding="0" cellspacing="0"><tr>
      ${[['🥉','Bronze','0–500'],['🥈','Silver','501–2000'],['🥇','Gold','2001–5000'],['💎','VIP','5000+']].map(([e,t,p]) => `
      <td align="center" style="padding:6px 2px;"><div style="font-size:18px;">${e}</div><div style="color:#92400e;font-size:10px;font-weight:700;margin-top:3px;">${t}</div><div style="color:#a16207;font-size:9px;">${p} pts</div></td>`).join('<td align="center" style="color:#d97706;font-size:16px;">→</td>')}
    </tr></table></td></tr>
  </table>`)

const pointsHtml = (points: number, total: number, branch: string) => base(`
  <div style="text-align:center;margin-bottom:24px;"><div style="font-size:48px;">☕</div></div>
  <p style="margin:0 0 16px;color:#78350f;font-size:18px;font-weight:700;text-align:center;">Points Earned!</p>
  <p style="margin:0 0 20px;color:#44403c;font-size:15px;text-align:center;">Thanks for visiting <strong>${branch}</strong>.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fcd34d;border-radius:16px;margin-bottom:24px;">
    <tr><td style="padding:24px;text-align:center;">
      <p style="margin:0 0 4px;color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Points Earned</p>
      <p style="margin:0;color:#78350f;font-size:40px;font-weight:800;">+${points}</p>
      <p style="margin:8px 0 0;color:#a16207;font-size:14px;">Total Balance: <strong>${total} pts</strong></p>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <a href="https://nelliy.com/dashboard" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;">View My Points</a>
  </td></tr></table>`)

const rewardHtml = (reward: string, code: string) => base(`
  <div style="text-align:center;margin-bottom:24px;"><div style="font-size:48px;">🎉</div></div>
  <p style="margin:0 0 16px;color:#78350f;font-size:18px;font-weight:700;text-align:center;">Reward Redeemed!</p>
  <p style="margin:0 0 20px;color:#44403c;font-size:15px;text-align:center;">Your <strong>${reward}</strong> is ready to use.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fcd34d;border-radius:16px;margin-bottom:24px;">
    <tr><td style="padding:24px;text-align:center;">
      <p style="margin:0 0 8px;color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your Code</p>
      <p style="margin:0;font-size:32px;font-weight:800;letter-spacing:6px;color:#78350f;">${code}</p>
      <p style="margin:10px 0 0;color:#a16207;font-size:12px;">Valid for 30 days. Show this to the barista.</p>
    </td></tr>
  </table>`)

const tierHtml = (name: string, tier: string) => base(`
  <div style="text-align:center;margin-bottom:24px;"><div style="font-size:48px;">🏆</div></div>
  <p style="margin:0 0 16px;color:#78350f;font-size:18px;font-weight:700;text-align:center;">Tier Upgrade!</p>
  <p style="margin:0 0 20px;color:#44403c;font-size:15px;text-align:center;">Congratulations <strong>${name}</strong>! You've been upgraded to:</p>
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
  <div style="text-align:center;margin-bottom:24px;"><div style="font-size:48px;">🎂</div></div>
  <p style="margin:0 0 16px;color:#78350f;font-size:18px;font-weight:700;text-align:center;">Happy Birthday, ${name}!</p>
  <p style="margin:0 0 20px;color:#44403c;font-size:15px;text-align:center;">We're celebrating you with a special gift from all of us at Nelliy's Coffee!</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px solid #fcd34d;border-radius:16px;margin-bottom:24px;">
    <tr><td style="padding:24px;text-align:center;">
      <p style="margin:0 0 4px;color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">🎁 Birthday Bonus</p>
      <p style="margin:0;color:#78350f;font-size:40px;font-weight:800;">+${points} pts</p>
      <p style="margin:8px 0 0;color:#a16207;font-size:13px;">Come celebrate with a cup of coffee on us!</p>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <a href="https://nelliy.com/rewards" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;">Redeem My Gift ☕</a>
  </td></tr></table>`)

export async function sendWelcomeEmail(to: string, name: string, points: number) {
  return send(to, `Welcome to Nelliy's Coffee, ${name}! ☕`, welcomeHtml(name, points))
}

export async function sendPointsEarnedEmail(to: string, points: number, total: number, branch: string) {
  return send(to, `You earned ${points} points at Nelliy's! ☕`, pointsHtml(points, total, branch))
}

export async function sendRewardRedeemedEmail(to: string, reward: string, code: string) {
  return send(to, `Your reward is ready: ${reward} 🎉`, rewardHtml(reward, code))
}

export async function sendTierUpgradeEmail(to: string, name: string, tier: string) {
  return send(to, `You've reached ${tier} tier! 🏆`, tierHtml(name, tier))
}

export async function sendBirthdayEmail(to: string, name: string, points: number) {
  return send(to, `Happy Birthday ${name}! 🎂`, birthdayHtml(name, points))
}
