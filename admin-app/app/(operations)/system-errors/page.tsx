'use client';

import { useEffect, useState } from 'react';

type SystemError = {
  id: string;
  errorCode: string;
  errorMessage: string;
  prismaModel: string | null;
  operation: string;
  context: string | null;
  resolution: string;
  retryCount: number;
  lastRetriedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  correlationId: string | null;
};

export default function SystemErrorsPage() {
  const [items, setItems] = useState<SystemError[]>([]);
  const [total, setTotal] = useState(0);
  const [unresolved, setUnresolved] = useState(0);
  const [resolution, setResolution] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(filter = resolution) {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '250' });
      if (filter) params.set('resolution', filter);
      const response = await fetch(`/api/ops/system-errors?${params.toString()}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Unable to load system errors.');
      setItems(body.errors ?? []);
      setTotal(body.total ?? 0);
      setUnresolved(body.unresolved ?? 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load system errors.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(''); }, []);

  async function retry(id: string) {
    const response = await fetch('/api/ops/system-errors?action=retry', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? 'Retry failed.'); return; }
    await load();
  }

  async function resolve(id?: string) {
    const response = await fetch('/api/ops/system-errors', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(id ? { id } : { all: true }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setError(body.error ?? 'Resolve failed.'); return; }
    await load();
  }

  return (
    <section className="ops-page">
      <div className="ops-page-header">
        <div><p className="eyebrow">Owner operations</p><h2>System Errors</h2><p className="muted">Deployment-wide error log with explicit retry and resolve actions.</p></div>
        <button className="secondary-button" disabled={unresolved === 0} onClick={() => void resolve()}>Resolve all unresolved</button>
      </div>

      <div className="ops-stat-grid">
        <article className="ops-stat"><span>Total in view</span><strong>{total}</strong><small>matching filter</small></article>
        <article className="ops-stat"><span>Unresolved</span><strong>{unresolved}</strong><small>deployment-wide</small></article>
        <article className="ops-stat"><span>Retries</span><strong>{items.reduce((sum, item) => sum + item.retryCount, 0)}</strong><small>for visible errors</small></article>
        <article className="ops-stat"><span>Critical codes</span><strong>{items.filter(item => /^P20|UNKNOWN/.test(item.errorCode)).length}</strong><small>visible sample</small></article>
      </div>

      <div className="ops-toolbar">
        <label>Resolution<select value={resolution} onChange={event => { setResolution(event.target.value); void load(event.target.value); }}><option value="">All</option><option value="logged">Logged</option><option value="resolved">Resolved</option><option value="auto-fixed">Auto-fixed</option></select></label>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <div className="ops-panel">Loading system errors…</div> : (
        <div className="ops-card-list">
          {items.map(item => (
            <article className="ops-panel" key={item.id}>
              <div className="ops-page-header compact">
                <div><strong>{item.errorCode} · {item.operation}</strong><p className="muted">{new Date(item.createdAt).toLocaleString()} · {item.resolution}</p></div>
                <div className="ops-actions"><button className="secondary-button" onClick={() => void retry(item.id)}>Retry</button>{!item.resolvedAt ? <button className="secondary-button" onClick={() => void resolve(item.id)}>Resolve</button> : null}</div>
              </div>
              <p>{item.errorMessage}</p>
              <div className="ops-meta-row"><span>{item.context ?? 'No context'}</span><span>{item.prismaModel ?? 'No Prisma model'}</span><span>{item.correlationId ?? 'No correlation ID'}</span></div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
