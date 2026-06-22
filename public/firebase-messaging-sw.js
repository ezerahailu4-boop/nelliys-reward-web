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
  const { title, body } = payload.notification || {}
  self.registration.showNotification(title || "Nelliy's Rewards", {
    body: body || '',
    icon: '/Nelliys Logo Coffee-01.png',
    badge: '/Nelliys Logo Coffee-01.png',
  })
})
