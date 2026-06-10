// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// /forecast — Delivery forecasting: velocity trend, burn-up, completion ring, sprint analytics.
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { loadMetricsWithSource } from '@/lib/storage';
import type { DashboardMetrics } from '@/types/metrics';

// ── Types ──────────────────────────────────────────────────────────────────────

type ForecastStatus = 'on_track' | 'at_risk' | 'off_track' | 'complete' | 'insufficient_data';

interface SprintPoint { sprint: string; done: number; total: number; cumDone: number; }

interface ForecastResult {
  status:           ForecastStatus;
  totalIssues:      number;
  doneIssues:       number;
  remainingIssues:  number;
  completionPct:    number;
  avgThroughput:    number;
  sprintsRemaining: number;
  weeksRemaining:   number;
  confidence:       'high' | 'medium' | 'low';
  velocityTrend:    'improving' | 'stable' | 'declining';
  adjustments:      string[];
  sprintPoints:     SprintPoint[];
  blockedCount:     number;
  criticalCount:    number;
  estimatedEndDate: string;
}

// ── Engine ─────────────────────────────────────────────────────────────────────

function computeForecast(metrics: DashboardMetrics): ForecastResult {
  const flow    = (metrics.flow?.items ?? []) as any[];
  const sprints = (metrics.sprint?.sprints ?? []) as any[];

  const totalIssues     = flow.length;
  const doneIssues      = flow.filter((i: any) => /^done|complete|closed|resolved/i.test(i.status ?? '')).length;
  const remainingIssues = Math.max(0, totalIssues - doneIssues);
  const blockedCount    = flow.filter((i: any) => i.blocked || /block/i.test(i.status ?? '')).length;
  const criticalCount   = flow.filter((i: any) => /critical|highest/i.test(i.priority ?? '')).length;
  const completionPct   = totalIssues > 0 ? Math.round(doneIssues / totalIssues * 100) : 0;

  const validSprints  = sprints.filter((s: any) => (s.completedCount ?? 0) > 0);
  const avgThroughput = validSprints.length > 0
    ? validSprints.reduce((s: number, x: any) => s + x.completedCount, 0) / validSprints.length
    : 0;

  let cum = 0;
  const sprintPoints: SprintPoint[] = sprints.slice(-12).map((s: any) => {
    cum += s.completedCount ?? 0;
    return { sprint: s.sprint ?? s.name ?? '?', done: s.completedCount ?? 0, total: totalIssues, cumDone: cum };
  });

  let velocityTrend: ForecastResult['velocityTrend'] = 'stable';
  if (validSprints.length >= 3) {
    const recent    = validSprints.slice(-3).map((s: any) => s.completedCount as number);
    const older     = validSprints.slice(0, -3).map((s: any) => s.completedCount as number);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg  = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
    velocityTrend   = recentAvg > olderAvg * 1.1 ? 'improving' : recentAvg < olderAvg * 0.9 ? 'declining' : 'stable';
  }

  if (totalIssues === 0 || avgThroughput === 0) {
    return { status: 'insufficient_data', totalIssues, doneIssues, remainingIssues, completionPct, avgThroughput: 0, sprintsRemaining: 0, weeksRemaining: 0, confidence: 'low', velocityTrend, adjustments: [], sprintPoints, blockedCount, criticalCount, estimatedEndDate: '—' };
  }
  if (remainingIssues === 0) {
    return { status: 'complete', totalIssues, doneIssues, remainingIssues: 0, completionPct: 100, avgThroughput, sprintsRemaining: 0, weeksRemaining: 0, confidence: 'high', velocityTrend, adjustments: [], sprintPoints, blockedCount, criticalCount, estimatedEndDate: 'Complete' };
  }

  const sprintsRemaining = remainingIssues / avgThroughput;
  const weeksRemaining   = Math.ceil(sprintsRemaining * 2);

  const confidence: ForecastResult['confidence'] =
    validSprints.length >= 4 && velocityTrend !== 'declining' && blockedCount === 0 ? 'high' :
    validSprints.length >= 2 && blockedCount < 3 ? 'medium' : 'low';

  const status: ForecastStatus =
    remainingIssues === 0                          ? 'complete'   :
    criticalCount > 2 || blockedCount > 3          ? 'off_track'  :
    sprintsRemaining <= 6                          ? 'on_track'   :
    sprintsRemaining <= 12                         ? 'at_risk'    : 'off_track';

  const adjustments: string[] = [];
  if (blockedCount > 0)               adjustments.push(`Unblock ${blockedCount} blocked item${blockedCount > 1 ? 's' : ''} to recover capacity.`);
  if (criticalCount > 0)              adjustments.push(`Address ${criticalCount} critical item${criticalCount > 1 ? 's' : ''} — they affect forecast confidence.`);
  if (velocityTrend === 'declining')  adjustments.push('Throughput is declining. Reduce WIP and review sprint commitments.');
  if (velocityTrend === 'improving')  adjustments.push('Throughput is improving. Current trajectory is positive.');
  if (remainingIssues > avgThroughput * 10) adjustments.push('Consider descoping low-priority items to hit nearer milestones.');
  if (adjustments.length === 0)       adjustments.push('Velocity is stable. Maintain current pace to deliver on forecast.');

  const endDate = new Date(Date.now() + weeksRemaining * 7 * 86_400_000);
  const estimatedEndDate = endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return { status, totalIssues, doneIssues, remainingIssues, completionPct, avgThroughput: parseFloat(avgThroughput.toFixed(1)), sprintsRemaining: parseFloat(sprintsRemaining.toFixed(1)), weeksRemaining, confidence, velocityTrend, adjustments, sprintPoints, blockedCount, criticalCount, estimatedEndDate };
}

// ── Chart: Completion Ring ─────────────────────────────────────────────────────

function CompletionRing({ pct, color }: { pct: number; color: string }) {
  const r = 52, cx = 68, cy = 68, stroke = 12;
  const circ = 2 * Math.PI * r;
  const fill = circ * (pct / 100);
  return (
    <svg viewBox="0 0 136 136" style={{ width: 136, height: 136 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#323232" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={cx} y={cy - 8}  textAnchor="middle" fontSize="22" fontWeight="800" fontFamily="var(--font-mono, monospace)" fill="#F2F2F2">{pct}%</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize="9"  fill="#505050">COMPLETE</text>
    </svg>
  );
}

// ── Chart: Velocity Bars ───────────────────────────────────────────────────────

function VelocityChart({ points, avg }: { points: SprintPoint[]; avg: number }) {
  if (points.length === 0) return <p className="text-xs text-center py-6" style={{ color: 'var(--dc-p3, #505050)' }}>No sprint data</p>;
  const maxDone = Math.max(...points.map(p => p.done), 1);
  const W = 480; const H = 120; const PL = 28; const PB = 24; const PT = 8; const PR = 8;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const barW = Math.max(6, chartW / points.length * 0.6);
  const gap  = chartW / points.length;

  function barX(i: number) { return PL + i * gap + gap / 2 - barW / 2; }
  function barH(v: number) { return (v / maxDone) * chartH; }
  function barY(v: number) { return PT + chartH - barH(v); }

  const avgY = PT + chartH - (avg / maxDone) * chartH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.25, 0.5, 0.75, 1].map(v => {
        const y = PT + chartH * (1 - v);
        return (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x={PL - 3} y={y + 3} fontSize="8" fill="#505050" textAnchor="end">{Math.round(maxDone * v)}</text>
          </g>
        );
      })}
      <line x1={PL} x2={W - PR} y1={avgY} y2={avgY} stroke="#FF8A4C" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.6" />
      <text x={W - PR - 2} y={avgY - 3} fontSize="7.5" fill="#FF8A4C" textAnchor="end">avg {avg}</text>
      {points.map((p, i) => {
        const bh = Math.max(2, barH(p.done));
        const by = barY(p.done);
        const isRecent = i >= points.length - 3;
        return (
          <g key={i}>
            <rect x={barX(i)} y={by} width={barW} height={bh} rx="3"
              fill={isRecent ? '#FF8A4C' : '#323232'} opacity="0.9" />
            {bh > 14 && (
              <text x={barX(i) + barW / 2} y={by + bh / 2 + 3.5} fontSize="8" fill="#fff" textAnchor="middle" fontWeight="bold">
                {p.done}
              </text>
            )}
            <text x={barX(i) + barW / 2} y={H - 6} fontSize="7" fill="#505050" textAnchor="middle">
              {p.sprint.replace(/sprint\s*/i, 'S').slice(0, 6)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Chart: Burn-up (velocity-aware with confidence band) ──────────────────────

function BurnUpChart({ points, total }: { points: SprintPoint[]; total: number }) {
  if (points.length < 2) return <p className="text-xs text-center py-6" style={{ color: 'var(--dc-p3, #505050)' }}>Need ≥ 2 sprints for burn-up chart.</p>;

  const recentN   = Math.min(3, points.length);
  const recentVel = points.slice(-recentN).reduce((s, p) => s + p.done, 0) / recentN;

  const last      = points[points.length - 1];
  const remaining = Math.max(0, total - last.cumDone);

  const sprintsExp  = recentVel > 0 ? remaining / recentVel          : 0;
  const sprintsOpt  = recentVel > 0 ? remaining / (recentVel * 1.3)  : 0;
  const sprintsPess = recentVel > 0 ? remaining / (recentVel * 0.7)  : 0;

  const maxI  = Math.max(points.length, points.length + Math.ceil(sprintsPess) + 1);
  const W = 480; const H = 155; const PL = 36; const PB = 30; const PT = 12; const PR = 20;
  const chartW = W - PL - PR; const chartH = H - PT - PB;

  function xOf(i: number) { return PL + (i / (maxI - 1)) * chartW; }
  function yOf(v: number) { return PT + chartH - (v / total) * chartH; }

  const actualPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(p.cumDone)}`).join(' ');

  const lx = xOf(points.length - 1);
  const ly = yOf(last.cumDone);
  const ty = yOf(total);

  const expX  = Math.min(W - PR, xOf(points.length - 1 + sprintsExp));
  const optX  = Math.min(W - PR, xOf(points.length - 1 + sprintsOpt));
  const pessX = Math.min(W - PR, xOf(points.length - 1 + sprintsPess));

  const bandPoly = remaining > 0 ? `M${lx},${ly} L${optX},${ty} L${pessX},${ty} Z` : '';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.25, 0.5, 0.75, 1].map(v => (
        <g key={v}>
          <line x1={PL} x2={W - PR} y1={yOf(total * v)} y2={yOf(total * v)} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <text x={PL - 4} y={yOf(total * v) + 4} fontSize="8" fill="#505050" textAnchor="end">{Math.round(total * v)}</text>
        </g>
      ))}
      {points.filter((_, i) => i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 5) === 0).map(p => {
        const idx = points.indexOf(p);
        return <text key={idx} x={xOf(idx)} y={H - 8} fontSize="7.5" fill="#505050" textAnchor="middle">{p.sprint.replace(/sprint\s*/i, 'S').slice(0, 7)}</text>;
      })}
      <line x1={PL} x2={W - PR} y1={ty} y2={ty} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="5 3" />
      <text x={W - PR - 2} y={ty - 3} fontSize="7.5" fill="#505050" textAnchor="end">Scope {total}</text>
      {remaining > 0 && bandPoly && <path d={bandPoly} fill="#FF8A4C" opacity="0.07" />}
      {remaining > 0 && recentVel > 0 && (
        <line x1={lx} y1={ly} x2={pessX} y2={ty} stroke="#F87171" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.75" />
      )}
      {remaining > 0 && recentVel > 0 && (
        <line x1={lx} y1={ly} x2={optX} y2={ty} stroke="#22C55E" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.75" />
      )}
      {remaining > 0 && recentVel > 0 && (
        <line x1={lx} y1={ly} x2={expX} y2={ty} stroke="#909090" strokeWidth="2" strokeDasharray="7 3" />
      )}
      {remaining > 0 && <line x1={lx} x2={lx} y1={PT} y2={PT + chartH} stroke="rgba(255,255,255,0.13)" strokeWidth="1" strokeDasharray="3 2" />}
      <path d={`${actualPath} L${xOf(points.length - 1)},${PT + chartH} L${xOf(0)},${PT + chartH} Z`} fill="#FF8A4C" opacity="0.06" />
      <path d={actualPath} stroke="#FF8A4C" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => <circle key={i} cx={xOf(i)} cy={yOf(p.cumDone)} r="3.5" fill="#FF8A4C" stroke="#0A0A0A" strokeWidth="1.5" />)}
    </svg>
  );
}

// ── Chart: Combined Burn-up + Burn-down (all sprints) ─────────────────────────

function CombinedBurnChart({ points, total }: { points: SprintPoint[]; total: number }) {
  if (points.length < 2) return <p className="text-xs text-center py-6" style={{ color: 'var(--dc-p3, #505050)' }}>Need ≥ 2 sprints for combined chart.</p>;

  const W = 520; const H = 175; const PL = 38; const PB = 30; const PT = 14; const PR = 20;
  const chartW = W - PL - PR; const chartH = H - PT - PB;
  const n = points.length;

  function xOf(i: number) { return PL + (i / (n - 1)) * chartW; }
  function yOf(v: number) { return PT + chartH - (v / total) * chartH; }

  const upPath    = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(p.cumDone)}`).join(' ');
  const downPath  = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(total - p.cumDone)}`).join(' ');
  const scopeY    = yOf(total);
  const zeroY     = yOf(0);
  const doneIdx   = points.findIndex(p => p.cumDone >= total);
  const idealDown = `M${xOf(0)},${yOf(total)} L${xOf(n - 1)},${yOf(0)}`;

  const labelIdx = new Set([0, n - 1]);
  const step = Math.ceil(n / 5);
  for (let i = step; i < n - 1; i += step) labelIdx.add(i);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.25, 0.5, 0.75, 1].map(v => {
        const y = yOf(total * v);
        return (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x={PL - 4} y={y + 4} fontSize="8" fill="#505050" textAnchor="end">{Math.round(total * v)}</text>
          </g>
        );
      })}
      {[...labelIdx].map(idx => (
        <text key={idx} x={xOf(idx)} y={H - 7} fontSize="7.5" fill="#505050" textAnchor="middle">
          {points[idx].sprint.replace(/sprint\s*/i, 'S').slice(0, 7)}
        </text>
      ))}
      <line x1={PL} x2={W - PR} y1={scopeY} y2={scopeY} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="5 3" />
      <line x1={PL} x2={W - PR} y1={zeroY}  y2={zeroY}  stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <path d={idealDown} stroke="#505050" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" fill="none" />
      <path d={`${downPath} L${xOf(n - 1)},${scopeY} L${xOf(0)},${scopeY} Z`} fill="#E85D12" opacity="0.05" />
      <path d={`${upPath} L${xOf(n - 1)},${zeroY} L${xOf(0)},${zeroY} Z`} fill="#22C55E" opacity="0.07" />
      <path d={downPath} stroke="#E85D12" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={upPath}   stroke="#22C55E" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xOf(i)} cy={yOf(p.cumDone)}         r="3.5" fill="#22C55E" stroke="#0A0A0A" strokeWidth="1.5" />
          <circle cx={xOf(i)} cy={yOf(total - p.cumDone)} r="3.5" fill="#E85D12" stroke="#0A0A0A" strokeWidth="1.5" />
        </g>
      ))}
      {doneIdx >= 0 && (
        <g>
          <circle cx={xOf(doneIdx)} cy={yOf(total / 2)} r="8" fill="#22C55E" opacity="0.2" />
          <circle cx={xOf(doneIdx)} cy={yOf(total / 2)} r="4" fill="#22C55E" />
          <line x1={xOf(doneIdx)} x2={xOf(doneIdx)} y1={PT} y2={PT + chartH} stroke="#22C55E" strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />
        </g>
      )}
      <text x={W - PR - 2} y={scopeY - 3} fontSize="7.5" fill="#505050" textAnchor="end">Scope {total}</text>
    </svg>
  );
}

// ── Status meta ────────────────────────────────────────────────────────────────

const STATUS_META = {
  on_track:          { label: 'On Track',         color: '#22C55E', bg: 'rgba(34,197,94,0.07)',   border: 'rgba(34,197,94,0.18)',   text: '#4ade80', icon: '✅' },
  at_risk:           { label: 'At Risk',           color: '#F59E0B', bg: 'rgba(245,158,11,0.07)',  border: 'rgba(245,158,11,0.18)',  text: '#fcd34d', icon: '⚠️' },
  off_track:         { label: 'Off Track',         color: '#F87171', bg: 'rgba(248,113,113,0.07)', border: 'rgba(248,113,113,0.18)', text: '#fca5a5', icon: '❌' },
  complete:          { label: 'Complete',          color: '#FF8A4C', bg: 'rgba(232,93,18,0.07)',   border: 'rgba(232,93,18,0.18)',   text: '#FF8A4C', icon: '🎉' },
  insufficient_data: { label: 'Insufficient Data', color: '#F59E0B', bg: 'rgba(245,158,11,0.05)',  border: 'rgba(245,158,11,0.18)',  text: '#F59E0B', icon: 'ℹ️' },
};

const CONF_META = {
  high:   { cls: 'chip c-gr', label: 'High confidence' },
  medium: { cls: 'chip c-am', label: 'Medium confidence' },
  low:    { cls: 'chip c-am', label: 'Low confidence' },
};

const TREND_META = {
  improving: { icon: '↑', color: 'var(--dc-green, #22C55E)', label: 'Velocity improving' },
  stable:    { icon: '→', color: 'var(--dc-acc2, #FF8A4C)',  label: 'Velocity stable' },
  declining: { icon: '↓', color: 'var(--dc-red, #F87171)',   label: 'Velocity declining' },
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ForecastPage() {
  const router  = useRouter();
  const [result,  setResult]  = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const r = await loadMetricsWithSource();
      const m = r.metrics as DashboardMetrics | null;
      if (!m) { router.replace('/'); return; }
      setResult(computeForecast(m));
      setLoading(false);
    }
    load().catch(() => router.replace('/'));
  }, [router]);

  if (loading) return <AppShell showNav><div className="flex items-center justify-center h-64 animate-pulse" style={{ color: 'var(--dc-p3, #505050)' }}>Computing forecast…</div></AppShell>;
  if (!result)  return null;

  const meta  = STATUS_META[result.status];
  const trend = TREND_META[result.velocityTrend];

  return (
    <AppShell showNav>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold mb-3"
            style={{ background: 'rgba(232,93,18,0.10)', color: 'var(--dc-acc2, #FF8A4C)' }}>
            🔮 Planning
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-1" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>Delivery Forecast</h1>
          <p className="text-sm" style={{ color: 'var(--dc-p2, #909090)' }}>Velocity-based delivery outlook — shareable in meetings.</p>
        </div>

        {/* ── Status Hero Banner ── */}
        <div className="rounded-2xl p-5 mb-5 flex items-center gap-5"
          style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
          <div className="text-5xl leading-none">{meta.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-black" style={{ color: meta.text }}>{meta.label}</h2>
              <span className={CONF_META[result.confidence].cls} style={{ fontSize: 10, borderRadius: 100 }}>
                {CONF_META[result.confidence].label}
              </span>
            </div>
            {result.status === 'insufficient_data' ? (
              <p className="text-sm" style={{ color: 'var(--dc-p2, #909090)' }}>Upload Jira data with sprint history to generate a forecast.</p>
            ) : result.status === 'complete' ? (
              <p className="text-sm font-semibold" style={{ color: meta.text }}>All {result.totalIssues} issues are complete. 🎉</p>
            ) : (
              <p className="text-sm" style={{ color: meta.text, opacity: 0.85 }}>
                <strong>~{result.weeksRemaining} weeks</strong> to complete {result.remainingIssues} remaining issues
                at <strong>{result.avgThroughput} items/sprint</strong>.
                Estimated completion: <strong>{result.estimatedEndDate}</strong>.
              </p>
            )}
          </div>
          {result.status !== 'insufficient_data' && result.status !== 'complete' && (
            <div className="text-center shrink-0 rounded-2xl px-5 py-3"
              style={{ background: 'var(--dc-s1, #141414)', border: `1px solid ${meta.border}` }}>
              <p className="text-3xl font-black" style={{ color: meta.color }}>{result.weeksRemaining}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--dc-p3, #505050)' }}>weeks est.</p>
            </div>
          )}
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Issues',                             value: result.totalIssues,                                         icon: '📋', color: 'var(--dc-p1, #F2F2F2)' },
            { label: `Done (${result.completionPct}%)`,          value: result.doneIssues,                                          icon: '✅', color: 'var(--dc-green, #22C55E)' },
            { label: 'Remaining',                                value: result.remainingIssues,                                     icon: '⏳', color: result.remainingIssues > 0 ? 'var(--dc-amber, #F59E0B)' : 'var(--dc-p3, #505050)' },
            { label: 'Avg / Sprint',                             value: result.avgThroughput > 0 ? `${result.avgThroughput}` : '—', icon: '⚡', color: 'var(--dc-acc2, #FF8A4C)' },
          ].map(c => (
            <div key={c.label} className="rounded-2xl p-4 text-center"
              style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
              <p className="text-lg mb-1">{c.icon}</p>
              <p className="text-2xl font-black" style={{ color: c.color }}>{c.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: 'var(--dc-p3, #505050)' }}>{c.label}</p>
            </div>
          ))}
        </div>

        {/* ── Combined Burn-up + Burn-down ── */}
        <div className="rounded-2xl p-5 mb-5"
          style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-black" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>Sprint Burn-up &amp; Burn-down</h2>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--dc-p3, #505050)' }}>All sprints — rising green = work done · falling orange = work remaining · lines converge at project completion</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] shrink-0" style={{ color: 'var(--dc-p3, #505050)' }}>
              <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 rounded" style={{ background: '#22C55E' }} /> Burn-up</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5 rounded" style={{ background: '#E85D12' }} /> Burn-down</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-4 h-0.5" style={{ background: '#505050' }} /> Ideal</span>
            </div>
          </div>
          <CombinedBurnChart points={result.sprintPoints} total={result.totalIssues} />
        </div>

        {/* ── Two-column: Ring + Burn-up ── */}
        <div className="grid grid-cols-3 gap-4 mb-5">

          {/* Left: Completion ring + trend */}
          <div className="rounded-2xl p-5 flex flex-col items-center justify-center gap-4"
            style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
            <CompletionRing pct={result.completionPct} color="var(--dc-acc2, #FF8A4C)" />

            {/* Trend pill */}
            <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: trend.color }}>
              <span className="text-base">{trend.icon}</span>
              {trend.label}
            </div>

            {/* Mini risk row */}
            <div className="w-full grid grid-cols-2 gap-2 mt-1">
              <div className="text-center rounded-xl p-2"
                style={{
                  background: result.blockedCount > 0 ? 'rgba(248,113,113,0.08)' : 'var(--dc-s1, #141414)',
                  border: result.blockedCount > 0 ? '1px solid rgba(248,113,113,0.18)' : '1px solid var(--dc-bdr, rgba(255,255,255,0.07))',
                }}>
                <p className="text-lg font-black" style={{ color: result.blockedCount > 0 ? 'var(--dc-red, #F87171)' : 'var(--dc-p3, #505050)' }}>{result.blockedCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--dc-p3, #505050)' }}>Blocked</p>
              </div>
              <div className="text-center rounded-xl p-2"
                style={{
                  background: result.criticalCount > 0 ? 'rgba(245,158,11,0.08)' : 'var(--dc-s1, #141414)',
                  border: result.criticalCount > 0 ? '1px solid rgba(245,158,11,0.18)' : '1px solid var(--dc-bdr, rgba(255,255,255,0.07))',
                }}>
                <p className="text-lg font-black" style={{ color: result.criticalCount > 0 ? 'var(--dc-amber, #F59E0B)' : 'var(--dc-p3, #505050)' }}>{result.criticalCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--dc-p3, #505050)' }}>Critical</p>
              </div>
            </div>
          </div>

          {/* Right: Burn-up chart */}
          <div className="col-span-2 rounded-2xl p-5"
            style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>Burn-up Chart</h2>
              <div className="flex items-center gap-3 text-[10px] flex-wrap" style={{ color: 'var(--dc-p3, #505050)' }}>
                <span className="flex items-center gap-1"><span className="w-4 h-0.5 inline-block rounded" style={{ background: '#FF8A4C' }} /> Actual</span>
                <span className="flex items-center gap-1"><span className="w-4 h-0.5 inline-block" style={{ borderTop: '2px dashed #909090' }} /> Expected</span>
                <span className="flex items-center gap-1"><span className="w-4 h-0.5 inline-block" style={{ background: '#22C55E' }} /> Optimistic</span>
                <span className="flex items-center gap-1"><span className="w-4 h-0.5 inline-block" style={{ background: '#F87171' }} /> Pessimistic</span>
              </div>
            </div>
            <BurnUpChart points={result.sprintPoints} total={result.totalIssues} />
          </div>
        </div>

        {/* ── Velocity Bar Chart ── */}
        <div className="rounded-2xl p-5 mb-5"
          style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>Sprint Velocity</h2>
            <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--dc-p3, #505050)' }}>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block" style={{ background: '#FF8A4C' }} /> Last 3 sprints</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded inline-block" style={{ background: '#323232' }} /> Earlier</span>
              <span className="font-bold" style={{ color: trend.color }}>{trend.icon} {trend.label}</span>
            </div>
          </div>
          <VelocityChart points={result.sprintPoints} avg={result.avgThroughput} />
        </div>

        {/* ── Sprint performance table ── */}
        {result.sprintPoints.length > 0 && (
          <div className="rounded-2xl p-5 mb-5"
            style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
            <h2 className="text-sm font-black mb-3" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>Sprint Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr style={{ background: 'var(--dc-s1, #141414)', borderBottom: '1px solid var(--dc-bdr2, rgba(255,255,255,0.13))' }}>
                    <th className="text-left px-3 py-2 font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--dc-p3, #505050)' }}>Sprint</th>
                    <th className="text-right px-3 py-2 font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--dc-p3, #505050)' }}>Completed</th>
                    <th className="text-right px-3 py-2 font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--dc-p3, #505050)' }}>Cumulative</th>
                    <th className="text-right px-3 py-2 font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--dc-p3, #505050)' }}>vs Avg</th>
                    <th className="px-3 py-2 font-bold uppercase tracking-wider text-[10px]" style={{ color: 'var(--dc-p3, #505050)' }}>Pace</th>
                  </tr>
                </thead>
                <tbody>
                  {result.sprintPoints.map((p, i) => {
                    const vs      = result.avgThroughput > 0 ? ((p.done - result.avgThroughput) / result.avgThroughput * 100) : 0;
                    const vsColor = vs > 10 ? 'var(--dc-green, #22C55E)' : vs < -10 ? 'var(--dc-red, #F87171)' : 'var(--dc-p3, #505050)';
                    const barPct  = result.avgThroughput > 0 ? Math.min(100, (p.done / (result.avgThroughput * 1.5)) * 100) : 0;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}
                        className="transition-colors hover:[&>td]:bg-[rgba(255,255,255,0.025)]">
                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--dc-p2, #909090)' }}>{p.sprint.replace(/sprint\s*/i, 'Sprint ')}</td>
                        <td className="px-3 py-2 text-right font-bold" style={{ color: 'var(--dc-green, #22C55E)' }}>{p.done}</td>
                        <td className="px-3 py-2 text-right" style={{ color: 'var(--dc-p2, #909090)' }}>{p.cumDone}</td>
                        <td className="px-3 py-2 text-right font-bold" style={{ color: vsColor }}>{vs >= 0 ? '+' : ''}{Math.round(vs)}%</td>
                        <td className="px-3 py-2 min-w-[100px]">
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--dc-s3, #282828)' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, background: vs > 10 ? '#22C55E' : vs < -10 ? '#F87171' : '#FF8A4C' }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Next Quarter Plan ── */}
        <div className="rounded-2xl p-5 mb-5"
          style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
          <h2 className="text-sm font-black mb-3" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>📅 Next Quarter Plan</h2>
          {result.avgThroughput > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Capacity (6 sprints)', value: Math.round(result.avgThroughput * 6), color: 'var(--dc-acc2, #FF8A4C)' },
                  { label: 'Remaining backlog',    value: result.remainingIssues,               color: result.remainingIssues > result.avgThroughput * 6 ? 'var(--dc-red, #F87171)' : 'var(--dc-green, #22C55E)' },
                  { label: 'Gap',                  value: Math.max(0, result.remainingIssues - Math.round(result.avgThroughput * 6)), color: 'var(--dc-amber, #F59E0B)' },
                ].map(s => (
                  <div key={s.label} className="text-center rounded-xl p-3"
                    style={{ background: 'var(--dc-s1, #141414)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
                    <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: 'var(--dc-p3, #505050)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
              {result.remainingIssues <= result.avgThroughput * 6
                ? <p className="text-sm font-semibold rounded-xl px-4 py-2.5"
                    style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', color: '#4ade80' }}>✅ Full backlog is achievable within one quarter at current velocity.</p>
                : <p className="text-sm font-semibold rounded-xl px-4 py-2.5"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#fcd34d' }}>⚠️ Backlog exceeds quarterly capacity — consider descoping or splitting into milestones.</p>
              }
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--dc-p3, #505050)' }}>Upload Jira data with sprint history for quarterly planning.</p>
          )}
        </div>

        {/* ── Recommendations ── */}
        <div className="rounded-2xl p-5"
          style={{ background: 'var(--dc-s2, #1E1E1E)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))' }}>
          <h2 className="text-sm font-black mb-3" style={{ color: 'var(--dc-p1, #F2F2F2)' }}>💡 Recommendations</h2>
          <ul className="space-y-2">
            {result.adjustments.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm rounded-xl px-4 py-2.5"
                style={{ background: 'var(--dc-s3, #282828)', border: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', color: 'var(--dc-p2, #909090)' }}>
                <span className="mt-0.5 shrink-0 font-bold" style={{ color: 'var(--dc-acc2, #FF8A4C)' }}>→</span>
                {a}
              </li>
            ))}
          </ul>
          <p className="text-[10px] mt-4 pt-3" style={{ borderTop: '1px solid var(--dc-bdr, rgba(255,255,255,0.07))', color: 'var(--dc-p3, #505050)' }}>
            Model: linear velocity extrapolation · 2-week sprints assumed · Confidence reflects data completeness and velocity stability.
          </p>
        </div>

      </div>
    </AppShell>
  );
}
