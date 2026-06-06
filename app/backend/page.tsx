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
  id?:         string | null;
  timestamp:   string | null;
  filename:    string | null;
  rowCount:    number | null;
  status:      string;
  sheetName?:  string | null;
  filesize?:   number | null;
  healthScore?: number | null;
  totalIssues?: number | null;
  userName?:   string | null;
  userEmail?:  string | null;
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
  const colour =
    upper === 'POST'
      ? 'bg-green-100 text-green-800 border border-green-200'
      : upper === 'GET'
      ? 'bg-blue-100 text-blue-800 border border-blue-200'
      : upper === 'DELETE'
      ? 'bg-red-100 text-red-800 border border-red-200'
      : upper === 'PUT' || upper === 'PATCH'
      ? 'bg-amber-100 text-amber-800 border border-amber-200'
      : 'bg-slate-100 text-slate-700 border border-slate-200';
  return (
    <span className={`inline-block font-mono text-xs font-bold px-2 py-0.5 rounded ${colour}`}>
      {upper}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const colour =
    lower === 'success'
      ? 'bg-green-100 text-green-800 border border-green-200'
      : lower === 'failed'
      ? 'bg-red-100 text-red-800 border border-red-200'
      : 'bg-amber-100 text-amber-800 border border-amber-200';
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded capitalize ${colour}`}>
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number | null;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-1">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-black text-slate-900 truncate">
        {value === null || value === undefined ? '—' : String(value)}
      </p>
      {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
    </div>
  );
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
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status} ${res.statusText}`);
      }
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Backend Status</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Live view of imports, API endpoints, and recent activity.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="btn-primary px-4 py-2 disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582M20 20v-5h-.581M4.582 9A8 8 0 0120 15M19.418 15A8 8 0 014 9"
            />
          </svg>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && <LoadingState message="Fetching backend data…" />}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-red-500 mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
          <div>
            <p className="font-semibold text-red-800 text-sm">Failed to load backend data</p>
            <p className="text-red-700 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── Data ── */}
      {!loading && !error && data && (
        <div className="flex flex-col gap-8">
          {/* ── 1. Stats Cards ── */}
          <section>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
              Import Statistics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard label="Total Imports" value={data.stats.totalImports} />
              <StatCard
                label="Successful"
                value={data.stats.successfulImports}
                sub={
                  data.stats.totalImports > 0
                    ? `${Math.round((data.stats.successfulImports / data.stats.totalImports) * 100)}% success rate`
                    : undefined
                }
              />
              <StatCard label="Failed" value={data.stats.failedImports} />
              <StatCard
                label="Last Import"
                value={data.stats.lastImport ? formatTimestamp(data.stats.lastImport) : null}
              />
              <StatCard label="Last Filename" value={data.stats.lastFilename} />
              <StatCard
                label="Last Row Count"
                value={
                  data.stats.lastRowCount !== null
                    ? safeInt(data.stats.lastRowCount)
                    : null
                }
              />
            </div>
          </section>

          {/* ── 2. API Endpoints ── */}
          <section>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
              API Endpoints
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {data.endpoints.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No endpoints registered.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-20">
                        Method
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Path
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                        Description
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-20">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.endpoints.map((ep, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <MethodBadge method={ep.method} />
                        </td>
                        <td className="px-4 py-3">
                          <code className="font-mono text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                            {ep.path}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                          {ep.description}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            title="Online"
                            className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* ── 3. Recent Import Logs ── */}
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                {data.isAdmin ? 'All Import Logs' : 'My Import Logs'}
              </h2>
              {/* delete-all button shown only for own logs (non-admin) */}
              {!data.isAdmin && data.logs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDeleteAllConfirm(true)}
                  className="btn-outline-danger btn-sm"
                >
                  Delete all my logs
                </button>
              )}
              <div className="flex items-center gap-2">
                {data.currentUser && (
                  <span className="text-xs text-slate-500">
                    Signed in as <strong>{data.currentUser.name}</strong>
                  </span>
                )}
                {data.isAdmin && (
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">
                    Admin — seeing all users
                  </span>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {data.logs.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">No import logs found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">Timestamp</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Filename</th>
                        {data.isAdmin && (
                          <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">Uploaded By</th>
                        )}
                        <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-20 whitespace-nowrap">Issues</th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-20 whitespace-nowrap">Rows</th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-16">Health</th>
                        <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-28">Status</th>
                        <th className="w-10 px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.logs.map((log, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <code className="font-mono text-xs bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded break-all">
                              {log.filename ?? '—'}
                            </code>
                          </td>
                          {data.isAdmin && (
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-800">{log.userName ?? '—'}</span>
                                <span className="text-[10px] text-slate-400">{log.userEmail ?? ''}</span>
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-3 text-right text-slate-700 font-semibold tabular-nums">
                            {log.totalIssues != null ? log.totalIssues : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 font-semibold tabular-nums">
                            {safeInt(log.rowCount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {log.healthScore != null ? (
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                log.healthScore >= 75 ? 'bg-green-100 text-green-800' :
                                log.healthScore >= 50 ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {log.healthScore}
                              </span>
                            ) : <span className="text-slate-300 text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge status={log.status} />
                          </td>
                          {/* Delete — only show when log has an id (DB-backed) */}
                          <td className="px-2 py-3 text-center">
                            {log.id && (
                              <button
                                type="button"
                                title="Delete this log"
                                onClick={() => setDeleteTarget({ id: log.id!, filename: log.filename ?? 'Unknown' })}
                                className="w-6 h-6 rounded-full text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center text-sm font-black"
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
