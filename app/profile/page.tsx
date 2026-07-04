// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';

interface Profile {
  name: string;
  email: string;
  roleLabel: string;
  avatarUrl: string;
  position: string;
  phone: string;
  contactEmail: string;
  address: string;
  certificates: string;
  bio: string;
}

interface Log {
  id: string;
  fileName: string;
  fileType: string;
  totalIssues: number;
  healthScore: number;
  status: string;
  uploadedAt: string;
}

const EMPTY_PROFILE: Profile = {
  name: '',
  email: '',
  roleLabel: '',
  avatarUrl: '',
  position: '',
  phone: '',
  contactEmail: '',
  address: '',
  certificates: '',
  bio: '',
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then(r => r.ok ? r.json() : null),
      fetch('/api/imports').then(r => r.ok ? r.json() : null),
    ])
      .then(([profileData, importData]) => {
        if (!profileData?.profile) {
          router.replace('/login');
          return;
        }
        setProfile(profileData.profile);
        if (importData?.logs) setLogs(importData.logs.slice(0, 10));
      })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function updateField(field: keyof Profile, value: string) {
    setProfile(prev => ({ ...prev, [field]: value }));
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not save profile.');
      setProfile(data.profile);
      showToast('Profile saved.');
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function uploadProfileImage(file: File | null) {
    if (!file) return;
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/profile/image', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Could not upload profile image.');
      updateField('avatarUrl', data.avatarUrl);
      showToast('Profile image uploaded.');
      router.refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to upload profile image.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleDeleteOne() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/imports/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setLogs(prev => prev.filter(l => l.id !== deleteTarget.id));
      showToast(`Deleted "${deleteTarget.name}"`);
    } catch { showToast('Failed to delete.'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  }

  async function handleDeleteAll() {
    setDeleting(true);
    try {
      const res = await fetch('/api/imports/all', { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error();
      setLogs([]);
      showToast(`Deleted ${json.deleted} import log${json.deleted !== 1 ? 's' : ''}`);
    } catch { showToast('Failed to delete.'); }
    finally { setDeleting(false); setDeleteAllConfirm(false); }
  }

  if (loading) return <AppShell showNav><div className="flex h-64 items-center justify-center text-slate-400">Loading...</div></AppShell>;

  const initials = profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <AppShell showNav>
      {deleteTarget && (
        <ConfirmDeleteDialog
          title="Delete import log?"
          message={`Permanently remove the log for "${deleteTarget.name}". Your current dashboard data will not be affected.`}
          onConfirm={handleDeleteOne}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
      {deleteAllConfirm && (
        <ConfirmDeleteDialog
          title="Delete all import history?"
          message="This removes all your stored import logs. Your current dashboard data will not be affected. This cannot be undone."
          confirmLabel="Delete all history"
          onConfirm={handleDeleteAll}
          onCancel={() => setDeleteAllConfirm(false)}
          loading={deleting}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mx-auto max-w-5xl py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-black tracking-tight text-slate-950">My Profile</h1>
          <p className="mt-2 text-sm text-slate-500">Edit the profile details that your teammates can see in Members.</p>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-5 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="h-20 w-20 rounded-full object-cover ring-4 ring-blue-50" />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full bg-blue-600 text-2xl font-black text-white ring-4 ring-blue-50">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xl font-black text-slate-950">{profile.name || 'Your name'}</p>
              <p className="text-sm text-slate-500">{profile.position || profile.roleLabel}</p>
              <p className="text-xs text-slate-400">{profile.email}</p>
            </div>
            <button type="button" onClick={logout} className="btn-outline-danger">
              Sign out
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-xs font-extrabold text-slate-700">
              Full name
              <input value={profile.name} onChange={e => updateField('name', e.target.value)}
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </label>
            <label className="grid gap-2 text-xs font-extrabold text-slate-700">
              Position
              <input value={profile.position} onChange={e => updateField('position', e.target.value)} placeholder="Scrum Master, Product Lead..."
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </label>
            <label className="grid gap-2 text-xs font-extrabold text-slate-700">
              Profile picture
              <span className="flex h-11 min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={e => uploadProfileImage(e.target.files?.[0] ?? null)}
                  disabled={uploadingImage}
                  className="min-w-0 flex-1 text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-blue-700 disabled:opacity-50"
                />
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                {uploadingImage ? 'Uploading to S3...' : 'Stored in S3 under images/profile/.'}
              </span>
            </label>
            <label className="grid gap-2 text-xs font-extrabold text-slate-700">
              Contact email
              <input value={profile.contactEmail} onChange={e => updateField('contactEmail', e.target.value)} placeholder={profile.email}
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </label>
            <label className="grid gap-2 text-xs font-extrabold text-slate-700">
              Telephone
              <input value={profile.phone} onChange={e => updateField('phone', e.target.value)} placeholder="+962..."
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </label>
            <label className="grid gap-2 text-xs font-extrabold text-slate-700">
              Address
              <input value={profile.address} onChange={e => updateField('address', e.target.value)}
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </label>
            <label className="grid gap-2 text-xs font-extrabold text-slate-700 md:col-span-2">
              Certificates
              <textarea value={profile.certificates} onChange={e => updateField('certificates', e.target.value)} rows={3} placeholder="CSM, PMP, SAFe..."
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </label>
            <label className="grid gap-2 text-xs font-extrabold text-slate-700 md:col-span-2">
              Shared team info
              <textarea value={profile.bio} onChange={e => updateField('bio', e.target.value)} rows={4} placeholder="What should teammates know when working with you?"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400" />
            </label>
          </div>

          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
            <button type="button" onClick={saveProfile} disabled={saving} className="btn-primary px-5 py-2.5 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">Import History</h2>
            {logs.length > 0 && (
              <button type="button" onClick={() => setDeleteAllConfirm(true)} className="btn-outline-danger btn-sm">
                Delete all history
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <p className="py-10 text-center text-sm italic text-slate-400">
              No import history yet. Upload a Jira export to get started.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {logs.map(log => (
                <li key={log.id} className="group flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">{log.fileName}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {new Date(log.uploadedAt).toLocaleString()} · {log.totalIssues} issues ·{' '}
                      <span className={`font-bold ${log.healthScore >= 75 ? 'text-green-600' : log.healthScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {log.healthScore}/100
                      </span>
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>{log.status}</span>
                  <button type="button" title="Delete this log" onClick={() => setDeleteTarget({ id: log.id, name: log.fileName })}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-black text-slate-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100">
                    x
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
