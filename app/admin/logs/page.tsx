// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';
import { getHealthBand, type HealthBand } from '@/lib/utils';
import { paginate } from '@/lib/pagination';
import styles from './page.module.scss';

// MPE-02: /api/imports?all=true already caps at 100 rows server-side — bounded
// enough for client-side pagination rather than adding page/limit to the API.
const PAGE_SIZE = 25;

// CP3-018: chip color now derives from the shared getHealthBand() cutoffs
// instead of this page's own divergent >80/60/40 copy (excellent/good both
// render green — same visible result as before for the two upper bands, but
// scores 75-80 now correctly get the green "good" chip instead of amber).
const HEALTH_CHIP_CLASS: Record<HealthBand, string> = {
  excellent: 'chip c-gr', good: 'chip c-gr', moderate: 'chip c-acc', 'at-risk': 'chip c-am', critical: 'chip c-or',
};
function healthChipClass(score: number): string {
  return HEALTH_CHIP_CLASS[getHealthBand(score)];
}

interface Log {
  id: string; fileName: string; fileType: string; totalIssues: number;
  healthScore: number; status: string; uploadedAt: string;
  user?: { name: string; email: string };
}

export default function AdminLogsPage() {
  const router = useRouter();
  const [logs, setLogs]       = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [query, setQuery]     = useState('');
  const [page, setPage]       = useState(1);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (!me || me.role !== 'admin') { router.replace('/dashboard'); return; }
        return fetch('/api/imports?all=true').then(r => r.json());
      })
      .then(data => { if (data?.logs) setLogs(data.logs); })
      .catch(() => setError('Failed to load logs.'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="flex items-center justify-center h-64 animate-pulse text-slate-400">Loading logs…</div>;

  // MPE-03: search by filename or uploader name/email (case-insensitive substring).
  const q = query.trim().toLowerCase();
  const filteredLogs = q
    ? logs.filter(log => [log.fileName, log.user?.name, log.user?.email].some(v => v?.toLowerCase().includes(q)))
    : logs;
  const { items: pageLogs, page: safePage, totalPages } = paginate(filteredLogs, page, PAGE_SIZE);

  const successfulLogs = logs.filter(log => log.status === 'success').length;
  const failedLogs = logs.length - successfulLogs;
  const uniqueUsers = new Set(logs.map(log => log.user?.email).filter(Boolean)).size;
  const averageHealth = logs.length
    ? Math.round(logs.reduce((sum, log) => sum + (log.healthScore || 0), 0) / logs.length)
    : 0;
  const logStats = [
    { icon: 'clipboard', label: 'Import Logs',  value: String(logs.length),   note: 'Across all users',   color: 'var(--dc-p1, #F2F2F2)',    toneStyle: { background: 'rgba(232,93,18,0.1)',   color: 'var(--dc-acc, #E85D12)' } },
    { icon: 'checkCircle',  label: 'Successful',   value: String(successfulLogs), note: logs.length ? `${Math.round((successfulLogs / logs.length) * 100)}% success` : 'No imports yet', color: 'var(--dc-green, #22C55E)',  toneStyle: { background: 'rgba(34,197,94,0.1)',   color: 'var(--dc-green, #22C55E)' } },
    { icon: 'warning',  label: 'Failed',       value: String(failedLogs),     note: 'Needs review',       color: failedLogs > 0 ? 'var(--dc-red, #F87171)' : 'var(--dc-p3, #505050)', toneStyle: { background: failedLogs > 0 ? 'rgba(248,113,113,0.1)' : 'var(--dc-s3, #282828)', color: failedLogs > 0 ? '#fca5a5' : 'var(--dc-p3, #505050)' } },
    { icon: 'statusInfo',  label: 'Avg Health',   value: logs.length ? `${averageHealth}/100` : '—', note: `${uniqueUsers} user${uniqueUsers !== 1 ? 's' : ''}`, color: 'var(--dc-acc2, #FF8A4C)', toneStyle: { background: 'rgba(232,93,18,0.1)', color: 'var(--dc-acc2, #FF8A4C)' } },
  ];

  return (
    <AdminConsoleLayout
      title="Import Logs"
        description={`${logs.length} total import log${logs.length !== 1 ? 's' : ''} across all users.`}
        headerId="tour-header-admin-logs"
        stats={logStats}
        statusLabel="Operational"
      >

      {error && (
        <div className={styles.errorBanner}>{error}</div>
      )}

      <div className={styles.filterRow}>
        <label className={styles.searchLabel} htmlFor="admin-logs-search">
          Search logs
        </label>
        <input
          id="admin-logs-search"
          type="search"
          placeholder="Search by filename, uploader name, or email…"
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1); }}
          className={styles.searchInput}
        />
        <span className={styles.countLabel}>{filteredLogs.length} of {logs.length} logs</span>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr id="tour-section-admin-logs-1" className={styles.headerRow}>
                {['User', 'File', 'Type', 'Issues', 'Health', 'Status', 'Uploaded'].map(h => (
                  <th key={h} className={styles.headerCell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageLogs.map(log => (
                <tr key={log.id} className={styles.row}>
                  <td className={styles.userCell}>
                    <div className={styles.userName}>{log.user?.name ?? '—'}</div>
                    <div className={styles.userEmail}>{log.user?.email ?? ''}</div>
                  </td>
                  <td className={styles.fileCell}>{log.fileName}</td>
                  <td className={styles.typeCell}>
                    <span className={`chip c-nt ${styles.typeBadge}`}>{log.fileType?.toUpperCase()}</span>
                  </td>
                  <td className={styles.numericCell}>{log.totalIssues}</td>
                  <td className={styles.userCell}>
                    <span className={`${healthChipClass(log.healthScore ?? 0)} ${styles.smallBadge}`}>
                      {log.healthScore}/100
                    </span>
                  </td>
                  <td className={styles.userCell}>
                    <span className={`${log.status === 'success' ? 'chip c-gr' : 'chip c-rd'} ${styles.smallBadge}`}>
                      {log.status === 'success' ? 'Success' : log.status}
                    </span>
                  </td>
                  <td className={styles.uploadedCell}>{new Date(log.uploadedAt).toLocaleString()}</td>
                </tr>
              ))}
              {!filteredLogs.length && (
                <tr><td colSpan={7} className={styles.noLogsCell}>{query ? 'No logs match your search.' : 'No import logs yet.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button type="button" className={styles.pageBtn} onClick={() => setPage(safePage - 1)} disabled={safePage <= 1}>← Prev</button>
            <span className={styles.pageInfo}>Page {safePage} of {totalPages}</span>
            <button type="button" className={styles.pageBtn} onClick={() => setPage(safePage + 1)} disabled={safePage >= totalPages}>Next →</button>
          </div>
        )}
      </div>
    </AdminConsoleLayout>
  );
}
