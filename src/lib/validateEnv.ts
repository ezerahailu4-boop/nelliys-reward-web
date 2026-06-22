// Validates required environment variables at startup
// Import this in any server-side entry point

const REQUIRED_IN_PRODUCTION = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'ADMIN_SECRET',
  'RECEIPT_QR_SECRET',
  'EMAILJS_PRIVATE_KEY',
]

const WARN_IF_MISSING = [
  'TEXTBEE_API_KEY',
  'TEXTBEE_DEVICE_ID',
  'GOOGLE_VISION_API_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
]

export function validateEnv() {
  if (process.env.NODE_ENV !== 'production') return

  const missing = REQUIRED_IN_PRODUCTION.filter(k => !process.env[k])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  const warned = WARN_IF_MISSING.filter(k => !process.env[k])
  if (warned.length > 0) {
    console.warn(`[nelliy] Optional env vars not set (some features disabled): ${warned.join(', ')}`)
  }
}

// Run immediately when imported
validateEnv()
