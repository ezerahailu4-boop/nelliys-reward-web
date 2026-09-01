'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  FileText,
  User,
  Building2,
  ExternalLink,
  ZoomIn,
  X,
  Sparkles,
  Search,
  Filter
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useAdminAuth } from '@/lib/useAdminAuth'
import { adminFetch } from '@/lib/adminFetch'

const REJECTION_PRESETS = [
  'Blurry or unreadable receipt photo',
  'Not an authentic Nelliy’s Coffee receipt',
  'Receipt has already been claimed',
  'Total amount or receipt number is cut off',
  'Receipt is older than 48 hours',
]

export default function FraudPage() {
  const ready = useAdminAuth()
  const [receipts, setReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewLoading, setReviewLoading] = useState<string | null>(null)
  
  // Selected receipt for Inspector modal
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null)
  
  // Rejection dialog state
  const [rejectModalReceipt, setRejectModalReceipt] = useState<any | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'FLAGGED' | 'PENDING' | 'ALL'>('FLAGGED')

  const fetchReceipts = async () => {
    setLoading(true)
    try {
      const endpoint = statusFilter === 'ALL' ? '/api/admin/receipts' : `/api/admin/receipts?status=${statusFilter}`
      const res = await adminFetch(endpoint)
      const data = await res.json()
      setReceipts(data.receipts || [])
    } catch (err) {
      toast.error('Failed to load receipts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (ready) {
      fetchReceipts()
    }
  }, [ready, statusFilter])

  const reviewReceipt = async (id: string, action: 'approve' | 'reject', customReason?: string) => {
    setReviewLoading(id)
    try {
      const res = await adminFetch('/api/admin/receipts', {
        method: 'PATCH',
        body: JSON.stringify({ receiptId: id, action, reason: customReason }),
      })
      if (!res.ok) throw new Error()
      
      toast.success(`Receipt ${action === 'approve' ? 'Approved & Points Credited' : 'Rejected'}`)
      setReceipts(prev => prev.filter(r => r.id !== id))
      if (selectedReceipt?.id === id) setSelectedReceipt(null)
      if (rejectModalReceipt?.id === id) setRejectModalReceipt(null)
    } catch {
      toast.error('Action failed')
    } finally {
      setReviewLoading(null)
    }
  }

  const handleOpenRejectModal = (receipt: any) => {
    setRejectModalReceipt(receipt)
    setRejectReason(REJECTION_PRESETS[0])
  }

  const handleConfirmReject = () => {
    if (!rejectModalReceipt) return
    reviewReceipt(rejectModalReceipt.id, 'reject', rejectReason)
  }

  const filteredReceipts = receipts.filter(r => {
    const q = searchQuery.toLowerCase()
    return (
      r.user?.name?.toLowerCase().includes(q) ||
      r.user?.phone?.toLowerCase().includes(q) ||
      r.receiptNumber?.toLowerCase().includes(q) ||
      r.branch?.name?.toLowerCase().includes(q)
    )
  })

  const highRisk = receipts.filter(r => (r.fraudScore || 0) > 0.7)
  const mediumRisk = receipts.filter(r => (r.fraudScore || 0) > 0.3 && (r.fraudScore || 0) <= 0.7)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                Receipt Verification & Fraud Review
              </h1>
              <p className="text-xs text-slate-400">Inspect uploaded photos, verify amounts, and credit points</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              {(['FLAGGED', 'PENDING', 'ALL'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    statusFilter === tab ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'High Risk Flagged (>70%)', value: highRisk.length, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
            { label: 'Medium Risk Review (30-70%)', value: mediumRisk.length, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { label: 'Total Under Review', value: receipts.length, color: 'text-white', bg: 'bg-slate-800/80', border: 'border-slate-700/50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} ${s.border} rounded-2xl p-5 border text-center`}>
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-slate-400 text-xs mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by customer name, phone, branch, or receipt number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-11"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
            <p className="text-slate-400 text-sm">Loading receipt submissions...</p>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="bg-slate-800/40 rounded-3xl border border-slate-700/50 p-16 text-center">
            <Shield className="w-16 h-16 text-green-400 mx-auto mb-4 opacity-80" />
            <p className="text-white font-bold text-xl mb-1">All Clear!</p>
            <p className="text-slate-400 text-sm">No receipts currently pending manual review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredReceipts.map((receipt, i) => {
              const isHigh = (receipt.fraudScore || 0) > 0.7
              const isMed = (receipt.fraudScore || 0) > 0.3 && !isHigh

              return (
                <motion.div
                  key={receipt.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`bg-slate-900/90 rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                    isHigh ? 'border-red-500/40 hover:border-red-500/70' : isMed ? 'border-amber-500/40 hover:border-amber-500/70' : 'border-slate-700/50'
                  }`}
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">{receipt.user?.name || 'Customer'}</span>
                          {receipt.user?.tier && (
                            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0.2">
                              {receipt.user.tier}
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">{receipt.user?.phone} • {receipt.branch?.name || "Nelliy's Coffee"}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-white">{receipt.amount?.toLocaleString()} ETB</span>
                        <p className="text-emerald-400 text-xs font-semibold">+{receipt.pointsEarned} pts</p>
                      </div>
                    </div>

                    {/* Receipt photo thumbnail + summary */}
                    <div className="flex gap-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 mb-3">
                      {receipt.imageUrl ? (
                        <div
                          onClick={() => setSelectedReceipt(receipt)}
                          className="relative w-20 h-24 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0 cursor-pointer group"
                        >
                          <img
                            src={receipt.imageUrl}
                            alt="Receipt"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ZoomIn className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-20 h-24 rounded-lg bg-slate-900 border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 text-[10px] p-1 text-center flex-shrink-0">
                          <FileText className="w-5 h-5 mb-1 text-slate-600" />
                          No Image
                        </div>
                      )}

                      <div className="flex-1 text-xs space-y-1.5">
                        <div className="flex justify-between text-slate-400">
                          <span>Receipt Number:</span>
                          <span className="font-mono text-slate-200">{receipt.receiptNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Uploaded:</span>
                          <span className="text-slate-300">{new Date(receipt.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Risk Score:</span>
                          <span className={`font-bold ${isHigh ? 'text-red-400' : isMed ? 'text-amber-400' : 'text-green-400'}`}>
                            {((receipt.fraudScore || 0) * 100).toFixed(0)}%
                          </span>
                        </div>

                        {receipt.imageUrl && (
                          <button
                            onClick={() => setSelectedReceipt(receipt)}
                            className="text-amber-400 hover:text-amber-300 font-semibold text-[11px] flex items-center gap-1 mt-1 pt-1 border-t border-slate-800/80 w-full"
                          >
                            <Eye className="w-3.5 h-3.5" /> Inspect Full Photo & OCR Text
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Fraud reasons list */}
                    {receipt.fraudReasons?.length > 0 && (
                      <div className="mb-4 p-2.5 bg-red-500/10 rounded-xl border border-red-500/20">
                        <p className="text-red-400 text-[11px] font-semibold flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3 h-3" /> Flagged Reasons:
                        </p>
                        <ul className="text-red-300 text-[11px] space-y-0.5 pl-3 list-disc">
                          {receipt.fraudReasons.map((reason: string, idx: number) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex gap-2 pt-3 border-t border-slate-800">
                    <Button
                      onClick={() => setSelectedReceipt(receipt)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-9"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" /> Inspect
                    </Button>
                    <Button
                      onClick={() => handleOpenRejectModal(receipt)}
                      disabled={reviewLoading === receipt.id}
                      size="sm"
                      className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-xs h-9 px-3"
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button
                      onClick={() => reviewReceipt(receipt.id, 'approve')}
                      disabled={reviewLoading === receipt.id}
                      size="sm"
                      className="bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 text-xs h-9 px-4 shadow-lg shadow-emerald-500/20"
                    >
                      {reviewLoading === receipt.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve (+{receipt.pointsEarned} pts)
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Side-by-Side Photo & OCR Inspector Modal */}
        <AnimatePresence>
          {selectedReceipt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-8"
              onClick={() => setSelectedReceipt(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>Receipt Review — {selectedReceipt.receiptNumber}</span>
                    </h2>
                    <p className="text-xs text-slate-400">{selectedReceipt.user?.name} ({selectedReceipt.user?.phone}) • {selectedReceipt.branch?.name}</p>
                  </div>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body: Split view */}
                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  {/* Left: Receipt Photo */}
                  <div className="flex flex-col">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Original Uploaded Photo</span>
                      {selectedReceipt.imageUrl && (
                        <a
                          href={selectedReceipt.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          Full Screen <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </h3>
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex-1 min-h-[350px] flex items-center justify-center relative group">
                      {selectedReceipt.imageUrl ? (
                        <img
                          src={selectedReceipt.imageUrl}
                          alt="Receipt"
                          className="max-h-[500px] w-full object-contain"
                        />
                      ) : (
                        <div className="text-slate-500 text-center p-8">
                          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No receipt image file available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Detected Data & OCR Text */}
                  <div className="flex flex-col space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detected Summary</h3>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Total Bill Amount:</span>
                          <span className="text-white font-bold text-sm">{selectedReceipt.amount?.toLocaleString()} ETB</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Points to Award:</span>
                          <span className="text-emerald-400 font-bold text-sm">+{selectedReceipt.pointsEarned} pts</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-900">
                          <span className="text-slate-400">Fiscal / FS No:</span>
                          <span className="font-mono text-slate-200">{selectedReceipt.ocrData?.extractedFiscalNumber || 'None detected'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-400">Risk Score:</span>
                          <span className={`font-bold ${selectedReceipt.fraudScore > 0.7 ? 'text-red-400' : 'text-amber-400'}`}>
                            {((selectedReceipt.fraudScore || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* OCR Text Box */}
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-amber-400" /> Extracted Raw OCR Text
                      </h3>
                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 font-mono text-[11px] text-slate-300 flex-1 max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                        {selectedReceipt.ocrData?.rawText || 'No OCR text available.'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
                  <Button
                    onClick={() => setSelectedReceipt(null)}
                    variant="ghost"
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Close
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleOpenRejectModal(selectedReceipt)}
                      disabled={reviewLoading === selectedReceipt.id}
                      className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 text-xs font-semibold"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" /> Reject with Reason
                    </Button>
                    <Button
                      onClick={() => reviewReceipt(selectedReceipt.id, 'approve')}
                      disabled={reviewLoading === selectedReceipt.id}
                      className="bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 text-xs shadow-lg shadow-emerald-500/20"
                    >
                      {reviewLoading === selectedReceipt.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1.5" /> Approve & Credit {selectedReceipt.pointsEarned} Pts
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rejection Reason Modal */}
        <AnimatePresence>
          {rejectModalReceipt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setRejectModalReceipt(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mb-4">
                  <XCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Reject Receipt Submission</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Select or type the reason for rejection. This explanation will be sent directly to the customer in their notifications.
                </p>

                <div className="space-y-2 mb-4">
                  <label className="text-xs font-semibold text-slate-300">Quick Presets:</label>
                  {REJECTION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectReason(preset)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                        rejectReason === preset
                          ? 'bg-red-500/20 border-red-500/40 text-red-200 font-semibold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Custom Reason / Notes:</label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide specific feedback for the customer..."
                    className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setRejectModalReceipt(null)}
                    variant="outline"
                    className="flex-1 border-slate-700 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirmReject}
                    disabled={reviewLoading === rejectModalReceipt.id || !rejectReason.trim()}
                    className="flex-1 bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-500/20"
                  >
                    {reviewLoading === rejectModalReceipt.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Confirm Rejection'
                    )}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
