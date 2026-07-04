// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { roleLabel } from '@/lib/roles';
import { SvgIcon } from '@/components/ui/SvgIcon';
import styles from './UserMenu.module.scss';

interface Me { id: string; name: string; email: string; role: string }

export default function UserMenu() {
  const router = useRouter();
  const [me, setMe]     = useState<Me | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef         = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => setMe(data))
      .catch(() => setMe(null));
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

          {/* My Profile */}
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={styles.menuItem}
          >
            <SvgIcon name="person" size={14} /> My Profile
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
