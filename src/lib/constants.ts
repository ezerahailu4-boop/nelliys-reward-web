// ── Tier thresholds ──────────────────────────────────────────────────────────
export const TIER_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 501,
  GOLD: 2001,
  VIP: 5000,
} as const

export const TIER_NEXT: Record<string, number> = {
  BRONZE: 500,
  SILVER: 2000,
  GOLD: 5000,
  VIP: 99999,
}

// Minimum points required to enter each tier
export const TIER_MIN: Record<string, number> = {
  BRONZE: TIER_THRESHOLDS.BRONZE,
  SILVER: TIER_THRESHOLDS.SILVER,
  GOLD: TIER_THRESHOLDS.GOLD,
  VIP: TIER_THRESHOLDS.VIP,
}


export const TIER_MULTIPLIER: Record<string, number> = {
  BRONZE: 1,
  SILVER: 1.25,
  GOLD: 1.5,
  VIP: 2,
}

export const TIER_EMOJI: Record<string, string> = {
  BRONZE: '🥉',
  SILVER: '🥈',
  GOLD: '🥇',
  VIP: '💎',
}

export const TIER_STYLES: Record<string, string> = {
  BRONZE: 'from-amber-700 to-amber-900',
  SILVER: 'from-slate-400 to-slate-600',
  GOLD: 'from-yellow-400 to-amber-600',
  VIP: 'from-purple-500 to-pink-600',
}

export const TIER_BENEFITS: Record<string, string> = {
  BRONZE: 'Earn 1 pt per 10 ETB spent.',
  SILVER: '1.25× points multiplier + early access to offers.',
  GOLD: '1.5× points multiplier + priority service.',
  VIP: '2× points multiplier + exclusive perks & free monthly drink.',
}

export const TIER_PERKS: Record<string, string[]> = {
  BRONZE: ['1x points on every purchase', 'Birthday bonus points'],
  SILVER: ['1.25x points multiplier', 'Free add-on monthly', 'Birthday bonus points'],
  GOLD: ['1.5x points multiplier', '2 free add-ons monthly', 'Priority support', 'Birthday bonus points'],
  VIP: ['2x points multiplier', 'Unlimited free add-ons', 'Exclusive VIP events', 'Dedicated support'],
}

// ── Points ───────────────────────────────────────────────────────────────────
export const POINTS_PER_ETB = 10        // 1 point per 10 ETB
export const WELCOME_BONUS = 100
export const REFERRAL_BONUS = 200
export const BIRTHDAY_BONUS = 150
export const REVIEW_BONUS = 50
export const QR_SCAN_POINTS = 50

// ── OTP ──────────────────────────────────────────────────────────────────────
export const OTP_EXPIRY_MS = 10 * 60 * 1000   // 10 minutes
export const OTP_LENGTH = 6

// ── Supported languages ──────────────────────────────────────────────────────
export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'am', label: 'አማርኛ', flag: '🇪🇹' },
  { code: 'or', label: 'Afaan Oromo', flag: '🇪🇹' },
] as const

export type LangCode = typeof LANGUAGES[number]['code']
