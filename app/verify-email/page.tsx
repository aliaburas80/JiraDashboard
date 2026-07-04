// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-012: lands here from the verification link emailed at registration.
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { AnimatedDataBackground } from '@/components/ui/AnimatedDataBackground';
import styles from './page.module.scss';

type VerifyState =
  | { status: 'loading' }
  | { status: 'success'; alreadyVerified: boolean }
  | { status: 'error'; message: string };

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const token  = params.get('token') ?? '';
  const [state, setState] = useState<VerifyState>({ status: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({ status: 'error', message: 'This verification link is missing its token.' });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res  = await fetch('/api/auth/verify-email', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setState({ status: 'error', message: data.error ?? 'Verification failed.' });
          return;
        }
        setState({ status: 'success', alreadyVerified: !!data.alreadyVerified });
      } catch {
        if (!cancelled) {
          setState({ status: 'error', message: 'Network error. Could not reach the server.' });
        }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className={styles.wrapper}>
      <AnimatedDataBackground className={styles.bg} />
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.content}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image
              src="/logo/delivery-clarity-logo-horizontal.svg"
              alt="Delivery Clarity"
              width={200}
              height={62}
              priority
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-4">
          {state.status === 'loading' && (
            <>
              <p className="text-sm text-slate-500">Verifying your email…</p>
            </>
          )}

          {state.status === 'success' && (
            <>
              <div className="flex justify-center">
                <SvgIcon name="checkCircle" size={32} className="text-emerald-500" />
              </div>
              <p className="font-black text-slate-800">
                {state.alreadyVerified ? 'Your email is already verified.' : 'Email verified!'}
              </p>
              <p className="text-sm text-slate-500">You can now sign in and start uploading data.</p>
              <Link
                href="/login"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 py-2.5 text-sm"
              >
                Go to sign in →
              </Link>
            </>
          )}

          {state.status === 'error' && (
            <>
              <div className="flex justify-center">
                <SvgIcon name="crossCircle" size={32} className="text-red-500" />
              </div>
              <p className="font-black text-red-700">{state.message}</p>
              <p className="text-sm text-slate-500">
                If your link expired, contact support to request a new one, or try{' '}
                <Link href="/login" className="text-blue-600 underline underline-offset-2">signing in</Link>{' '}
                — you may already be verified.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
