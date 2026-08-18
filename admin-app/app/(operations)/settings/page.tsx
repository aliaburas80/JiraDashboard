'use client';

import { FormEvent, useEffect, useState } from 'react';

type SafeConfig = {
  host: string;
  port: number;
  user: string;
  from: string;
  appUrl: string;
  hasPass: boolean;
  hasJiraToken: boolean;
  source: 'cloud' | 'env';
};

export default function SettingsPage() {
  const [config, setConfig] = useState<SafeConfig | null>(null);
  const [hasEncKey, setHasEncKey] = useState(false);
  const [form, setForm] = useState({ host: '', port: 587, user: '', pass: '', from: '', appUrl: '', jiraToken: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch('/api/ops/settings/app-config', { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? 'Unable to load deployment settings.'); return; }
    const next = body.config as SafeConfig;
    setConfig(next);
    setHasEncKey(Boolean(body.hasEncKey));
    setForm({ host: next.host, port: next.port, user: next.user, pass: '', from: next.from, appUrl: next.appUrl, jiraToken: '' });
  }

  useEffect(() => { void load(); }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/ops/settings/app-config', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          smtp: { host: form.host, port: Number(form.port), user: form.user, pass: form.pass, from: form.from },
          jira: { apiToken: form.jiraToken },
          appUrl: form.appUrl,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Unable to save settings.');
      setMessage(body.dbSaveError ? `Saved with warning: ${body.dbSaveError}` : 'Deployment settings saved.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  }

  async function test(action: 'test-email' | 'test-jira') {
    setMessage('');
    setError('');
    const response = await fetch(`/api/ops/settings/app-config?action=${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(action === 'test-email'
        ? { smtp: { host: form.host, port: Number(form.port), user: form.user, pass: form.pass, from: form.from } }
        : { jira: { apiToken: form.jiraToken } }),
    });
    const body = await response.json();
    if (!response.ok || body.ok === false) { setError(body.error ?? 'Test failed.'); return; }
    setMessage(action === 'test-email' ? `Email test passed via ${body.provider ?? 'configured provider'}.` : `Jira test passed as ${body.account ?? 'configured account'}.`);
  }

  return (
    <section className="ops-page">
      <div className="ops-page-header">
        <div><p className="eyebrow">Owner operations</p><h2>Settings</h2><p className="muted">Deployment URL, SMTP and shared Jira credential configuration.</p></div>
        {config ? <span className="status-pill">Source: {config.source}</span> : null}
      </div>

      {!hasEncKey && config ? <div className="error">CONFIG_ENCRYPTION_KEY is not configured. Secrets cannot be saved safely until it is set.</div> : null}
      {message ? <div className="success">{message}</div> : null}
      {error ? <div className="error">{error}</div> : null}

      {!config ? <div className="ops-panel">Loading deployment settings…</div> : (
        <form className="ops-panel ops-form" onSubmit={save}>
          <h3>Application</h3>
          <label>Public application URL<input value={form.appUrl} onChange={event => setForm({ ...form, appUrl: event.target.value })} placeholder="https://deliveryclarity.app" /></label>

          <h3>Email / SMTP</h3>
          <div className="ops-form-grid">
            <label>SMTP host<input value={form.host} onChange={event => setForm({ ...form, host: event.target.value })} /></label>
            <label>SMTP port<input type="number" value={form.port} onChange={event => setForm({ ...form, port: Number(event.target.value) })} /></label>
            <label>SMTP user<input value={form.user} onChange={event => setForm({ ...form, user: event.target.value })} /></label>
            <label>From address<input value={form.from} onChange={event => setForm({ ...form, from: event.target.value })} /></label>
          </div>
          <label>SMTP password<input type="password" value={form.pass} onChange={event => setForm({ ...form, pass: event.target.value })} placeholder={config.hasPass ? 'Stored — leave blank to keep' : 'Not configured'} /></label>
          <button className="secondary-button" type="button" onClick={() => void test('test-email')}>Test email</button>

          <h3>Jira credential</h3>
          <label>Shared Jira API token / PAT<input type="password" value={form.jiraToken} onChange={event => setForm({ ...form, jiraToken: event.target.value })} placeholder={config.hasJiraToken ? 'Stored — leave blank to keep' : 'Not configured'} /></label>
          <button className="secondary-button" type="button" onClick={() => void test('test-jira')}>Test Jira token</button>

          <div className="ops-actions"><button className="primary-button" type="submit" disabled={saving || !hasEncKey}>{saving ? 'Saving…' : 'Save settings'}</button></div>
        </form>
      )}
    </section>
  );
}
