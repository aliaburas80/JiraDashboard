// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import type { CSSProperties, ReactNode } from 'react';
import { SvgIcon } from '@/components/ui/SvgIcon';

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
  { id: 'users',       label: 'User Management',   icon: 'people', href: '/admin/users' },
  { id: 'settings',    label: 'Settings',          icon: 'settings', href: '/admin/settings' },
  { id: 'theme',       label: 'Theme & Branding',  icon: 'palette', href: '/admin/theme' },
  { id: 'diagnostics', label: 'Diagnostics',       icon: 'statusInfo', href: '/admin/diagnostics' },
  { id: 'security',    label: 'Security',          icon: 'shield', href: '/admin/security' },
  { id: 'logs',        label: 'Import Logs',       icon: 'clipboard', href: '/admin/logs' },
];

export function AdminConsoleLayout({
  title,
  description,
  children,
  stats = [],
  navItems,
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
  return (
    <>
      <header className="mb-7 rounded-[14px] px-5 py-4" style={{ background: 'var(--color-surface, #fff)', border: '1px solid var(--color-border, #e2e8f0)', boxShadow: '0 1px 4px rgb(0 0 0 / 6%)' }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--color-text-secondary, #64748b)' }}>
            <span>Admin Console</span>
            <span style={{ color: 'var(--color-border, #e2e8f0)' }}>/</span>
            <span style={{ color: 'var(--color-text-primary, #0f172a)' }}>{title}</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {actions}
          </div>
        </div>
      </header>

      <section className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-text-primary, #0f172a)' }}>{title}</h1>
          <p className="mt-2 text-base" style={{ color: 'var(--color-text-secondary, #64748b)' }}>{description}</p>
        </div>
        <div className="chip c-gr" style={{ borderRadius: 100, fontSize: 13, padding: '6px 14px', fontWeight: 800 }}>
          <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#22C55E', marginRight: 6 }} />
          {statusLabel}
        </div>
      </section>

      {stats.length > 0 && (
        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Administration summary">
          {stats.map(card => (
            <article key={card.label} className="min-h-[88px] rounded-[14px] p-4" style={{ background: 'var(--color-surface, #fff)', border: '1px solid var(--color-border, #e2e8f0)', boxShadow: '0 1px 4px rgb(0 0 0 / 6%)' }}>
              <div className="flex items-center gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg" style={card.toneStyle ?? { background: 'var(--color-subtle, #f1f5f9)', color: 'var(--color-text-secondary, #64748b)' }}>
                  <SvgIcon name={card.icon} size={18} />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-2xl font-black tracking-tight" style={{ color: card.color ?? 'var(--color-text-primary, #0f172a)' }}>{card.value}</strong>
                  <span className="mt-1 block truncate text-sm font-bold" style={{ color: 'var(--color-text-secondary, #64748b)' }}>{card.label}</span>
                  <span className="mt-1 block truncate text-xs font-semibold" style={{ color: 'var(--color-text-muted, #94a3b8)' }}>{card.note}</span>
                </span>
              </div>
            </article>
          ))}
        </section>
      )}

      {children}
    </>
  );
}
