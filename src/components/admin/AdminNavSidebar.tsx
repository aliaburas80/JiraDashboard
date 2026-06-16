'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import styles from './AdminNavSidebar.module.scss';

const SETTINGS_SUB_ITEMS = [
  { id: 'users',      label: 'User Management',     icon: '👥', tab: '' },
  { id: 'requests',   label: 'Member Requests',     icon: '📬', tab: 'requests' },
  { id: 'config',     label: 'App Config / SMTP',   icon: '⚙️', tab: 'config' },
  { id: 'retention',  label: 'Privacy & Retention', icon: '🔒', tab: 'retention' },
  { id: 'thresholds', label: 'Health Thresholds',   icon: '⚡', tab: 'thresholds' },
  { id: 'orphan',     label: 'Orphan Rules',        icon: '👻', tab: 'orphan' },
  { id: 'backup',     label: 'Backup & Restore',    icon: '🗄️', tab: 'backup' },
  { id: 'cloud',      label: 'Cloud Storage',       icon: '☁️', tab: 'cloud' },
  { id: 'browser',    label: 'Browser Data',        icon: '🗑️', tab: 'browser' },
];

const NAV_ITEMS = [
  { id: 'users',       label: 'User Management',   href: '/admin/users',        icon: '👥' },
  { id: 'settings',    label: 'Settings',          href: '/admin/settings',     icon: '🔧' },
  { id: 'theme',       label: 'Theme & Branding',  href: '/admin/theme',        icon: '🎨' },
  { id: 'diagnostics', label: 'Diagnostics',       href: '/admin/diagnostics',  icon: '🩺' },
  { id: 'security',    label: 'Security',          href: '/admin/security',     icon: '🔐' },
  { id: 'logs',        label: 'Import Logs',       href: '/admin/logs',         icon: '🧾' },
];

export default function AdminNavSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onSettings = pathname === '/admin/settings';
  const activeTab = searchParams.get('tab') ?? '';

  return (
    <aside className={styles.sidebar} aria-label="Administration navigation">
      <div className={styles.sectionLabel}>Administration</div>

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
              >
                <span className={styles.navIcon} aria-hidden="true">{item.icon}</span>
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
                      >
                        <span className={styles.subNavIcon} aria-hidden="true">{sub.icon}</span>
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

      <div className={styles.helpBox}>
        <p className={styles.helpTitle}>Need help?</p>
        <p className={styles.helpText}>Review diagnostics before changing roles, storage, or retention settings.</p>
        <Link href="/admin/diagnostics" className={styles.helpLink}>Open Diagnostics →</Link>
      </div>
    </aside>
  );
}
