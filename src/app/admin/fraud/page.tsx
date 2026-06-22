'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAdminAuth } from '@/lib/useAdminAuth'
import { adminFetch } from '@/lib/adminFetch'

export default function FraudPage() {
  const ready = useAdminAuth()
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewLoading, setReviewLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    adminFetch('/api/admin/receipts?status=FLAGGED').then(r => r.json()).then(d => {
      const flagged = d.receipts?.filter((r: any) => r.fraudScore > 0.3) || []
      setReceipts(flagged)
    }).finally(() => setLoading(false))
  }, [ready])

  const reviewReceipt = async (id: string, action: 'approve' | 'reject') => {
    setReviewLoading(id)
    try {
      const res = await adminFetch('/api/admin/receipts', {
        method: 'PATCH',
        body: JSON.stringify({ receiptId: id, action }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Receipt ${action}d`)
      setReceipts(prev => prev.filter(r => r.id !== id))
    } catch {
      toast.error('Action failed')
    } finally {
      setReviewLoading(null)
    }
  }

  const highRisk = receipts.filter(r => r.fraudScore > 0.7)
  const mediumRisk = receipts.filter(r => r.fraudScore > 0.3 && r.fraudScore <= 0.7)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-display text-lg font-bold text-white flex-1">Fraud Detection</h1>
          {receipts.length > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              <AlertTriangle className="w-3 h-3 mr-1" />{receipts.length} flagged
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'High Risk', value: highRisk.length, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'Medium Risk', value: mediumRisk.length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Total Flagged', value: receipts.length, color: 'text-white', bg: 'bg-slate-700/50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-slate-700/50 text-center`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-slate-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : receipts.length === 0 ? (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-12 text-center">
            <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-white font-semibold text-lg">All Clear!</p>
            <p className="text-slate-400 text-sm mt-1">No suspicious receipts detected</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receipts.map((receipt, i) => (
              <motion.div key={receipt.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`bg-slate-800/60 rounded-2xl border p-5 ${receipt.fraudScore > 0.7 ? 'border-red-500/30' : 'border-amber-500/30'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white">{receipt.user?.name}</p>
                      <Badge className={`text-xs border-0 ${receipt.fraudScore > 0.7 ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {receipt.fraudScore > 0.7 ? '🚨 High Risk' : '⚠ Medium Risk'}
                      </Badge>
                      <Badge className="text-xs bg-slate-700 text-slate-300 border-0">
                        Score: {(receipt.fraudScore * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm">{receipt.user?.phone} • {receipt.branch?.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-white font-semibold">{receipt.amount} ETB</span>
                      <span className="text-amber-400">+{receipt.pointsEarned} pts</span>
                      <span className="text-slate-500">{new Date(receipt.createdAt).toLocaleDateString()}</span>
                    </div>
                    {receipt.fraudReasons?.length > 0 && (
                      <div className="mt-3 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                        <p className="text-red-400 text-xs font-semibold mb-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Fraud Indicators:
                        </p>
                        <ul className="text-red-300 text-xs space-y-0.5">
                          {receipt.fraudReasons.map((reason: string, idx: number) => (
                            <li key={idx}>• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" onClick={() => reviewReceipt(receipt.id, 'approve')} disabled={reviewLoading === receipt.id}
                      className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 h-9">
                      {reviewLoading === receipt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" onClick={() => reviewReceipt(receipt.id, 'reject')} disabled={reviewLoading === receipt.id}
                      className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 h-9">
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" /> How Fraud Detection Works
          </h3>
          <ul className="space-y-2 text-slate-400 text-sm">
            <li>• Receipts are automatically scored based on multiple factors</li>
            <li>• High-frequency submissions from same user trigger alerts</li>
            <li>• Duplicate or similar receipt amounts are flagged</li>
            <li>• Unusual patterns (time, location, amount) increase score</li>
            <li>• Manual review required for scores above 30%</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
