import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { 
  getAuth, 
  Auth,
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from 'firebase/auth'

let _app: FirebaseApp | null = null
let _auth: Auth | null = null

/**
 * Lazily initialises Firebase — safe to call on both server and client.
 * Returns null when called during SSR / static generation.
 */
function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null

  if (!_app) {
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }
    _app = getApps().length === 0 ? initializeApp(config) : getApp()
  }

  return _app
}

export function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth can only be used in the browser')
  }
  if (!_auth) {
    const app = getFirebaseApp()!
    _auth = getAuth(app)
  }
  return _auth
}

/**
 * Initializes an invisible reCAPTCHA verifier for Firebase Phone Auth.
 */
export function setupRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
  if (typeof window === 'undefined') {
    throw new Error('reCAPTCHA can only be initialized in the browser')
  }

  const authInstance = getFirebaseAuth()

  // Clear any pre-existing instance attached to window
  const win = window as any
  if (win.recaptchaVerifier) {
    try {
      win.recaptchaVerifier.clear()
    } catch {}
  }

  const verifier = new RecaptchaVerifier(authInstance, containerId, {
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
  const authInstance = getFirebaseAuth()
  return await signInWithPhoneNumber(authInstance, phoneNumber, appVerifier)
}

export async function requestPushPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const { getMessaging, getToken, isSupported } = await import('firebase/messaging')
    const supported = await isSupported()
    if (!supported) return null

    const app = getFirebaseApp()
    if (!app) return null

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
  if (typeof window === 'undefined') return
  try {
    const { getMessaging, onMessage, isSupported } = await import('firebase/messaging')
    const supported = await isSupported()
    if (!supported) return
    const app = getFirebaseApp()
    if (!app) return
    const messaging = getMessaging(app)
    onMessage(messaging, callback)
  } catch {}
}
