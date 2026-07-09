// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';
import styles from './page.module.scss';

interface ErrorLog {
  id:            string;
  errorCode:     string;
  errorMessage:  string;
  prismaModel:   string | null;
  operation:     string;
  context:       string | null;
  resolution:    string;
  retryCount:    number;
  lastRetriedAt: string | null;
  resolvedAt:    string | null;
  createdAt:     string;
}

// Human-readable error descriptions — what the code means + why it happens
const ERROR_INFO: Record<string, { title: string; detail: string }> = {
  P2003: {
    title: 'Foreign key constraint failed',
    detail: 'A linked record (e.g. a user account) was deleted before this write completed. Typically caused by a ghost session cookie outliving its user record.',
  },
  P2025: {
    title: 'Record not found',
    detail: 'The target record does not exist — it may have been deleted by a concurrent operation before this one ran.',
  },
  P2002: {
    title: 'Unique constraint violation',
    detail: 'A record with this unique value already exists. The write was rejected to prevent duplicates.',
  },
  P2014: {
    title: 'Relation constraint violated',
    detail: 'A required relation between tables is missing. Ensure all parent records exist before writing.',
  },
  UNKNOWN: {
    title: 'Unexpected database error',
    detail: 'An unclassified error occurred. Review the message and context below for details.',
  },
};

// Resolution descriptions — what the system did (or what the admin should do)
const RESOLUTION_GUIDE: Record<string, string> = {
  logged:       'Recorded but not yet resolved. Use Retry to re-run the failed operation, or Dismiss if it is no longer relevant.',
  'auto-fixed': 'The system automatically recovered — the operation was retried with a safe fallback (null userId) to preserve data integrity.',
  retried:      'This operation was manually retried from the admin panel. See the retry count for history.',
  resolved:     'Marked as resolved by an administrator. No further action needed.',
  skipped:      'The operation was intentionally skipped to prevent cascading failures.',
};

function fmt(ts: string) {
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
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
    { icon: 'warning',      label: 'Total Logged',  value: String(total),     note: 'All time',          toneStyle: { background: 'rgba(248,113,113,0.12)', color: '#F87171' } },
    { icon: 'priorityHigh', label: 'Unresolved',    value: String(unresolved), note: 'Need attention',    toneStyle: { background: 'rgba(251,191,36,0.12)',   color: '#FBBF24' } },
    { icon: 'checkCircle',  label: 'Auto-Fixed',    value: String(logs.filter(l => l.resolution === 'auto-fixed').length), note: 'System self-healed', toneStyle: { background: 'rgba(34,197,94,0.12)',  color: '#22C55E' } },
    { icon: 'retry',        label: 'Retried',       value: String(logs.filter(l => l.resolution.startsWith('retried')).length), note: 'Manually retried', toneStyle: { background: 'rgba(96,165,250,0.12)', color: '#60A5FA' } },
  ];

  if (loading) return (
    <div className={clsx('flex items-center justify-center h-64', styles.loadingState)}>
      Loading system errors…
    </div>
  );

  return (
    <AdminConsoleLayout
      title="System Errors"
      description="Database errors, failed operations, and their resolution status. Retry or dismiss entries below."
      headerId="tour-header-admin-system-errors"
      stats={stats}
      statusLabel={unresolved > 0 ? `${unresolved} unresolved` : 'All resolved'}
      actions={
        <div className="flex gap-2 items-center">
          <select
            value={filter}
            onChange={e => { setFilter(e.target.value); load(e.target.value); }}
            className={styles.filterSelect}
          >
            <option value="all">All statuses</option>
            <option value="logged">Logged</option>
            <option value="auto-fixed">Auto-fixed</option>
            <option value="retried">Retried</option>
            <option value="resolved">Resolved</option>
          </select>
          <button type="button" onClick={() => load(filter)} className={styles.btnRefresh}>
            ↻ Refresh
          </button>
          {unresolved > 0 && (
            <button
              type="button"
              onClick={markAllResolved}
              disabled={actionId === 'all'}
              className={styles.btnMarkAll}
            >
              {actionId === 'all' ? 'Resolving…' : 'Mark all resolved'}
            </button>
          )}
        </div>
      }
    >
      {statusMsg && <div className={styles.statusMsg}>{statusMsg}</div>}

      {logs.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✅</div>
          <p className={styles.emptyTitle}>No system errors logged</p>
          <p className={styles.emptySubtitle}>
            Errors are captured automatically whenever a database operation fails.
          </p>
        </div>
      ) : (
        <div className={styles.cardList}>
          {logs.map(log => {
            const info = ERROR_INFO[log.errorCode] ?? ERROR_INFO.UNKNOWN;
            return (
              <div
                key={log.id}
                data-resolved={log.resolvedAt ? 'true' : 'false'}
                className={styles.card}
              >
                {/* ── Header bar ── */}
                <div className={styles.cardHeader}>
                  <div className={styles.headerLeft}>
                    <span className={styles.errorCodeBadge}>{log.errorCode}</span>
                    <span className={styles.operationBadge}>{log.operation}</span>
                    {log.prismaModel && (
                      <span className={styles.modelBadge}>{log.prismaModel}</span>
                    )}
                  </div>
                  <span className={styles.timestamp}>{fmt(log.createdAt)}</span>
                </div>

                {/* ── Two-panel body ── */}
                <div className={styles.panelGrid}>
                  {/* Left — What failed (red) */}
                  <div className={styles.errorPanel}>
                    <p className={styles.errorPanelLabel}>What failed</p>
                    <p className={styles.errorTitle}>{info.title}</p>
                    <p className={styles.errorDetail}>{info.detail}</p>
                    <code className={styles.errorSnippet}>
                      {log.errorMessage.split('\n')[0]}
                    </code>
                  </div>

                  {/* Right — Resolution (green / blue / amber by data-resolution) */}
                  <div className={styles.solutionPanel} data-resolution={log.resolution}>
                    <div className={styles.solutionPanelHeader}>
                      <p className={styles.solutionPanelLabel}>How it was handled</p>
                      <span data-resolution={log.resolution} className={styles.resolutionChip}>
                        {log.resolution}
                      </span>
                    </div>
                    <p className={styles.solutionText}>
                      {RESOLUTION_GUIDE[log.resolution] ?? 'No description available.'}
                    </p>
                    {log.retryCount > 0 && (
                      <p className={styles.retryMeta}>
                        {log.retryCount} retry attempt{log.retryCount !== 1 ? 's' : ''}
                        {log.lastRetriedAt ? ` · last ${fmt(log.lastRetriedAt)}` : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Footer bar: context + actions ── */}
                {(log.context || !log.resolvedAt) && (
                  <div className={styles.cardFooter}>
                    {log.context ? (
                      <p className={styles.contextText}>
                        <span className={styles.contextKey}>Context</span>
                        <span className={styles.contextValue}>{log.context}</span>
                      </p>
                    ) : <span />}
                    {!log.resolvedAt && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => retry(log.id)}
                          disabled={actionId === log.id}
                          className={styles.btnRetry}
                        >
                          {actionId === log.id ? 'Retrying…' : 'Retry operation'}
                        </button>
                        <button
                          type="button"
                          onClick={() => markResolved(log.id)}
                          disabled={actionId === log.id}
                          className={styles.btnDismiss}
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminConsoleLayout>
  );
}
