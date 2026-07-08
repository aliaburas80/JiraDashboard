'use client';
// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Persistent "please verify your email" reminder, rendered once in the root
// layout so it's visible from any page. Login no longer blocks an unverified
// account — this banner (plus the "!" badge on the avatar, see UserMenu.tsx
// and ProfileTab.tsx) is the replacement nudge. Dismissing it only hides it
// for the current browser session (sessionStorage) — it reappears next time
// so it can't be permanently ignored while still unverified.

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fetchCurrentUser } from '@/lib/currentUser';
import { SvgIcon } from '@/components/ui/SvgIcon';
import styles from './EmailVerificationBanner.module.scss';

const DISMISS_KEY = 'dc_verify_banner_dismissed';

const HIDDEN_ON = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/change-password',
];

export function EmailVerificationBanner() {
  const pathname = usePathname();
  const [email, setEmail]         = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending]     = useState(false);
  const [message, setMessage]     = useState('');
  const sentRef = useRef(false);

  useEffect(() => {
    fetchCurrentUser().then(user => {
      setEmail(user && user.emailVerified === false ? user.email : null);
    });
    try { setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1'); } catch {}
  }, [pathname]);

  const isAuthPage = HIDDEN_ON.some(path => pathname === path || pathname.startsWith(`${path}/`));

  if (isAuthPage || !email || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch {}
  }

  async function resend() {
    if (sending) return;
    sentRef.current = true;
    setSending(true);
    setMessage('');
    try {
      const res  = await fetch('/api/auth/resend-verification', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      setMessage(res.ok ? (data.message ?? 'Verification email sent.') : (data.error ?? 'Could not send it right now.'));
    } catch {
      setMessage('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.banner} role="status" aria-live="polite">
      <div className={styles.content}>
        <SvgIcon name="warning" size={14} className={styles.icon} />
        <span className={styles.text}>
          Please verify your email address to secure your account.
          {message && <span className={styles.sentNote}> {message}</span>}
        </span>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={resend} disabled={sending} className={styles.resendBtn}>
          {sending ? 'Sending…' : 'Resend verification email'}
        </button>
        <button type="button" onClick={dismiss} aria-label="Dismiss" className={styles.dismissBtn}>
          <SvgIcon name="cross" size={12} />
        </button>
      </div>
    </div>
  );
}
