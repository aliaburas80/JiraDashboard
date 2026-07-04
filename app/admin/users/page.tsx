// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';
import { ASSIGNABLE_ROLES, roleLabel, type AppRole } from '@/lib/roles';
import type { ManagedUser } from '@/lib/adminConsole';
import styles from './page.module.scss';

const ALL_ROLES: AppRole[] = ['admin', 'scrum_master', 'product_owner', 'manager', 'c_level', 'user'];

interface CreateForm { name: string; email: string; password: string; role: AppRole }
const EMPTY_FORM: CreateForm = { name: '', email: '', password: '', role: 'user' };

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers]           = useState<ManagedUser[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [query, setQuery]           = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState<CreateForm>(EMPTY_FORM);
  const [formErr, setFormErr]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<ManagedUser | null>(null);
  const [meId, setMeId]             = useState('');
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkRole, setBulkRole]             = useState<AppRole>('user');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const loadUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users');
    if (!res.ok) throw new Error('Failed to load users');
    const data = await res.json();
    setUsers(data.users ?? []);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (!me || me.role !== 'admin') { router.replace('/dashboard'); return null; }
        setMeId(me.id ?? '');
        return loadUsers();
      })
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  }, [router, loadUsers]);

  const filtered = users.filter(u => {
    const q = query.trim().toLowerCase();
    const matchQ = !q || `${u.name} ${u.email}`.toLowerCase().includes(q);
    const matchR = roleFilter === 'all' || u.role === roleFilter;
    return matchQ && matchR;
  });

  const selectableFiltered = filtered.filter(u => u.id !== meId);
  const allSelected = selectableFiltered.length > 0 && selectableFiltered.every(u => selectedIds.has(u.id));
  const someSelected = selectedIds.size > 0;

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableFiltered.map(u => u.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function bulkDelete() {
    setBulkProcessing(true);
    const ids = [...selectedIds];
    try {
      for (const id of ids) {
        await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      }
      setUsers(prev => prev.filter(u => !ids.includes(u.id)));
      setSelectedIds(new Set());
      setConfirmBulkDelete(false);
      setSuccessMsg(`✅ ${ids.length} user${ids.length > 1 ? 's' : ''} deleted.`);
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setBulkProcessing(false); }
  }

  async function bulkChangeRole() {
    setBulkProcessing(true);
    const ids = [...selectedIds];
    try {
      for (const id of ids) {
        await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, role: bulkRole }) });
      }
      setUsers(prev => prev.map(u => ids.includes(u.id) ? { ...u, role: bulkRole, roleLabel: roleLabel(bulkRole) } : u));
      setSelectedIds(new Set());
      setSuccessMsg(`✅ Role updated to "${roleLabel(bulkRole)}" for ${ids.length} user${ids.length > 1 ? 's' : ''}.`);
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setBulkProcessing(false); }
  }

  async function changeRole(user: ManagedUser, role: AppRole) {
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role, roleLabel: roleLabel(role) } : u));
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: user.id, role }) });
  }

  async function toggleActive(user: ManagedUser) {
    if (user.id === meId) return;
    const next = !user.isActive;
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: next } : u));
    await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: user.id, isActive: next }) });
  }

  async function deleteUser() {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: confirmDelete.id }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Delete failed'); }
      setUsers(prev => prev.filter(u => u.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setFormErr('');
    if (!form.name.trim() || !form.email.trim() || !form.password) { setFormErr('All fields are required.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Create failed');
      setUsers(prev => [data.user, ...prev]);
      setForm(EMPTY_FORM);
      setShowCreate(false);
      setSuccessMsg(
        data.emailSent
          ? `✅ ${data.user.name} created — welcome email sent to ${data.user.email}.`
          : `✅ ${data.user.name} created. No email sent — configure SMTP in Admin → Settings.`,
      );
    } catch (e: unknown) { setFormErr((e as Error).message); }
    finally { setSaving(false); }
  }

  const total  = users.length;
  const active = users.filter(u => u.isActive).length;
  const admins = users.filter(u => u.role === 'admin').length;

  const stats = [
    { icon: 'people',        label: 'Total Users', value: String(total),                note: 'All accounts',        toneStyle: { background: 'rgba(255,255,255,0.06)', color: '#F2F2F2' } },
    { icon: 'shield',        label: 'Active',      value: String(active),               note: total ? `${Math.round((active/total)*100)}% of total` : '—', toneStyle: { background: 'rgba(34,197,94,0.12)', color: '#22C55E' } },
    { icon: 'priorityHigh',  label: 'Admins',      value: String(admins),               note: total ? `${Math.round((admins/total)*100)}% of total` : '—', toneStyle: { background: 'rgba(248,113,113,0.12)', color: '#F87171' } },
    { icon: 'teams',         label: 'Role Types',  value: String(ASSIGNABLE_ROLES.length), note: 'Assignable roles', toneStyle: { background: 'rgba(255,255,255,0.06)', color: '#94A3B8' } },
  ];

  if (loading) return (
    <div className={styles.loading}>Loading users…</div>
  );

  return (
    <AdminConsoleLayout
      title="User Management"
      description="Manage accounts, roles, and access for all users in the system."
      stats={stats}
      statusLabel={`${active} active`}
      actions={
        <button
          type="button"
          className={styles.addUserBtn}
          onClick={() => { setShowCreate(true); setFormErr(''); setForm(EMPTY_FORM); }}
        >
          + Add User
        </button>
      }
    >
      {/* ── Success / error banners ── */}
      {successMsg && (
        <div className={styles.successBanner}>
          <span>{successMsg}</span>
          <button
            type="button"
            className={styles.dismissBtn}
            onClick={() => setSuccessMsg('')}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      {error && (
        <div className={styles.errorBanner}>{error}</div>
      )}

      {/* ── Create user form ── */}
      {showCreate && (
        <div className={styles.createForm}>
          <p className={styles.formTitle}>New User</p>
          <form onSubmit={createUser}>
            <div className={styles.formGrid}>
              {([['name', 'Name', 'text'], ['email', 'Email', 'email'], ['password', 'Temporary password', 'password']] as [keyof CreateForm, string, string][]).map(([field, label, type]) => (
                <div key={field}>
                  <label className={styles.fieldLabel}>{label}</label>
                  <input
                    type={type}
                    value={form[field] as string}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    required
                    className={styles.formInput}
                  />
                </div>
              ))}
              <div>
                <label className={styles.fieldLabel}>Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as AppRole }))}
                  className={styles.formSelect}
                >
                  {ALL_ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
              </div>
            </div>
            {formErr && <p className={styles.formError}>{formErr}</p>}
            <div className={styles.formActions}>
              <button type="submit" disabled={saving} className={styles.submitBtn}>
                {saving ? 'Creating…' : 'Create User'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className={styles.cancelBtn}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Filters ── */}
      <div className={styles.filterRow}>
        <input
          type="search"
          placeholder="Search name or email…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as AppRole | 'all')}
          className={styles.roleSelect}
        >
          <option value="all">All Roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
        </select>
        <span className={styles.countLabel}>{filtered.length} of {total} users</span>
      </div>

      {/* ── Bulk action bar ── */}
      {someSelected && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{selectedIds.size} selected</span>
          <div className={styles.bulkActions}>
            <select
              value={bulkRole}
              onChange={e => setBulkRole(e.target.value as AppRole)}
              className={styles.bulkRoleSelect}
            >
              {ALL_ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
            </select>
            <button
              type="button"
              onClick={bulkChangeRole}
              disabled={bulkProcessing}
              className={styles.applyRoleBtn}
            >
              {bulkProcessing ? 'Applying…' : 'Apply Role'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmBulkDelete(true)}
              disabled={bulkProcessing}
              className={styles.deleteSelectedBtn}
            >
              Delete Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className={styles.clearBtn}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── User table ── */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.theadRow}>
              <th className={styles.checkboxTh}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={toggleSelectAll}
                  aria-label="Select all users"
                  className={styles.checkboxInput}
                />
              </th>
              {['User', 'Role', 'Status', 'Imports', 'Last Login', 'Actions'].map(h => (
                <th key={h} className={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.noResults}>No users found.</td>
              </tr>
            )}
            {filtered.map(user => {
              const isSelf = user.id === meId;
              return (
                // data-role drives --role-color via SCSS (Rule 12 / Rule 8)
                <tr key={user.id} className={styles.row} data-role={user.role}>
                  {/* Checkbox */}
                  <td className={styles.checkboxCell}>
                    {!isSelf && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        aria-label={`Select ${user.name}`}
                        className={styles.checkboxInput}
                      />
                    )}
                  </td>

                  {/* User cell */}
                  <td className={styles.td}>
                    <div className={styles.userCell}>
                      <div className={styles.avatar}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.userName}>
                          {user.name}
                          {isSelf && <span className={styles.selfBadge}>you</span>}
                        </div>
                        <div className={styles.userEmail}>{user.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role dropdown — inherits --role-color from .row[data-role] */}
                  <td className={styles.td}>
                    <select
                      value={user.role}
                      onChange={e => changeRole(user, e.target.value as AppRole)}
                      disabled={isSelf}
                      className={styles.roleDropdown}
                    >
                      {ALL_ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                    </select>
                  </td>

                  {/* Active toggle chip — data-active drives colour via SCSS */}
                  <td className={styles.td}>
                    <button
                      type="button"
                      onClick={() => toggleActive(user)}
                      disabled={isSelf}
                      data-active={String(user.isActive)}
                      className={styles.activeToggle}
                    >
                      <span className={styles.statusDot} />
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>

                  {/* Import count */}
                  <td className={styles.td}>
                    <span className={styles.importCount}>{user.importCount ?? 0}</span>
                  </td>

                  {/* Last login */}
                  <td className={styles.td}>
                    <span className={styles.loginDate}>
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
                        : '—'}
                    </span>
                  </td>

                  {/* Delete */}
                  <td className={styles.td}>
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(user)}
                        className={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Bulk delete confirmation modal ── */}
      {confirmBulkDelete && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmModal}>
            <p className={styles.confirmTitle}>
              Delete {selectedIds.size} user{selectedIds.size > 1 ? 's' : ''}?
            </p>
            <p className={styles.confirmText}>
              This will permanently delete{' '}
              <strong>{selectedIds.size} account{selectedIds.size > 1 ? 's' : ''}</strong>{' '}
              and all their data. This cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                onClick={bulkDelete}
                disabled={bulkProcessing}
                className={styles.confirmDelete}
              >
                {bulkProcessing ? 'Deleting…' : `Yes, delete ${selectedIds.size}`}
              </button>
              <button
                type="button"
                onClick={() => setConfirmBulkDelete(false)}
                className={styles.confirmCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Single-user delete confirmation modal ── */}
      {confirmDelete && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmModal}>
            <p className={styles.confirmTitle}>Delete user?</p>
            <p className={styles.confirmText}>
              This will permanently delete{' '}
              <strong>{confirmDelete.name}</strong> ({confirmDelete.email}) and all their data.
              This cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                onClick={deleteUser}
                disabled={saving}
                className={styles.confirmDelete}
              >
                {saving ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className={styles.confirmCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminConsoleLayout>
  );
}
