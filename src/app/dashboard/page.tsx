'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  Coffee, Scan, Gift, Wallet, Clock, Star, Crown, ChevronRight,
  Bell, Settings, LogOut, History, TrendingUp, Users, CreditCard,
  QrCode, Award, Calendar, Cake, MessageCircle, Loader2, ExternalLink,
  Trophy, Medal, X
} from 'lucide-react'
import BottomNav from '@/components/ui/BottomNav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { requestPushPermission, onForegroundMessage } from '@/lib/firebaseClient'
import { TIER_STYLES, TIER_NEXT, TIER_PERKS } from '@/lib/constants'
import { useTranslations } from '@/lib/i18n'

// Animated counter hook
function useAnimatedCounter(target: number, duration = 800) {
  const [display, setDisplay] = useState(target)
  const prev = useRef(target)
  useEffect(() => {
    if (prev.current === target) return
    const start = prev.current
    const diff = target - start
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * ease))
      if (progress < 1) requestAnimationFrame(tick)
      else prev.current = target
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return display
}

interface UserData {
  id?: string
  name?: string
  email?: string
  points?: number
  tier?: string
  birthday?: string
  createdAt?: string
  fcmToken?: string
}

interface Transaction {
  id: string
  type: 'earned' | 'redeemed' | 'bonus'
  description: string
  amount: number
  createdAt: string
}

interface RewardItem {
  id: string
  title: string
  emoji: string
  pointsCost: number
}

interface LeaderboardEntry {
  id: string
  name: string
  points: number
  tier: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isSent: boolean
  createdAt: string
}

const TIER_MIN: Record<string, number> = { BRONZE: 0, SILVER: 501, GOLD: 2001, VIP: 5001 }

export default function DashboardPage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  )
}

function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userLang, setUserLang] = useState<'en'|'am'|'or'>('en')
  const t = useTranslations(userLang)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [rewards, setRewards] = useState<RewardItem[]>([])
  const [catalog, setCatalog] = useState<RewardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showTierPerks, setShowTierPerks] = useState(false)
  const [redeemConfirm, setRedeemConfirm] = useState<RewardItem | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    if (session?.user) setUserData(session.user as UserData)
    setLoading(false)

    const safeFetch = (url: string) =>
      fetch(url).then(r => r.ok ? r.json() : {}).catch(() => ({}))

    // Always re-fetch fresh user data (especially after receipt upload)
    safeFetch('/api/user/me').then((u: any) => {
      if (u.user) {
        setUserData(u.user)
        if (u.user.language) setUserLang(u.user.language as 'en'|'am'|'or')
      }
    })

    // Clear the refresh param from URL without reloading
    if (searchParams.get('refresh')) {
      router.replace('/dashboard', { scroll: false })
    }

    requestPushPermission().then(token => {
      if (token) {
        fetch('/api/user/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fcmToken: token }),
        }).catch(() => {})
      }
    })

    onForegroundMessage((payload: { notification?: { title?: string; body?: string } }) => {
      const { title, body } = payload.notification || {}
      if (title) toast(title, { description: body })
    })

    Promise.all([
      safeFetch('/api/points/history?page=1'),
      safeFetch('/api/rewards/list'),
      safeFetch('/api/leaderboard'),
      safeFetch('/api/notifications/list'),
    ]).then(([t, rw, lb, notif]: any[]) => {
      setTransactions(t.transactions?.slice(0, 5) || [])
      setRewards(rw.rewards || [])
      setCatalog(rw.catalog?.slice(0, 4) || [])
      setLeaderboard(lb.leaderboard || [])
      setUserRank(lb.userRank ?? null)
      setNotifications(notif.notifications || [])
      setUnreadCount(notif.unread || 0)
    })
  }, [status])

  const [showReviewClaim, setShowReviewClaim] = useState(false)
  const [reviewUsername, setReviewUsername] = useState('')
  const [claimingReview, setClaimingReview] = useState(false)

  const redeemReward = async (item: RewardItem) => {
    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId: item.id }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Redemption failed')
      toast.success(`🎉 ${item.title} redeemed!`)
      setUserData(u => u ? { ...u, points: (u.points ?? 0) - item.pointsCost } : u)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setRedeemConfirm(null)
    }
  }

  const claimReviewPoints = async () => {
    if (!reviewUsername.trim()) return toast.error('Enter your Google display name')
    setClaimingReview(true)
    try {
      const res = await fetch('/api/reviews/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleUsername: reviewUsername }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error)
      toast.success(data.message)
      setShowReviewClaim(false)
      setUserData((u: any) => u ? { ...u, points: u.points + 50 } : u)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setClaimingReview(false)
    }
  }

  const GOOGLE_REVIEW_URL = 'https://www.google.com/maps/place/Nelliy%27s+Coffee/@9.0012867,38.7672743,3a,75y,90t/data=!3m8!1e2!3m6!1sCIABIhC1snQdltRynRnnEDKZgB11!2e10!3e12!6shttps:%2F%2Flh3.googleusercontent.com%2Fgps-cs-s%2FAHVAweqBodE_O19FkhdZYXCmpyG465nOROVlhp66yD0_AfkblhukvbPrjtD7x6SNKSnLpbIDecly1Q8BD_Vf8Q3tC-Dggf0kVd0N7cZJGvl-Guk0-HW7V1gwqGCMKz9xaij-ONOaP743mWH3a7yl%3Dw203-h270-k-no!7i3464!8i4618!4m7!3m6!1s0x164b850055638aad:0xfeef3167f87e10e3!8m2!3d9.0012587!4d38.7673834!10e5!16s%2Fg%2F11yjl_9sly'

  const userData2 = userData || (session?.user as UserData)
  const points = userData2?.points ?? 0
  const animatedPoints = useAnimatedCounter(points)
  const tier = (userData2?.tier || 'BRONZE') as string
  const nextTier = TIER_NEXT[tier] ?? 500
  const minTier = TIER_MIN[tier] ?? 0
  const progress = tier === 'VIP' ? 100 : Math.min(100, ((points - minTier) / (nextTier - minTier)) * 100)
  const pointsToNext = tier === 'VIP' ? 0 : nextTier - points

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    )
  }

  const quickActions = [
    { icon: Scan, label: t('scanQr'), href: '/scan', gradient: 'from-amber-500 to-orange-500', text: 'white' },
    { icon: QrCode, label: t('uploadReceipt'), href: '/upload', gradient: 'from-orange-400 to-amber-500', text: 'white' },
    { icon: Gift, label: t('myRewards'), href: '/rewards', gradient: 'from-purple-500 to-pink-500', text: 'white' },
    { icon: History, label: t('history'), href: '/history', gradient: 'from-blue-500 to-cyan-500', text: 'white' },
  ]

  const menuItems = [
    { icon: Calendar, label: t('orderAhead'), href: '/order' },
    { icon: Cake, label: t('claimBirthday'), href: '/profile' },
    { icon: Users, label: t('referFriends'), href: '/referral' },
    { icon: CreditCard, label: 'Gift Cards', href: '/rewards' },
    { icon: Award, label: 'Subscription', href: '/rewards' },
    { icon: MessageCircle, label: t('support'), href: '/faq' },
    { icon: Settings, label: t('settings'), href: '/settings' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber-100 dark:border-zinc-700">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/Nelliys Logo Coffee-01.png" alt="Nelliy's Coffee" className="h-10 w-auto object-contain" />
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-amber-700 relative" onClick={() => setShowLeaderboard(true)}>
              <Trophy className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-amber-700 relative" onClick={() => {
              setShowNotifications(true)
              if (unreadCount > 0) fetch('/api/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }).then(() => setUnreadCount(0))
            }}>
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
            </Button>
            <Button variant="ghost" size="icon" className="text-amber-700" onClick={() => { signOut({ callbackUrl: '/' }); toast.success('Signed out') }}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pb-28">
        {/* Points Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
          <div className={`bg-gradient-to-br ${TIER_STYLES[tier]} rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden`}>
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full" />
            <div className="relative">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-white/70 text-sm">{t('welcome')}</p>
                  <h2 className="font-display text-2xl font-bold">{userData2?.name || 'Coffee Lover'}</h2>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Crown className="w-7 h-7" />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="text-white/70 text-xs uppercase tracking-wider">{t('points')}</p>
                    <p className="text-4xl font-bold">{animatedPoints.toLocaleString()}</p>
                  </div>
                  <button onClick={() => setShowTierPerks(true)}>
                    <Badge className="bg-white/20 text-white border-0 text-xs hover:bg-white/30 cursor-pointer">{tier} ▸ Perks</Badge>
                  </button>
                </div>
                {tier !== 'VIP' && (
                  <>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-white rounded-full"
                      />
                    </div>
                    <p className="text-white/60 text-xs mt-1.5">{pointsToNext} {t('pointsToNext')}</p>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{tier} Member</span>
                </div>
                <span className="text-white/60">Since {new Date(userData2?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Birthday Banner — shows on birthday */}
        {userData?.birthday && (() => {
          const today = new Date()
          const bday = new Date(userData.birthday!)
          return today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate()
        })() && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Cake className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">🎂 Happy Birthday!</p>
                <p className="text-white/80 text-xs">Claim your 150 bonus points!</p>
              </div>
              <Link href="/profile">
                <button className="bg-white text-rose-600 hover:bg-rose-50 font-bold text-xs px-3 py-2 rounded-xl transition-all">
                  Claim!
                </button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-4 gap-3 mt-5">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href}>
              <div className={`bg-gradient-to-br ${a.gradient} rounded-2xl p-3 text-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5`}>
                <a.icon className="w-6 h-6 text-white mx-auto mb-1.5" />
                <span className="text-white text-xs font-medium leading-tight block">{a.label}</span>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Google Review Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mt-5">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">Rate us on Google</p>
              <p className="text-white/80 text-xs">Leave a review & earn 50 bonus points!</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer"
                className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1">
                Review <ExternalLink className="w-3 h-3" />
              </a>
              <button onClick={() => setShowReviewClaim(true)}
                className="bg-white text-amber-600 hover:bg-amber-50 text-xs font-bold px-3 py-2 rounded-xl transition-all">
                Claim
              </button>
            </div>
          </div>
        </motion.div>

        {/* Notifications Modal */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 p-4" onClick={() => setShowNotifications(false)}>
            <motion.div initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 25 }}
              onClick={e => e.stopPropagation()} className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-6 h-6 text-white" />
                  <h3 className="font-display text-lg font-bold text-white">Notifications</h3>
                </div>
                <button onClick={() => setShowNotifications(false)} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center">
                    <Bell className="w-10 h-10 text-amber-200 mx-auto mb-3" />
                    <p className="text-amber-600 font-medium">No notifications yet</p>
                    <p className="text-amber-400 text-sm mt-1">We'll notify you about points & rewards</p>
                  </div>
                ) : notifications.map((n, i) => (
                  <div key={n.id} className={`px-5 py-4 flex items-start gap-3 ${i < notifications.length - 1 ? 'border-b border-amber-50' : ''} ${!n.isSent ? 'bg-amber-50/50' : ''}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base ${
                      n.type === 'points' ? 'bg-green-100' :
                      n.type === 'reward' ? 'bg-amber-100' :
                      n.type === 'tier_upgrade' ? 'bg-purple-100' :
                      n.type === 'birthday' ? 'bg-pink-100' :
                      n.type === 'referral' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {n.type === 'points' ? <Star className="w-4 h-4 text-green-600" /> :
                       n.type === 'reward' ? <Gift className="w-4 h-4 text-amber-600" /> :
                       n.type === 'tier_upgrade' ? <Crown className="w-4 h-4 text-purple-600" /> :
                       n.type === 'birthday' ? <span className="text-sm">🎂</span> :
                       n.type === 'referral' ? <span className="text-sm">🎉</span> :
                       <Bell className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-amber-900 text-sm">{n.title}</p>
                      <p className="text-amber-600/70 text-xs mt-0.5">{n.message}</p>
                      <p className="text-amber-400 text-xs mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                    </div>
                    {!n.isSent && <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-amber-100">
                <button onClick={() => setShowNotifications(false)} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-2xl">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 p-4" onClick={() => setShowLeaderboard(false)}>
            <motion.div
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 120, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 pt-6 pb-8 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-white">Leaderboard</h3>
                      <p className="text-white/70 text-xs">Top coffee earners this month</p>
                    </div>
                  </div>
                  <button onClick={() => setShowLeaderboard(false)} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* Your Rank Badge */}
                {userRank && (
                  <div className="relative mt-4 bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center justify-between">
                    <span className="text-white/80 text-sm">Your Rank</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-lg">#{userRank}</span>
                      <span className="text-white/60 text-xs">of all members</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Top 3 Podium */}
              {leaderboard.length >= 3 && (
                <div className="px-6 -mt-4">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
                    <div className="flex items-end justify-center gap-3">
                      {/* 2nd */}
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-300 to-slate-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {leaderboard[1]?.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="bg-gradient-to-b from-slate-300 to-slate-400 rounded-t-xl w-full h-14 flex flex-col items-center justify-center">
                          <Medal className="w-4 h-4 text-white" />
                          <span className="text-white text-xs font-bold">2nd</span>
                        </div>
                        <p className="text-amber-900 text-xs font-semibold text-center truncate w-full">{leaderboard[1]?.name?.split(' ')[0]}</p>
                        <p className="text-amber-600 text-xs">{leaderboard[1]?.points?.toLocaleString()} pts</p>
                      </div>
                      {/* 1st */}
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-yellow-300">
                          {leaderboard[0]?.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="bg-gradient-to-b from-yellow-400 to-amber-500 rounded-t-xl w-full h-20 flex flex-col items-center justify-center shadow-lg">
                          <Crown className="w-5 h-5 text-white" />
                          <span className="text-white text-xs font-bold">1st</span>
                        </div>
                        <p className="text-amber-900 text-xs font-bold text-center truncate w-full">{leaderboard[0]?.name?.split(' ')[0]}</p>
                        <p className="text-amber-600 text-xs font-semibold">{leaderboard[0]?.points?.toLocaleString()} pts</p>
                      </div>
                      {/* 3rd */}
                      <div className="flex flex-col items-center gap-1 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {leaderboard[2]?.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-xl w-full h-10 flex flex-col items-center justify-center">
                          <span className="text-white text-xs font-bold">3rd</span>
                        </div>
                        <p className="text-amber-900 text-xs font-semibold text-center truncate w-full">{leaderboard[2]?.name?.split(' ')[0]}</p>
                        <p className="text-amber-600 text-xs">{leaderboard[2]?.points?.toLocaleString()} pts</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Rest of list */}
              <div className="px-6 py-4 space-y-2 max-h-64 overflow-y-auto">
                {leaderboard.slice(3).map((u, i) => {
                  const isMe = u.id === (session?.user as any)?.id
                  const TIER_BADGE: Record<string, string> = {
                    BRONZE: 'bg-amber-100 text-amber-700',
                    SILVER: 'bg-slate-100 text-slate-600',
                    GOLD: 'bg-yellow-100 text-yellow-700',
                    VIP: 'bg-purple-100 text-purple-700',
                  }
                  return (
                    <div key={u.id} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
                      isMe ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 hover:bg-amber-50/50'
                    }`}>
                      <span className="w-6 text-center text-sm font-bold text-amber-400">#{i + 4}</span>
                      <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isMe ? 'text-amber-700' : 'text-amber-900'}`}>
                          {u.name} {isMe && <span className="text-xs font-normal text-amber-500">(you)</span>}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_BADGE[u.tier] || TIER_BADGE.BRONZE}`}>{u.tier}</span>
                      </div>
                      <span className="text-sm font-bold text-amber-600">{u.points?.toLocaleString()}</span>
                    </div>
                  )
                })}
                {leaderboard.length === 0 && (
                  <div className="text-center py-8 text-amber-500/60">
                    <Trophy className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No data yet. Start earning!</p>
                  </div>
                )}
              </div>
              <div className="px-6 pb-6">
                <button onClick={() => setShowLeaderboard(false)} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-2xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg">
                  Keep Earning ☕
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Tier Perks Modal */}
        {showTierPerks && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 p-4" onClick={() => setShowTierPerks(false)}>
            <motion.div initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 25 }}
              onClick={e => e.stopPropagation()} className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className={`bg-gradient-to-r ${TIER_STYLES[tier]} px-6 py-5 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-white" />
                  <div>
                    <h3 className="font-display text-lg font-bold text-white">{tier} Member Perks</h3>
                    <p className="text-white/70 text-xs">Your active benefits</p>
                  </div>
                </div>
                <button onClick={() => setShowTierPerks(false)} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 space-y-3">
                {TIER_PERKS[tier]?.map((perk, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl">
                    <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                    </div>
                    <span className="text-amber-900 text-sm font-medium">{perk}</span>
                  </div>
                ))}
                {tier !== 'VIP' && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100">
                    <p className="text-amber-700 text-xs font-semibold mb-1">Next tier: {Object.keys(TIER_NEXT).find((_, i) => Object.keys(TIER_NEXT)[i - 1] === tier) || 'VIP'}</p>
                    <p className="text-amber-500 text-xs">{pointsToNext} more points to unlock better perks</p>
                  </div>
                )}
              </div>
              <div className="px-6 pb-6">
                <button onClick={() => setShowTierPerks(false)} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-2xl">
                  Got it!
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Redeem Confirmation Modal */}
        {redeemConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setRedeemConfirm(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', damping: 20 }}
              onClick={e => e.stopPropagation()} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <div className="text-center mb-5">
                <div className="text-5xl mb-3">{redeemConfirm.emoji}</div>
                <h3 className="font-bold text-amber-900 text-lg">{redeemConfirm.title}</h3>
                <p className="text-amber-600 text-sm mt-1">This will use <span className="font-bold">{redeemConfirm.pointsCost} points</span></p>
                <p className="text-amber-400 text-xs mt-1">You have {points.toLocaleString()} pts · {points - redeemConfirm.pointsCost >= 0 ? `${(points - redeemConfirm.pointsCost).toLocaleString()} remaining` : 'Not enough points'}</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setRedeemConfirm(null)} variant="outline" className="flex-1 border-amber-200 text-amber-700">Cancel</Button>
                <Button onClick={() => redeemReward(redeemConfirm)} disabled={points < redeemConfirm.pointsCost}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold disabled:opacity-50">
                  Confirm Redeem
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Review Claim Modal */}
        {showReviewClaim && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4" onClick={() => setShowReviewClaim(false)}>
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-900">Claim Review Points</h3>
                  <p className="text-amber-600 text-sm">+50 points for your Google review</p>
                </div>
              </div>
              <p className="text-amber-700/70 text-sm mb-4">
                Enter the Google display name you used when leaving your review so we can verify it.
              </p>
              <Input
                placeholder="Your Google display name (e.g. Abebe K.)"
                value={reviewUsername}
                onChange={e => setReviewUsername(e.target.value)}
                className="h-12 border-amber-200 focus:border-amber-400 mb-3"
              />
              <div className="flex gap-3">
                <Button onClick={() => setShowReviewClaim(false)} variant="outline" className="flex-1 border-amber-200 text-amber-700">
                  Cancel
                </Button>
                <Button onClick={claimReviewPoints} disabled={claimingReview} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold">
                  {claimingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Claim 50 Points'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Rewards Catalog */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-bold text-amber-900 dark:text-amber-100">{t('redeemRewards')}</h3>
            <Link href="/rewards" className="text-amber-600 text-sm flex items-center gap-1 hover:text-amber-700">
              {t('viewAll')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {loading ? (
              // Skeleton loaders
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 bg-white rounded-2xl p-4 border border-amber-100 w-36 animate-pulse">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg mb-2" />
                  <div className="h-4 bg-amber-100 rounded w-20 mb-2" />
                  <div className="h-3 bg-amber-50 rounded w-16" />
                </div>
              ))
            ) : catalog.length === 0 ? (
              <div className="w-full py-8 text-center text-amber-500/60">
                <Gift className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No rewards available yet</p>
              </div>
            ) : catalog.map((item) => (
              <button key={item.id} onClick={() => setRedeemConfirm(item)} className="text-left">
                <div className="flex-shrink-0 bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-amber-100 dark:border-zinc-700 shadow-sm w-36 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md transition-all active:scale-95">
                  <div className="text-3xl mb-2">{item.emoji}</div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm leading-tight">{item.title}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-3 h-3 text-amber-500 fill-current" />
                    <p className="text-amber-600 text-xs font-medium">{item.pointsCost} pts</p>
                  </div>
                  <div className={`mt-2 text-xs px-2 py-0.5 rounded-full text-center font-medium ${points >= item.pointsCost ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {points >= item.pointsCost ? 'Tap to Redeem' : `Need ${item.pointsCost - points} more`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-bold text-amber-900 dark:text-amber-100">{t('recentActivity')}</h3>
            <Link href="/history" className="text-amber-600 text-sm flex items-center gap-1 hover:text-amber-700">
              {t('viewAll')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-amber-100 dark:border-zinc-700 shadow-sm overflow-hidden">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className={`p-4 flex items-center gap-3 animate-pulse ${i < 2 ? 'border-b border-amber-50' : ''}`}>
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-amber-100 rounded w-40 mb-1" />
                    <div className="h-3 bg-amber-50 rounded w-24" />
                  </div>
                  <div className="h-4 bg-amber-100 rounded w-10" />
                </div>
              ))
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-amber-600/60">
                <Wallet className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No activity yet. Start scanning!</p>
              </div>
            ) : (
              transactions.map((tx, i) => (
                <div key={tx.id} className={`p-4 flex items-center justify-between ${i < transactions.length - 1 ? 'border-b border-amber-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'earned' ? 'bg-green-100' : tx.type === 'redeemed' ? 'bg-amber-100' : 'bg-purple-100'}`}>
                      {tx.type === 'earned' ? <TrendingUp className="w-5 h-5 text-green-600" /> : tx.type === 'redeemed' ? <Gift className="w-5 h-5 text-amber-600" /> : <Star className="w-5 h-5 text-purple-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-amber-900 dark:text-amber-100 text-sm">{tx.description}</p>
                      <p className="text-amber-500 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Menu */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-6 space-y-2">
          {menuItems.map((item) => (
            <Link key={item.href + item.label} href={item.href}>
              <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 flex items-center justify-between border border-amber-100 dark:border-zinc-700 hover:border-amber-200 dark:hover:border-amber-600 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="font-medium text-amber-900 dark:text-amber-100">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-300 dark:text-amber-600" />
              </div>
            </Link>
          ))}
        </motion.div>
      </main>

      <BottomNav />
    </div>
  )
}
