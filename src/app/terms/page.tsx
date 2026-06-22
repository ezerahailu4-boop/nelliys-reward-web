'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-amber-700 hover:text-amber-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <h1 className="font-display text-lg font-bold text-amber-900">Terms of Service</h1>
          <div className="w-16" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="font-display text-3xl font-bold text-amber-900 mb-2">Terms of Service</h2>
        <p className="text-amber-600 text-sm mb-8">Last updated: January 2026</p>
        {[
          { title: '1. Acceptance of Terms', body: 'By creating an account and using Nelliy\'s Rewards, you agree to these terms. If you do not agree, please do not use the service.' },
          { title: '2. Points & Rewards', body: 'Points are earned on qualifying purchases and have no cash value. Points may expire after 12 months of account inactivity. Nelliy\'s reserves the right to modify the points program at any time.' },
          { title: '3. Account Responsibility', body: 'You are responsible for maintaining the security of your account. Do not share your login credentials. Report any unauthorized access immediately.' },
          { title: '4. Prohibited Activities', body: 'Fraudulent receipt submissions, account manipulation, or abuse of the referral program will result in immediate account termination and forfeiture of all points.' },
          { title: '5. Modifications', body: 'We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.' },
          { title: '6. Contact', body: 'For questions about these terms, contact legal@nelliyrewards.com.' },
        ].map(s => (
          <div key={s.title} className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm mb-4">
            <h3 className="font-bold text-amber-900 mb-2">{s.title}</h3>
            <p className="text-amber-700/80 text-sm leading-relaxed">{s.body}</p>
          </div>
        ))}
      </main>
    </div>
  )
}
