'use client';
// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Admin panel for viewing and saving encrypted app config (SMTP + app URL) to cloud storage.

import { useEffect, useState } from 'react';

interface SafeConfig {
  host:    string;
  port:    number;
  user:    string;
  hasPass: boolean;
  from:    string;
  appUrl:  string;
  source:  'cloud' | 'env';
}

function Field({
  label, value, type = 'text', placeholder, onChange, hint,
}: {
  label:       string;
  value:       string;
  type?:       string;
  placeholder?: string;
  onChange:    (v: string) => void;
  hint?:       string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
      />
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

export default function AppConfigPanel() {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [hasEncKey, setHasEncKey] = useState(false);
  const [source,   setSource]   = useState<'cloud' | 'env'>('env');
  const [status,   setStatus]   = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null);

  const [host,    setHost]    = useState('');
  const [port,    setPort]    = useState('587');
  const [user,    setUser]    = useState('');
  const [pass,    setPass]    = useState('');
  const [from,    setFrom]    = useState('');
  const [appUrl,  setAppUrl]  = useState('');

  useEffect(() => {
    fetch('/api/admin/app-config')
      .then(r => r.json())
      .then((data: { config: SafeConfig; hasEncKey: boolean }) => {
        if (!data.config) return;
        const c = data.config;
        setHost(c.host);
        setPort(String(c.port));
        setUser(c.user);
        setFrom(c.from);
        setAppUrl(c.appUrl);
        setSource(c.source);
        setHasEncKey(data.hasEncKey);
      })
      .catch(() => setStatus({ type: 'error', msg: 'Failed to load config.' }))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/app-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp: { host, port: parseInt(port, 10), user, pass: pass || undefined, from },
          appUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setStatus({ type: 'error', msg: data.error ?? 'Save failed.' }); return; }
      setPass('');
      setSource('cloud');
      setStatus({ type: 'success', msg: 'Config encrypted and saved to cloud storage.' });
    } catch {
      setStatus({ type: 'error', msg: 'Network error — save failed.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/app-config?action=test', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setStatus({ type: 'error', msg: data.error ?? 'Test failed.' }); return; }
      if (data.skipped) { setStatus({ type: 'info', msg: 'SMTP not configured — no email sent.' }); return; }
      setStatus({ type: 'success', msg: 'Test email sent — check your inbox.' });
    } catch {
      setStatus({ type: 'error', msg: 'Network error — test failed.' });
    } finally {
      setTesting(false);
    }
  }

  if (loading) return <div className="py-12 text-center text-sm text-slate-400 animate-pulse">Loading config…</div>;

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Source badge */}
      <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
        source === 'cloud'
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      }`}>
        <span className="text-base">{source === 'cloud' ? '☁️' : '🔧'}</span>
        <div>
          <p className="font-bold text-sm">
            {source === 'cloud' ? 'Loaded from encrypted cloud config' : 'Using .env fallback — no cloud config found'}
          </p>
          <p className="text-[11px] opacity-80 mt-0.5">
            {source === 'cloud'
              ? 'Settings were decrypted from app-config.json in your cloud bucket.'
              : 'Save this form to encrypt and push settings to your cloud bucket.'}
          </p>
        </div>
      </div>

      {/* Encryption key warning */}
      {!hasEncKey && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="text-base mt-0.5">⚠️</span>
          <div>
            <p className="font-bold">CONFIG_ENCRYPTION_KEY not set</p>
            <p className="text-[11px] mt-0.5">
              Add <code className="bg-red-100 rounded px-1 font-mono">CONFIG_ENCRYPTION_KEY=&lt;32+ random chars&gt;</code> to your .env file.
              Without it, config cannot be encrypted or saved to cloud.
            </p>
          </div>
        </div>
      )}

      {/* SMTP section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">📧</span>
          <div>
            <h3 className="text-sm font-black text-slate-900">SMTP / Email</h3>
            <p className="text-[11px] text-slate-400">Used for welcome emails when an add-member request is accepted.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="SMTP Host"    value={host}   onChange={setHost}   placeholder="smtp.gmail.com" />
          <Field label="SMTP Port"    value={port}   onChange={setPort}   placeholder="587" />
        </div>
        <Field label="Username / Email" value={user} onChange={setUser}  placeholder="you@gmail.com" />
        <Field
          label="Password"
          value={pass}
          type="password"
          onChange={setPass}
          placeholder={source === 'cloud' ? '••••••••  (unchanged)' : 'Enter App Password'}
          hint={source === 'cloud' ? 'Leave blank to keep the existing stored password.' : 'For Gmail: use a 16-char App Password (no spaces).'}
        />
        <Field label="From address" value={from} onChange={setFrom} placeholder="Delivery Clarity <you@gmail.com>" />
      </div>

      {/* App URL section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🔗</span>
          <div>
            <h3 className="text-sm font-black text-slate-900">App URL</h3>
            <p className="text-[11px] text-slate-400">Used in email templates as the login link base URL.</p>
          </div>
        </div>
        <Field
          label="App URL"
          value={appUrl}
          onChange={setAppUrl}
          placeholder="https://yourdomain.com"
          hint='e.g. "https://yourdomain.com" — no trailing slash. Used in "Log In Now" button in welcome emails.'
        />
      </div>

      {/* Status */}
      {status && (
        <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
          status.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' :
          status.type === 'error'   ? 'border-red-200 bg-red-50 text-red-700' :
                                      'border-blue-200 bg-blue-50 text-blue-700'
        }`}>
          <span>{status.type === 'success' ? '✅' : status.type === 'error' ? '⚠️' : 'ℹ️'}</span>
          <p className="font-semibold">{status.msg}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasEncKey}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : '🔐 Encrypt & Save to Cloud'}
        </button>
        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="btn-secondary disabled:opacity-50"
        >
          {testing ? 'Sending…' : '📨 Send Test Email'}
        </button>
      </div>

      <p className="text-[11px] text-slate-400">
        Config is encrypted with AES-256-GCM before upload.
        The key never leaves your server — only <code className="font-mono">CONFIG_ENCRYPTION_KEY</code> can decrypt it.
        Cloud provider must be configured under Cloud Storage first.
      </p>
    </div>
  );
}
