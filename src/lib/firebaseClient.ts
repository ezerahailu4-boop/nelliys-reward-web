import { initializeApp, getApps, getApp } from 'firebase/app'
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from 'firebase/auth'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)

/**
 * Initializes an invisible reCAPTCHA verifier for Firebase Phone Auth.
 */
export function setupRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
  // Check if window is available (client-side only)
  if (typeof window === 'undefined') {
    throw new Error('reCAPTCHA can only be initialized in the browser')
  }

  // Clear any pre-existing instance attached to window if applicable
  const win = window as any
  if (win.recaptchaVerifier) {
    try {
      win.recaptchaVerifier.clear()
    } catch {}
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      console.warn('reCAPTCHA expired. Please try again.')
    },
  })

  win.recaptchaVerifier = verifier
  return verifier
}

/**
 * Sends a phone verification OTP code using Firebase Auth.
 */
export async function sendFirebasePhoneOtp(
  phoneNumber: string, 
  appVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
}

export async function requestPushPermission(): Promise<string | null> {
  try {
    const supported = await isSupported()
    if (!supported) return null

    const messaging = getMessaging(app)
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
    })

    return token || null
  } catch (err) {
    console.error('FCM token error:', err)
    return null
  }
}

export async function onForegroundMessage(callback: (payload: any) => void) {
  try {
    const supported = await isSupported()
    if (!supported) return
    const messaging = getMessaging(app)
    onMessage(messaging, callback)
  } catch {}
}
