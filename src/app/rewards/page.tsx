'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Gift, Star, Loader2, Lock, ExternalLink, X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import BottomNav from '@/components/ui/BottomNav'
import { useTranslations } from '@/lib/i18n'
import type { LangCode } from '@/lib/constants'

const CATEGORY_COLORS: Record<string, string> = {
  drink: 'from-amber-400 to-orange-500',
  food: 'from-orange-400 to-red-400',
  discount: 'from-blue-400 to-cyan-500',
  vip: 'from-purple-500 to-pink-500',
}

const GOOGLE_REVIEW_URL = 'https://www.google.com/maps/place/Nelliy%27s+Coffee/@9.0012867,38.7672743,3a,75y,90t/data=!3m8!1e2!3m6!1sCIABIhC1snQdltRynRnnEDKZgB11!2e10!3e12!6shttps:%2F%2Flh3.googleusercontent.com%2Fgps-cs-s%2FAHVAweqBodE_O19FkhdZYXCmpyG465nOROVlhp66yD0_AfkblhukvbPrjtD7x6SNKSnLpbIDecly1Q8BD_Vf8Q3tC-Dggf0kVd0N7cZJGvl-Guk0-HW7V1gwqGCMKz9xaij-ONOaP743mWH3a7yl%3Dw203-h270-k-no!7i3464!8i4618!4m7!3m6!1s0x164b850055638aad:0xfeef3167f87e10e3!8m2!3d9.0012587!4d38.7673834!10e5!16s%2Fg%2F11yjl_9sly'

function CatalogSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-amber-50 dark:border-zinc-800 flex items-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-zinc-800 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-amber-100 dark:bg-zinc-800 rounded w-3/4" />
            <div className="h-3 bg-amber-50 dark:bg-zinc-800/60 rounded w-1/3" />
          </div>
          <div className="w-16 h-9 bg-amber-100 dark:bg-zinc-800 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export default function RewardsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [lang, setLang] = useState<LangCode>('en')
  const t = useTranslations(lang)

  const [catalog, setCatalog] = useState<any[]>([])
  const [myRewards, setMyRewards] = useState<any[]>([])
  const [userPoints, setUserPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [tab, setTab] = useState<'catalog' | 'mine'>('catalog')

  // Review claim modal state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [googleUsername, setGoogleUsername] = useState('')
  const [claimingReview, setClaimingReview] = useState(false)
  const [alreadyClaimedReview, setAlreadyClaimedReview] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    const saved = localStorage.getItem('nelliy_lang') as LangCode
    if (saved && ['en', 'am', 'or'].includes(saved)) setLang(saved)
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/rewards/list')
      .then(r => r.json())
      .then(d => {
        setCatalog(d.catalog || [])
        setMyRewards(d.rewards || [])
        setUserPoints(d.userPoints || 0)
      })
      .finally(() => setLoading(false))
  }, [status])

  const redeem = async (rewardId: string) => {
    setRedeeming(rewardId)
    try {
      const res = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Redemption failed')
      toast.success('Reward redeemed! Check "My Rewards" for your code.')
      setMyRewards(prev => [data.reward, ...prev])
      const item = catalog.find(c => c.id === rewardId)
      if (item) setUserPoints(prev => prev - item.pointsCost)
      setTab('mine')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setRedeeming(null)
    }
  }

  const handleClaimReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!googleUsername.trim()) return toast.error(t('googleUsernamePrompt'))
    setClaimingReview(true)
    try {
      const res = await fetch('/api/reviews/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleUsername: googleUsername.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) setAlreadyClaimedReview(true)
        return toast.error(data.error || 'Could not claim review bonus')
      }
      toast.success(data.message || '+50 points added for your review!')
      setUserPoints(prev => prev + 50)
      setShowReviewModal(false)
      setAlreadyClaimedReview(true)
    } catch {
      toast.error('Failed to claim bonus')
    } finally {
      setClaimingReview(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-zinc-950 dark:to-zinc-900">
      <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber-100 dark:border-zinc-700">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-amber-700 dark:text-amber-400 hover:text-amber-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <h1 className="font-display text-lg font-bold text-amber-900 dark:text-amber-100">{t('myRewards')}</h1>
          <div className="flex items-center gap-1 bg-amber-100 dark:bg-zinc-800 rounded-xl px-3 py-1.5 border border-amber-200/60 dark:border-zinc-700">
            <Star className="w-4 h-4 text-amber-500 fill-current" />
            <span className="font-bold text-amber-800 dark:text-amber-300 text-sm">{userPoints.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 pb-28">
        {/* Google Review Bonus Promo Card */}
        {!alreadyClaimedReview && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <Star className="w-6 h-6 text-white fill-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{t('rateUsGoogle')}</p>
                <p className="text-white/80 text-xs">{t('rateUsGoogleDesc')}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-3.5 pt-3 border-t border-white/20">
              <a
                href={GOOGLE_REVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold text-center flex items-center justify-center gap-1 transition-all"
              >
                <span>Review on Google</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setShowReviewModal(true)}
                className="flex-1 py-2 rounded-xl bg-white text-amber-600 hover:bg-amber-50 text-xs font-bold text-center shadow-sm transition-all"
              >
                {t('claimBonus')}
              </button>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-amber-100/80 dark:bg-zinc-800 rounded-2xl mb-6">
          {(['catalog', 'mine'] as const).map(tabKey => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === tabKey
                  ? 'bg-white dark:bg-zinc-900 text-amber-900 dark:text-amber-100 shadow-sm'
                  : 'text-amber-700 dark:text-zinc-400 hover:text-amber-900'
              }`}
            >
              {tabKey === 'catalog' ? `🎁 ${t('redeemRewards')}` : `🏷️ ${t('myRewards')}${myRewards.length > 0 ? ` (${myRewards.length})` : ''}`}
            </button>
          ))}
        </div>

        {tab === 'catalog' && (
          loading ? <CatalogSkeleton /> : (
            <div className="space-y-3">
              {catalog.length === 0 ? (
                <div className="text-center py-16">
                  <Gift className="w-16 h-16 text-amber-200 mx-auto mb-4" />
                  <p className="text-amber-700 font-semibold">No rewards available yet</p>
                </div>
              ) : catalog.map((item, i) => {
                const canAfford = userPoints >= item.pointsCost
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`bg-white dark:bg-zinc-900 rounded-2xl p-4 border shadow-sm flex items-center gap-4 transition-all ${
                      canAfford
                        ? 'border-amber-100 dark:border-zinc-800 hover:border-amber-300'
                        : 'border-gray-100 dark:border-zinc-800 opacity-70'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${CATEGORY_COLORS[item.category] || 'from-amber-400 to-orange-500'} flex items-center justify-center text-3xl flex-shrink-0 shadow-md`}>
                      {item.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-amber-950 dark:text-amber-100 text-sm">{item.title}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                        <span className="text-amber-600 dark:text-amber-400 text-xs font-bold">{item.pointsCost} pts</span>
                      </div>
                      {!canAfford && (
                        <p className="text-xs text-gray-400 mt-0.5">Need {item.pointsCost - userPoints} more pts</p>
                      )}
                    </div>
                    <Button
                      onClick={() => redeem(item.id)}
                      disabled={!canAfford || redeeming === item.id}
                      size="sm"
                      className={`flex-shrink-0 font-semibold text-xs ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {redeeming === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : canAfford ? (
                        t('confirm')
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          )
        )}

        {tab === 'mine' && (
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-amber-50 dark:border-zinc-800 animate-pulse space-y-3">
                    <div className="flex justify-between">
                      <div className="h-4 bg-amber-100 dark:bg-zinc-800 rounded w-1/2" />
                      <div className="h-5 w-16 bg-amber-50 dark:bg-zinc-800 rounded-full" />
                    </div>
                    <div className="h-14 bg-amber-50 dark:bg-zinc-800 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : myRewards.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-amber-100 dark:border-zinc-800 p-8">
                <Gift className="w-14 h-14 text-amber-300 mx-auto mb-3" />
                <p className="text-amber-900 dark:text-amber-100 font-bold">No active rewards</p>
                <p className="text-amber-600/70 text-xs mt-1 mb-4">Redeem your points for free drinks and pastries!</p>
                <Button onClick={() => setTab('catalog')} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold">
                  Browse Catalog
                </Button>
              </div>
            ) : (
              myRewards.map((reward, i) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-white dark:bg-zinc-900 rounded-2xl p-5 border shadow-sm ${
                    reward.status === 'ACTIVE'
                      ? 'border-green-200 dark:border-green-900/50'
                      : 'border-gray-100 dark:border-zinc-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-amber-900 dark:text-amber-100 text-sm">{reward.title}</p>
                    <Badge className={reward.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-0' : 'bg-gray-100 text-gray-500 border-0'}>
                      {reward.status}
                    </Badge>
                  </div>
                  <div className="bg-amber-50 dark:bg-zinc-800/80 rounded-xl p-3 text-center border border-amber-100 dark:border-zinc-700">
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-1 font-semibold uppercase tracking-wider">Redemption Code</p>
                    <p className="font-mono font-bold text-amber-950 dark:text-amber-100 text-lg tracking-widest">{reward.code}</p>
                  </div>
                  {reward.expiresAt && (
                    <p className="text-[11px] text-amber-600/70 dark:text-zinc-400 mt-2 text-center">
                      Expires {new Date(reward.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Claim Review Modal */}
        <AnimatePresence>
          {showReviewModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowReviewModal(false)}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-amber-100 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <h3 className="font-display text-lg font-bold text-amber-900 dark:text-amber-100">
                      {t('claimBonus')}
                    </h3>
                  </div>
                  <button onClick={() => setShowReviewModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-amber-700/80 dark:text-zinc-400 mb-4 leading-relaxed">
                  Enter your Google display name so our system can verify your review and credit your account with 50 bonus points.
                </p>

                <form onSubmit={handleClaimReview} className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      placeholder="e.g. Abebe Bikila"
                      value={googleUsername}
                      onChange={e => setGoogleUsername(e.target.value)}
                      className="border-amber-200 focus:border-amber-400 dark:bg-zinc-800 h-11"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={claimingReview}
                    className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md"
                  >
                    {claimingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : t('submitClaim')}
                  </Button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  )
}
