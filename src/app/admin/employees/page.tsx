'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, UserCheck, Star, TrendingUp, Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAdminAuth } from '@/lib/useAdminAuth'
import { adminFetch } from '@/lib/adminFetch'

export default function EmployeesPage() {
  const ready = useAdminAuth()
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    adminFetch('/api/admin/employees').then(r => r.json()).then(d => setEmployees(d.employees || [])).finally(() => setLoading(false))
  }, [ready])

  const filtered = employees.filter(e =>
    !search || e.user.name.toLowerCase().includes(search.toLowerCase()) || e.branch.name.toLowerCase().includes(search.toLowerCase())
  )

  const presentToday = (attendance: any[]) => {
    const today = new Date().toDateString()
    return attendance.some(a => new Date(a.date).toDateString() === today && a.status === 'present')
  }

  const attendanceRate = (attendance: any[]) => {
    if (!attendance.length) return 0
    const present = attendance.filter(a => a.status === 'present').length
    return Math.round((present / attendance.length) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="text-slate-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></Link>
          <h1 className="font-display text-lg font-bold text-white flex-1">Employees</h1>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{filtered.length} staff</Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or branch..."
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500" />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-slate-800/60 rounded-2xl h-20 animate-pulse border border-slate-700/50" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No employees found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((emp, i) => {
              const isPresent = presentToday(emp.attendance)
              const rate = attendanceRate(emp.attendance)
              const isOpen = expanded === emp.id
              return (
                <motion.div key={emp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-slate-800/60 rounded-2xl border border-slate-700/50 overflow-hidden">
                  <button className="w-full p-5 flex items-center gap-4 text-left hover:bg-slate-700/20 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : emp.id)}>
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {emp.user.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{emp.user.name}</p>
                        <Badge className={`text-xs border-0 ${isPresent ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                          {isPresent ? 'Present' : 'Absent'}
                        </Badge>
                      </div>
                      <p className="text-slate-400 text-sm">{emp.branch.name} • {emp.user.phone}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-6 text-right flex-shrink-0">
                      <div>
                        <p className="text-white font-bold">{emp.totalSales.toLocaleString()} ETB</p>
                        <p className="text-slate-500 text-xs">Total Sales</p>
                      </div>
                      <div>
                        <p className="text-amber-400 font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />{emp.customerRating.toFixed(1)}
                        </p>
                        <p className="text-slate-500 text-xs">Rating</p>
                      </div>
                      <div>
                        <p className="text-blue-400 font-bold">{rate}%</p>
                        <p className="text-slate-500 text-xs">Attendance</p>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-slate-700/50 pt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {[
                          { label: 'Orders Handled', value: emp.ordersHandled, icon: TrendingUp, color: 'text-green-400' },
                          { label: 'Avg Service Time', value: `${emp.avgServiceTime.toFixed(1)}m`, icon: UserCheck, color: 'text-blue-400' },
                          { label: 'Total Sales', value: `${emp.totalSales.toLocaleString()} ETB`, icon: TrendingUp, color: 'text-amber-400' },
                          { label: 'Attendance (30d)', value: `${rate}%`, icon: UserCheck, color: 'text-purple-400' },
                        ].map(s => (
                          <div key={s.label} className="bg-slate-700/40 rounded-xl p-3 text-center">
                            <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                            <p className="text-slate-500 text-xs mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      {emp.attendance.length > 0 && (
                        <div>
                          <p className="text-slate-400 text-xs mb-2">Recent Attendance (last 10 days)</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {emp.attendance.slice(0, 10).map((a: any) => (
                              <div key={a.id} title={new Date(a.date).toLocaleDateString()}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${a.status === 'present' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {new Date(a.date).getDate()}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
