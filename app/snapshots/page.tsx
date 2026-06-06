// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Saved Snapshots page — list, load, and delete named dashboard snapshots.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';
import { markMetricsSource, saveMetrics } from '@/lib/storage';

interface Snapshot {
  id:           string;
  snapshotName: string;
  createdAt:    string;
  importLogId?: string;
}

export default function SnapshotsPage() {
  const router = useRouter();
  const [snapshots, setSnapshots]     = useState<Snapshot[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [loadingId, setLoadingId]     = useState('');
  const [toast, setToast]             = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (!me) { router.replace('/login'); return; }
        return fetch('/api/snapshots').then(r => r.json());
      })
      .then(data => { if (data?.snapshots) setSnapshots(data.snapshots); })
      .catch(() => setError('Failed to load snapshots.'))
      .finally(() => setLoading(false));
  }, [router]);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function handleLoad(snap: Snapshot) {
    setLoadingId(snap.id);
    try {
      const res  = await fetch(`/api/snapshots/${snap.id}`);
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'Load failed.'); return; }
      const metrics = JSON.parse(data.metricsJson);
      saveMetrics(metrics);
      markMetricsSource({ source: 'snapshot', message: `Loaded snapshot "${snap.snapshotName}".` });
      showToast(`✓ Loaded "${snap.snapshotName}"`);
      await new Promise(r => setTimeout(r, 800));
      router.push('/dashboard');
    } catch { showToast('Failed to load snapshot.'); }
    finally { setLoadingId(''); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/snapshots/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setSnapshots(prev => prev.filter(s => s.id !== deleteTarget.id));
      showToast(`✓ Deleted "${deleteTarget.name}"`);
    } catch { showToast('Failed to delete snapshot.'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  }

  if (loading) return <AppShell showNav><div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Loading snapshots…</div></AppShell>;

  return (
    <AppShell showNav>
      {deleteTarget && (
        <ConfirmDeleteDialog
          title="Delete snapshot?"
          message={`"${deleteTarget.name}" will be permanently removed. This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Saved Snapshots</h1>
            <p className="text-sm text-slate-500 mt-1">
              {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} saved · max 20 per account
            </p>
          </div>
          <div className="flex gap-2">
            {snapshots.length >= 2 && (
              <button
                type="button"
                onClick={() => router.push('/snapshots/compare')}
                className="btn-secondary px-4 py-2 text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M16 3h5v5h-2V5h-3V3ZM3 3h5v2H5v3H3V3Zm13 16v-2h3v-3h2v5h-5ZM3 16h2v3h3v2H3v-5Zm7-12h4v2h-4V4Zm-2 2H6v4H4V6h4Zm10 0h2v4h-2V6Zm-4 8h4v4h-2v-2h-2v-2Zm-6 0v2H6v2H4v-4h4Z"/>
                </svg>
                Compare
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="btn-primary px-4 py-2"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"/>
              </svg>
              Go to Dashboard
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">{error}</div>}

        {snapshots.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
            <span className="text-4xl mb-4 block">📸</span>
            <p className="text-base font-black text-slate-700 mb-2">No snapshots yet</p>
            <p className="text-sm text-slate-500 mb-4">
              Go to the Full Report and click <strong>"Save snapshot"</strong> in the sticky filter bar to capture a named point-in-time report.
            </p>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="btn-primary px-5 py-2.5"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"/>
              </svg>
              Open Full Report
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {snapshots.map(snap => (
                <li key={snap.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 group">
                  {/* Icon */}
                  <span className="text-xl shrink-0">📸</span>

                  {/* Name + date */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{snap.snapshotName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Saved {new Date(snap.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleLoad(snap)}
                      disabled={loadingId === snap.id}
                      className="btn-secondary btn-sm text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 gap-1"
                    >
                      {loadingId === snap.id ? 'Loading…' : (
                        <>
                          Load
                          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8Z"/>
                          </svg>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ id: snap.id, name: snap.snapshotName })}
                      className="w-7 h-7 rounded-full text-slate-300 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-base font-black"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs text-slate-400 text-center mt-4">
          Loading a snapshot replaces your current dashboard data. Upload a new file to restore live data.
        </p>
      </div>
    </AppShell>
  );
}
