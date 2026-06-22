'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, Zap, Trash2, ToggleLeft, ToggleRight, Loader2, X, Calendar, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAdminAuth } from '@/lib/useAdminAuth'
import { adminFetch } from '@/lib/adminFetch'

const TYPE_COLORS: Record<string, string> = {
  multiplier: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  discount: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  bonus: 'bg-green-500/20 text-green-400 border-green-500/30',
}

export default function CampaignsPage() {
  const ready = useAdminAuth()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', type: 'multiplier', multiplier: 2,
    discount: 0, startDate: '', endDate: '', targetTier: '',
  })

  const load = () => {
    adminFetch('/api/admin/campaigns').then(r => r.json()).then(d => setCampaigns(d.campaigns || [])).finally(() => setLoading(false))
  }

  useEffect(() => { if (ready) load() }, [ready])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await adminFetch('/api/admin/campaigns', {
        method: 'POST',
        body: JSON.stringify({ ...form, multiplier: Number(form.multiplier), discount: Number(form.discount) }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Failed')
      toast.success('Campaign created!')
      setCampaigns(prev => [data.campaign, ...prev])
      setShowForm(false)
      setForm({ name: '', description: '', type: 'multiplier', multiplier: 2, discount: 0, startDate: '', endDate: '', targetTier: '' })
    } catch { toast.error('Something went wrong') }
    finally { setSaving(false) }
  }

  const toggle = async (id: string, isActive: boolean) => {
    await adminFetch('/api/admin/campaigns', { method: 'PATCH', body: JSON.stringify({ id, isActive: !isActive }) })
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, isActive: !isActive } : c))
    toast.success(`Campaign ${!isActive ? 'activated' : 'deactivated'}`)
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this campaign?')) return
    await adminFetch('/api/admin/campaigns', { method: 'DELETE', body: JSON.stringify({ id }) })
    setCampaigns(prev => prev.filter(c => c.id !== id))
    toast.success('Campaign deleted')
  }

  const now = new Date()
  const active = campaigns.filter(c => c.isActive && new Date(c.startDate) <= now && new Date(c.endDate) >= now)
  const upcoming = campaigns.filter(c => new Date(c.startDate) > now)
  const past = campaigns.filter(c => new Date(c.endDate) < now)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-display text-lg font-bold text-white flex-1">Campaigns</h1>
          <Button onClick={() => setShowForm(true)} className="bg-amber-500 hover:bg-amber-600 text-white h-9 px-4 text-sm">
            <Plus className="w-4 h-4 mr-1" /> New Campaign
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Active Now', value: active.length, color: 'text-green-400' },
            { label: 'Upcoming', value: upcoming.length, color: 'text-amber-400' },
            { label: 'Total', value: campaigns.length, color: 'text-white' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-slate-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {campaigns.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No campaigns yet. Create your first one!</p>
              </div>
            ) : campaigns.map((c, i) => {
              const isLive = c.isActive && new Date(c.startDate) <= now && new Date(c.endDate) >= now
              const isExpired = new Date(c.endDate) < now
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={`bg-slate-800/60 rounded-2xl p-5 border transition-all ${isLive ? 'border-green-500/30' : 'border-slate-700/50'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-white">{c.name}</p>
                        <Badge className={`text-xs ${TYPE_COLORS[c.type] || TYPE_COLORS.bonus}`}>{c.type}</Badge>
                        {isLive && <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">🟢 Live</Badge>}
                        {isExpired && <Badge className="text-xs bg-slate-500/20 text-slate-400 border-slate-500/30">Expired</Badge>}
                        {c.targetTier && <Badge className="text-xs bg-purple-500/20 text-purple-400 border-purple-500/30">{c.targetTier} only</Badge>}
                      </div>
                      {c.description && <p className="text-slate-400 text-sm mb-2">{c.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(c.startDate).toLocaleDateString()} → {new Date(c.endDate).toLocaleDateString()}</span>
                        {c.type === 'multiplier' && <span className="flex items-center gap-1 text-amber-400"><Zap className="w-3 h-3" />{c.multiplier}x points</span>}
                        {c.type === 'discount' && <span className="flex items-center gap-1 text-blue-400"><Tag className="w-3 h-3" />{c.discount}% off</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggle(c.id, c.isActive)} className={`transition-colors ${c.isActive ? 'text-green-400 hover:text-green-300' : 'text-slate-500 hover:text-slate-300'}`}>
                        {c.isActive ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                      </button>
                      <button onClick={() => remove(c.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()} className="bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-700 shadow-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-white">New Campaign</h3>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={create} className="p-6 space-y-4">
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Campaign Name *</label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Double Points Weekend"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" required />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Description</label>
                  <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">Type *</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm">
                      <option value="multiplier">Points Multiplier</option>
                      <option value="discount">Discount</option>
                      <option value="bonus">Bonus Points</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">
                      {form.type === 'multiplier' ? 'Multiplier (x)' : form.type === 'discount' ? 'Discount (%)' : 'Bonus Points'}
                    </label>
                    <Input type="number" value={form.type === 'discount' ? form.discount : form.multiplier}
                      onChange={e => setForm(f => form.type === 'discount' ? { ...f, discount: Number(e.target.value) } : { ...f, multiplier: Number(e.target.value) })}
                      className="bg-slate-800 border-slate-700 text-white" min={1} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">Start Date *</label>
                    <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white" required />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">End Date *</label>
                    <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white" required />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1.5 block">Target Tier (optional)</label>
                  <select value={form.targetTier} onChange={e => setForm(f => ({ ...f, targetTier: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm">
                    <option value="">All Members</option>
                    <option value="BRONZE">Bronze</option>
                    <option value="SILVER">Silver</option>
                    <option value="GOLD">Gold</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" onClick={() => setShowForm(false)} variant="outline" className="flex-1 border-slate-700 text-slate-400 hover:text-white">Cancel</Button>
                  <Button type="submit" disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Campaign'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
