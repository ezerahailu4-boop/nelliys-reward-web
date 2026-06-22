'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Scan, Gift, Crown, ArrowRight, CheckCircle, Star, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TIER_EMOJI } from '@/lib/constants'

const STEPS = [
  {
    icon: Coffee,
    emoji: '☕',
    title: "Welcome to Nelliy's Rewards!",
    subtitle: "Ethiopia's premier coffee loyalty platform",
    description: "You've joined thousands of coffee lovers earning free drinks and exclusive rewards on every visit.",
    color: 'from-amber-500 to-orange-500',
    points: "100 welcome points added to your account!",
  },
  {
    icon: Scan,
    emoji: '📱',
    title: 'Earn Points Every Visit',
    subtitle: 'Multiple ways to earn',
    description: 'Scan the QR code at any Nelliy\'s branch, upload your receipt, or show your member QR to staff.',
    color: 'from-blue-500 to-cyan-500',
    points: "1 point for every 10 ETB spent",
  },
  {
    icon: Crown,
    emoji: '🏆',
    title: 'Climb the Tiers',
    subtitle: 'Better rewards as you grow',
    description: 'Unlock Silver, Gold, and VIP tiers for bigger multipliers, free add-ons, and exclusive perks.',
    color: 'from-purple-500 to-pink-500',
    tiers: true,
  },
  {
    icon: Gift,
    emoji: '🎁',
    title: 'Redeem Free Rewards',
    subtitle: 'Your points, your choice',
    description: 'Use your points for free espresso, cappuccino, pastries, discounts, and much more.',
    color: 'from-green-500 to-emerald-500',
    points: "Start redeeming from just 100 points",
  },
]

const TIER_LIST = [
  { tier: 'BRONZE', pts: '0–500', perks: '1× points' },
  { tier: 'SILVER', pts: '501–2000', perks: '1.25× points' },
  { tier: 'GOLD', pts: '2001–5000', perks: '1.5× points' },
  { tier: 'VIP', pts: '5000+', perks: '2× points' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const next = () => {
    if (isLast) {
      localStorage.setItem('nelliy-onboarded', '1')
      router.replace('/dashboard')
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col items-center justify-between p-6 pb-10">
      {/* Skip */}
      <div className="w-full max-w-md flex justify-end">
        <button onClick={() => { localStorage.setItem('nelliy-onboarded', '1'); router.replace('/dashboard') }}
          className="text-amber-500 text-sm font-medium hover:text-amber-700 transition-colors">
          Skip
        </button>
      </div>

      {/* Step dots */}
      <div className="flex gap-2 mt-2">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-amber-500' : 'w-2 bg-amber-200'}`} />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="w-full text-center"
          >
            {/* Icon */}
            <div className={`w-28 h-28 bg-gradient-to-br ${current.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl`}>
              <span className="text-5xl">{current.emoji}</span>
            </div>

            <h1 className="font-display text-3xl font-bold text-amber-900 mb-2">{current.title}</h1>
            <p className="text-amber-600 font-medium mb-4">{current.subtitle}</p>
            <p className="text-amber-700/70 text-base leading-relaxed mb-6">{current.description}</p>

            {/* Points badge */}
            {current.points && (
              <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-200 rounded-2xl px-4 py-2.5 mb-4">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-amber-800 text-sm font-semibold">{current.points}</span>
              </div>
            )}

            {/* Tier list */}
            {current.tiers && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {TIER_LIST.map(t => (
                  <div key={t.tier} className="bg-white rounded-2xl p-3 border border-amber-100 shadow-sm text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{TIER_EMOJI[t.tier]}</span>
                      <span className="font-bold text-amber-900 text-sm">{t.tier}</span>
                    </div>
                    <p className="text-amber-500 text-xs">{t.pts} pts</p>
                    <p className="text-amber-700 text-xs font-medium">{t.perks}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="w-full max-w-md">
        <Button onClick={next} className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base shadow-xl rounded-2xl">
          {isLast ? (
            <><CheckCircle className="w-5 h-5 mr-2" /> Start Earning!</>
          ) : (
            <>Next <ArrowRight className="w-5 h-5 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  )
}
