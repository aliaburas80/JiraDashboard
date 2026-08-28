import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ADMIN_SESSION_OPTIONS, type AdminSessionData } from '../../../../lib/session';
import {
  getOwnerAnalyticsIntelligenceData,
  type OwnerAnalyticsEvent,
} from '../../../../../src/server/tenancy/ownerAnalyticsIntelligenceRepository';
import {
  eventLabel,
  eventRoute,
  formatDateTime,
  isFailureEvent,
  percent,
  resolveDays,
  stageForEvents,
} from '../analyticsIntelligence';

type PageProps = { searchParams: Promise<{ days?: string | string[] }> };

function dayKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function canonicalVisitorKey(
  event: OwnerAnalyticsEvent,
  anonymousOwner: Map<string, string>,
): string | null {
  if (event.userId) return `user:${event.userId}`;
  if (event.anonymousId && anonymousOwner.has(event.anonymousId)) {
    return `user:${anonymousOwner.get(event.anonymousId)}`;
  }
  if (event.anonymousId) return `anon:${event.anonymousId}`;
  if (event.sessionId) return `session:${event.sessionId}`;
  return null;
}

function importantEvent(event: OwnerAnalyticsEvent): boolean {
  return event.eventName === 'page_viewed'
    || event.eventName === 'interaction_clicked'
    || event.eventName === 'upload_completed'
    || event.eventName === 'upload_validation_failed'
    || event.eventName === 'analysis_completed'
    || event.eventName === 'analysis_failed'
    || event.eventName === 'dashboard_viewed'
    || event.eventName === 'report_exported'
    || event.eventName === 'client_error'
    || event.eventName === 'api_error';
}

export default async function UserFlowAnalyticsPage({ searchParams }: PageProps) {
  const session = await getIronSession<AdminSessionData>(await cookies(), ADMIN_SESSION_OPTIONS);
  if (!session.isSuperAdmin) {
    return <section className="ops-page"><div className="ops-panel">Super-admin access required.</div></section>;
  }

  const params = await searchParams;
  const days = resolveDays(params.days);
  const since = new Date(Date.now() - days * 24 * 60 * 60_000);
  const data = await getOwnerAnalyticsIntelligenceData(since);

  const anonymousOwner = new Map<string, string>();
  for (const event of data.events) {
    if (event.userId && event.anonymousId) anonymousOwner.set(event.anonymousId, event.userId);
  }

  const grouped = new Map<string, OwnerAnalyticsEvent[]>();
  for (const event of data.events) {
    const key = canonicalVisitorKey(event, anonymousOwner);
    if (!key) continue;
    const list = grouped.get(key) ?? [];
    list.push(event);
    grouped.set(key, list);
  }

  const usersById = new Map(data.users.map(user => [user.id, user]));
  const importsByUser = new Map<string, number>();
  for (const item of data.imports) importsByUser.set(item.userId, (importsByUser.get(item.userId) ?? 0) + 1);

  const rows = [...grouped.entries()].map(([key, events]) => {
    const userId = key.startsWith('user:') ? key.slice(5) : null;
    const user = userId ? usersById.get(userId) : undefined;
    const sessions = new Set(events.map(event => event.sessionId).filter((value): value is string => Boolean(value)));
    const activeDays = new Set(events.map(event => dayKey(event.occurredAt)));
    const pageViews = events.filter(event => event.eventName === 'page_viewed').length;
    const clicks = events.filter(event => event.eventName === 'interaction_clicked').length;
    const failures = events.filter(isFailureEvent).length;
    const firstSeen = events[0]?.occurredAt ?? null;
    const lastSeen = events[events.length - 1]?.occurredAt ?? null;
    const recentFlow = events.filter(importantEvent).slice(-18);
    const returned = sessions.size > 1 || activeDays.size > 1;
    const imports = userId ? importsByUser.get(userId) ?? 0 : 0;

    return {
      key,
      user,
      userId,
      sessions: sessions.size,
      activeDays: activeDays.size,
      pageViews,
      clicks,
      failures,
      firstSeen,
      lastSeen,
      returned,
      imports,
      stage: stageForEvents(events),
      recentFlow,
    };
  }).sort((a, b) => (b.lastSeen?.getTime() ?? 0) - (a.lastSeen?.getTime() ?? 0));

  const registered = rows.filter(row => Boolean(row.user)).length;
  const anonymous = rows.length - registered;
  const returning = rows.filter(row => row.returned).length;
  const activated = rows.filter(row => ['Upload', 'Analysis', 'Dashboard', 'Report'].includes(row.stage)).length;
  const withFriction = rows.filter(row => row.failures > 0).length;

  return (
    <section className="ops-page analytics-page">
      <div className="ops-page-header">
        <div>
          <p className="eyebrow">Behavior intelligence</p>
          <h2>User Flows</h2>
          <p className="muted">Follow each consented visitor from arrival through signup, upload, analysis, dashboards and reports. Anonymous activity is joined to a registered user when the same anonymous identifier later authenticates.</p>
        </div>
      </div>

      <div className="analytics-periods" aria-label="User-flow period">
        {[1, 7, 30, 90].map(period => (
          <a key={period} href={`/analytics/users?days=${period}`} className={period === days ? 'active' : ''}>{period === 1 ? '24h' : `${period} days`}</a>
        ))}
      </div>

      <div className="analytics-stat-grid">
        <article className="ops-stat"><span>Tracked visitors</span><strong>{rows.length}</strong><small>{registered} registered · {anonymous} anonymous</small></article>
        <article className="ops-stat"><span>Returning</span><strong>{percent(returning, rows.length)}%</strong><small>{returning} visitors returned</small></article>
        <article className="ops-stat"><span>Activated</span><strong>{percent(activated, rows.length)}%</strong><small>{activated} reached upload or beyond</small></article>
        <article className="ops-stat"><span>Friction detected</span><strong>{withFriction}</strong><small>Visitors with errors or failed steps</small></article>
      </div>

      {data.eventCount > data.events.length ? (
        <div className="analytics-note status-warn">This period contains more than the detailed event sample limit. The table reflects the first {data.events.length.toLocaleString()} events in the selected period.</div>
      ) : null}

      <div className="ops-table-wrap">
        <table className="ops-table analytics-table">
          <thead>
            <tr><th>User / visitor</th><th>Stage</th><th>Sessions</th><th>Pages</th><th>Clicks</th><th>Uploads</th><th>Friction</th><th>Last seen</th><th>Journey</th></tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key}>
                <td>
                  <strong>{row.user?.name ?? 'Anonymous visitor'}</strong>
                  <span>{row.user?.email ?? `${row.key.slice(0, 24)}…`}</span>
                  <small>{row.user?.persona || `${row.activeDays} active day${row.activeDays === 1 ? '' : 's'}`}</small>
                </td>
                <td><strong>{row.stage}</strong><span>{row.returned ? 'Returning' : 'New / one-session'}</span></td>
                <td>{row.sessions}</td>
                <td>{row.pageViews}</td>
                <td>{row.clicks}</td>
                <td>{row.imports}</td>
                <td>{row.failures || '—'}</td>
                <td>{formatDateTime(row.lastSeen)}</td>
                <td>
                  <details>
                    <summary>View flow</summary>
                    <small>First seen {formatDateTime(row.firstSeen)}</small>
                    {row.recentFlow.length ? (
                      <ol className="ops-list">
                        {row.recentFlow.map((event, index) => (
                          <li key={`${event.occurredAt.toISOString()}-${index}`}>
                            <strong>{formatDateTime(event.occurredAt)}</strong>{' '}
                            <code>{eventRoute(event)}</code>{' — '}{eventLabel(event)}
                          </li>
                        ))}
                      </ol>
                    ) : <p className="muted">No detailed journey events yet.</p>}
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? <div className="ops-panel">No consented user-flow events have been recorded in this period yet.</div> : null}
    </section>
  );
}
