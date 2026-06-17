// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';

interface ErrorLog {
  id:           string;
  errorCode:    string;
  errorMessage: string;
  prismaModel:  string | null;
  operation:    string;
  context:      string | null;
  resolution:   string;
  retryCount:   number;
  lastRetriedAt: string | null;
  resolvedAt:   string | null;
  createdAt:    string;
}

const RESOLUTION_COLORS: Record<string, { bg: string; text: string }> = {
  logged:        { bg: 'rgba(248,113,113,0.12)', text: '#F87171' },
  'auto-fixed':  { bg: 'rgba(34,197,94,0.12)',   text: '#22C55E' },
  retried:       { bg: 'rgba(96,165,250,0.12)',   text: '#60A5FA' },
  resolved:      { bg: 'rgba(148,163,184,0.10)',  text: '#94A3B8' },
  skipped:       { bg: 'rgba(251,191,36,0.12)',   text: '#FBBF24' },
};

const CODE_LABELS: Record<string, string> = {
  P2003: 'Foreign key constraint — referenced record does not exist',
  P2025: 'Record not found',
  P2002: 'Unique constraint violation',
  P2014: 'Relation violation',
  UNKNOWN: 'Unknown error',
};

function resolutionStyle(r: string) {
  const base = RESOLUTION_COLORS[r] ?? RESOLUTION_COLORS.logged;
  return { background: base.bg, color: base.text };
}

export default function SystemErrorsPage() {
  const router = useRouter();
  const [logs,      setLogs]      = useState<ErrorLog[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<string>('all');
  const [actionId,  setActionId]  = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  const load = useCallback(async (res?: string) => {
    const url = res && res !== 'all'
      ? `/api/admin/system-errors?resolution=${encodeURIComponent(res)}`
      : '/api/admin/system-errors';
    const r = await fetch(url);
    if (!r.ok) return;
    const data = await r.json();
    setLogs(data.errors ?? []);
    setTotal(data.total ?? 0);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (!me || me.role !== 'admin') { router.replace('/dashboard'); return; }
        return load(filter);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router, load, filter]);

  async function retry(id: string) {
    setActionId(id);
    setStatusMsg('');
    try {
      const r = await fetch('/api/admin/system-errors?action=retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const d = await r.json();
      if (!r.ok) { setStatusMsg(`⚠️ ${d.error}`); return; }
      setStatusMsg(`✅ Retried: ${d.result}`);
      await load(filter);
    } finally { setActionId(null); }
  }

  async function markResolved(id: string) {
    setActionId(id);
    try {
      await fetch('/api/admin/system-errors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await load(filter);
    } finally { setActionId(null); }
  }

  async function markAllResolved() {
    setActionId('all');
    try {
      await fetch('/api/admin/system-errors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setStatusMsg('✅ All unresolved errors marked as resolved.');
      await load(filter);
    } finally { setActionId(null); }
  }

  const unresolved = logs.filter(l => !l.resolvedAt).length;

  const stats = [
    { icon: 'warning', label: 'Total Logged',   value: String(total),     note: 'All time',          toneStyle: { background: 'rgba(248,113,113,0.12)', color: '#F87171' } },
    { icon: 'priorityHigh', label: 'Unresolved',     value: String(unresolved), note: 'Need attention',    toneStyle: { background: 'rgba(251,191,36,0.12)',   color: '#FBBF24' } },
    { icon: 'checkCircle', label: 'Auto-Fixed',     value: String(logs.filter(l => l.resolution === 'auto-fixed').length), note: 'System self-healed', toneStyle: { background: 'rgba(34,197,94,0.12)', color: '#22C55E' } },
    { icon: 'retry', label: 'Retried',        value: String(logs.filter(l => l.resolution.startsWith('retried')).length), note: 'Manually retried', toneStyle: { background: 'rgba(96,165,250,0.12)', color: '#60A5FA' } },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: 'var(--dc-p3,#505050)' }}>
      Loading system errors…
    </div>
  );

  return (
    <AdminConsoleLayout
      title="System Errors"
      description="Database errors, failed operations, and their resolution status. Retry or dismiss entries below."
      stats={stats}
      statusLabel={unresolved > 0 ? `${unresolved} unresolved` : 'All resolved'}
      actions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={filter}
            onChange={e => { setFilter(e.target.value); load(e.target.value); }}
            style={{ padding: '6px 10px', borderRadius: 7, background: 'var(--dc-s3,#282828)', border: '1px solid var(--dc-bdr,rgba(255,255,255,0.08))', color: 'var(--dc-p1,#F2F2F2)', fontSize: 11, outline: 'none', fontFamily: 'inherit' }}
          >
            <option value="all">All statuses</option>
            <option value="logged">Logged</option>
            <option value="auto-fixed">Auto-fixed</option>
            <option value="retried">Retried</option>
            <option value="resolved">Resolved</option>
          </select>
          <button
            type="button"
            onClick={() => load(filter)}
            style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--dc-bdr,rgba(255,255,255,0.08))', background: 'transparent', color: 'var(--dc-p2,#909090)', fontSize: 11, cursor: 'pointer' }}
          >
            ↻ Refresh
          </button>
          {unresolved > 0 && (
            <button
              type="button"
              onClick={markAllResolved}
              disabled={actionId === 'all'}
              style={{ padding: '6px 12px', borderRadius: 7, border: 'none', background: 'rgba(148,163,184,0.12)', color: '#94A3B8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              {actionId === 'all' ? 'Resolving…' : 'Mark all resolved'}
            </button>
          )}
        </div>
      }
    >
      {statusMsg && (
        <div style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)', color: '#4ade80', fontSize: 12, marginBottom: 16 }}>
          {statusMsg}
        </div>
      )}

      {logs.length === 0 ? (
        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <p style={{ color: 'var(--dc-p2,#909090)', fontSize: 14, fontWeight: 600 }}>No system errors logged</p>
          <p style={{ color: 'var(--dc-p3,#505050)', fontSize: 12, marginTop: 4 }}>
            Errors are captured automatically whenever a database operation fails.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {logs.map(log => (
            <div
              key={log.id}
              style={{
                background: 'var(--dc-s2,#1e1e1e)',
                border: `1px solid ${log.resolvedAt ? 'var(--dc-bdr,rgba(255,255,255,0.06))' : 'rgba(248,113,113,0.18)'}`,
                borderRadius: 12,
                padding: '14px 16px',
                opacity: log.resolvedAt ? 0.6 : 1,
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 4, background: 'rgba(248,113,113,0.15)', color: '#F87171', whiteSpace: 'nowrap' }}>
                  {log.errorCode}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: 11, padding: '2px 7px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', color: 'var(--dc-p2,#909090)', whiteSpace: 'nowrap' }}>
                  {log.operation}
                </span>
                {log.prismaModel && (
                  <span style={{ fontSize: 11, color: 'var(--dc-p3,#505050)', padding: '2px 7px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }}>
                    model: {log.prismaModel}
                  </span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--dc-p3,#505050)', whiteSpace: 'nowrap' }}>
                  {new Date(log.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* What failed */}
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--dc-p3,#505050)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>What failed</p>
                <p style={{ fontSize: 12, color: 'var(--dc-p2,#909090)' }}>
                  {CODE_LABELS[log.errorCode] ?? log.errorCode} — {log.errorMessage.split('\n')[0]}
                </p>
              </div>

              {/* What the system did */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--dc-p3,#505050)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Resolution</p>
                <span style={{ ...resolutionStyle(log.resolution), fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  {log.resolution}
                </span>
                {log.retryCount > 0 && (
                  <span style={{ fontSize: 10, color: 'var(--dc-p3,#505050)' }}>
                    {log.retryCount} retry attempt{log.retryCount !== 1 ? 's' : ''}
                    {log.lastRetriedAt ? ` · last ${new Date(log.lastRetriedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}
                  </span>
                )}
              </div>

              {/* Context */}
              {log.context && (
                <p style={{ fontSize: 11, color: 'var(--dc-p3,#505050)', marginBottom: 10 }}>
                  Context: <span style={{ color: 'var(--dc-p2,#909090)' }}>{log.context}</span>
                </p>
              )}

              {/* Actions */}
              {!log.resolvedAt && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => retry(log.id)}
                    disabled={actionId === log.id}
                    style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'rgba(96,165,250,0.15)', color: '#60A5FA', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {actionId === log.id ? 'Retrying…' : '🔁 Retry operation'}
                  </button>
                  <button
                    type="button"
                    onClick={() => markResolved(log.id)}
                    disabled={actionId === log.id}
                    style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--dc-bdr,rgba(255,255,255,0.08))', background: 'transparent', color: 'var(--dc-p3,#505050)', fontSize: 11, cursor: 'pointer' }}
                  >
                    ✓ Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminConsoleLayout>
  );
}
