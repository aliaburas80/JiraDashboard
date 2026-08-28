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
  eventRoute,
  formatDateTime,
  formatDuration,
  isFailureEvent,
  isMeaningfulJourneyAction,
  journeyOutcome,
  measuredEngagementMs,
  pageDisplayName,
  percent,
  resolveDays,
  stageForEvents,
  type JourneyOutcome,
} from '../analyticsIntelligence';

type PageProps = { searchParams: Promise<{ days?: string | string[] }> };

type FlowPageVisit = {
  route: string;
  firstAt: Date;
  lastAt: Date;
  durationMs: number;
  actions: OwnerAnalyticsEvent[];
  failures: OwnerAnalyticsEvent[];
  outcome: JourneyOutcome;
};

type FlowSession = {
  key: string;
  firstAt: Date;
  lastAt: Date;
  durationMs: number;
  pageVisits: FlowPageVisit[];
};

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

function journeyRelevantEvent(event: OwnerAnalyticsEvent): boolean {
  return event.eventName === 'page_viewed'
    || event.eventName === 'page_engaged'
    || isMeaningfulJourneyAction(event);
}

function buildPageVisit(events: OwnerAnalyticsEvent[]): FlowPageVisit {
  const ordered = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const actions = ordered.filter(isMeaningfulJourneyAction);
  const failures = ordered.filter(isFailureEvent);
  return {
    route: eventRoute(ordered[0]),
    firstAt: ordered[0].occurredAt,
    lastAt: ordered[ordered.length - 1].occurredAt,
    durationMs: measuredEngagementMs(ordered),
    actions,
    failures,
    outcome: journeyOutcome(ordered),
  };
}

function buildSession(key: string, events: OwnerAnalyticsEvent[]): FlowSession {
  const ordered = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const pageGroups: OwnerAnalyticsEvent[][] = [];

  for (const event of ordered) {
    const route = eventRoute(event);
    const current = pageGroups[pageGroups.length - 1];
    if (!current || eventRoute(current[0]) !== route) {
      pageGroups.push([event]);
    } else {
      current.push(event);
    }
  }

  return {
    key,
    firstAt: ordered[0].occurredAt,
    lastAt: ordered[ordered.length - 1].occurredAt,
    durationMs: measuredEngagementMs(ordered),
    pageVisits: pageGroups.map(buildPageVisit),
  };
}

function groupFlowBySession(events: OwnerAnalyticsEvent[]): FlowSession[] {
  const ordered = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const sessions: Array<{ key: string; events: OwnerAnalyticsEvent[] }> = [];

  for (const event of ordered) {
    const key = event.sessionId || `unattributed:${dayKey(event.occurredAt)}`;
    const current = sessions[sessions.length - 1];
    if (!current || current.key !== key) sessions.push({ key, events: [event] });
    else current.events.push(event);
  }

  return sessions.map(session => buildSession(session.key, session.events));
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

  const latestConsent = new Map<string, boolean>();
  for (const consent of data.analyticsConsents) latestConsent.set(consent.userId, consent.granted);

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

  const trackedRows = [...grouped.entries()].map(([key, events]) => {
    const orderedEvents = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    const userId = key.startsWith('user:') ? key.slice(5) : null;
    const user = userId ? usersById.get(userId) : undefined;
    const sessions = new Set(orderedEvents.map(event => event.sessionId).filter((value): value is string => Boolean(value)));
    const activeDays = new Set(orderedEvents.map(event => dayKey(event.occurredAt)));
    const pageViewEvents = orderedEvents.filter(event => event.eventName === 'page_viewed');
    const pageViews = pageViewEvents.length;
    const uniquePages = new Set(pageViewEvents.map(eventRoute)).size;
    const meaningfulActions = orderedEvents.filter(isMeaningfulJourneyAction).length;
    const failures = orderedEvents.filter(isFailureEvent).length;
    const firstSeen = orderedEvents[0]?.occurredAt ?? null;
    const lastSeen = orderedEvents[orderedEvents.length - 1]?.occurredAt ?? null;
    const journeyEvents = orderedEvents.filter(journeyRelevantEvent).slice(-300);
    const sessionFlow = groupFlowBySession(journeyEvents);
    const returned = sessions.size > 1 || activeDays.size > 1;
    const imports = userId ? importsByUser.get(userId) ?? 0 : 0;

    return {
      key,
      user,
      userId,
      tracked: true,
      trackingStatus: 'Behavior tracked',
      sessions: sessions.size,
      activeDays: activeDays.size,
      pageViews,
      uniquePages,
      meaningfulActions,
      failures,
      firstSeen,
      lastSeen,
      returned,
      imports,
      stage: stageForEvents(orderedEvents),
      sessionFlow,
    };
  });

  const trackedUserIds = new Set(
    trackedRows.map(row => row.userId).filter((value): value is string => Boolean(value)),
  );

  const untrackedRows = data.users
    .filter(user => !trackedUserIds.has(user.id))
    .filter(user => user.createdAt >= since || (user.lastLoginAt !== null && user.lastLoginAt >= since) || (importsByUser.get(user.id) ?? 0) > 0)
    .map(user => {
      const imports = importsByUser.get(user.id) ?? 0;
      const decision = latestConsent.get(user.id);
      const trackingStatus = decision === true
        ? 'Consent granted · awaiting events'
        : decision === false
          ? 'Analytics off'
          : 'No analytics decision';
      return {
        key: `known:${user.id}`,
        user,
        userId: user.id,
        tracked: false,
        trackingStatus,
        sessions: 0,
        activeDays: 0,
        pageViews: 0,
        uniquePages: 0,
        meaningfulActions: 0,
        failures: 0,
        firstSeen: null,
        lastSeen: user.lastLoginAt ?? user.createdAt,
        returned: false,
        imports,
        stage: imports > 0 ? 'Upload' : 'Registered',
        sessionFlow: [] as FlowSession[],
      };
    });

  const rows = [...trackedRows, ...untrackedRows]
    .sort((a, b) => (b.lastSeen?.getTime() ?? 0) - (a.lastSeen?.getTime() ?? 0));

  const trackedRegistered = trackedRows.filter(row => Boolean(row.user)).length;
  const anonymous = trackedRows.length - trackedRegistered;
  const returning = trackedRows.filter(row => row.returned).length;
  const knownAccountsInPeriod = rows.filter(row => Boolean(row.user)).length;
  const activatedAccounts = rows.filter(row => Boolean(row.user) && (row.imports > 0 || ['Analysis', 'Dashboard', 'Report'].includes(row.stage))).length;
  const withFriction = trackedRows.filter(row => row.failures > 0).length;
  const grantedAccounts = [...latestConsent.values()].filter(Boolean).length;
  const decidedAccounts = latestConsent.size;

  return (
    <section className="ops-page analytics-page">
      <div className="ops-page-header">
        <div>
          <p className="eyebrow">Behavior intelligence</p>
          <h2>User Flows</h2>
          <p className="muted">Use this view to understand what each consented user actually did: pages visited, meaningful product actions, time spent and friction. Low-value telemetry such as raw surface clicks and scroll depth is intentionally hidden from the journey.</p>
        </div>
      </div>

      <div className="analytics-periods" aria-label="User-flow period">
        {[1, 7, 30, 90].map(period => (
          <Link key={period} href={`/analytics/users?days=${period}`} className={period === days ? 'active' : ''}>{period === 1 ? '24h' : `${period} days`}</Link>
        ))}
      </div>

      <div className="analytics-stat-grid">
        <article className="ops-stat"><span>Tracked visitors</span><strong>{trackedRows.length}</strong><small>{trackedRegistered} registered · {anonymous} anonymous · {data.users.length ? percent(trackedRegistered, data.users.length) : 0}% account coverage</small></article>
        <article className="ops-stat"><span>Returning</span><strong>{percent(returning, trackedRows.length)}%</strong><small>{returning} consented visitors returned</small></article>
        <article className="ops-stat"><span>Activated accounts</span><strong>{percent(activatedAccounts, knownAccountsInPeriod)}%</strong><small>{activatedAccounts} of {knownAccountsInPeriod} known accounts uploaded or beyond</small></article>
        <article className="ops-stat"><span>Users with friction</span><strong>{withFriction}</strong><small>Errors, failed steps, dead clicks or rage clicks</small></article>
      </div>

      {decidedAccounts === 0 ? (
        <div className="analytics-note status-warn">Analytics collection is installed, but no signed-in account has made an analytics choice yet. The app prompts visitors explicitly; behavioral rows begin filling only after opt-in. Operational user and upload rows below do not depend on behavioral consent.</div>
      ) : (
        <div className="analytics-note">Analytics consent coverage: <strong>{grantedAccounts}</strong> granted · <strong>{decidedAccounts - grantedAccounts}</strong> declined · <strong>{Math.max(0, data.users.length - decidedAccounts)}</strong> not decided.</div>
      )}

      {data.eventCount > data.events.length ? (
        <div className="analytics-note status-warn">This period contains more than the detailed event sample limit. The table reflects the first {data.events.length.toLocaleString()} events in the selected period.</div>
      ) : null}

      <div className="ops-table-wrap">
        <table className="ops-table analytics-table analytics-user-flow-table">
          <thead>
            <tr><th>User / visitor</th><th>Stage</th><th>Sessions</th><th>Page visits</th><th>Actions</th><th>Uploads</th><th>Friction</th><th>Last seen</th><th>Journey</th></tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key}>
                <td>
                  <strong>{row.user?.name ?? 'Anonymous visitor'}</strong>
                  <span>{row.user?.email ?? `${row.key.slice(0, 24)}…`}</span>
                  <small>{row.user?.persona || `${row.activeDays} active day${row.activeDays === 1 ? '' : 's'}`}</small>
                </td>
                <td><strong>{row.stage}</strong><span>{row.tracked ? (row.returned ? 'Returning · tracked' : 'New / one-session · tracked') : row.trackingStatus}</span></td>
                <td>{row.sessions || '—'}</td>
                <td>
                  <strong>{row.pageViews || '—'}</strong>
                  {row.pageViews ? <small>{row.uniquePages} unique</small> : null}
                </td>
                <td>{row.meaningfulActions || '—'}</td>
                <td>{row.imports || '—'}</td>
                <td>{row.failures || '—'}</td>
                <td>{formatDateTime(row.lastSeen)}</td>
                <td>
                  {row.tracked ? (
                    <details className="analytics-journey-details">
                      <summary>View journey</summary>
                      <small>First tracked {formatDateTime(row.firstSeen)}</small>
                      {row.sessionFlow.length ? (
                        <div className="analytics-session-list">
                          {row.sessionFlow.map((flow, sessionIndex) => (
                            <section className="analytics-session-block" key={`${flow.key}-${flow.firstAt.toISOString()}-${sessionIndex}`}>
                              <div className="analytics-session-heading">
                                <div>
                                  <strong>Session {sessionIndex + 1}</strong>
                                  <span>{formatDateTime(flow.firstAt)} → {formatDateTime(flow.lastAt)}</span>
                                </div>
                                <small>{flow.pageVisits.length} page visit{flow.pageVisits.length === 1 ? '' : 's'} · {formatDuration(flow.durationMs)}</small>
                              </div>
                              <div className="ops-table-wrap">
                                <table className="ops-table analytics-journey-table">
                                  <thead>
                                    <tr><th>Page</th><th>Arrived</th><th>Time</th><th>Meaningful actions</th><th>Outcome</th></tr>
                                  </thead>
                                  <tbody>
                                    {flow.pageVisits.map((visit, visitIndex) => (
                                      <tr key={`${visit.route}-${visit.firstAt.toISOString()}-${visitIndex}`}>
                                        <td>
                                          <strong>{pageDisplayName(visit.route)}</strong>
                                          <code>{visit.route}</code>
                                        </td>
                                        <td>{formatDateTime(visit.firstAt)}</td>
                                        <td>{formatDuration(visit.durationMs)}</td>
                                        <td>
                                          {visit.actions.length ? (
                                            <ul className="analytics-action-list">
                                              {visit.actions.map((event, actionIndex) => (
                                                <li key={`${event.occurredAt.toISOString()}-${event.eventName}-${actionIndex}`}>
                                                  <span>{formatDateTime(event.occurredAt)}</span>
                                                  <strong>{eventLabel(event)}</strong>
                                                  {isFailureEvent(event) ? <em>Friction</em> : null}
                                                </li>
                                              ))}
                                            </ul>
                                          ) : <span className="muted">Viewed page; no meaningful action recorded.</span>}
                                        </td>
                                        <td>
                                          <span className={`analytics-outcome analytics-outcome-${visit.outcome.kind}`}>{visit.outcome.label}</span>
                                          {visit.failures.length ? <small>{visit.failures.length} friction event{visit.failures.length === 1 ? '' : 's'}</small> : null}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </section>
                          ))}
                        </div>
                      ) : <p className="muted">No meaningful journey events yet.</p>}
                    </details>
                  ) : <span className="muted">Behavior not tracked</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? <div className="ops-panel">No accounts, uploads or consented user-flow events were recorded in this period.</div> : null}
    </section>
  );
}
