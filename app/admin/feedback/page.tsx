// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';
import styles from './page.module.scss';

// ── Types ──────────────────────────────────────────────────────────────────────

interface FeedbackItem {
  id:           string;
  category:     string;
  message:      string;
  impactLevel:  string;
  canContact:   boolean;
  page:         string | null;
  appVersion:   string | null;
  browserFamily:string | null;
  status:       string;
  statusNote:   string | null;
  userId:       string | null;
  userEmail:    string | null;
  createdAt:    string;
}

const STATUS_OPTIONS = ['New', 'Reviewing', 'Accepted', 'Planned', 'In Progress', 'Released', 'Rejected'] as const;

const STATUS_TABS = ['All', ...STATUS_OPTIONS] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function categoryClass(cat: string): string {
  if (cat === 'Suggestion')               return styles.catSuggestion;
  if (cat === 'Problem/Bug')              return styles.catBug;
  if (cat === 'Feature Request')          return styles.catFeature;
  if (cat === 'Complaint')               return styles.catComplaint;
  if (cat === 'Question')               return styles.catQuestion;
  if (cat === 'Data/Calculation Concern') return styles.catData;
  return styles.catOther;
}

function impactClass(impact: string): string {
  if (impact === 'Blocks Me')        return styles.impactBlocks;
  if (impact === 'Affects My Work')  return styles.impactWork;
  return styles.impactMinor;
}

// ── Row component ─────────────────────────────────────────────────────────────

function FeedbackRow({ item, onStatusChange }: {
  item:           FeedbackItem;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <tr>
      <td>
        <span className={clsx(styles.catPill, categoryClass(item.category))}>
          {item.category}
        </span>
      </td>
      <td className={styles.messageCell}>
        {expanded ? (
          <p className={styles.messageFull}>{item.message}</p>
        ) : (
          <span
            className={styles.messagePreview}
            onClick={() => setExpanded(true)}
            title="Click to expand"
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setExpanded(true)}
          >
            {item.message.slice(0, 90)}{item.message.length > 90 ? '…' : ''}
          </span>
        )}
        {expanded && (
          <button
            type="button"
            className={`${styles.muted} ${styles.collapseBtn}`}
            onClick={() => setExpanded(false)}
          >
            Collapse ↑
          </button>
        )}
      </td>
      <td>
        <span className={impactClass(item.impactLevel)}>{item.impactLevel}</span>
      </td>
      <td className={styles.muted}>{item.page ?? '—'}</td>
      <td className={styles.muted}>
        {item.canContact && item.userEmail ? (
          <a href={`mailto:${item.userEmail}`} className={styles.emailLink}>{item.userEmail}</a>
        ) : '—'}
      </td>
      <td>
        <select
          className={styles.statusSelect}
          value={item.status}
          onChange={e => onStatusChange(item.id, e.target.value)}
          aria-label={`Change status for feedback from ${item.createdAt}`}
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </td>
      <td className={`${styles.muted} ${styles.nowrap}`}>
        {new Date(item.createdAt).toLocaleDateString()}
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminFeedbackPage() {
  const router = useRouter();

  const [items,   setItems]   = useState<FeedbackItem[]>([]);
  const [counts,  setCounts]  = useState<Record<string, number>>({});
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [tab,     setTab]     = useState<string>('All');

  const fetchFeedback = useCallback((p: number, status: string) => {
    const sp = new URLSearchParams({ page: String(p), limit: '30' });
    if (status !== 'All') sp.set('status', status);
    return fetch(`/api/admin/feedback?${sp}`)
      .then(r => r.json())
      .then(d => {
        setItems(d.items ?? []);
        setTotal(d.total ?? 0);
        setPages(d.pages ?? 1);
        if (d.counts) setCounts(d.counts);
      });
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (!me || me.role !== 'admin') { router.replace('/dashboard'); return; }
        return fetchFeedback(1, 'All');
      })
      .catch(() => setError('Failed to load feedback.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function handleStatusChange(id: string, status: string) {
    // Optimistic update
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    try {
      await fetch(`/api/admin/feedback/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      });
    } catch {
      // Revert is complex; reload on error
      fetchFeedback(page, tab);
    }
  }

  function switchTab(t: string) {
    setTab(t);
    setPage(1);
    fetchFeedback(1, t);
  }

  function goPage(p: number) {
    setPage(p);
    fetchFeedback(p, tab);
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Loading feedback…</div>;

  const totalCount = Object.values(counts).reduce((s, n) => s + n, 0);
  const newCount   = counts['New']       ?? 0;
  const reviewing  = counts['Reviewing'] ?? 0;
  const resolved   = (counts['Released'] ?? 0) + (counts['Accepted'] ?? 0);

  const statCards = [
    { icon: 'email',      label: 'Total Feedback',  value: String(totalCount), note: 'All time',        toneStyle: { background: 'rgba(232,93,18,0.1)',  color: 'var(--dc-accent,#e85d12)' } },
    { icon: 'warning',    label: 'New',             value: String(newCount),   note: 'Needs triage',    toneStyle: { background: 'rgba(59,130,246,0.1)', color: '#3b82f6' } },
    { icon: 'statusInfo', label: 'Reviewing',        value: String(reviewing),  note: 'In progress',     toneStyle: { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' } },
    { icon: 'checkCircle',label: 'Resolved',         value: String(resolved),   note: 'Accepted/Released', toneStyle: { background: 'rgba(34,197,94,0.1)',  color: '#22c55e' } },
  ];

  return (
    <AdminConsoleLayout
      title="User Feedback"
      description={`${totalCount} total submissions · triage and track user suggestions, bugs, and questions`}
      stats={statCards}
      statusLabel={newCount > 0 ? `${newCount} New` : 'All clear'}
    >
      {error && <p className={styles.muted}>{error}</p>}

      <div className={styles.card}>
        {/* Status filter tabs */}
        <div className={styles.filterTabs} role="tablist" aria-label="Filter by status">
          {STATUS_TABS.map(t => {
            const cnt = t === 'All' ? totalCount : (counts[t] ?? 0);
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={clsx(styles.tab, { [styles.tabActive]: tab === t })}
                onClick={() => switchTab(t)}
              >
                {t}
                {cnt > 0 && <span className={styles.tabCount}>({cnt})</span>}
              </button>
            );
          })}
        </div>

        {/* Table */}
        {items.length === 0 ? (
          <p className={styles.muted}>No feedback with status &ldquo;{tab}&rdquo;.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Message</th>
                  <th>Impact</th>
                  <th>Page</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <FeedbackRow
                    key={item.id}
                    item={item}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className={styles.pagination}>
            <button type="button" className={styles.pageBtn} onClick={() => goPage(page - 1)} disabled={page <= 1}>← Prev</button>
            <span className={styles.pageInfo}>Page {page} of {pages}</span>
            <button type="button" className={styles.pageBtn} onClick={() => goPage(page + 1)} disabled={page >= pages}>Next →</button>
          </div>
        )}
      </div>
    </AdminConsoleLayout>
  );
}
