'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import styles from './AdminNavSidebar.module.scss';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { getCachedRole, getCachedIsSuperAdmin, fetchCurrentUser } from '@/lib/currentUser';
import { getAdminNavSections, type DCShellNavItem } from '@/components/dc-shell/navigation';
import { ADMIN_TABS } from '@/lib/adminConsole';

type SettingsSubItem = { id: string; label: string; icon: string; tab: string };

export default function AdminNavSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onSettings = pathname === '/admin/settings';
  const activeTab = searchParams.get('tab') ?? '';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [role, setRole] = useState<string | null>(getCachedRole);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(getCachedIsSuperAdmin);

  useEffect(() => {
    fetchCurrentUser().then(user => {
      setRole(user?.role ?? null);
      setIsSuperAdmin(user?.isSuperAdmin === true);
    });
  }, []);

  // Single source of truth: src/components/dc-shell/navigation.ts's
  // 'administration' group, also shared with the topbar dropdown and global
  // search — see getAdminNavSections()'s doc comment.
  const navSections = useMemo(() => getAdminNavSections(role, isSuperAdmin), [role, isSuperAdmin]);

  // Settings sub-nav — derived from the same ADMIN_TABS the settings page
  // itself uses for tab content/labels, instead of a second hand-maintained
  // list that used to drift out of sync with it. 'users' is filtered out via
  // hiddenFromNav (User Management already has its own top-level sidebar
  // item, /admin/users — see ADMIN_TABS' comment in adminConsole.ts). The
  // first item still offered gets tab:'' so it's reachable at the bare
  // /admin/settings URL, matching the page's own DEFAULT_TAB fallback.
  const settingsSubItems: SettingsSubItem[] = useMemo(() => {
    const visible = ADMIN_TABS.filter(item => !item.hiddenFromNav && (!item.superAdminOnly || isSuperAdmin));
    return visible.map((item, index) => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      tab: index === 0 ? '' : item.id,
    }));
  }, [isSuperAdmin]);

  function renderNavItem(item: DCShellNavItem, onLinkClick?: () => void) {
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
          <SvgIcon name={item.icon ?? 'page'} className={styles.navIcon} />
          <span className={styles.navLabel}>{item.title}</span>
        </Link>

        {item.id === 'admin-settings' && onSettings && (
          <div className={styles.subNav} role="list" aria-label="Settings sections">
            {settingsSubItems.map(sub => {
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
  }

  function renderNav(onLinkClick?: () => void) {
    return (
      <nav className={styles.nav} aria-label="Administration navigation">
        {navSections.map(section => (
          <div key={section.label} className={styles.navSection}>
            <p className={styles.navSectionLabel}>{section.label}</p>
            {section.items.map(item => renderNavItem(item, onLinkClick))}
          </div>
        ))}
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
