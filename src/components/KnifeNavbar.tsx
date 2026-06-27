'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Menu, X, Sun, Moon, ChevronDown,
  Trophy, Clock, Gift, User, LayoutDashboard, Home,
  Sparkles
} from 'lucide-react'
import '../styles/knifeNavbar.css'

export interface KnifeLangOption {
  code: string; label: string; flag: string; rtl?: boolean
}
export interface KnifeNavLabels {
  howItWorks: string; tiers: string; contact: string
}
interface KnifeNavbarProps {
  lang?: string
  setLang?: (code: string) => void
  langOptions?: KnifeLangOption[]
  labels?: KnifeNavLabels
}

const DEFAULT_LANGS: KnifeLangOption[] = [
  { code: 'en', label: 'English',     flag: '🇬🇧' },
  { code: 'am', label: 'አማርኛ',       flag: '🇪🇹' },
  { code: 'or', label: 'Afaan Oromo', flag: '🇪🇹' },
  { code: 'ar', label: 'العربية',     flag: '🇸🇦', rtl: true },
  { code: 'fr', label: 'Français',    flag: '🇫🇷' },
]

const NAV_LINKS = [
  { href: '/',            label: 'Home',        Icon: Home },
  { href: '/dashboard',   label: 'Dashboard',   Icon: LayoutDashboard },
  { href: '/rewards',     label: 'Rewards',     Icon: Gift },
  { href: '/history',     label: 'History',     Icon: Clock },
  { href: '/leaderboard', label: 'Leaderboard', Icon: Trophy },
  { href: '/profile',     label: 'Profile',     Icon: User },
]

export default function KnifeNavbar({
  lang = 'en', setLang, langOptions = DEFAULT_LANGS, labels,
}: KnifeNavbarProps) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen,   setLangOpen]   = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    fn(); window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const HIDDEN_PREFIXES = [
    '/dashboard', '/history', '/order', '/profile', '/rewards',
    '/scan', '/settings', '/upload', '/referral', '/admin',
    '/onboarding', '/pos',
  ]
  const shouldHide = HIDDEN_PREFIXES.some(
    (p) => pathname === p || pathname?.startsWith(p + '/')
  )
  if (shouldHide) return null

  const currentLang = langOptions.find(l => l.code === lang) || langOptions[0]

  return (
    <>
      {/* ══ DESKTOP KNIFE ══ */}
      <header className={`knav${scrolled ? ' knav--scrolled' : ''}`} aria-label="Site navigation">
        <div className="knav__scene" aria-hidden="true">
          <div className="knav__blade">
            <div className="knav__blade-shine-1" />
            <div className="knav__blade-shine-2" />
            <div className="knav__blade-shadow" />
            <div className="knav__blade-bevel" />
            <div className="knav__blade-engraving">Nelliy&apos;s Rewards · Est. 2024</div>
          </div>
          <div className="knav__tip" />
          <div className="knav__bolster">
            <div className="knav__bolster-shine" />
            <div className="knav__bolster-groove" />
          </div>
          <div className="knav__handle">
            <div className="knav__wood" />
            <div className="knav__handle-sheen" />
            <div className="knav__handle-shadow" />
            <div className="knav__handle-row">
              <span className="knav__rivet" />
              <span className="knav__rivet" />
              <div className="knav__medallion">
                <Image src="/Nelliys Logo Coffee-01.png" alt="Nelliy's" width={26} height={26}
                  style={{ objectFit: 'contain', borderRadius: '50%' }} />
              </div>
            </div>
          </div>
          <div className="knav__cutting-edge" />
        </div>

        <div className="knav__content">
          <Link href="/" className="knav__brand" aria-label="Nelliy's Rewards home">
            <span className="knav__logo-ring">
              <Image src="/Nelliys Logo Coffee-01.png" alt="Nelliy's Coffee"
                width={30} height={30} style={{ objectFit: 'contain' }} priority />
            </span>
            <span className="knav__brand-text">
              Nelliy&apos;s<span className="knav__brand-sub">Rewards</span>
            </span>
          </Link>

          <nav className="knav__links" aria-label="Primary">
            {NAV_LINKS.map(({ href, label, Icon }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href}
                  className={`knav__link${active ? ' knav__link--active' : ''}`}
                  aria-current={active ? 'page' : undefined}>
                  <Icon size={14} aria-hidden="true" />
                  <span>{label}</span>
                  <span className="knav__underline" aria-hidden="true" />
                </Link>
              )
            })}
          </nav>

          <div className="knav__actions">
            <button type="button" className="knav__icon-btn" aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
              <Sun className="knav__sun" size={16} />
              <Moon className="knav__moon" size={16} />
            </button>

            <div className="knav__lang-wrap">
              <button type="button" className="knav__lang-btn"
                onClick={() => setLangOpen(o => !o)}
                aria-haspopup="listbox" aria-expanded={langOpen}>
                <span>{currentLang.flag}</span>
                <span className="knav__lang-label">{currentLang.label}</span>
                <ChevronDown size={12} />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.14 }}
                    className="knav__lang-menu" role="listbox">
                    {langOptions.map(opt => (
                      <li key={opt.code}>
                        <button type="button" role="option" aria-selected={opt.code === lang}
                          className={`knav__lang-opt${opt.code === lang ? ' is-active' : ''}`}
                          onClick={() => { setLang?.(opt.code); setLangOpen(false) }}>
                          <span>{opt.flag}</span><span>{opt.label}</span>
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            <div className="knav__auth">
              <Link href="/login"    className="knav__signin">Sign In</Link>
              <Link href="/register" className="knav__join"><Sparkles size={13} />Join Now</Link>
            </div>

            <button type="button" className="knav__icon-btn knav__hamburger"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* ══ MOBILE BOTTOM NAV ══ */}
      <nav className="knav__mobile-bottom" aria-label="Mobile navigation">
        <div className="knav__mobile-bottom-glow" aria-hidden="true" />
        {NAV_LINKS.map(({ href, label, Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`knav__mob-item${active ? ' knav__mob-item--active' : ''}`}
              aria-current={active ? 'page' : undefined}>
              <span className="knav__mob-icon-wrap">
                <Icon size={22} aria-hidden="true" />
                {active && <span className="knav__mob-active-ring" />}
              </span>
              <span className="knav__mob-label">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ══ MOBILE TOP PANEL (hamburger menu) ══ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="knav__mob-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)} />
            <motion.div className="knav__mob-panel"
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}>

              {/* Panel header */}
              <div className="knav__mob-panel-header">
                <div className="knav__mob-panel-brand">
                  <Image src="/Nelliys Logo Coffee-01.png" alt="Nelliy's" width={40} height={40}
                    style={{ objectFit: 'contain', borderRadius: '50%' }} />
                  <div>
                    <div className="knav__mob-panel-name">Nelliy&apos;s</div>
                    <div className="knav__mob-panel-sub">Rewards Program</div>
                  </div>
                </div>
                <button type="button" className="knav__mob-close" onClick={() => setMobileOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              {/* Auth row */}
              <div className="knav__mob-auth-row">
                <Link href="/login" className="knav__mob-signin" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link href="/register" className="knav__mob-join" onClick={() => setMobileOpen(false)}>
                  <Sparkles size={14} /> Join Free
                </Link>
              </div>

              {/* Nav links */}
              <div className="knav__mob-links">
                {NAV_LINKS.map(({ href, label, Icon }, i) => {
                  const active = pathname === href
                  return (
                    <motion.div key={href}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.1 }}>
                      <Link href={href}
                        className={`knav__mob-link${active ? ' knav__mob-link--active' : ''}`}
                        onClick={() => setMobileOpen(false)}>
                        <span className="knav__mob-link-icon"><Icon size={20} /></span>
                        <span>{label}</span>
                        {active && <span className="knav__mob-link-dot" />}
                      </Link>
                    </motion.div>
                  )
                })}
              </div>

              {/* Language + theme row */}
              <div className="knav__mob-bottom-row">
                <div className="knav__mob-langs">
                  {langOptions.map(opt => (
                    <button key={opt.code} type="button"
                      className={`knav__mob-lang-btn${opt.code === lang ? ' is-active' : ''}`}
                      onClick={() => { setLang?.(opt.code); setMobileOpen(false) }}>
                      <span>{opt.flag}</span>
                    </button>
                  ))}
                </div>
                <button type="button" className="knav__mob-theme-btn"
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
                  {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  <span>{resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode</span>
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
