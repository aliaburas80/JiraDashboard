// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-013: "Forgot your password" entry point, linked from /login.
'use client';
import { useEffect, useRef, useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
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
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === 'error') {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [state]);

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
          <div className={clsx(styles.card, 'text-center space-y-3')}>
            <p className={styles.title}>Check your inbox</p>
            <p className={styles.message}>If an account exists for {email}, a password reset link has been sent. The link expires in 1 hour.</p>
            <Link href="/login" className={clsx('inline-block text-sm font-bold', styles.inlineLink)}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className={clsx(styles.card, 'space-y-4')}>
            <p className={styles.message}>Enter the email address on your account and we&apos;ll send you a link to reset your password.</p>

            {state.status === 'error' && (
              <div ref={errorRef} className={styles.error} role="alert">
                {state.message}
              </div>
            )}

            <div>
              <label htmlFor="email" className={styles.label}>Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={state.status === 'submitting'}
              className={styles.submit}
            >
              {state.status === 'submitting' ? 'Sending…' : 'Send reset link'}
            </button>

            <p className={clsx('text-center', styles.message)}>
              <Link href="/login" className={clsx('font-bold', styles.inlineLink)}>Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
