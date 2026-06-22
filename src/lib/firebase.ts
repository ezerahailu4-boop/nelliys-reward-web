import * as admin from 'firebase-admin'

// ── Admin SDK (server-side) ──────────────────────────────────────────────────
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  if (process.env.FIREBASE_PROJECT_ID && privateKey && process.env.FIREBASE_CLIENT_EMAIL) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    })
  }
}

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  if (!admin.apps.length) return false
  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      data,
      android: { priority: 'high', notification: { sound: 'default' } },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      webpush: { notification: { icon: '/Nelliys Logo Coffee-01.png' } },
    })
    return true
  } catch (err) {
    console.error('Push notification failed:', err)
    return false
  }
}

export async function sendPushToMany(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ success: number; failed: number }> {
  if (!admin.apps.length || tokens.length === 0) return { success: 0, failed: tokens.length }
  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      webpush: { notification: { icon: '/Nelliys Logo Coffee-01.png' } },
    })
    return { success: response.successCount, failed: response.failureCount }
  } catch {
    return { success: 0, failed: tokens.length }
  }
}
