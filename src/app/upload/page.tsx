'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Camera, X, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import BottomNav from '@/components/ui/BottomNav'

export default function UploadReceiptPage() {
  const { status } = useSession()
  const router = useRouter()
  const [image, setImage] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [branches, setBranches] = useState<{ id: string; name: string; address: string }[]>([])
  const [branchId, setBranchId] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  useEffect(() => {
    fetch('/api/branches').then(r => r.json()).then(d => {
      setBranches(d.branches || [])
      if (d.branches?.length === 1) setBranchId(d.branches[0].id)
    })
  }, [])

  const pickFile = (f: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(f.type))
      return toast.error('Only JPG, PNG, WEBP or HEIC images are allowed')
    if (f.size > 10 * 1024 * 1024) return toast.error('File too large. Max 10MB.')
    setFile(f)
    setImage(URL.createObjectURL(f))
    setResult(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) pickFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) pickFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    if (branches.length > 1 && !branchId) return toast.error('Please select a branch')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (branchId) formData.append('branchId', branchId)

      const res = await fetch('/api/receipts/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Upload failed')
        setResult({ success: false, message: data.error || 'Upload failed' })
      } else {
        toast.success(`+${data.receipt.pointsEarned} points added!`)
        setResult({ success: true, data: data.receipt })
        setTimeout(() => router.push('/dashboard?refresh=1'), 2000)
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      toast.error('Upload failed. Please try again.')
      setResult({ success: false, message: 'Upload failed. Please try again.' })
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setImage(null)
    setFile(null)
    setResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-amber-100">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-amber-700 hover:text-amber-900">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
          <h1 className="font-display text-lg font-bold text-amber-900">Upload Receipt</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Upload className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold text-amber-900 mb-2">Upload Your Receipt</h2>
          <p className="text-amber-700/70">AI reads your receipt and awards points automatically</p>
        </motion.div>

        {branches.length > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
            <label className="text-amber-800 text-sm font-medium mb-1.5 block">Which branch did you visit?</label>
            <select
              value={branchId}
              onChange={e => setBranchId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-white focus:border-amber-400 focus:outline-none text-amber-900 text-sm"
            >
              <option value="">Select a branch...</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name} — {b.address}</option>
              ))}
            </select>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          {!image ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-amber-300 rounded-3xl p-12 text-center bg-white/60 cursor-pointer hover:border-amber-400 hover:bg-white transition-all shadow-sm"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-amber-600" />
              </div>
              <p className="text-amber-800 font-semibold mb-1">Tap to upload or drag & drop</p>
              <p className="text-amber-500 text-sm">JPG, PNG up to 10MB</p>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
            </div>
          ) : (
            <div className="relative">
              <div className="rounded-3xl overflow-hidden border-2 border-amber-200 shadow-lg">
                <img src={image} alt="Receipt" className="w-full aspect-[3/4] object-cover" />
              </div>
              <button onClick={reset} className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 transition-colors">
                <X className="w-5 h-5 text-amber-700" />
              </button>
              {uploading && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-3xl">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-amber-600 animate-spin mx-auto mb-3" />
                    <p className="text-amber-800 font-semibold">Reading your receipt...</p>
                    <p className="text-amber-500 text-sm mt-1">Please wait</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {image && !uploading && !result && (
            <div className="flex gap-3 mt-4">
              <Button onClick={reset} variant="outline" className="flex-1 h-12 border-amber-300 text-amber-700 hover:bg-amber-50">
                Retake
              </Button>
              <Button onClick={handleUpload} className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg">
                <Upload className="w-5 h-5 mr-2" />
                Submit Receipt
              </Button>
            </div>
          )}
        </motion.div>

        <AnimatePresence>
          {result?.success && result.data && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mt-5 bg-white rounded-3xl p-6 border border-green-200 shadow-lg text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-black text-amber-900 mb-1">Points Added! 🎉</h3>
              <p className="text-amber-500 text-sm mb-4">{result.data.branch}</p>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 mb-4">
                <p className="text-6xl font-black text-green-600">+{result.data.pointsEarned}</p>
                <p className="text-amber-600 font-medium mt-1">points earned</p>
                <p className="text-amber-400 text-sm mt-1">from {result.data.amount.toLocaleString()} ETB</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={reset} variant="outline" className="flex-1 border-amber-300 text-amber-700">Upload Another</Button>
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold">View Dashboard</Button>
                </Link>
              </div>
            </motion.div>
          )}
          {result?.success === false && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-5 bg-red-50 rounded-2xl p-4 border border-red-200 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 font-medium">{result.message}</p>
              <Button onClick={reset} variant="outline" className="mt-3 border-red-300 text-red-600">Try Again</Button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
          <h3 className="font-semibold text-amber-900 mb-3">Tips for best results</h3>
          <div className="space-y-2">
            {[
              'Ensure the receipt is well-lit',
              'Include the entire receipt in frame',
              'Make sure the total amount is visible',
              'Include the receipt number if possible',
            ].map((tip) => (
              <div key={tip} className="flex items-center gap-2 text-sm text-amber-700">
                <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                {tip}
              </div>
            ))}
          </div>
        </motion.div>
      </main>
      <BottomNav />
    </div>
  )
}
