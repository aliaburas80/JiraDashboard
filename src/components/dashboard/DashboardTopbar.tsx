'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import clsx from 'clsx';
import { DC_NAV_GROUPS } from '@/components/dc-shell/navigation';
import UserMenu from '@/components/auth/UserMenu';
import styles from './DashboardTopbar.module.scss';

// Status → dot colour mapping (data-driven, not hardcoded per-item)
const STATUS_DOT: Record<string, string> = {
  critical: '#f87171',
  warning:  '#f59e0b',
  success:  '#22c55e',
  info:     '#3b82f6',
};

// Label overrides for space-constrained topbar
const GROUP_LABEL_OVERRIDE: Record<string, string> = {
  administration: 'Admin',
};

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
}

function groupIsActive(pathname: string, group: typeof DC_NAV_GROUPS[0]): boolean {
  return group.items.some(item => isActivePath(pathname, item.href));
}

// ─── Health colour lookup ─────────────────────────────────────────────────────
// Returns CSS-custom-property values, not inline hex codes.
// EXCEPTION (CLAUDE.md Rule 1): color values are data-driven (from healthScore);
// they are set as CSS custom properties consumed by .healthPill in SCSS.
function healthCssVars(score: number): { cssVars: CSSProperties; label: string } {
  let arc: string, bg: string, border: string, text: string, label: string;

  if (score >= 90) {
    arc = 'var(--color-health-excellent-arc, #059669)'; bg = 'var(--color-health-excellent-bg, #ecfdf5)';
    border = 'var(--color-health-excellent-border, #a7f3d0)'; text = 'var(--color-health-excellent-text, #059669)';
    label = 'Excellent';
  } else if (score >= 75) {
    arc = 'var(--color-health-good-arc, #059669)'; bg = 'var(--color-health-good-bg, #ecfdf5)';
    border = 'var(--color-health-good-border, #a7f3d0)'; text = 'var(--color-health-good-text, #059669)';
    label = 'Good';
  } else if (score >= 60) {
    arc = 'var(--color-health-moderate-arc, #d97706)'; bg = 'var(--color-health-moderate-bg, #fffbeb)';
    border = 'var(--color-health-moderate-border, #fde68a)'; text = 'var(--color-health-moderate-text, #d97706)';
    label = 'Moderate';
  } else if (score >= 40) {
    arc = 'var(--color-health-atrisk-arc, #dc2626)'; bg = 'var(--color-health-atrisk-bg, #fef2f2)';
    border = 'var(--color-health-atrisk-border, #fecaca)'; text = 'var(--color-health-atrisk-text, #dc2626)';
    label = 'At-Risk';
  } else {
    arc = 'var(--color-health-critical-arc, #991b1b)'; bg = 'var(--color-health-critical-bg, #fef2f2)';
    border = 'var(--color-health-critical-border, #fecaca)'; text = 'var(--color-health-critical-text, #991b1b)';
    label = 'Critical';
  }

  return {
    cssVars: { '--health-arc': arc, '--health-bg': bg, '--health-border': border, '--health-text': text } as CSSProperties,
    label,
  };
}

const CIRC = 40.84;

interface Props {
  healthScore?: number;
  onNewUpload: () => void;
}

export default function DashboardTopbar({ healthScore = 0, onNewUpload }: Props) {
  const pathname = usePathname();
  const { cssVars: healthVars, label: healthLabel } = healthCssVars(healthScore);

  // SVG arc — strokeDasharray is an SVG attribute, not a CSS style prop
  const filled = (healthScore / 100) * CIRC;
  const gap    = CIRC - filled;
  const svgDash = `${filled.toFixed(1)} ${gap.toFixed(1)}`;

  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [dropPos, setDropPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const groupButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const dropMenuRef = useRef<HTMLDivElement>(null);

  const toggleGroup = useCallback((groupId: string) => {
    if (openGroup === groupId) { setOpenGroup(null); return; }
    const btn = groupButtonRefs.current[groupId];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpenGroup(groupId);
  }, [openGroup]);

  useEffect(() => {
    if (!openGroup) return;
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Element;
      if (!dropMenuRef.current?.contains(t) && !Object.values(groupButtonRefs.current).some(r => r?.contains(t))) {
        setOpenGroup(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenGroup(null); };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openGroup]);

  const activeGroup = openGroup ? DC_NAV_GROUPS.find(g => g.id === openGroup) : null;

  return (
    <>
      <header className={styles.header}>

        {/* LEFT: Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon} aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className={styles.logoName}>Delivery Clarity</span>
          <span className={styles.logoVersion}>v4.1</span>
        </Link>

        {/* LEFT: Upload button — outlined red, matches AppShell */}
        <button type="button" onClick={onNewUpload} className={styles.uploadBtn}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          New Upload
        </button>

        {/* CENTER: Nav group buttons */}
        <nav className={styles.nav} aria-label="Primary navigation">
          {DC_NAV_GROUPS.map(group => {
            const active = groupIsActive(pathname, group);
            const isOpen = openGroup === group.id;
            const label = GROUP_LABEL_OVERRIDE[group.id] ?? group.label;
            return (
              <button
                key={group.id}
                ref={el => { groupButtonRefs.current[group.id] = el; }}
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                className={clsx(styles.navGroupBtn, { [styles.active]: active, [styles.open]: isOpen })}
              >
                {label}
                <svg
                  width="9" height="9" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2"
                  className={clsx(styles.navGroupChevron, { [styles.open]: isOpen })}
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
            );
          })}
        </nav>

        {/* RIGHT RAIL: pushed to far right by margin-left:auto */}
        <div className={styles.rightRail}>
          <div className={styles.separator} aria-hidden="true" />

          {/* Health pill — CSS custom properties carry the data-driven colours */}
          <div className={styles.healthPill} style={healthVars} aria-label={`Health score: ${healthScore} — ${healthLabel}`}>
            {/* SVG arc: stroke and strokeDasharray are SVG attributes, not CSS style props */}
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <circle cx="9" cy="9" r="6.5" fill="none" stroke="var(--health-border)" strokeWidth="2.5" />
              <circle cx="9" cy="9" r="6.5" fill="none" stroke="var(--health-arc)"
                strokeDasharray={svgDash} strokeDashoffset="10" strokeLinecap="round" />
            </svg>
            <div>
              <div className={styles.healthScore}>{healthScore}</div>
              <span className={styles.healthLabel}>{healthLabel}</span>
            </div>
          </div>

          {/* User menu */}
          <UserMenu />
        </div>
      </header>

      {/* Nav dropdown panel */}
      {openGroup && activeGroup && (
        <div
          ref={dropMenuRef}
          role="menu"
          className={styles.dropdownPanel}
          style={{ '--drop-top': `${dropPos.top}px`, '--drop-left': `${dropPos.left}px` } as CSSProperties}
        >
          {activeGroup.items.map(item => {
            const active = isActivePath(pathname, item.href);
            const dotColor = STATUS_DOT[item.status] ?? '#cbd5e1';
            return (
              <Link
                key={item.id}
                href={item.href}
                role="menuitem"
                onClick={() => setOpenGroup(null)}
                className={clsx(styles.dropdownItem, { [styles.itemActive]: active })}
              >
                <span>
                  <span className={styles.dropdownItemTitle}>{item.title}</span>
                  <span className={styles.dropdownItemDesc}>{item.desc}</span>
                </span>
                {/* EXCEPTION: dot color is data-driven from item.status */}
                <span
                  className={styles.dropdownItemDot}
                  style={{ background: dotColor } as CSSProperties}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
