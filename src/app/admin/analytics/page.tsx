'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, BarChart3, TrendingUp, Users, AlertTriangle, Loader2, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAdminAuth } from '@/lib/useAdminAuth'
import { adminFetch } from '@/lib/adminFetch'

const TIER_COLORS: Record<string, string> = {
  BRONZE: 'bg-amber-600',
  SILVER: 'bg-slate-400',
  GOLD: 'bg-yellow-400',
  VIP: 'bg-purple-500',
}

export default function AnalyticsPage() {
  const ready = useAdminAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    adminFetch('/api/admin/analytics').then(r => r.json()).then(setData).finally(() => setLoading(false))
  }, [ready])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
    </div>
  )

  const maxRevenue = Math.max(...(data?.dailyRevenue?.map((d: any) => d.revenue) || [1]))
  const totalTierUsers = data?.tierDistribution?.reduce((s: number, t: any) => s + t._count, 0) || 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-display text-lg font-bold text-white flex-1">Analytics</h1>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Last 30 days</Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Customers', value: data?.totalUsers || 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'New This Week', value: data?.newUsersThisWeek || 0, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Churn Risk', value: data?.churnRisk || 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'Retention Rate', value: `${data?.retentionRate || 0}%`, icon: Star, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-3`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-slate-400 text-xs">{card.label}</p>
              <p className="text-2xl font-bold text-white mt-0.5">{card.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" /> Daily Revenue (30 days)
            </h2>
            {data?.dailyRevenue?.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No revenue data yet</p>
            ) : (
              <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
                {data?.dailyRevenue?.map((d: any, i: number) => (
                  <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: 28 }}>
                    <div
                      className="w-5 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-sm transition-all hover:from-amber-500 hover:to-amber-300"
                      style={{ height: `${Math.max(4, (d.revenue / maxRevenue) * 130)}px` }}
                      title={`${d.day}: ${d.revenue.toFixed(0)} ETB`}
                    />
                    <span className="text-slate-600 text-[9px] rotate-45 origin-left whitespace-nowrap">{d.day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tier Distribution */}
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
            <h2 className="font-bold text-white mb-4">Member Tiers</h2>
            <div className="space-y-3">
              {data?.tierDistribution?.map((t: any) => (
                <div key={t.tier}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300 font-medium">{t.tier}</span>
                    <span className="text-slate-400">{t._count} ({Math.round((t._count / totalTierUsers) * 100)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${TIER_COLORS[t.tier] || 'bg-amber-500'}`}
                      style={{ width: `${(t._count / totalTierUsers) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {(!data?.tierDistribution || data.tierDistribution.length === 0) && (
                <p className="text-slate-500 text-sm text-center py-4">No data yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
          <h2 className="font-bold text-white mb-4">Top Selling Products</h2>
          {data?.topProducts?.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">No order data yet</p>
          ) : (
            <div className="space-y-3">
              {data?.topProducts?.map((p: any, i: number) => {
                const maxQty = data.topProducts[0]?.qty || 1
                return (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-slate-500 text-sm w-4">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-white font-medium">{p.name}</span>
                        <span className="text-amber-400 font-bold">{p.qty} sold</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                          style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Churn Risk Alert */}
        {(data?.churnRisk || 0) > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-400">Churn Risk Detected</p>
              <p className="text-slate-400 text-sm mt-1">
                <span className="text-white font-semibold">{data.churnRisk} customers</span> haven't ordered in the last 30 days.
                Consider sending a re-engagement campaign via{' '}
                <Link href="/admin/notify" className="text-amber-400 underline">Bulk Notifications</Link>.
              </p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
