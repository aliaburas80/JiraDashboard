'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getInitialTheme, applyTheme } from '@/lib/theme';
import UserMenu from '@/components/auth/UserMenu';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';

const NAV_GROUPS = [
  {
    label: 'Analytics',
    items: [
      { href: '/summary',   label: 'Overview',     desc: 'Health at a glance'       },
      { href: '/dashboard', label: 'Full Report',  desc: 'All metrics & filters'    },
      { href: '/charts',    label: 'Charts',       desc: 'Visual breakdowns'        },
      { href: '/trends',    label: 'Trends',       desc: 'Upload-over-upload change' },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { href: '/readiness', label: 'Readiness',  desc: 'Go / No-Go per release'    },
      { href: '/explore',   label: 'Explore',    desc: 'Work item dependency graph' },
      { href: '/customer',  label: 'Customer',   desc: 'Customer-visible progress'  },
    ],
  },
  {
    label: 'Data',
    items: [
      { href: '/snapshots', label: 'Snapshots', desc: 'Saved metric snapshots'     },
      { href: '/backend',   label: 'Backend',   desc: 'Import logs & raw data'     },
    ],
  },
  {
    label: 'Reference',
    items: [
      { href: '/glossary',  label: 'Glossary',  desc: 'Term & abbreviation guide'  },
      { href: '/developer', label: 'Developer', desc: 'API & technical docs'       },
      { href: '/help',      label: 'Help',      desc: 'How to use this app'        },
    ],
  },
];

export default function AppShell({ children, showNav }: { children: React.ReactNode; showNav?: boolean }) {
  const pathname = usePathname();
  const [theme, setTheme]         = useState<'light' | 'dark'>('light');
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on navigation
  useEffect(() => {
    setOpenGroup(null);
    setMobileOpen(false);
  }, [pathname]);

  function toggleTheme() {
    const next: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
  }

  function isGroupActive(group: typeof NAV_GROUPS[0]) {
    return group.items.some(i => pathname === i.href);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 dark:text-slate-100 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-3">

          {/* ── Left: logo + upload restart button ── */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo/delivery-clarity-logo-horizontal.svg"
                alt="Delivery Clarity"
                width={160}
                height={32}
                className="hidden sm:block h-8 w-auto dark:brightness-0 dark:invert"
                style={{ width: 'auto', height: '2rem' }}
                priority
              />
              <Image
                src="/logo/delivery-clarity-logo-icon.svg"
                alt="Delivery Clarity"
                width={32}
                height={32}
                className="sm:hidden h-8 w-8"
                priority
              />
            </Link>

            {showNav && (
              <Link
                href="/"
                title="Upload a new file — resets current session"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap
                           bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V4m0 0L8 8m4-4l4 4" />
                </svg>
                <span className="hidden sm:inline">New Upload</span>
              </Link>
            )}
          </div>

          {/* ── Right: grouped nav + controls ── */}
          <div className="flex items-center gap-1 ml-auto" ref={navRef}>
            {showNav && (
              <>
                {/* Desktop grouped nav */}
                <nav className="hidden md:flex items-center gap-0.5">
                  {NAV_GROUPS.map(group => {
                    const active = isGroupActive(group);
                    const open   = openGroup === group.label;
                    return (
                      <div key={group.label} className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenGroup(open ? null : group.label)}
                          className={
                            'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ' +
                            (active
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800')
                          }
                        >
                          {group.label}
                          <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {open && (
                          <div className="absolute top-full left-0 mt-1.5 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-50">
                            {group.items.map(item => {
                              const itemActive = pathname === item.href;
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  className={
                                    'flex flex-col px-4 py-2.5 transition-colors ' +
                                    (itemActive
                                      ? 'bg-blue-50 dark:bg-blue-900/30'
                                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50')
                                  }
                                >
                                  <span className={`text-sm font-bold ${itemActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {item.label}
                                  </span>
                                  <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{item.desc}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>

                {/* Mobile hamburger */}
                <button
                  type="button"
                  onClick={() => setMobileOpen(v => !v)}
                  className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Open navigation menu"
                >
                  {mobileOpen ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </>
            )}

            {showNav && <OnboardingChecklist compact />}
            <UserMenu />

            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="ml-1 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav panel — slides in below header */}
        {showNav && mobileOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
            {NAV_GROUPS.map(group => (
              <div key={group.label} className="mb-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 px-1">
                  {group.label}
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {group.items.map(item => {
                    const itemActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={
                          'px-3 py-2 rounded-lg text-sm font-semibold transition-colors ' +
                          (itemActive
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800')
                        }
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">{children}</main>

      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <p className="max-w-7xl mx-auto px-4 sm:px-6 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">
          © 2026 Ali Abu Ras · aburasali80@gmail.com · Delivery Clarity v2.0
        </p>
      </footer>
    </div>
  );
}
