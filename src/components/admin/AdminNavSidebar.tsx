'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import styles from './AdminNavSidebar.module.scss';

const NAV_ITEMS = [
  { id: 'users',       label: 'User Management',   href: '/admin/users',        icon: '👥' },
  { id: 'settings',    label: 'Settings',          href: '/admin/settings',     icon: '⚙️' },
  { id: 'theme',       label: 'Theme & Branding',  href: '/admin/theme',        icon: '🎨' },
  { id: 'diagnostics', label: 'Diagnostics',       href: '/admin/diagnostics',  icon: '🩺' },
  { id: 'security',    label: 'Security',          href: '/admin/security',     icon: '🔐' },
  { id: 'logs',        label: 'Import Logs',       href: '/admin/logs',         icon: '🧾' },
];

export default function AdminNavSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar} aria-label="Administration navigation">
      {/* Section label */}
      <div className={styles.sectionLabel}>Administration</div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
