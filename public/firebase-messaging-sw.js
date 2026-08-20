importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyBHu6AkrdlLY6g_9zqs7fe_5gb-NVQwMK4",
  authDomain: "nelliy-rewards.firebaseapp.com",
  projectId: "nelliy-rewards",
  storageBucket: "nelliy-rewards.firebasestorage.app",
  messagingSenderId: "713129939317",
  appId: "1:713129939317:web:f3d89f5697b6858674433c",
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || payload?.data?.title || "Nelliy's Rewards ☕"
  const body = payload?.notification?.body || payload?.data?.body || "You have a new update in Nelliy's Rewards!"
  const url = payload?.data?.url || '/dashboard'

  self.registration.showNotification(title, {
    body,
    icon: '/Nelliys Logo Coffee-01.png',
    badge: '/Nelliys Logo Coffee-01.png',
    data: { url },
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification?.data?.url || '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

