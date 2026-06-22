export default function RewardsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 animate-pulse">
      <div className="h-14 bg-white/80 border-b border-amber-100" />
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div className="h-6 bg-amber-100 rounded w-32" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-white rounded-2xl border border-amber-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
