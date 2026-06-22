'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Mail, Phone, Lock, Eye, EyeOff, User, ArrowRight, Loader2, Gift, CheckCircle, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', referralCode: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [step, setStep] = useState<'form' | 'otp'>('form')
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const router = useRouter()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match')
    if (!agreed) return toast.error('Please agree to the terms')
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Failed to send code')
      toast.success('Verification code sent!')
      setStep('otp')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) return toast.error('Enter the 6-digit code')
    setOtpLoading(true)
    try {
      const verifyRes = await fetch('/api/auth/verify-otp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, code: otp }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyRes.ok) return toast.error(verifyData.error || 'Invalid code')
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password, referralCode: form.referralCode }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Registration failed')
      toast.success('Account created! Signing you in...')
      await signIn('credentials', { identifier: form.phone || form.email, password: form.password, redirect: false })
      router.push('/onboarding')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white" style={{ width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          ))}
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="text-center text-white relative z-10">
          <div className="w-40 h-28 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl p-4">
            <img src="/Nelliys Logo Coffee-01.png" alt="Nelliy's Coffee" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <h2 className="font-display text-4xl font-bold mb-4">Join & Start Earning</h2>
          <p className="text-white/80 max-w-sm text-lg leading-relaxed mb-8">Get 100 bonus points just for signing up. Start earning free coffee today.</p>
          <div className="space-y-3 text-left">
            {['100 welcome points on signup', 'Birthday reward every year', 'Earn 1 point per 10 ETB spent', 'Refer friends for 200 bonus points'].map((b) => (
              <div key={b} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
                <CheckCircle className="w-5 h-5 text-amber-200 flex-shrink-0" />
                <span className="text-white/90 text-sm">{b}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md py-8">
          <Link href="/" className="flex flex-col items-start mb-8">
            <img src="/Nelliys Logo Coffee-01.png" alt="Nelliy's Coffee" className="h-14 w-auto object-contain" />
            <span className="text-xs text-amber-600 font-medium mt-1 tracking-wide">Ethiopia's Premier Coffee Rewards</span>
          </Link>

          <h1 className="font-display text-4xl font-bold text-amber-900 mb-1">Create account</h1>
          <p className="text-amber-700/70 mb-8">Join thousands earning rewards on every coffee</p>

          {step === 'otp' ? (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
                <KeyRound className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-amber-900 font-semibold">Verify your phone</p>
                <p className="text-amber-600/70 text-sm mt-1">Code sent to <strong>{form.phone}</strong></p>
              </div>
              <Input
                placeholder="6-digit code"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="h-14 border-amber-200 focus:border-amber-400 bg-white text-center text-2xl tracking-widest font-mono"
                maxLength={6}
                autoFocus
              />
              <Button type="submit" disabled={otpLoading || otp.length !== 6} className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg">
                {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Verify & Create Account</span><ArrowRight className="w-4 h-4 ml-2" /></>}
              </Button>
              <button type="button" onClick={() => setStep('form')} className="w-full text-amber-600 text-sm hover:text-amber-800 transition-colors">
                ← Back to edit details
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { icon: User, key: 'name', type: 'text', placeholder: 'Full Name', required: true },
              { icon: Phone, key: 'phone', type: 'tel', placeholder: '+251 9xx xxx xxx', required: true },
              { icon: Mail, key: 'email', type: 'email', placeholder: 'Email (optional)', required: false },
            ].map(({ icon: Icon, key, type, placeholder, required }) => (
              <div key={key} className="relative">
                <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                <Input type={type} placeholder={placeholder} value={(form as any)[key]} onChange={set(key)} className="pl-10 h-12 border-amber-200 focus:border-amber-400 bg-white" required={required} />
              </div>
            ))}

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
              <Input type={showPassword ? 'text' : 'password'} placeholder="Password (min 8 chars)" value={form.password} onChange={set('password')} className="pl-10 pr-12 h-12 border-amber-200 focus:border-amber-400 bg-white" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
              <Input type="password" placeholder="Confirm Password" value={form.confirmPassword} onChange={set('confirmPassword')} className="pl-10 h-12 border-amber-200 focus:border-amber-400 bg-white" required />
            </div>

            <Input placeholder="Referral Code (optional)" value={form.referralCode} onChange={set('referralCode')} className="h-12 border-amber-200 focus:border-amber-400 bg-white" />

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 rounded border-amber-300 text-amber-500 focus:ring-amber-500" />
              <span className="text-sm text-amber-700">
                I agree to the{' '}
                <Link href="/terms" className="text-amber-600 hover:underline font-medium">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-amber-600 hover:underline font-medium">Privacy Policy</Link>
              </span>
            </label>

            <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Continue</span><ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </form>
          )}

          <p className="text-center text-amber-700 mt-6 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-amber-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
