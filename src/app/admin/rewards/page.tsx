'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Gift, Plus, Trash2, Edit2, Loader2, Star, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminAuth } from '@/lib/useAdminAuth'
import { adminFetch } from '@/lib/adminFetch'

export default function AdminRewardsPage() {
  const ready = useAdminAuth()
  const [rewards, setRewards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', pointsCost: '', tier: 'BRONZE' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!ready) return
    adminFetch('/api/rewards/list').then(r => r.json()).then(d => {
      setRewards(d.rewards || [])
    }).finally(() => setLoading(false))
  }, [ready])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await adminFetch('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({ ...form, pointsCost: parseInt(form.pointsCost), isReward: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Reward created!')
      setShowForm(false)
      setForm({ name: '', description: '', pointsCost: '', tier: 'BRONZE' })
    } catch (err: any) {
      toast.error(err.message || 'Failed to create reward')
    } finally {
      setSaving(false)
    }
  }

  const TIER_COLORS: Record<string, string> = {
    BRONZE:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
    SILVER:   'bg-slate-400/20 text-slate-300 border-slate-400/30',
    GOLD:     'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    PLATINUM: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-lg font-bold flex-1">Rewards Catalog</h1>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> New Reward
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Create form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-6">
            <h2 className="font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Create New Reward
            </h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Reward Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Free Latte" required
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Points Cost</label>
                <input type="number" value={form.pointsCost} onChange={e => setForm(f => ({ ...f, pointsCost: e.target.value }))}
                  placeholder="e.g. 500" required min="1"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Required Tier</label>
                <select value={form.tier} onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500">
                  {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {saving ? 'Creating...' : 'Create Reward'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 border border-slate-600 text-slate-400 hover:text-white rounded-xl text-sm font-semibold transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Rewards list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : rewards.length === 0 ? (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-16 text-center">
            <Gift className="w-16 h-16 text-amber-400 mx-auto mb-4 opacity-50" />
            <p className="text-white font-semibold text-lg">No rewards yet</p>
            <p className="text-slate-400 text-sm mt-1">Create your first reward to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward, i) => (
              <motion.div key={reward.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5 hover:border-amber-500/30 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${TIER_COLORS[reward.tier] || TIER_COLORS.BRONZE}`}>
                    {reward.tier || 'BRONZE'}
                  </span>
                </div>
                <h3 className="font-bold text-white mb-1">{reward.name}</h3>
                <p className="text-slate-400 text-sm mb-3">{reward.description}</p>
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-4 h-4" />
                  <span>{reward.pointsCost?.toLocaleString() || reward.pointsRequired?.toLocaleString() || '—'} pts</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
