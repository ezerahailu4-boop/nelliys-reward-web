'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { toast } from 'sonner'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

export function useFCM() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated') return
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const register = async () => {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
        const messaging = getMessaging(app)

        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
        })

        if (token) {
          await fetch('/api/user/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fcmToken: token }),
          })
        }

        // Show foreground notifications as toasts
        onMessage(messaging, (payload) => {
          const { title, body } = payload.notification || {}
          if (title) toast(title, { description: body })
        })
      } catch (err) {
        // Silently fail — push notifications are optional
      }
    }

    register()
  }, [status])
}
