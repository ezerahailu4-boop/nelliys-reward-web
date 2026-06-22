export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 animate-pulse">
      <div className="h-14 bg-white/80 border-b border-amber-100" />
      <div className="max-w-md mx-auto px-4 py-5 space-y-4">
        <div className="h-48 bg-amber-200/40 rounded-3xl" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl border border-amber-100" />)}
        </div>
        <div className="h-24 bg-white rounded-2xl border border-amber-100" />
        <div className="h-24 bg-white rounded-2xl border border-amber-100" />
      </div>
    </div>
  )
}
