'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { applyTheme } from '@/lib/theme';
import { initThemeCustom, loadBranding } from '@/lib/themeCustomizer';
import UserMenu from '@/components/auth/UserMenu';
import { canAccessRoute } from '@/lib/roles';
import styles from './AppShell.module.scss';

const NAV_GROUPS = [
  {
    label: 'Analytics',
    items: [
      { href: '/summary',   label: 'Overview',    icon: '📊', desc: 'Health at a glance'           },
      { href: '/dashboard', label: 'Full Report', icon: '📋', desc: 'All metrics & filters'        },
      { href: '/charts',    label: 'Charts',      icon: '📈', desc: 'Visual breakdowns'            },
      { href: '/trends',    label: 'Trends',      icon: '📉', desc: 'Upload-over-upload change'    },
      { href: '/teams',     label: 'Teams',       icon: '👥', desc: 'Team health comparison'       },
      { href: '/portfolio', label: 'Portfolio',   icon: '🗂️', desc: 'Cross-team portfolio summary' },
    ],
  },
  {
    label: 'Delivery',
    items: [
      { href: '/readiness', label: 'Readiness', icon: '🚀', desc: 'Go / No-Go per release'     },
      { href: '/explore',   label: 'Explore',   icon: '🔗', desc: 'Work item dependency graph'  },
      { href: '/customer',  label: 'Customer',  icon: '👤', desc: 'Customer-visible progress'   },
    ],
  },
  {
    label: 'Planning',
    items: [
      { href: '/roadmap',  label: 'Roadmap',  icon: '🗺️', desc: 'Epic progress & delivery ETA'  },
      { href: '/forecast', label: 'Forecast', icon: '🔮', desc: 'Velocity & burn-up outlook'    },
      { href: '/retro',    label: 'Retro',    icon: '🔄', desc: 'Sprint retrospective tool'     },
    ],
  },
  {
    label: 'Data',
    items: [
      { href: '/snapshots', label: 'Snapshots', icon: '📸', desc: 'Saved metric snapshots' },
      { href: '/backend',   label: 'Backend',   icon: '⚙️', desc: 'Import logs & raw data' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/admin/settings',    label: 'Settings',         icon: '⚙️', desc: 'Users, storage, retention'   },
      { href: '/admin/theme',       label: 'Theme & Branding', icon: '🎨', desc: 'Palette, logo, app name'      },
      { href: '/admin/diagnostics', label: 'Diagnostics',      icon: '🩺', desc: 'System health & admin stats'  },
      { href: '/admin/security',    label: 'Security',         icon: '🔐', desc: 'Production security checks'   },
      { href: '/admin/logs',        label: 'Import Logs',      icon: '🧾', desc: 'All user import activity'     },
    ],
  },
  {
    label: 'Reference',
    items: [
      { href: '/members',   label: 'Members',   icon: '🪪', desc: 'Team directory & contacts'  },
      { href: '/landing',   label: 'About',     icon: '🏠', desc: 'Product overview & features' },
      { href: '/glossary',  label: 'Glossary',  icon: '📖', desc: 'Term & abbreviation guide'  },
      { href: '/developer', label: 'Developer', icon: '💻', desc: 'API & technical docs'       },
      { href: '/help',      label: 'Help',      icon: '❓', desc: 'How to use this app'         },
    ],
  },
];

export default function AppShell({ children, showNav }: { children: React.ReactNode; showNav?: boolean }) {
  const pathname    = usePathname();
  const [openGroup, setOpenGroup]   = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole]             = useState<string | null>(null);
  const [brandName, setBrandName]   = useState('Delivery Clarity');
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Always enforce light mode
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

  function isGroupActive(group: typeof NAV_GROUPS[0]) {
    return group.items.some(i => pathname === i.href);
  }

  const visibleGroups = NAV_GROUPS
    .map(group => ({
      ...group,
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

          {/* ── Spacer — pushes nav to center-right ── */}
          <div className={styles.spacer} />

          {/* ── CENTER NAV ── */}
          {showNav && (
            <nav className={styles.desktopNav} aria-label="Primary navigation">
              {visibleGroups.map(group => {
                const active = isGroupActive(group);
                const open   = openGroup === group.label;
                return (
                  <div key={group.label} className={styles.navGroupWrapper}>
                    <button
                      type="button"
                      onClick={() => setOpenGroup(open ? null : group.label)}
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
                          const itemActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              aria-current={itemActive ? 'page' : undefined}
                              className={clsx(styles.dropdownLink, { [styles.active]: itemActive })}
                            >
                              <span className={styles.dropdownIcon}>{item.icon}</span>
                              <span>{item.label}</span>
                              {itemActive && (
                                <span className={styles.dropdownActiveDot} aria-hidden="true" />
                              )}
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
              <div key={group.label}>
                <p className={styles.mobileGroupLabel}>{group.label}</p>
                <div className={styles.mobileGroupGrid}>
                  {group.items.map(item => {
                    const itemActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={itemActive ? 'page' : undefined}
                        className={clsx(styles.mobileLink, { [styles.active]: itemActive })}
                      >
                        <span>{item.icon}</span>
                        {item.label}
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
