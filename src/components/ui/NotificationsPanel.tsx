'use client'

import { motion } from 'framer-motion'
import { Bell, Star, Gift, Crown, X } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isSent: boolean
  createdAt: string
}

interface Props {
  notifications: Notification[]
  onClose: () => void
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  points: <Star className="w-4 h-4 text-green-600" />,
  reward: <Gift className="w-4 h-4 text-amber-600" />,
  tier_upgrade: <Crown className="w-4 h-4 text-purple-600" />,
  referral: <Gift className="w-4 h-4 text-pink-600" />,
  welcome: <Bell className="w-4 h-4 text-blue-600" />,
}

const TYPE_BG: Record<string, string> = {
  points: 'bg-green-100',
  reward: 'bg-amber-100',
  tier_upgrade: 'bg-purple-100',
  referral: 'bg-pink-100',
  welcome: 'bg-blue-100',
}

export function NotificationsPanel({ notifications, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-white" />
            <h3 className="font-display text-lg font-bold text-white">Notifications</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-10 text-center">
              <Bell className="w-10 h-10 text-amber-200 mx-auto mb-3" />
              <p className="text-amber-600 font-medium">No notifications yet</p>
              <p className="text-amber-400 text-sm mt-1">We'll notify you about points & rewards</p>
            </div>
          ) : notifications.map((n, i) => (
            <div key={n.id} className={`px-5 py-4 flex items-start gap-3 ${i < notifications.length - 1 ? 'border-b border-amber-50 dark:border-zinc-800' : ''} ${!n.isSent ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_BG[n.type] ?? 'bg-gray-100'}`}>
                {TYPE_ICON[n.type] ?? <Bell className="w-4 h-4 text-gray-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">{n.title}</p>
                <p className="text-amber-600/70 dark:text-amber-400/70 text-xs mt-0.5">{n.message}</p>
                <p className="text-amber-400 text-xs mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
              </div>
              {!n.isSent && <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-1.5" />}
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-amber-100 dark:border-zinc-800">
          <button onClick={onClose} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-2xl">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}
