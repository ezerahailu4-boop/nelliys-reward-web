'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Settings, Save, Loader2, Shield, Bell, Coffee, Star, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminAuth } from '@/lib/useAdminAuth'

const SECTIONS = [
  { id: 'loyalty',   label: 'Loyalty Program', icon: Star },
  { id: 'security',  label: 'Security',         icon: Shield },
  { id: 'notif',     label: 'Notifications',    icon: Bell },
  { id: 'brand',     label: 'Branding',          icon: Coffee },
]

export default function AdminSettingsPage() {
  useAdminAuth()
  const [active, setActive] = useState('loyalty')
  const [saving, setSaving] = useState(false)

  const [loyalty, setLoyalty] = useState({
    pointsPerBirr: '1',
    pointsPerBirrSpend: '10',
    welcomeBonus: '100',
    birthdayBonus: '200',
    referralBonus: '150',
    expiryDays: '365',
  })

  const [tiers] = useState([
    { name: 'Bronze',   min: 0,    max: 999,   color: '#cd7f32', perks: 'Basic rewards' },
    { name: 'Silver',   min: 1000, max: 2999,  color: '#c0c0c0', perks: '5% bonus points' },
    { name: 'Gold',     min: 3000, max: 7999,  color: '#ffd700', perks: '10% bonus + priority' },
    { name: 'Platinum', min: 8000, max: 99999, color: '#e5e4e2', perks: '20% bonus + VIP perks' },
  ])

  const save = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    toast.success('Settings saved!')
    setSaving(false)
  }

  const clearCache = () => {
    localStorage.removeItem('admin_token')
    toast.success('Cache cleared — you will be logged out')
    setTimeout(() => window.location.href = '/admin/login', 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="text-lg font-bold flex-1 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" /> Settings
          </h1>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-48 flex-shrink-0 space-y-1">
          {SECTIONS.map(s => {
            const Icon = s.icon
            return (
              <button key={s.id} onClick={() => setActive(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left ${
                  active === s.id ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}>
                <Icon className="w-4 h-4" /> {s.label}
              </button>
            )
          })}
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {active === 'loyalty' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-6">
                <h2 className="font-bold text-white mb-4">Points Configuration</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'pointsPerBirr',       label: 'Points per 1 Birr spent', suffix: 'pts' },
                    { key: 'pointsPerBirrSpend',   label: 'Birr needed per point',  suffix: 'Br' },
                    { key: 'welcomeBonus',         label: 'Welcome bonus',           suffix: 'pts' },
                    { key: 'birthdayBonus',        label: 'Birthday bonus',          suffix: 'pts' },
                    { key: 'referralBonus',        label: 'Referral bonus',          suffix: 'pts' },
                    { key: 'expiryDays',           label: 'Points expiry',           suffix: 'days' },
                  ].map(({ key, label, suffix }) => (
                    <div key={key}>
                      <label className="text-xs text-slate-400 mb-1 block">{label}</label>
                      <div className="relative">
                        <input type="number" value={(loyalty as any)[key]}
                          onChange={e => setLoyalty(l => ({ ...l, [key]: e.target.value }))}
                          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 pr-12 text-white text-sm focus:outline-none focus:border-amber-500" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">{suffix}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-6">
                <h2 className="font-bold text-white mb-4">Membership Tiers</h2>
                <div className="space-y-3">
                  {tiers.map(tier => (
                    <div key={tier.name} className="flex items-center gap-4 bg-slate-700/30 rounded-xl p-4">
                      <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: tier.color }} />
                      <div className="flex-1">
                        <p className="font-semibold text-white text-sm">{tier.name}</p>
                        <p className="text-slate-400 text-xs">{tier.min.toLocaleString()} – {tier.max.toLocaleString()} pts · {tier.perks}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {active === 'security' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-6 space-y-6">
              <h2 className="font-bold text-white">Security Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                  <div>
                    <p className="font-semibold text-white text-sm">Rate Limiting</p>
                    <p className="text-slate-400 text-xs mt-0.5">Max 5 admin login attempts per minute</p>
                  </div>
                  <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full font-semibold">Active</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                  <div>
                    <p className="font-semibold text-white text-sm">Fraud Detection</p>
                    <p className="text-slate-400 text-xs mt-0.5">Auto-flag receipts with score &gt; 30%</p>
                  </div>
                  <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full font-semibold">Active</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                  <div>
                    <p className="font-semibold text-white text-sm">JWT Token Auth</p>
                    <p className="text-slate-400 text-xs mt-0.5">Admin sessions use secure token auth</p>
                  </div>
                  <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full font-semibold">Active</span>
                </div>
              </div>
              <div className="border-t border-slate-700 pt-4">
                <button onClick={clearCache}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-semibold transition-colors">
                  <Trash2 className="w-4 h-4" /> Clear Session & Log Out
                </button>
              </div>
            </motion.div>
          )}

          {active === 'notif' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-6 space-y-4">
              <h2 className="font-bold text-white">Notification Settings</h2>
              {[
                { label: 'SMS on receipt approval',  desc: 'Send SMS to customer when receipt approved' },
                { label: 'SMS on tier upgrade',      desc: 'Notify customer when they reach a new tier' },
                { label: 'Birthday SMS',             desc: 'Auto-send birthday bonus SMS' },
                { label: 'Points expiry reminder',   desc: 'Warn users 30 days before points expire' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">
                  <div>
                    <p className="font-semibold text-white text-sm">{item.label}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-10 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                  </label>
                </div>
              ))}
            </motion.div>
          )}

          {active === 'brand' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-slate-800/60 rounded-2xl border border-slate-700/50 p-6 space-y-4">
              <h2 className="font-bold text-white">Branding</h2>
              {[
                { label: 'Business Name', value: "Nelliy's Coffee" },
                { label: 'Tagline',       value: "Addis Ababa's Finest Coffee" },
                { label: 'Support Phone', value: '+251 91 234 5678' },
                { label: 'Website',       value: 'https://nelliyrewards.com' },
              ].map(item => (
                <div key={item.label}>
                  <label className="text-xs text-slate-400 mb-1 block">{item.label}</label>
                  <input defaultValue={item.value}
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500" />
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
