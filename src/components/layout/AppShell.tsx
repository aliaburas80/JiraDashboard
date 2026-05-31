'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getInitialTheme, applyTheme } from '@/lib/theme';
import UserMenu from '@/components/auth/UserMenu';

// Upload is intentionally excluded — it lives on the LEFT as a distinct restart button
const NAV = [
  { href: '/summary',   label: 'Overview'    },
  { href: '/charts',    label: 'Charts'      },
  { href: '/dashboard', label: 'Full Report' },
  { href: '/explore',   label: 'Explore'     },
  { href: '/developer', label: 'Developer'   },
  { href: '/backend',   label: 'Backend'     },
  { href: '/help',      label: 'Help'        },
];

const NAV_SMALL = ['/summary', '/dashboard', '/explore', '/help'];

export default function AppShell({ children, showNav }: { children: React.ReactNode; showNav?: boolean }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggleTheme() {
    const next: 'light' | 'dark' = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 dark:text-slate-100 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-3">

          {/* ── Left cluster: logo + upload restart button ── */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Delivery Clarity</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 hidden sm:inline">v2</span>
            </Link>

            {/* Upload new file — shown only when inside the app (showNav = data loaded) */}
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

          {/* ── Right cluster: page navigation + theme toggle ── */}
          <div className="flex items-center gap-1 ml-auto">
            {showNav && (
              <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
                {NAV.map(n => {
                  const isActive = pathname === n.href;
                  const hiddenOnSmall = !NAV_SMALL.includes(n.href);
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      className={
                        'px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ' +
                        (isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800') +
                        (hiddenOnSmall ? ' hidden sm:inline-flex' : ' inline-flex')
                      }
                    >
                      {n.label}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* User menu */}
            <UserMenu />

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="ml-1 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                /* Sun icon — visible in dark mode to switch to light */
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                /* Moon icon — visible in light mode to switch to dark */
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
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
