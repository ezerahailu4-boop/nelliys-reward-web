'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Building2, Plus, MapPin, Phone, Clock, X, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAdminAuth } from '@/lib/useAdminAuth'
import { adminFetch } from '@/lib/adminFetch'

const EMPTY_FORM = { name: '', address: '', phone: '', openingTime: '07:00', closingTime: '22:00' }

export default function BranchesPage() {
  const ready = useAdminAuth()
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (!ready) return
    adminFetch('/api/admin/branches').then(r => r.json()).then(d => setBranches(d.branches || [])).finally(() => setLoading(false))
  }, [ready])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await adminFetch('/api/admin/branches', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Failed')
      toast.success('Branch created!')
      setBranches(prev => [data.branch, ...prev])
      setShowForm(false)
      setForm(EMPTY_FORM)
    } catch { toast.error('Something went wrong') }
    finally { setSaving(false) }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    await adminFetch('/api/admin/branches', {
      method: 'PATCH',
      body: JSON.stringify({ id, isActive: !isActive }),
    })
    setBranches(prev => prev.map(b => b.id === id ? { ...b, isActive: !isActive } : b))
    toast.success(`Branch ${!isActive ? 'activated' : 'deactivated'}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-display text-lg font-bold text-white flex-1">Branches</h1>
          <Button onClick={() => setShowForm(true)} className="bg-amber-500 hover:bg-amber-600 text-white h-9 px-4 text-sm">
            <Plus className="w-4 h-4 mr-1" /> Add Branch
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Branches', value: branches.length },
            { label: 'Active', value: branches.filter(b => b.isActive).length },
            { label: 'Inactive', value: branches.filter(b => !b.isActive).length },
          ].map(s => (
            <div key={s.label} className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50 text-center">
              <p className="text-3xl font-bold text-white">{s.value}</p>
              <p className="text-slate-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-slate-800/60 rounded-2xl h-28 animate-pulse border border-slate-700/50" />)}
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No branches yet. Add your first one!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {branches.map((branch, i) => (
              <motion.div key={branch.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`bg-slate-800/60 rounded-2xl border p-5 transition-all ${branch.isActive ? 'border-slate-700/50' : 'border-slate-700/30 opacity-60'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">{branch.name}</h3>
                      <Badge className={`text-xs border-0 ${branch.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {branch.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <button onClick={() => toggleActive(branch.id, branch.isActive)}
                    className={`transition-colors ${branch.isActive ? 'text-green-400 hover:text-green-300' : 'text-slate-500 hover:text-slate-300'}`}>
                    {branch.isActive ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                  </button>
                </div>
                <div className="space-y-1.5 text-sm text-slate-400">
                  <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 flex-shrink-0" />{branch.address}</p>
                  <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 flex-shrink-0" />{branch.phone}</p>
                  <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 flex-shrink-0" />{branch.openingTime} – {branch.closingTime}</p>
                </div>
                <div className="flex gap-4 mt-4 pt-4 border-t border-slate-700/50 text-xs text-slate-500">
                  <span>{branch._count?.orders || 0} orders</span>
                  <span>{branch._count?.receipts || 0} receipts</span>
                  <span>{branch._count?.employees || 0} staff</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()} className="bg-slate-900 rounded-3xl w-full max-w-md border border-slate-700 shadow-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-white">New Branch</h3>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={create} className="p-6 space-y-4">
                {[
                  { key: 'name', label: 'Branch Name', placeholder: 'e.g. Bole Branch' },
                  { key: 'address', label: 'Address', placeholder: 'e.g. Bole Road, Addis Ababa' },
                  { key: 'phone', label: 'Phone', placeholder: '+251 9...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-slate-400 text-xs mb-1.5 block">{f.label} *</label>
                    <Input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" required />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">Opening Time *</label>
                    <Input type="time" value={form.openingTime} onChange={e => setForm(p => ({ ...p, openingTime: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white" required />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs mb-1.5 block">Closing Time *</label>
                    <Input type="time" value={form.closingTime} onChange={e => setForm(p => ({ ...p, closingTime: e.target.value }))}
                      className="bg-slate-800 border-slate-700 text-white" required />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" onClick={() => setShowForm(false)} variant="outline" className="flex-1 border-slate-700 text-slate-400 hover:text-white">Cancel</Button>
                  <Button type="submit" disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Branch'}
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
