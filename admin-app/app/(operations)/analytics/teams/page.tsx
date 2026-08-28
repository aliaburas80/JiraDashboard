import Link from 'next/link';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ADMIN_SESSION_OPTIONS, type AdminSessionData } from '../../../../lib/session';
import {
  getOwnerAnalyticsIntelligenceData,
  type OwnerAnalyticsEvent,
} from '../../../../../src/server/tenancy/ownerAnalyticsIntelligenceRepository';
import {
  eventRoute,
  formatDateTime,
  percent,
  resolveDays,
  stageForEvents,
} from '../analyticsIntelligence';

type PageProps = { searchParams: Promise<{ days?: string | string[] }> };

function dayKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export default async function TeamAnalyticsPage({ searchParams }: PageProps) {
  const session = await getIronSession<AdminSessionData>(await cookies(), ADMIN_SESSION_OPTIONS);
  if (!session.isSuperAdmin) {
    return <section className="ops-page"><div className="ops-panel">Super-admin access required.</div></section>;
  }

  const params = await searchParams;
  const days = resolveDays(params.days);
  const since = new Date(Date.now() - days * 24 * 60 * 60_000);
  const data = await getOwnerAnalyticsIntelligenceData(since);

  const eventsByUser = new Map<string, OwnerAnalyticsEvent[]>();
  for (const event of data.events) {
    if (!event.userId) continue;
    const list = eventsByUser.get(event.userId) ?? [];
    list.push(event);
    eventsByUser.set(event.userId, list);
  }

  const importsByUser = new Map<string, number>();
  for (const item of data.imports) {
    importsByUser.set(item.userId, (importsByUser.get(item.userId) ?? 0) + 1);
  }

  const organizationRows = data.organizations.map(organization => {
    const members = data.users.filter(user => user.organizationId === organization.id);
    const activeMembers = members.filter(user => (eventsByUser.get(user.id)?.length ?? 0) > 0);
    const uploaders = members.filter(user => (importsByUser.get(user.id) ?? 0) > 0);
    const analyzed = members.filter(user => (eventsByUser.get(user.id) ?? []).some(event => event.eventName === 'analysis_completed'));
    const reporters = members.filter(user => (eventsByUser.get(user.id) ?? []).some(event => event.eventName === 'report_exported'));
    const returning = members.filter(user => {
      const events = eventsByUser.get(user.id) ?? [];
      const sessions = new Set(events.map(event => event.sessionId).filter(Boolean));
      const activeDays = new Set(events.map(event => dayKey(event.occurredAt)));
      return sessions.size > 1 || activeDays.size > 1;
    });

    const pageCounts = new Map<string, number>();
    for (const member of members) {
      for (const event of eventsByUser.get(member.id) ?? []) {
        if (event.eventName !== 'page_viewed') continue;
        const route = eventRoute(event);
        pageCounts.set(route, (pageCounts.get(route) ?? 0) + 1);
      }
    }
    const topPage = [...pageCounts.entries()].sort((a, b) => b[1] - a[1])[0];

    const memberRows = members.map(member => {
      const events = eventsByUser.get(member.id) ?? [];
      const sessions = new Set(events.map(event => event.sessionId).filter(Boolean)).size;
      const lastSeen = events[events.length - 1]?.occurredAt ?? member.lastLoginAt;
      return {
        member,
        events,
        sessions,
        uploads: importsByUser.get(member.id) ?? 0,
        stage: stageForEvents(events),
        lastSeen,
      };
    }).sort((a, b) => (b.lastSeen?.getTime() ?? 0) - (a.lastSeen?.getTime() ?? 0));

    return {
      organization,
      members,
      activeMembers,
      uploaders,
      analyzed,
      reporters,
      returning,
      topPage,
      memberRows,
    };
  }).sort((a, b) => b.activeMembers.length - a.activeMembers.length || b.members.length - a.members.length);

  const unassignedMembers = data.users.filter(user => !user.organizationId);
  const totalMembers = data.users.length;
  const totalActive = data.users.filter(user => (eventsByUser.get(user.id)?.length ?? 0) > 0).length;
  const totalUploaders = data.users.filter(user => (importsByUser.get(user.id) ?? 0) > 0).length;
  const totalAnalyzed = data.users.filter(user => (eventsByUser.get(user.id) ?? []).some(event => event.eventName === 'analysis_completed')).length;

  return (
    <section className="ops-page analytics-page">
      <div className="ops-page-header">
        <div>
          <p className="eyebrow">Adoption intelligence</p>
          <h2>Teams</h2>
          <p className="muted">See whether each organization is merely signing up or actually reaching upload, analysis, dashboard and reporting value. Expand a team to inspect every member.</p>
        </div>
      </div>

      <div className="analytics-periods" aria-label="Team analytics period">
        {[1, 7, 30, 90].map(period => (
          <Link key={period} href={`/analytics/teams?days=${period}`} className={period === days ? 'active' : ''}>{period === 1 ? '24h' : `${period} days`}</Link>
        ))}
      </div>

      <div className="analytics-stat-grid">
        <article className="ops-stat"><span>Teams</span><strong>{organizationRows.length}</strong><small>{unassignedMembers.length} users without a team</small></article>
        <article className="ops-stat"><span>Members</span><strong>{totalMembers}</strong><small>{totalActive} active in this period</small></article>
        <article className="ops-stat"><span>Team adoption</span><strong>{percent(totalActive, totalMembers)}%</strong><small>Members with product activity</small></article>
        <article className="ops-stat"><span>Upload activation</span><strong>{percent(totalUploaders, totalMembers)}%</strong><small>{totalUploaders} members uploaded data</small></article>
        <article className="ops-stat"><span>Analysis activation</span><strong>{percent(totalAnalyzed, totalMembers)}%</strong><small>{totalAnalyzed} members completed analysis</small></article>
      </div>

      <div className="ops-table-wrap">
        <table className="ops-table analytics-table">
          <thead>
            <tr><th>Team</th><th>Members</th><th>Active</th><th>Uploaders</th><th>Analyzed</th><th>Returned</th><th>Reports</th><th>Top page</th><th>Members</th></tr>
          </thead>
          <tbody>
            {organizationRows.map(row => (
              <tr key={row.organization.id}>
                <td><strong>{row.organization.name}</strong><span>{row.organization.domain}</span><small>{row.organization.status} · {row.organization.maxSeats} seats</small></td>
                <td>{row.members.length}</td>
                <td><strong>{percent(row.activeMembers.length, row.members.length)}%</strong><span>{row.activeMembers.length} members</span></td>
                <td>{row.uploaders.length}</td>
                <td>{row.analyzed.length}</td>
                <td>{row.returning.length}</td>
                <td>{row.reporters.length}</td>
                <td>{row.topPage ? <><code>{row.topPage[0]}</code><span>{row.topPage[1]} views</span></> : '—'}</td>
                <td>
                  <details>
                    <summary>View team</summary>
                    <div className="analytics-user-list">
                      {row.memberRows.map(item => (
                        <div key={item.member.id}>
                          <div><strong>{item.member.name}</strong><span>{item.member.email}</span><small>{item.member.persona || 'No persona'} · {item.member.emailVerified ? 'verified' : 'unverified'}</small></div>
                          <div><strong>{item.stage}</strong><span>{item.sessions} sessions · {item.uploads} uploads</span><small>Last seen {formatDateTime(item.lastSeen)}</small></div>
                        </div>
                      ))}
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {unassignedMembers.length ? (
        <div className="ops-panel">
          <div className="analytics-panel-heading"><div><h3>Users without an organization</h3><p className="muted">These accounts are excluded from team adoption rates by organization.</p></div></div>
          <div className="analytics-user-list">
            {unassignedMembers.map(member => {
              const events = eventsByUser.get(member.id) ?? [];
              return (
                <div key={member.id}>
                  <div><strong>{member.name}</strong><span>{member.email}</span></div>
                  <div><strong>{stageForEvents(events)}</strong><small>{events.length} tracked events · last login {formatDateTime(member.lastLoginAt)}</small></div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {organizationRows.length === 0 ? <div className="ops-panel">No organizations are available yet.</div> : null}
    </section>
  );
}
