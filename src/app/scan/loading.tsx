export default function ScanLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 animate-pulse">
      <div className="h-14 bg-white/80 border-b border-amber-100" />
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div className="h-10 bg-amber-100 rounded-2xl" />
        <div className="aspect-square bg-amber-100 rounded-3xl" />
        <div className="h-12 bg-amber-200 rounded-2xl" />
      </div>
    </div>
  )
}
