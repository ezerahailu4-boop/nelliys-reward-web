'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, Gift, Star, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import BottomNav from '@/components/ui/BottomNav'

const TYPE_STYLES: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  earned:     { bg: 'bg-green-100',  text: 'text-green-600',  icon: TrendingUp, label: 'Earned' },
  redeemed:   { bg: 'bg-amber-100',  text: 'text-amber-600',  icon: Gift,       label: 'Redeemed' },
  bonus:      { bg: 'bg-purple-100', text: 'text-purple-600', icon: Star,       label: 'Bonus' },
  adjustment: { bg: 'bg-blue-100',   text: 'text-blue-600',   icon: Filter,     label: 'Adjusted' },
}

const FILTERS = ['all', 'earned', 'redeemed', 'bonus']

function Skeleton() {
  return (
    <div className="space-y-2">
      <div className="flex gap-2 mb-5">
        {FILTERS.map(f => <div key={f} className="h-9 w-20 bg-amber-100 rounded-xl animate-pulse" />)}
      </div>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-amber-50 animate-pulse">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-amber-100 rounded w-3/4" />
            <div className="h-2 bg-amber-50 rounded w-1/2" />
          </div>
          <div className="h-4 w-16 bg-amber-100 rounded" />
        </div>
      ))}
    </div>
  )
}

export default function HistoryPage() {
  const { status } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    setLoading(true)
    fetch(`/api/points/history?page=${page}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(d => {
        setTransactions(d.transactions || [])
        setTotalPages(d.pages || 1)
      })
      .catch(() => {
        setTransactions([])
        setTotalPages(1)
      })
      .finally(() => setLoading(false))
  }, [status, page])

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)

  // Summary stats
  const totalEarned = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalSpent = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-amber-700 hover:text-amber-900">
            <ArrowLeft className="w-5 h-5" /><span className="font-medium">Back</span>
          </Link>
          <h1 className="font-display text-lg font-bold text-amber-900">Points History</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 pb-28">
        {/* Summary bar */}
        {!loading && transactions.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white rounded-2xl p-3 border border-green-100 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-600 font-medium">Earned</p>
                <p className="font-bold text-green-700">+{totalEarned.toLocaleString()} pts</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-amber-100 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Gift className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-amber-600 font-medium">Redeemed</p>
                <p className="font-bold text-amber-700">-{totalSpent.toLocaleString()} pts</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === f ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-amber-700 border border-amber-200 hover:border-amber-400'}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? <Skeleton /> : filtered.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp className="w-16 h-16 text-amber-200 mx-auto mb-4" />
            <p className="text-amber-700 font-semibold">No transactions yet</p>
            <p className="text-amber-500 text-sm mt-1">Start scanning QR codes to earn points</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tx, i) => {
              const style = TYPE_STYLES[tx.type] || TYPE_STYLES.earned
              const Icon = style.icon
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-amber-50 shadow-sm"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                    <Icon className={`w-5 h-5 ${style.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-amber-900 text-sm truncate">{tx.description}</p>
                    <p className="text-amber-400 text-xs mt-0.5">
                      {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`font-bold text-sm flex-shrink-0 ${tx.amount > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} pts
                  </span>
                </motion.div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-10 h-10 rounded-xl bg-white border border-amber-200 text-amber-700 disabled:opacity-40 hover:border-amber-400 transition-all flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-amber-700 text-sm font-semibold px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-10 h-10 rounded-xl bg-white border border-amber-200 text-amber-700 disabled:opacity-40 hover:border-amber-400 transition-all flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
