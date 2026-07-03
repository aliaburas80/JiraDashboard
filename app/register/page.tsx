// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-011: Public registration page — name, email, password, primary persona.
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';
import { PERSONAS } from '@/lib/personas';
import { AnimatedDataBackground } from '@/components/ui/AnimatedDataBackground';

export default function RegisterPage() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [persona,  setPersona]  = useState('');
  const [consent,  setConsent]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password, persona, consentAccepted: consent }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Registration failed. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <AnimatedDataBackground className={styles.bg} />
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <Image src="/favicon.svg" alt="" width={28} height={28} aria-hidden="true" />
          <span className={styles.logoText}>Delivery Clarity</span>
        </div>

        {done ? (
          /* ── Success state ── */
          <div className={styles.success}>
            <div className={styles.successIcon} aria-hidden="true">✉️</div>
            <p className={styles.successTitle}>Check your inbox</p>
            <p className={styles.successText}>
              We&rsquo;ve sent a verification link to <strong>{email}</strong>.
              Click the link to activate your account and start your free analysis.
            </p>
            <p className={styles.successText} style={{ fontSize: 11 }}>
              No email? Check your spam folder. If email is not yet configured,
              your admin can manually verify the account.
            </p>
            <div className={styles.divider} />
            <Link href="/login" className={styles.loginLink}>
              ← Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className={styles.title}>Create your account</h1>
            <p className={styles.subtitle}>
              Start your free Jira delivery analysis — no card required.
            </p>

            {error && (
              <div className={styles.error} role="alert">{error}</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Full name */}
              <div className={styles.field}>
                <label htmlFor="reg-name" className={styles.label}>Full name</label>
                <input
                  id="reg-name"
                  type="text"
                  className={styles.input}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ali Abu Ras"
                  autoComplete="name"
                  required
                  aria-required="true"
                />
              </div>

              {/* Email */}
              <div className={styles.field}>
                <label htmlFor="reg-email" className={styles.label}>Work email</label>
                <input
                  id="reg-email"
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                  aria-required="true"
                />
              </div>

              {/* Password */}
              <div className={styles.field}>
                <label htmlFor="reg-password" className={styles.label}>Password</label>
                <input
                  id="reg-password"
                  type="password"
                  className={styles.input}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  autoComplete="new-password"
                  required
                  aria-required="true"
                />
                <p className={styles.passwordHint}>
                  At least 8 characters, one uppercase letter, and one number.
                </p>
              </div>

              {/* Persona */}
              <div className={styles.field}>
                <label htmlFor="reg-persona" className={styles.label}>Your primary role</label>
                <select
                  id="reg-persona"
                  className={styles.select}
                  value={persona}
                  onChange={e => setPersona(e.target.value)}
                  required
                  aria-required="true"
                >
                  <option value="">Select your role…</option>
                  {PERSONAS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Consent — EP-014 */}
              <div className={styles.field}>
                <label className={styles.consentLabel}>
                  <input
                    type="checkbox"
                    className={styles.consentCheck}
                    checked={consent}
                    onChange={e => setConsent(e.target.checked)}
                    required
                    aria-required="true"
                  />
                  <span className={styles.consentText}>
                    I agree to the{' '}
                    <Link href="/terms" target="_blank">Terms of Use</Link>
                    {' '}and{' '}
                    <Link href="/privacy" target="_blank">Privacy Policy</Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className={styles.submit}
                disabled={loading || !consent}
              >
                {loading ? 'Creating account…' : 'Create free account'}
              </button>
            </form>

            <p className={styles.loginLink}>
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
