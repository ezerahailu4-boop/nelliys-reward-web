'use client'

import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Crown, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { TIER_STYLES, TIER_NEXT, TIER_MIN } from '@/lib/constants'

function useAnimatedCounter(target: number, duration = 800) {
  const [display, setDisplay] = useState(target)
  const prev = useRef(target)
  useEffect(() => {
    if (prev.current === target) return
    const start = prev.current
    const diff = target - start
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * ease))
      if (progress < 1) requestAnimationFrame(tick)
      else prev.current = target
    }
    requestAnimationFrame(tick)
  }, [target, duration])
  return display
}

interface Props {
  name: string
  points: number
  tier: string
  createdAt?: string
  onPerksClick: () => void
}

export function PointsCard({ name, points, tier, createdAt, onPerksClick }: Props) {
  const animatedPoints = useAnimatedCounter(points)
  const nextTier = TIER_NEXT[tier] ?? 500
  const minTier = TIER_MIN[tier] ?? 0
  const progress = tier === 'VIP' ? 100 : Math.min(100, ((points - minTier) / (nextTier - minTier)) * 100)
  const pointsToNext = tier === 'VIP' ? 0 : nextTier - points

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className={`bg-gradient-to-br ${TIER_STYLES[tier] ?? TIER_STYLES.BRONZE} rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden`}>
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/70 text-sm">Welcome back</p>
              <h2 className="font-display text-2xl font-bold">{name}</h2>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Crown className="w-7 h-7" />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wider">Total Points</p>
                <p className="text-4xl font-bold">{animatedPoints.toLocaleString()}</p>
              </div>
              <button onClick={onPerksClick}>
                <Badge className="bg-white/20 text-white border-0 text-xs hover:bg-white/30 cursor-pointer">
                  {tier} ▸ Perks
                </Badge>
              </button>
            </div>
            {tier !== 'VIP' && (
              <>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
                <p className="text-white/60 text-xs mt-1.5">{pointsToNext} pts to next tier</p>
              </>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-current" />
              <span>{tier} Member</span>
            </div>
            <span className="text-white/60">
              Since {new Date(createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
