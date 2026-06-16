'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import styles from './AdminNavSidebar.module.scss';

const NAV_ITEMS = [
  { id: 'users',       label: 'User Management',   href: '/admin/users',                   icon: '👥' },
  { id: 'requests',    label: 'Member Requests',   href: '/admin/settings?tab=requests',   icon: '📬' },
  { id: 'config',      label: 'App Config / SMTP', href: '/admin/settings?tab=config',     icon: '⚙️' },
  { id: 'settings',    label: 'Settings',          href: '/admin/settings',                icon: '🔧' },
  { id: 'theme',       label: 'Theme & Branding',  href: '/admin/theme',                   icon: '🎨' },
  { id: 'diagnostics', label: 'Diagnostics',       href: '/admin/diagnostics',             icon: '🩺' },
  { id: 'security',    label: 'Security',          href: '/admin/security',                icon: '🔐' },
  { id: 'logs',        label: 'Import Logs',       href: '/admin/logs',                    icon: '🧾' },
];

export default function AdminNavSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <aside className={styles.sidebar} aria-label="Administration navigation">
      {/* Section label */}
      <div className={styles.sectionLabel}>Administration</div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => {
          const [hrefPath, hrefQuery] = item.href.split('?');
          let active: boolean;
          if (hrefQuery) {
            const [paramKey, paramVal] = hrefQuery.split('=');
            active = pathname === hrefPath && searchParams.get(paramKey) === paramVal;
          } else {
            // "Settings" base link is active only when no tab param is set
            const isBaseSettings = item.href === '/admin/settings';
            if (isBaseSettings) {
              active = pathname === '/admin/settings' && !searchParams.get('tab');
            } else {
              active = pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
            }
          }
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={clsx(styles.navItem, { [styles.navItemActive]: active })}
            >
              <span className={styles.navIcon} aria-hidden="true">{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
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
