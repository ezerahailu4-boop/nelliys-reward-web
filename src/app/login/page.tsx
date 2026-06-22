'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Mail, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState<'email' | 'phone'>('phone')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        identifier: identifier.trim(),
        password,
        redirect: false,
        callbackUrl: '/dashboard'
      })
      if (res?.error) {
        toast.error('Wrong phone/email or password')
        setLoading(false)
        return
      }
      if (res?.ok) {
        // Redirect immediately — don't wait
        router.replace('/dashboard')
      }
    } catch {
      toast.error('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <Link href="/" className="flex flex-col items-start mb-10">
            <img src="/Nelliys Logo Coffee-01.png" alt="Nelliy's Coffee" className="h-14 w-auto object-contain" />
            <span className="text-xs text-amber-600 font-medium mt-1 tracking-wide">Ethiopia's Premier Coffee Rewards</span>
          </Link>

          <h1 className="font-display text-4xl font-bold text-amber-900 mb-1">Welcome back</h1>
          <p className="text-amber-700/70 mb-8">Sign in to access your rewards</p>

          <div className="flex gap-2 mb-6 p-1 bg-amber-100 rounded-xl">
            {(['phone', 'email'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  method === m ? 'bg-white text-amber-900 shadow-sm' : 'text-amber-700 hover:text-amber-900'
                }`}
              >
                {m === 'phone' ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                {m === 'phone' ? 'Phone' : 'Email'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              {method === 'phone'
                ? <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-amber-400" />
                : <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-amber-400" />}
              <Input
                type={method === 'phone' ? 'tel' : 'email'}
                placeholder={method === 'phone' ? '+251 9xx xxx xxx' : 'you@example.com'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="pl-10 h-12 border-amber-200 focus:border-amber-400 bg-white"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-amber-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-12 h-12 border-amber-200 focus:border-amber-400 bg-white"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600">
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-amber-600 hover:text-amber-700 hover:underline">Forgot password?</Link>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4 ml-2" /></>}
            </Button>
          </form>

          <p className="text-center text-amber-700 mt-8 text-sm">
            Don't have an account?{' '}
            <Link href="/register" className="text-amber-600 font-semibold hover:underline">Create one free</Link>
          </p>
        </motion.div>
      </div>

      {/* Right — Visual */}
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
          <h2 className="font-display text-4xl font-bold mb-4">Earn on Every Sip</h2>
          <p className="text-white/80 max-w-sm text-lg leading-relaxed">
            Join thousands of coffee lovers earning free drinks and exclusive rewards at Ethiopia's finest coffee shops.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[['2K+', 'Members'], ['1', 'Branch'], ['10K+', 'Points Earned']].map(([val, label]) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-2xl font-bold">{val}</div>
                <div className="text-white/70 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
