import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { AdminLogoutButton } from '../components/AdminLogoutButton';
import { ADMIN_SESSION_OPTIONS, type AdminSessionData } from '../lib/session';

export default async function AdminHomePage() {
  const session = await getIronSession<AdminSessionData>(await cookies(), ADMIN_SESSION_OPTIONS);
  if (!session.isLoggedIn || !session.userId) redirect('/login');

  return (
    <main className="admin-shell">
      <section className="admin-card" aria-labelledby="admin-home-title">
        <div className="admin-header">
          <div>
            <p className="eyebrow">Delivery Clarity</p>
            <h1 id="admin-home-title">Admin Console</h1>
            <p className="muted">Signed in as {session.name} · {session.email}</p>
          </div>
          <AdminLogoutButton />
        </div>

        <p>
          The separate administration runtime is active. Operational admin modules will be moved into this boundary in the next admin packet.
        </p>

        <div className="boundary-grid" aria-label="Admin security boundary status">
          <div className="boundary-item">
            <strong>Separate runtime</strong>
            <span>Runs independently from the user-facing Next.js application.</span>
          </div>
          <div className="boundary-item">
            <strong>Separate session</strong>
            <span>Uses the dedicated dc_admin_session cookie and ADMIN_SESSION_SECRET.</span>
          </div>
          <div className="boundary-item">
            <strong>Admin-only login</strong>
            <span>Only active database users with the admin role can establish this session.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
