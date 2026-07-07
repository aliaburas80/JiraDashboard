// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-013: lands here from the password-reset link emailed by /forgot-password.
'use client';
import { useEffect, useRef, useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AnimatedDataBackground } from '@/components/ui/AnimatedDataBackground';
import styles from './page.module.scss';

type ResetState =
  | { status: 'form' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token  = params.get('token') ?? '';
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [state, setState] = useState<ResetState>({ status: 'form' });
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === 'error' || !token) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [state, token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setState({ status: 'error', message: 'This reset link is missing its token.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setState({ status: 'error', message: 'New password and confirmation do not match.' });
      return;
    }
    setState({ status: 'submitting' });
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({ status: 'error', message: data.error ?? 'Could not reset your password.' });
        return;
      }
      setState({ status: 'success' });
    } catch {
      setState({ status: 'error', message: 'Network error. The request could not reach the server.' });
    }
  }

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
          <p className="text-sm text-slate-500">Choose a new password</p>
        </div>

        {state.status === 'success' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-3">
            <div className="flex justify-center">
              <SvgIcon name="checkCircle" size={32} className="text-emerald-500" />
            </div>
            <p className="font-black text-slate-800">Password reset</p>
            <p className="text-sm text-slate-500">You can now sign in with your new password.</p>
            <Link
              href="/login"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 py-2.5 text-sm"
            >
              Go to sign in →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-4">
            {!token && (
              <div ref={errorRef} className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700" role="alert">
                This link is missing its token. Request a new one from{' '}
                <Link href="/forgot-password" className="underline underline-offset-2">Forgot password</Link>.
              </div>
            )}

            {state.status === 'error' && token && (
              <div ref={errorRef} className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700" role="alert">
                {state.message}
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="mb-1.5 block text-xs font-bold text-slate-700">New password</label>
              <PasswordInput
                id="newPassword"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8+ chars, 1 uppercase, 1 number"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-bold text-slate-700">Confirm new password</label>
              <PasswordInput
                id="confirmPassword"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={state.status === 'submitting' || !token}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2.5 text-sm"
            >
              {state.status === 'submitting' ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
