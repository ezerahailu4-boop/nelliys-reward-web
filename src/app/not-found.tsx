import Link from 'next/link'
import { Coffee } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 p-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Coffee className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="font-display text-6xl font-bold text-amber-900 mb-2">404</h1>
        <p className="text-amber-700 font-medium mb-2">Page not found</p>
        <p className="text-amber-500/70 text-sm mb-8">Looks like this page went on a coffee break ☕</p>
        <Link href="/dashboard"
          className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-8 py-3 rounded-2xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
