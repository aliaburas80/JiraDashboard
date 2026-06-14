// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';

export interface AdminConsoleStat {
  icon: string;
  label: string;
  value: string;
  note: string;
  tone?: string;
  color?: string;
  toneStyle?: CSSProperties;
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
  { id: 'users',       label: 'User Management',   icon: '👥', href: '/admin/users' },
  { id: 'settings',    label: 'Settings',          icon: '⚙️', href: '/admin/settings' },
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
    <div className="-mx-4 -my-6 min-h-[calc(100vh-5rem)] px-4 py-6 sm:-mx-6 sm:px-6" style={{ background: 'var(--dc-bg, #f7f9fc)' }}>
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[285px_minmax(0,1fr)]">
        <aside className="self-start rounded-[14px] p-5 lg:sticky lg:top-20" style={{ background: 'var(--dc-s2, #ffffff)', border: '1px solid var(--dc-bdr, rgba(203,213,225,0.7))', boxShadow: '0 3px 12px rgba(0,0,0,0.12)' }}>
          <div className="mb-7 flex min-h-11 items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] text-lg" style={{ background: 'var(--dc-s3, #f1f5f9)', color: 'var(--dc-p2, #64748b)' }}>☰</span>
            <div>
              <p className="text-base font-black tracking-tight" style={{ color: 'var(--dc-p1, #0f172a)' }}>Delivery Clarity</p>
              <p className="text-xs font-bold" style={{ color: 'var(--dc-p3, #94a3b8)' }}>Admin Console</p>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-xs font-black uppercase tracking-[0.08em]" style={{ color: 'var(--dc-p3, #94a3b8)' }}>Administration</p>
          </div>

          <nav className="grid gap-2" aria-label="Administration navigation">
            {navItems.map(item => {
              const selected = item.selected ?? (item.href ? pathname === item.href : false);
              const className = `flex min-h-[50px] w-full items-center gap-3 rounded-xl px-3.5 text-left text-sm font-extrabold transition`;
              const itemStyle = selected
                ? { background: 'rgba(232,93,18,0.11)', color: 'var(--dc-acc2, #FF8A4C)', borderLeft: '3px solid var(--dc-acc, #E85D12)', paddingLeft: 'calc(0.875rem + 1px)' }
                : { color: 'var(--dc-p2, #909090)' };
              const content = (
                <>
                  <span className="grid h-6 w-6 shrink-0 place-items-center text-base">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </>
              );

              if (item.href) {
                return (
                  <Link key={item.id} href={item.href} className={className} style={itemStyle}>
                    {content}
                  </Link>
                );
              }

              return (
                <button key={item.id} type="button" onClick={item.onClick} className={className} style={itemStyle}>
                  {content}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 rounded-[14px] p-4" style={{ background: 'var(--dc-s3, #f1f5f9)', border: '1px solid var(--dc-bdr, rgba(203,213,225,0.7))', boxShadow: '0 3px 12px rgba(0,0,0,0.08)' }}>
            <h3 className="mb-1 text-sm font-black" style={{ color: 'var(--dc-p1, #0f172a)' }}>Need help?</h3>
            <p className="mb-4 text-sm leading-6" style={{ color: 'var(--dc-p2, #64748b)' }}>Review diagnostics before changing roles, storage, retention, or recovery settings.</p>
            <Link href="/admin/diagnostics" className="inline-flex h-9 w-full items-center justify-center rounded-[10px] text-sm font-extrabold transition" style={{ background: 'var(--dc-s3, #282828)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', color: 'var(--dc-acc2, #FF8A4C)' }}>
              Open Diagnostics ↗
            </Link>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="mb-7 rounded-[14px] px-5 py-4" style={{ background: 'var(--dc-s2, #ffffff)', border: '1px solid var(--dc-bdr, rgba(203,213,225,0.7))', boxShadow: '0 3px 12px rgba(0,0,0,0.1)' }}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--dc-p2, #64748b)' }}>
                <span>Admin Console</span>
                <span style={{ color: 'var(--dc-bdr2, rgba(148,163,184,0.5))' }}>/</span>
                <span style={{ color: 'var(--dc-p1, #0f172a)' }}>{title}</span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative hidden md:block">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">⌕</span>
                  <input type="search" placeholder="Search administration..." disabled
                    className="h-[42px] w-72 rounded-xl pl-9 pr-14 text-sm outline-none"
                    style={{ background: 'var(--dc-s3, #282828)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', color: 'var(--dc-p2, #909090)' }} />
                  <span className="absolute right-3 top-1/2 grid h-6 min-w-9 -translate-y-1/2 place-items-center rounded-[7px] px-2 text-xs font-black" style={{ background: 'var(--dc-s1, #141414)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', color: 'var(--dc-p3, #505050)' }}>⌘ K</span>
                </label>
                {actions}
              </div>
            </div>
          </header>

          <section className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--dc-p1, #0f172a)' }}>{title}</h1>
              <p className="mt-2 text-base" style={{ color: 'var(--dc-p2, #64748b)' }}>{description}</p>
            </div>
            <div className="chip c-gr" style={{ borderRadius: 100, fontSize: 13, padding: '6px 14px', fontWeight: 800 }}>
              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#22C55E', marginRight: 6 }} />
              {statusLabel}
            </div>
          </section>

          {stats.length > 0 && (
            <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Administration summary">
              {stats.map(card => (
                <article key={card.label} className="min-h-[88px] rounded-[14px] p-4" style={{ background: 'var(--dc-s2, #ffffff)', border: '1px solid var(--dc-bdr, rgba(203,213,225,0.7))', boxShadow: '0 3px 12px rgba(0,0,0,0.1)' }}>
                  <div className="flex items-center gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg" style={card.toneStyle ?? { background: 'var(--dc-s3, #282828)', color: 'var(--dc-p2, #909090)' }}>{card.icon}</span>
                    <span className="min-w-0">
                      <strong className="block truncate text-2xl font-black tracking-tight" style={{ color: card.color ?? 'var(--dc-p1, #F2F2F2)' }}>{card.value}</strong>
                      <span className="mt-1 block truncate text-sm font-bold" style={{ color: 'var(--dc-p2, #64748b)' }}>{card.label}</span>
                      <span className="mt-1 block truncate text-xs font-semibold" style={{ color: 'var(--dc-p3, #94a3b8)' }}>{card.note}</span>
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
