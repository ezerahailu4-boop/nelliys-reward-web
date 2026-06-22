'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Scan, Gift, History, User } from 'lucide-react'

const NAV_ITEMS = [
  { icon: Home,    label: 'Home',    href: '/dashboard' },
  { icon: Scan,    label: 'Scan',    href: '/scan' },
  { icon: Gift,    label: 'Rewards', href: '/rewards' },
  { icon: History, label: 'History', href: '/history' },
  { icon: User,    label: 'Profile', href: '/profile' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
      <div className="mx-4 mb-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-amber-900/10 border border-amber-100/80 dark:border-zinc-700/80">
        <div className="max-w-md mx-auto flex justify-around px-2 py-2">
          {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} className="flex-1">
                <div className="flex flex-col items-center gap-0.5 py-1 relative">
                  <div className={`relative flex items-center justify-center w-11 h-8 rounded-xl transition-all duration-300 ${active ? 'bg-amber-500 shadow-lg shadow-amber-500/30' : 'hover:bg-amber-50'}`}>
                    {active && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-amber-500 rounded-xl"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon
                      className={`w-[18px] h-[18px] relative z-10 transition-all duration-300 ${active ? 'text-white' : 'text-amber-400 dark:text-amber-500'}`}
                      strokeWidth={active ? 2.5 : 1.8}
                    />
                  </div>
                  <span className={`text-[10px] font-semibold tracking-wide transition-all duration-300 ${active ? 'text-amber-600 dark:text-amber-400' : 'text-amber-400 dark:text-amber-500'}`}>
                    {label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
