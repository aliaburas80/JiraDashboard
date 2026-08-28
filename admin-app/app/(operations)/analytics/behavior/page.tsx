import Link from 'next/link';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ADMIN_SESSION_OPTIONS, type AdminSessionData } from '../../../../lib/session';
import {
  getOwnerAnalyticsIntelligenceData,
  type OwnerAnalyticsEvent,
} from '../../../../../src/server/tenancy/ownerAnalyticsIntelligenceRepository';
import {
  eventLabel,
  eventProperties,
  eventRoute,
  formatDuration,
  isFailureEvent,
  percent,
  resolveDays,
  visitorKey,
} from '../analyticsIntelligence';

type PageProps = { searchParams: Promise<{ days?: string | string[] }> };

type PageMetric = {
  views: number;
  visitors: Set<string>;
  sessions: Set<string>;
  clicks: number;
  exits: number;
  errors: number;
  repeatClicks: number;
  engagementMs: number;
  engagementSamples: number;
};

type ActionMetric = {
  page: string;
  label: string;
  target: string;
  clicks: number;
  visitors: Set<string>;
  sessions: Set<string>;
  repeatClicks: number;
};

const FEATURE_EVENTS = [
  ['filter_applied', 'Filters'],
  ['search_used', 'Search'],
  ['insight_opened', 'Insights'],
  ['calculation_explanation_opened', 'Calculation explanations'],
  ['relation_map_opened', 'Relation map'],
  ['dashboard_viewed', 'Dashboards'],
  ['report_exported', 'Report export'],
  ['help_opened', 'Help'],
] as const;

function pageMetric(map: Map<string, PageMetric>, route: string): PageMetric {
  const current = map.get(route) ?? {
    views: 0,
    visitors: new Set<string>(),
    sessions: new Set<string>(),
    clicks: 0,
    exits: 0,
    errors: 0,
    repeatClicks: 0,
    engagementMs: 0,
    engagementSamples: 0,
  };
  map.set(route, current);
  return current;
}

function improvementScore(metric: PageMetric): number {
  const exitRate = percent(metric.exits, metric.sessions.size);
  const lowEngagementPenalty = metric.engagementSamples > 0 && metric.engagementMs / metric.engagementSamples < 10_000 ? 4 : 0;
  return Math.round(
    metric.views * (exitRate / 100)
    + metric.errors * 12
    + metric.repeatClicks * 6
    + lowEngagementPenalty,
  );
}

export default async function BehaviorAnalyticsPage({ searchParams }: PageProps) {
  const session = await getIronSession<AdminSessionData>(await cookies(), ADMIN_SESSION_OPTIONS);
  if (!session.isSuperAdmin) {
    return <section className="ops-page"><div className="ops-panel">Super-admin access required.</div></section>;
  }

  const params = await searchParams;
  const days = resolveDays(params.days);
  const since = new Date(Date.now() - days * 24 * 60 * 60_000);
  const data = await getOwnerAnalyticsIntelligenceData(since);

  const pages = new Map<string, PageMetric>();
  const pageViews = data.events.filter(event => event.eventName === 'page_viewed');
  for (const event of pageViews) {
    const route = eventRoute(event);
    const metric = pageMetric(pages, route);
    metric.views += 1;
    const key = visitorKey(event);
    if (key) metric.visitors.add(key);
    if (event.sessionId) metric.sessions.add(event.sessionId);
  }

  for (const event of data.events) {
    const route = eventRoute(event);
    if (event.eventName === 'interaction_clicked') pageMetric(pages, route).clicks += 1;
    if (isFailureEvent(event)) pageMetric(pages, route).errors += 1;
    if (event.eventName === 'page_engaged' && event.durationMs) {
      const metric = pageMetric(pages, route);
      metric.engagementMs += event.durationMs;
      metric.engagementSamples += 1;
    }
  }

  const sessionPages = new Map<string, OwnerAnalyticsEvent[]>();
  for (const event of pageViews) {
    if (!event.sessionId) continue;
    const list = sessionPages.get(event.sessionId) ?? [];
    list.push(event);
    sessionPages.set(event.sessionId, list);
  }
  for (const list of sessionPages.values()) {
    const last = list[list.length - 1];
    if (last) pageMetric(pages, eventRoute(last)).exits += 1;
  }

  const actions = new Map<string, ActionMetric>();
  const lastClick = new Map<string, number>();
  for (const event of data.events) {
    if (event.eventName !== 'interaction_clicked') continue;
    const route = eventRoute(event);
    const props = eventProperties(event);
    const label = eventLabel(event);
    const target = typeof props.target === 'string' ? props.target : '';
    const actionKey = `${route}::${label}::${target}`;
    const metric = actions.get(actionKey) ?? {
      page: route,
      label,
      target,
      clicks: 0,
      visitors: new Set<string>(),
      sessions: new Set<string>(),
      repeatClicks: 0,
    };
    metric.clicks += 1;
    const key = visitorKey(event);
    if (key) metric.visitors.add(key);
    if (event.sessionId) metric.sessions.add(event.sessionId);

    const repeatKey = `${event.sessionId ?? key ?? 'unknown'}::${route}::${label}`;
    const previous = lastClick.get(repeatKey);
    const current = event.occurredAt.getTime();
    if (previous !== undefined && current - previous <= 2_000) {
      metric.repeatClicks += 1;
      pageMetric(pages, route).repeatClicks += 1;
    }
    lastClick.set(repeatKey, current);
    actions.set(actionKey, metric);
  }

  const pageRows = [...pages.entries()]
    .map(([route, metric]) => ({
      route,
      ...metric,
      exitRate: percent(metric.exits, metric.sessions.size),
      avgEngagementMs: metric.engagementSamples ? Math.round(metric.engagementMs / metric.engagementSamples) : 0,
      score: improvementScore(metric),
    }))
    .sort((a, b) => b.views - a.views || b.visitors.size - a.visitors.size);

  const actionRows = [...actions.values()]
    .sort((a, b) => b.clicks - a.clicks || b.visitors.size - a.visitors.size)
    .slice(0, 25);

  const opportunityRows = [...pageRows]
    .filter(row => row.views > 0)
    .sort((a, b) => b.score - a.score || b.views - a.views)
    .slice(0, 12);

  const eventCounts = new Map<string, { count: number; visitors: Set<string> }>();
  for (const event of data.events) {
    const current = eventCounts.get(event.eventName) ?? { count: 0, visitors: new Set<string>() };
    current.count += 1;
    const key = visitorKey(event);
    if (key) current.visitors.add(key);
    eventCounts.set(event.eventName, current);
  }
  const featureRows = FEATURE_EVENTS.map(([eventName, label]) => ({
    eventName,
    label,
    count: eventCounts.get(eventName)?.count ?? 0,
    visitors: eventCounts.get(eventName)?.visitors.size ?? 0,
  })).sort((a, b) => b.visitors - a.visitors || b.count - a.count);

  const totalClicks = [...actions.values()].reduce((sum, action) => sum + action.clicks, 0);
  const totalRepeatClicks = [...actions.values()].reduce((sum, action) => sum + action.repeatClicks, 0);
  const totalErrors = pageRows.reduce((sum, page) => sum + page.errors, 0);
  const measuredEngagement = pageRows.filter(page => page.engagementSamples > 0);
  const avgEngagement = measuredEngagement.length
    ? Math.round(measuredEngagement.reduce((sum, page) => sum + page.avgEngagementMs, 0) / measuredEngagement.length)
    : 0;

  return (
    <section className="ops-page analytics-page">
      <div className="ops-page-header">
        <div>
          <p className="eyebrow">Product improvement</p>
          <h2>Behavior & Hotspots</h2>
          <p className="muted">Find the pages people use most, the controls they click, where sessions end, where errors appear, and where repeated clicks suggest friction.</p>
        </div>
      </div>

      <div className="analytics-periods" aria-label="Behavior period">
        {[1, 7, 30, 90].map(period => (
          <Link key={period} href={`/analytics/behavior?days=${period}`} className={period === days ? 'active' : ''}>{period === 1 ? '24h' : `${period} days`}</Link>
        ))}
      </div>

      <div className="analytics-stat-grid">
        <article className="ops-stat"><span>Page views</span><strong>{pageViews.length}</strong><small>{pageRows.length} pages observed</small></article>
        <article className="ops-stat"><span>Tracked clicks</span><strong>{totalClicks}</strong><small>{actionRows.length} hot actions shown</small></article>
        <article className="ops-stat"><span>Repeat-click signals</span><strong>{totalRepeatClicks}</strong><small>Same control clicked again within 2s</small></article>
        <article className="ops-stat"><span>Errors / failed steps</span><strong>{totalErrors}</strong><small>Client, API, upload or analysis friction</small></article>
        <article className="ops-stat"><span>Avg. page engagement</span><strong>{formatDuration(avgEngagement)}</strong><small>Measured page-engagement samples</small></article>
      </div>

      <div className="analytics-two-col analytics-wide-left">
        <div className="ops-panel">
          <div className="analytics-panel-heading"><div><h3>Improvement opportunities</h3><p className="muted">Heuristic priority based on traffic, exit rate, errors, short engagement and repeated clicks.</p></div></div>
          <div className="ops-table-wrap">
            <table className="ops-table analytics-table">
              <thead><tr><th>Page</th><th>Priority</th><th>Views</th><th>Exit rate</th><th>Errors</th><th>Repeat clicks</th><th>Avg. engagement</th></tr></thead>
              <tbody>
                {opportunityRows.map(row => (
                  <tr key={row.route}>
                    <td><code>{row.route}</code></td>
                    <td><strong>{row.score}</strong></td>
                    <td>{row.views}</td>
                    <td>{row.exitRate}%</td>
                    <td>{row.errors || '—'}</td>
                    <td>{row.repeatClicks || '—'}</td>
                    <td>{formatDuration(row.avgEngagementMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ops-panel">
          <div className="analytics-panel-heading"><div><h3>Feature adoption</h3><p className="muted">Which higher-value capabilities people actually use.</p></div></div>
          <div className="analytics-user-list">
            {featureRows.map(feature => (
              <div key={feature.eventName}>
                <div><strong>{feature.label}</strong><small>{feature.eventName}</small></div>
                <div><strong>{feature.visitors} users</strong><small>{feature.count} events</small></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="analytics-two-col">
        <div className="ops-panel">
          <div className="analytics-panel-heading"><div><h3>Hot pages</h3><p className="muted">Traffic, unique visitors and session exits.</p></div></div>
          <div className="ops-table-wrap">
            <table className="ops-table analytics-table">
              <thead><tr><th>Page</th><th>Views</th><th>Visitors</th><th>Sessions</th><th>Clicks</th><th>Exit rate</th></tr></thead>
              <tbody>
                {pageRows.slice(0, 25).map(row => (
                  <tr key={row.route}><td><code>{row.route}</code></td><td>{row.views}</td><td>{row.visitors.size}</td><td>{row.sessions.size}</td><td>{row.clicks}</td><td>{row.exitRate}%</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ops-panel">
          <div className="analytics-panel-heading"><div><h3>Hot buttons & actions</h3><p className="muted">Privacy-safe labels only; form values and arbitrary user content are never captured.</p></div></div>
          <div className="ops-table-wrap">
            <table className="ops-table analytics-table">
              <thead><tr><th>Action</th><th>Page</th><th>Clicks</th><th>Users</th><th>Repeat</th></tr></thead>
              <tbody>
                {actionRows.map((action, index) => (
                  <tr key={`${action.page}-${action.label}-${index}`}>
                    <td><strong>{action.label}</strong>{action.target ? <span>{action.target}</span> : null}</td>
                    <td><code>{action.page}</code></td>
                    <td>{action.clicks}</td>
                    <td>{action.visitors.size}</td>
                    <td>{action.repeatClicks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {data.eventCount > data.events.length ? <div className="analytics-note status-warn">Detailed behavior is sampled from the first {data.events.length.toLocaleString()} events in this period.</div> : null}
      {pageRows.length === 0 ? <div className="ops-panel">No behavior events have been recorded yet. Page and click telemetry begins as users visit the newly deployed release.</div> : null}
    </section>
  );
}
