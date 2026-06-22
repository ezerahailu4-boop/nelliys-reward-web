'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ShoppingCart, Plus, Minus, X, Clock, MapPin, Star, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import BottomNav from '@/components/ui/BottomNav'

const MENU = [
  { id: 'espresso', name: 'Espresso', price: 80, emoji: '☕', category: 'Hot Coffee', points: 8, desc: 'Rich & bold single shot' },
  { id: 'cappuccino', name: 'Cappuccino', price: 120, emoji: '🥛', category: 'Hot Coffee', points: 12, desc: 'Espresso with steamed milk foam' },
  { id: 'latte', name: 'Latte', price: 150, emoji: '🍵', category: 'Hot Coffee', points: 15, desc: 'Smooth espresso & steamed milk' },
  { id: 'macchiato', name: 'Macchiato', price: 100, emoji: '☕', category: 'Hot Coffee', points: 10, desc: 'Espresso with a dash of milk' },
  { id: 'cold-brew', name: 'Cold Brew', price: 130, emoji: '🧊', category: 'Cold Coffee', points: 13, desc: 'Slow-steeped, smooth & refreshing' },
  { id: 'iced-latte', name: 'Iced Latte', price: 140, emoji: '🥤', category: 'Cold Coffee', points: 14, desc: 'Chilled latte over ice' },
  { id: 'frappe', name: 'Frappé', price: 160, emoji: '🧋', category: 'Cold Coffee', points: 16, desc: 'Blended iced coffee delight' },
  { id: 'croissant', name: 'Croissant', price: 100, emoji: '🥐', category: 'Food', points: 10, desc: 'Buttery, flaky pastry' },
  { id: 'cheesecake', name: 'Cheesecake', price: 180, emoji: '🍰', category: 'Food', points: 18, desc: 'Creamy New York style' },
  { id: 'sandwich', name: 'Club Sandwich', price: 200, emoji: '🥪', category: 'Food', points: 20, desc: 'Toasted with fresh fillings' },
  { id: 'muffin', name: 'Blueberry Muffin', price: 90, emoji: '🧁', category: 'Food', points: 9, desc: 'Freshly baked daily' },
  { id: 'juice', name: 'Fresh Juice', price: 110, emoji: '🍊', category: 'Drinks', points: 11, desc: 'Seasonal fresh-squeezed' },
]

const CATEGORIES = ['All', 'Hot Coffee', 'Cold Coffee', 'Food', 'Drinks']

type CartItem = { id: string; name: string; price: number; emoji: string; qty: number; points: number }

export default function OrderPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [category, setCategory] = useState('All')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [ordered, setOrdered] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => { if (status === 'unauthenticated') router.push('/login') }, [status, router])

  const filtered = category === 'All' ? MENU : MENU.filter(m => m.category === category)
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartPoints = cart.reduce((s, i) => s + i.points * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  const addToCart = (item: typeof MENU[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { id: item.id, name: item.name, price: item.price, emoji: item.emoji, qty: 1, points: item.points }]
    })
    toast.success(`${item.name} added!`, { duration: 1000 })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0))
  }

  const placeOrder = async () => {
    if (cart.length === 0) return
    setPlacing(true)
    try {
      const branchRes = await fetch('/api/branches')
      const branchData = await branchRes.json()
      const branchId = branchData.branches?.[0]?.id
      if (!branchId) return toast.error('No branch available')

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          notes,
          paymentMethod: 'cash',
          items: cart.map(i => ({ productId: i.id, quantity: i.qty })),
        }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Failed to place order')
      setOrdered(true)
      setCart([])
      setShowCart(false)
    } catch {
      toast.error('Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  if (ordered) return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-amber-100">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="font-display text-2xl font-bold text-amber-900 mb-2">Order Placed! 🎉</h2>
        <p className="text-amber-700/70 mb-2">Your order is being prepared.</p>
        <p className="text-amber-600 font-semibold mb-6">+{cartPoints} points will be added when ready!</p>
        <div className="flex gap-3">
          <Button onClick={() => setOrdered(false)} variant="outline" className="flex-1 border-amber-300 text-amber-700">Order More</Button>
          <Link href="/dashboard" className="flex-1">
            <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white">Dashboard</Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-amber-700 hover:text-amber-900">
            <ArrowLeft className="w-5 h-5" /><span className="font-medium">Back</span>
          </Link>
          <h1 className="font-display text-lg font-bold text-amber-900">Order Ahead</h1>
          <button onClick={() => setShowCart(true)} className="relative w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-md">
            <ShoppingCart className="w-5 h-5 text-white" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center">{cartCount}</span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 pb-28">
        {/* Branch info */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-4 flex items-center gap-4 mb-5 shadow-lg">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">Skip the Queue</p>
            <p className="text-white/80 text-xs">Ready in ~10 mins • Earn points on every order</p>
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-xl px-2 py-1">
            <MapPin className="w-3 h-3 text-white" />
            <span className="text-white text-xs font-medium">Gazebo</span>
          </div>
        </motion.div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${category === c ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-amber-700 border border-amber-200 hover:border-amber-400'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item, i) => {
            const inCart = cart.find(c => c.id === item.id)
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm hover:border-amber-300 hover:shadow-md transition-all">
                <div className="text-4xl mb-2">{item.emoji}</div>
                <p className="font-bold text-amber-900 text-sm leading-tight">{item.name}</p>
                <p className="text-amber-500/70 text-xs mt-0.5 mb-2 leading-tight">{item.desc}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-amber-800">{item.price} ETB</span>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-current" />
                    <span className="text-amber-500 text-xs">+{item.points}</span>
                  </div>
                </div>
                {inCart ? (
                  <div className="flex items-center justify-between bg-amber-50 rounded-xl p-1">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-sm text-amber-700 hover:bg-amber-100">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-amber-900 text-sm">{inCart.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center shadow-sm text-white hover:bg-amber-600">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <Button onClick={() => addToCart(item)} size="sm" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs h-8 shadow-md">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                )}
              </motion.div>
            )
          })}
        </div>
      </main>

      {/* Floating cart bar */}
      {cartCount > 0 && !showCart && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-40">
          <button onClick={() => setShowCart(true)}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">{cartCount} item{cartCount > 1 ? 's' : ''}</span>
            </div>
            <div className="text-right">
              <p className="text-white font-bold">{cartTotal} ETB</p>
              <p className="text-white/70 text-xs">+{cartPoints} pts</p>
            </div>
          </button>
        </motion.div>
      )}

      {/* Cart sheet */}
      <AnimatePresence>
        {showCart && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4" onClick={() => setShowCart(false)}>
            <motion.div initial={{ y: 300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 300, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-amber-900">Your Order</h3>
                <button onClick={() => setShowCart(false)} className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 hover:bg-amber-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto px-5 py-3 space-y-3">
                {cart.length === 0 ? (
                  <p className="text-center text-amber-500 py-8">Your cart is empty</p>
                ) : cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900 text-sm">{item.name}</p>
                      <p className="text-amber-500 text-xs">{item.price} ETB each</p>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-50 rounded-xl p-1">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-amber-700 shadow-sm">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-amber-900 text-sm w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center text-white shadow-sm">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="font-bold text-amber-800 text-sm w-16 text-right">{item.price * item.qty} ETB</p>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-amber-50">
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions (optional)..."
                  rows={2} className="w-full px-3 py-2 rounded-xl border border-amber-200 focus:border-amber-400 text-sm resize-none focus:outline-none" />
              </div>

              <div className="px-5 pb-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-amber-700 font-medium">Total</span>
                  <span className="font-bold text-amber-900 text-lg">{cartTotal} ETB</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-amber-500">Points you'll earn</span>
                  <span className="text-green-600 font-bold">+{cartPoints} pts</span>
                </div>
                <Button onClick={placeOrder} disabled={placing || cart.length === 0}
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg">
                  {placing ? <Loader2 className="w-5 h-5 animate-spin" /> : `Place Order • ${cartTotal} ETB`}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <BottomNav />
    </div>
  )
}
