'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Mail, Phone, Calendar, Globe, LogOut, Save, Loader2, Camera, Crown, Star, Copy, CheckCircle, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import BottomNav from '@/components/ui/BottomNav'
import { LANGUAGES, TIER_STYLES } from '@/lib/constants'

const TIER_STYLE_MAP: Record<string, { gradient: string; badge: string }> = {
  BRONZE: { gradient: TIER_STYLES.BRONZE, badge: 'bg-amber-100 text-amber-800' },
  SILVER: { gradient: TIER_STYLES.SILVER, badge: 'bg-slate-100 text-slate-700' },
  GOLD:   { gradient: TIER_STYLES.GOLD,   badge: 'bg-yellow-100 text-yellow-800' },
  VIP:    { gradient: TIER_STYLES.VIP,    badge: 'bg-purple-100 text-purple-800' },
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-amber-100 dark:border-zinc-700 h-40" />
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-amber-100 dark:border-zinc-700 h-64" />
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-amber-100 dark:border-zinc-700 h-32" />
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-amber-100 dark:border-zinc-700 h-28" />
    </div>
  )
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [userData, setUserData] = useState<any>(null)
  const [form, setForm] = useState({ name: '', birthday: '', language: 'en' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    // Apply saved lang immediately while API loads
    const savedLang = localStorage.getItem('nelliy-lang')
    if (savedLang) setForm(f => ({ ...f, language: savedLang }))
    fetch('/api/user/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d?.user) return
        setUserData(d.user)
        setForm({
          name: d.user.name || '',
          birthday: d.user.birthday ? new Date(d.user.birthday).toISOString().split('T')[0] : '',
          language: d.user.language || savedLang || 'en',
        })
      })
      .finally(() => setLoading(false))
  }, [status])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      localStorage.setItem('nelliy-lang', form.language)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const copyReferral = () => {
    navigator.clipboard.writeText(userData?.referralCode || '')
    setCopied(true)
    toast.success('Referral code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const tier = (userData?.tier || 'BRONZE') as string
  const tierStyle = TIER_STYLE_MAP[tier] || TIER_STYLE_MAP.BRONZE
  const points = userData?.points ?? 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-zinc-950 dark:to-zinc-900">
      <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber-100 dark:border-zinc-700">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-amber-700 hover:text-amber-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <Link href="/">
            <img src="/Nelliys Logo Coffee-01.png" alt="Nelliy's Coffee" className="h-10 w-auto object-contain" />
          </Link>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 pb-28 space-y-4">
        {loading ? <SettingsSkeleton /> : (
          <>
            {/* Account Hero Card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div className={`bg-gradient-to-br ${tierStyle.gradient} rounded-3xl p-5 text-white shadow-xl relative overflow-hidden`}>
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/5 rounded-full" />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full" />
                <div className="relative flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm overflow-hidden">
                      {userData?.avatar
                        ? <img src={userData.avatar} alt="avatar" className="w-full h-full object-cover" />
                        : <span className="text-white text-3xl font-bold">{userData?.name?.[0]?.toUpperCase() || 'U'}</span>
                      }
                    </div>
                    <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer">
                      <Camera className="w-3.5 h-3.5 text-amber-600" />
                      <input type="file" accept="image/*" className="hidden" onChange={async e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }

                        // Modernized: avoid sending base64 to server.
                        // Convert to Blob URL for instant preview; server will store base64 if needed.
                        const objectUrl = URL.createObjectURL(file)
                        setUserData((u: any) => ({ ...u, avatar: objectUrl }))

                        try {
                          const formData = new FormData()
                          formData.append('avatar', file)

                          const res = await fetch('/api/user/me', {
                            method: 'PATCH',
                            body: formData,
                          })

                          if (res.ok) {
                            const payload = await res.json()
                            setUserData((u: any) => ({ ...u, avatar: payload?.user?.avatar || objectUrl }))
                            toast.success('Profile picture updated!')
                          } else {
                            toast.error('Failed to update picture')
                          }
                        } catch {
                          toast.error('Failed to update picture')
                        } finally {
                          URL.revokeObjectURL(objectUrl)
                        }
                      }} />
                    </label>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white/70 text-xs uppercase tracking-wider">Member Account</p>
                    <h2 className="font-bold text-xl text-white truncate">{userData?.name}</h2>
                    <p className="text-white/60 text-sm truncate">{userData?.phone || userData?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tierStyle.badge}`}>
                        {tier}
                      </span>
                      <div className="flex items-center gap-1 bg-white/15 rounded-full px-2.5 py-1">
                        <Star className="w-3 h-3 fill-white text-white" />
                        <span className="text-white text-xs font-bold">{points.toLocaleString()} pts</span>
                      </div>
                    </div>
                  </div>
                  <Crown className="w-8 h-8 text-white/30 flex-shrink-0" />
                </div>
              </div>
            </motion.div>

            {/* Referral Code */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-amber-100 dark:border-zinc-700 shadow-sm">
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">Referral Code</p>
              <div className="flex items-center gap-3 bg-amber-50 dark:bg-zinc-800 rounded-xl p-3 border border-amber-200 dark:border-zinc-600">
                <span className="font-mono font-bold text-amber-900 dark:text-amber-100 text-base flex-1 tracking-widest">{userData?.referralCode || '—'}</span>
                <button onClick={copyReferral} className="w-8 h-8 bg-amber-500 hover:bg-amber-600 rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                  {copied ? <CheckCircle className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                </button>
              </div>
              <p className="text-amber-500/70 text-xs mt-1.5">Share & earn 200 pts per referral</p>
            </motion.div>

            {/* Profile Form */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-amber-100 dark:border-zinc-700 shadow-sm">
              <h2 className="font-bold text-amber-900 dark:text-amber-100 mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-amber-700 mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                    <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="pl-10 h-11 border-amber-200 focus:border-amber-400 bg-amber-50/50" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-700 mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                    <Input value={userData?.email || ''} disabled className="pl-10 h-11 border-amber-100 bg-amber-50/30 text-amber-400" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-700 mb-1.5 block">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                    <Input value={userData?.phone || ''} disabled className="pl-10 h-11 border-amber-100 bg-amber-50/30 text-amber-400" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-amber-700 mb-1.5 block">Birthday 🎂</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                    <Input type="date" value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} className="pl-10 h-11 border-amber-200 focus:border-amber-400 bg-amber-50/50" />
                  </div>
                  <p className="text-xs text-amber-400 mt-1">Set your birthday to get a free reward!</p>
                </div>
              </div>
            </motion.div>

            {/* Language */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-amber-100 dark:border-zinc-700 shadow-sm">
              <h2 className="font-bold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-500" /> Language
              </h2>
              <div className="grid grid-cols-5 gap-2">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => setForm(f => ({ ...f, language: l.code }))}
                    className={`py-3 px-1 rounded-xl transition-all flex flex-col items-center gap-1.5 border-2 ${
                      form.language === l.code
                        ? 'bg-amber-500 border-amber-500 text-white shadow-lg scale-105'
                        : 'bg-amber-50 dark:bg-zinc-800 border-amber-100 dark:border-zinc-600 text-amber-700 dark:text-amber-300 hover:border-amber-300 hover:bg-amber-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <span className="text-xl leading-none">{l.flag}</span>
                    <span className="text-[10px] font-semibold leading-tight text-center break-words w-full">{l.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-amber-400 mt-3">Save changes to apply your language preference.</p>
            </motion.div>

            {/* Account Info */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-amber-100 dark:border-zinc-700 shadow-sm">
              <h2 className="font-bold text-amber-900 dark:text-amber-100 mb-3">Account Details</h2>
              <div className="space-y-0 text-sm divide-y divide-amber-50 dark:divide-zinc-700">
                {[
                  { label: 'Member Since', value: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—' },
                  { label: 'Total Spent', value: `${(userData?.totalSpent || 0).toLocaleString()} ETB` },
                  { label: 'Current Tier', value: tier },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2.5">
                    <span className="text-amber-500">{row.label}</span>
                    <span className="font-semibold text-amber-900 dark:text-amber-100">{row.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Dark Mode Toggle */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-amber-100 dark:border-zinc-700 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="w-5 h-5 text-amber-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-100">Appearance</p>
                    <p className="text-xs text-amber-500">{theme === 'dark' ? 'Dark mode on' : 'Light mode on'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-amber-500' : 'bg-amber-200'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </motion.div>

            {/* Save */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
              <Button onClick={save} disabled={saving} className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5 mr-2" />Save Changes</>}
              </Button>

              <button
                onClick={() => { signOut({ callbackUrl: '/' }); toast.success('Signed out') }}
                className="w-full h-12 rounded-xl border-2 border-red-200 text-red-500 font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </motion.div>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
