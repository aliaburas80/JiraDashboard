// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// NOTE: Fully functional after npm install iron-session prisma @prisma/client bcryptjs
'use client';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { hasMetricsFromAnySource } from '@/lib/storage';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AnimatedDataBackground } from '@/components/ui/AnimatedDataBackground';
import loginStyles from './page.module.scss';

interface LoginErrorState {
  message:  string;
  solution: string;
  details?: string;
  code?:    string;
}

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<LoginErrorState | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [rateLimitSecs, setRateLimitSecs] = useState(0);
  const [welcomeBack, setWelcomeBack]     = useState(false);
  const noticeRef = useRef<HTMLDivElement>(null);

  // Count down every second until the rate-limit window expires.
  useEffect(() => {
    if (rateLimitSecs <= 0) return;
    const timer = setTimeout(() => setRateLimitSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [rateLimitSecs]);

  // Arriving here from /register after it found an existing account for this
  // email — prefill the email and greet the returning user instead of making
  // them retype it.
  useEffect(() => {
    const emailParam  = params.get('email')?.trim();
    const noticeParam = params.get('notice');
    if (emailParam) setEmail(emailParam);
    if (noticeParam === 'welcome_back') setWelcomeBack(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- read once on mount from the initial URL
  }, []);

  // Scroll the notice/error into view whenever one appears, so it's visible
  // even if the card has scrolled out of the viewport (e.g. long solution text).
  useEffect(() => {
    if ((error || welcomeBack) && rateLimitSecs === 0) {
      noticeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error, welcomeBack, rateLimitSecs]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (rateLimitSecs > 0) return; // blocked — button should already be disabled
    setLoading(true);
    setError(null);
    setShowSolution(false);
    try {
      if (!email.trim() || !password) {
        setError({
          message:  'Email and password are required.',
          solution: 'Enter both fields, then click Sign in again.',
        });
        return;
      }
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 429 && data.retryAfterSeconds) {
          setRateLimitSecs(data.retryAfterSeconds);
        }
        setError({
          message:  data.error ?? 'Login failed.',
          solution: data.solution ?? 'Check your email and password, then try again.',
          details:  data.details,
          code:     data.code,
        });
        return;
      }
      if (data.mustChangePassword || data.user?.mustChangePassword) {
        router.push('/change-password');
        router.refresh();
        return;
      }
      // If an explicit redirect param exists, honour it.
      // Otherwise go to dashboard only if the user already has data;
      // if no data has been uploaded yet, send them to the upload page.
      const explicit = params.get('redirect');
      const hasData = await hasMetricsFromAnySource();
      const destination = explicit ?? (hasData ? '/dashboard' : '/');
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError({
        message:  'Network error. The login request could not reach the server.',
        solution: 'Check that the app server is running, refresh the page, and try again.',
        details:  err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={loginStyles.wrapper}>
      <AnimatedDataBackground className={loginStyles.bg} />
      <div className={loginStyles.vignette} aria-hidden="true" />
      <div className={loginStyles.card}>
        <div className={loginStyles.logo}>
          <Image src="/favicon.svg" alt="" width={28} height={28} aria-hidden="true" priority />
          <span className={loginStyles.logoText}>Delivery Clarity</span>
        </div>

        <h1 className={loginStyles.title}>Sign in to your account</h1>
        <p className={loginStyles.subtitle}>Continue to your Jira delivery workspace.</p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Rate-limit countdown banner — shown above any other error */}
          {rateLimitSecs > 0 && (
            <div ref={noticeRef} className={clsx(loginStyles.notice, loginStyles.warning)} role="alert" aria-live="polite">
              <div className="flex items-center gap-2">
                <SvgIcon name="warning" size={16} className="shrink-0" />
                <div>
                  <p className={loginStyles.noticeTitle}>Too many login attempts.</p>
                  <p className={loginStyles.noticeText}>
                    Try again in{' '}
                    <span className="font-black tabular-nums">
                      {rateLimitSecs >= 60
                        ? `${Math.floor(rateLimitSecs / 60)}m ${rateLimitSecs % 60}s`
                        : `${rateLimitSecs}s`}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {!error && welcomeBack && rateLimitSecs === 0 && (
            <div ref={noticeRef} className={clsx(loginStyles.notice, loginStyles.success)} role="status" aria-live="polite">
              <div className="flex items-center gap-2">
                <SvgIcon name="check" size={16} className="shrink-0" />
                <div>
                  <p className={loginStyles.noticeTitle}>Welcome back!</p>
                  <p className={loginStyles.noticeText}>
                    This email already has a Delivery Clarity account — sign in below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && rateLimitSecs === 0 && (
            <div ref={noticeRef} className={clsx(loginStyles.notice, loginStyles.error)} role="alert">
              <div className="flex items-start gap-2">
                <SvgIcon name="info" size={16} className="mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className={loginStyles.noticeTitle}>{error.message}</p>
                  <button
                    type="button"
                    onClick={() => setShowSolution(v => !v)}
                    className={loginStyles.solutionToggle}
                    aria-expanded={showSolution}
                  >
                    {showSolution ? 'Hide solution' : 'Show solution'}
                    <SvgIcon name={showSolution ? 'chevronUp' : 'chevronDown'} size={12} />
                  </button>
                  {showSolution && (
                    <div className={loginStyles.solution}>
                      <p><span className="font-black">Solution: </span>{error.solution}</p>
                      {error.details && (
                        <p className="mt-1"><span className="font-black">Details: </span>{error.details}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={loginStyles.field}>
            <label htmlFor="login-email" className={loginStyles.label}>Email address</label>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={!!error}
              className={loginStyles.input}
            />
          </div>

          <div className={loginStyles.field}>
            <div className={loginStyles.labelRow}>
              <label htmlFor="login-password" className={loginStyles.label}>Password</label>
              <Link href="/forgot-password" className={loginStyles.inlineLink}>
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              aria-invalid={!!error}
              className={loginStyles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading || rateLimitSecs > 0}
            className={loginStyles.submit}
          >
            {loading
              ? 'Signing in…'
              : rateLimitSecs > 0
                ? `Try again in ${rateLimitSecs}s`
                : 'Sign in'}
          </button>
        </form>

        <p className={loginStyles.registerLink}>
          No account?{' '}
          <Link href="/register">
            Create one free →
          </Link>
        </p>
        <p className={loginStyles.learnLink}>
          <Link href="/promo">Learn more about Delivery Clarity</Link>
        </p>
      </div>
    </div>
  );
}
