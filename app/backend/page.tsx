'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import LoadingState from '@/components/ui/LoadingState';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BackendStats {
  totalImports: number;
  successfulImports: number;
  failedImports: number;
  lastImport: string | null;
  lastFilename: string | null;
  lastRowCount: number | null;
}

interface ApiEndpoint {
  method: 'GET' | 'POST' | string;
  path: string;
  description: string;
}

interface ImportLog {
  id?:          string | null;
  timestamp:    string | null;
  filename:     string | null;
  rowCount:     number | null;
  status:       string;
  sheetName?:   string | null;
  filesize?:    number | null;
  healthScore?: number | null;
  totalIssues?: number | null;
  userName?:    string | null;
  userEmail?:   string | null;
}

interface BackendViewData {
  stats: BackendStats;
  endpoints: ApiEndpoint[];
  logs: ImportLog[];
  isAdmin: boolean;
  currentUser: { name: string; email: string; role: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MethodBadge({ method }: { method: string }) {
  const upper = method.toUpperCase();
  const style =
    upper === 'POST'
      ? { background: 'rgba(34,197,94,0.15)',   color: '#4ade80' }
      : upper === 'GET'
      ? { background: 'rgba(59,130,246,0.15)',   color: '#93c5fd' }
      : upper === 'DELETE'
      ? { background: 'rgba(248,113,113,0.13)',  color: '#fca5a5' }
      : upper === 'PUT' || upper === 'PATCH'
      ? { background: 'rgba(255,255,255,0.08)',  color: 'var(--dc-p2, #909090)' }
      : { background: 'rgba(255,255,255,0.06)',  color: 'var(--dc-p3, #505050)' };
  return (
    <span style={{ ...style, fontFamily: 'var(--font-mono, monospace)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, display: 'inline-block', letterSpacing: '0.05em' }}>
      {upper}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const cls =
    lower === 'success' ? 'chip c-gr' :
    lower === 'failed'  ? 'chip c-rd' :
                          'chip c-am';
  return <span className={cls} style={{ fontSize: 10 }}>{status}</span>;
}

function healthChipCls(score: number): string {
  if (score > 80)  return 'chip c-gr';
  if (score >= 60) return 'chip c-acc';
  if (score >= 40) return 'chip c-am';
  return 'chip c-or';
}

function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ts; }
}

function safeInt(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(Number(n))) return '—';
  return Number(n).toLocaleString();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BackendPage() {
  const [data, setData]         = useState<BackendViewData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; filename: string } | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast]       = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/backend-view');
      if (!res.ok) throw new Error(`Server responded with ${res.status} ${res.statusText}`);
      const json: BackendViewData = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleDeleteOne() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/imports/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setData(d => d ? { ...d, logs: d.logs.filter(l => l.id !== deleteTarget.id) } : d);
      showToast(`✓ Deleted "${deleteTarget.filename}"`);
    } catch { showToast('Failed to delete log.'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  }

  async function handleDeleteAll() {
    setDeleting(true);
    try {
      const res = await fetch('/api/imports/all', { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error('Delete failed');
      setData(d => d ? { ...d, logs: [], stats: { ...d.stats, totalImports: 0, successfulImports: 0, failedImports: 0 } } : d);
      showToast(`✓ Deleted ${json.deleted} import log${json.deleted !== 1 ? 's' : ''}`);
    } catch { showToast('Failed to delete logs.'); }
    finally { setDeleting(false); setDeleteAllConfirm(false); }
  }

  return (
    <AppShell showNav>
      {/* ── Confirmation dialogs ── */}
      {deleteTarget && (
        <ConfirmDeleteDialog
          title="Delete import log?"
          message={`This will permanently remove the import log for "${deleteTarget.filename}". This cannot be undone.`}
          onConfirm={handleDeleteOne}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
      {deleteAllConfirm && (
        <ConfirmDeleteDialog
          title="Delete all import logs?"
          message="This will permanently remove all your import logs. You will not lose your current dashboard data. This cannot be undone."
          confirmLabel="Delete all logs"
          onConfirm={handleDeleteAll}
          onCancel={() => setDeleteAllConfirm(false)}
          loading={deleting}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg z-50"
          style={{ background: 'var(--dc-s3, #282828)', color: 'var(--dc-p1, #F2F2F2)', border: '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))' }}>
          {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dc-p1, #F2F2F2)', margin: 0 }}>Backend Status</h1>
          <p style={{ fontSize: 13, color: 'var(--dc-p2, #909090)', marginTop: 2 }}>
            Live view of imports, API endpoints, and recent activity.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 disabled:opacity-50"
          style={{ background: 'var(--dc-acc, #E85D12)', color: '#fff', fontWeight: 700, fontSize: 13, padding: '7px 18px', borderRadius: 100, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M4.582 9A8 8 0 0120 15M19.418 15A8 8 0 014 9" />
          </svg>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && <LoadingState message="Fetching backend data…" />}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="rounded-xl p-5 flex items-start gap-3"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="#F87171" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#fca5a5' }}>Failed to load backend data</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--dc-p2, #909090)' }}>{error}</p>
          </div>
        </div>
      )}

      {/* ── Data ── */}
      {!loading && !error && data && (
        <div className="flex flex-col gap-8">

          {/* ── 1. Stats Cards ── */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--dc-p3, #505050)' }}>
              Import Statistics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">

              {/* Total Imports */}
              <div className="rounded-xl p-5 flex flex-col gap-1"
                style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--dc-p3, #505050)' }}>Total Imports</p>
                <p className="text-2xl font-black truncate" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>{data.stats.totalImports}</p>
              </div>

              {/* Successful */}
              <div className="rounded-xl p-5 flex flex-col gap-1"
                style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--dc-p3, #505050)' }}>Successful</p>
                <p className="text-2xl font-black truncate" style={{ color: 'var(--dc-green, #22C55E)' }}>{data.stats.successfulImports}</p>
                {data.stats.totalImports > 0 && (
                  <p className="text-xs truncate" style={{ color: 'var(--dc-p3, #505050)' }}>
                    {Math.round((data.stats.successfulImports / data.stats.totalImports) * 100)}% success rate
                  </p>
                )}
              </div>

              {/* Failed */}
              <div className="rounded-xl p-5 flex flex-col gap-1"
                style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--dc-p3, #505050)' }}>Failed</p>
                <p className="text-2xl font-black truncate" style={{ color: 'var(--dc-p3, #505050)' }}>{data.stats.failedImports}</p>
              </div>

              {/* Last Import */}
              <div className="rounded-xl p-5 flex flex-col gap-1"
                style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--dc-p3, #505050)' }}>Last Import</p>
                <p className="text-sm font-black truncate" style={{ color: 'var(--dc-acc2, #FF8A4C)', fontFamily: 'var(--font-mono, monospace)', fontSize: 13 }}>
                  {data.stats.lastImport ? formatTimestamp(data.stats.lastImport) : '—'}
                </p>
              </div>

              {/* Last Filename */}
              <div className="rounded-xl p-5 flex flex-col gap-1"
                style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--dc-p3, #505050)' }}>Last Filename</p>
                <p className="text-xs font-bold truncate" style={{ color: 'var(--dc-p1, #F2F2F2)', fontFamily: 'var(--font-mono, monospace)' }}>
                  {data.stats.lastFilename ?? '—'}
                </p>
              </div>

              {/* Last Row Count */}
              <div className="rounded-xl p-5 flex flex-col gap-1"
                style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--dc-p3, #505050)' }}>Last Row Count</p>
                <p className="text-2xl font-black truncate" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>
                  {data.stats.lastRowCount !== null ? safeInt(data.stats.lastRowCount) : '—'}
                </p>
              </div>

            </div>
          </section>

          {/* ── 2. API Endpoints ── */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--dc-p3, #505050)' }}>
              API Endpoints
            </h2>
            <div className="rounded-xl overflow-hidden"
              style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
              {data.endpoints.length === 0 ? (
                <p className="text-sm text-center py-10" style={{ color: 'var(--dc-p3, #505050)' }}>No endpoints registered.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))', background: 'var(--dc-s1, #141414)' }}>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider w-20" style={{ color: 'var(--dc-p3, #505050)' }}>Method</th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--dc-p3, #505050)' }}>Path</th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--dc-p3, #505050)' }}>Description</th>
                      <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider w-20" style={{ color: 'var(--dc-p3, #505050)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.endpoints.map((ep, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}
                        className="transition-colors hover:[&>td]:bg-[rgba(255,255,255,0.025)]">
                        <td className="px-4 py-3">
                          <MethodBadge method={ep.method} />
                        </td>
                        <td className="px-4 py-3">
                          <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, color: 'var(--dc-acc2, #FF8A4C)' }}>
                            {ep.path}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--dc-p2, #909090)' }}>
                          {ep.description}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span title="Online" style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: 'var(--dc-green, #22C55E)', boxShadow: '0 0 4px rgba(34,197,94,0.5)' }} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* ── 3. Import Logs ── */}
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--dc-p3, #505050)' }}>
                {data.isAdmin ? 'All Import Logs' : 'My Import Logs'}
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                {!data.isAdmin && data.logs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDeleteAllConfirm(true)}
                    className="text-xs font-bold rounded-xl px-3 py-1.5"
                    style={{ background: 'rgba(248,113,113,0.10)', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.18)' }}
                  >
                    Delete all my logs
                  </button>
                )}
                {data.currentUser && (
                  <span className="text-xs" style={{ color: 'var(--dc-p3, #505050)' }}>
                    Signed in as <strong style={{ color: 'var(--dc-p2, #909090)' }}>{data.currentUser.name}</strong>
                  </span>
                )}
                {data.isAdmin && (
                  <span className="chip c-nt" style={{ fontSize: 10 }}>Admin — seeing all users</span>
                )}
              </div>
            </div>
            <div className="rounded-xl overflow-hidden"
              style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
              {data.logs.length === 0 ? (
                <p className="text-sm text-center py-10" style={{ color: 'var(--dc-p3, #505050)' }}>No import logs found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))', background: 'var(--dc-s1, #141414)' }}>
                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--dc-p3, #505050)' }}>Timestamp</th>
                        <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--dc-p3, #505050)' }}>Filename</th>
                        {data.isAdmin && (
                          <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--dc-p3, #505050)' }}>Uploaded By</th>
                        )}
                        <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider w-20 whitespace-nowrap" style={{ color: 'var(--dc-p3, #505050)' }}>Issues</th>
                        <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider w-20 whitespace-nowrap" style={{ color: 'var(--dc-p3, #505050)' }}>Rows</th>
                        <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider w-16" style={{ color: 'var(--dc-p3, #505050)' }}>Health</th>
                        <th className="text-center px-4 py-3 text-[10px] font-bold uppercase tracking-wider w-28" style={{ color: 'var(--dc-p3, #505050)' }}>Status</th>
                        <th className="w-10 px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.logs.map((log, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}
                          className="transition-colors hover:[&>td]:bg-[rgba(255,255,255,0.025)]">
                          <td className="px-4 py-3 whitespace-nowrap"
                            style={{ color: 'var(--dc-p2, #909090)', fontFamily: 'var(--font-mono, monospace)', fontSize: 9 }}>
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, color: 'var(--dc-p1, #F2F2F2)' }}>
                              {log.filename ?? '—'}
                            </span>
                          </td>
                          {data.isAdmin && (
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>{log.userName ?? '—'}</span>
                                <span style={{ fontSize: 10, color: 'var(--dc-p3, #505050)' }}>{log.userEmail ?? ''}</span>
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-3 text-right font-semibold tabular-nums" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>
                            {log.totalIssues != null ? log.totalIssues : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>
                            {safeInt(log.rowCount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {log.healthScore != null ? (
                              <span className={healthChipCls(log.healthScore)} style={{ fontSize: 9 }}>
                                {log.healthScore}
                              </span>
                            ) : <span style={{ color: 'var(--dc-p3, #505050)', fontSize: 11 }}>—</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={log.status} />
                          </td>
                          <td className="px-2 py-3 text-center">
                            {log.id && (
                              <button
                                type="button"
                                title="Delete this log"
                                onClick={() => setDeleteTarget({ id: log.id!, filename: log.filename ?? 'Unknown' })}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-black transition-colors"
                                style={{ color: 'var(--dc-p3, #505050)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#F87171'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.10)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--dc-p3, #505050)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                              >
                                ×
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

        </div>
      )}
    </AppShell>
  );
}
