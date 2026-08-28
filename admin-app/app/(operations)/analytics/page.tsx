import type { CSSProperties } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '../../../../src/lib/prisma';
import { getOwnerProductAnalyticsOperationalData } from '../../../../src/server/tenancy/ownerProductAnalyticsRepository';
import { ADMIN_SESSION_OPTIONS, type AdminSessionData } from '../../../lib/session';

const PERIODS = [1, 7, 30, 90] as const;
const EVENT_SAMPLE_LIMIT = 50_000;

type PageProps = {
  searchParams: Promise<{ days?: string | string[] }>;
};

type EventRow = {
  eventName: string;
  occurredAt: Date;
  userId: string | null;
  anonymousId: string | null;
  sessionId: string | null;
  page: string;
  deviceCategory: string;
  browserFamily: string;
  propertiesJson: string;
};

function percent(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function analyticsWidthStyle(value: number): CSSProperties {
  const bounded = Math.max(0, Math.min(100, value));
  return { '--analytics-width': `${bounded}%` } as CSSProperties;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function visitorKey(event: EventRow): string | null {
  if (event.userId) return `user:${event.userId}`;
  if (event.anonymousId) return `anon:${event.anonymousId}`;
  if (event.sessionId) return `session:${event.sessionId}`;
  return null;
}

function properties(event: EventRow): Record<string, unknown> {
  try {
    const parsed = JSON.parse(event.propertiesJson) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat('en', { notation: value >= 10_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
}

function shortDate(date: Date): string {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function formatDateTime(date: Date | null): string {
  if (!date) return 'Never';
  return new Intl.DateTimeFormat('en', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
}

export default async function ProductAnalyticsPage({ searchParams }: PageProps) {
  const session = await getIronSession<AdminSessionData>(await cookies(), ADMIN_SESSION_OPTIONS);

  if (!session.isSuperAdmin) {
    return (
      <section className="ops-page">
        <div className="ops-page-header">
          <div>
            <p className="eyebrow">Product analytics</p>
            <h2>Super-admin access required</h2>
            <p className="muted">Public-site analytics span organizations and anonymous visitors, so this view is restricted to the super administrator.</p>
          </div>
        </div>
      </section>
    );
  }

  const params = await searchParams;
  const rawDays = Array.isArray(params.days) ? params.days[0] : params.days;
  const requestedDays = Number(rawDays ?? 30);
  const days = PERIODS.includes(requestedDays as (typeof PERIODS)[number])
    ? requestedDays
    : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1_000);

  const [events, eventCount, operational] = await Promise.all([
    prisma.productAnalyticsEvent.findMany({
      where: { occurredAt: { gte: since } },
      orderBy: { occurredAt: 'asc' },
      take: EVENT_SAMPLE_LIMIT,
      select: {
        eventName: true,
        occurredAt: true,
        userId: true,
        anonymousId: true,
        sessionId: true,
        page: true,
        deviceCategory: true,
        browserFamily: true,
        propertiesJson: true,
      },
    }),
    prisma.productAnalyticsEvent.count({ where: { occurredAt: { gte: since } } }),
    getOwnerProductAnalyticsOperationalData(since),
  ]);
  const { totalUsers, newUsers, imports } = operational;

  const sampled = eventCount > events.length;
  const pageViews = events.filter(event => event.eventName === 'page_viewed');
  const pageBasis = pageViews.length > 0 ? pageViews : events.filter(event => event.page);
  const exactPageTracking = pageViews.length > 0;

  const visitorActivity = new Map<string, { days: Set<string>; sessions: Set<string> }>();
  for (const event of events) {
    const key = visitorKey(event);
    if (!key) continue;
    const current = visitorActivity.get(key) ?? { days: new Set<string>(), sessions: new Set<string>() };
    current.days.add(dayKey(event.occurredAt));
    if (event.sessionId) current.sessions.add(event.sessionId);
    visitorActivity.set(key, current);
  }

  const visitors = visitorActivity.size;
  const returningVisitors = [...visitorActivity.values()].filter(item => item.days.size > 1 || item.sessions.size > 1).length;
  const totalSessions = new Set(events.map(event => event.sessionId).filter((value): value is string => Boolean(value))).size;
  const averageSessions = visitors > 0 ? (totalSessions / visitors).toFixed(1) : '0.0';
  const averageActiveDays = visitors > 0
    ? ([...visitorActivity.values()].reduce((sum, item) => sum + item.days.size, 0) / visitors).toFixed(1)
    : '0.0';

  const successfulUploads = imports.filter(item => item.status === 'success').length;
  const failedUploads = imports.filter(item => ['failed', 'validation_failed'].includes(item.status)).length;
  const uploaders = new Set(imports.map(item => item.userId)).size;
  const totalImportedIssues = imports.reduce((sum, item) => sum + item.totalIssues, 0);
  const avgProcessingMs = imports.length > 0
    ? Math.round(imports.reduce((sum, item) => sum + item.processingTimeMs, 0) / imports.length)
    : 0;

  const countEvent = (name: string) => events.filter(event => event.eventName === name).length;
  const uniqueForEvent = (name: string) => {
    const identities = new Set<string>();
    for (const event of events) {
      if (event.eventName !== name) continue;
      const key = visitorKey(event);
      if (key) identities.add(key);
    }
    return identities.size;
  };

  const stages = [
    { label: 'Visitors', value: visitors },
    { label: 'Signups', value: uniqueForEvent('signup_completed') || newUsers.length },
    { label: 'Uploads', value: uniqueForEvent('upload_completed') || uploaders },
    { label: 'Analyses', value: uniqueForEvent('analysis_completed') },
    { label: 'Dashboard', value: uniqueForEvent('dashboard_viewed') },
    { label: 'Reports', value: uniqueForEvent('report_exported') },
  ];
  const journeyMax = Math.max(1, ...stages.map(stage => stage.value));

  const pageMap = new Map<string, { activity: number; visitors: Set<string>; sessions: Set<string> }>();
  for (const event of pageBasis) {
    const path = event.page || '/';
    const current = pageMap.get(path) ?? { activity: 0, visitors: new Set<string>(), sessions: new Set<string>() };
    current.activity += 1;
    const key = visitorKey(event);
    if (key) current.visitors.add(key);
    if (event.sessionId) current.sessions.add(event.sessionId);
    pageMap.set(path, current);
  }
  const topPages = [...pageMap.entries()]
    .map(([page, value]) => ({ page, activity: value.activity, visitors: value.visitors.size, sessions: value.sessions.size }))
    .sort((a, b) => b.activity - a.activity)
    .slice(0, 12);

  const sourceMap = new Map<string, { views: number; sessions: Set<string> }>();
  for (const event of pageViews) {
    const props = properties(event);
    const rawSource = props.acquisition_source;
    const source = typeof rawSource === 'string' && rawSource.trim() ? rawSource.trim().toLowerCase() : 'direct';
    const current = sourceMap.get(source) ?? { views: 0, sessions: new Set<string>() };
    current.views += 1;
    if (event.sessionId) current.sessions.add(event.sessionId);
    sourceMap.set(source, current);
  }
  const sources = [...sourceMap.entries()]
    .map(([source, value]) => ({ source, views: value.views, sessions: value.sessions.size }))
    .sort((a, b) => b.sessions - a.sessions || b.views - a.views)
    .slice(0, 8);
  const maxSourceSessions = Math.max(1, ...sources.map(item => item.sessions));

  const deviceMap = new Map<string, number>();
  for (const event of pageBasis) {
    const key = event.deviceCategory || 'unknown';
    deviceMap.set(key, (deviceMap.get(key) ?? 0) + 1);
  }
  const devices = [...deviceMap.entries()].sort((a, b) => b[1] - a[1]);
  const maxDevice = Math.max(1, ...devices.map(([, value]) => value));

  const browserMap = new Map<string, number>();
  for (const event of pageBasis) {
    const key = event.browserFamily || 'Unknown';
    browserMap.set(key, (browserMap.get(key) ?? 0) + 1);
  }
  const browsers = [...browserMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const eventsBySession = new Map<string, EventRow[]>();
  for (const event of pageBasis) {
    if (!event.sessionId) continue;
    const list = eventsBySession.get(event.sessionId) ?? [];
    list.push(event);
    eventsBySession.set(event.sessionId, list);
  }
  const transitionMap = new Map<string, number>();
  for (const list of eventsBySession.values()) {
    let previous: string | null = null;
    for (const event of list) {
      const current = event.page || '/';
      if (previous && previous !== current) {
        const transition = `${previous} → ${current}`;
        transitionMap.set(transition, (transitionMap.get(transition) ?? 0) + 1);
      }
      previous = current;
    }
  }
  const transitions = [...transitionMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxTransition = Math.max(1, ...transitions.map(([, value]) => value));

  const dayRows = Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (days - 1 - index));
    return { key: dayKey(date), date, visitors: new Set<string>(), pageViews: 0, uploads: 0, signups: 0 };
  });
  const dayMap = new Map(dayRows.map(row => [row.key, row]));
  for (const event of events) {
    const row = dayMap.get(dayKey(event.occurredAt));
    if (!row) continue;
    const key = visitorKey(event);
    if (key) row.visitors.add(key);
    if (event.eventName === 'page_viewed') row.pageViews += 1;
  }
  for (const item of imports) {
    const row = dayMap.get(dayKey(item.uploadedAt));
    if (row) row.uploads += 1;
  }
  for (const user of newUsers) {
    const row = dayMap.get(dayKey(user.createdAt));
    if (row) row.signups += 1;
  }
  const maxDailyVisitors = Math.max(1, ...dayRows.map(row => row.visitors.size));
  const visibleDayRows = days <= 30 ? dayRows : dayRows.filter((_, index) => index % 3 === 0 || index === dayRows.length - 1);

  const recentUsers = newUsers.slice(0, 10);
  const verifiedNewUsers = newUsers.filter(user => user.emailVerified).length;

  return (
    <section className="ops-page analytics-page">
      <div className="ops-page-header">
        <div>
          <p className="eyebrow">Public launch</p>
          <h2>Product Analytics</h2>
          <p className="muted">See who arrives, what they use, where they drop, who uploads, and who comes back. Behavioral metrics include only consented analytics events; signup and upload totals come from operational records.</p>
        </div>
        <span className="status-pill status-pass">Live telemetry</span>
      </div>

      <div className="analytics-periods" aria-label="Analytics period">
        {PERIODS.map(period => (
          <Link key={period} href={`/analytics?days=${period}`} className={period === days ? 'active' : ''}>
            {period === 1 ? '24h' : `${period} days`}
          </Link>
        ))}
        <span>Since {shortDate(since)}</span>
      </div>

      {sampled && (
        <div className="analytics-note status-warn">
          This period contains {compactNumber(eventCount)} analytics events. Detailed tables use the first {compactNumber(EVENT_SAMPLE_LIMIT)} events; operational user/upload totals remain exact.
        </div>
      )}

      <div className="analytics-stat-grid">
        <article className="ops-stat"><span>Visitors</span><strong>{compactNumber(visitors)}</strong><small>{compactNumber(totalSessions)} sessions · {averageSessions}/visitor</small></article>
        <article className="ops-stat"><span>New users</span><strong>{compactNumber(newUsers.length)}</strong><small>{verifiedNewUsers} verified · {compactNumber(totalUsers)} total</small></article>
        <article className="ops-stat"><span>Return rate</span><strong>{percent(returningVisitors, visitors)}%</strong><small>{returningVisitors} repeat visitors · {averageActiveDays} active days avg.</small></article>
        <article className="ops-stat"><span>Uploads</span><strong>{compactNumber(imports.length)}</strong><small>{successfulUploads} successful · {uploaders} uploaders</small></article>
        <article className="ops-stat"><span>Analyses completed</span><strong>{compactNumber(countEvent('analysis_completed'))}</strong><small>{compactNumber(countEvent('analysis_failed'))} failed</small></article>
        <article className="ops-stat"><span>Reports exported</span><strong>{compactNumber(countEvent('report_exported'))}</strong><small>{compactNumber(countEvent('dashboard_viewed'))} dashboard views</small></article>
        <article className="ops-stat"><span>Exact page views</span><strong>{compactNumber(pageViews.length)}</strong><small>{exactPageTracking ? 'Automatic route tracking active' : 'Begins after this release deploys'}</small></article>
        <article className="ops-stat"><span>Imported issues</span><strong>{compactNumber(totalImportedIssues)}</strong><small>{avgProcessingMs ? `${(avgProcessingMs / 1000).toFixed(1)}s avg processing` : 'No processing data yet'}</small></article>
      </div>

      <div className="analytics-two-col">
        <div className="ops-panel">
          <div className="analytics-panel-heading">
            <div><h3>Daily activity</h3><p className="muted">Unique visitors, uploads and new accounts.</p></div>
          </div>
          <div className="analytics-day-list">
            {visibleDayRows.map(row => (
              <div className="analytics-day-row" key={row.key}>
                <span>{shortDate(row.date)}</span>
                <div className="analytics-track"><i style={analyticsWidthStyle(Math.max(row.visitors.size ? 4 : 0, percent(row.visitors.size, maxDailyVisitors)))} /></div>
                <strong>{row.visitors.size}</strong>
                <small>{row.uploads} uploads · {row.signups} new</small>
              </div>
            ))}
          </div>
        </div>

        <div className="ops-panel">
          <div className="analytics-panel-heading">
            <div><h3>User value journey</h3><p className="muted">Unique people reaching each stage during this period. This is a period journey, not a signup cohort.</p></div>
          </div>
          <div className="analytics-funnel">
            {stages.map((stage, index) => (
              <div key={stage.label} className="analytics-funnel-row">
                <span>{index + 1}. {stage.label}</span>
                <div className="analytics-track"><i style={analyticsWidthStyle(Math.max(stage.value ? 4 : 0, percent(stage.value, journeyMax)))} /></div>
                <strong>{stage.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="analytics-two-col analytics-wide-left">
        <div className="ops-panel">
          <div className="analytics-panel-heading">
            <div>
              <h3>Most-used pages</h3>
              <p className="muted">{exactPageTracking ? 'Exact route views and unique visitors.' : 'No page_viewed events yet, so this temporarily uses tracked activity by page until the new route tracker is deployed.'}</p>
            </div>
          </div>
          {topPages.length > 0 ? (
            <div className="ops-table-wrap">
              <table className="ops-table analytics-table">
                <thead><tr><th>Page</th><th>{exactPageTracking ? 'Views' : 'Activity'}</th><th>Visitors</th><th>Sessions</th></tr></thead>
                <tbody>
                  {topPages.map(item => (
                    <tr key={item.page}><td><strong>{item.page}</strong></td><td>{item.activity}</td><td>{item.visitors}</td><td>{item.sessions}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="muted">No consented page activity has been collected in this period.</p>}
        </div>

        <div className="ops-panel">
          <div className="analytics-panel-heading"><div><h3>Where visitors came from</h3><p className="muted">UTM source first; otherwise external referrer host. Starts accumulating with the new page tracker.</p></div></div>
          {sources.length > 0 ? (
            <div className="analytics-bar-list">
              {sources.map(item => (
                <div key={item.source} className="analytics-bar-row">
                  <span>{item.source}</span><div className="analytics-track"><i style={analyticsWidthStyle(percent(item.sessions, maxSourceSessions))} /></div><strong>{item.sessions}</strong>
                </div>
              ))}
            </div>
          ) : <p className="muted">No acquisition data yet. For LinkedIn, use links such as <code>?utm_source=linkedin&amp;utm_medium=social&amp;utm_campaign=public_launch</code>.</p>}
        </div>
      </div>

      <div className="analytics-two-col">
        <div className="ops-panel">
          <div className="analytics-panel-heading"><div><h3>Common user flows</h3><p className="muted">Most frequent page-to-page transitions inside a session.</p></div></div>
          {transitions.length > 0 ? (
            <div className="analytics-bar-list">
              {transitions.map(([transition, count]) => (
                <div key={transition} className="analytics-bar-row flow-row"><span>{transition}</span><div className="analytics-track"><i style={analyticsWidthStyle(percent(count, maxTransition))} /></div><strong>{count}</strong></div>
              ))}
            </div>
          ) : <p className="muted">More than one tracked page in a session is needed before flows appear.</p>}
        </div>

        <div className="ops-panel">
          <div className="analytics-panel-heading"><div><h3>Devices & browsers</h3><p className="muted">Useful for deciding where UX testing matters most.</p></div></div>
          <div className="analytics-split-detail">
            <div>
              <h4>Devices</h4>
              <div className="analytics-bar-list compact">
                {devices.slice(0, 5).map(([device, count]) => <div key={device} className="analytics-bar-row"><span>{device}</span><div className="analytics-track"><i style={analyticsWidthStyle(percent(count, maxDevice))} /></div><strong>{count}</strong></div>)}
              </div>
            </div>
            <div>
              <h4>Browsers</h4>
              <dl className="ops-dl">
                {browsers.map(([browser, count]) => <div key={browser}><dt>{browser}</dt><dd>{count}</dd></div>)}
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-two-col">
        <div className="ops-panel">
          <div className="analytics-panel-heading"><div><h3>Upload health</h3><p className="muted">Operational import records — not dependent on analytics consent.</p></div></div>
          <dl className="ops-dl">
            <div><dt>Total uploads</dt><dd>{imports.length}</dd></div>
            <div><dt>Successful</dt><dd>{successfulUploads}</dd></div>
            <div><dt>Failed / validation failed</dt><dd>{failedUploads}</dd></div>
            <div><dt>Unique uploaders</dt><dd>{uploaders}</dd></div>
            <div><dt>Rows processed</dt><dd>{compactNumber(imports.reduce((sum, item) => sum + item.rowCount, 0))}</dd></div>
            <div><dt>Successful rate</dt><dd>{percent(successfulUploads, imports.length)}%</dd></div>
          </dl>
        </div>

        <div className="ops-panel">
          <div className="analytics-panel-heading"><div><h3>New users</h3><p className="muted">Latest registrations in this period.</p></div><Link href="/users" className="analytics-text-link">Open Users →</Link></div>
          {recentUsers.length > 0 ? (
            <div className="analytics-user-list">
              {recentUsers.map(user => (
                <div key={user.id}>
                  <div><strong>{user.name}</strong><span>{user.email}</span></div>
                  <div><span>{user.persona || 'No persona'}</span><small>{user.emailVerified ? 'Verified' : 'Unverified'} · joined {shortDate(user.createdAt)} · last login {formatDateTime(user.lastLoginAt)}</small></div>
                </div>
              ))}
            </div>
          ) : <p className="muted">No new accounts in this period.</p>}
        </div>
      </div>

      <div className="analytics-note">
        <strong>Measurement note.</strong> Behavioral analytics is consent-gated by design. A visitor who declines analytics will still appear in operational signup/upload records after they register or upload, but their browsing behavior will not be included here. This avoids presenting privacy-invasive tracking as complete telemetry.
      </div>
    </section>
  );
}
