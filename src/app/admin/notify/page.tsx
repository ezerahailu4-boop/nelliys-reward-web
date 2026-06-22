'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Bell, MessageSquare, Send, Users, CheckCircle, Loader2, Smartphone, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAdminAuth } from '@/lib/useAdminAuth'
import { adminFetch } from '@/lib/adminFetch'

const TIERS = ['ALL', 'BRONZE', 'SILVER', 'GOLD', 'VIP']
const TIER_COUNTS: Record<string, string> = {
  ALL: 'All members',
  BRONZE: 'Bronze members',
  SILVER: 'Silver members',
  GOLD: 'Gold members',
  VIP: 'VIP members',
}

export default function NotifyPage() {
  const ready = useAdminAuth()
  const [form, setForm] = useState({
    title: '',
    message: '',
    targetTier: 'ALL',
    channels: ['inapp'] as string[],
  })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    if (!ready) return
    adminFetch('/api/admin/notify').then(r => r.json()).then(setStats)
  }, [ready])

  const toggleChannel = (ch: string) => {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(ch) ? f.channels.filter(c => c !== ch) : [...f.channels, ch],
    }))
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.channels.length === 0) return toast.error('Select at least one channel')
    if (form.channels.includes('sms') && charCount > 160) {
      if (!confirm(`SMS message is ${charCount} chars (over 160). This may count as multiple SMS. Continue?`)) return
    }
    setSending(true)
    setResult(null)
    try {
      const res = await adminFetch('/api/admin/notify', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || 'Failed to send')
      setResult(data)
      toast.success(`Sent to ${data.totalUsers} users!`)
      setForm(f => ({ ...f, title: '', message: '' }))
    } catch { toast.error('Something went wrong') }
    finally { setSending(false) }
  }

  const SMS_TEMPLATES = [
    { label: 'Double Points', text: "☕ Double Points Weekend at Nelliy's! Earn 2x points on all purchases this weekend. Visit us now!" },
    { label: 'New Item', text: "🆕 New on the menu at Nelliy's Coffee! Come try our latest addition and earn points on every sip." },
    { label: 'Reminder', text: "☕ Miss us? Visit Nelliy's Coffee and earn points on your next order. Your rewards are waiting!" },
    { label: 'Holiday', text: "🎉 Happy Holidays from Nelliy's Coffee! Enjoy special offers this season. Earn & redeem your points!" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-display text-lg font-bold text-white flex-1">Bulk Notifications</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Form */}
          <div className="lg:col-span-2 space-y-5">

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Sent', value: stats.total, icon: Bell },
                  { label: 'Unread', value: stats.unread, icon: AlertTriangle },
                  { label: 'Types', value: stats.byType?.length || 0, icon: MessageSquare },
                ].map(s => (
                  <div key={s.label} className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 text-center">
                    <s.icon className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <p className="text-white font-bold text-xl">{s.value}</p>
                    <p className="text-slate-400 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={send} className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-6 space-y-5">
              <h2 className="font-bold text-white text-lg">Compose Message</h2>

              {/* Target */}
              <div>
                <label className="text-slate-400 text-xs mb-2 block">Target Audience</label>
                <div className="flex gap-2 flex-wrap">
                  {TIERS.map(t => (
                    <button key={t} type="button" onClick={() => setForm(f => ({ ...f, targetTier: t }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${form.targetTier === t ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white border border-slate-600'}`}>
                      {t === 'ALL' ? '👥 All' : t}
                    </button>
                  ))}
                </div>
                <p className="text-slate-500 text-xs mt-1.5">Sending to: {TIER_COUNTS[form.targetTier]}</p>
              </div>

              {/* Channels */}
              <div>
                <label className="text-slate-400 text-xs mb-2 block">Channels</label>
                <div className="flex gap-3">
                  {[
                    { id: 'inapp', icon: Bell, label: 'In-App', desc: 'Free' },
                    { id: 'sms', icon: Smartphone, label: 'SMS', desc: 'Via TextBee' },
                    { id: 'push', icon: Send, label: 'Push', desc: 'Via Firebase' },
                  ].map(ch => (
                    <button key={ch.id} type="button" onClick={() => toggleChannel(ch.id)}
                      className={`flex-1 flex items-center gap-3 p-3 rounded-xl border transition-all ${form.channels.includes(ch.id) ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                      <ch.icon className="w-5 h-5 flex-shrink-0" />
                      <div className="text-left">
                        <p className="font-semibold text-sm">{ch.label}</p>
                        <p className="text-xs opacity-70">{ch.desc}</p>
                      </div>
                      {form.channels.includes(ch.id) && <CheckCircle className="w-4 h-4 ml-auto flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Notification Title *</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Double Points Weekend! 🎉"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500" required />
              </div>

              {/* Message */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-slate-400 text-xs">Message *</label>
                  <span className={`text-xs ${charCount > 160 ? 'text-red-400' : 'text-slate-500'}`}>{charCount}/160</span>
                </div>
                <textarea value={form.message}
                  onChange={e => { setForm(f => ({ ...f, message: e.target.value })); setCharCount(e.target.value.length) }}
                  placeholder="Write your message here..."
                  rows={4} required
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 resize-none focus:outline-none focus:border-amber-500 text-sm" />
              </div>

              {/* Templates */}
              <div>
                <label className="text-slate-400 text-xs mb-2 block">Quick Templates</label>
                <div className="grid grid-cols-2 gap-2">
                  {SMS_TEMPLATES.map(t => (
                    <button key={t.label} type="button"
                      onClick={() => { setForm(f => ({ ...f, message: t.text })); setCharCount(t.text.length) }}
                      className="text-left p-2.5 bg-slate-700/50 hover:bg-slate-700 rounded-xl border border-slate-600 hover:border-amber-500/50 transition-all">
                      <p className="text-amber-400 text-xs font-semibold">{t.label}</p>
                      <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{t.text}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={sending || form.channels.length === 0}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg">
                {sending ? (
                  <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Sending...</>
                ) : (
                  <><Send className="w-5 h-5 mr-2" /> Send Notification</>
                )}
              </Button>
            </form>
          </div>

          {/* Result + Tips */}
          <div className="space-y-4">
            {result && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/10 rounded-2xl border border-green-500/30 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <h3 className="font-bold text-green-400">Sent Successfully!</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Users</span>
                    <span className="text-white font-bold">{result.totalUsers}</span>
                  </div>
                  {result.inAppSent > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">In-App</span>
                      <span className="text-green-400 font-bold">{result.inAppSent} ✓</span>
                    </div>
                  )}
                  {result.smsSent > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">SMS</span>
                      <span className="text-green-400 font-bold">{result.smsSent} ✓</span>
                    </div>
                  )}
                  {result.pushSent > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Push</span>
                      <span className="text-green-400 font-bold">{result.pushSent} ✓</span>
                    </div>
                  )}
                  {result.errors?.length > 0 && (
                    <div className="mt-2 p-2 bg-red-500/10 rounded-lg">
                      <p className="text-red-400 text-xs">{result.errors.join(', ')}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Tips
              </h3>
              <ul className="space-y-2 text-slate-400 text-xs">
                <li>• Keep SMS under 160 chars to avoid splitting</li>
                <li>• In-app is free and instant — use it first</li>
                <li>• SMS requires TextBee device to be online</li>
                <li>• Push requires Firebase configured in .env</li>
                <li>• Target specific tiers for better engagement</li>
                <li>• Avoid sending more than 2 SMS per week</li>
              </ul>
            </div>

            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-5">
              <h3 className="font-bold text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/admin/campaigns">
                  <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-all cursor-pointer">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300 text-sm">Manage Campaigns</span>
                  </div>
                </Link>
                <Link href="/admin/customers">
                  <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-all cursor-pointer">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 text-sm">View Customers</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
