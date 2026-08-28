'use client';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import clsx from 'clsx';
import { DC_NAV_GROUPS, getNavGroupsForRole } from '@/components/dc-shell/navigation';
import { getCachedRole, getCachedIsSuperAdmin, fetchCurrentUser } from '@/lib/currentUser';
import UserMenu from '@/components/auth/UserMenu';
import NotificationBell from '@/components/auth/NotificationBell';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { PersonaPreviewSwitcher } from './PersonaPreviewSwitcher';
import GlobalSearch from '@/components/search/GlobalSearch';
import styles from './DashboardTopbar.module.scss';

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

interface Props {
  onNewUpload: () => void;
  onToggleSidebar?: () => void;
}

export default function DashboardTopbar({ onNewUpload, onToggleSidebar }: Props) {
  const pathname = usePathname();

  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [dropPos, setDropPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const groupButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const dropMenuRef = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState<string | null>(getCachedRole);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(getCachedIsSuperAdmin);

  useEffect(() => {
    fetchCurrentUser().then(user => {
      setRole(user?.role ?? null);
      setIsSuperAdmin(user?.isSuperAdmin === true);
    });
  }, []);

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleSyncJira = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage('');
    try {
      const res = await fetch('/api/jira/sync', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setSyncMessage(data.error ?? 'Sync failed.');
        setTimeout(() => setSyncMessage(''), 6000);
        return;
      }
      setSyncMessage(`Synced ${data.totalIssues ?? 0} issues from ${data.connectionName ?? 'Jira'}.`);
      window.location.reload();
    } catch {
      setSyncMessage('Sync failed — check your connection and try again.');
      setTimeout(() => setSyncMessage(''), 6000);
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

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

  const visibleGroups = getNavGroupsForRole(role, isSuperAdmin);
  const activeGroup = openGroup ? visibleGroups.find(g => g.id === openGroup) : null;

  return (
    <>
      <header className={styles.header}>
        {onToggleSidebar && (
          <button
            type="button"
            className={styles.hamburger}
            onClick={onToggleSidebar}
            aria-label="Open navigation menu"
            aria-haspopup="dialog"
            data-analytics-id="dashboard-navigation-menu"
            data-analytics-label="Open navigation menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <Link
          href="/"
          className={styles.logo}
          data-analytics-id="dashboard-logo-home"
          data-analytics-label="Open Home page"
        >
          <div className={styles.logoIcon} aria-hidden="true">
            <Image src="/logo/delivery-clarity-logo-icon.svg" alt="" width={28} height={28} />
          </div>
          <span className={styles.logoName}>Delivery Clarity</span>
          <span className={styles.logoVersion}>v4.1</span>
        </Link>

        <div className={styles.spacer} />

        <nav className={styles.nav} aria-label="Primary navigation" data-analytics-section="primary-navigation">
          {visibleGroups.map(group => {
            const active = groupIsActive(pathname, group);
            const isOpen = openGroup === group.id;
            const label  = GROUP_LABEL_OVERRIDE[group.id] ?? group.label;
            return (
              <button
                key={group.id}
                ref={el => { groupButtonRefs.current[group.id] = el; }}
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-current={active ? 'page' : undefined}
                className={clsx(styles.navGroupBtn, { [styles.active]: active, [styles.open]: isOpen })}
                data-analytics-id={`nav-group-${group.id}`}
                data-analytics-label={`${isOpen ? 'Close' : 'Open'} ${label} menu`}
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
                {active && <span className={styles.activeBar} aria-hidden="true" />}
              </button>
            );
          })}
        </nav>

        <div className={styles.rightRail}>
          <GlobalSearch role={role} isSuperAdmin={isSuperAdmin} />

          <button
            type="button"
            onClick={onNewUpload}
            className={styles.uploadBtn}
            data-analytics-id="new-upload"
            data-analytics-label="Start new upload"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            New Upload
          </button>

          <div className={styles.syncWrap}>
            <button
              type="button"
              onClick={handleSyncJira}
              disabled={syncing}
              className={styles.syncBtn}
              aria-label="Sync new data from Jira"
              title="Pull the latest data from the connected Jira project"
              data-analytics-id="sync-jira"
              data-analytics-label="Sync Jira"
            >
              <svg
                width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                aria-hidden="true" className={syncing ? styles.syncSpin : undefined}
              >
                <path d="M21 12a9 9 0 11-2.64-6.36M21 4v6h-6" />
              </svg>
              {syncing ? 'Syncing…' : 'Sync Jira'}
            </button>
            {syncMessage && (
              <div className={styles.syncMessage} role="status" aria-live="polite">
                {syncMessage}
              </div>
            )}
          </div>

          <div className={styles.desktopOnly}>
            <DataSourceBadge compact />
            <PersonaPreviewSwitcher />
          </div>

          <NotificationBell />
          <UserMenu />
        </div>
      </header>

      {openGroup && activeGroup && (
        <div
          ref={dropMenuRef}
          role="menu"
          className={styles.dropdownPanel}
          style={{ '--drop-top': `${dropPos.top}px`, '--drop-left': `${dropPos.left}px` } as CSSProperties}
          data-analytics-section="primary-navigation-menu"
        >
          {activeGroup.items.map(item => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                role="menuitem"
                onClick={() => setOpenGroup(null)}
                className={clsx(styles.dropdownItem, { [styles.itemActive]: active })}
                data-analytics-id={`nav-item-${item.id}`}
                data-analytics-label={`Open ${item.title} page`}
              >
                <span>
                  <span className={styles.dropdownItemTitle}>{item.title}</span>
                  <span className={styles.dropdownItemDesc}>{item.desc}</span>
                </span>
                <span
                  className={styles.dropdownItemDot}
                  data-status={item.status}
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
