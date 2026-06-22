'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Trash2, QrCode, Printer, RotateCcw, Search, Loader2, CheckCircle, Coffee, Lock } from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'qrcode'

interface Product {
  id: string
  name: string
  category: string
  price: number
  bonusPoints: number
}

interface CartItem {
  product: Product
  qty: number
}

interface Branch {
  id: string
  name: string
  address: string
}

const CATEGORY_EMOJI: Record<string, string> = {
  Breakfast: '🍳', Wraps: '🌯', Sandwiches: '🥪', Burgers: '🍔',
  Extras: '➕', Coffee: '☕', Tea: '🍵', Drinks: '🥤', Pastries: '🥐',
}

const STORED_PIN_KEY = 'pos_pin'

export default function StandalonePOS() {
  const [pin, setPin] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [receiptNumber, setReceiptNumber] = useState('')
  const [printed, setPrinted] = useState(false)
  const pinRef = useRef<HTMLInputElement>(null)

  // Try stored PIN on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORED_PIN_KEY)
    if (stored) tryUnlock(stored, true)
  }, [])

  const tryUnlock = async (p: string, silent = false) => {
    setLoading(true)
    try {
      const res = await fetch('/api/pos/menu', {
        headers: { 'x-pos-pin': p },
      })
      if (!res.ok) {
        if (!silent) { setPinError(true); setTimeout(() => setPinError(false), 1500) }
        setLoading(false)
        return
      }
      const data = await res.json()
      setProducts(data.products || [])
      setBranches(data.branches || [])
      if (data.branches?.length) setSelectedBranch(data.branches[0].id)
      setReceiptNumber(`RCP-${Date.now()}`)
      sessionStorage.setItem(STORED_PIN_KEY, p)
      setUnlocked(true)
    } catch {
      if (!silent) toast.error('Connection error')
    } finally {
      setLoading(false)
    }
  }

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length < 1) return
    tryUnlock(pin)
  }

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))]

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
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
  const bonusPoints = cart.reduce((sum, i) => sum + i.product.bonusPoints * i.qty, 0)
  const basePoints = Math.floor(total / 10)
  const totalPoints = basePoints + bonusPoints

  const generateQR = async () => {
    if (!cart.length) return toast.error('Add items first')
    if (!selectedBranch) return toast.error('Select a branch')
    setGenerating(true)
    try {
      const storedPin = sessionStorage.getItem(STORED_PIN_KEY) || ''
      const res = await fetch('/api/pos/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: storedPin,
          receiptNumber,
          branchId: selectedBranch,
          amount: total,
          items: cart.map(i => ({ name: i.product.name, qty: i.qty, price: i.product.price })),
        }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Failed to generate QR')
      const url = await QRCode.toDataURL(data.qrData, {
        width: 280,
        margin: 1,
        color: { dark: '#1c0a00', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      })
      setQrDataUrl(url)
      setPrinted(false)
    } catch {
      toast.error('Failed to generate QR')
    } finally {
      setGenerating(false)
    }
  }

  const printReceipt = () => {
    if (!qrDataUrl) return
    const win = window.open('', '_blank')
    if (!win) return toast.error('Allow popups to print')
    const branchName = branches.find(b => b.id === selectedBranch)?.name || "Nelliy's Coffee"
    win.document.write(`<!DOCTYPE html><html><head><title>Receipt ${receiptNumber}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 8px; font-size: 12px; }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .logo { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 2px; }
      .divider { border-top: 1px dashed #000; margin: 6px 0; }
      .row { display: flex; justify-content: space-between; margin: 3px 0; }
      .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin: 4px 0; }
      .qr-section { text-align: center; margin: 10px 0 4px; }
      .qr-section img { width: 160px; height: 160px; }
      .scan-text { font-size: 11px; text-align: center; margin-top: 4px; }
      .points-box { border: 1px solid #000; padding: 4px 8px; text-align: center; margin: 6px 0; font-size: 11px; }
      .footer { text-align: center; font-size: 10px; margin-top: 8px; color: #555; }
    </style></head><body>
    <div class="logo">☕ Nelliy's Coffee</div>
    <div class="center" style="font-size:10px">${branchName}</div>
    <div class="center" style="font-size:10px">${new Date().toLocaleString()}</div>
    <div class="center" style="font-size:10px">Receipt: ${receiptNumber}</div>
    <div class="divider"></div>
    ${cart.map(i => `<div class="row"><span>${i.product.name} x${i.qty}</span><span>${(i.product.price * i.qty).toFixed(2)} Br</span></div>`).join('')}
    <div class="divider"></div>
    <div class="total-row"><span>TOTAL</span><span>${total.toFixed(2)} Br</span></div>
    <div class="divider"></div>
    <div class="points-box">
      Scan QR = ~${totalPoints} loyalty points<br/>
      (${basePoints} base${bonusPoints > 0 ? ` + ${bonusPoints} bonus` : ''})
    </div>
    <div class="qr-section">
      <img src="${qrDataUrl}" />
      <div class="scan-text">📱 Scan with Nelliy's Rewards app<br/>to earn your points!</div>
    </div>
    <div class="footer">Thank you for visiting!<br/>nelliy.com</div>
    </body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
    setPrinted(true)
    toast.success('Receipt sent to printer!')
  }

  const newOrder = () => {
    setCart([])
    setQrDataUrl(null)
    setPrinted(false)
    setReceiptNumber(`RCP-${Date.now()}`)
    setSearch('')
  }

  const logout = () => {
    sessionStorage.removeItem(STORED_PIN_KEY)
    setUnlocked(false)
    setPin('')
    setCart([])
    setQrDataUrl(null)
  }

  // ── PIN Screen ──
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-900 to-orange-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Coffee className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-amber-900 mb-1">Nelliy's POS</h1>
          <p className="text-amber-600 text-sm mb-6">Enter your cashier PIN to continue</p>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
              <input
                ref={pinRef}
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="Enter PIN"
                autoFocus
                className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 text-center text-xl tracking-widest font-bold focus:outline-none transition-all ${
                  pinError ? 'border-red-400 bg-red-50 animate-pulse' : 'border-amber-200 focus:border-amber-400'
                }`}
              />
            </div>
            <button type="submit" disabled={loading || !pin}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Unlock POS'}
            </button>
          </form>
          {pinError && <p className="text-red-500 text-sm mt-3 font-medium">Wrong PIN. Try again.</p>}
        </motion.div>
      </div>
    )
  }

  // ── Main POS ──
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col select-none">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">Nelliy's POS</h1>
            <p className="text-xs text-gray-400 font-mono">{receiptNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {branches.length > 1 && (
            <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-amber-400">
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
            Lock
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Menu ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Search + Categories */}
          <div className="bg-white border-b border-gray-100 px-4 py-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search menu..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeCategory === cat ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                  }`}>
                  {CATEGORY_EMOJI[cat] || '🍽️'} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 content-start">
            {filtered.map(product => {
              const inCart = cart.find(i => i.product.id === product.id)
              return (
                <motion.button key={product.id} whileTap={{ scale: 0.95 }}
                  onClick={() => addToCart(product)}
                  className={`bg-white rounded-2xl p-3 text-left border-2 transition-all shadow-sm hover:shadow-md active:scale-95 ${
                    inCart ? 'border-amber-400 bg-amber-50' : 'border-gray-100 hover:border-amber-200'
                  }`}>
                  <div className="text-2xl mb-1.5">{CATEGORY_EMOJI[product.category] || '🍽️'}</div>
                  <p className="font-semibold text-gray-900 text-xs leading-tight mb-1 line-clamp-2">{product.name}</p>
                  <p className="text-amber-600 font-bold text-sm">{product.price.toFixed(0)} Br</p>
                  {product.bonusPoints > 0 && (
                    <span className="text-xs text-green-600 font-medium">+{product.bonusPoints} bonus</span>
                  )}
                  {inCart && (
                    <div className="mt-1.5 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full inline-block">
                      ×{inCart.qty}
                    </div>
                  )}
                </motion.button>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-400">
                <QrCode className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No items found</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Cart + QR ── */}
        <div className="w-72 lg:w-80 bg-white border-l border-gray-200 flex flex-col shadow-xl">

          {/* Cart header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">Current Order</h2>
            {cart.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((s, i) => s + i.qty, 0)} items
              </span>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <AnimatePresence>
              {cart.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-4xl mb-2">🛒</div>
                  <p className="text-sm font-medium">Cart is empty</p>
                  <p className="text-xs mt-1">Tap items to add</p>
                </div>
              ) : cart.map(item => (
                <motion.div key={item.product.id}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                  <div className="text-lg flex-shrink-0">{CATEGORY_EMOJI[item.product.category] || '🍽️'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{item.product.name}</p>
                    <p className="text-xs text-amber-600 font-bold">{(item.product.price * item.qty).toFixed(0)} Br</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => updateQty(item.product.id, -1)}
                      className="w-6 h-6 bg-gray-200 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors">
                      {item.qty === 1 ? <Trash2 className="w-3 h-3 text-red-500" /> : <Minus className="w-3 h-3 text-gray-600" />}
                    </button>
                    <span className="w-5 text-center text-sm font-bold text-gray-900">{item.qty}</span>
                    <button onClick={() => updateQty(item.product.id, 1)}
                      className="w-6 h-6 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3 text-amber-700" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Totals + Actions */}
          <div className="p-3 border-t border-gray-100 space-y-3">

            {/* Bill summary */}
            {cart.length > 0 && (
              <div className="bg-amber-50 rounded-xl p-3 space-y-1.5 border border-amber-100">
                <div className="flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span>
                  <span>{total.toFixed(2)} Br</span>
                </div>
                <div className="border-t border-amber-200 pt-1.5 space-y-1">
                  <div className="flex justify-between text-xs text-amber-700">
                    <span>Base points (1 per 10 Br)</span>
                    <span className="font-semibold">+{basePoints} pts</span>
                  </div>
                  {bonusPoints > 0 && (
                    <div className="flex justify-between text-xs text-green-700">
                      <span>Bonus points</span>
                      <span className="font-semibold">+{bonusPoints} pts</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold text-amber-900 border-t border-amber-200 pt-1">
                    <span>Customer earns</span>
                    <span>~{totalPoints} pts</span>
                  </div>
                </div>
              </div>
            )}

            {/* QR display */}
            {qrDataUrl && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-white border-2 border-amber-300 rounded-2xl p-3 text-center">
                <img src={qrDataUrl} alt="Receipt QR" className="w-36 h-36 mx-auto" />
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs text-green-600 font-semibold">QR Ready — Show to customer</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Customer scans with Nelliy's app</p>
              </motion.div>
            )}

            {/* Buttons */}
            <div className="space-y-2">
              {!qrDataUrl ? (
                <button onClick={generateQR} disabled={generating || !cart.length}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 text-sm shadow-lg">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                  {generating ? 'Generating...' : 'Generate Receipt QR'}
                </button>
              ) : (
                <button onClick={printReceipt}
                  className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg ${
                    printed
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 text-white'
                  }`}>
                  <Printer className="w-4 h-4" />
                  {printed ? 'Print Again' : 'Print Receipt'}
                </button>
              )}
              <button onClick={newOrder}
                className="w-full py-2.5 border-2 border-gray-200 hover:border-amber-300 hover:bg-amber-50 text-gray-600 hover:text-amber-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
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
