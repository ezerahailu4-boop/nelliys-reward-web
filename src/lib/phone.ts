/**
 * Normalize a phone number to E.164 format for Twilio.
 * Defaults to Ethiopia (+251) when no country code is present, since
 * that's the only market this app currently serves.
 *
 * Examples:
 *   "0912345678"    -> "+251912345678"
 *   "912345678"     -> "+251912345678"
 *   "251912345678"  -> "+251912345678"
 *   "+251912345678" -> "+251912345678" (unchanged)
 */
export function toE164(raw: string): string {
  const trimmed = raw.trim()

  // Already E.164 — just strip any accidental spaces/dashes.
  if (trimmed.startsWith('+')) {
    return '+' + trimmed.slice(1).replace(/[^\d]/g, '')
  }

  const digits = trimmed.replace(/[^\d]/g, '')

  // Local format: 0912345678 (10 digits, leading 0)
  if (digits.length === 10 && digits.startsWith('0')) {
    return '+251' + digits.slice(1)
  }

  // Missing leading 0: 912345678 (9 digits)
  if (digits.length === 9) {
    return '+251' + digits
  }

  // Already has country code but no plus: 251912345678
  if (digits.length === 12 && digits.startsWith('251')) {
    return '+' + digits
  }

  // Fallback: assume it already includes a country code, just add +.
  return '+' + digits
}

/** True if the string is a plausible E.164 number (+ and 8-15 digits). */
export function isValidE164(value: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(value)
}
