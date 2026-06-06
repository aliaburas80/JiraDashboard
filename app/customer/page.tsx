// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Customer View — clean, print-ready delivery summary for external stakeholders.
// No internal jargon, no filters, no technical detail.
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadMetricsWithSource } from '@/lib/storage';
import { getHealthBand, HEALTH_COLORS } from '@/lib/utils';
import type { DashboardMetrics } from '@/types/metrics';

// ── Helpers ───────────────────────────────────────────────────────────────────

const BAND_MESSAGE: Record<string, string> = {
  excellent: 'Delivery is on track and performing excellently.',
  good:      'Delivery is progressing well with minor risks.',
  moderate:  'Delivery is progressing with some areas needing attention.',
  'at-risk': 'Delivery has risks that require prompt action.',
  critical:  'Delivery requires immediate attention and escalation.',
};

const STATUS_LABELS: Record<string, string> = {
  excellent: 'On Track',
  good:      'Progressing',
  moderate:  'Needs Attention',
  'at-risk': 'At Risk',
  critical:  'Critical',
};

function norm(v: unknown): string { return String(v ?? '').trim().toLowerCase(); }

// ── Section components ────────────────────────────────────────────────────────

function MetricPill({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 text-center">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</p>
      <p className="text-3xl font-black leading-none" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
    </div>
  );
}

function RiskRow({ text, level }: { text: string; level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high:   { dot: 'bg-red-500',    bg: 'bg-red-50',    border: 'border-red-200',    label: 'High',   text: 'text-red-800'   },
    medium: { dot: 'bg-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-200',  label: 'Medium', text: 'text-amber-800' },
    low:    { dot: 'bg-slate-400',  bg: 'bg-slate-50',  border: 'border-slate-200',  label: 'Low',    text: 'text-slate-700' },
  }[level];
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${styles.bg} ${styles.border}`}>
      <span className={`mt-1.5 w-2.5 h-2.5 rounded-full ${styles.dot} shrink-0`} />
      <p className={`text-sm leading-snug ${styles.text}`}>{text}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CustomerPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await loadMetricsWithSource();
      if (cancelled) return;
      const data = result.metrics as DashboardMetrics | null;
      if (!data) { router.replace('/'); return; }
      setMetrics(data);
      setLoading(false);
    }
    load().catch(() => { if (!cancelled) router.replace('/'); });
    return () => { cancelled = true; };
  }, [router]);

  if (loading || !metrics) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  const band      = getHealthBand(metrics.healthScore ?? 0);
  const color     = HEALTH_COLORS[band];
  const flow      = (metrics.flow ?? {}) as any;
  const sp        = (metrics.storyPoints ?? {}) as any;
  const items     = (flow.items ?? []) as any[];
  const prediction = metrics.prediction;

  // Derive plain-English risk statements
  const risks: { text: string; level: 'high' | 'medium' | 'low' }[] = [];

  if (metrics.blockedIssues > 0) {
    risks.push({
      text:  `${metrics.blockedIssues} work item${metrics.blockedIssues > 1 ? 's are' : ' is'} currently blocked and cannot proceed without action.`,
      level: metrics.blockedIssues >= 3 ? 'high' : 'medium',
    });
  }
  if (metrics.openDefects > 0) {
    risks.push({
      text:  `${metrics.openDefects} open defect${metrics.openDefects > 1 ? 's' : ''} may affect delivery quality or release readiness.`,
      level: metrics.openDefects >= 5 ? 'high' : 'medium',
    });
  }
  const orphanCount = items.filter((i: any) => i.isOrphan).length;
  if (orphanCount > 0) {
    risks.push({
      text:  `${orphanCount} item${orphanCount > 1 ? 's are' : ' is'} not linked to a delivery area and may not be tracked in progress reporting.`,
      level: orphanCount >= 10 ? 'medium' : 'low',
    });
  }
  if ((flow.critical ?? 0) >= 5) {
    risks.push({
      text:  `${flow.critical} items are in a critical delivery state and need immediate attention.`,
      level: 'high',
    });
  }

  // Feature areas (epics) in progress
  const epicList = ((metrics.epics ?? []) as any[])
    .filter(e => e.epic && e.epic !== 'No epic / parent')
    .slice(0, 5);

  const doneStatuses = new Set(['done', 'closed', 'resolved']);
  const activeCount  = items.filter((i: any) =>
    ['in progress', 'code review', 'qa', 'testing', 'uat'].includes(norm(i.status))
  ).length;

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className={`min-h-screen bg-slate-50 ${printMode ? 'print:bg-white' : ''}`}>

      {/* ── Toolbar (hidden in print) ── */}
      <div className="no-print sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <Link href="/summary" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
          ← Back to Overview
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Customer View — External Stakeholders</span>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition-colors"
          >
            🖨 Print / Save PDF
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 print:py-4">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-8 print:mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Delivery Status Report</p>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight print:text-2xl">Project Delivery Summary</h1>
            <p className="text-sm text-slate-400 mt-1">{today}</p>
          </div>
          {/* Health status badge */}
          <div
            className="flex flex-col items-center shrink-0 rounded-2xl border-4 px-5 py-4 text-center"
            style={{ borderColor: color }}
          >
            <span className="text-4xl font-black leading-none print:text-3xl" style={{ color }}>
              {metrics.healthScore ?? 0}
            </span>
            <span className="text-[11px] font-black uppercase tracking-wider mt-1" style={{ color }}>
              {STATUS_LABELS[band] ?? band}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Delivery Health</span>
          </div>
        </div>

        {/* ── Status summary ── */}
        <div
          className="rounded-2xl border-l-8 px-6 py-5 mb-8 print:mb-4"
          style={{ borderColor: color, background: color + '0D' }}
        >
          <p className="text-base font-black mb-1" style={{ color }}>{BAND_MESSAGE[band]}</p>
          <p className="text-sm text-slate-600">
            {metrics.doneIssues ?? 0} of {metrics.totalIssues ?? 0} work items are complete (
            {metrics.completionRate ?? 0}% overall completion).
            {prediction && !prediction.complete && prediction.daysRemaining != null && (
              ` Estimated completion in approximately ${prediction.daysRemaining} day${prediction.daysRemaining !== 1 ? 's' : ''}${prediction.predictedDate ? ` (${prediction.predictedDate})` : ''}.`
            )}
            {prediction?.complete && ' All work items are complete.'}
          </p>
        </div>

        {/* ── Key metrics ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 print:mb-4 print:grid-cols-4">
          <MetricPill
            label="Completion"
            value={`${metrics.completionRate ?? 0}%`}
            sub={`${metrics.doneIssues} of ${metrics.totalIssues} done`}
            color={color}
          />
          <MetricPill
            label="In Progress"
            value={activeCount}
            sub="items being worked"
            color="#2563eb"
          />
          <MetricPill
            label="Blocked"
            value={metrics.blockedIssues ?? 0}
            sub={metrics.blockedIssues > 0 ? 'need unblocking' : 'none blocked'}
            color={metrics.blockedIssues > 0 ? '#dc2626' : '#16a34a'}
          />
          {sp.totalStoryPoints > 0 ? (
            <MetricPill
              label="Story Points"
              value={`${sp.pointCompletionRate ?? 0}%`}
              sub={`${sp.completedStoryPoints} / ${sp.totalStoryPoints} pts`}
              color="#7c3aed"
            />
          ) : (
            <MetricPill
              label="Quality Issues"
              value={metrics.openDefects ?? 0}
              sub={metrics.openDefects > 0 ? 'open defects' : 'no open defects'}
              color={metrics.openDefects > 0 ? '#dc2626' : '#16a34a'}
            />
          )}
        </div>

        {/* ── Delivery areas ── */}
        {epicList.length > 0 && (
          <section className="mb-8 print:mb-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Delivery Areas</h2>
            <div className="space-y-2">
              {epicList.map((epic: any, i: number) => {
                const pct = epic.progress ?? 0;
                const barColor = pct >= 80 ? '#16a34a' : pct >= 50 ? '#2563eb' : '#f59e0b';
                return (
                  <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-slate-800 truncate max-w-xs">{epic.epic}</p>
                      <span className="text-sm font-black ml-4 shrink-0" style={{ color: barColor }}>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      {epic.completedIssues ?? 0} of {epic.issues ?? 0} items complete
                      {(epic.critical ?? 0) > 0 && ` · ${epic.critical} at risk`}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Risks ── */}
        {risks.length > 0 && (
          <section className="mb-8 print:mb-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Current Risks</h2>
            <div className="space-y-2">
              {risks.map((r, i) => <RiskRow key={i} text={r.text} level={r.level} />)}
            </div>
          </section>
        )}
        {risks.length === 0 && (
          <section className="mb-8 print:mb-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Current Risks</h2>
            <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-800 font-semibold">
              ✓ No significant risks identified at this time.
            </div>
          </section>
        )}

        {/* ── Key insights (business-friendly) ── */}
        {(metrics.insights ?? []).length > 0 && (
          <section className="mb-8 print:mb-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Key Highlights</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-5">
              <ul className="space-y-2.5">
                {(metrics.insights ?? []).slice(0, 4).map((insight: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── Footer ── */}
        <footer className="border-t border-slate-200 pt-6 text-center">
          <p className="text-xs text-slate-400">
            Generated by <strong className="text-slate-600">Delivery Clarity</strong> · {today}
          </p>
          <p className="text-xs text-slate-300 mt-1">
            This report is a delivery summary for stakeholder review. Internal metrics and individual issue details are not included.
          </p>
        </footer>

      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
}
