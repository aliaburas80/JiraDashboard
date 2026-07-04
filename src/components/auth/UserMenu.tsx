// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { roleLabel } from '@/lib/roles';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { getCachedUser, fetchCurrentUser, clearCachedUser, type CurrentUser } from '@/lib/currentUser';
import styles from './UserMenu.module.scss';

export default function UserMenu() {
  const router = useRouter();
  // Seeded synchronously from the module cache so this never flashes "Sign in"
  // before the username appears — UserMenu is a child of AppShell, which is
  // imported directly by ~28 individual pages rather than one shared layout, so
  // it fully unmounts/remounts (and used to start from a blank, logged-out-looking
  // state) on every single route change.
  const [me, setMe]     = useState<CurrentUser | null>(getCachedUser);
  const [open, setOpen] = useState(false);
  const menuRef         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCurrentUser().then(setMe);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearCachedUser();
    setMe(null);
    router.push('/login');
    router.refresh();
  }

  if (!me) {
    return (
      <Link href="/login" className={styles.signIn}>
        Sign in
      </Link>
    );
  }

  const initials = me.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div ref={menuRef} className={styles.root}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={clsx(styles.trigger, { [styles.open]: open })}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`User menu for ${me.name}`}
      >
        <span className={styles.avatar} aria-hidden="true">{initials}</span>
        <span className={styles.username}>{me.email.split('@')[0]}</span>
        <SvgIcon name="chevronDown" size={9} className={clsx(styles.chevron, { [styles.open]: open })} />
      </button>

      {open && (
        <div role="menu" className={styles.dropdown}>
          {/* Identity block */}
          <div className={styles.identity}>
            <p className={styles.identityName}>{me.name}</p>
            <p className={styles.identityEmail}>{me.email}</p>
            <span className={styles.roleBadge}>{roleLabel(me.role)}</span>
          </div>

          {/* My Settings — /profile, now a tabbed Profile/Storage/Security hub.
              Labeled "My Settings" rather than bare "Settings" to avoid reading as
              a duplicate of the admin-only "Settings" link (-> /admin/settings)
              further down this same menu for admin users. */}
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={styles.menuItem}
          >
            <SvgIcon name="settings" size={14} /> My Settings
          </Link>

          {/* Admin-only links */}
          {me.role === 'admin' && (
            <>
              <Link href="/admin/users" role="menuitem" onClick={() => setOpen(false)} className={styles.menuItem}>
                <SvgIcon name="people" size={14} /> User Management
              </Link>
              <Link href="/admin/logs" role="menuitem" onClick={() => setOpen(false)} className={styles.menuItem}>
                <SvgIcon name="folder" size={14} /> Import Logs
              </Link>
              <Link href="/admin/security" role="menuitem" onClick={() => setOpen(false)} className={styles.menuItem}>
                <SvgIcon name="lock" size={14} /> Security
              </Link>
              <Link href="/admin/settings" role="menuitem" onClick={() => setOpen(false)} className={styles.menuItem}>
                <SvgIcon name="settings" size={14} /> Settings
              </Link>
            </>
          )}

          <hr className={styles.divider} />

          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className={styles.signOut}
          >
            <span aria-hidden="true">🚪</span> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
