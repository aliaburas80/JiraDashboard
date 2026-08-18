import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { AdminLogoutButton } from '../../components/AdminLogoutButton';
import { ADMIN_SESSION_OPTIONS, type AdminSessionData, isFullyAuthenticatedAdminSession } from '../../lib/session';

export default async function OperationsLayout({ children }: { children: React.ReactNode }) {
  const session = await getIronSession<AdminSessionData>(await cookies(), ADMIN_SESSION_OPTIONS);
  if (!isFullyAuthenticatedAdminSession(session) || !session.userId) redirect('/login');

  const nav = [
    { href: '/', label: 'Overview' },
    { href: '/users', label: 'Users' },
    { href: '/audit', label: 'Audit' },
    { href: '/feedback', label: 'Feedback' },
    ...(session.isSuperAdmin
      ? [
          { href: '/system-errors', label: 'System Errors' },
          { href: '/diagnostics', label: 'Diagnostics' },
          { href: '/security', label: 'Security' },
          { href: '/settings', label: 'Settings' },
        ]
      : []),
  ];

  return (
    <div className="ops-layout">
      <aside className="ops-sidebar">
        <div>
          <p className="eyebrow">Delivery Clarity</p>
          <h1 className="ops-brand">Admin</h1>
          <p className="ops-identity">{session.name}<br /><span>{session.email}</span></p>
        </div>
        <nav className="ops-nav" aria-label="Admin operations">
          {nav.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <AdminLogoutButton />
      </aside>
      <main className="ops-main">{children}</main>
    </div>
  );
}
