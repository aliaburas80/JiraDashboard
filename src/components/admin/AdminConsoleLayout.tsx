// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import type { CSSProperties, ReactNode } from 'react';
import clsx from 'clsx';
import { SvgIcon } from '@/components/ui/SvgIcon';
import styles from './AdminConsoleLayout.module.scss';

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

export interface AdminConsoleStat {
  icon: string;
  label: string;
  value: string;
  note: string;
  tone?: string;
  color?: string;
  toneStyle?: CSSProperties;
}

export function AdminConsoleLayout({
  title,
  description,
  children,
  stats = [],
  actions,
  statusLabel = 'Operational',
  headerId,
}: {
  title: string;
  description: string;
  children: ReactNode;
  stats?: AdminConsoleStat[];
  actions?: ReactNode;
  statusLabel?: string;
  headerId?: string;   // DOM anchor id for this page's PageTourButton, if it has one
}) {
  return (
    <>
      <header className={styles.header}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className={clsx('flex items-center gap-2 text-sm font-bold', styles.breadcrumb)}>
            <span>Admin Console</span>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>{title}</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {actions}
          </div>
        </div>
      </header>

      <section id={headerId} className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className={clsx('text-3xl font-black tracking-tight', styles.pageTitle)}>{title}</h1>
          <p className={clsx('text-base', styles.pageDescription)}>{description}</p>
        </div>
        <div className={clsx('chip c-gr', styles.statusChip)}>
          <span className={styles.statusDot} />
          {statusLabel}
        </div>
      </section>

      {stats.length > 0 && (
        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Administration summary">
          {stats.map(card => {
            // DYNAMIC CSS VARIABLE:
            // Each admin page supplies its own arbitrary icon tone / value
            // color per stat card; this cannot be a fixed class. Keys are
            // omitted entirely (rather than set to empty strings) so the
            // SCSS var() fallback applies when a card doesn't set them.
            const toneVars: CSSVars = {};
            if (card.toneStyle?.background) toneVars['--tone-bg'] = String(card.toneStyle.background);
            if (card.toneStyle?.color) toneVars['--tone-color'] = String(card.toneStyle.color);
            if (card.color) toneVars['--value-color'] = card.color;
            return (
              <article key={card.label} className={clsx('min-h-[88px] rounded-[14px] p-4', styles.statCard)}>
                <div className="flex items-center gap-4">
                  <span className={clsx('grid h-11 w-11 shrink-0 place-items-center rounded-xl text-lg', styles.statIcon)} style={toneVars}>
                    <SvgIcon name={card.icon} size={18} />
                  </span>
                  <span className="min-w-0">
                    <strong className={clsx('block truncate text-2xl font-black tracking-tight', styles.statValue)} style={toneVars}>{card.value}</strong>
                    <span className={clsx('mt-1 block truncate text-sm font-bold', styles.statLabel)}>{card.label}</span>
                    <span className={clsx('mt-1 block truncate text-xs font-semibold', styles.statNote)}>{card.note}</span>
                  </span>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {children}
    </>
  );
}
