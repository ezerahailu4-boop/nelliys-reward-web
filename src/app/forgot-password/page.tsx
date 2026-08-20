'use client'

export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Phone, 
  Mail,
  Lock, 
  Eye,
  EyeOff,
  ArrowRight, 
  CheckCircle, 
  Loader2, 
  KeyRound, 
  RefreshCw 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { toE164, isValidE164 } from '@/lib/phone'
import { setupRecaptcha, sendFirebasePhoneOtp } from '@/lib/firebaseClient'
import type { ConfirmationResult } from 'firebase/auth'

type ResetMethod = 'email' | 'phone'
type Step = 'input' | 'code' | 'password' | 'done'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [method, setMethod] = useState<ResetMethod>('email')
  const [step, setStep] = useState<Step>('input')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [firebaseToken, setFirebaseToken] = useState<string>('')
  const recaptchaVerifierRef = useRef<any>(null)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const sendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (method === 'email') {
      const cleanEmail = email.trim().toLowerCase()
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return toast.error('Please enter a valid email address')
      }

      setLoading(true)
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to send reset code')
          return
        }

        setCountdown(60)
        toast.success(`Verification code sent to ${cleanEmail}`)
        setStep('code')
      } catch {
        toast.error('Network error. Please try again.')
      } finally {
        setLoading(false)
      }
    } else {
      // Phone method
      const normalizedPhone = toE164(phone)
      if (!isValidE164(normalizedPhone)) {
        return toast.error('Please enter a valid phone number (e.g. +251 9xx xxx xxx)')
      }

      setLoading(true)
      try {
        // First try backend database OTP
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: normalizedPhone }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to send reset code')
          return
        }

        // Also try Firebase phone auth if recaptcha container is present
        try {
          if (document.getElementById('recaptcha-container-forgot')) {
            const verifier = setupRecaptcha('recaptcha-container-forgot')
            recaptchaVerifierRef.current = verifier
            const confirmation = await sendFirebasePhoneOtp(normalizedPhone, verifier)
            setConfirmationResult(confirmation)
          }
        } catch {
          // Firebase fallback is optional, backend OTP works directly
        }

        setCountdown(60)
        toast.success(`Verification code sent to ${normalizedPhone}`)
        setStep('code')
      } catch (err: any) {
        console.error('Phone reset error:', err)
        toast.error(err?.message || 'Failed to send verification SMS')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleVerifyCode = async () => {
    const cleanCode = code.trim()
    if (!cleanCode || cleanCode.length !== 6) {
      return toast.error('Please enter the 6-digit code')
    }

    setLoading(true)
    try {
      // If Firebase confirmation is active and user is using phone
      if (confirmationResult && method === 'phone') {
        try {
          const userCredential = await confirmationResult.confirm(cleanCode)
          const token = await userCredential.user.getIdToken()
          setFirebaseToken(token)
        } catch {
          // Fall through to standard backend DB OTP check
        }
      }

      toast.success('Code entered! Now enter your new password.')
      setStep('password')
    } catch (err: any) {
      toast.error(err?.message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return toast.error('Passwords do not match')
    if (password.length < 8) return toast.error('Password must be at least 8 characters')

    setLoading(true)
    const identifier = method === 'email' ? email.trim().toLowerCase() : toE164(phone)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          email: method === 'email' ? identifier : undefined,
          phone: method === 'phone' ? identifier : undefined,
          code: code.trim() || undefined,
          firebaseToken: firebaseToken || undefined,
          password,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to reset password')
        return
      }

      toast.success('Password updated successfully!')
      setStep('done')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
      <div id="recaptcha-container-forgot" />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href="/login" className="flex items-center gap-2 text-amber-800 hover:text-amber-950 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-semibold text-sm">Back to Sign In</span>
        </Link>

        <div className="bg-white rounded-3xl p-7 md:p-8 shadow-xl border border-amber-100">
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-7">
            {(['input', 'code', 'password'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s
                      ? 'bg-amber-500 text-white shadow-md'
                      : ['input', 'code', 'password', 'done'].indexOf(step) > i
                      ? 'bg-green-500 text-white'
                      : 'bg-amber-100 text-amber-400'
                  }`}
                >
                  {['input', 'code', 'password', 'done'].indexOf(step) > i ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      ['input', 'code', 'password', 'done'].indexOf(step) > i
                        ? 'bg-green-400'
                        : 'bg-amber-100'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                  {method === 'email' ? <Mail className="w-6 h-6 text-white" /> : <Phone className="w-6 h-6 text-white" />}
                </div>
                <h1 className="font-display text-2xl font-bold text-amber-950 mb-1">
                  Reset Password
                </h1>
                <p className="text-amber-800/70 mb-5 text-sm">
                  Choose your preferred method to receive your 6-digit verification code.
                </p>

                {/* Method selector tabs */}
                <div className="flex gap-2 mb-5 p-1 bg-amber-100/70 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMethod('email')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                      method === 'email' ? 'bg-white text-amber-900 shadow-sm' : 'text-amber-700 hover:text-amber-900'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('phone')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                      method === 'phone' ? 'bg-white text-amber-900 shadow-sm' : 'text-amber-700 hover:text-amber-900'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    <span>Phone</span>
                  </button>
                </div>

                <form onSubmit={sendCode} className="space-y-4">
                  {method === 'email' ? (
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 border-amber-200 focus:border-amber-400 bg-white"
                        required
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                      <Input
                        type="tel"
                        placeholder="+251 9xx xxx xxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-12 border-amber-200 focus:border-amber-400 bg-white"
                        required
                        autoFocus
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Send Reset Code</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 'code' && (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                  <KeyRound className="w-6 h-6 text-white" />
                </div>
                <h1 className="font-display text-2xl font-bold text-amber-950 mb-1">Enter 6-Digit Code</h1>
                <p className="text-amber-800/70 mb-5 text-sm">
                  We sent a 6-digit code to{' '}
                  <strong className="text-amber-950 font-semibold">
                    {method === 'email' ? email : toE164(phone)}
                  </strong>
                </p>
                <div className="space-y-4">
                  <Input
                    placeholder="• • • • • •"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className="h-14 border-amber-200 focus:border-amber-400 text-center text-2xl tracking-[0.5em] font-mono font-bold bg-white"
                    maxLength={6}
                    autoFocus
                  />
                  <Button
                    onClick={handleVerifyCode}
                    disabled={code.length !== 6 || loading}
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>}
                  </Button>

                  <div className="flex items-center justify-between text-xs text-amber-800 pt-2 font-medium">
                    <button
                      type="button"
                      onClick={() => setStep('input')}
                      className="hover:underline text-amber-700"
                    >
                      Change {method === 'email' ? 'email' : 'phone'}
                    </button>

                    {countdown > 0 ? (
                      <span className="text-amber-600/70">
                        Resend in {countdown}s
                      </span>
                    ) : (
                      <button
                        onClick={() => sendCode()}
                        className="text-amber-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Resend Code
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'password' && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-md">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h1 className="font-display text-2xl font-bold text-amber-950 mb-1">
                  Create New Password
                </h1>
                <p className="text-amber-800/70 mb-5 text-sm">
                  Choose a strong password with at least 8 characters
                </p>
                <form onSubmit={resetPassword} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="New password (min 8 chars)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 border-amber-200 focus:border-amber-400 bg-white"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="pl-10 pr-10 h-12 border-amber-200 focus:border-amber-400 bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Set New Password'}
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-3"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-9 h-9 text-green-600" />
                </div>
                <h2 className="font-display text-2xl font-bold text-amber-950 mb-2">
                  Password Updated!
                </h2>
                <p className="text-amber-800/70 mb-6 text-sm">
                  Your password has been successfully reset. You can now sign in with your new credentials.
                </p>
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg"
                >
                  Sign In Now
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

