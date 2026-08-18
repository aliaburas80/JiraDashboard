'use client';

import { useEffect, useState } from 'react';

type Diagnostics = {
  generatedAt: string;
  opsScore: number;
  users: { total: number; active: number; admins: number };
  sessions: { total: number; active: number };
  imports: { total: number; successful: number; failed: number; successRate: number; avgHealthScore: number; avgProcessingMs: number };
  snapshots: { total: number };
  auditEvents: { total: number };
  systemErrors: { unresolved: number; latestAt: string | null; latestCode: string | null };
  metricsSync: { available: boolean; scopedFileCount: number; mostRecentWriteAt: string | null; cloudProvider: string; cloudBackupCount: number; latestCloudBackupAt: string | null; cloudListError: string | null; lastFetchedAt: string | null; lastPushedAt: string | null; pendingPush: boolean };
  env: Record<string, boolean>;
  system: { nodeVersion: string; platform: string; uptimeSeconds: number };
};

export default function DiagnosticsPage() {
  const [data, setData] = useState<Diagnostics | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    const response = await fetch('/api/ops/diagnostics', { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? 'Unable to load diagnostics.'); return; }
    setData(body);
  }

  useEffect(() => { void load(); }, []);

  return (
    <section className="ops-page">
      <div className="ops-page-header"><div><p className="eyebrow">Owner operations</p><h2>Diagnostics</h2><p className="muted">Deployment health, data processing, storage and environment readiness.</p></div><button className="secondary-button" onClick={() => void load()}>Refresh</button></div>
      {error ? <div className="error">{error}</div> : null}
      {!data ? <div className="ops-panel">Loading diagnostics…</div> : (
        <>
          <div className="ops-stat-grid">
            <article className="ops-stat"><span>Ops health</span><strong>{data.opsScore}/100</strong><small>current readiness score</small></article>
            <article className="ops-stat"><span>Users</span><strong>{data.users.active}/{data.users.total}</strong><small>{data.users.admins} admins</small></article>
            <article className="ops-stat"><span>Import success</span><strong>{data.imports.successRate}%</strong><small>{data.imports.failed} failed</small></article>
            <article className="ops-stat"><span>System errors</span><strong>{data.systemErrors.unresolved}</strong><small>unresolved</small></article>
          </div>

          <div className="ops-detail-grid">
            <article className="ops-panel"><h3>Sessions & data</h3><dl className="ops-dl"><div><dt>Active sessions</dt><dd>{data.sessions.active}</dd></div><div><dt>Imports</dt><dd>{data.imports.total}</dd></div><div><dt>Snapshots</dt><dd>{data.snapshots.total}</dd></div><div><dt>Audit events</dt><dd>{data.auditEvents.total}</dd></div><div><dt>Avg health score</dt><dd>{data.imports.avgHealthScore}</dd></div><div><dt>Avg processing</dt><dd>{data.imports.avgProcessingMs} ms</dd></div></dl></article>
            <article className="ops-panel"><h3>Metrics & storage</h3><dl className="ops-dl"><div><dt>Scope files</dt><dd>{data.metricsSync.scopedFileCount}</dd></div><div><dt>Provider</dt><dd>{data.metricsSync.cloudProvider}</dd></div><div><dt>Cloud backups</dt><dd>{data.metricsSync.cloudBackupCount}</dd></div><div><dt>Pending push</dt><dd>{data.metricsSync.pendingPush ? 'Yes' : 'No'}</dd></div><div><dt>Latest metrics write</dt><dd>{data.metricsSync.mostRecentWriteAt ? new Date(data.metricsSync.mostRecentWriteAt).toLocaleString() : 'None'}</dd></div></dl>{data.metricsSync.cloudListError ? <div className="error">{data.metricsSync.cloudListError}</div> : null}</article>
            <article className="ops-panel"><h3>Environment checks</h3><ul className="check-list">{Object.entries(data.env).map(([key, ok]) => <li key={key}><span>{key}</span><strong>{ok ? 'Pass' : 'Fail'}</strong></li>)}</ul></article>
            <article className="ops-panel"><h3>Runtime</h3><dl className="ops-dl"><div><dt>Node</dt><dd>{data.system.nodeVersion}</dd></div><div><dt>Platform</dt><dd>{data.system.platform}</dd></div><div><dt>Uptime</dt><dd>{Math.round(data.system.uptimeSeconds / 60)} min</dd></div><div><dt>Generated</dt><dd>{new Date(data.generatedAt).toLocaleString()}</dd></div></dl></article>
          </div>
        </>
      )}
    </section>
  );
}
