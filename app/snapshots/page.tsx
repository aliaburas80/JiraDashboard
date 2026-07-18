// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Saved Snapshots page — list, load, and delete named dashboard snapshots.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { markMetricsSource, saveMetrics } from '@/lib/storage';
import { paginate } from '@/lib/pagination';

// MPE-02: snapshots are capped at 20 per account server-side (see POST
// /api/snapshots), so 10-per-page keeps the common case to 1-2 pages.
const PAGE_SIZE = 10;

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
  const [query, setQuery]             = useState('');
  const [page, setPage]               = useState(1);
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
      await saveMetrics(metrics);
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

  // MPE-03: search by snapshot name (case-insensitive substring).
  const q = query.trim().toLowerCase();
  const filteredSnapshots = q ? snapshots.filter(s => s.snapshotName.toLowerCase().includes(q)) : snapshots;
  const { items: pageSnapshots, page: safePage, totalPages } = paginate(filteredSnapshots, page, PAGE_SIZE);

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
            <h1 id="tour-header-snapshots" className="text-2xl font-black text-slate-900">Saved Snapshots</h1>
            <p className="text-sm text-slate-500 mt-1">
              {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} saved · max 20 per account
            </p>
          </div>
          <div id="tour-section-snapshots-1" className="flex gap-2">
            {snapshots.length >= 2 && (
              <button
                type="button"
                onClick={() => router.push('/snapshots/compare')}
                className="btn-secondary px-4 py-2 text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100"
              >
                <SvgIcon name="compare" size={16} />
                Compare
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="btn-primary px-4 py-2"
            >
              <SvgIcon name="dashboard" size={16} />
              Go to Dashboard
            </button>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">{error}</div>}

        {snapshots.length > 0 && (
          <label className="relative block mb-4">
            <span className="sr-only">Search snapshots by name</span>
            <SvgIcon name="search" size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search snapshots by name…"
              className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </label>
        )}

        {snapshots.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
            <SvgIcon name="camera" size={40} className="mx-auto mb-4 text-slate-400" />
            <p className="text-base font-black text-slate-700 mb-2">No snapshots yet</p>
            <p className="text-sm text-slate-500 mb-4">
              Go to the Full Report and click <strong>&quot;Save snapshot&quot;</strong> in the sticky filter bar to capture a named point-in-time report.
            </p>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="btn-primary px-5 py-2.5"
            >
              <SvgIcon name="dashboard" size={16} />
              Open Full Report
            </button>
          </div>
        ) : filteredSnapshots.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
            <SvgIcon name="search" size={40} className="mx-auto mb-4 text-slate-400" />
            <p className="text-base font-black text-slate-700 mb-2">No snapshots match &quot;{query}&quot;</p>
            <p className="text-sm text-slate-500">Try a different search term.</p>
          </div>
        ) : (
          <div id="tour-section-snapshots-2" className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {pageSnapshots.map(snap => (
                <li key={snap.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 group">
                  {/* Icon */}
                  <SvgIcon name="camera" size={20} className="shrink-0 text-slate-400" />

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
                          <SvgIcon name="arrowRight" size={12} />
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
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 border-t border-slate-100 py-3">
                <button
                  type="button"
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage <= 1}
                  className="btn-secondary btn-sm disabled:opacity-40 disabled:cursor-default"
                >
                  ← Prev
                </button>
                <span className="text-xs font-semibold text-slate-400">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage >= totalPages}
                  className="btn-secondary btn-sm disabled:opacity-40 disabled:cursor-default"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-slate-400 text-center mt-4">
          Loading a snapshot replaces your current dashboard data. Upload a new file to restore live data.
        </p>
      </div>
    </AppShell>
  );
}
