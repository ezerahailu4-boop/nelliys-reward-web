'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Trash2, QrCode, Printer, RotateCcw, Search, ChevronLeft, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'qrcode'
import { adminFetch, getAdminToken } from '@/lib/adminFetch'

interface Product {
  id: string
  name: string
  category: string
  price: number
  bonusPoints: number
  isAvailable: boolean
}

interface CartItem {
  product: Product
  qty: number
}

interface Branch {
  id: string
  name: string
}

const CATEGORY_EMOJI: Record<string, string> = {
  Breakfast: '🍳',
  Wraps: '🌯',
  Sandwiches: '🥪',
  Burgers: '🍔',
  Extras: '➕',
  Coffee: '☕',
  Tea: '🍵',
  Drinks: '🥤',
  Pastries: '🥐',
}

export default function POSPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [receiptNumber, setReceiptNumber] = useState('')

  useEffect(() => {
    if (!getAdminToken()) { router.replace('/admin/login'); return }
    Promise.all([
      adminFetch('/api/admin/products').then(r => r.ok ? r.json() : { products: [] }),
      adminFetch('/api/admin/branches').then(r => r.ok ? r.json() : { branches: [] }),
    ]).then(([p, b]) => {
      setProducts(p.products || [])
      setBranches(b.branches || [])
      if (b.branches?.length) setSelectedBranch(b.branches[0].id)
    }).finally(() => setLoading(false))
    setReceiptNumber(`RCP-${Date.now()}`)
  }, [router])

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))]

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch && p.isAvailable
  })

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { product, qty: 1 }]
    })
  }

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev
      .map(i => i.product.id === productId ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0)
    )
  }

  const total = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0)
  const totalBonusPoints = cart.reduce((sum, i) => sum + i.product.bonusPoints * i.qty, 0)
  const estimatedBasePoints = Math.floor(total / 10)

  const generateQR = async () => {
    if (!cart.length) return toast.error('Add items to the cart first')
    if (!selectedBranch) return toast.error('Select a branch')
    setGenerating(true)
    try {
      const res = await adminFetch('/api/receipts/generate-qr', {
        method: 'POST',
        body: JSON.stringify({
          receiptNumber,
          branchId: selectedBranch,
          amount: total,
          items: cart.map(i => ({ name: i.product.name, qty: i.qty, price: i.product.price })),
        }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Failed to generate QR')
      const url = await QRCode.toDataURL(data.qrData, { width: 300, margin: 2, color: { dark: '#1c0a00', light: '#ffffff' } })
      setQrDataUrl(url)
      toast.success('Receipt QR generated!')
    } catch {
      toast.error('Failed to generate QR')
    } finally {
      setGenerating(false)
    }
  }

  const printReceipt = () => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>Receipt ${receiptNumber}</title>
      <style>
        body { font-family: monospace; max-width: 300px; margin: 0 auto; padding: 16px; }
        h2 { text-align: center; font-size: 18px; margin-bottom: 4px; }
        p { text-align: center; font-size: 12px; margin: 2px 0; color: #555; }
        hr { border: 1px dashed #ccc; margin: 10px 0; }
        .row { display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0; }
        .total { font-weight: bold; font-size: 15px; }
        .qr { text-align: center; margin: 16px 0; }
        .qr img { width: 200px; height: 200px; }
        .scan-msg { text-align: center; font-size: 11px; color: #555; margin-top: 8px; }
      </style></head><body>
      <h2>Nelliy's Coffee</h2>
      <p>Receipt: ${receiptNumber}</p>
      <p>${new Date().toLocaleString()}</p>
      <hr/>
      ${cart.map(i => `<div class="row"><span>${i.product.name} x${i.qty}</span><span>${(i.product.price * i.qty).toFixed(2)} Br</span></div>`).join('')}
      <hr/>
      <div class="row total"><span>TOTAL</span><span>${total.toFixed(2)} Br</span></div>
      <hr/>
      <div class="qr"><img src="${qrDataUrl}" /><div class="scan-msg">📱 Scan to earn loyalty points!</div></div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  const reset = () => {
    setCart([])
    setQrDataUrl(null)
    setReceiptNumber(`RCP-${Date.now()}`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">Cashier POS</h1>
            <p className="text-xs text-gray-500">Select items → Generate QR → Print</p>
          </div>
        </div>
        <select
          value={selectedBranch}
          onChange={e => setSelectedBranch(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-amber-400"
        >
          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Menu */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search + Categories */}
          <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search menu..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeCategory === cat ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-amber-50'
                  }`}>
                  {CATEGORY_EMOJI[cat] || ''} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
            {filtered.map(product => {
              const inCart = cart.find(i => i.product.id === product.id)
              return (
                <motion.button key={product.id} whileTap={{ scale: 0.97 }} onClick={() => addToCart(product)}
                  className={`bg-white rounded-2xl p-4 text-left border-2 transition-all shadow-sm hover:shadow-md ${
                    inCart ? 'border-amber-400 bg-amber-50' : 'border-gray-100 hover:border-amber-200'
                  }`}>
                  <div className="text-2xl mb-2">{CATEGORY_EMOJI[product.category] || '🍽️'}</div>
                  <p className="font-semibold text-gray-900 text-sm leading-tight mb-1">{product.name}</p>
                  <p className="text-amber-600 font-bold text-sm">{product.price.toFixed(2)} Br</p>
                  {product.bonusPoints > 0 && (
                    <span className="text-xs text-green-600 font-medium">+{product.bonusPoints} bonus pts</span>
                  )}
                  {inCart && (
                    <div className="mt-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full inline-block">
                      ×{inCart.qty} in cart
                    </div>
                  )}
                </motion.button>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-400">
                <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No items found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart + QR */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Order</h2>
              <span className="text-xs text-gray-400 font-mono">{receiptNumber}</span>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <AnimatePresence>
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">Cart is empty</p>
                  <p className="text-xs mt-1">Tap items to add</p>
                </div>
              ) : cart.map(item => (
                <motion.div key={item.product.id}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                    <p className="text-xs text-amber-600">{(item.product.price * item.qty).toFixed(2)} Br</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.product.id, -1)} className="w-6 h-6 bg-gray-200 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors">
                      {item.qty === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3 text-gray-600" />}
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-gray-900">{item.qty}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3 text-amber-700" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Totals + QR */}
          <div className="p-4 border-t border-gray-100 space-y-3">
            {cart.length > 0 && (
              <div className="bg-amber-50 rounded-xl p-3 space-y-1 text-sm">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>{total.toFixed(2)} Br</span>
                </div>
                <div className="flex justify-between text-amber-600 text-xs">
                  <span>Est. base points</span>
                  <span>~{estimatedBasePoints} pts</span>
                </div>
                {totalBonusPoints > 0 && (
                  <div className="flex justify-between text-green-600 text-xs">
                    <span>Bonus points</span>
                    <span>+{totalBonusPoints} pts</span>
                  </div>
                )}
              </div>
            )}

            {/* QR Display */}
            {qrDataUrl && (
              <div className="bg-white border-2 border-amber-200 rounded-2xl p-4 text-center">
                <img src={qrDataUrl} alt="Receipt QR" className="w-40 h-40 mx-auto" />
                <p className="text-xs text-gray-500 mt-2">Customer scans this to earn points</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">Ready to scan</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {!qrDataUrl ? (
                <button onClick={generateQR} disabled={generating || !cart.length}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                  {generating ? 'Generating...' : 'Generate Receipt QR'}
                </button>
              ) : (
                <button onClick={printReceipt}
                  className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
              )}
              <button onClick={reset}
                className="w-full py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                <RotateCcw className="w-4 h-4" />
                New Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
