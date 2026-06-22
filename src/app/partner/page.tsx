import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle, Coffee, TrendingUp, Users, Zap, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Partner With Us',
  description: "Join the Nelliy's Rewards partner network and grow your coffee business in Ethiopia.",
}

const benefits = [
  { icon: TrendingUp, title: 'Boost Revenue', desc: 'Loyalty programs increase repeat visits by up to 40%.' },
  { icon: Users, title: 'Grow Your Base', desc: 'Tap into our existing 2,000+ member community.' },
  { icon: Zap, title: 'Easy Integration', desc: 'QR-based system — no hardware needed, live in 24 hours.' },
  { icon: Coffee, title: 'Co-Branding', desc: "Feature your brand inside the Nelliy's Rewards app." },
]

const steps = [
  { step: '01', title: 'Apply', desc: 'Fill out the form below or email us.' },
  { step: '02', title: 'Onboarding Call', desc: 'We set up your branch, QR codes & staff training.' },
  { step: '03', title: 'Go Live', desc: 'Start rewarding customers from day one.' },
]

export default function PartnerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber-100">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-amber-700 hover:text-amber-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <img src="/Nelliys Logo Coffee-01.png" alt="Nelliy's Coffee" className="h-10 w-auto object-contain ml-2" />
        </div>
      </header>

      <section className="bg-gradient-to-r from-amber-600 to-orange-600 py-20 px-4 text-center text-white">
        <Badge className="bg-white/20 text-white border-white/30 mb-5">
          <Coffee className="w-3 h-3 mr-1" /> Partnership Program
        </Badge>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
          Partner With Nelliy&apos;s
        </h1>
        <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
          Join Ethiopia&apos;s fastest-growing coffee loyalty network. Reward your customers and grow your business.
        </p>
        <a href="mailto:hello@nelliyrewards.com?subject=Partnership Inquiry">
          <Button size="lg" className="bg-white text-amber-700 hover:bg-amber-50 shadow-xl font-bold px-10">
            Apply Now <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </a>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-display text-3xl font-bold text-amber-900 text-center mb-10">Why Partner With Us?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm hover:shadow-md transition-all text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <b.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-amber-900 mb-2">{b.title}</h3>
              <p className="text-amber-700/70 text-sm">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-amber-900 text-center mb-10">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-6xl font-display font-bold text-amber-100 mb-2">{s.step}</div>
                <h3 className="font-bold text-amber-900 text-lg mb-2">{s.title}</h3>
                <p className="text-amber-700/70 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-3xl font-bold text-amber-900 mb-4">Ready to Get Started?</h2>
        <p className="text-amber-700/70 mb-8">Reach out and we&apos;ll get back to you within 24 hours.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="mailto:hello@nelliyrewards.com?subject=Partnership Inquiry" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
            <Mail className="w-5 h-5" /> Email Us
          </a>
          <a href="tel:+251976222266" className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-amber-300 text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition-all">
            <Phone className="w-5 h-5" /> +251 976 222 266
          </a>
        </div>
      </section>

      <footer className="text-center py-8 text-amber-500 text-sm border-t border-amber-100">
        <Link href="/" className="hover:text-amber-700 transition-colors">← Back to Nelliy&apos;s Rewards</Link>
      </footer>
    </div>
  )
}
