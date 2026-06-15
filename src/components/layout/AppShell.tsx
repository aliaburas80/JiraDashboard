'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { applyTheme } from '@/lib/theme';
import { initThemeCustom, loadBranding } from '@/lib/themeCustomizer';
import UserMenu from '@/components/auth/UserMenu';
import { canAccessRoute } from '@/lib/roles';
import { DC_NAV_GROUPS } from '@/components/dc-shell/navigation';
import styles from './AppShell.module.scss';

// Single source of truth: DC_NAV_GROUPS from navigation.ts
// Status dot colours mirror DashboardTopbar
const STATUS_DOT: Record<string, string> = {
  critical: '#f87171',
  warning:  '#f59e0b',
  success:  '#22c55e',
  info:     '#3b82f6',
};

// Label abbreviations matching DashboardTopbar GROUP_LABEL_OVERRIDE
const GROUP_LABEL_OVERRIDE: Record<string, string> = {
  administration: 'Admin',
};

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
}

export default function AppShell({ children, showNav }: { children: React.ReactNode; showNav?: boolean }) {
  const pathname    = usePathname();
  const [openGroup, setOpenGroup]   = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole]             = useState<string | null>(null);
  const [brandName, setBrandName]   = useState('Delivery Clarity');
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    applyTheme('light');
    initThemeCustom();
    const b = loadBranding();
    if (b.appName) setBrandName(b.appName);
  }, []);

  useEffect(() => {
    if (!showNav) return;
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(me => setRole(me?.role ?? null))
      .catch(() => setRole(null));
  }, [showNav]);

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

  useEffect(() => {
    setOpenGroup(null);
    setMobileOpen(false);
  }, [pathname]);

  function isGroupActive(group: typeof DC_NAV_GROUPS[0]) {
    return group.items.some(item => isActivePath(pathname, item.href));
  }

  const visibleGroups = DC_NAV_GROUPS
    .map(group => ({
      ...group,
      label: GROUP_LABEL_OVERRIDE[group.id] ?? group.label,
      items: group.items.filter(item => !showNav || (role !== null && canAccessRoute(role, item.href))),
    }))
    .filter(group => group.items.length > 0);

  return (
    <div className={styles.shell}>
      <header ref={navRef} className={styles.header}>
        <div className={styles.headerInner}>

          {/* ── Left: logo ── */}
          <div className={styles.logoArea}>
            <Link href="/" className={styles.logoLink}>
              <div className={styles.logoIcon} aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className={styles.logoName}>{brandName}</span>
              <span className={styles.logoVersion}>v4.1</span>
            </Link>
          </div>

          {/* ── Spacer ── */}
          <div className={styles.spacer} />

          {/* ── CENTER NAV ── */}
          {showNav && (
            <nav className={styles.desktopNav} aria-label="Primary navigation">
              {visibleGroups.map(group => {
                const active = isGroupActive(group);
                const open   = openGroup === group.id;
                return (
                  <div key={group.id} className={styles.navGroupWrapper}>
                    <button
                      type="button"
                      onClick={() => setOpenGroup(open ? null : group.id)}
                      aria-current={active ? 'page' : undefined}
                      className={clsx(styles.navGroupBtn, { [styles.active]: active })}
                    >
                      {group.label}
                      <svg
                        className={clsx(styles.navGroupChevron, { [styles.open]: open })}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                      {active && <span className={styles.navGroupActiveBar} aria-hidden="true" />}
                    </button>

                    {open && (
                      <div className={styles.dropdown}>
                        {group.items.map(item => {
                          const itemActive = isActivePath(pathname, item.href);
                          const dotColor   = STATUS_DOT[item.status] ?? '#cbd5e1';
                          return (
                            <Link
                              key={item.id}
                              href={item.href}
                              aria-current={itemActive ? 'page' : undefined}
                              className={clsx(styles.dropdownLink, { [styles.active]: itemActive })}
                              onClick={() => setOpenGroup(null)}
                            >
                              <span className={styles.dropdownLinkText}>
                                <span className={styles.dropdownTitle}>{item.title}</span>
                                <span className={styles.dropdownDesc}>{item.desc}</span>
                              </span>
                              <span
                                className={styles.dropdownDot}
                                style={{ background: dotColor } as React.CSSProperties}
                                aria-hidden="true"
                              />
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          )}

          {/* ── RIGHT RAIL: upload + user ── */}
          <div className={styles.rightRail}>
            {/* Mobile hamburger */}
            {showNav && (
              <button
                type="button"
                onClick={() => setMobileOpen(v => !v)}
                className={styles.mobileMenuBtn}
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
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
            )}

            {showNav && (
              <Link
                href="/"
                title="Upload a new file — resets current session"
                className={styles.uploadBtn}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V4m0 0L8 8m4-4l4 4" />
                </svg>
                <span className="hidden sm:inline">New Upload</span>
              </Link>
            )}

            <UserMenu />
          </div>
        </div>

        {/* Mobile nav panel */}
        {showNav && mobileOpen && (
          <div className={styles.mobileNav}>
            {visibleGroups.map(group => (
              <div key={group.id}>
                <p className={styles.mobileGroupLabel}>{group.label}</p>
                <div className={styles.mobileGroupGrid}>
                  {group.items.map(item => {
                    const itemActive = isActivePath(pathname, item.href);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        aria-current={itemActive ? 'page' : undefined}
                        className={clsx(styles.mobileLink, { [styles.active]: itemActive })}
                        onClick={() => setMobileOpen(false)}
                      >
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>
        <p className={styles.footerInner}>
          © 2026 Ali Abu Ras · aliaburas80@gmail.com · Delivery Clarity v4.1
        </p>
      </footer>
    </div>
  );
}
