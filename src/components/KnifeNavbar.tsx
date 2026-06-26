'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import '../styles/knifeNavbar.css';
import '../styles/knifeNavbar.css'; // Import the CSS file

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { href: '/rewards', label: 'Rewards', icon: 'gift' },
  { href: '/history', label: 'History', icon: 'history' },
  { href: '/profile', label: 'Profile', icon: 'user' },
];

export default function KnifeNavbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [woodType, setWoodType] = useState<'walnut' | 'maple' | 'rosewood'>('walnut');
  const [bladeFinish, setBladeFinish] = useState<'standard' | 'damascus' | 'polished' | 'matte'>('standard');

  // Detect system preference on mount
  useEffect(() => {
    const userPreference = window.matchMedia('(prefers-color-scheme: dark)');
    if (userPreference.matches) {
      setTheme('dark');
    }

    // Listen for changes
    const listener = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };
    userPreference.addEventListener('change', listener);
    return () => userPreference.removeEventListener('change', listener);
  }, []);

  // Example: Cycle through wood types on double click (for demo/dev)
  // In production, you'd likely have a proper theme customizer UI
  useEffect(() => {
    // This is just for demonstration - remove in production
    const handleDoubleClick = (e: MouseEvent) => {
      if (e.detail >= 2) { // Double click
        const woodTypes = ['walnut', 'maple', 'rosewood'] as const;
        const currentIndex = woodTypes.indexOf(woodType);
        const nextIndex = (currentIndex + 1) % woodTypes.length;
        setWoodType(woodTypes[nextIndex]);

        // Optional: Also cycle blade finish
        const finishes = ['standard', 'damascus', 'polished', 'matte'] as const;
        const finishIndex = finishes.indexOf(bladeFinish);
        const nextFinishIndex = (finishIndex + 1) % finishes.length;
        setBladeFinish(finishes[nextFinishIndex]);
      }
    };

    const navWrapper = document.querySelector<HTMLElement>('.knife-wrapper');
    navWrapper?.addEventListener('dblclick', handleDoubleClick as EventListener);
    return () => navWrapper?.removeEventListener('dblclick', handleDoubleClick as EventListener);
  }, [woodType, bladeFinish]);

  return (
    <>
      {/* ── Desktop knife navbar ── */}
      <nav className="knife-nav" aria-label="Main navigation">
        <div
          className="knife-wrapper"
          data-theme={theme}
          data-wood-type={woodType}
          data-blade-finish={bladeFinish}
        >
          {/* Blade with layered material realism */}
          <div className="blade">
            <div className="blade-shine-top" />
            <div className="blade-shine-mid" />
            <div className="blade-shadow-bottom" />
            <div className="blade-engraving">Nelliy&apos;s Rewards — Est. 2024</div>

            {/* Nav items inside blade */}
            <div className="nav-items">
              {/* Logo area */}
              <div className="nav-logo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="var(--knife-accent)" strokeWidth="1.5" strokeLinecap="round"
                  strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2c0 0-4 2-4 7s4 7 4 7 4-2 4-7-4-7-4-7z"/>
                  <path d="M8 9H4M20 9h-4M12 16v4M9 20h6"/>
                  <ellipse cx="12" cy="9" rx="2" ry="3"/>
                </svg>
                <span className="nav-logo-text">Nelliy</span>
              </div>

              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item${isActive ? ' active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <i className={`ti ti-${item.icon}`} aria-hidden="true" />
                    <span className="nav-label">{item.label}</span>
                    {isActive && <span className="active-line" />}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Cutting edge with micro-details */}
          <div className="cutting-edge">
            <div className="cutting-edge-shine" />
          </div>

          {/* Blade tip with dynamic reflection */}
          <div className="tip-wrap">
            <div className="tip-shape">
              <div className="tip-reflection" />
            </div>
          </div>

          {/* Bolster with engraved details */}
          <div className="bolster">
            <div className="bolster-shine" />
            <div className="bolster-engraving">NR</div>
          </div>

          {/* Handle with premium wood texture */}
          <div className="handle">
            <div className="wood-grain">
              <div className="wood-grain-detail" />
            </div>
            <div className="handle-sheen" />
            <div className="handle-shadow" />
            <div className="handle-content">
              <span className="rivet" />
              <span className="rivet" />
              <div className="medallion">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="#fffbe0" strokeWidth="1.5" strokeLinecap="round"
                  strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2c0 0-4 2-4 7s4 7 4 7 4-2 4-7-4-7-4-7z"/>
                  <path d="M8 9H4M20 9h-4M12 16v4M9 20h6"/>
                  <ellipse cx="12" cy="9" rx="2" ry="3"/>
                </svg>
                <span className="medallion-text">NR</span>
                <div className="medallion-shine" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile bottom bar ── */}
      <nav className="mobile-nav" aria-label="Mobile navigation" role="navigation">
        <div className="mobile-top-line" />
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mob-item${isActive ? ' active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => setIsMenuOpen(false)}
            >
              {isActive && <span className="mob-dot" />}
              <i className={`ti ti-${item.icon}`} aria-hidden="true" />
              <span className="mob-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Skip link for screen readers */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
    </>
  );
}