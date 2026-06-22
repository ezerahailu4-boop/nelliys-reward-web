'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Trophy, Crown, Medal, Award, ArrowRight, ArrowLeft,
  Users, TrendingUp, Zap, Loader2, Coffee, Star, Flame
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const TIER_GRADIENT: Record<string, string> = {
  BRONZE: 'from-amber-600 to-amber-800',
  SILVER: 'from-slate-400 to-slate-600',
  GOLD: 'from-yellow-400 to-amber-500',
  VIP: 'from-purple-500 to-pink-500',
}
const TIER_BADGE: Record<string, string> = {
  BRONZE: 'bg-amber-100 text-amber-700 border-amber-200',
  SILVER: 'bg-slate-100 text-slate-600 border-slate-200',
  GOLD: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  VIP: 'bg-purple-100 text-purple-700 border-purple-200',
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard/public')
      .then(r => r.text())
      .then(t => { try { setLeaderboard(JSON.parse(t).leaderboard || []) } catch {} })
      .finally(() => setLoading(false))
  }, [])

  const top3 = leaderboard.slice(0, 3)
  // podium display order: 2nd | 1st | 3rd
  const podium = [
    { user: top3[1], rank: 2, height: 'h-28', gradient: 'from-slate-300 to-slate-500', ring: 'ring-slate-300/40', size: 'w-16 h-16 text-xl', icon: <Medal className="w-5 h-5" /> },
    { user: top3[0], rank: 1, height: 'h-40', gradient: 'from-yellow-400 to-amber-500', ring: 'ring-yellow-400/50', size: 'w-22 h-22 text-2xl', icon: <Crown className="w-7 h-7" /> },
    { user: top3[2], rank: 3, height: 'h-16', gradient: 'from-amber-600 to-amber-800', ring: 'ring-amber-600/30', size: 'w-14 h-14 text-lg', icon: <Award className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-950 via-amber-900 to-orange-950">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden pb-0">
        {/* bg orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-60 bg-amber-500/10 blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-8">
          {/* back */}
          <Link href="/" className="inline-flex items-center gap-2 text-amber-400 hover:text-white transition-colors mb-10 group text-sm font-medium">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          {/* title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img src="/Nelliys Logo Coffee-01.png" alt="Nelliy's Coffee" className="h-20 w-auto object-contain brightness-0 invert opacity-90" />
            </div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="font-display text-5xl sm:text-6xl font-bold text-white mb-3 tracking-tight">
              Leaderboard
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-amber-300/70 text-lg">
              Nelliy's most loyal coffee lovers ☕
            </motion.p>
          </div>

          {/* stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-3 mb-12">
            {[
              { icon: Users, label: 'Members', value: loading ? '—' : `${leaderboard.length}` },
              { icon: TrendingUp, label: 'Top Score', value: loading ? '—' : (leaderboard[0]?.points?.toLocaleString() || '—') },
              { icon: Flame, label: 'Top Tier', value: loading ? '—' : (leaderboard[0]?.tier || '—') },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}
                className="bg-white/8 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
                <s.icon className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                <p className="text-white font-bold text-xl">{s.value}</p>
                <p className="text-amber-400/60 text-xs mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ── Podium ── */}
        {!loading && top3.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, type: 'spring' }}
            className="max-w-sm mx-auto px-6">
            <div className="flex items-end justify-center gap-3">
              {podium.map((p, i) => {
                if (!p.user) return null
                return (
                  <div key={p.rank} className="flex flex-col items-center gap-2 flex-1">
                    {p.rank === 1 ? (
                      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className={`${p.size} w-20 h-20 bg-gradient-to-br ${p.gradient} rounded-full flex items-center justify-center text-white font-bold shadow-2xl ring-4 ${p.ring}`}>
                        {p.user.name?.[0]?.toUpperCase()}
                      </motion.div>
                    ) : (
                      <div className={`${p.size} bg-gradient-to-br ${p.gradient} rounded-full flex items-center justify-center text-white font-bold shadow-xl ring-4 ${p.ring}`}>
                        {p.user.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <p className="text-white font-semibold text-sm text-center truncate w-full px-1 leading-tight">
                      {p.user.name?.split(' ')[0]}
                    </p>
                    <p className={`text-xs font-bold ${p.rank === 1 ? 'text-yellow-300' : 'text-amber-400/70'}`}>
                      {p.user.points?.toLocaleString()} pts
                    </p>
                    <div className={`bg-gradient-to-b ${p.gradient} ${p.height} w-full rounded-t-2xl flex flex-col items-center justify-center gap-1 shadow-xl`}>
                      {p.icon}
                      <span className="text-white font-bold text-sm">{p.rank === 1 ? '1st' : p.rank === 2 ? '2nd' : '3rd'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Ranked List ── */}
      <div className="bg-gradient-to-b from-amber-50 to-orange-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-24">
              <Trophy className="w-16 h-16 text-amber-300 mx-auto mb-4" />
              <h3 className="font-display text-2xl font-bold text-amber-900 mb-2">No members yet</h3>
              <p className="text-amber-600 mb-6">Be the first to claim the top spot!</p>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg px-8">
                  Join Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-amber-200" />
                <span className="text-amber-500 text-xs font-bold uppercase tracking-widest">All Rankings</span>
                <div className="h-px flex-1 bg-amber-200" />
              </div>

              <div className="space-y-3">
                {leaderboard.map((u, i) => {
                  const maxPts = leaderboard[0]?.points || 1
                  const pct = Math.max(4, Math.round((u.points / maxPts) * 100))
                  const isFirst = i === 0
                  const isSecond = i === 1
                  const isThird = i === 2

                  return (
                    <motion.div key={u.id}
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`bg-white rounded-2xl p-4 border transition-all hover:shadow-lg ${
                        isFirst  ? 'border-yellow-300 shadow-lg shadow-yellow-100 ring-1 ring-yellow-200' :
                        isSecond ? 'border-slate-200 shadow-md' :
                        isThird  ? 'border-amber-300 shadow-md shadow-amber-50' :
                        'border-amber-100 hover:border-amber-200'
                      }`}>
                      <div className="flex items-center gap-3">
                        {/* rank badge */}
                        <div className="w-10 flex-shrink-0 flex items-center justify-center">
                          {isFirst ? (
                            <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                              <Crown className="w-4 h-4 text-white" />
                            </div>
                          ) : isSecond ? (
                            <div className="w-9 h-9 bg-gradient-to-br from-slate-300 to-slate-500 rounded-xl flex items-center justify-center shadow-md">
                              <Medal className="w-4 h-4 text-white" />
                            </div>
                          ) : isThird ? (
                            <div className="w-9 h-9 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center shadow-md">
                              <Award className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <span className="text-amber-400 font-bold text-base w-full text-center">#{i + 1}</span>
                          )}
                        </div>

                        {/* avatar */}
                        <div className={`w-12 h-12 bg-gradient-to-br ${TIER_GRADIENT[u.tier] || TIER_GRADIENT.BRONZE} rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md`}>
                          {u.name?.[0]?.toUpperCase()}
                        </div>

                        {/* info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <p className="font-bold text-amber-900 truncate">{u.name}</p>
                            {isFirst && <span className="text-sm">👑</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${TIER_BADGE[u.tier] || TIER_BADGE.BRONZE}`}>
                              {u.tier}
                            </span>
                            <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 1.2, delay: i * 0.05 + 0.3, ease: 'easeOut' }}
                                className={`h-full bg-gradient-to-r ${TIER_GRADIENT[u.tier] || TIER_GRADIENT.BRONZE} rounded-full`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* points */}
                        <div className="text-right flex-shrink-0 ml-1">
                          <p className={`font-bold text-lg ${isFirst ? 'text-yellow-600' : 'text-amber-800'}`}>
                            {u.points?.toLocaleString()}
                          </p>
                          <p className="text-amber-400 text-xs">points</p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* CTA */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                className="mt-10 relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 text-center shadow-2xl">
                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/10 rounded-full" />
                <div className="relative">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Coffee className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white mb-2">Want to be on this list?</h3>
                  <p className="text-white/80 mb-6 text-sm max-w-xs mx-auto">
                    Join Nelliy's Rewards and start earning points on every coffee you buy.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/register">
                      <Button className="bg-white text-amber-700 hover:bg-amber-50 font-bold shadow-xl px-8 h-12">
                        Join Free <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 px-8 h-12">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* back link */}
              <div className="text-center mt-8">
                <Link href="/" className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-700 text-sm font-medium transition-colors group">
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
