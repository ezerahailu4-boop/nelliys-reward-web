'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Coffee, LayoutDashboard, Users, ShoppingCart, Gift, BarChart3,
  Settings, Package, Shield, Building2, FileText, Bell, Search,
  TrendingUp, TrendingDown, DollarSign, UserCheck, CheckCircle,
  XCircle, Menu, X, Star, Loader2, AlertTriangle, MessageSquare, RefreshCw, LogOut, Receipt
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useAdminAuth } from '@/lib/useAdminAuth'
import { adminFetch } from '@/lib/adminFetch'

import { useRouter } from 'next/navigation'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin', active: true },
  { icon: Receipt, label: 'Cashier POS', href: '/admin/pos' },
  { icon: Users, label: 'Customers', href: '/admin/customers' },
  { icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
  { icon: FileText, label: 'Receipts', href: '#receipts' },
  { icon: Gift, label: 'Rewards', href: '/admin/rewards' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
  { icon: Building2, label: 'Branches', href: '/admin/branches' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: Package, label: 'Inventory', href: '/admin/inventory' },
  { icon: UserCheck, label: 'Employees', href: '/admin/employees' },
  { icon: Shield, label: 'Fraud', href: '/admin/fraud' },
  { icon: Bell, label: 'Campaigns', href: '/admin/campaigns' },
  { icon: MessageSquare, label: 'Notify Users', href: '/admin/notify' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
]

export default function AdminDashboard() {
  const ready = useAdminAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [topBranches, setTopBranches] = useState<any[]>([])
  const [pendingReceipts, setPendingReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewLoading, setReviewLoading] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'overview' | 'receipts'>('overview')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadData = () => {
    if (!ready) return
    Promise.all([
      adminFetch('/api/admin/stats').then(r => r.json()),
      adminFetch('/api/admin/receipts?status=PENDING').then(r => r.json()),
    ]).then(([s, r]) => {
      setStats(s.stats)
      setRecentOrders(s.recentOrders || [])
      setTopBranches(s.topBranches || [])
      setPendingReceipts(r.receipts || [])
      setLastUpdated(new Date())
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (ready) loadData()
    const interval = setInterval(() => { if (ready) loadData() }, 30000)
    return () => clearInterval(interval)
  }, [ready])

  const reviewReceipt = async (id: string, action: 'approve' | 'reject') => {
    setReviewLoading(id)
    try {
      const res = await adminFetch('/api/admin/receipts', {
        method: 'PATCH',
        body: JSON.stringify({ receiptId: id, action }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Receipt ${action}d`)
      setPendingReceipts(prev => prev.filter(r => r.id !== id))
      if (stats) setStats((s: any) => ({ ...s, pendingReceipts: s.pendingReceipts - 1 }))
    } catch {
      toast.error('Action failed')
    } finally {
      setReviewLoading(null)
    }
  }

  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    )
  }

  const STAT_CARDS = [
    { label: 'Total Revenue', value: `${((stats?.totalRevenue || 0) / 1000).toFixed(1)}K ETB`, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10', up: true },
    { label: 'Active Users', value: (stats?.totalUsers || 0).toLocaleString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', up: true },
    { label: 'Total Orders', value: (stats?.totalOrders || 0).toLocaleString(), icon: ShoppingCart, color: 'text-amber-400', bg: 'bg-amber-500/10', up: true },
    { label: 'Pending Receipts', value: stats?.pendingReceipts || 0, icon: FileText, color: 'text-red-400', bg: 'bg-red-500/10', up: false },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Top Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Coffee className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-white hidden sm:block">Nelliy's Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search..." className="w-56 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pl-9 h-9" />
            </div>
            <Button variant="ghost" size="icon" className="text-slate-400 relative">
              <Bell className="w-5 h-5" />
              {(stats?.pendingReceipts || 0) > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={loadData} className="text-slate-400 hover:text-white" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div className="hidden md:block">
                <p className="text-white font-medium text-sm leading-none">Admin</p>
                <p className="text-slate-400 text-xs mt-0.5">Super Admin</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('admin_token'); router.replace('/admin/login') }} className="text-slate-400 hover:text-red-400" title="Logout">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex">
        {/* Sidebar — drawer on mobile, fixed on desktop */}
        <motion.aside
          animate={{ x: sidebarOpen ? 0 : -260 }}
          transition={{ duration: 0.2 }}
          className="fixed lg:relative z-30 lg:z-auto bg-slate-900 lg:bg-slate-900/50 border-r border-slate-800 overflow-y-auto flex-shrink-0 min-h-[calc(100vh-57px)] w-60"
          style={{ top: 57 }}
        >
          <nav className="p-3 space-y-0.5 w-60">
            {NAV.map((item) => (
              <Link key={item.label} href={item.href} onClick={item.href === '#receipts' ? (e) => { e.preventDefault(); setActiveSection('receipts') } : undefined}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${item.active ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                  <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-slate-800 mx-3">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
              <Building2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold">Gazebo Branch</p>
                <p className="text-slate-500 text-xs">Addis Ababa</p>
              </div>
              <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
            </div>
          </div>
        </motion.aside>

        {/* Main */}
        <main className="flex-1 p-4 lg:p-5 overflow-auto min-w-0 lg:ml-0">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">
                {activeSection === 'overview' ? 'Dashboard' : 'Receipt Review'}
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                {activeSection === 'overview' ? "Here's what's happening today" : `${pendingReceipts.length} receipts awaiting review`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Systems Operational
              </Badge>
              {lastUpdated && (
                <span className="text-slate-500 text-xs hidden sm:block">
                  Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <div className="flex gap-1 p-1 bg-slate-800 rounded-xl">
                {(['overview', 'receipts'] as const).map(s => (
                  <button key={s} onClick={() => setActiveSection(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeSection === s ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'}`}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeSection === 'overview' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {STAT_CARDS.map((card, i) => (
                  <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50 hover:border-amber-500/30 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>
                        <card.icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <div className={`flex items-center gap-1 text-xs ${card.up ? 'text-green-400' : 'text-red-400'}`}>
                        {card.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs">{card.label}</p>
                    <p className="text-2xl font-bold text-white mt-0.5">{card.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-5">
                {/* Recent Orders */}
                <div className="lg:col-span-2 bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
                  <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
                    <h2 className="font-bold text-white">Recent Orders</h2>
                    <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 text-xs">View All</Button>
                  </div>
                  {recentOrders.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No orders yet</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-700/30">
                          <tr>
                            {['Order', 'Customer', 'Amount', 'Branch', 'Status'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/30">
                          {recentOrders.map(order => (
                            <tr key={order.id} className="hover:bg-slate-700/20 transition-colors">
                              <td className="px-4 py-3 text-white font-mono text-sm">{order.orderNumber}</td>
                              <td className="px-4 py-3 text-slate-300 text-sm">{order.user?.name}</td>
                              <td className="px-4 py-3 text-white text-sm">{order.totalAmount} ETB</td>
                              <td className="px-4 py-3 text-slate-400 text-sm">{order.branch?.name}</td>
                              <td className="px-4 py-3">
                                <Badge className={`text-xs border-0 ${order.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : order.status === 'PREPARING' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                  {order.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Branch Performance */}
                <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
                  <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
                    <h2 className="font-bold text-white">Branch Performance</h2>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Live</Badge>
                  </div>
                  <div className="p-5">
                    {topBranches.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-4">No branch data</p>
                    ) : (() => {
                      const branch = topBranches[0]
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-bold">Gazebo Branch</p>
                              <p className="text-slate-400 text-xs">Gazebo, Addis Ababa</p>
                              <p className="text-green-400 text-xs flex items-center gap-1 mt-0.5"><span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" /> Active</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: 'Total Orders', value: branch._count?.orders || 0, color: 'text-amber-400' },
                              { label: 'Pending Receipts', value: stats?.pendingReceipts || 0, color: 'text-red-400' },
                              { label: 'Total Members', value: stats?.totalUsers || 0, color: 'text-blue-400' },
                              { label: 'Revenue', value: `${((stats?.totalRevenue || 0) / 1000).toFixed(1)}K`, color: 'text-green-400' },
                            ].map(s => (
                              <div key={s.label} className="bg-slate-700/40 rounded-xl p-3 text-center">
                                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                            <div className="flex items-center gap-1 text-amber-400 text-sm">
                              <Star className="w-3.5 h-3.5 fill-current" />
                              <span className="font-bold">4.8</span>
                              <span className="text-slate-500 text-xs">Google rating</span>
                            </div>
                            <Link href="/admin/branches">
                              <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 text-xs h-7 px-2">Manage →</Button>
                            </Link>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: Gift, label: 'Create Reward', color: 'from-amber-500 to-orange-500', href: '#' },
                  { icon: Bell, label: 'Send Notification', color: 'from-blue-500 to-cyan-500', href: '/admin/notify' },
                  { icon: BarChart3, label: 'View Analytics', color: 'from-purple-500 to-pink-500', href: '/admin/analytics' },
                  { icon: Shield, label: 'Fraud Report', color: 'from-red-500 to-orange-500', href: '/admin/fraud' },
                ].map(action => (
                  <Link key={action.label} href={action.href}>
                    <Button className={`w-full h-auto py-4 bg-gradient-to-r ${action.color} hover:opacity-90 flex-col gap-2 shadow-lg`}>
                      <action.icon className="w-5 h-5" />
                      <span className="text-xs font-semibold">{action.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </>
          )}

          {activeSection === 'receipts' && (
            <div className="space-y-3">
              {pendingReceipts.length === 0 ? (
                <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-12 text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <p className="text-white font-semibold text-lg">All caught up!</p>
                  <p className="text-slate-400 text-sm mt-1">No pending receipts to review</p>
                </div>
              ) : (
                pendingReceipts.map((receipt, i) => (
                  <motion.div key={receipt.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-white">{receipt.user?.name}</p>
                          <Badge className={`text-xs border-0 ${receipt.fraudScore > 0.5 ? 'bg-red-500/20 text-red-400' : receipt.fraudScore > 0.3 ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                            {receipt.fraudScore > 0.5 ? '⚠️ High Risk' : receipt.fraudScore > 0.3 ? '⚡ Review' : '✓ Low Risk'}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm">{receipt.user?.phone} • {receipt.branch?.name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-white font-semibold">{receipt.amount} ETB</span>
                          <span className="text-amber-400">+{receipt.pointsEarned} pts</span>
                          <span className="text-slate-500">{new Date(receipt.createdAt).toLocaleDateString()}</span>
                        </div>
                        {receipt.fraudReasons?.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                            <p className="text-red-400 text-xs">{receipt.fraudReasons.join(', ')}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" onClick={() => reviewReceipt(receipt.id, 'approve')} disabled={reviewLoading === receipt.id}
                          className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 h-9">
                          {reviewLoading === receipt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" onClick={() => reviewReceipt(receipt.id, 'reject')} disabled={reviewLoading === receipt.id}
                          className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 h-9">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
