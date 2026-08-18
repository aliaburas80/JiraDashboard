'use client';

import { FormEvent, useEffect, useState } from 'react';

type AuditEvent = {
  id: string;
  eventType: string;
  eventDescription: string;
  createdAt: string;
  ipAddress: string | null;
  correlationId: string | null;
};

type Stats = { total: number; last24h: number; failedMfa: number; logins: number };

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, last24h: 0, failedMfa: 0, logins: 0 });
  const [query, setQuery] = useState('');
  const [eventType, setEventType] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(search = query, type = eventType) {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ take: '250' });
      if (search.trim()) params.set('q', search.trim());
      if (type.trim()) params.set('eventType', type.trim());
      const response = await fetch(`/api/ops/audit?${params.toString()}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Unable to load audit events.');
      setEvents(body.events ?? []);
      setStats(body.stats ?? stats);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load audit events.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load('', ''); }, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    void load();
  }

  return (
    <section className="ops-page">
      <div className="ops-page-header">
        <div><p className="eyebrow">Organization operations</p><h2>Audit</h2><p className="muted">Security and administrative activity scoped to this organization.</p></div>
      </div>

      <div className="ops-stat-grid">
        <article className="ops-stat"><span>Total</span><strong>{stats.total}</strong><small>audit events</small></article>
        <article className="ops-stat"><span>Last 24h</span><strong>{stats.last24h}</strong><small>recent events</small></article>
        <article className="ops-stat"><span>Admin MFA failures</span><strong>{stats.failedMfa}</strong><small>last 24 hours</small></article>
        <article className="ops-stat"><span>Logins</span><strong>{stats.logins}</strong><small>last 24 hours</small></article>
      </div>

      <form className="ops-toolbar" onSubmit={submit}>
        <input placeholder="Search description, event or correlation ID" value={query} onChange={event => setQuery(event.target.value)} />
        <input placeholder="Exact event type" value={eventType} onChange={event => setEventType(event.target.value)} />
        <button className="secondary-button" type="submit">Filter</button>
      </form>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <div className="ops-panel">Loading audit events…</div> : (
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead><tr><th>Time</th><th>Event</th><th>Description</th><th>IP</th><th>Correlation</th></tr></thead>
            <tbody>{events.map(item => (
              <tr key={item.id}>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td><code>{item.eventType}</code></td>
                <td>{item.eventDescription}</td>
                <td>{item.ipAddress ?? '—'}</td>
                <td><code>{item.correlationId ?? '—'}</code></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
