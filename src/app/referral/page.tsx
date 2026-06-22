'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Copy, Share2, CheckCircle, Loader2, Gift, TrendingUp, Cake, Star, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import BottomNav from '@/components/ui/BottomNav'

const TIER_GRADIENT: Record<string, string> = {
  BRONZE: 'from-amber-600 to-amber-800',
  SILVER: 'from-slate-400 to-slate-600',
  GOLD: 'from-yellow-400 to-amber-500',
  VIP: 'from-purple-500 to-pink-500',
}

export default function ReferralPage() {
  const { status } = useSession()
  const router = useRouter()
  const [userData, setUserData] = useState<any>(null)
  const [referrals, setReferrals] = useState<any[]>([])
  const [totalEarned, setTotalEarned] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [claimingBirthday, setClaimingBirthday] = useState(false)

  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    const safe = (url: string) => fetch(url).then(r => r.text()).then(t => { try { return JSON.parse(t) } catch { return {} } })
    Promise.all([safe('/api/user/me'), safe('/api/user/referrals')]).then(([u, r]) => {
      setUserData(u.user)
      setReferrals(r.referrals || [])
      setTotalEarned(r.totalEarned || 0)
    }).finally(() => setLoading(false))
  }, [status])

  const copy = () => {
    navigator.clipboard.writeText(userData?.referralCode || '')
    setCopied(true)
    toast.success('Referral code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const share = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join Nelliy's Rewards",
        text: `☕ I'm earning free coffee at Nelliy's! Use my code ${userData?.referralCode} to get 100 bonus points when you join. I've earned ${userData?.points?.toLocaleString() || 0} points so far!`,
        url: `${window.location.origin}/register?ref=${userData?.referralCode}`
      })
    } else copy()
  }

  const claimBirthday = async () => {
    setClaimingBirthday(true)
    try {
      const res = await fetch('/api/user/birthday-reward', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error)
      toast.success(data.message)
      setUserData((u: any) => u ? { ...u, points: u.points + data.points } : u)
    } catch { toast.error('Something went wrong') }
    finally { setClaimingBirthday(false) }
  }

  if (loading || status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50">
      <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
    </div>
  )

  const today = new Date()
  const bday = userData?.birthday ? new Date(userData.birthday) : null
  const isBirthday = bday && today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-amber-700 hover:text-amber-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <h1 className="font-display text-lg font-bold text-amber-900">Refer & Earn</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 pb-28 space-y-4">

        {/* Birthday Banner */}
        {isBirthday && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Cake className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">🎂 Happy Birthday!</p>
              <p className="text-white/80 text-xs">Claim your 150 bonus points today!</p>
            </div>
            <Button onClick={claimBirthday} disabled={claimingBirthday}
              className="bg-white text-rose-600 hover:bg-rose-50 font-bold text-sm px-4 flex-shrink-0">
              {claimingBirthday ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Claim!'}
            </Button>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3">
          {[
            { icon: Users, label: 'Referred', value: referrals.length },
            { icon: TrendingUp, label: 'Pts Earned', value: totalEarned.toLocaleString() },
            { icon: Gift, label: 'Per Referral', value: '200 pts' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm text-center">
              <s.icon className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="font-bold text-amber-900">{s.value}</p>
              <p className="text-amber-500 text-xs">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white text-center shadow-xl relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold mb-1">Invite Friends</h2>
            <p className="text-white/80 text-sm">Earn <span className="font-bold text-white">200 points</span> for every friend who joins!</p>
          </div>
        </motion.div>

        {/* Referral Code */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
          <p className="text-sm font-medium text-amber-600 mb-3 text-center">Your Referral Code</p>
          <div className="bg-amber-50 rounded-2xl p-4 text-center mb-4 border border-amber-200">
            <p className="font-mono font-bold text-3xl text-amber-900 tracking-widest">{userData?.referralCode}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={copy} variant="outline" className="flex-1 h-11 border-amber-300 text-amber-700 hover:bg-amber-50">
              {copied ? <CheckCircle className="w-4 h-4 mr-2 text-green-600" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button onClick={share} className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-md">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
          </div>
        </motion.div>

        {/* Social Share Card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="bg-gradient-to-br from-amber-900 to-orange-900 rounded-2xl p-5 border border-amber-700/30 shadow-xl relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/5 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <p className="text-amber-300 text-xs font-semibold uppercase tracking-wider">Share Your Achievement</p>
            </div>
            <p className="text-white font-bold text-lg leading-snug mb-1">
              ☕ I&apos;ve earned <span className="text-amber-400">{userData?.points?.toLocaleString() || 0} points</span> at Nelliy&apos;s!
            </p>
            <p className="text-white/60 text-sm mb-4">Use my code <span className="font-mono font-bold text-amber-300">{userData?.referralCode}</span> to get 100 bonus points.</p>
            <button onClick={share}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" /> Share on WhatsApp / Telegram
            </button>
          </div>
        </motion.div>

        {/* Referral List */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-50">
            <h3 className="font-bold text-amber-900">People You've Referred ({referrals.length})</h3>
          </div>
          {referrals.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-10 h-10 text-amber-200 mx-auto mb-2" />
              <p className="text-amber-600 text-sm font-medium">No referrals yet</p>
              <p className="text-amber-400 text-xs mt-1">Share your code to start earning!</p>
            </div>
          ) : referrals.map((r, i) => (
            <div key={r.id} className={`px-5 py-3 flex items-center gap-3 ${i < referrals.length - 1 ? 'border-b border-amber-50' : ''}`}>
              <div className={`w-10 h-10 bg-gradient-to-br ${TIER_GRADIENT[r.tier] || TIER_GRADIENT.BRONZE} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
                {r.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-amber-900 truncate">{r.name}</p>
                <p className="text-amber-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-green-600 font-bold text-sm">+200 pts</p>
                <p className="text-amber-400 text-xs">{r.tier}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
          <h3 className="font-bold text-amber-900 mb-4">How it works</h3>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Share your code', desc: 'Send your unique code to friends & family' },
              { step: '2', title: 'Friend signs up', desc: 'They register using your referral code' },
              { step: '3', title: 'Both earn points', desc: 'You get 200 pts, they get 100 welcome pts' },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white font-bold text-xs">{item.step}</span>
                </div>
                <div>
                  <p className="font-semibold text-amber-900 text-sm">{item.title}</p>
                  <p className="text-amber-600 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
      <BottomNav />
    </div>
  )
}
