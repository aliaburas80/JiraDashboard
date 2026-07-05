'use client';
// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Admin panel for viewing and saving encrypted app config (SMTP + app URL) to cloud storage.

import { useEffect, useState } from 'react';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { PasswordInput } from '@/components/ui/PasswordInput';

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
  label, value, type = 'text', placeholder, onChange, hint, disabled = false,
}: {
  label:       string;
  value:       string;
  type?:       string;
  placeholder?: string;
  onChange:    (v: string) => void;
  hint?:       string;
  disabled?:   boolean;
}) {
  const inputClassName = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed";

  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">{label}</label>
      {type === 'password' ? (
        <PasswordInput
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={inputClassName}
        />
      ) : (
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className={inputClassName}
        />
      )}
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

function SectionHeader({
  icon, title, description, editing, onToggleEdit,
}: {
  icon: string;
  title: string;
  description: string;
  editing: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-1">
      <div className="flex items-center gap-2">
        <SvgIcon name={icon} size={18} />
        <div>
          <h3 className="text-sm font-black text-slate-900">{title}</h3>
          <p className="text-[11px] text-slate-400">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleEdit}
        className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
          editing
            ? 'bg-amber-500 text-white hover:bg-amber-600'
            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        <SvgIcon name={editing ? 'lock' : 'edit'} size={12} />
        {editing ? 'Lock' : 'Edit'}
      </button>
    </div>
  );
}

function SectionActions({
  editing, saving, onSave, testing, testResult, onTest, testLabel,
}: {
  editing:     boolean;
  saving:      boolean;
  onSave:      () => void;
  testing?:    boolean;
  testResult?: 'idle' | 'success' | 'error';
  onTest?:     () => void;
  testLabel?:  string;
}) {
  if (!editing) return null;

  const result = testResult ?? 'idle';
  const testBtnClass =
    result === 'success'
      ? 'inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-green-700 transition-colors disabled:opacity-50'
      : result === 'error'
        ? 'inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50'
        : 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50';
  const testIcon  = result === 'success' ? 'checkCircle' : result === 'error' ? 'crossCircle' : 'send';
  const testText  = testing
    ? 'Testing…'
    : result === 'success'
      ? 'Sent — test again'
      : result === 'error'
        ? 'Failed — retry'
        : (testLabel ?? 'Send test');

  return (
    <div className="flex items-center gap-2 pt-1">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        <SvgIcon name="lock" size={12} />
        {saving ? 'Saving…' : 'Save this section'}
      </button>
      {onTest && (
        <button
          type="button"
          onClick={onTest}
          disabled={testing}
          className={testBtnClass}
        >
          <SvgIcon name={testIcon} size={12} />
          {testText}
        </button>
      )}
    </div>
  );
}

export default function AppConfigPanel() {
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [testing,    setTesting]    = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasEncKey,  setHasEncKey]  = useState(false);
  const [source,   setSource]   = useState<'cloud' | 'env'>('env');
  const [status,   setStatus]   = useState<{ type: 'success' | 'error' | 'info'; msg: string; solution?: string; details?: string } | null>(null);
  const [showStatusSolution, setShowStatusSolution] = useState(false);

  const [host,    setHost]    = useState('');
  const [port,    setPort]    = useState('587');
  const [user,    setUser]    = useState('');
  const [pass,    setPass]    = useState('');
  const [from,    setFrom]    = useState('');
  const [appUrl,  setAppUrl]  = useState('');

  const [editingSmtp,   setEditingSmtp]   = useState(false);
  const [editingAppUrl, setEditingAppUrl] = useState(false);

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
    setShowStatusSolution(false);
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
      if (!res.ok) {
        setStatus({
          type: 'error',
          msg: data.error ?? 'Save failed.',
          solution: data.solution ?? 'Review the entered settings and try saving again.',
          details: data.details,
        });
        return;
      }
      setPass('');
      setSource('cloud');
      setEditingSmtp(false);
      setEditingAppUrl(false);
      setStatus(
        data.dbSaveError
          ? { type: 'error', msg: `Saved to cloud, but the database save failed: ${data.dbSaveError}`, solution: 'This setting may not persist reliably until the database save succeeds — try saving again.' }
          : { type: 'success', msg: 'Config encrypted and saved to cloud storage.' },
      );
    } catch {
      setStatus({ type: 'error', msg: 'Network error — save failed.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult('idle');
    setStatus(null);
    setShowStatusSolution(false);
    try {
      // Pass the current form values so the test uses what's on screen,
      // not stale cloud config — critical when the user has edited fields
      // but hasn't saved yet.
      const res = await fetch('/api/admin/app-config?action=test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp: { host, port: parseInt(port, 10), user, pass: pass || undefined, from },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestResult('error');
        setStatus({
          type: 'error',
          msg: data.error ?? 'Test failed.',
          solution: data.solution ?? 'Check SMTP host, port, username, password, and From address, then try again.',
          details: data.details,
        });
        return;
      }
      if (data.skipped) {
        setTestResult('error');
        setStatus({ type: 'error', msg: 'SMTP not configured — fill in Host, Username, and Password first.' });
        return;
      }
      setTestResult('success');
      setStatus({ type: 'success', msg: `Test email sent to ${user} — check your inbox.` });
    } catch {
      setTestResult('error');
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
        <SvgIcon name={source === 'cloud' ? 'cloud' : 'tools'} size={16} />
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
          <SvgIcon name="warning" size={16} className="mt-0.5" />
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
      <div className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 transition-colors ${editingSmtp ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'}`}>
        <SectionHeader
          icon="email"
          title="SMTP / Email"
          description="Used for welcome emails when an add-member request is accepted."
          editing={editingSmtp}
          onToggleEdit={() => setEditingSmtp(v => !v)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="SMTP Host"    value={host}   onChange={setHost}   placeholder="smtp.gmail.com" disabled={!editingSmtp} />
          <Field label="SMTP Port"    value={port}   onChange={setPort}   placeholder="587" disabled={!editingSmtp} />
        </div>
        <Field label="Username / Email" value={user} onChange={setUser}  placeholder="you@gmail.com" disabled={!editingSmtp} />
        <Field
          label="Password"
          value={pass}
          type="password"
          onChange={setPass}
          disabled={!editingSmtp}
          placeholder={source === 'cloud' ? '••••••••  (unchanged)' : 'Enter App Password'}
          hint={source === 'cloud'
            ? 'Leave blank to keep the existing stored password. For Gmail 535 errors, paste a fresh 16-character Google App Password here and test before saving.'
            : 'For Gmail: use a fresh 16-character Google App Password, not your normal Google password.'}
        />
        <Field label="From address" value={from} onChange={setFrom} placeholder="Delivery Clarity <you@gmail.com>" disabled={!editingSmtp} />
        <SectionActions
          editing={editingSmtp}
          saving={saving}
          onSave={handleSave}
          testing={testing}
          testResult={testResult}
          onTest={handleTest}
          testLabel="Send test email"
        />
      </div>

      {/* App URL section */}
      <div className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 transition-colors ${editingAppUrl ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'}`}>
        <SectionHeader
          icon="link"
          title="App URL"
          description="Used in email templates as the login link base URL."
          editing={editingAppUrl}
          onToggleEdit={() => setEditingAppUrl(v => !v)}
        />
        <Field
          label="App URL"
          value={appUrl}
          onChange={setAppUrl}
          disabled={!editingAppUrl}
          placeholder="https://yourdomain.com"
          hint='e.g. "https://yourdomain.com" — no trailing slash. Used in "Log In Now" button in welcome emails.'
        />
        <SectionActions editing={editingAppUrl} saving={saving} onSave={handleSave} />
      </div>

      {/* Status */}
      {status && (
        <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
          status.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' :
          status.type === 'error'   ? 'border-red-200 bg-red-50 text-red-800' :
                                      'border-blue-200 bg-blue-50 text-blue-700'
        }`}>
          <SvgIcon name={status.type === 'success' ? 'checkCircle' : status.type === 'error' ? 'crossCircle' : 'info'} size={14} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{status.msg}</p>
            {status.type === 'error' && (status.solution || status.details) && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowStatusSolution(v => !v)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 underline underline-offset-2"
                  aria-expanded={showStatusSolution}
                >
                  {showStatusSolution ? 'Hide solution' : 'Show solution'}
                  <SvgIcon name={showStatusSolution ? 'chevronUp' : 'chevronDown'} size={11} />
                </button>
                {showStatusSolution && (
                  <div className="mt-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-red-800">
                    {status.solution && <p><span className="font-black">Solution: </span>{status.solution}</p>}
                    {status.details && <p className="mt-1 text-red-600"><span className="font-black">Details: </span>{status.details}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions — saves all three sections at once, regardless of which are unlocked */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasEncKey}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : <><SvgIcon name="lock" size={14} /> Encrypt & Save to Cloud</>}
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
