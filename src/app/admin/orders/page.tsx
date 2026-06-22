'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingCart, Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAdminAuth } from '@/lib/useAdminAuth'
import { adminFetch } from '@/lib/adminFetch'

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CONFIRMED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PREPARING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  READY: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function AdminOrdersPage() {
  const ready = useAdminAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    if (!ready) return
    adminFetch('/api/admin/stats').then(r => r.json()).then(d => setOrders(d.recentOrders || [])).finally(() => setLoading(false))
  }, [ready])

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.orderNumber?.includes(search) || o.user?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-lg font-bold text-white flex-1">Orders</h1>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{filtered.length} orders</Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order or customer..."
              className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['ALL', 'PENDING', 'PREPARING', 'COMPLETED', 'CANCELLED'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${statusFilter === s ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-slate-800/60 rounded-2xl p-4 h-20 animate-pulse border border-slate-700/50" />)}
          </div>
        ) : (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/30">
                    <tr>
                      {['Order #', 'Customer', 'Amount', 'Points', 'Branch', 'Status', 'Date'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {filtered.map((order, i) => (
                      <motion.tr key={order.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-3 text-white font-mono text-sm">{order.orderNumber}</td>
                        <td className="px-4 py-3 text-slate-300 text-sm">{order.user?.name || '—'}</td>
                        <td className="px-4 py-3 text-white text-sm font-semibold">{order.totalAmount} ETB</td>
                        <td className="px-4 py-3 text-amber-400 text-sm">+{order.pointsEarned}</td>
                        <td className="px-4 py-3 text-slate-400 text-sm">{order.branch?.name || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs ${STATUS_BADGE[order.status] || STATUS_BADGE.PENDING}`}>{order.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
