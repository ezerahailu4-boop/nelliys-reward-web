'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 p-6">
      <div className="text-center max-w-sm">
        <div className="text-7xl mb-6">☕</div>
        <h1 className="font-display text-3xl font-bold text-amber-900 mb-3">You're Offline</h1>
        <p className="text-amber-600/70 mb-2">No internet connection detected.</p>
        <p className="text-amber-500/60 text-sm mb-8">
          Grab a coffee and reconnect — your points are safe with us!
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-8 py-3 rounded-2xl shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
