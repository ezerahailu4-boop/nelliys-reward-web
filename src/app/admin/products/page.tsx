'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, X, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAdminAuth } from '@/lib/useAdminAuth'
import { adminFetch } from '@/lib/adminFetch'

const CATEGORIES = ['Coffee', 'Tea', 'Drinks', 'Breakfast', 'Pastries', 'Sandwiches', 'Burgers', 'Wraps', 'Extras']

const EMPTY = { name: '', category: 'Coffee', price: '', bonusPoints: '', description: '', isAvailable: true }

export default function ProductsPage() {
  const ready = useAdminAuth()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!ready) return
    adminFetch('/api/admin/products').then(r => r.json()).then(d => setProducts(d.products || [])).finally(() => setLoading(false))
  }, [ready])

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (p: any) => { setEditing(p); setForm({ name: p.name, category: p.category, price: p.price, bonusPoints: p.bonusPoints, description: p.description, isAvailable: p.isAvailable }); setShowForm(true) }

  const save = async () => {
    if (!form.name || !form.price) return toast.error('Name and price are required')
    setSaving(true)
    try {
      const res = await adminFetch('/api/admin/products', {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify({ ...form, id: editing?.id, price: parseFloat(form.price), bonusPoints: parseInt(form.bonusPoints) || 0 }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Failed')
      if (editing) {
        setProducts(prev => prev.map(p => p.id === editing.id ? data.product : p))
        toast.success('Product updated')
      } else {
        setProducts(prev => [...prev, data.product])
        toast.success('Product added')
      }
      setShowForm(false)
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const del = async (id: string) => {
    setDeleting(id)
    try {
      const res = await adminFetch('/api/admin/products', { method: 'DELETE', body: JSON.stringify({ id }) })
      if (!res.ok) throw new Error()
      setProducts(prev => prev.filter(p => p.id !== id))
      toast.success('Product deleted')
    } catch { toast.error('Failed to delete') }
    finally { setDeleting(null) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-bold text-white flex-1">Menu Products</h1>
          <div className="flex gap-2">
            <Button onClick={async () => {
              setSyncing(true)
              try {
                const res = await adminFetch('/api/admin/products/sync', { method: 'POST' })
                const data = await res.json()
                if (res.ok) {
                  toast.success(`Synced! ${data.created} added, ${data.updated} updated`)
                  adminFetch('/api/admin/products').then(r => r.json()).then(d => setProducts(d.products || []))
                } else toast.error('Sync failed')
              } catch { toast.error('Sync failed') }
              finally { setSyncing(false) }
            }} disabled={syncing} variant="outline" className="border-amber-500 text-amber-400 hover:bg-amber-500/10 h-9 px-4 text-sm">
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : '🔄 Sync from Menu'}
            </Button>
            <Button onClick={openAdd} className="bg-amber-500 hover:bg-amber-600 text-white h-9 px-4 text-sm">
              <Plus className="w-4 h-4 mr-1" /> Add Product
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>
        ) : (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-700/30">
                <tr>
                  {['Name', 'Category', 'Price', 'Bonus Pts', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {products.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3 text-white font-medium text-sm">{p.name}</td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{p.category}</td>
                    <td className="px-4 py-3 text-amber-400 text-sm font-bold">{p.price} ETB</td>
                    <td className="px-4 py-3 text-green-400 text-sm font-bold">+{p.bonusPoints} pts</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs border-0 ${p.isAvailable ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {p.isAvailable ? 'Available' : 'Unavailable'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="w-8 h-8 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center hover:bg-amber-500/30">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => del(p.id)} disabled={deleting === p.id} className="w-8 h-8 bg-red-500/20 text-red-400 rounded-lg flex items-center justify-center hover:bg-red-500/30">
                          {deleting === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No products yet. Add your first menu item.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white text-lg">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Name *</label>
                <Input value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Cappuccino" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Category</label>
                <select value={form.category} onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Price (ETB) *</label>
                  <Input type="number" value={form.price} onChange={e => setForm((f: any) => ({ ...f, price: e.target.value }))}
                    placeholder="120" className="bg-slate-800 border-slate-700 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Bonus Points</label>
                  <Input type="number" value={form.bonusPoints} onChange={e => setForm((f: any) => ({ ...f, bonusPoints: e.target.value }))}
                    placeholder="10" className="bg-slate-800 border-slate-700 text-white" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Description</label>
                <Input value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description" className="bg-slate-800 border-slate-700 text-white" />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setForm((f: any) => ({ ...f, isAvailable: !f.isAvailable }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.isAvailable ? 'bg-amber-500' : 'bg-slate-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isAvailable ? 'translate-x-5' : ''}`} />
                </button>
                <span className="text-slate-300 text-sm">Available on menu</span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1 border-slate-700 text-slate-300">Cancel</Button>
              <Button onClick={save} disabled={saving} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" />{editing ? 'Update' : 'Add'}</>}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
