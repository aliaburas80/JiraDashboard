'use client';

import { type ReactNode, type CSSProperties } from 'react';
import clsx from 'clsx';
import styles from './DashboardPageShell.module.scss';

// ─── Bar animation CSS-custom-property helpers ────────────────────────────────
// EXCEPTION (CLAUDE.md Rule 1): width, color, and delay are data-driven values
// that cannot be expressed in static SCSS. They are passed as CSS custom
// properties (--prefixed only). The visual styling lives in .barFill / .progressFill.

export function barCssVars(color: string, pct: number, delayMs = 0): CSSProperties {
  return {
    '--bar-color': color,
    '--bar-width': `${Math.max(0, Math.min(100, pct))}%`,
    ...(delayMs > 0 ? { '--bar-delay': `${delayMs}ms` } : {}),
  } as CSSProperties;
}

export function progressCssVars(color: string, pct: number, delayMs = 0): CSSProperties {
  return {
    '--bar-color': color,
    '--bar-width': `${Math.max(0, Math.min(100, pct))}%`,
    ...(delayMs > 0 ? { '--bar-delay': `${delayMs}ms` } : {}),
  } as CSSProperties;
}

// Expose module class names so page files can reference .barFill / .progressFill
// without importing the module themselves.
export const shellStyles = styles;

// ─── Sticky toolbar ───────────────────────────────────────────────────────────
export function StickyToolbar({ children }: { children: ReactNode }) {
  return <div className={styles.stickyToolbar}>{children}</div>;
}

// ─── Filter chip ──────────────────────────────────────────────────────────────
export function FilterChip({
  label, active, onClick, dot,
}: { label: string; active: boolean; onClick: () => void; dot?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(styles.filterChip, { [styles.active]: active })}
    >
      {dot && <span className={styles.filterChipDot} aria-hidden="true" />}
      {label}
    </button>
  );
}

// ─── Toolbar spacer ───────────────────────────────────────────────────────────
export function ToolbarSpacer() {
  return <div className={styles.toolbarSpacer} aria-hidden="true" />;
}

// ─── Toolbar button ───────────────────────────────────────────────────────────
export function ToolbarButton({
  label, children, onClick, primary,
}: { label?: string; children?: ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(styles.toolbarBtn, { [styles.primary]: primary })}
    >
      {children ?? label}
    </button>
  );
}

// ─── Page header ──────────────────────────────────────────────────────────────
export function PageHeader({
  title, subtitle, badge,
}: { title: string; subtitle?: string; badge?: string }) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.pageHeaderInner}>
        <h1 className={styles.pageHeaderTitle}>{title}</h1>
        {badge && <span className={styles.pageHeaderBadge}>{badge}</span>}
      </div>
      {subtitle && <p className={styles.pageHeaderSubtitle}>{subtitle}</p>}
    </div>
  );
}

// ─── Mini KPI card ────────────────────────────────────────────────────────────
// EXCEPTION (CLAUDE.md Rule 1): bg, border, and color come from data; passed
// as CSS custom properties. The animation delay is a computed stagger index.
export function MiniKpiCard({
  label, value, color, bg, border, index = 0,
}: { label: string; value: string; color: string; bg: string; border: string; index?: number }) {
  return (
    <div
      className={styles.miniKpiCard}
      style={{ '--kpi-bg': bg, '--kpi-border': border, '--kpi-color': color, '--delay': `${index * 70}ms` } as CSSProperties}
    >
      <p className={styles.miniKpiLabel}>{label}</p>
      <p className={styles.miniKpiValue}>{value}</p>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
export function SectionCard({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className={styles.sectionCard}>
      {title && <div className={styles.sectionCardTitle}>{title}</div>}
      <div className={styles.sectionCardBody}>{children}</div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyPage({ message }: { message: string }) {
  return (
    <div className={styles.emptyPage}>
      <div className={styles.emptyPageIcon} aria-hidden="true">📊</div>
      {message}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
export function PageLoading() {
  return (
    <div className={styles.pageLoading}>
      {[1, 2, 3].map(i => (
        <div key={i} className={clsx(styles.pageLoadingShimmer, 'animate-pulse')} />
      ))}
    </div>
  );
}
