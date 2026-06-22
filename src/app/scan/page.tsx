'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Camera, X, CheckCircle, AlertCircle, QrCode, Loader2, Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { BrowserMultiFormatReader } from '@zxing/browser'
import BottomNav from '@/components/ui/BottomNav'

export default function ScanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; data?: any } | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [showManual, setShowManual] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'scan' | 'upload'>('scan')
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const processedRef = useRef(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    if (tab !== 'scan') stopScanner()
  }, [tab])

  const startScanner = async () => {
    processedRef.current = false
    setScanning(true)
    try {
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader
      // try rear camera first, fall back to any camera
      const constraints = { video: { facingMode: { ideal: 'environment' } } }
      await reader.decodeFromConstraints(
        constraints,
        videoRef.current!,
        async (result, err) => {
          if (!result || processedRef.current) return
          if (!result) return
          processedRef.current = true
          stopScanner()
          await handleScan(result.getText())
        }
      )
    } catch (err: any) {
      // retry with any camera if environment camera failed
      try {
        const reader2 = new BrowserMultiFormatReader()
        readerRef.current = reader2
        await reader2.decodeFromConstraints(
          { video: true },
          videoRef.current!,
          async (result, _err2) => {
            if (!result || processedRef.current) return
            processedRef.current = true
            stopScanner()
            await handleScan(result.getText())
          }
        )
      } catch (err2: any) {
        setScanning(false)
        const name = err2?.name || err?.name || ''
        if (name === 'NotAllowedError') toast.error('Camera permission denied — allow it in browser settings')
        else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') toast.error('No camera detected on this device')
        else if (name === 'NotReadableError') toast.error('Camera is in use by another app — close it and try again')
        else toast.error(`Camera error: ${err2?.message || err?.message || 'Unknown'}`)
      }
    }
  }

  const stopScanner = () => {
    if (readerRef.current) {
      try { BrowserMultiFormatReader.releaseAllStreams() } catch {}
      readerRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setScanning(false)
  }

  const handleScan = async (qrCode: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/points/earn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ success: false, message: data.error || 'Invalid QR code' })
      } else {
        setResult({ success: true, message: `You earned ${data.points} points!`, data })
        toast.success(`+${data.points} points earned!`)
      }
    } catch {
      setResult({ success: false, message: 'Failed to process QR code' })
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    await handleScan(manualCode.trim())
    setManualCode('')
  }

  useEffect(() => () => { stopScanner() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50">
      <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-amber-700 hover:text-amber-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <h1 className="font-display text-lg font-bold text-amber-900">Scan QR Code</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 pb-28">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-amber-100 rounded-2xl mb-6">
          <button onClick={() => setTab('scan')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'scan' ? 'bg-white text-amber-900 shadow-sm' : 'text-amber-600 hover:text-amber-800'}`}>
            📷 Scan QR
          </button>
          <button onClick={() => router.push('/upload')}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all text-amber-600 hover:text-amber-800">
            🧾 Upload Receipt
          </button>
        </div>

        {/* Scan Tab */}
        {tab === 'scan' && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
            {/* Camera viewport */}
            <div className="relative aspect-square rounded-3xl overflow-hidden border-4 border-amber-200 bg-black shadow-2xl">
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

              {/* Placeholder when not scanning */}
              {!scanning && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 gap-4">
                  <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-white/40" />
                  </div>
                  <p className="text-white/40 text-sm">Tap Start to activate camera</p>
                </div>
              )}

              {/* Processing overlay */}
              {loading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
                  <p className="text-white/70 text-sm">Processing...</p>
                </div>
              )}

              {/* Scanning animation corners */}
              {scanning && (
                <>
                  <div className="absolute top-4 left-4 w-10 h-10 border-l-4 border-t-4 border-amber-400 rounded-tl-2xl" />
                  <div className="absolute top-4 right-4 w-10 h-10 border-r-4 border-t-4 border-amber-400 rounded-tr-2xl" />
                  <div className="absolute bottom-4 left-4 w-10 h-10 border-l-4 border-b-4 border-amber-400 rounded-bl-2xl" />
                  <div className="absolute bottom-4 right-4 w-10 h-10 border-r-4 border-b-4 border-amber-400 rounded-br-2xl" />
                  {/* Scan line */}
                  <motion.div
                    className="absolute left-8 right-8 h-0.5 bg-amber-400/70 rounded-full"
                    animate={{ top: ['20%', '80%', '20%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-3 mt-4">
              {!scanning ? (
                <Button onClick={startScanner} className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg text-base">
                  <Camera className="w-5 h-5 mr-2" /> Start Scanning
                </Button>
              ) : (
                <Button onClick={stopScanner} variant="outline" className="flex-1 h-12 border-amber-300 text-amber-700 hover:bg-amber-50">
                  <X className="w-5 h-5 mr-2" /> Stop
                </Button>
              )}
              <Button
                onClick={() => setShowManual(!showManual)}
                variant="outline"
                className={`h-12 px-4 border-amber-300 text-amber-700 hover:bg-amber-50 transition-all ${showManual ? 'bg-amber-50' : ''}`}
              >
                <Keyboard className="w-5 h-5" />
              </Button>
            </div>

            {/* Manual entry */}
            <AnimatePresence>
              {showManual && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 bg-white rounded-2xl p-5 border border-amber-100 shadow-sm overflow-hidden"
                >
                  <h3 className="font-semibold text-amber-900 mb-3 text-sm">Enter Code Manually</h3>
                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={e => setManualCode(e.target.value)}
                      placeholder="QR code or receipt number"
                      className="flex-1 px-4 py-3 rounded-xl border border-amber-200 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 text-sm"
                    />
                    <Button type="submit" disabled={loading || !manualCode.trim()} className="h-12 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Go'}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Where to find QR */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-amber-800 mb-3">Where to find QR codes:</p>
              <div className="grid grid-cols-4 gap-2">
                {[{ emoji: '🧾', label: 'Receipt' }, { emoji: '☕', label: 'Cup' }, { emoji: '🪑', label: 'Table' }, { emoji: '🧱', label: 'Wall' }].map(item => (
                  <div key={item.label} className="bg-white rounded-2xl p-3 text-center border border-amber-100 shadow-sm">
                    <span className="text-2xl mb-1 block">{item.emoji}</span>
                    <span className="text-amber-700 text-xs font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Result Modal */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setResult(null)}
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                onClick={e => e.stopPropagation()}
                className={`bg-white rounded-3xl p-7 max-w-sm w-full text-center shadow-2xl border-4 ${result.success ? 'border-green-400' : 'border-red-400'}`}
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                  {result.success
                    ? <CheckCircle className="w-10 h-10 text-green-600" />
                    : <AlertCircle className="w-10 h-10 text-red-500" />
                  }
                </div>
                {result.success && (
                  <p className="text-4xl font-black text-green-600 mb-1">
                    +{result.data?.points}
                  </p>
                )}
                <p className="text-lg font-bold text-amber-900 mb-1">{result.message}</p>
                {result.data && (
                  <div className="text-amber-500 text-sm mb-5 space-y-1">
                    <p>{result.data.memberName ? `${result.data.memberName} · ` : ''}{result.data.branch}</p>
                    {result.data.amount && (
                      <p className="text-xs text-amber-400">
                        {result.data.amount} ETB · {result.data.multiplier}x multiplier
                        {result.data.bonusPoints > 0 && ` · +${result.data.bonusPoints} bonus`}
                      </p>
                    )}
                    <p className="font-semibold">Total: {result.data.total} pts</p>
                  </div>
                )}
                <div className="flex gap-3 mt-5">
                  <Button onClick={() => { setResult(null); processedRef.current = false }} variant="outline" className="flex-1 border-amber-200 text-amber-700">
                    Scan Again
                  </Button>
                  <Link href="/dashboard" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold">
                      Dashboard
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  )
}
