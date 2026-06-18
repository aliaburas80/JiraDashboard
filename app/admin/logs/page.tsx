// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';
import styles from './page.module.scss';

function healthChipClass(score: number): string {
  if (score > 80) return 'chip c-gr';
  if (score >= 60) return 'chip c-acc';
  if (score >= 40) return 'chip c-am';
  return 'chip c-or';
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
        stats={logStats}
        statusLabel="Operational"
      >

      {error && (
        <div className={styles.errorBanner}>{error}</div>
      )}

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.headerRow}>
                {['User', 'File', 'Type', 'Issues', 'Health', 'Status', 'Uploaded'].map(h => (
                  <th key={h} className={styles.headerCell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
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
              {!logs.length && (
                <tr><td colSpan={7} className={styles.noLogsCell}>No import logs yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminConsoleLayout>
  );
}
