// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-013: "Forgot your password" entry point, linked from /login.
'use client';
import { useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatedDataBackground } from '@/components/ui/AnimatedDataBackground';
import styles from './page.module.scss';

type RequestState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'sent' }
  | { status: 'error'; message: string };

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<RequestState>({ status: 'idle' });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setState({ status: 'error', message: 'Enter your email address.' });
      return;
    }
    setState({ status: 'submitting' });
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({ status: 'error', message: data.error ?? 'Could not send the reset link.' });
        return;
      }
      setState({ status: 'sent' });
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
          <p className="text-sm text-slate-500">Reset your password</p>
        </div>

        {state.status === 'sent' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-3">
            <p className="font-black text-slate-800">Check your inbox</p>
            <p className="text-sm text-slate-500">If an account exists for {email}, a password reset link has been sent. The link expires in 1 hour.</p>
            <Link href="/login" className="inline-block text-sm font-bold text-blue-600 underline underline-offset-2">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-4">
            <p className="text-sm text-slate-500">Enter the email address on your account and we&apos;ll send you a link to reset your password.</p>

            {state.status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700" role="alert">
                {state.message}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-slate-700">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={state.status === 'submitting'}
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-2.5 text-sm"
            >
              {state.status === 'submitting' ? 'Sending…' : 'Send reset link'}
            </button>

            <p className="text-center text-sm text-slate-500">
              <Link href="/login" className="font-bold text-blue-600 underline underline-offset-2">Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
