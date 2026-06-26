'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, Sun, Moon, ChevronDown, Trophy, Coffee } from 'lucide-react'
import '../styles/knifeNavbar.css'

export interface KnifeLangOption {
  code: string
  label: string
  flag: string
  rtl?: boolean
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

const DEFAULT_LANG_OPTIONS: KnifeLangOption[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'am', label: 'አማርኛ', flag: '🇪🇹' },
  { code: 'or', label: 'Afaan Oromo', flag: '🇪🇹' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
]

const DEFAULT_LABELS: KnifeNavLabels = {
  howItWorks: 'How It Works',
  tiers: 'Membership Tiers',
  contact: 'Contact Us',
}

export default function KnifeNavbar({
  lang = 'en',
  setLang,
  langOptions = DEFAULT_LANG_OPTIONS,
  labels = DEFAULT_LABELS,
}: KnifeNavbarProps) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const currentLang = langOptions.find(l => l.code === lang) || langOptions[0]

  const navLinks = [
    { href: '/#how-it-works', label: labels.howItWorks },
    { href: '/#tiers', label: labels.tiers },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/#rate-us', label: 'Rate Us' },
    { href: '/#contact', label: labels.contact },
  ]

  const handleSelectLang = (code: string) => {
    setLang?.(code)
    setLangMenuOpen(false)
  }

  return (
    <header className={`knife-nav ${scrolled ? 'knife-nav--scrolled' : ''}`}>
      <div className="knife-nav__blade-edge" aria-hidden="true" />
      <div className="knife-nav__inner">
        {/* Logo / medallion */}
        <Link href="/" className="knife-nav__brand" aria-label="Nelliy's Coffee — Home">
          <span className="knife-nav__medallion">
            <Coffee className="knife-nav__medallion-icon" />
          </span>
          <span className="knife-nav__brand-text">Nelliy&apos;s</span>
        </Link>

        {/* Desktop nav */}
        <nav className="knife-nav__links" aria-label="Primary">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="knife-nav__link">
              {link.icon ? <link.icon className="knife-nav__link-icon" aria-hidden="true" /> : null}
              <span>{link.label}</span>
              <span className="knife-nav__link-blade" aria-hidden="true" />
            </Link>
          ))}
        </nav>

        {/* Right side controls */}
        <div className="knife-nav__actions">
          {/* Theme toggle */}
          <button
            type="button"
            className="knife-nav__icon-btn"
            aria-label="Toggle dark mode"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="knife-nav__sun" />
            <Moon className="knife-nav__moon" />
          </button>

          {/* Language dropdown */}
          <div className="knife-nav__lang">
            <button
              type="button"
              className="knife-nav__lang-btn"
              onClick={() => setLangMenuOpen(o => !o)}
              aria-haspopup="listbox"
              aria-expanded={langMenuOpen}
            >
              <span className="knife-nav__lang-flag">{currentLang.flag}</span>
              <span className="knife-nav__lang-label">{currentLang.label}</span>
              <ChevronDown className="knife-nav__lang-chevron" />
            </button>
            <AnimatePresence>
              {langMenuOpen && (
                <motion.ul
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="knife-nav__lang-menu"
                  role="listbox"
                >
                  {langOptions.map(opt => (
                    <li key={opt.code}>
                      <button
                        type="button"
                        className={`knife-nav__lang-option ${opt.code === lang ? 'is-active' : ''}`}
                        onClick={() => handleSelectLang(opt.code)}
                        role="option"
                        aria-selected={opt.code === lang}
                      >
                        <span>{opt.flag}</span>
                        <span>{opt.label}</span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          {/* Auth buttons */}
          <div className="knife-nav__auth">
            <Link href="/login" className="knife-nav__signin">
              Sign In
            </Link>
            <Link href="/register" className="knife-nav__join">
              Join Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="knife-nav__icon-btn knife-nav__mobile-toggle"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="knife-nav__mobile-panel"
          >
            <nav className="knife-nav__mobile-links" aria-label="Mobile primary">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} className="knife-nav__mobile-link" onClick={() => setMobileOpen(false)}>
                  {link.icon ? <link.icon className="knife-nav__link-icon" aria-hidden="true" /> : null}
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="knife-nav__mobile-lang">
              {langOptions.map(opt => (
                <button
                  key={opt.code}
                  type="button"
                  className={`knife-nav__lang-option ${opt.code === lang ? 'is-active' : ''}`}
                  onClick={() => handleSelectLang(opt.code)}
                >
                  <span>{opt.flag}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="knife-nav__mobile-auth">
              <Link href="/login" className="knife-nav__signin knife-nav__signin--block" onClick={() => setMobileOpen(false)}>
                Sign In
              </Link>
              <Link href="/register" className="knife-nav__join knife-nav__join--block" onClick={() => setMobileOpen(false)}>
                Join Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
