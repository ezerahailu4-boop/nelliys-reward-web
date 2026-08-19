'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ArrowRight, 
  Loader2, 
  CheckCircle, 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { toE164, isValidE164 } from '@/lib/phone'

export default function RegisterPage() {
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

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  /**
   * Direct registration — no OTP required.
   * Firebase Phone OTP can be re-enabled later by upgrading to Blaze plan.
   */
  const handleRegister = async (e: React.FormEvent) => {
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
      // Call backend register API directly (no OTP verification)
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: normalizedPhone,
          password: form.password,
          referralCode: form.referralCode.trim() || undefined,
          isVerified: false,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      toast.success('Account created! Signing you in...')

      // Auto sign in with NextAuth
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
      console.error('Registration Error:', err)
      toast.error(err?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
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
              'Fast & secure registration',
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

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-amber-900 mb-1">
              Create account
            </h1>
            <p className="text-amber-700/70 mb-6 text-sm">
              Join thousands earning rewards on every coffee
            </p>

            <form onSubmit={handleRegister} className="space-y-3.5">
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
                    <span>Create Account</span>
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
        </motion.div>
      </div>
    </div>
  )
}
