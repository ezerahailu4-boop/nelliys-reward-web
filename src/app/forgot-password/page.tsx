'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Phone, Lock, ArrowRight, CheckCircle, Loader2, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Step = 'phone' | 'code' | 'password' | 'done'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      toast.success('Code sent to your phone!')
      setStep('code')
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return toast.error('Passwords do not match')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, password }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Failed to reset password')
      setStep('done')
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href="/login" className="flex items-center gap-2 text-amber-700 hover:text-amber-900 mb-8">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Login</span>
        </Link>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-amber-100">
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-8">
            {(['phone', 'code', 'password'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === s ? 'bg-amber-500 text-white' :
                  ['phone', 'code', 'password', 'done'].indexOf(step) > i ? 'bg-green-500 text-white' :
                  'bg-amber-100 text-amber-400'
                }`}>
                  {['phone', 'code', 'password', 'done'].indexOf(step) > i ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 ${['phone', 'code', 'password', 'done'].indexOf(step) > i ? 'bg-green-400' : 'bg-amber-100'}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 'phone' && (
              <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <h1 className="font-display text-2xl font-bold text-amber-900 mb-1">Forgot Password?</h1>
                <p className="text-amber-700/70 mb-6 text-sm">Enter your phone number to receive a reset code</p>
                <form onSubmit={sendCode} className="space-y-4">
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                    <Input type="tel" placeholder="+251 9xx xxx xxx" value={phone} onChange={e => setPhone(e.target.value)}
                      className="pl-10 h-12 border-amber-200 focus:border-amber-400" required />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Send Code</span><ArrowRight className="w-4 h-4 ml-2" /></>}
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 'code' && (
              <motion.div key="code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                  <KeyRound className="w-7 h-7 text-white" />
                </div>
                <h1 className="font-display text-2xl font-bold text-amber-900 mb-1">Enter Code</h1>
                <p className="text-amber-700/70 mb-6 text-sm">We sent a 6-digit code to <strong>{phone}</strong></p>
                <div className="space-y-4">
                  <Input placeholder="6-digit code" value={code} onChange={e => setCode(e.target.value)}
                    className="h-12 border-amber-200 focus:border-amber-400 text-center text-2xl tracking-widest font-mono" maxLength={6} />
                  <Button onClick={() => setStep('password')} disabled={code.length !== 6}
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg">
                    Verify Code <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <button onClick={sendCode} className="w-full text-amber-600 text-sm hover:text-amber-800 transition-colors">
                    Didn't receive it? Resend
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'password' && (
              <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <h1 className="font-display text-2xl font-bold text-amber-900 mb-1">New Password</h1>
                <p className="text-amber-700/70 mb-6 text-sm">Choose a strong password for your account</p>
                <form onSubmit={resetPassword} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                    <Input type="password" placeholder="New password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)}
                      className="pl-10 h-12 border-amber-200 focus:border-amber-400" required />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                    <Input type="password" placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)}
                      className="pl-10 h-12 border-amber-200 focus:border-amber-400" required />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="font-display text-2xl font-bold text-amber-900 mb-2">Password Reset!</h2>
                <p className="text-amber-700/70 mb-6">Your password has been updated successfully.</p>
                <Button onClick={() => router.push('/login')} className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold">
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
