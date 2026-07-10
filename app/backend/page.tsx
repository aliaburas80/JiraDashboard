'use client';

import { useCallback, useEffect, useState } from 'react';
import clsx from 'clsx';
import AppShell from '@/components/layout/AppShell';
import LoadingState from '@/components/ui/LoadingState';
import ConfirmDeleteDialog from '@/components/ui/ConfirmDeleteDialog';
import styles from './page.module.scss';

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
  const methodClass =
    upper === 'POST' ? styles.methodPost :
    upper === 'GET' ? styles.methodGet :
    upper === 'DELETE' ? styles.methodDelete :
    upper === 'PUT' || upper === 'PATCH' ? styles.methodEdit :
    styles.methodDefault;

  return (
    <span className={clsx(styles.methodBadge, methodClass)}>
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
  return <span className={clsx(cls, styles.chipSm)}>{status}</span>;
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
        <div className={styles.toast}>{toast}</div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 id="tour-header-backend" className={styles.pageTitle}>Backend Status</h1>
          <p className={styles.pageDesc}>
            Live view of imports, API endpoints, and recent activity.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className={styles.refreshBtn}
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
        <div className={styles.errorBanner}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="#F87171" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className={styles.errorTitle}>Failed to load backend data</p>
            <p className={styles.errorBody}>{error}</p>
          </div>
        </div>
      )}

      {/* ── Data ── */}
      {!loading && !error && data && (
        <div className="flex flex-col gap-8">

          {/* ── 1. Stats Cards ── */}
          <section>
            <h2 id="tour-section-backend-1" className={styles.sectionHeading}>Import Statistics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">

              {/* Total Imports */}
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Total Imports</p>
                <p className={styles.statValueDefault}>{data.stats.totalImports}</p>
              </div>

              {/* Successful */}
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Successful</p>
                <p className={styles.statValueSuccess}>{data.stats.successfulImports}</p>
                {data.stats.totalImports > 0 && (
                  <p className={styles.statNote}>
                    {Math.round((data.stats.successfulImports / data.stats.totalImports) * 100)}% success rate
                  </p>
                )}
              </div>

              {/* Failed */}
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Failed</p>
                <p className={styles.statValueMuted}>{data.stats.failedImports}</p>
              </div>

              {/* Last Import */}
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Last Import</p>
                <p className={styles.statValueAccent}>
                  {data.stats.lastImport ? formatTimestamp(data.stats.lastImport) : '—'}
                </p>
              </div>

              {/* Last Filename */}
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Last Filename</p>
                <p className={styles.statValueMono}>
                  {data.stats.lastFilename ?? '—'}
                </p>
              </div>

              {/* Last Row Count */}
              <div className={styles.statCard}>
                <p className={styles.statLabel}>Last Row Count</p>
                <p className={styles.statValueDefault}>
                  {data.stats.lastRowCount !== null ? safeInt(data.stats.lastRowCount) : '—'}
                </p>
              </div>

            </div>
          </section>

          {/* ── 2. API Endpoints ── */}
          <section>
            <h2 id="tour-section-backend-2" className={styles.sectionHeading}>API Endpoints</h2>
            <div className={styles.tableCard}>
              {data.endpoints.length === 0 ? (
                <p className={styles.tableEmpty}>No endpoints registered.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className={styles.tableHead}>
                      <th className={`${styles.th} text-left px-4 py-3 w-20`}>Method</th>
                      <th className={`${styles.th} text-left px-4 py-3`}>Path</th>
                      <th className={`${styles.th} text-left px-4 py-3 hidden md:table-cell`}>Description</th>
                      <th className={`${styles.th} text-center px-4 py-3 w-20`}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.endpoints.map((ep, i) => (
                      <tr key={i} className={styles.tableRow}>
                        <td className="px-4 py-3">
                          <MethodBadge method={ep.method} />
                        </td>
                        <td className="px-4 py-3">
                          <span className={styles.endpointPath}>{ep.path}</span>
                        </td>
                        <td className={`px-4 py-3 hidden md:table-cell ${styles.endpointDesc}`}>
                          {ep.description}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span title="Online" className={styles.onlineDot} />
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
              <h2 className={styles.sectionHeading}>
                {data.isAdmin ? 'All Import Logs' : 'My Import Logs'}
              </h2>
              <div className="flex items-center gap-3 flex-wrap">
                {!data.isAdmin && data.logs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setDeleteAllConfirm(true)}
                    className={styles.deleteAllBtn}
                  >
                    Delete all my logs
                  </button>
                )}
                {data.currentUser && (
                  <span className={styles.logSignedIn}>
                    Signed in as <strong className={styles.logSignedInName}>{data.currentUser.name}</strong>
                  </span>
                )}
                {data.isAdmin && (
                  <span className={clsx('chip c-nt', styles.chipSm)}>Admin — seeing all users</span>
                )}
              </div>
            </div>
            <div className={styles.tableCard}>
              {data.logs.length === 0 ? (
                <p className={styles.tableEmpty}>No import logs found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={styles.tableHead}>
                        <th className={`${styles.th} text-left px-4 py-3 whitespace-nowrap`}>Timestamp</th>
                        <th className={`${styles.th} text-left px-4 py-3`}>Filename</th>
                        {data.isAdmin && (
                          <th className={`${styles.th} text-left px-4 py-3 whitespace-nowrap`}>Uploaded By</th>
                        )}
                        <th className={`${styles.th} text-right px-4 py-3 w-20 whitespace-nowrap`}>Issues</th>
                        <th className={`${styles.th} text-right px-4 py-3 w-20 whitespace-nowrap`}>Rows</th>
                        <th className={`${styles.th} text-center px-4 py-3 w-16`}>Health</th>
                        <th className={`${styles.th} text-center px-4 py-3 w-28`}>Status</th>
                        <th className="w-10 px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {data.logs.map((log, i) => (
                        <tr key={i} className={styles.tableRow}>
                          <td className={`px-4 py-3 whitespace-nowrap ${styles.cellTimestamp}`}>
                            {formatTimestamp(log.timestamp)}
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <span className={styles.cellFilename}>
                              {log.filename ?? '—'}
                            </span>
                          </td>
                          {data.isAdmin && (
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className={styles.cellUserName}>{log.userName ?? '—'}</span>
                                <span className={styles.cellUserEmail}>{log.userEmail ?? ''}</span>
                              </div>
                            </td>
                          )}
                          <td className={`px-4 py-3 text-right tabular-nums ${styles.cellNum}`}>
                            {log.totalIssues != null ? log.totalIssues : '—'}
                          </td>
                          <td className={`px-4 py-3 text-right tabular-nums ${styles.cellNum}`}>
                            {safeInt(log.rowCount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {log.healthScore != null ? (
                              <span className={clsx(healthChipCls(log.healthScore), styles.chipXs)}>
                                {log.healthScore}
                              </span>
                            ) : <span className={styles.healthMissing}>—</span>}
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
                                className={styles.logDeleteBtn}
                                aria-label={`Delete log for ${log.filename ?? 'Unknown'}`}
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
