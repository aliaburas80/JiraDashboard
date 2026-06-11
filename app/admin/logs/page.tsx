// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';

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

  if (loading) return <AppShell showNav><div className="flex items-center justify-center h-64 animate-pulse" style={{ color: 'var(--dc-p3, #505050)' }}>Loading logs…</div></AppShell>;
  const successfulLogs = logs.filter(log => log.status === 'success').length;
  const failedLogs = logs.length - successfulLogs;
  const uniqueUsers = new Set(logs.map(log => log.user?.email).filter(Boolean)).size;
  const averageHealth = logs.length
    ? Math.round(logs.reduce((sum, log) => sum + (log.healthScore || 0), 0) / logs.length)
    : 0;
  const logStats = [
    { icon: '🧾', label: 'Import Logs',  value: String(logs.length),   note: 'Across all users',   color: 'var(--dc-p1, #F2F2F2)',    toneStyle: { background: 'rgba(232,93,18,0.1)',   color: 'var(--dc-acc, #E85D12)' } },
    { icon: '✓',  label: 'Successful',   value: String(successfulLogs), note: logs.length ? `${Math.round((successfulLogs / logs.length) * 100)}% success` : 'No imports yet', color: 'var(--dc-green, #22C55E)',  toneStyle: { background: 'rgba(34,197,94,0.1)',   color: 'var(--dc-green, #22C55E)' } },
    { icon: '△',  label: 'Failed',       value: String(failedLogs),     note: 'Needs review',       color: failedLogs > 0 ? 'var(--dc-red, #F87171)' : 'var(--dc-p3, #505050)', toneStyle: { background: failedLogs > 0 ? 'rgba(248,113,113,0.1)' : 'var(--dc-s3, #282828)', color: failedLogs > 0 ? '#fca5a5' : 'var(--dc-p3, #505050)' } },
    { icon: '▣',  label: 'Avg Health',   value: logs.length ? `${averageHealth}/100` : '—', note: `${uniqueUsers} user${uniqueUsers !== 1 ? 's' : ''}`, color: 'var(--dc-acc2, #FF8A4C)', toneStyle: { background: 'rgba(232,93,18,0.1)', color: 'var(--dc-acc2, #FF8A4C)' } },
  ];

  return (
    <AppShell showNav>
      <AdminConsoleLayout
        title="Import Logs"
        description={`${logs.length} total import log${logs.length !== 1 ? 's' : ''} across all users.`}
        stats={logStats}
        statusLabel="Operational"
      >

      {error && (
        <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#fca5a5', marginBottom: 16 }}>{error}</div>
      )}

      <div style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--dc-s1, #141414)', borderBottom: '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))', textAlign: 'left' }}>
                {['User', 'File', 'Type', 'Issues', 'Health', 'Status', 'Uploaded'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--dc-p3, #505050)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr
                  key={log.id}
                  style={{ borderBottom: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--dc-p1, #F2F2F2)' }}>{log.user?.name ?? '—'}</div>
                    <div style={{ fontSize: 9, color: 'var(--dc-p3, #505050)', marginTop: 2 }}>{log.user?.email ?? ''}</div>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 10, color: 'var(--dc-p2, #909090)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.fileName}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className="chip c-nt" style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 9 }}>{log.fileType?.toUpperCase()}</span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--dc-p1, #F2F2F2)', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700 }}>{log.totalIssues}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={healthChipClass(log.healthScore ?? 0)} style={{ fontSize: 9 }}>
                      {log.healthScore}/100
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span className={log.status === 'success' ? 'chip c-gr' : 'chip c-rd'} style={{ fontSize: 9 }}>
                      {log.status === 'success' ? 'Success' : log.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 9, color: 'var(--dc-p3, #505050)', fontFamily: 'var(--font-mono, monospace)', whiteSpace: 'nowrap' }}>
                    {new Date(log.uploadedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!logs.length && (
                <tr><td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', fontSize: 13, color: 'var(--dc-p3, #505050)', fontStyle: 'italic' }}>No import logs yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </AdminConsoleLayout>
    </AppShell>
  );
}
