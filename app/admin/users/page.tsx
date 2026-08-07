// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';
import LoadingState from '@/components/ui/LoadingState';
import { ASSIGNABLE_ROLES, roleLabel, type AppRole } from '@/lib/roles';
import type { ManagedUser } from '@/lib/adminConsole';
import { paginate } from '@/lib/pagination';
import styles from './page.module.scss';

// MPE-02: /api/admin/users returns the full user list with no server-side
// limit — realistically bounded by organization headcount, so a client-side
// page slice resolves the missing-pagination finding without a riskier API change.
const PAGE_SIZE = 25;

// Includes 'user' — needed for the role FILTER dropdown and each row's role
// select, which must be able to represent existing self-registered accounts
// (role: 'user'). Assigning 'user' is intentionally excluded from the Create
// User form and bulk role-change select below (use ASSIGNABLE_ROLES there) —
// self-registration is the only path that ever creates a 'user'-role account.
const ALL_ROLES: AppRole[] = ['admin', 'scrum_master', 'product_owner', 'manager', 'c_level', 'user'];

interface CreateForm { name: string; email: string; password: string; role: AppRole }
const EMPTY_FORM: CreateForm = { name: '', email: '', password: '', role: 'scrum_master' };

// EP-023: internal @deliveryclarity.app accounts are never eligible for the
// workspace-data reset tool — enforced again server-side in userReset.service.ts,
// this is just so the button never appears for them in the first place.
const INTERNAL_EMAIL_DOMAIN = '@deliveryclarity.app';
function isInternalUser(email: string): boolean {
  return email.toLowerCase().endsWith(INTERNAL_EMAIL_DOMAIN);
}

interface ResetPreview {
  userId: string; email: string;
  importLogs: number; dashboardSnapshots: number; jiraConnections: number;
  hasScopedMetricsFile: boolean; blocked: boolean; blockedReason?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers]           = useState<ManagedUser[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [query, setQuery]           = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all');
  const [page, setPage]             = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState<CreateForm>(EMPTY_FORM);
  const [formErr, setFormErr]       = useState('');
  const [saving, setSaving]         = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<ManagedUser | null>(null);
  const [meId, setMeId]             = useState('');
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkRole, setBulkRole]             = useState<AppRole>('scrum_master');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // EP-023: manual, admin-triggered workspace-data reset for non-internal users.
  const [resetTarget, setResetTarget]           = useState<ManagedUser | null>(null);
  const [resetPreview, setResetPreview]         = useState<ResetPreview | null>(null);
  const [resetPreviewLoading, setResetPreviewLoading] = useState(false);
  const [resetConfirming, setResetConfirming]   = useState(false);
  const [resetError, setResetError]             = useState('');

  // Bulk "reset all external users" — separate from the bulk role/delete bar
  // above since domain-eligibility is the selection criteria here, not role.
  const [showBulkReset, setShowBulkReset]           = useState(false);
  const [bulkResetSelected, setBulkResetSelected]   = useState<Set<string>>(new Set());
  const [bulkResetPreviews, setBulkResetPreviews]   = useState<Record<string, ResetPreview>>({});
  const [bulkResetLoading, setBulkResetLoading]     = useState(false);
  const [bulkResetConfirming, setBulkResetConfirming] = useState(false);
  const [bulkResetConfirmStep, setBulkResetConfirmStep] = useState(false);

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

  // MPE-02: bulk selection ("select all") still operates on every filtered
  // user, not just the visible page — an admin bulk-changing roles across a
  // large filtered set shouldn't have to revisit every page to select them all.
  const { items: pageUsers, page: safePage, totalPages } = paginate(filtered, page, PAGE_SIZE);

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

  // ── EP-023: single-user workspace-data reset — dry-run, then confirm ───────

  async function openResetPreview(user: ManagedUser) {
    setResetTarget(user);
    setResetPreview(null);
    setResetError('');
    setResetPreviewLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-preview`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load reset preview.');
      setResetPreview(data.preview);
    } catch (e: unknown) {
      setResetError((e as Error).message);
    } finally {
      setResetPreviewLoading(false);
    }
  }

  async function confirmReset() {
    if (!resetTarget) return;
    setResetConfirming(true);
    try {
      const res = await fetch(`/api/admin/users/${resetTarget.id}/reset`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Reset failed.');
      setUsers(prev => prev.map(u => u.id === resetTarget.id ? { ...u, importCount: 0 } : u));
      setSuccessMsg(`✅ Workspace data reset for ${resetTarget.email}: ${data.importLogsDeleted} import logs, ${data.snapshotsDeleted} snapshots, ${data.jiraConnectionsDeleted} Jira connections deleted.`);
      setResetTarget(null);
      setResetPreview(null);
    } catch (e: unknown) {
      setResetError((e as Error).message);
    } finally {
      setResetConfirming(false);
    }
  }

  // ── EP-023: bulk "reset all external users" — dry-run every selected user first ──

  const externalUsers = users.filter(u => !isInternalUser(u.email));

  function toggleBulkResetSelect(id: string) {
    setBulkResetSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function loadBulkResetPreviews() {
    setBulkResetLoading(true);
    setResetError('');
    try {
      const entries = await Promise.all([...bulkResetSelected].map(async id => {
        const res = await fetch(`/api/admin/users/${id}/reset-preview`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Failed to preview ${id}.`);
        return [id, data.preview as ResetPreview] as const;
      }));
      setBulkResetPreviews(Object.fromEntries(entries));
      setBulkResetConfirmStep(true);
    } catch (e: unknown) {
      setResetError((e as Error).message);
    } finally {
      setBulkResetLoading(false);
    }
  }

  async function confirmBulkReset() {
    setBulkResetConfirming(true);
    const ids = [...bulkResetSelected];
    let totalLogs = 0, totalSnaps = 0, totalConns = 0, failed = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`/api/admin/users/${id}/reset`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) { failed++; continue; }
        totalLogs += data.importLogsDeleted ?? 0;
        totalSnaps += data.snapshotsDeleted ?? 0;
        totalConns += data.jiraConnectionsDeleted ?? 0;
      } catch { failed++; }
    }
    setUsers(prev => prev.map(u => ids.includes(u.id) ? { ...u, importCount: 0 } : u));
    setSuccessMsg(
      `✅ Reset ${ids.length - failed} of ${ids.length} user${ids.length !== 1 ? 's' : ''}: `
      + `${totalLogs} import logs, ${totalSnaps} snapshots, ${totalConns} Jira connections deleted.`
      + (failed > 0 ? ` ${failed} failed.` : ''),
    );
    setBulkResetSelected(new Set());
    setBulkResetPreviews({});
    setBulkResetConfirmStep(false);
    setShowBulkReset(false);
    setBulkResetConfirming(false);
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
          : `✅ ${data.user.name} created. Email not sent — ${data.emailError ?? 'the email provider is not configured.'}`,
      );
    } catch (e: unknown) { setFormErr((e as Error).message); }
    finally { setSaving(false); }
  }

  const total  = users.length;
  const active = users.filter(u => u.isActive).length;
  const admins = users.filter(u => u.role === 'admin').length;

  const stats = [
    { icon: 'people',        label: 'Total Users', value: String(total),                note: 'All accounts',        toneStyle: { background: 'var(--color-subtle, #f1f5f9)', color: 'var(--color-text-secondary, #64748b)' } },
    { icon: 'shield',        label: 'Active',      value: String(active),               note: total ? `${Math.round((active/total)*100)}% of total` : '—', toneStyle: { background: 'var(--color-success-soft, #e8f5ef)', color: 'var(--color-success, #268a5a)' } },
    { icon: 'priorityHigh',  label: 'Admins',      value: String(admins),               note: total ? `${Math.round((admins/total)*100)}% of total` : '—', toneStyle: { background: 'var(--color-warning-soft, #fdf3e3)', color: 'var(--color-warning, #c57a18)' } },
    { icon: 'teams',         label: 'Role Types',  value: String(ASSIGNABLE_ROLES.length), note: 'Assignable roles', toneStyle: { background: 'var(--color-subtle, #f1f5f9)', color: 'var(--color-text-muted, #94a3b8)' } },
  ];

  if (loading) return <LoadingState message="Loading users…" />;

  return (
    <AdminConsoleLayout
      title="User Management"
      description="Manage accounts, roles, and access for all users in the system."
      headerId="tour-header-admin-users"
      stats={stats}
      statusLabel={`${active} active`}
      actions={
        <div className="flex items-center gap-2">
          {externalUsers.length > 0 && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => { setShowBulkReset(true); setBulkResetSelected(new Set()); setBulkResetConfirmStep(false); setResetError(''); }}
            >
              Reset external users&apos; data
            </button>
          )}
          <button
            type="button"
            className={styles.addUserBtn}
            onClick={() => { setShowCreate(true); setFormErr(''); setForm(EMPTY_FORM); }}
          >
            + Add User
          </button>
        </div>
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
                  {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
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
      <div id="tour-section-admin-users-1" className={styles.filterRow}>
        <input
          type="search"
          placeholder="Search name or email…"
          aria-label="Search users by name or email"
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1); }}
          className={styles.searchInput}
        />
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value as AppRole | 'all'); setPage(1); }}
          aria-label="Filter users by role"
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
              {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
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
            <tr id="tour-section-admin-users-2" className={styles.theadRow}>
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
            {pageUsers.map(user => {
              const isSelf = user.id === meId;
              // A super-admin can only be modified by themselves — anyone else viewing
              // this row gets the same locked-down controls as viewing their own row.
              const isLocked = isSelf || user.isSuperAdmin;
              return (
                // data-role drives --role-color via SCSS (Rule 12 / Rule 8)
                <tr key={user.id} className={styles.row} data-role={user.role}>
                  {/* Checkbox */}
                  <td className={styles.checkboxCell}>
                    {!isLocked && (
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
                          {user.isSuperAdmin && <span className={styles.superAdminBadge}>Super Admin</span>}
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
                      disabled={isLocked}
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
                      disabled={isLocked}
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

                  {/* Delete + EP-023 workspace-data reset */}
                  <td className={styles.td}>
                    <div className="flex items-center gap-2">
                      {!isLocked && (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(user)}
                          className={styles.deleteBtn}
                        >
                          Delete
                        </button>
                      )}
                      {!isInternalUser(user.email) && (
                        <button
                          type="button"
                          onClick={() => openResetPreview(user)}
                          className="btn-secondary btn-sm"
                          title="Reset this user's uploaded workspace data — never their account"
                        >
                          Reset data
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button type="button" className={styles.pageBtn} onClick={() => setPage(safePage - 1)} disabled={safePage <= 1}>← Prev</button>
            <span className={styles.pageInfo}>Page {safePage} of {totalPages}</span>
            <button type="button" className={styles.pageBtn} onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages}>Next →</button>
          </div>
        )}
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

      {/* ── EP-023: single-user workspace-data reset — dry-run preview, then confirm ── */}
      {resetTarget && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmModal}>
            <p className={styles.confirmTitle}>Reset workspace data?</p>
            <p className={styles.confirmText}>
              This resets <strong>{resetTarget.name}</strong> ({resetTarget.email}) back to an
              empty workspace. Their account, login, and role are not affected — only their
              uploaded Jira data.
            </p>
            {resetPreviewLoading && <p className={styles.confirmText}>Loading preview…</p>}
            {resetError && <p className="text-sm font-semibold text-red-600 mt-2">{resetError}</p>}
            {resetPreview && !resetPreview.blocked && (
              <ul className="text-sm text-slate-600 mt-2 mb-2 list-disc list-inside">
                <li>{resetPreview.importLogs} import log{resetPreview.importLogs !== 1 ? 's' : ''}</li>
                <li>{resetPreview.dashboardSnapshots} dashboard snapshot{resetPreview.dashboardSnapshots !== 1 ? 's' : ''}</li>
                <li>{resetPreview.jiraConnections} Jira connection{resetPreview.jiraConnections !== 1 ? 's' : ''}</li>
                <li>Dashboard metrics file: {resetPreview.hasScopedMetricsFile ? 'present, will be deleted' : 'none'}</li>
              </ul>
            )}
            {resetPreview?.blocked && (
              <p className="text-sm font-semibold text-red-600 mt-2 mb-2">{resetPreview.blockedReason}</p>
            )}
            <div className={styles.confirmActions}>
              <button
                type="button"
                onClick={confirmReset}
                disabled={resetConfirming || resetPreviewLoading || resetPreview?.blocked}
                className={styles.confirmDelete}
              >
                {resetConfirming ? 'Resetting…' : 'Yes, reset workspace data'}
              </button>
              <button
                type="button"
                onClick={() => { setResetTarget(null); setResetPreview(null); setResetError(''); }}
                className={styles.confirmCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EP-023: bulk "reset all external users" — select, dry-run, then confirm ── */}
      {showBulkReset && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmModal}>
            {!bulkResetConfirmStep ? (
              <>
                <p className={styles.confirmTitle}>Reset external users&apos; workspace data</p>
                <p className={styles.confirmText}>
                  Select which non-{INTERNAL_EMAIL_DOMAIN} accounts to reset. Internal accounts
                  are never shown here or eligible for this tool.
                </p>
                <div className="max-h-64 overflow-y-auto my-3 border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {externalUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={bulkResetSelected.has(u.id)}
                        onChange={() => toggleBulkResetSelect(u.id)}
                      />
                      <span className="font-semibold text-slate-700">{u.name}</span>
                      <span className="text-slate-400">{u.email}</span>
                    </label>
                  ))}
                </div>
                {resetError && <p className="text-sm font-semibold text-red-600 mb-2">{resetError}</p>}
                <div className={styles.confirmActions}>
                  <button
                    type="button"
                    onClick={loadBulkResetPreviews}
                    disabled={bulkResetSelected.size === 0 || bulkResetLoading}
                    className={styles.confirmDelete}
                  >
                    {bulkResetLoading ? 'Loading preview…' : `Preview ${bulkResetSelected.size || ''} reset${bulkResetSelected.size !== 1 ? 's' : ''}`}
                  </button>
                  <button type="button" onClick={() => setShowBulkReset(false)} className={styles.confirmCancel}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className={styles.confirmTitle}>
                  Confirm reset for {bulkResetSelected.size} user{bulkResetSelected.size !== 1 ? 's' : ''}
                </p>
                <div className="max-h-64 overflow-y-auto my-3 border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {[...bulkResetSelected].map(id => {
                    const p = bulkResetPreviews[id];
                    if (!p) return null;
                    return (
                      <div key={id} className="px-3 py-2 text-sm">
                        <div className="font-semibold text-slate-700">{p.email}</div>
                        {p.blocked ? (
                          <div className="text-red-600 text-xs">{p.blockedReason}</div>
                        ) : (
                          <div className="text-slate-500 text-xs">
                            {p.importLogs} import logs · {p.dashboardSnapshots} snapshots · {p.jiraConnections} Jira connections
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className={styles.confirmActions}>
                  <button
                    type="button"
                    onClick={confirmBulkReset}
                    disabled={bulkResetConfirming}
                    className={styles.confirmDelete}
                  >
                    {bulkResetConfirming ? 'Resetting…' : `Yes, reset ${bulkResetSelected.size}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkResetConfirmStep(false)}
                    className={styles.confirmCancel}
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminConsoleLayout>
  );
}
