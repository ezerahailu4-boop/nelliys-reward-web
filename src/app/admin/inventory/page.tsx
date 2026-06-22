'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, AlertTriangle, Search, Loader2, Check, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAdminAuth } from '@/lib/useAdminAuth'
import { adminFetch } from '@/lib/adminFetch'

export default function InventoryPage() {
  const ready = useAdminAuth()
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [branchFilter, setBranchFilter] = useState('ALL')

  useEffect(() => {
    if (!ready) return
    adminFetch('/api/admin/inventory').then(r => r.json()).then(d => setInventory(d.inventory || [])).finally(() => setLoading(false))
  }, [ready])

  const branches = ['ALL', ...Array.from(new Set(inventory.map((i: any) => i.branch.name)))]

  const filtered = inventory.filter(item => {
    const matchSearch = !search || item.product.name.toLowerCase().includes(search.toLowerCase())
    const matchBranch = branchFilter === 'ALL' || item.branch.name === branchFilter
    return matchSearch && matchBranch
  })

  const lowStock = filtered.filter(i => i.quantity <= i.lowStockThreshold)

  const saveQty = async (id: string) => {
    setSaving(true)
    try {
      const res = await adminFetch('/api/admin/inventory', {
        method: 'PATCH',
        body: JSON.stringify({ id, quantity: parseInt(editVal) }),
      })
      if (!res.ok) throw new Error()
      setInventory(prev => prev.map(i => i.id === id ? { ...i, quantity: parseInt(editVal) } : i))
      toast.success('Stock updated')
      setEditing(null)
    } catch {
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-display text-lg font-bold text-white flex-1">Inventory</h1>
          {lowStock.length > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              <AlertTriangle className="w-3 h-3 mr-1" />{lowStock.length} low stock
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Low stock alert */}
        {lowStock.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-5 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">
              <span className="font-bold">{lowStock.length} items</span> are at or below their low-stock threshold.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product..."
              className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {branches.map(b => (
              <button key={b} onClick={() => setBranchFilter(b)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${branchFilter === b ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
                {b}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="bg-slate-800/60 rounded-2xl h-16 animate-pulse border border-slate-700/50" />)}
          </div>
        ) : (
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-700/30">
                <tr>
                  {['Product', 'Category', 'Branch', 'Stock', 'Threshold', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filtered.map((item, i) => {
                  const isLow = item.quantity <= item.lowStockThreshold
                  return (
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 text-white font-medium text-sm">{item.product.name}</td>
                      <td className="px-4 py-3 text-slate-400 text-sm capitalize">{item.product.category}</td>
                      <td className="px-4 py-3 text-slate-400 text-sm">{item.branch.name}</td>
                      <td className="px-4 py-3">
                        {editing === item.id ? (
                          <div className="flex items-center gap-1">
                            <Input type="number" value={editVal} onChange={e => setEditVal(e.target.value)}
                              className="w-20 h-7 bg-slate-700 border-slate-600 text-white text-sm px-2" />
                            <button onClick={() => saveQty(item.id)} disabled={saving}
                              className="w-7 h-7 bg-green-500/20 text-green-400 rounded-lg flex items-center justify-center hover:bg-green-500/30">
                              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            </button>
                            <button onClick={() => setEditing(null)} className="w-7 h-7 bg-slate-700 text-slate-400 rounded-lg flex items-center justify-center hover:bg-slate-600">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditing(item.id); setEditVal(String(item.quantity)) }}
                            className={`font-bold text-sm hover:underline ${isLow ? 'text-red-400' : 'text-white'}`}>
                            {item.quantity}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-sm">{item.lowStockThreshold}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-xs border-0 ${isLow ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                          {isLow ? '⚠ Low' : '✓ OK'}
                        </Badge>
                      </td>
                    </motion.tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No inventory found
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
