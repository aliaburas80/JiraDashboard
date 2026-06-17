// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';
import { ASSIGNABLE_ROLES, roleLabel, type AppRole } from '@/lib/roles';
import type { ManagedUser } from '@/lib/adminConsole';

const ALL_ROLES: AppRole[] = ['admin', 'scrum_master', 'product_owner', 'manager', 'c_level', 'user'];

const ROLE_COLORS: Record<string, string> = {
  admin:         '#F87171',
  scrum_master:  '#60A5FA',
  product_owner: '#34D399',
  manager:       '#FBBF24',
  c_level:       '#A78BFA',
  user:          '#94A3B8',
};

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
    } catch (e: any) { setError(e.message); }
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
    } catch (e: any) { setError(e.message); }
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
    } catch (e: any) { setError(e.message); }
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
    } catch (e: any) { setFormErr(e.message); }
    finally { setSaving(false); }
  }

  const total  = users.length;
  const active = users.filter(u => u.isActive).length;
  const admins = users.filter(u => u.role === 'admin').length;

  const stats = [
    { icon: 'people', label: 'Total Users',  value: String(total),  note: 'All accounts',        toneStyle: { background: 'rgba(255,255,255,0.06)', color: '#F2F2F2' } },
    { icon: 'shield', label: 'Active',       value: String(active), note: total ? `${Math.round((active/total)*100)}% of total` : '—', toneStyle: { background: 'rgba(34,197,94,0.12)', color: '#22C55E' } },
    { icon: 'priorityHigh', label: 'Admins',       value: String(admins), note: total ? `${Math.round((admins/total)*100)}% of total` : '—', toneStyle: { background: 'rgba(248,113,113,0.12)', color: '#F87171' } },
    { icon: 'teams', label: 'Role Types',   value: String(ASSIGNABLE_ROLES.length), note: 'Assignable roles', toneStyle: { background: 'rgba(255,255,255,0.06)', color: '#94A3B8' } },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: 'var(--dc-p3,#505050)' }}>
      Loading users…
    </div>
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
            onClick={() => { setShowCreate(true); setFormErr(''); setForm(EMPTY_FORM); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, border: 'none',
              background: 'var(--dc-acc,#E85D12)', color: '#fff',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            + Add User
          </button>
        }
      >
        {successMsg && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.28)', borderRadius: 8, color: '#4ade80', fontSize: 12, marginBottom: 16 }}>
            <span>{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 0 0 10px', opacity: 0.7 }} aria-label="Dismiss">×</button>
          </div>
        )}
        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, color: '#F87171', fontSize: 12, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* ── Create user form ── */}
        {showCreate && (
          <div style={{ background: 'var(--dc-s2,#1e1e1e)', border: '1px solid var(--dc-bdr,rgba(255,255,255,0.08))', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--dc-p1,#F2F2F2)', marginBottom: 14 }}>New User</p>
            <form onSubmit={createUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                {([['name','Name','text'], ['email','Email','email'], ['password','Temporary password','password']] as [keyof CreateForm, string, string][]).map(([field, label, type]) => (
                  <div key={field}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--dc-p3,#505050)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</label>
                    <input
                      type={type}
                      value={form[field] as string}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      required
                      style={{
                        width: '100%', padding: '7px 10px', borderRadius: 7,
                        background: 'var(--dc-s3,#282828)', border: '1px solid var(--dc-bdr,rgba(255,255,255,0.08))',
                        color: 'var(--dc-p1,#F2F2F2)', fontSize: 12, outline: 'none', boxSizing: 'border-box',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--dc-p3,#505050)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Role</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as AppRole }))}
                    style={{
                      width: '100%', padding: '7px 10px', borderRadius: 7,
                      background: 'var(--dc-s3,#282828)', border: '1px solid var(--dc-bdr,rgba(255,255,255,0.08))',
                      color: 'var(--dc-p1,#F2F2F2)', fontSize: 12, outline: 'none', boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  >
                    {ALL_ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                  </select>
                </div>
              </div>
              {formErr && <p style={{ fontSize: 11, color: '#F87171', marginBottom: 8 }}>{formErr}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={saving} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: 'var(--dc-acc,#E85D12)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Creating…' : 'Create User'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--dc-bdr,rgba(255,255,255,0.08))', background: 'transparent', color: 'var(--dc-p2,#909090)', fontSize: 12, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Filters ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="search"
            placeholder="Search name or email…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1, minWidth: 200, padding: '7px 12px', borderRadius: 8,
              background: 'var(--dc-s2,#1e1e1e)', border: '1px solid var(--dc-bdr,rgba(255,255,255,0.08))',
              color: 'var(--dc-p1,#F2F2F2)', fontSize: 12, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as AppRole | 'all')}
            style={{
              padding: '7px 12px', borderRadius: 8,
              background: 'var(--dc-s2,#1e1e1e)', border: '1px solid var(--dc-bdr,rgba(255,255,255,0.08))',
              color: 'var(--dc-p1,#F2F2F2)', fontSize: 12, outline: 'none', fontFamily: 'inherit',
            }}
          >
            <option value="all">All Roles</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </select>
          <span style={{ fontSize: 11, color: 'var(--dc-p3,#505050)', whiteSpace: 'nowrap' }}>
            {filtered.length} of {total} users
          </span>
        </div>

        {/* ── Bulk action bar ── */}
        {someSelected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '8px 14px', background: 'rgba(232,93,18,0.08)', border: '1px solid rgba(232,93,18,0.25)', borderRadius: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--dc-acc,#E85D12)' }}>{selectedIds.size} selected</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
              <select
                value={bulkRole}
                onChange={e => setBulkRole(e.target.value as AppRole)}
                style={{ padding: '5px 8px', borderRadius: 6, background: 'var(--dc-s3,#282828)', border: '1px solid var(--dc-bdr,rgba(255,255,255,0.08))', color: 'var(--dc-p1,#F2F2F2)', fontSize: 11, outline: 'none', fontFamily: 'inherit' }}
              >
                {ALL_ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </select>
              <button type="button" onClick={bulkChangeRole} disabled={bulkProcessing} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'rgba(96,165,250,0.15)', color: '#60A5FA', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                {bulkProcessing ? 'Applying…' : 'Apply Role'}
              </button>
              <button type="button" onClick={() => setConfirmBulkDelete(true)} disabled={bulkProcessing} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'rgba(248,113,113,0.15)', color: '#F87171', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Delete Selected
              </button>
              <button type="button" onClick={() => setSelectedIds(new Set())} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--dc-bdr,rgba(255,255,255,0.08))', background: 'transparent', color: 'var(--dc-p3,#505050)', fontSize: 11, cursor: 'pointer' }}>
                Clear
              </button>
            </div>
          </div>
        )}

        {/* ── User table ── */}
        <div style={{ background: 'var(--dc-s2,#1e1e1e)', border: '1px solid var(--dc-bdr,rgba(255,255,255,0.08))', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--dc-bdr,rgba(255,255,255,0.08))' }}>
                <th style={{ padding: '10px 14px', width: 36 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={toggleSelectAll}
                    aria-label="Select all users"
                    style={{ cursor: 'pointer', accentColor: 'var(--dc-acc,#E85D12)', width: 14, height: 14 }}
                  />
                </th>
                {['User', 'Role', 'Status', 'Imports', 'Last Login', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--dc-p3,#505050)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '32px 14px', textAlign: 'center', color: 'var(--dc-p3,#505050)', fontStyle: 'italic' }}>
                    No users found.
                  </td>
                </tr>
              )}
              {filtered.map((user, idx) => {
                const isSelf = user.id === meId;
                const roleColor = ROLE_COLORS[user.role] ?? '#94A3B8';
                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: idx < filtered.length - 1 ? '1px solid var(--dc-bdr,rgba(255,255,255,0.06))' : 'none',
                      background: 'transparent',
                      transition: 'background 120ms',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--dc-s3,rgba(255,255,255,0.03))')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: '10px 14px', width: 36 }}>
                      {!isSelf && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          aria-label={`Select ${user.name}`}
                          style={{ cursor: 'pointer', accentColor: 'var(--dc-acc,#E85D12)', width: 14, height: 14 }}
                        />
                      )}
                    </td>

                    {/* User cell */}
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                          background: roleColor + '22', border: `1px solid ${roleColor}44`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 800, color: roleColor,
                        }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--dc-p1,#F2F2F2)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            {user.name}
                            {isSelf && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(232,93,18,0.2)', color: 'var(--dc-acc,#E85D12)', textTransform: 'uppercase', letterSpacing: '.05em' }}>you</span>}
                          </div>
                          <div style={{ color: 'var(--dc-p3,#505050)', marginTop: 1 }}>{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role dropdown */}
                    <td style={{ padding: '10px 14px' }}>
                      <select
                        value={user.role}
                        onChange={e => changeRole(user, e.target.value as AppRole)}
                        disabled={isSelf}
                        style={{
                          padding: '4px 8px', borderRadius: 6,
                          background: roleColor + '18', border: `1px solid ${roleColor}44`,
                          color: roleColor, fontSize: 11, fontWeight: 700, cursor: isSelf ? 'default' : 'pointer',
                          outline: 'none', fontFamily: 'inherit',
                        }}
                      >
                        {ALL_ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                      </select>
                    </td>

                    {/* Active toggle */}
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        type="button"
                        onClick={() => toggleActive(user)}
                        disabled={isSelf}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 20, border: 'none',
                          background: user.isActive ? 'rgba(34,197,94,0.14)' : 'rgba(248,113,113,0.12)',
                          color: user.isActive ? '#22C55E' : '#F87171',
                          fontSize: 10, fontWeight: 700, cursor: isSelf ? 'default' : 'pointer',
                          textTransform: 'uppercase', letterSpacing: '.05em',
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Import count */}
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'var(--dc-p2,#909090)' }}>
                      {user.importCount ?? 0}
                    </td>

                    {/* Last login */}
                    <td style={{ padding: '10px 14px', color: 'var(--dc-p3,#505050)', whiteSpace: 'nowrap' }}>
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
                        : '—'}
                    </td>

                    {/* Delete */}
                    <td style={{ padding: '10px 14px' }}>
                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(user)}
                          style={{
                            padding: '4px 10px', borderRadius: 6,
                            border: '1px solid rgba(248,113,113,0.25)', background: 'transparent',
                            color: '#F87171', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
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

        {/* ── Bulk delete confirmation ── */}
        {confirmBulkDelete && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div style={{ background: 'var(--dc-s2,#1e1e1e)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 14, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dc-p1,#F2F2F2)', marginBottom: 8 }}>Delete {selectedIds.size} user{selectedIds.size > 1 ? 's' : ''}?</p>
              <p style={{ fontSize: 13, color: 'var(--dc-p3,#505050)', marginBottom: 20 }}>
                This will permanently delete <strong style={{ color: '#F87171' }}>{selectedIds.size} account{selectedIds.size > 1 ? 's' : ''}</strong> and all their data. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={bulkDelete} disabled={bulkProcessing} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {bulkProcessing ? 'Deleting…' : `Yes, delete ${selectedIds.size}`}
                </button>
                <button type="button" onClick={() => setConfirmBulkDelete(false)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid var(--dc-bdr,rgba(255,255,255,0.08))', background: 'transparent', color: 'var(--dc-p2,#909090)', fontSize: 12, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete confirmation ── */}
        {confirmDelete && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}>
            <div style={{ background: 'var(--dc-s2,#1e1e1e)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 14, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dc-p1,#F2F2F2)', marginBottom: 8 }}>Delete user?</p>
              <p style={{ fontSize: 13, color: 'var(--dc-p3,#505050)', marginBottom: 20 }}>
                This will permanently delete <strong style={{ color: '#F87171' }}>{confirmDelete.name}</strong> ({confirmDelete.email}) and all their data. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={deleteUser}
                  disabled={saving}
                  style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  {saving ? 'Deleting…' : 'Yes, delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid var(--dc-bdr,rgba(255,255,255,0.08))', background: 'transparent', color: 'var(--dc-p2,#909090)', fontSize: 12, cursor: 'pointer' }}
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
