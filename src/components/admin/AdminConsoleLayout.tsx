// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export interface AdminConsoleStat {
  icon: string;
  label: string;
  value: string;
  note: string;
  tone?: string;
}

export interface AdminConsoleNavItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  selected?: boolean;
  onClick?: () => void;
}

export const ADMINISTRATION_NAV: AdminConsoleNavItem[] = [
  { id: 'settings',    label: 'Settings',         icon: '⚙️', href: '/admin/settings' },
  { id: 'theme',       label: 'Theme & Branding',  icon: '🎨', href: '/admin/theme' },
  { id: 'diagnostics', label: 'Diagnostics',       icon: '🩺', href: '/admin/diagnostics' },
  { id: 'security',    label: 'Security',          icon: '🔐', href: '/admin/security' },
  { id: 'logs',        label: 'Import Logs',       icon: '🧾', href: '/admin/logs' },
];

export function AdminConsoleLayout({
  title,
  description,
  children,
  stats = [],
  navItems = ADMINISTRATION_NAV,
  actions,
  statusLabel = 'Operational',
}: {
  title: string;
  description: string;
  children: ReactNode;
  stats?: AdminConsoleStat[];
  navItems?: AdminConsoleNavItem[];
  actions?: ReactNode;
  statusLabel?: string;
}) {
  const pathname = usePathname();

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-5rem)] bg-[#f7f9fc] px-4 py-6 sm:-mx-6 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[285px_minmax(0,1fr)]">
        <aside className="self-start rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_3px_12px_rgba(15,23,42,0.035)] lg:sticky lg:top-20">
          <div className="mb-7 flex min-h-11 items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-slate-100 text-lg text-slate-700">☰</span>
            <div>
              <p className="text-base font-black tracking-tight text-slate-900">Delivery Clarity</p>
              <p className="text-xs font-bold text-slate-500">Admin Console</p>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-xs font-black uppercase tracking-[0.08em] text-slate-500">Administration</p>
          </div>

          <nav className="grid gap-2" aria-label="Administration navigation">
            {navItems.map(item => {
              const selected = item.selected ?? (item.href ? pathname === item.href : false);
              const className = `flex min-h-[50px] w-full items-center gap-3 rounded-xl px-3.5 text-left text-sm font-extrabold transition ${
                selected ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`;
              const content = (
                <>
                  <span className="grid h-6 w-6 shrink-0 place-items-center text-base">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </>
              );

              if (item.href) {
                return (
                  <Link key={item.id} href={item.href} className={className}>
                    {content}
                  </Link>
                );
              }

              return (
                <button key={item.id} type="button" onClick={item.onClick} className={className}>
                  {content}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 rounded-[14px] border border-slate-200 bg-slate-50 p-4 shadow-[0_3px_12px_rgba(15,23,42,0.035)]">
            <h3 className="mb-1 text-sm font-black text-slate-900">Need help?</h3>
            <p className="mb-4 text-sm leading-6 text-slate-500">Review diagnostics before changing roles, storage, retention, or recovery settings.</p>
            <Link href="/admin/diagnostics" className="inline-flex h-9 w-full items-center justify-center rounded-[10px] border border-slate-300 bg-white text-sm font-extrabold text-blue-600 transition hover:bg-blue-50">
              Open Diagnostics ↗
            </Link>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="mb-7 rounded-[14px] border border-slate-200 bg-white px-5 py-4 shadow-[0_3px_12px_rgba(15,23,42,0.035)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                <span>Admin Console</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-900">{title}</span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative hidden md:block">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">⌕</span>
                  <input type="search" placeholder="Search administration..." disabled
                    className="h-[42px] w-72 rounded-xl border border-slate-300 bg-white pl-9 pr-14 text-sm text-slate-500 shadow-[0_3px_12px_rgba(15,23,42,0.035)] outline-none" />
                  <span className="absolute right-3 top-1/2 grid h-6 min-w-9 -translate-y-1/2 place-items-center rounded-[7px] border border-slate-200 bg-slate-50 px-2 text-xs font-black text-slate-500">⌘ K</span>
                </label>
                {actions}
              </div>
            </div>
          </header>

          <section className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">{title}</h1>
              <p className="mt-2 text-base text-slate-600">{description}</p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3.5 py-2 text-sm font-black text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              {statusLabel}
            </div>
          </section>

          {stats.length > 0 && (
            <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Administration summary">
              {stats.map(card => (
                <article key={card.label} className="min-h-[88px] rounded-[14px] border border-slate-200 bg-white p-4 shadow-[0_3px_12px_rgba(15,23,42,0.035)]">
                  <div className="flex items-center gap-4">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg ${card.tone ?? 'bg-slate-100 text-slate-700'}`}>{card.icon}</span>
                    <span className="min-w-0">
                      <strong className="block truncate text-2xl font-black tracking-tight text-slate-900">{card.value}</strong>
                      <span className="mt-1 block truncate text-sm font-bold text-slate-500">{card.label}</span>
                      <span className="mt-1 block truncate text-xs font-semibold text-slate-400">{card.note}</span>
                    </span>
                  </div>
                </article>
              ))}
            </section>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
