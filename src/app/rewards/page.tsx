'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Gift, Star, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import BottomNav from '@/components/ui/BottomNav'

const CATEGORY_COLORS: Record<string, string> = {
  drink: 'from-amber-400 to-orange-500',
  food: 'from-orange-400 to-red-400',
  discount: 'from-blue-400 to-cyan-500',
  vip: 'from-purple-500 to-pink-500',
}

function CatalogSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-amber-50 flex items-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-amber-100 rounded w-3/4" />
            <div className="h-3 bg-amber-50 rounded w-1/3" />
          </div>
          <div className="w-16 h-9 bg-amber-100 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export default function RewardsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [catalog, setCatalog] = useState<any[]>([])
  const [myRewards, setMyRewards] = useState<any[]>([])
  const [userPoints, setUserPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  const [tab, setTab] = useState<'catalog' | 'mine'>('catalog')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-amber-700 hover:text-amber-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <h1 className="font-display text-lg font-bold text-amber-900">Rewards</h1>
          <div className="flex items-center gap-1 bg-amber-100 rounded-xl px-3 py-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-current" />
            <span className="font-bold text-amber-800 text-sm">{userPoints.toLocaleString()}</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 pb-28">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-amber-100 rounded-2xl mb-6">
          {(['catalog', 'mine'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-white text-amber-900 shadow-sm' : 'text-amber-600 hover:text-amber-800'}`}
            >
              {t === 'catalog' ? '🎁 Redeem' : `🏷️ My Rewards${myRewards.length > 0 ? ` (${myRewards.length})` : ''}`}
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
                    className={`bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-4 transition-all ${canAfford ? 'border-amber-100 hover:border-amber-300 hover:shadow-md' : 'border-gray-100 opacity-70'}`}
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${CATEGORY_COLORS[item.category] || 'from-amber-400 to-orange-500'} flex items-center justify-center text-3xl flex-shrink-0 shadow-md`}>
                      {item.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-amber-900">{item.title}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                        <span className="text-amber-600 text-sm font-semibold">{item.pointsCost} pts</span>
                      </div>
                      {!canAfford && (
                        <p className="text-xs text-gray-400 mt-0.5">Need {item.pointsCost - userPoints} more pts</p>
                      )}
                    </div>
                    <Button
                      onClick={() => redeem(item.id)}
                      disabled={!canAfford || redeeming === item.id}
                      size="sm"
                      className={`flex-shrink-0 font-semibold ${canAfford ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    >
                      {redeeming === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : canAfford ? 'Redeem' : <Lock className="w-4 h-4" />}
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
                  <div key={i} className="bg-white rounded-2xl p-5 border border-amber-50 animate-pulse space-y-3">
                    <div className="flex justify-between">
                      <div className="h-4 bg-amber-100 rounded w-1/2" />
                      <div className="h-5 w-16 bg-amber-50 rounded-full" />
                    </div>
                    <div className="h-14 bg-amber-50 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : myRewards.length === 0 ? (
              <div className="text-center py-16">
                <Gift className="w-16 h-16 text-amber-200 mx-auto mb-4" />
                <p className="text-amber-700 font-semibold">No rewards yet</p>
                <p className="text-amber-500 text-sm mt-1">Redeem your points for free drinks & more</p>
                <Button onClick={() => setTab('catalog')} className="mt-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white">Browse Rewards</Button>
              </div>
            ) : (
              myRewards.map((reward, i) => (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-white rounded-2xl p-5 border shadow-sm ${reward.status === 'ACTIVE' ? 'border-green-200' : 'border-gray-100 opacity-60'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-amber-900">{reward.title}</p>
                    <Badge className={reward.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-0' : 'bg-gray-100 text-gray-500 border-0'}>
                      {reward.status}
                    </Badge>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-amber-600 mb-1">Redemption Code</p>
                    <p className="font-mono font-bold text-amber-900 text-lg tracking-widest">{reward.code}</p>
                  </div>
                  {reward.expiresAt && (
                    <p className="text-xs text-amber-500 mt-2 text-center">
                      Expires {new Date(reward.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
