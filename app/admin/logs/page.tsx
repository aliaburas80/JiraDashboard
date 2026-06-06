// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';

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

  if (loading) return <AppShell showNav><div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Loading logs…</div></AppShell>;
  const successfulLogs = logs.filter(log => log.status === 'success').length;
  const failedLogs = logs.length - successfulLogs;
  const uniqueUsers = new Set(logs.map(log => log.user?.email).filter(Boolean)).size;
  const averageHealth = logs.length
    ? Math.round(logs.reduce((sum, log) => sum + (log.healthScore || 0), 0) / logs.length)
    : 0;
  const logStats = [
    { icon: '🧾', label: 'Import Logs', value: String(logs.length), note: 'Across all users', tone: 'bg-blue-50 text-blue-700' },
    { icon: '✓', label: 'Successful', value: String(successfulLogs), note: logs.length ? `${Math.round((successfulLogs / logs.length) * 100)}% success` : 'No imports yet' },
    { icon: '△', label: 'Failed', value: String(failedLogs), note: 'Needs review', tone: failedLogs > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700' },
    { icon: '▣', label: 'Avg Health', value: logs.length ? `${averageHealth}/100` : '—', note: `${uniqueUsers} user${uniqueUsers !== 1 ? 's' : ''}` },
  ];

  return (
    <AppShell showNav>
      <AdminConsoleLayout
        title="Import Logs"
        description={`${logs.length} total import log${logs.length !== 1 ? 's' : ''} across all users.`}
        stats={logStats}
        statusLabel="Operational"
      >

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                {['User', 'File', 'Type', 'Issues', 'Health', 'Status', 'Uploaded'].map(h => (
                  <th key={h} className="py-2.5 px-4 text-[10px] font-black uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2.5 px-4">
                    <p className="font-semibold text-slate-800">{log.user?.name ?? '—'}</p>
                    <p className="text-xs text-slate-400">{log.user?.email ?? ''}</p>
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-700 max-w-[200px] truncate">{log.fileName}</td>
                  <td className="py-2.5 px-4 text-xs text-slate-500 uppercase">{log.fileType}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-800">{log.totalIssues}</td>
                  <td className="py-2.5 px-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${log.healthScore >= 75 ? 'bg-green-100 text-green-800' : log.healthScore >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                      {log.healthScore}/100
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.uploadedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!logs.length && (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400 italic">No import logs yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </AdminConsoleLayout>
    </AppShell>
  );
}
