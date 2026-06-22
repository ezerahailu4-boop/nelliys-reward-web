export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 dark:from-zinc-950 dark:to-zinc-900">
      <div className="max-w-md mx-auto px-4 pb-28 pt-4 space-y-4 animate-pulse">
        {/* Header skeleton */}
        <div className="h-16 bg-white/80 rounded-2xl" />
        {/* Points card skeleton */}
        <div className="h-48 bg-amber-200/40 rounded-3xl" />
        {/* Quick actions skeleton */}
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-amber-100 rounded-2xl" />)}
        </div>
        {/* Rewards skeleton */}
        <div className="h-6 bg-amber-100 rounded w-32" />
        <div className="flex gap-3 overflow-hidden">
          {[...Array(3)].map((_, i) => <div key={i} className="flex-shrink-0 h-36 w-36 bg-white rounded-2xl border border-amber-100" />)}
        </div>
        {/* Activity skeleton */}
        <div className="h-6 bg-amber-100 rounded w-40" />
        <div className="bg-white rounded-2xl border border-amber-100 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-3 border-b border-amber-50 last:border-0">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-amber-100 rounded w-40" />
                <div className="h-3 bg-amber-50 rounded w-24" />
              </div>
              <div className="h-4 bg-amber-100 rounded w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
