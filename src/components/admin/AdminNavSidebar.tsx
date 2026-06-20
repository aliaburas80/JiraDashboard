'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import styles from './AdminNavSidebar.module.scss';
import { SvgIcon } from '@/components/ui/SvgIcon';

const SETTINGS_SUB_ITEMS = [
  { id: 'users',      label: 'User Management',     icon: 'people', tab: '' },
  { id: 'requests',   label: 'Member Requests',     icon: 'email', tab: 'requests' },
  { id: 'config',     label: 'App Config / SMTP',   icon: 'settings', tab: 'config' },
  { id: 'retention',  label: 'Privacy & Retention', icon: 'lock', tab: 'retention' },
  { id: 'thresholds', label: 'Health Thresholds',   icon: 'priorityHigh', tab: 'thresholds' },
  { id: 'orphan',     label: 'Orphan Rules',        icon: 'link', tab: 'orphan' },
  { id: 'backup',     label: 'Backup & Restore',    icon: 'archive', tab: 'backup' },
  { id: 'cloud',      label: 'Cloud Storage',       icon: 'cloud', tab: 'cloud' },
  { id: 'browser',    label: 'Browser Data',        icon: 'delete', tab: 'browser' },
];

const NAV_ITEMS = [
  { id: 'users',       label: 'User Management',   href: '/admin/users',        icon: 'people' },
  { id: 'settings',    label: 'Settings',          href: '/admin/settings',     icon: 'tools' },
  { id: 'theme',       label: 'Theme & Branding',  href: '/admin/theme',        icon: 'palette' },
  { id: 'diagnostics', label: 'Diagnostics',       href: '/admin/diagnostics',  icon: 'statusInfo' },
  { id: 'security',    label: 'Security',          href: '/admin/security',     icon: 'shield' },
  { id: 'logs',        label: 'Import Logs',       href: '/admin/logs',         icon: 'clipboard' },
  { id: 'syserrors',   label: 'System Errors',     href: '/admin/system-errors', icon: 'warning' },
];

export default function AdminNavSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onSettings = pathname === '/admin/settings';
  const activeTab = searchParams.get('tab') ?? '';
  const [mobileOpen, setMobileOpen] = useState(false);

  function renderNav(onLinkClick?: () => void) {
    return (
      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => {
          const active = item.href === '/admin/settings'
            ? onSettings
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <div key={item.id}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={clsx(styles.navItem, { [styles.navItemActive]: active })}
                onClick={onLinkClick}
              >
                <SvgIcon name={item.icon} className={styles.navIcon} />
                <span className={styles.navLabel}>{item.label}</span>
              </Link>

              {item.id === 'settings' && onSettings && (
                <div className={styles.subNav} role="list" aria-label="Settings sections">
                  {SETTINGS_SUB_ITEMS.map(sub => {
                    const subActive = sub.tab === '' ? activeTab === '' : activeTab === sub.tab;
                    const href = sub.tab ? `/admin/settings?tab=${sub.tab}` : '/admin/settings';
                    return (
                      <Link
                        key={sub.id}
                        href={href}
                        role="listitem"
                        aria-current={subActive ? 'page' : undefined}
                        className={clsx(styles.subNavItem, { [styles.subNavItemActive]: subActive })}
                        onClick={onLinkClick}
                      >
                        <SvgIcon name={sub.icon} className={styles.subNavIcon} />
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    );
  }

  return (
    <>
      {/* Mobile top bar — the fixed sidebar below is hidden under 768px */}
      <div className={styles.mobileBar}>
        <button
          type="button"
          onClick={() => setMobileOpen(v => !v)}
          className={styles.mobileMenuBtn}
          aria-label={mobileOpen ? 'Close administration menu' : 'Open administration menu'}
          aria-expanded={mobileOpen}
        >
          <svg className={styles.mobileMenuIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
          <span>Administration</span>
        </button>
      </div>
      {mobileOpen && (
        <div className={styles.mobilePanel}>
          {renderNav(() => setMobileOpen(false))}
        </div>
      )}

      <aside className={styles.sidebar} aria-label="Administration navigation">
        <div className={styles.sectionLabel}>Administration</div>

        {renderNav()}

        <div className={styles.helpBox}>
          <p className={styles.helpTitle}>Need help?</p>
          <p className={styles.helpText}>Review diagnostics before changing roles, storage, or retention settings.</p>
          <Link href="/admin/diagnostics" className={styles.helpLink}>Open Diagnostics →</Link>
        </div>
      </aside>
    </>
  );
}
