'use client';

import { FormEvent, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function safeRedirect(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(typeof body.error === 'string' ? body.error : 'Unable to sign in.');
        return;
      }

      window.location.assign(safeRedirect(searchParams.get('redirect')));
    } catch {
      setError('Unable to reach the admin service.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="admin-login-title">
        <p className="eyebrow">Delivery Clarity</p>
        <h1 id="admin-login-title">Admin Console</h1>
        <p className="muted">Administrator credentials are verified independently from the main application session.</p>

        <form className="form-grid" onSubmit={submit}>
          <label>
            Administrator email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <div className="error" role="alert">{error}</div> : null}
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in to Admin'}
          </button>
        </form>
      </section>
    </main>
  );
}
