import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Building2, CreditCard, Gift, Mail, Phone, Shield, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Corporate Accounts',
  description: "Nelliy's Rewards corporate accounts — reward your team with premium coffee perks.",
}

const perks = [
  { icon: CreditCard, title: 'Bulk Point Packages', desc: 'Purchase points in bulk at discounted rates for your entire team.' },
  { icon: Gift, title: 'Team Rewards', desc: 'Send rewards directly to employee accounts for milestones & birthdays.' },
  { icon: Shield, title: 'Dedicated Support', desc: 'A dedicated account manager for your company.' },
  { icon: Building2, title: 'Multi-Branch Access', desc: 'Employees can redeem at any Nelliy\'s location.' },
]

const plans = [
  { name: 'Starter', seats: 'Up to 10 employees', price: '500 ETB/mo', features: ['5,000 points/month', 'Basic reporting', 'Email support'] },
  { name: 'Business', seats: 'Up to 50 employees', price: '2,000 ETB/mo', features: ['30,000 points/month', 'Advanced analytics', 'Priority support', 'Custom branding'], popular: true },
  { name: 'Enterprise', seats: 'Unlimited', price: 'Custom', features: ['Unlimited points', 'Dedicated manager', 'API access', 'White-label option'] },
]

export default function CorporatePage() {
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

      <section className="bg-gradient-to-r from-amber-800 to-amber-600 py-20 px-4 text-center text-white">
        <Badge className="bg-white/20 text-white border-white/30 mb-5">
          <Building2 className="w-3 h-3 mr-1" /> Corporate Program
        </Badge>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
          Corporate Accounts
        </h1>
        <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
          Reward your team with Ethiopia&apos;s finest coffee perks. Boost morale, retention, and productivity.
        </p>
        <a href="mailto:hello@nelliyrewards.com?subject=Corporate Account Inquiry">
          <Button size="lg" className="bg-white text-amber-800 hover:bg-amber-50 shadow-xl font-bold px-10">
            Contact Sales <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </a>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-display text-3xl font-bold text-amber-900 text-center mb-10">Corporate Perks</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {perks.map((p, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-amber-100 shadow-sm hover:shadow-md transition-all text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-700 to-amber-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <p.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-amber-900 mb-2">{p.title}</h3>
              <p className="text-amber-700/70 text-sm">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-amber-900 text-center mb-10">Plans</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <div key={i} className={`rounded-2xl p-6 border shadow-sm relative ${plan.popular ? 'border-amber-400 shadow-amber-100 shadow-lg bg-gradient-to-b from-amber-50 to-white' : 'border-amber-100 bg-white'}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                    Most Popular
                  </Badge>
                )}
                <h3 className="font-display text-xl font-bold text-amber-900 mb-1">{plan.name}</h3>
                <p className="text-amber-600 text-sm mb-3">{plan.seats}</p>
                <p className="text-3xl font-bold text-amber-900 mb-5">{plan.price}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-amber-800">
                      <div className="w-4 h-4 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="mailto:hello@nelliyrewards.com?subject=Corporate Account Inquiry" className={`block text-center py-2.5 rounded-xl font-semibold text-sm transition-all ${plan.popular ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:shadow-lg' : 'border border-amber-300 text-amber-700 hover:bg-amber-50'}`}>
                  Get Started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-3xl font-bold text-amber-900 mb-4">Talk to Our Team</h2>
        <p className="text-amber-700/70 mb-8">We&apos;ll build a custom plan that fits your company size and budget.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="mailto:hello@nelliyrewards.com?subject=Corporate Account Inquiry" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
            <Mail className="w-5 h-5" /> Email Sales
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
