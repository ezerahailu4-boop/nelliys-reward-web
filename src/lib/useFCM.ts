'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { requestPushPermission, onForegroundMessage } from './firebaseClient'
import { toast } from 'sonner'

export function useFCM() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return
    if (typeof window === 'undefined' || !('Notification' in window)) return

    let isMounted = true

    const initPush = async () => {
      try {
        const token = await requestPushPermission()
        if (token && isMounted) {
          await fetch('/api/user/me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fcmToken: token }),
          }).catch(() => {})
        }

        onForegroundMessage((payload: any) => {
          const { title, body } = payload?.notification || payload?.data || {}
          if (title && isMounted) {
            toast(title, {
              description: body,
              icon: '☕',
              duration: 5000,
            })
          }
        })
      } catch (err) {
        console.warn('[fcm] Failed to initialize push notifications:', err)
      }
    }

    initPush()

    return () => {
      isMounted = false
    }
  }, [status, session])
}

