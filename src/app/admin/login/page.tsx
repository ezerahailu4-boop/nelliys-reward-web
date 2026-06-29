'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Lock, User, Eye, EyeOff, Loader2, Shield, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focusField, setFocusField] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error('Invalid credentials')
        return
      }
      localStorage.setItem('admin_token', data.token)
      const saved = localStorage.getItem('admin_token')
      if (!saved) {
        toast.error('Could not save session. Check browser settings.')
        return
      }
      toast.success('Welcome back!')
      window.location.href = '/admin'
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-root">
      {/* Animated background */}
      <div className="admin-login-bg" aria-hidden="true">
        <div className="admin-login-orb admin-login-orb--1" />
        <div className="admin-login-orb admin-login-orb--2" />
        <div className="admin-login-orb admin-login-orb--3" />
        <div className="admin-login-grid" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
        className="admin-login-card-wrap"
      >
        {/* Glow ring behind card */}
        <div className="admin-login-card-glow" aria-hidden="true" />

        <div className="admin-login-card">
          {/* Top stripe */}
          <div className="admin-login-stripe" aria-hidden="true" />

          {/* Header */}
          <div className="admin-login-header">
            <motion.div
              className="admin-login-logo"
              whileHover={{ rotate: 8, scale: 1.06 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Image
                src="/Nelliys Logo Coffee-01.png"
                alt="Nelliy's Coffee"
                width={44}
                height={44}
                style={{ objectFit: 'contain', borderRadius: '50%' }}
                priority
              />
            </motion.div>
            <h1 className="admin-login-title">Nelliy&apos;s Admin</h1>
            <p className="admin-login-subtitle">Control Panel · Secure Access</p>
          </div>

          {/* Security badge */}
          <div className="admin-login-badge">
            <Shield className="admin-login-badge-icon" size={14} />
            <span>Restricted — Authorized Personnel Only</span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="admin-login-form">
            {/* Username */}
            <div className={`admin-login-field${focusField === 'user' ? ' is-focused' : ''}`}>
              <label className="admin-login-label">Username</label>
              <div className="admin-login-input-wrap">
                <User size={16} className="admin-login-input-icon" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onFocus={() => setFocusField('user')}
                  onBlur={() => setFocusField(null)}
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                  className="admin-login-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className={`admin-login-field${focusField === 'pass' ? ' is-focused' : ''}`}>
              <label className="admin-login-label">Password</label>
              <div className="admin-login-input-wrap">
                <Lock size={16} className="admin-login-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusField('pass')}
                  onBlur={() => setFocusField(null)}
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                  className="admin-login-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="admin-login-eye"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              className="admin-login-btn"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <Loader2 size={18} className="admin-login-spinner" />
              ) : (
                <>
                  <Sparkles size={15} />
                  Sign In to Admin Panel
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <p className="admin-login-footer">
            Nelliy&apos;s Rewards &copy; {new Date().getFullYear()}
          </p>
        </div>
      </motion.div>

      <style>{`
        .admin-login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: #0a0806;
          position: relative;
          overflow: hidden;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }

        /* ── Animated background ── */
        .admin-login-bg {
          position: absolute; inset: 0; pointer-events: none;
        }
        .admin-login-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); animation: orb-float 8s ease-in-out infinite;
        }
        .admin-login-orb--1 {
          width: 420px; height: 420px; top: -10%; left: -8%;
          background: radial-gradient(circle, rgba(245,158,11,0.12), transparent 70%);
          animation-delay: 0s;
        }
        .admin-login-orb--2 {
          width: 300px; height: 300px; bottom: -5%; right: -5%;
          background: radial-gradient(circle, rgba(234,88,12,0.1), transparent 70%);
          animation-delay: -3s;
        }
        .admin-login-orb--3 {
          width: 200px; height: 200px; top: 40%; right: 20%;
          background: radial-gradient(circle, rgba(251,191,36,0.07), transparent 70%);
          animation-delay: -6s;
        }
        @keyframes orb-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-24px) scale(1.05); }
        }
        .admin-login-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(245,158,11,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245,158,11,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* ── Card wrap ── */
        .admin-login-card-wrap {
          position: relative; width: 100%; max-width: 420px;
        }
        .admin-login-card-glow {
          position: absolute; inset: -2px; border-radius: 28px;
          background: linear-gradient(135deg, rgba(245,158,11,0.3), rgba(234,88,12,0.2), rgba(245,158,11,0.1));
          filter: blur(16px); z-index: 0; opacity: 0.7;
        }

        /* ── Card ── */
        .admin-login-card {
          position: relative; z-index: 1;
          background: rgba(18,13,8,0.92);
          border: 1px solid rgba(245,158,11,0.18);
          border-radius: 24px;
          padding: 2rem;
          backdrop-filter: blur(24px);
          overflow: hidden;
        }

        .admin-login-stripe {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent, #f59e0b 20%, #fbbf24 50%, #ea580c 80%, transparent);
        }

        /* ── Header ── */
        .admin-login-header {
          text-align: center; margin-bottom: 1.5rem;
        }
        .admin-login-logo {
          width: 72px; height: 72px; border-radius: 50%;
          background: white;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem;
          box-shadow:
            0 0 0 4px rgba(245,158,11,0.2),
            0 8px 24px rgba(0,0,0,0.5);
          cursor: pointer; overflow: hidden;
        }
        .admin-login-title {
          font-size: 1.5rem; font-weight: 800;
          color: #fff; letter-spacing: -0.02em; margin-bottom: 4px;
        }
        .admin-login-subtitle {
          font-size: 0.8rem; color: rgba(255,255,255,0.35);
          letter-spacing: 1px; text-transform: uppercase;
        }

        /* ── Security badge ── */
        .admin-login-badge {
          display: flex; align-items: center; gap: 8px;
          background: rgba(245,158,11,0.08);
          border: 1px solid rgba(245,158,11,0.2);
          border-radius: 10px; padding: 10px 14px;
          margin-bottom: 1.5rem;
          color: #f59e0b; font-size: 0.78rem; font-weight: 600;
        }
        .admin-login-badge-icon { flex-shrink: 0; }

        /* ── Form ── */
        .admin-login-form { display: flex; flex-direction: column; gap: 1rem; }

        .admin-login-field { display: flex; flex-direction: column; gap: 6px; }

        .admin-login-label {
          font-size: 0.75rem; font-weight: 600;
          color: rgba(255,255,255,0.4); letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .admin-login-field.is-focused .admin-login-label { color: #f59e0b; }

        .admin-login-input-wrap {
          position: relative;
        }
        .admin-login-input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: rgba(255,255,255,0.25); pointer-events: none;
          transition: color 0.18s;
        }
        .admin-login-field.is-focused .admin-login-input-icon { color: #f59e0b; }

        .admin-login-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 14px 12px 42px;
          color: white; font-size: 0.9rem;
          outline: none;
          transition: border-color 0.18s, background 0.18s;
        }
        .admin-login-input::placeholder { color: rgba(255,255,255,0.2); }
        .admin-login-input:focus {
          border-color: #f59e0b;
          background: rgba(245,158,11,0.06);
        }

        .admin-login-eye {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: transparent; border: none; cursor: pointer;
          color: rgba(255,255,255,0.3); transition: color 0.18s; padding: 2px;
        }
        .admin-login-eye:hover { color: rgba(255,255,255,0.7); }

        /* ── Submit button ── */
        .admin-login-btn {
          width: 100%; height: 50px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          border-radius: 13px; font-size: 0.9rem; font-weight: 700; color: white;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 40%, #ea580c 100%);
          box-shadow: 0 4px 18px rgba(245,158,11,0.35), inset 0 1px 1px rgba(255,255,255,0.2);
          transition: box-shadow 0.18s, opacity 0.18s;
          margin-top: 0.5rem;
        }
        .admin-login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .admin-login-btn:not(:disabled):hover {
          box-shadow: 0 6px 24px rgba(245,158,11,0.5);
        }
        .admin-login-spinner { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Footer ── */
        .admin-login-footer {
          text-align: center; font-size: 0.72rem;
          color: rgba(255,255,255,0.15); margin-top: 1.5rem;
        }
      `}</style>
    </div>
  )
}
