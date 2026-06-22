'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronDown, Search, MessageCircle, Phone, Mail } from 'lucide-react'
import { useState } from 'react'

const FAQS = [
  {
    category: 'Points & Earning',
    emoji: '⭐',
    items: [
      { q: 'How do I earn points?', a: 'Scan QR codes at any Nelliy\'s branch or upload your receipt. You earn 1 point for every 10 ETB spent. You also get 100 welcome points when you sign up!' },
      { q: 'How many points do I earn per purchase?', a: 'You earn 1 point per 10 ETB. So a 150 ETB order earns you 15 points. Higher tiers earn multipliers — Silver 1.25x, Gold 1.5x, VIP 2x.' },
      { q: 'When do my points expire?', a: 'Points never expire as long as your account is active (at least one transaction per 12 months).' },
      { q: 'Why haven\'t my receipt points been added?', a: 'Receipt uploads go through a quick review (usually instant, up to 24 hours for manual review). Check your History tab for status.' },
    ]
  },
  {
    category: 'Rewards & Redemption',
    emoji: '🎁',
    items: [
      { q: 'How do I redeem rewards?', a: 'Go to Rewards → Browse catalog → Tap Redeem. You\'ll get a unique code to show at the counter. Codes are valid for 30 days.' },
      { q: 'Can I use rewards at any branch?', a: 'Yes! Your reward codes are valid at all Nelliy\'s branches.' },
      { q: 'What happens if my reward expires?', a: 'Expired rewards cannot be used, but the points are not refunded. Make sure to use rewards within 30 days of redemption.' },
      { q: 'Can I redeem multiple rewards at once?', a: 'Yes, you can redeem multiple rewards in one visit as long as you have enough points for each.' },
    ]
  },
  {
    category: 'Membership Tiers',
    emoji: '👑',
    items: [
      { q: 'What are the membership tiers?', a: 'Bronze (0–500 pts), Silver (501–2000 pts), Gold (2001–5000 pts), VIP (5000+ pts). Higher tiers earn more points per purchase and unlock exclusive perks.' },
      { q: 'How do I move up a tier?', a: 'Simply earn more points! Your tier updates automatically when you cross the threshold. Check your progress bar on the dashboard.' },
      { q: 'Do I lose my tier if I don\'t spend?', a: 'Tiers are based on your total accumulated points, not monthly spending. Your tier won\'t drop.' },
    ]
  },
  {
    category: 'Referrals & Bonuses',
    emoji: '🤝',
    items: [
      { q: 'How does the referral program work?', a: 'Share your referral code with friends. When they sign up using your code, you earn 200 points and they get 100 welcome bonus points.' },
      { q: 'Is there a limit on referrals?', a: 'No limit! Refer as many friends as you want and earn 200 points for each one.' },
      { q: 'How do I claim my birthday reward?', a: 'Make sure your birthday is set in Settings. On your birthday, go to the Referral page and tap "Claim Birthday Reward" for 150 bonus points!' },
    ]
  },
  {
    category: 'Account & Technical',
    emoji: '⚙️',
    items: [
      { q: 'I forgot my password. What do I do?', a: 'Tap "Forgot Password" on the login page. Enter your phone number and we\'ll send a 6-digit reset code via SMS.' },
      { q: 'Can I change my phone number?', a: 'Phone number changes require contacting support as it\'s your primary identifier. Email us at hello@nelliyrewards.com.' },
      { q: 'Is my data safe?', a: 'Yes. We use industry-standard encryption and never share your personal data with third parties without consent.' },
      { q: 'How do I delete my account?', a: 'Contact us at hello@nelliyrewards.com with your request. Account deletion is processed within 7 business days.' },
    ]
  },
]

export default function FAQPage() {
  const [open, setOpen] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = FAQS.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      !search || item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat =>
    (activeCategory === 'All' || cat.category === activeCategory) && cat.items.length > 0
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-amber-700 hover:text-amber-900">
            <ArrowLeft className="w-5 h-5" /><span className="font-medium">Back</span>
          </Link>
          <h1 className="font-display text-lg font-bold text-amber-900">Help & FAQ</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-16">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display text-3xl font-bold text-amber-900 mb-2">How can we help?</h2>
          <p className="text-amber-700/70">Find answers to common questions about Nelliy's Rewards</p>
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-amber-200 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white shadow-sm text-amber-900 placeholder:text-amber-400" />
        </motion.div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {['All', ...FAQS.map(f => f.category)].map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeCategory === cat ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-amber-700 border border-amber-200 hover:border-amber-400'}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ list */}
        <div className="space-y-6">
          {filtered.map((cat, ci) => (
            <motion.div key={cat.category} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.05 }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{cat.emoji}</span>
                <h3 className="font-display font-bold text-amber-900">{cat.category}</h3>
              </div>
              <div className="space-y-2">
                {cat.items.map((faq, i) => {
                  const key = `${cat.category}-${i}`
                  return (
                    <div key={key} className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                      <button onClick={() => setOpen(open === key ? null : key)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-amber-50/50 transition-colors gap-3">
                        <span className="font-semibold text-amber-900 text-sm leading-snug">{faq.q}</span>
                        <ChevronDown className={`w-5 h-5 text-amber-400 flex-shrink-0 transition-transform ${open === key ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {open === key && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="px-5 pb-5 pt-0">
                              <div className="h-px bg-amber-100 mb-4" />
                              <p className="text-amber-700/80 leading-relaxed text-sm">{faq.a}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-amber-200 mx-auto mb-3" />
              <p className="text-amber-700 font-semibold">No results found</p>
              <p className="text-amber-500 text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Contact */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mt-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white text-center shadow-xl">
          <h3 className="font-display text-xl font-bold mb-2">Still need help?</h3>
          <p className="text-white/80 text-sm mb-5">Our team is here to help you</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:+251976222266" className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-5 py-3 font-semibold transition-all">
              <Phone className="w-4 h-4" /> Call Us
            </a>
            <a href="mailto:hello@nelliyrewards.com" className="flex items-center justify-center gap-2 bg-white text-amber-700 hover:bg-amber-50 rounded-xl px-5 py-3 font-semibold transition-all">
              <Mail className="w-4 h-4" /> Email Us
            </a>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
