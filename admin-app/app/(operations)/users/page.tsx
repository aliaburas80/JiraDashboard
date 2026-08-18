'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  importCount: number;
  snapshotCount: number;
};

type RoleOption = { id: string; label: string };
type ResetPreview = {
  importLogs: number;
  dashboardSnapshots: number;
  jiraConnections: number;
  reportShares: number;
  blocked: boolean;
  blockedReason?: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [meId, setMeId] = useState('');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'scrum_master' });
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null);
  const [resetPreview, setResetPreview] = useState<ResetPreview | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ops/users', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? 'Unable to load users.');
      setUsers(body.users ?? []);
      setRoles(body.roles ?? []);
      setMeId(body.meId ?? '');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(user => !q || `${user.name} ${user.email} ${user.roleLabel}`.toLowerCase().includes(q));
  }, [query, users]);

  async function createUser(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    const response = await fetch('/api/ops/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? 'Unable to create user.'); return; }
    setUsers(current => [body.user, ...current]);
    setForm({ name: '', email: '', password: '', role: 'scrum_master' });
    setCreating(false);
    setMessage(`${body.user.email} created. The user must change the temporary password on first login.`);
  }

  async function updateUser(user: ManagedUser, patch: Record<string, unknown>) {
    setError('');
    const response = await fetch('/api/ops/users', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: user.id, ...patch }),
    });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? 'Unable to update user.'); return; }
    setUsers(current => current.map(item => item.id === user.id ? body.user : item));
  }

  async function deleteUser(user: ManagedUser) {
    if (!window.confirm(`Delete ${user.email}? This removes the account and its cascaded account data.`)) return;
    const response = await fetch('/api/ops/users', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: user.id }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setError(body.error ?? 'Unable to delete user.'); return; }
    setUsers(current => current.filter(item => item.id !== user.id));
    setMessage(`${user.email} deleted.`);
  }

  async function previewReset(user: ManagedUser) {
    setResetTarget(user);
    setResetPreview(null);
    const response = await fetch(`/api/ops/users/${user.id}/reset-preview`, { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? 'Unable to preview reset.'); return; }
    setResetPreview(body.preview);
  }

  async function confirmReset() {
    if (!resetTarget || !resetPreview || resetPreview.blocked) return;
    const response = await fetch(`/api/ops/users/${resetTarget.id}/reset`, { method: 'POST' });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? 'Reset failed.'); return; }
    setUsers(current => current.map(item => item.id === resetTarget.id ? { ...item, importCount: 0, snapshotCount: 0 } : item));
    setMessage(`Workspace data reset for ${resetTarget.email}.`);
    setResetTarget(null);
    setResetPreview(null);
  }

  return (
    <section className="ops-page">
      <div className="ops-page-header">
        <div>
          <p className="eyebrow">Organization operations</p>
          <h2>Users</h2>
          <p className="muted">Create, activate, assign roles, reset workspace data and delete organization users.</p>
        </div>
        <button className="primary-button" onClick={() => setCreating(value => !value)}>{creating ? 'Cancel' : 'Create user'}</button>
      </div>

      {message ? <div className="success" role="status">{message}</div> : null}
      {error ? <div className="error" role="alert">{error}</div> : null}

      {creating ? (
        <form className="ops-panel ops-form" onSubmit={createUser}>
          <h3>Create user</h3>
          <div className="ops-form-grid">
            <label>Name<input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} required /></label>
            <label>Email<input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} required /></label>
            <label>Temporary password<input type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} required /></label>
            <label>Role<select value={form.role} onChange={event => setForm({ ...form, role: event.target.value })}>{roles.map(role => <option key={role.id} value={role.id}>{role.label}</option>)}</select></label>
          </div>
          <button className="primary-button" type="submit">Create account</button>
        </form>
      ) : null}

      <div className="ops-toolbar">
        <input aria-label="Search users" placeholder="Search users" value={query} onChange={event => setQuery(event.target.value)} />
        <span>{filtered.length} of {users.length}</span>
      </div>

      {loading ? <div className="ops-panel">Loading users…</div> : (
        <div className="ops-table-wrap">
          <table className="ops-table">
            <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Data</th><th>Last login</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong><span>{user.email}</span>{user.isSuperAdmin ? <small>Owner Admin</small> : null}</td>
                  <td>
                    <select value={user.role} disabled={user.isSuperAdmin && user.id !== meId} onChange={event => void updateUser(user, { role: event.target.value })}>
                      {user.role === 'user' ? <option value="user">User</option> : null}
                      {roles.map(role => <option key={role.id} value={role.id}>{role.label}</option>)}
                    </select>
                  </td>
                  <td><button className="text-button" disabled={user.id === meId || user.isSuperAdmin} onClick={() => void updateUser(user, { isActive: !user.isActive })}>{user.isActive ? 'Active' : 'Disabled'}</button></td>
                  <td><span>{user.importCount} imports</span><span>{user.snapshotCount} snapshots</span></td>
                  <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</td>
                  <td className="ops-actions">
                    <button className="secondary-button" disabled={user.isSuperAdmin} onClick={() => void previewReset(user)}>Reset data</button>
                    <button className="danger-button" disabled={user.id === meId || user.isSuperAdmin} onClick={() => void deleteUser(user)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {resetTarget ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="reset-title">
            <h3 id="reset-title">Reset workspace data</h3>
            <p>{resetTarget.email}</p>
            {!resetPreview ? <p>Loading preview…</p> : resetPreview.blocked ? (
              <div className="error">{resetPreview.blockedReason}</div>
            ) : (
              <ul className="ops-list">
                <li>{resetPreview.importLogs} import logs</li>
                <li>{resetPreview.dashboardSnapshots} snapshots</li>
                <li>{resetPreview.jiraConnections} Jira connections</li>
                <li>{resetPreview.reportShares} report shares</li>
              </ul>
            )}
            <div className="ops-actions">
              <button className="secondary-button" onClick={() => { setResetTarget(null); setResetPreview(null); }}>Cancel</button>
              <button className="danger-button" disabled={!resetPreview || resetPreview.blocked} onClick={() => void confirmReset()}>Confirm reset</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
