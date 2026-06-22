'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, Users, Crown, TrendingUp, Loader2, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAdminAuth } from '@/lib/useAdminAuth'
import { adminFetch } from '@/lib/adminFetch'

const TIER_BADGE: Record<string, string> = {
  BRONZE: 'bg-amber-100 text-amber-700',
  SILVER: 'bg-slate-100 text-slate-600',
  GOLD: 'bg-yellow-100 text-yellow-700',
  VIP: 'bg-purple-100 text-purple-700',
}

export default function AdminCustomersPage() {
  const ready = useAdminAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('ALL')

  useEffect(() => {
    if (!ready) return
    adminFetch('/api/admin/users').then(r => r.json()).then(d => setUsers(d.users || [])).finally(() => setLoading(false))
  }, [ready])

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search) || u.email?.toLowerCase().includes(search.toLowerCase())
    const matchTier = tierFilter === 'ALL' || u.tier === tierFilter
    return matchSearch && matchTier
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-lg font-bold text-white flex-1">Customers</h1>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{filtered.length} users</Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email..."
              className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
          </div>
          <div className="flex gap-2">
            {['ALL', 'BRONZE', 'SILVER', 'GOLD', 'VIP'].map(t => (
              <button key={t} onClick={() => setTierFilter(t)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${tierFilter === t ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="bg-slate-800/60 rounded-2xl p-4 flex items-center gap-4 animate-pulse border border-slate-700/50">
                <div className="w-12 h-12 rounded-full bg-slate-700 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-700 rounded w-1/3" />
                  <div className="h-2 bg-slate-700/50 rounded w-1/4" />
                </div>
                <div className="h-6 w-16 bg-slate-700 rounded-full" />
                <div className="h-4 w-20 bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-slate-800/60 rounded-2xl p-4 flex items-center gap-4 border border-slate-700/50 hover:border-amber-500/30 transition-all">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {u.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{u.name}</p>
                  <p className="text-slate-400 text-sm">{u.phone} {u.email ? `• ${u.email}` : ''}</p>
                </div>
                <Badge className={`${TIER_BADGE[u.tier] || TIER_BADGE.BRONZE} border-0 flex-shrink-0`}>{u.tier}</Badge>
                <div className="text-right flex-shrink-0">
                  <p className="text-amber-400 font-bold">{u.points?.toLocaleString()} pts</p>
                  <p className="text-slate-500 text-xs">{(u.totalSpent || 0).toLocaleString()} ETB</p>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</p>
                  <p className={`text-xs font-medium ${u.isActive ? 'text-green-400' : 'text-red-400'}`}>{u.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </motion.div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No customers found</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
