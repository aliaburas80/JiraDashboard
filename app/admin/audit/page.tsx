// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminConsoleLayout } from '@/components/admin/AdminConsoleLayout';
import styles from './page.module.scss';

// ── Types ──────────────────────────────────────────────────────────────────────

interface StatsData {
  total:         number;
  todayCount:    number;
  uniqueUsers:   number;
  topEventType:  string;
  byDay:         Array<{ date: string; count: number }>;
  byType:        Array<{ type: string; count: number }>;
  journeyEdges:  Array<{ from: string; to: string; count: number }>;
}

interface AuditEvent {
  id:               string;
  eventType:        string;
  eventDescription: string;
  createdAt:        string;
  ipAddress:        string | null;
  user:             { name: string; email: string } | null;
}

// ── SVG Bar Chart — events per day ────────────────────────────────────────────

function BarChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const W = 560; const H = 140; const PAD_L = 32; const PAD_B = 24; const PAD_T = 8;
  const chartW = W - PAD_L;
  const chartH = H - PAD_B - PAD_T;
  const max    = Math.max(...data.map(d => d.count), 1);
  const barW   = Math.floor(chartW / data.length) - 1;

  // Y-axis grid lines at 25%, 50%, 75%, 100%.
  const gridVals = [
    Math.round(max * 0.25),
    Math.round(max * 0.5),
    Math.round(max * 0.75),
    max,
  ].filter((v, i, a) => a.indexOf(v) === i && v > 0);

  return (
    <svg
      className={styles.barChart}
      viewBox={`0 0 ${W} ${H}`}
      aria-label="Events per day for the last 30 days"
      role="img"
    >
      {/* Grid lines */}
      {gridVals.map(v => {
        const y = PAD_T + chartH - (v / max) * chartH;
        return (
          <g key={v}>
            <line x1={PAD_L} y1={y} x2={W} y2={y} className={styles.gridLine} strokeDasharray="3 3" />
            <text x={PAD_L - 4} y={y + 3} className={styles.axisLabel}>{v}</text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const bh  = Math.max((d.count / max) * chartH, d.count > 0 ? 2 : 0);
        const x   = PAD_L + i * (barW + 1);
        const y   = PAD_T + chartH - bh;
        const showLabel = i % 5 === 0 || i === data.length - 1;
        const label = d.date.slice(5); // MM-DD
        return (
          <g key={d.date}>
            <rect
              x={x} y={y}
              width={barW}
              height={bh}
              rx={2}
              className={styles.barFill}
            >
              <title>{`${d.date}: ${d.count} event${d.count !== 1 ? 's' : ''}`}</title>
            </rect>
            {showLabel && (
              <text
                x={x + barW / 2}
                y={H - 4}
                className={styles.barLabel}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── SVG Donut Chart — events by type ─────────────────────────────────────────

const DONUT_COLORS = [
  '#e85d12', '#3b82f6', '#22c55e', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6',
  '#ec4899', '#64748b',
];

function DonutChart({ data, total }: { data: Array<{ type: string; count: number }>; total: number }) {
  const top     = data.slice(0, 9);
  const other   = data.slice(9).reduce((s, d) => s + d.count, 0);
  const slices  = other > 0 ? [...top, { type: 'other', count: other }] : top;
  const sum     = Math.max(slices.reduce((s, d) => s + d.count, 0), 1);

  const CX = 70; const CY = 70; const R = 54; const CIRC = 2 * Math.PI * R;
  let offset = -CIRC / 4; // start at top

  return (
    <div className={styles.donutWrap}>
      <svg
        viewBox="0 0 140 140"
        className={styles.donutSvg}
        aria-label={`Events by type — total ${total}`}
        role="img"
      >
        {/* Background ring */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--color-border, #e2e8f0)" strokeWidth={20} />

        {slices.map((s, i) => {
          const arc   = (s.count / sum) * CIRC;
          const color = DONUT_COLORS[i % DONUT_COLORS.length];
          const el = (
            <circle
              key={s.type}
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={color}
              strokeWidth={20}
              strokeDasharray={`${arc} ${CIRC - arc}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            >
              <title>{`${s.type}: ${s.count}`}</title>
            </circle>
          );
          offset += arc;
          return el;
        })}

        {/* Centre label */}
        <text x={CX} y={CY - 4} textAnchor="middle" className={styles.donutCenter}>{total}</text>
        <text x={CX} y={CY + 14} textAnchor="middle" className={styles.donutSub}>events</text>
      </svg>

      <div className={styles.legend}>
        {slices.slice(0, 8).map((s, i) => (
          <div key={s.type} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
              aria-hidden="true"
            />
            <span>{s.type}</span>
            <span className={styles.legendCount}>{s.count}</span>
          </div>
        ))}
        {other > 0 && (
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: DONUT_COLORS[9] }} aria-hidden="true" />
            <span>other</span>
            <span className={styles.legendCount}>{other}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Journey Transitions ───────────────────────────────────────────────────────

function JourneySection({ edges }: { edges: Array<{ from: string; to: string; count: number }> }) {
  if (edges.length === 0) {
    return <p className={styles.muted}>No journey data yet — events accumulate as users interact with the product.</p>;
  }
  const max = edges[0].count;
  return (
    <div className={styles.journeyRow} role="list" aria-label="Most common user journey transitions">
      {edges.map((e, i) => (
        <div key={i} className={styles.journeyItem} role="listitem">
          <span className={styles.journeyFrom}>{e.from}</span>
          <span className={styles.journeyArrow} aria-hidden="true">→</span>
          <span className={styles.journeyTo}>{e.to}</span>
          <div className={styles.journeyBar} aria-hidden="true">
            <div
              className={styles.journeyBarFill}
              style={{ width: `${Math.round((e.count / max) * 100)}%` }}
            />
          </div>
          <span className={styles.journeyCount}>{e.count}×</span>
        </div>
      ))}
    </div>
  );
}

// ── Events Table ──────────────────────────────────────────────────────────────

function EventsTable({
  events, page, pages, onPrev, onNext,
}: {
  events: AuditEvent[];
  page: number;
  pages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (events.length === 0) {
    return <p className={styles.muted}>No events match the current filter.</p>;
  }
  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Event</th>
              <th>Description</th>
              <th>User</th>
              <th>IP</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {events.map(ev => (
              <tr key={ev.id}>
                <td><span className={styles.eventTypePill}>{ev.eventType}</span></td>
                <td className={styles.descCell} title={ev.eventDescription}>{ev.eventDescription}</td>
                <td className={styles.muted}>{ev.user?.email ?? '—'}</td>
                <td className={styles.muted}>{ev.ipAddress ?? '—'}</td>
                <td className={styles.muted} style={{ whiteSpace: 'nowrap' }}>
                  {new Date(ev.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className={styles.pagination}>
          <button type="button" className={styles.pageBtn} onClick={onPrev} disabled={page <= 1}>← Prev</button>
          <span className={styles.pageInfo}>Page {page} of {pages}</span>
          <button type="button" className={styles.pageBtn} onClick={onNext} disabled={page >= pages}>Next →</button>
        </div>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuditEventsPage() {
  const router = useRouter();

  const [stats,   setStats]   = useState<StatsData | null>(null);
  const [events,  setEvents]  = useState<AuditEvent[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo,   setFilterTo]   = useState('');
  const [applied,    setApplied]    = useState({ type: '', from: '', to: '' });

  const fetchEvents = useCallback((p: number, f: typeof applied) => {
    const sp = new URLSearchParams({ page: String(p), limit: '50' });
    if (f.type) sp.set('eventType', f.type);
    if (f.from) sp.set('from', f.from);
    if (f.to)   sp.set('to',   f.to);
    return fetch(`/api/admin/audit-events?${sp}`)
      .then(r => r.json())
      .then(d => { setEvents(d.events ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1); });
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (!me || me.role !== 'admin') { router.replace('/dashboard'); return; }
        return Promise.all([
          fetch('/api/admin/audit-events/stats').then(r => r.json()),
          fetchEvents(1, applied),
        ]).then(([s]) => setStats(s));
      })
      .catch(() => setError('Failed to load audit data.'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function applyFilters() {
    const f = { type: filterType, from: filterFrom, to: filterTo };
    setApplied(f);
    setPage(1);
    fetchEvents(1, f);
  }

  function resetFilters() {
    setFilterType(''); setFilterFrom(''); setFilterTo('');
    const f = { type: '', from: '', to: '' };
    setApplied(f);
    setPage(1);
    fetchEvents(1, f);
  }

  function goPage(p: number) {
    setPage(p);
    fetchEvents(p, applied);
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">Loading audit events…</div>;

  const statCards = stats ? [
    { icon: 'clipboard',   label: 'Total Events',   value: String(stats.total),        note: 'All time',          toneStyle: { background: 'rgba(232,93,18,0.1)', color: 'var(--dc-accent,#e85d12)' } },
    { icon: 'statusInfo',  label: 'Today',          value: String(stats.todayCount),   note: 'Since midnight',    toneStyle: { background: 'rgba(59,130,246,0.1)', color: '#3b82f6' } },
    { icon: 'people',      label: 'Active Users',   value: String(stats.uniqueUsers),  note: 'Last 30 days',      toneStyle: { background: 'rgba(34,197,94,0.1)',  color: '#22c55e' } },
    { icon: 'warning',     label: 'Top Event',      value: stats.topEventType,         note: 'Most frequent type', toneStyle: { background: 'rgba(245,158,11,0.1)', color: '#f59e0b' } },
  ] : [];

  const eventTypes = stats
    ? stats.byType.slice(0, 15).map(t => t.type)
    : [];

  return (
    <AdminConsoleLayout
      title="Audit Events"
      description={`${total.toLocaleString()} total events · real-time activity and user journey tracking`}
      stats={statCards}
      statusLabel="Live"
    >
      {error && <p className={styles.muted}>{error}</p>}

      {/* ── Charts ── */}
      {stats && (
        <div className={styles.chartRow}>
          {/* Bar chart */}
          <div className={styles.card}>
            <p className={styles.cardTitle}>Events per Day — Last 30 Days</p>
            <BarChart data={stats.byDay} />
          </div>

          {/* Donut chart */}
          <div className={styles.card}>
            <p className={styles.cardTitle}>By Event Type</p>
            <DonutChart data={stats.byType} total={stats.byDay.reduce((s, d) => s + d.count, 0)} />
          </div>
        </div>
      )}

      {/* ── User Journey ── */}
      {stats && (
        <div className={styles.card} style={{ marginBlockEnd: 20 }}>
          <p className={styles.cardTitle}>User Journey — Top Event Transitions (Last 30 Days)</p>
          <JourneySection edges={stats.journeyEdges} />
        </div>
      )}

      {/* ── Events table ── */}
      <div className={styles.card}>
        <p className={styles.cardTitle}>Event Log</p>

        {/* Filters */}
        <div className={styles.filtersBar}>
          <select
            className={styles.filterSelect}
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            aria-label="Filter by event type"
          >
            <option value="">All event types</option>
            {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <input
            type="date"
            className={styles.filterInput}
            value={filterFrom}
            onChange={e => setFilterFrom(e.target.value)}
            aria-label="From date"
          />
          <input
            type="date"
            className={styles.filterInput}
            value={filterTo}
            onChange={e => setFilterTo(e.target.value)}
            aria-label="To date"
          />

          <button type="button" className={styles.filterBtn} onClick={applyFilters}>Apply</button>
          <button type="button" className={`${styles.filterBtn} ${styles.filterBtnSecondary}`} onClick={resetFilters}>Reset</button>
        </div>

        <EventsTable
          events={events}
          page={page}
          pages={pages}
          onPrev={() => goPage(page - 1)}
          onNext={() => goPage(page + 1)}
        />
      </div>
    </AdminConsoleLayout>
  );
}
