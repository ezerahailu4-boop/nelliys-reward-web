'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, Sun, Moon, ChevronDown, Trophy, Clock, Gift, User, LayoutDashboard, Home } from 'lucide-react'
import '../styles/knifeNavbar.css'

export interface KnifeLangOption {
  code: string; label: string; flag: string; rtl?: boolean
}

export interface KnifeNavLabels {
  howItWorks: string
  tiers: string
  contact: string
}

interface KnifeNavbarProps {
  lang?: string
  setLang?: (code: string) => void
  langOptions?: KnifeLangOption[]
  labels?: KnifeNavLabels
}

const DEFAULT_LANGS: KnifeLangOption[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'am', label: 'አማርኛ',   flag: '🇪🇹' },
  { code: 'or', label: 'Afaan Oromo', flag: '🇪🇹' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
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
  lang = 'en',
  setLang,
  langOptions = DEFAULT_LANGS,
  labels,
}: KnifeNavbarProps) {
  const pathname   = usePathname()
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

  const currentLang = langOptions.find(l => l.code === lang) || langOptions[0]

  return (
    <>
      <header className={`knav${scrolled ? ' knav--scrolled' : ''}`} aria-label="Site navigation">

        {/* 3-D knife scene */}
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
                <Image
                  src="/Nelliys Logo Coffee-01.png"
                  alt="Nelliy's"
                  width={24}
                  height={24}
                  style={{ objectFit: 'contain', borderRadius: '50%' }}
                />
              </div>
            </div>
          </div>
          <div className="knav__cutting-edge" />
        </div>

        {/* Nav content */}
        <div className="knav__content">
          {/* Brand with real logo */}
          <Link href="/" className="knav__brand" aria-label="Nelliy's Rewards home">
            <span className="knav__logo-ring">
              <Image
                src="/Nelliys Logo Coffee-01.png"
                alt="Nelliy's Coffee"
                width={28}
                height={28}
                style={{ objectFit: 'contain' }}
                priority
              />
            </span>
            <span className="knav__brand-text">
              Nelliy&apos;s<span className="knav__brand-sub">Rewards</span>
            </span>
          </Link>

          {/* Desktop links */}
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

          {/* Right actions */}
          <div className="knav__actions">
            {/* Theme */}
            <button type="button" className="knav__icon-btn" aria-label="Toggle theme"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
              <Sun className="knav__sun" size={16} />
              <Moon className="knav__moon" size={16} />
            </button>

            {/* Language */}
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
                  <motion.ul
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
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

            {/* Auth */}
            <div className="knav__auth">
              <Link href="/login"    className="knav__signin">Sign In</Link>
              <Link href="/register" className="knav__join">Join Now</Link>
            </div>

            {/* Mobile hamburger */}
            <button type="button" className="knav__icon-btn knav__hamburger"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div className="knav__mobile"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}>
              <nav className="knav__mobile-links">
                {NAV_LINKS.map(({ href, label, Icon }) => {
                  const active = pathname === href
                  return (
                    <Link key={href} href={href}
                      className={`knav__mobile-link${active ? ' knav__mobile-link--active' : ''}`}
                      onClick={() => setMobileOpen(false)}>
                      <Icon size={18} />{label}
                    </Link>
                  )
                })}
              </nav>
              <div className="knav__mobile-langs">
                {langOptions.map(opt => (
                  <button key={opt.code} type="button"
                    className={`knav__lang-opt${opt.code === lang ? ' is-active' : ''}`}
                    onClick={() => { setLang?.(opt.code); setLangOpen(false) }}>
                    <span>{opt.flag}</span><span>{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="knav__mobile-auth">
                <Link href="/login"    className="knav__signin knav__signin--full" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link href="/register" className="knav__join   knav__join--full"   onClick={() => setMobileOpen(false)}>Join Now</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  )
}
