'use client';

import { useEffect, useMemo, useState } from 'react';

type FeedbackItem = {
  id: string;
  category: string;
  message: string;
  impactLevel: string;
  canContact: boolean;
  page: string | null;
  appVersion: string | null;
  browserFamily: string | null;
  status: string;
  statusNote: string | null;
  userEmail: string | null;
  createdAt: string;
};

const STATUSES = ['New', 'Reviewing', 'Accepted', 'Planned', 'In Progress', 'Released', 'Rejected'];

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ops/feedback?take=300', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Unable to load feedback.');
      setItems(body.feedback ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load feedback.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => status === 'all' ? items : items.filter(item => item.status === status), [items, status]);

  async function update(item: FeedbackItem, patch: { status?: string; statusNote?: string }) {
    const response = await fetch('/api/ops/feedback', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: item.id, ...patch }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setError(body.error ?? 'Unable to update feedback.'); return; }
    setItems(current => current.map(row => row.id === item.id ? { ...row, ...patch } : row));
  }

  const openCount = items.filter(item => ['New', 'Reviewing'].includes(item.status)).length;
  const blockingCount = items.filter(item => item.impactLevel === 'Blocks Me').length;

  return (
    <section className="ops-page">
      <div className="ops-page-header">
        <div><p className="eyebrow">Organization operations</p><h2>Feedback</h2><p className="muted">Review user feedback without exposing uploaded Jira data or screenshots in bulk.</p></div>
      </div>

      <div className="ops-stat-grid">
        <article className="ops-stat"><span>Total</span><strong>{items.length}</strong><small>feedback items</small></article>
        <article className="ops-stat"><span>Open</span><strong>{openCount}</strong><small>new or reviewing</small></article>
        <article className="ops-stat"><span>Blocking</span><strong>{blockingCount}</strong><small>reported as blocking</small></article>
        <article className="ops-stat"><span>Contactable</span><strong>{items.filter(item => item.canContact).length}</strong><small>users allowing contact</small></article>
      </div>

      <div className="ops-toolbar">
        <label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">All</option>{STATUSES.map(value => <option key={value}>{value}</option>)}</select></label>
        <span>{filtered.length} visible</span>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <div className="ops-panel">Loading feedback…</div> : (
        <div className="ops-card-list">
          {filtered.map(item => (
            <article className="ops-panel" key={item.id}>
              <div className="ops-page-header compact">
                <div>
                  <strong>{item.category}</strong>
                  <p className="muted">{new Date(item.createdAt).toLocaleString()} · {item.impactLevel}</p>
                </div>
                <select value={item.status} onChange={event => void update(item, { status: event.target.value })}>{STATUSES.map(value => <option key={value}>{value}</option>)}</select>
              </div>
              <p>{item.message}</p>
              <div className="ops-meta-row">
                <span>{item.userEmail ?? 'Anonymous / no contact email'}</span>
                <span>{item.page ?? 'Unknown page'}</span>
                <span>{item.browserFamily ?? 'Unknown browser'}</span>
              </div>
              <label>Admin note<textarea value={item.statusNote ?? ''} onChange={event => setItems(current => current.map(row => row.id === item.id ? { ...row, statusNote: event.target.value } : row))} onBlur={() => void update(item, { statusNote: item.statusNote ?? '' })} /></label>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
