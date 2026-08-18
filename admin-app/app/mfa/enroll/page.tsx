'use client';

import { FormEvent, useEffect, useState } from 'react';

function safeRedirect(value: string | null): string {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export default function AdminMfaEnrollPage() {
  const [secret, setSecret] = useState('');
  const [otpAuthUri, setOtpAuthUri] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/mfa/enroll/start', { method: 'POST' });
        const body = await response.json().catch(() => ({}));
        if (!active) return;
        if (response.status === 409) {
          const redirectTo = safeRedirect(new URLSearchParams(window.location.search).get('redirect'));
          window.location.replace(`/mfa/verify?redirect=${encodeURIComponent(redirectTo)}`);
          return;
        }
        if (!response.ok) {
          setError(typeof body.error === 'string' ? body.error : 'Unable to start MFA enrollment.');
          return;
        }
        setSecret(typeof body.secret === 'string' ? body.secret : '');
        setOtpAuthUri(typeof body.otpAuthUri === 'string' ? body.otpAuthUri : '');
      } catch {
        if (active) setError('Unable to reach the admin service.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/mfa/enroll/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof body.error === 'string' ? body.error : 'Unable to enable MFA.');
        return;
      }
      setRecoveryCodes(Array.isArray(body.recoveryCodes) ? body.recoveryCodes : []);
    } catch {
      setError('Unable to reach the admin service.');
    } finally {
      setSubmitting(false);
    }
  }

  function continueToAdmin() {
    const redirectTo = safeRedirect(new URLSearchParams(window.location.search).get('redirect'));
    window.location.assign(redirectTo);
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="mfa-enroll-title">
        <p className="eyebrow">Delivery Clarity Admin</p>
        <h1 id="mfa-enroll-title">Set up MFA</h1>

        {recoveryCodes.length > 0 ? (
          <>
            <p className="muted">Save these recovery codes now. Each code works once and they will not be shown again.</p>
            <div className="recovery-codes" aria-label="Recovery codes">
              {recoveryCodes.map(item => <code key={item}>{item}</code>)}
            </div>
            <button className="primary-button full-width" type="button" onClick={continueToAdmin}>
              I saved the codes — continue
            </button>
          </>
        ) : (
          <>
            <p className="muted">Add this account to Google Authenticator, Microsoft Authenticator, 1Password, or another TOTP app.</p>
            {loading ? <p className="muted">Preparing your authenticator secret…</p> : null}
            {secret ? (
              <div className="setup-panel">
                <label>
                  Setup key
                  <input value={secret} readOnly aria-label="Authenticator setup key" />
                </label>
                <label>
                  Authenticator URI
                  <textarea value={otpAuthUri} readOnly rows={3} aria-label="Authenticator URI" />
                </label>
              </div>
            ) : null}

            <form className="form-grid" onSubmit={confirm}>
              <label>
                6-digit authentication code
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  minLength={6}
                  maxLength={6}
                />
              </label>
              {error ? <div className="error" role="alert">{error}</div> : null}
              <button className="primary-button" type="submit" disabled={loading || submitting || code.length !== 6}>
                {submitting ? 'Verifying…' : 'Enable MFA'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
