'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-amber-700 hover:text-amber-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <h1 className="font-display text-lg font-bold text-amber-900">Privacy Policy</h1>
          <div className="w-16" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8 prose prose-amber">
        <h2 className="font-display text-3xl font-bold text-amber-900 mb-2">Privacy Policy</h2>
        <p className="text-amber-600 text-sm mb-8">Last updated: January 2026</p>
        {[
          { title: '1. Information We Collect', body: 'We collect your name, phone number, email address, and transaction history to operate the loyalty program. We also collect device information and usage data to improve our services.' },
          { title: '2. How We Use Your Information', body: 'Your information is used to manage your rewards account, process points, send notifications about your rewards, and improve our services. We do not sell your personal data to third parties.' },
          { title: '3. Data Security', body: 'We use industry-standard encryption and security measures to protect your personal information. Your password is hashed and never stored in plain text.' },
          { title: '4. Notifications', body: 'With your consent, we may send SMS, WhatsApp, or push notifications about your points balance, rewards, and promotions. You can opt out at any time in Settings.' },
          { title: '5. Your Rights', body: 'You have the right to access, correct, or delete your personal data. Contact us at privacy@nelliyrewards.com to exercise these rights.' },
          { title: '6. Contact Us', body: 'For privacy-related questions, contact us at privacy@nelliyrewards.com or call +251 900 000 000.' },
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
