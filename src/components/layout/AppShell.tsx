// @ts-nocheck
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [{ href:'/', label:'Upload' }, { href:'/dashboard', label:'Dashboard' }, { href:'/help', label:'Help' }];

export default function AppShell({ children, showNav }: { children: React.ReactNode; showNav?: boolean }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-black text-slate-900 tracking-tight">Delivery Clarity</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 hidden sm:inline">v2</span>
          </Link>
          {showNav && (
            <nav className="flex items-center gap-1">
              {NAV.map(n => (
                <Link key={n.href} href={n.href}
                  className={"px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors " + (pathname===n.href ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100')}
                >{n.label}</Link>
              ))}
            </nav>
          )}
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <p className="max-w-7xl mx-auto px-4 sm:px-6 py-3 text-xs text-slate-400 text-center">
          © undefined Ali Abu Ras · aburasali80@gmail.com · Delivery Clarity v2.0
        </p>
      </footer>
    </div>
  );
}
