'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Crown, Star, Gift, TrendingUp, Copy, CheckCircle, Cake, Loader2, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import BottomNav from '@/components/ui/BottomNav'
import { TIER_STYLES, TIER_NEXT } from '@/lib/constants'

const TIER_MIN: Record<string, number> = { BRONZE: 0, SILVER: 501, GOLD: 2001, VIP: 5001 }

function BirthdayCard({ user, onClaimed }: { user: any; onClaimed: (pts: number) => void }) {
  const [claiming, setClaiming] = useState(false)

  const isBirthday = () => {
    if (!user?.birthday) return false
    const today = new Date()
    const bday = new Date(user.birthday)
    return today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate()
  }

  const claim = async () => {
    setClaiming(true)
    try {
      const res = await fetch('/api/user/birthday-reward', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error)
      toast.success(data.message)
      onClaimed(data.points)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setClaiming(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
      className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-5 border border-pink-100 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0">
        <Cake className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-rose-900">Birthday Reward</p>
        <p className="text-rose-600/70 text-sm">
          {user?.birthday
            ? `🎂 ${new Date(user.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
            : 'Set your birthday to get 150 free points!'}
        </p>
      </div>
      {!user?.birthday ? (
        <Link href="/settings">
          <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-white text-xs">Set</Button>
        </Link>
      ) : isBirthday() ? (
        <Button size="sm" onClick={claim} disabled={claiming}
          className="bg-rose-500 hover:bg-rose-600 text-white text-xs flex-shrink-0">
          {claiming ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Claim 150 pts!'}
        </Button>
      ) : (
        <span className="text-rose-400 text-xs text-right flex-shrink-0">Available<br />on your birthday</span>
      )}
    </motion.div>
  )
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    const safe = (url: string) => fetch(url).then(r => r.text()).then(t => { try { return JSON.parse(t) } catch { return {} } })
    Promise.all([safe('/api/user/me'), safe('/api/points/history?page=1')]).then(([u, t]) => {
      setUser(u.user)
      setTransactions(t.transactions?.slice(0, 5) || [])
    }).finally(() => setLoading(false))
  }, [status])

  const copyReferral = () => {
    navigator.clipboard.writeText(user?.referralCode || '')
    setCopied(true)
    toast.success('Referral code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50">
      <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
    </div>
  )

  const points = user?.points || 0
  const tier = user?.tier || 'BRONZE'
  const nextTier = TIER_NEXT[tier]
  const minTier = TIER_MIN[tier]
  const progress = tier === 'VIP' ? 100 : Math.min(100, ((points - minTier) / (nextTier - minTier)) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-amber-700 hover:text-amber-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <h1 className="font-display text-lg font-bold text-amber-900">My Profile</h1>
          <Link href="/settings" className="text-amber-600 text-sm font-medium hover:text-amber-800">Edit</Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 pb-28 space-y-4">
        {/* Hero card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-br ${TIER_STYLES[tier]} rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden`}>
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full" />
          <div className="relative flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold shadow-lg backdrop-blur-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-sm">Member</p>
              <h2 className="font-display text-2xl font-bold truncate">{user?.name}</h2>
              <p className="text-white/60 text-sm">{user?.phone}</p>
              <Badge className="bg-white/20 text-white border-0 text-xs mt-1">{tier} Tier</Badge>
            </div>
          </div>
          <div className="relative mt-5 bg-white/10 rounded-2xl p-4">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider">Total Points</p>
                <p className="text-4xl font-bold">{points.toLocaleString()}</p>
              </div>
              <Crown className="w-8 h-8 text-white/40" />
            </div>
            {tier !== 'VIP' && (
              <>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-white rounded-full" />
                </div>
                <p className="text-white/60 text-xs mt-1">{nextTier - points} pts to next tier</p>
              </>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3">
          {[
            { icon: TrendingUp, label: 'Total Spent', value: `${(user?.totalSpent || 0).toLocaleString()} ETB` },
            { icon: Gift, label: 'Tier', value: tier },
            { icon: Star, label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : '—' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm text-center">
              <s.icon className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="font-bold text-amber-900 text-sm">{s.value}</p>
              <p className="text-amber-500 text-xs">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Referral */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
          <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-500" /> Referral Code
          </h3>
          <div className="flex items-center gap-3 bg-amber-50 rounded-xl p-3 border border-amber-200">
            <span className="font-mono font-bold text-amber-900 text-lg flex-1 tracking-widest">{user?.referralCode}</span>
            <button onClick={copyReferral} className="w-9 h-9 bg-amber-500 hover:bg-amber-600 rounded-xl flex items-center justify-center transition-colors">
              {copied ? <CheckCircle className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
            </button>
          </div>
          <p className="text-amber-600/70 text-xs mt-2">Share this code — you earn 200 pts per referral!</p>
        </motion.div>

        {/* Birthday */}
        <BirthdayCard user={user} onClaimed={(pts) => setUser((u: any) => u ? { ...u, points: u.points + pts } : u)} />

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-50 flex justify-between items-center">
            <h3 className="font-bold text-amber-900">Recent Activity</h3>
            <Link href="/history" className="text-amber-600 text-sm hover:text-amber-800">View All</Link>
          </div>
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-amber-500/60 text-sm">No activity yet</div>
          ) : transactions.map((tx, i) => (
            <div key={tx.id} className={`px-5 py-3 flex items-center justify-between ${i < transactions.length - 1 ? 'border-b border-amber-50' : ''}`}>
              <div>
                <p className="text-amber-900 text-sm font-medium">{tx.description}</p>
                <p className="text-amber-400 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                {tx.amount > 0 ? '+' : ''}{tx.amount} pts
              </span>
            </div>
          ))}
        </motion.div>
      </main>
      <BottomNav />
    </div>
  )
}
