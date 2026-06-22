// In-memory rate limiter with automatic stale entry cleanup
const store = new Map<string, { count: number; resetAt: number }>()

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    const keys = Array.from(store.keys())
    for (const key of keys) {
      const entry = store.get(key)
      if (entry && now > entry.resetAt) store.delete(key)
    }
  }, 5 * 60 * 1000)
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}
