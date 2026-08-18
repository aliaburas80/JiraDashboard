import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { prisma } from '../../../src/lib/prisma';
import {
  listOrganizationFeedback,
  listOrganizationUsers,
  organizationAuditStats,
} from '../../../src/server/tenancy/adminOperationalRepository';
import { ADMIN_SESSION_OPTIONS, type AdminSessionData } from '../../lib/session';

export default async function AdminOperationsHome() {
  const session = await getIronSession<AdminSessionData>(await cookies(), ADMIN_SESSION_OPTIONS);
  const organizationId = session.organizationId;

  if (!organizationId) {
    return (
      <section className="ops-page">
        <div className="ops-page-header">
          <p className="eyebrow">Operations</p>
          <h2>Admin Console</h2>
          <p className="muted">This administrator is not assigned to an organization yet.</p>
        </div>
      </section>
    );
  }

  const [users, audit, feedback, unresolvedErrors] = await Promise.all([
    listOrganizationUsers(organizationId),
    organizationAuditStats(organizationId),
    listOrganizationFeedback(organizationId, 50),
    session.isSuperAdmin ? prisma.systemErrorLog.count({ where: { resolvedAt: null } }) : Promise.resolve(null),
  ]);

  const activeUsers = users.filter(user => user.isActive).length;
  const pendingFeedback = feedback.filter(item => ['New', 'Reviewing'].includes(item.status)).length;

  return (
    <section className="ops-page">
      <div className="ops-page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h2>Admin Console</h2>
          <p className="muted">Operational controls now run inside the separate MFA-protected Admin application.</p>
        </div>
        <span className="status-pill">MFA protected</span>
      </div>

      <div className="ops-stat-grid">
        <article className="ops-stat"><span>Users</span><strong>{users.length}</strong><small>{activeUsers} active</small></article>
        <article className="ops-stat"><span>Audit · 24h</span><strong>{audit.last24h}</strong><small>{audit.total} total events</small></article>
        <article className="ops-stat"><span>Feedback</span><strong>{pendingFeedback}</strong><small>new or reviewing</small></article>
        {session.isSuperAdmin ? (
          <article className="ops-stat"><span>System errors</span><strong>{unresolvedErrors}</strong><small>unresolved</small></article>
        ) : (
          <article className="ops-stat"><span>Admin role</span><strong>Org</strong><small>organization-scoped access</small></article>
        )}
      </div>

      <div className="ops-panel">
        <h3>Security boundary</h3>
        <div className="ops-detail-grid">
          <div><strong>Separate runtime</strong><span>No dependency on the user-app session.</span></div>
          <div><strong>Separate session</strong><span>dc_admin_session + ADMIN_SESSION_SECRET.</span></div>
          <div><strong>MFA required</strong><span>Password-only sessions cannot reach these operations.</span></div>
          <div><strong>Tenant scoped</strong><span>Users, audit and feedback stay inside the administrator organization.</span></div>
        </div>
      </div>
    </section>
  );
}
