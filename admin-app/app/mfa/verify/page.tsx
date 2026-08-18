'use client';

import { FormEvent, useState } from 'react';

function safeRedirect(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export default function AdminMfaVerifyPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof body.error === 'string' ? body.error : 'Unable to verify MFA.');
        return;
      }

      const redirectTo = safeRedirect(new URLSearchParams(window.location.search).get('redirect'));
      window.location.assign(redirectTo);
    } catch {
      setError('Unable to reach the admin service.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="mfa-verify-title">
        <p className="eyebrow">Delivery Clarity Admin</p>
        <h1 id="mfa-verify-title">Verify MFA</h1>
        <p className="muted">Enter the 6-digit code from your authenticator app, or use one saved recovery code.</p>

        <form className="form-grid" onSubmit={verify}>
          <label>
            Authentication or recovery code
            <input
              autoComplete="one-time-code"
              value={code}
              onChange={event => setCode(event.target.value.toUpperCase().slice(0, 24))}
              required
            />
          </label>
          {error ? <div className="error" role="alert">{error}</div> : null}
          <button className="primary-button" type="submit" disabled={submitting || code.trim().length < 6}>
            {submitting ? 'Verifying…' : 'Verify and sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
