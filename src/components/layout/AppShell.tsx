// @ts-nocheck
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',          label: 'Upload'      },
  { href: '/summary',   label: 'Overview'    },
  { href: '/charts',    label: 'Charts'      },
  { href: '/dashboard', label: 'Full Report' },
  { href: '/developer', label: 'Developer'   },
  { href: '/backend',   label: 'Backend'     },
  { href: '/help',      label: 'Help'        },
];

// Items shown on small screens (≤ sm breakpoint) — keep the most essential ones
const NAV_SMALL = ['/', '/summary', '/dashboard', '/help'];

export default function AppShell({ children, showNav }: { children: React.ReactNode; showNav?: boolean }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-black text-slate-900 tracking-tight">Delivery Clarity</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 hidden sm:inline">v2</span>
          </Link>
          {showNav && (
            <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
              {NAV.map(n => {
                const isActive = pathname === n.href;
                // On small screens hide items not in NAV_SMALL
                const hiddenOnSmall = !NAV_SMALL.includes(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={
                      "px-2.5 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap " +
                      (isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100') +
                      (hiddenOnSmall ? ' hidden sm:inline-flex' : ' inline-flex')
                    }
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <p className="max-w-7xl mx-auto px-4 sm:px-6 py-3 text-xs text-slate-400 text-center">
          © {new Date().getFullYear()} Ali Abu Ras · aburasali80@gmail.com · Delivery Clarity v2.0
        </p>
      </footer>
    </div>
  );
}
