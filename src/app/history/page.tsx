'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  TrendingUp, 
  Gift, 
  Star, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Receipt as ReceiptIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Building2,
  Calendar
} from 'lucide-react'
import BottomNav from '@/components/ui/BottomNav'
import { Badge } from '@/components/ui/badge'
import { useTranslations } from '@/lib/i18n'
import type { LangCode } from '@/lib/constants'

const TYPE_STYLES: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  earned:     { bg: 'bg-green-100 dark:bg-green-950/40',  text: 'text-green-600',  icon: TrendingUp, label: 'Earned' },
  redeemed:   { bg: 'bg-amber-100 dark:bg-amber-950/40',  text: 'text-amber-600',  icon: Gift,       label: 'Redeemed' },
  bonus:      { bg: 'bg-purple-100 dark:bg-purple-950/40', text: 'text-purple-600', icon: Star,       label: 'Bonus' },
  adjustment: { bg: 'bg-blue-100 dark:bg-blue-950/40',   text: 'text-blue-600',   icon: Filter,     label: 'Adjusted' },
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  APPROVED: { bg: 'bg-green-50 text-green-700 border-green-200', text: 'text-green-700', icon: CheckCircle2, label: 'Approved' },
  PENDING:  { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', icon: Clock, label: 'Pending Review' },
  FLAGGED:  { bg: 'bg-orange-50 text-orange-700 border-orange-200', text: 'text-orange-700', icon: AlertTriangle, label: 'Flagged' },
  REJECTED: { bg: 'bg-red-50 text-red-700 border-red-200', text: 'text-red-700', icon: XCircle, label: 'Rejected' },
}

const FILTERS = ['all', 'earned', 'redeemed', 'bonus']

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [lang, setLang] = useState<LangCode>('en')
  const t = useTranslations(lang)
  
  const [activeTab, setActiveTab] = useState<'points' | 'receipts'>('points')
  
  // Points state
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingPoints, setLoadingPoints] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState('all')

  // Receipts state
  const [receipts, setReceipts] = useState<any[]>([])
  const [loadingReceipts, setLoadingReceipts] = useState(false)
  const [receiptPage, setReceiptPage] = useState(1)
  const [receiptTotalPages, setReceiptTotalPages] = useState(1)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  // Sync language from localStorage or user data
  useEffect(() => {
    const saved = localStorage.getItem('nelliy_lang') as LangCode
    if (saved && ['en', 'am', 'or'].includes(saved)) {
      setLang(saved)
    }
  }, [])

  // Fetch points transactions
  useEffect(() => {
    if (status !== 'authenticated') return
    setLoadingPoints(true)
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
      .finally(() => setLoadingPoints(false))
  }, [status, page])

  // Fetch receipts history
  useEffect(() => {
    if (status !== 'authenticated' || activeTab !== 'receipts') return
    setLoadingReceipts(true)
    fetch(`/api/receipts/list?page=${receiptPage}`)
      .then(r => r.ok ? r.json() : {})
      .then(d => {
        setReceipts(d.receipts || [])
        setReceiptTotalPages(d.pages || 1)
      })
      .catch(() => {
        setReceipts([])
      })
      .finally(() => setLoadingReceipts(false))
  }, [status, activeTab, receiptPage])

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)

  // Summary stats
  const totalEarned = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalSpent = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-zinc-950 dark:to-zinc-900">
      <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber-100 dark:border-zinc-700">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-amber-700 dark:text-amber-400 hover:text-amber-900">
            <ArrowLeft className="w-5 h-5" /><span className="font-medium">Back</span>
          </Link>
          <h1 className="font-display text-lg font-bold text-amber-900 dark:text-amber-100">
            {t('history')}
          </h1>
          <div className="w-12" />
        </div>

        {/* Tab switch: Points vs Receipts */}
        <div className="max-w-md mx-auto px-4 pb-3 flex gap-2">
          <button
            onClick={() => setActiveTab('points')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'points'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-amber-100/70 text-amber-800 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-amber-200/70'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            {t('pointsHistory')}
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'receipts'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-amber-100/70 text-amber-800 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-amber-200/70'
            }`}
          >
            <ReceiptIcon className="w-3.5 h-3.5" />
            {t('receiptHistory')}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 pb-28">
        <AnimatePresence mode="wait">
          {activeTab === 'points' ? (
            <motion.div
              key="points-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Summary bar */}
              {!loadingPoints && transactions.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-green-100 dark:border-zinc-800 shadow-sm flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-100 dark:bg-green-950/40 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-green-600 font-medium">{t('filterEarned')}</p>
                      <p className="font-bold text-green-700 text-sm">+{totalEarned.toLocaleString()} pts</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 border border-amber-100 dark:border-zinc-800 shadow-sm flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-100 dark:bg-amber-950/40 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Gift className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-amber-600 font-medium">{t('filterRedeemed')}</p>
                      <p className="font-bold text-amber-700 text-sm">-{totalSpent.toLocaleString()} pts</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                      filter === f
                        ? 'bg-amber-900 text-white dark:bg-amber-500'
                        : 'bg-white dark:bg-zinc-800 text-amber-700 dark:text-zinc-300 border border-amber-100 dark:border-zinc-700'
                    }`}
                  >
                    {f === 'all' ? t('filterAll') : f === 'earned' ? t('filterEarned') : f === 'redeemed' ? t('filterRedeemed') : t('filterBonus')}
                  </button>
                ))}
              </div>

              {/* List */}
              {loadingPoints ? (
                <div className="space-y-2.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 flex items-center gap-3 border border-amber-50 dark:border-zinc-800 animate-pulse">
                      <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-zinc-800 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-amber-100 dark:bg-zinc-800 rounded w-3/4" />
                        <div className="h-2.5 bg-amber-50 dark:bg-zinc-800/60 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 text-center border border-amber-100 dark:border-zinc-800">
                  <Star className="w-10 h-10 text-amber-300 mx-auto mb-3" />
                  <h3 className="font-display text-lg font-bold text-amber-900 dark:text-amber-100">No transactions</h3>
                  <p className="text-amber-600/70 text-xs mt-1">Start earning points by scanning QR codes or uploading receipts!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filtered.map(item => {
                    const style = TYPE_STYLES[item.type] || TYPE_STYLES.earned
                    const Icon = style.icon
                    const isPositive = item.amount > 0

                    return (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-3.5 flex items-center gap-3 border border-amber-50 dark:border-zinc-800 shadow-sm"
                      >
                        <div className={`w-11 h-11 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${style.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-amber-950 dark:text-amber-100 text-sm truncate">
                            {item.description}
                          </p>
                          <p className="text-amber-600/70 dark:text-zinc-400 text-xs mt-0.5">
                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`font-bold text-base ${isPositive ? 'text-green-600' : 'text-amber-600'}`}>
                            {isPositive ? `+${item.amount}` : item.amount} pts
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-5 pt-3 border-t border-amber-100 dark:border-zinc-800">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-amber-100 dark:border-zinc-700 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4 text-amber-800 dark:text-zinc-200" />
                  </button>
                  <span className="text-xs text-amber-700 dark:text-zinc-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-amber-100 dark:border-zinc-700 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4 text-amber-800 dark:text-zinc-200" />
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            /* Receipts Tab */
            <motion.div
              key="receipts-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {loadingReceipts ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 space-y-3 border border-amber-50 dark:border-zinc-800 animate-pulse">
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-amber-100 dark:bg-zinc-800 rounded w-1/3" />
                        <div className="h-5 bg-amber-100 dark:bg-zinc-800 rounded-full w-20" />
                      </div>
                      <div className="h-3 bg-amber-50 dark:bg-zinc-800/60 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : receipts.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 text-center border border-amber-100 dark:border-zinc-800">
                  <ReceiptIcon className="w-10 h-10 text-amber-300 mx-auto mb-3" />
                  <h3 className="font-display text-lg font-bold text-amber-900 dark:text-amber-100">No receipts uploaded</h3>
                  <p className="text-amber-600/70 text-xs mt-1 mb-5">Upload your receipt photo to earn points automatically!</p>
                  <Link href="/upload">
                    <button className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md">
                      Upload Receipt Now
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {receipts.map(r => {
                    const statusConf = STATUS_CONFIG[r.status] || STATUS_CONFIG.PENDING
                    const StatusIcon = statusConf.icon

                    return (
                      <div
                        key={r.id}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-amber-100 dark:border-zinc-800 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <ReceiptIcon className="w-4 h-4 text-amber-600" />
                              <span className="font-bold text-amber-950 dark:text-amber-100 text-sm">
                                #{r.receiptNumber || 'Receipt'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-amber-700/70 dark:text-zinc-400 mt-1">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>{r.branch?.name || 'Nelliy’s Coffee'}</span>
                            </div>
                          </div>

                          <div className={`px-2.5 py-1 rounded-full border text-xs font-bold flex items-center gap-1 ${statusConf.bg}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            <span>{statusConf.label}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-amber-50 dark:border-zinc-800/80 text-xs">
                          <div className="text-amber-600/80 dark:text-zinc-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-amber-800 dark:text-zinc-300 font-medium">
                              {r.amount?.toFixed(2)} ETB
                            </span>
                            <span className="font-bold text-green-600 bg-green-50 dark:bg-green-950/40 px-2 py-0.5 rounded-md">
                              +{r.pointsEarned} pts
                            </span>
                          </div>
                        </div>

                        {/* Rejection / Fraud Reasons Feedback */}
                        {(r.status === 'REJECTED' || r.status === 'FLAGGED') && r.fraudReasons?.length > 0 && (
                          <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl text-xs">
                            <p className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-1 mb-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {t('reason')}:
                            </p>
                            <ul className="list-disc list-inside text-red-600/90 dark:text-red-300 space-y-0.5">
                              {r.fraudReasons.map((reason: string, idx: number) => (
                                <li key={idx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  )
}
