'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl border border-amber-100">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="font-bold text-amber-900 text-xl mb-2">Something went wrong</h2>
        <p className="text-amber-600/70 text-sm mb-6">We couldn't load your dashboard. Please try again.</p>
        <Button onClick={reset} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold">
          <RefreshCw className="w-4 h-4 mr-2" /> Try Again
        </Button>
      </motion.div>
    </div>
  )
}
