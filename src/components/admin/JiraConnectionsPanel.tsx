// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// JIRA-04 — Admin panel to create and test read-only Jira API connections.
// See product/JIRA_INTEGRATION_DESIGN.md. Field-mapping UI lands with JIRA-06.
'use client';
import { useCallback, useEffect, useState } from 'react';
import { SvgIcon } from '@/components/ui/SvgIcon';

interface JiraConnection {
  id: string;
  name: string;
  deploymentType: string;
  baseUrl: string;
  authEmail: string | null;
  projectFilters: string[];
  refreshMode: string;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  hasGatewayToken: boolean;
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  failed:  'bg-red-100 text-red-800',
  partial: 'bg-amber-100 text-amber-800',
};

export default function JiraConnectionsPanel() {
  const [connections, setConnections] = useState<JiraConnection[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [showForm, setShowForm]       = useState(false);

  const [name, setName]               = useState('');
  const [deploymentType, setDeploymentType] = useState<'cloud' | 'server'>('cloud');
  const [baseUrl, setBaseUrl]         = useState('');
  const [authEmail, setAuthEmail]     = useState('');
  const [projectFilters, setProjectFilters] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState('');

  const [testing, setTesting]         = useState<string | null>(null);
  const [deleting, setDeleting]       = useState<string | null>(null);
  const [testResult, setTestResult]   = useState<Record<string, { ok: boolean; message: string }>>({});

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/jira-connections')
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? 'Could not load connections.');
        setConnections(data.connections ?? []);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load connections.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !baseUrl.trim()) {
      setFormError('Name and base URL are required.');
      return;
    }
    if (deploymentType === 'cloud' && !authEmail.trim()) {
      setFormError('Email is required for Jira Cloud connections.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/jira-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          deploymentType,
          baseUrl: baseUrl.trim(),
          authEmail: deploymentType === 'cloud' ? authEmail.trim() : undefined,
          projectFilters: projectFilters.split(',').map(p => p.trim()).filter(Boolean),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(data.error ?? 'Could not create connection.');
        return;
      }
      setName(''); setBaseUrl(''); setAuthEmail(''); setProjectFilters('');
      setShowForm(false);
      load();
    } catch {
      setFormError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTest(id: string) {
    setTesting(id);
    try {
      const res = await fetch(`/api/admin/jira-connections/${id}/test`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      setTestResult(r => ({
        ...r,
        [id]: res.ok
          ? { ok: true, message: `Connected as ${data.account}` }
          : { ok: false, message: data.error ?? 'Connection test failed.' },
      }));
      load();
    } catch {
      setTestResult(r => ({ ...r, [id]: { ok: false, message: 'Network error while testing.' } }));
    } finally {
      setTesting(null);
    }
  }

  async function handleDelete(conn: JiraConnection) {
    const confirmed = window.confirm(`Delete Jira connection "${conn.name}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeleting(conn.id);
    setTestResult(r => {
      const next = { ...r };
      delete next[conn.id];
      return next;
    });

    try {
      const res = await fetch(`/api/admin/jira-connections/${conn.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTestResult(r => ({
          ...r,
          [conn.id]: { ok: false, message: data.error ?? 'Could not delete connection.' },
        }));
        return;
      }
      setConnections(current => current.filter(item => item.id !== conn.id));
    } catch {
      setTestResult(r => ({
        ...r,
        [conn.id]: { ok: false, message: 'Network error while deleting.' },
      }));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Read-only connections to a Jira Cloud or Server/Data Center instance. No write-back; credentials are never stored in the database.
        </p>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0"
        >
          {showForm ? 'Cancel' : '+ Add connection'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline text-xs">Dismiss</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-[14px] border border-slate-200 bg-white p-5 space-y-4">
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {formError}
            </div>
          )}
          <a
            href="/admin/settings?tab=config"
            className="flex items-center gap-2 rounded-[10px] border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition-colors"
          >
            <SvgIcon name="lock" size={14} />
            Looking for the API token field? It&apos;s set once on the App Config tab →
          </a>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Production Jira"
                className="w-full rounded-[10px] border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                Deployment type <span className="text-red-500">*</span>
              </label>
              <select
                value={deploymentType}
                onChange={e => setDeploymentType(e.target.value as 'cloud' | 'server')}
                className="w-full rounded-[10px] border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition bg-white"
              >
                <option value="cloud">Jira Cloud</option>
                <option value="server">Jira Server / Data Center</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                Base URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder={deploymentType === 'cloud' ? 'https://yourcompany.atlassian.net' : 'https://jira.yourcompany.com'}
                className="w-full rounded-[10px] border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
              />
            </div>
            {deploymentType === 'cloud' && (
              <div>
                <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                  Service account email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="jira-readonly@yourcompany.com"
                  className="w-full rounded-[10px] border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">
                Project keys <span className="text-slate-400 font-normal">(comma-separated, optional)</span>
              </label>
              <input
                type="text"
                value={projectFilters}
                onChange={e => setProjectFilters(e.target.value)}
                placeholder="PROJ, TEAM2"
                className="w-full rounded-[10px] border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition"
              />
            </div>
          </div>
          <ConnectionInfoGuide deploymentType={deploymentType} />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create connection'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-[14px] border border-slate-200 bg-white" />
          ))}
        </div>
      ) : connections.length === 0 ? (
        <div className="rounded-[14px] border border-slate-200 bg-white px-6 py-10 text-center">
          <p className="text-2xl mb-2">🔗</p>
          <p className="text-sm font-bold text-slate-500">No Jira connections configured yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map(conn => (
            <div key={conn.id} className="rounded-[14px] border border-slate-200 bg-white px-5 py-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-900 text-sm">{conn.name}</span>
                    <span className="text-xs text-slate-500">{conn.baseUrl}</span>
                    <span className="text-xs font-semibold text-blue-600 capitalize">{conn.deploymentType}</span>
                    {conn.lastSyncStatus && (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${STATUS_BADGE[conn.lastSyncStatus] ?? 'bg-slate-100 text-slate-600'}`}>
                        {conn.lastSyncStatus}
                      </span>
                    )}
                    {!conn.hasGatewayToken && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        Token not set
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {conn.authEmail ? `${conn.authEmail} · ` : ''}
                    {conn.projectFilters.length > 0 ? conn.projectFilters.join(', ') : 'All projects'}
                  </p>
                  {conn.lastSyncError && (
                    <p className="text-xs text-red-600 mt-1">{conn.lastSyncError}</p>
                  )}
                  {testResult[conn.id] && (
                    <p className={`text-xs mt-1 font-semibold ${testResult[conn.id].ok ? 'text-green-700' : 'text-red-600'}`}>
                      {testResult[conn.id].message}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={testing === conn.id || deleting === conn.id}
                    onClick={() => handleTest(conn.id)}
                    className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {testing === conn.id ? (
                      <span className="inline-block w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    ) : <SvgIcon name="retry" size={12} />}
                    Test connection
                  </button>
                  <button
                    type="button"
                    disabled={deleting === conn.id || testing === conn.id}
                    onClick={() => handleDelete(conn)}
                    className="px-3 py-2 rounded-xl text-xs font-bold border border-red-200 text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {deleting === conn.id ? (
                      <span className="inline-block w-3.5 h-3.5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                    ) : <SvgIcon name="delete" size={12} />}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Where to find each piece of connection info ───────────────────────────────

function ConnectionInfoGuide({ deploymentType }: { deploymentType: 'cloud' | 'server' }) {
  return (
    <div className="rounded-[10px] border border-blue-200 bg-blue-50 px-4 py-4 space-y-3">
      <p className="text-[11px] font-black text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
        <SvgIcon name="clipboard" size={13} />
        Where to get this information
      </p>

      {deploymentType === 'cloud' ? (
        <ol className="space-y-2.5 text-xs text-blue-800">
          <li>
            <strong>Base URL</strong> — your Jira Cloud workspace address, e.g. <code className="font-mono bg-white/60 px-1 rounded">https://yourcompany.atlassian.net</code>. Visible in the browser address bar whenever you&apos;re logged into Jira.
          </li>
          <li>
            <strong>Service account email</strong> — the Atlassian account that will own the API token. Use a dedicated read-only service account rather than a personal login if your Jira admin can create one.
          </li>
          <li>
            <strong>API token</strong> — sign in as that account at{' '}
            <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="font-bold underline">
              id.atlassian.com → Security → API tokens
            </a>{' '}
            and click &quot;Create API token&quot;. Paste it under <strong>Admin Settings → App Config → Jira API Token</strong> (it&apos;s encrypted before being stored, the same as your SMTP password) — never enter it in this form.
          </li>
          <li>
            <strong>Project keys</strong> (optional) — the short prefix on any issue in that project, e.g. issue <code className="font-mono bg-white/60 px-1 rounded">PROJ-123</code> belongs to project key <code className="font-mono bg-white/60 px-1 rounded">PROJ</code>. Leave blank to allow all projects this token can see.
          </li>
        </ol>
      ) : (
        <ol className="space-y-2.5 text-xs text-blue-800">
          <li>
            <strong>Base URL</strong> — your organization&apos;s Jira Server/Data Center address (e.g. <code className="font-mono bg-white/60 px-1 rounded">https://jira.yourcompany.com</code>). Ask your Jira administrator if you&apos;re not sure.
          </li>
          <li>
            <strong>Personal Access Token (PAT)</strong> — in Jira, click your profile avatar (top right) → Personal Access Tokens → Create token. Paste it under <strong>Admin Settings → App Config → Jira API Token</strong> (it&apos;s encrypted before being stored, the same as your SMTP password) — never enter it in this form.
          </li>
          <li>
            <strong>Project keys</strong> (optional) — the short prefix on any issue in that project, e.g. issue <code className="font-mono bg-white/60 px-1 rounded">PROJ-123</code> belongs to project key <code className="font-mono bg-white/60 px-1 rounded">PROJ</code>. Leave blank to allow all projects this token can see.
          </li>
        </ol>
      )}

      <p className="text-[11px] text-blue-700 border-t border-blue-200 pt-2.5">
        This connection is read-only — Delivery Clarity never writes back to Jira. The token grants exactly the access that Jira account already has, so a read-only service account is strongly recommended.
      </p>
    </div>
  );
}
