'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  CheckCircle, 
  KeyRound, 
  RefreshCw,
  ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { toE164, isValidE164 } from '@/lib/phone'
import { setupRecaptcha, sendFirebasePhoneOtp } from '@/lib/firebaseClient'
import type { ConfirmationResult } from 'firebase/auth'

export default function RegisterPage() {
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  // OTP State
  const [otpCode, setOtpCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const recaptchaVerifierRef = useRef<any>(null)

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  /**
   * Step 1: Submit Form -> Send Firebase SMS OTP
   */
  const handleInitiateRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match')
    if (!agreed) return toast.error('Please agree to the terms')
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')

    const normalizedPhone = toE164(form.phone)
    if (!isValidE164(normalizedPhone)) {
      return toast.error('Please enter a valid phone number (e.g. +251 9xx xxx xxx)')
    }

    setLoading(true)

    try {
      // Step A: Setup Firebase Invisible reCAPTCHA
      let verifier = recaptchaVerifierRef.current
      try {
        verifier = setupRecaptcha('recaptcha-container')
        recaptchaVerifierRef.current = verifier
      } catch (err: any) {
        console.warn('Recaptcha init warning:', err)
        toast.error(`reCAPTCHA setup failed: ${err?.message || 'Unknown error'}`)
        setLoading(false)
        return
      }

      if (!verifier) {
        toast.error('reCAPTCHA verifier not initialized. Please refresh and try again.')
        setLoading(false)
        return
      }

      // Step B: Send OTP through Firebase Phone Auth
      const confirmation = await sendFirebasePhoneOtp(normalizedPhone, verifier)
      setConfirmationResult(confirmation)
      setStep('otp')
      setCountdown(60)
      toast.success(`Verification code sent to ${normalizedPhone}`)
    } catch (err: any) {
      console.error('Firebase Phone Auth Error:', err)
      console.error('Error code:', err?.code)
      console.error('Error message:', err?.message)
      console.error('Error details:', JSON.stringify(err?.customData || err?.serverResponse || {}))
      let msg = 'Failed to send verification SMS.'
      if (err?.code === 'auth/invalid-phone-number') {
        msg = 'Invalid phone number format.'
      } else if (err?.code === 'auth/too-many-requests') {
        msg = 'Too many requests. Please try again later.'
      } else if (err?.code === 'auth/quota-exceeded') {
        msg = 'SMS quota exceeded. Please contact support.'
      } else if (err?.code === 'auth/internal-error') {
        msg = `Firebase internal error. Details: ${err?.message || 'none'} | Code: ${err?.code} | Check: Phone Auth enabled? Blaze plan active? Domain authorized?`
      } else if (err?.message) {
        msg = err.message
      }
      toast.error(msg, { duration: 10000 })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Step 2: Resend OTP
   */
  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return
    setLoading(true)
    const normalizedPhone = toE164(form.phone)
    try {
      const verifier = setupRecaptcha('recaptcha-container')
      recaptchaVerifierRef.current = verifier
      const confirmation = await sendFirebasePhoneOtp(normalizedPhone, verifier)
      setConfirmationResult(confirmation)
      setCountdown(60)
      toast.success('New verification code sent!')
    } catch (err: any) {
      toast.error(err?.message || 'Could not resend verification code')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Step 3: Verify OTP & Complete Account Creation
   */
  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpCode || otpCode.length < 6) {
      return toast.error('Please enter the 6-digit code')
    }
    if (!confirmationResult) {
      return toast.error('Verification session expired. Please resend code.')
    }

    setVerifyingOtp(true)
    const normalizedPhone = toE164(form.phone)

    try {
      // 1. Confirm code with Firebase Auth
      const userCredential = await confirmationResult.confirm(otpCode)
      const firebaseToken = await userCredential.user.getIdToken()

      // 2. Call backend register API with verified token
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: normalizedPhone,
          password: form.password,
          referralCode: form.referralCode.trim() || undefined,
          firebaseToken,
          isVerified: true,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Registration failed')
        setVerifyingOtp(false)
        return
      }

      toast.success('Phone verified! Signing you in...')

      // 3. NextAuth Sign In
      const signInRes = await signIn('credentials', {
        identifier: normalizedPhone,
        password: form.password,
        redirect: false,
      })

      if (signInRes?.error) {
        toast.error('Account created — please sign in')
        window.location.href = '/login'
        return
      }

      // Hard navigation to trigger clean session
      window.location.href = '/onboarding'
    } catch (err: any) {
      console.error('OTP Verification Error:', err)
      if (err?.code === 'auth/invalid-verification-code') {
        toast.error('Invalid 6-digit code. Please check and try again.')
      } else if (err?.code === 'auth/code-expired') {
        toast.error('Code has expired. Please request a new one.')
      } else {
        toast.error(err?.message || 'Verification failed. Please try again.')
      }
    } finally {
      setVerifyingOtp(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Invisible container for Firebase Phone Auth reCAPTCHA */}
      <div id="recaptcha-container" />

      {/* Left — Visual Showcase */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white"
              style={{
                width: `${(i + 1) * 120}px`,
                height: `${(i + 1) * 120}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%,-50%)',
              }}
            />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center text-white relative z-10"
        >
          <div className="w-40 h-28 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl p-4">
            <img
              src="/Nelliys Logo Coffee-01.png"
              alt="Nelliy's Coffee"
              className="w-full h-full object-contain brightness-0 invert"
            />
          </div>
          <h2 className="font-display text-4xl font-bold mb-4">Join & Start Earning</h2>
          <p className="text-white/80 max-w-sm text-lg leading-relaxed mb-8">
            Get 100 bonus points just for signing up. Start earning free coffee today.
          </p>
          <div className="space-y-3 text-left">
            {[
              '100 welcome points on signup',
              'Fast & secure phone OTP verification',
              'Birthday reward every year',
              'Earn 1 point per 10 ETB spent',
              'Refer friends for 200 bonus points',
            ].map((b) => (
              <div
                key={b}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3"
              >
                <CheckCircle className="w-5 h-5 text-amber-200 flex-shrink-0" />
                <span className="text-white/90 text-sm">{b}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right — Interactive Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md py-6"
        >
          <Link href="/" className="flex flex-col items-start mb-6">
            <img
              src="/Nelliys Logo Coffee-01.png"
              alt="Nelliy's Coffee"
              className="h-14 w-auto object-contain"
            />
            <span className="text-xs text-amber-600 font-medium mt-1 tracking-wide">
              Ethiopia's Premier Coffee Rewards
            </span>
          </Link>

          <AnimatePresence mode="wait">
            {step === 'form' ? (
              <motion.div
                key="form-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="font-display text-3xl md:text-4xl font-bold text-amber-900 mb-1">
                  Create account
                </h1>
                <p className="text-amber-700/70 mb-6 text-sm">
                  Join thousands earning rewards on every coffee
                </p>

                <form onSubmit={handleInitiateRegister} className="space-y-3.5">
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                    <Input
                      type="text"
                      placeholder="Full Name"
                      value={form.name}
                      onChange={set('name')}
                      className="pl-10 h-11 border-amber-200 focus:border-amber-400 bg-white"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                    <Input
                      type="tel"
                      placeholder="Phone Number (+251 9xx xxx xxx)"
                      value={form.phone}
                      onChange={set('phone')}
                      className="pl-10 h-11 border-amber-200 focus:border-amber-400 bg-white"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                    <Input
                      type="email"
                      placeholder="Email (optional)"
                      value={form.email}
                      onChange={set('email')}
                      className="pl-10 h-11 border-amber-200 focus:border-amber-400 bg-white"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password (min 8 chars)"
                      value={form.password}
                      onChange={set('password')}
                      className="pl-10 pr-12 h-11 border-amber-200 focus:border-amber-400 bg-white"
                      required
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
                      type="password"
                      placeholder="Confirm Password"
                      value={form.confirmPassword}
                      onChange={set('confirmPassword')}
                      className="pl-10 h-11 border-amber-200 focus:border-amber-400 bg-white"
                      required
                    />
                  </div>

                  <Input
                    placeholder="Referral Code (optional)"
                    value={form.referralCode}
                    onChange={set('referralCode')}
                    className="h-11 border-amber-200 focus:border-amber-400 bg-white"
                  />

                  <label className="flex items-start gap-3 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1 rounded border-amber-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-xs text-amber-700 leading-relaxed">
                      I agree to the{' '}
                      <Link href="/terms" className="text-amber-600 hover:underline font-medium">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-amber-600 hover:underline font-medium">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Continue & Send OTP</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-center text-amber-700 mt-5 text-sm">
                  Already have an account?{' '}
                  <Link href="/login" className="text-amber-600 font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            ) : (
              /* Step 2: OTP Verification */
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-amber-100"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg mx-auto">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>

                <h2 className="font-display text-2xl font-bold text-amber-900 text-center mb-1">
                  Verify Phone Number
                </h2>
                <p className="text-amber-700/70 text-center text-sm mb-6">
                  We sent a 6-digit SMS verification code to{' '}
                  <strong className="text-amber-900 block font-semibold mt-0.5">
                    {toE164(form.phone)}
                  </strong>
                </p>

                <form onSubmit={handleVerifyOtpAndRegister} className="space-y-5">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      placeholder="• • • • • •"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="h-14 border-2 border-amber-300 focus:border-amber-500 text-center text-2xl tracking-[0.5em] font-mono rounded-xl bg-amber-50/50"
                      required
                    />
                    <p className="text-xs text-amber-600/70 text-center">
                      Enter the 6-digit code from your SMS
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={verifyingOtp || otpCode.length !== 6}
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    {verifyingOtp ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Verify & Complete Signup</span>
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-between text-xs text-amber-700 pt-2 border-t border-amber-100">
                    <button
                      type="button"
                      onClick={() => setStep('form')}
                      className="flex items-center gap-1 hover:text-amber-900 font-medium transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Change phone
                    </button>

                    {countdown > 0 ? (
                      <span className="text-amber-600/70">
                        Resend code in <strong className="font-semibold">{countdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={loading}
                        className="flex items-center gap-1 text-amber-600 hover:text-amber-800 font-semibold transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Resend code
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
