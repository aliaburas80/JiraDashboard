// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';

interface Me   { name: string; email: string; role: string }
interface Log  { id: string; fileName: string; fileType: string; totalIssues: number; healthScore: number; status: string; uploadedAt: string }

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe]           = useState<Me | null>(null);
  const [logs, setLogs]       = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  // Delete state
  const [deleteTarget, setDeleteTarget]     = useState<{ id: string; name: string } | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deleting, setDeleting]             = useState(false);
  const [toast, setToast]                   = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { router.replace('/login'); return; }
        setMe(data);
        return fetch('/api/imports').then(r => r.json());
      })
      .then(data => { if (data?.logs) setLogs(data.logs.slice(0, 10)); })
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  async function handleDeleteOne() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/imports/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setLogs(prev => prev.filter(l => l.id !== deleteTarget.id));
      showToast(`✓ Deleted "${deleteTarget.name}"`);
    } catch { showToast('Failed to delete.'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  }

  async function handleDeleteAll() {
    setDeleting(true);
    try {
      const res  = await fetch('/api/imports/all', { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error();
      setLogs([]);
      showToast(`✓ Deleted ${json.deleted} import log${json.deleted !== 1 ? 's' : ''}`);
    } catch { showToast('Failed to delete.'); }
    finally { setDeleting(false); setDeleteAllConfirm(false); }
  }

  if (loading) return <AppShell showNav><div className="flex items-center justify-center h-64 text-slate-400">Loading…</div></AppShell>;
  if (!me)     return null;

  const initials = me.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <AppShell showNav>
      {/* Dialogs */}
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}

      <div className="max-w-2xl mx-auto py-10 space-y-6">
        {/* Profile card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h1 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">My Profile</h1>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-black shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-base font-black text-slate-900">{me.name}</p>
              <p className="text-sm text-slate-500">{me.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role</p>
              <p className="text-sm font-bold text-slate-800 capitalize">{me.role}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Import logs</p>
              <p className="text-sm font-bold text-slate-800">{logs.length}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <button onClick={logout}
              className="px-5 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-bold hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors">
              Sign out
            </button>
          </div>
        </div>

        {/* Import history */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">Import History</h2>
            {logs.length > 0 && (
              <button
                type="button"
                onClick={() => setDeleteAllConfirm(true)}
                className="text-xs font-semibold text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-1 transition-colors"
              >
                Delete all history
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-10">
              No import history yet. Upload a Jira export to get started.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {logs.map(log => (
                <li key={log.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{log.fileName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(log.uploadedAt).toLocaleString()} ·{' '}
                      {log.totalIssues} issues ·{' '}
                      <span className={`font-bold ${log.healthScore >= 75 ? 'text-green-600' : log.healthScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {log.healthScore}/100
                      </span>
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>{log.status}</span>
                  <button
                    type="button"
                    title="Delete this log"
                    onClick={() => setDeleteTarget({ id: log.id, name: log.fileName })}
                    className="w-6 h-6 rounded-full text-slate-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-sm font-black shrink-0"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
