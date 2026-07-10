// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// /forecast — Delivery forecasting: velocity trend, burn-up, sprint analytics, pattern insights.
'use client';
import { CSSProperties, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { loadMetricsWithSource } from '@/lib/storage';
import { computeForecast } from '@/services/forecast/forecastEngine.service';
import type { DashboardMetrics } from '@/types/metrics';
import type { SprintThroughputSummary, SprintThroughput, SprintDeliveryPattern } from '@/types/throughput';
import type { ForecastResult, SprintPoint } from '@/types/forecast';
import styles from './page.module.scss';

// ── Chart: Completion Ring ─────────────────────────────────────────────────────

function CompletionRing({ pct, color }: { pct: number; color: string }) {
  const r = 52, cx = 68, cy = 68, stroke = 12;
  const circ = 2 * Math.PI * r;
  const fill = circ * (pct / 100);
  return (
    <svg viewBox="0 0 136 136" className={styles.ringCanvas}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#323232" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${fill} ${circ - fill}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy - 8}  textAnchor="middle" fontSize="22" fontWeight="800" fontFamily="var(--font-mono, monospace)" fill="#F2F2F2">{pct}%</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize="9"  fill="#505050">COMPLETE</text>
    </svg>
  );
}

// ── Chart: Velocity Bars ───────────────────────────────────────────────────────

function VelocityChart({ points, avg }: { points: SprintPoint[]; avg: number }) {
  if (points.length === 0) return <p className={styles.emptyChart}>No sprint data</p>;
  const maxDone = Math.max(...points.map(p => p.done), 1);
  const W = 580; const H = 200; const PL = 36; const PB = 32; const PT = 12; const PR = 10;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;
  const barW = Math.max(8, Math.min(28, chartW / points.length * 0.55));
  const gap   = chartW / points.length;

  function barX(i: number) { return PL + i * gap + gap / 2 - barW / 2; }
  function barH(v: number) { return Math.max(3, (v / maxDone) * chartH); }
  function barY(v: number) { return PT + chartH - barH(v); }

  const avgY = PT + chartH - (avg / maxDone) * chartH;

  // Show max 8 x-axis labels
  const maxLabels = 8;
  const labelStep = Math.max(1, Math.ceil(points.length / maxLabels));
  const showLabel = (i: number) => i === 0 || i === points.length - 1 || i % labelStep === 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.25, 0.5, 0.75, 1].map(v => {
        const y = PT + chartH * (1 - v);
        return (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <text x={PL - 4} y={y + 4} fontSize="9" fill="#505050" textAnchor="end">{Math.round(maxDone * v)}</text>
          </g>
        );
      })}
      <line
        x1={PL} x2={W - PR} y1={avgY} y2={avgY}
        stroke="#FF8A4C" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.7"
        className={styles.pathFade}
        style={{ '--fade-delay': '1s' } as React.CSSProperties}
      />
      <text x={W - PR - 4} y={avgY - 4} fontSize="9" fill="#FF8A4C" textAnchor="end">avg {avg}</text>
      {points.map((p, i) => {
        const bh = barH(p.done);
        const by = barY(p.done);
        const isRecent = i >= points.length - 3;
        const delay = `${0.05 + i * 0.035}s`;
        return (
          <g key={i}>
            <rect
              x={barX(i)} y={by} width={barW} height={bh} rx="3"
              fill={isRecent ? '#FF8A4C' : '#323232'} opacity="0.92"
              className={styles.barAnim}
              style={{ '--bar-delay': delay } as React.CSSProperties}
            />
            {bh > 18 && (
              <text x={barX(i) + barW / 2} y={by + bh / 2 + 4} fontSize="8.5" fill="#fff" textAnchor="middle" fontWeight="bold">
                {p.done}
              </text>
            )}
            {showLabel(i) && (
              <text x={barX(i) + barW / 2} y={H - 8} fontSize="8" fill="#606060" textAnchor="middle">
                {p.sprint.replace(/sprint\s*/i, 'S').slice(0, 7)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Chart: Burn-up (with confidence band, staggered labels, forecast dates) ───

function BurnUpChart({ points, total }: { points: SprintPoint[]; total: number }) {
  if (points.length < 2) return <p className={styles.emptyChart}>Need ≥ 2 sprints for burn-up chart.</p>;

  const recentN   = Math.min(3, points.length);
  const recentVel = points.slice(-recentN).reduce((s, p) => s + p.done, 0) / recentN;
  const last      = points[points.length - 1];
  const remaining = Math.max(0, total - last.cumDone);

  const sprintsExp  = recentVel > 0 ? remaining / recentVel         : 0;
  const sprintsOpt  = recentVel > 0 ? remaining / (recentVel * 1.3) : 0;
  const sprintsPess = recentVel > 0 ? remaining / (recentVel * 0.7) : 0;

  // Cap forecast extension so chart stays readable
  const forecastSprints = Math.min(Math.ceil(sprintsPess) + 2, 40);
  const maxI = Math.max(points.length, points.length + forecastSprints);

  // PT=58: top area holds forecast-date summary + "Today" label
  // PB=92: bottom area holds two staggered rows of sprint labels
  const W = 720; const H = 400; const PL = 58; const PB = 92; const PT = 58; const PR = 24;
  const chartW = W - PL - PR; const chartH = H - PT - PB;

  function xOf(i: number) { return PL + (i / Math.max(maxI - 1, 1)) * chartW; }
  function yOf(v: number) { return PT + chartH - (v / Math.max(total, 1)) * chartH; }

  const actualPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(p.cumDone).toFixed(1)}`).join(' ');
  const lx  = xOf(points.length - 1);
  const ly  = yOf(last.cumDone);
  const ty  = yOf(total);
  const baseY = PT + chartH; // x-axis baseline

  const expX  = Math.min(W - PR - 4, xOf(points.length - 1 + sprintsExp));
  const optX  = Math.min(W - PR - 4, xOf(points.length - 1 + sprintsOpt));
  const pessX = Math.min(W - PR - 4, xOf(points.length - 1 + sprintsPess));

  const bandPoly = remaining > 0
    ? `M${lx.toFixed(1)},${ly.toFixed(1)} L${optX.toFixed(1)},${ty.toFixed(1)} L${pessX.toFixed(1)},${ty.toFixed(1)} Z`
    : '';

  // Forecast completion dates (2-week sprint assumption)
  const today = new Date();
  const msPerSprint = 14 * 24 * 3600 * 1000;
  const fmtDate = (sprints: number): string => {
    if (sprints <= 0) return 'Done';
    const totalWeeks = Math.round(sprints * 2);
    if (totalWeeks > 260) return `~${Math.round(totalWeeks / 52)} yrs`;
    if (totalWeeks > 104) return `~${(totalWeeks / 52).toFixed(1)} yrs`;
    const d = new Date(today.getTime() + sprints * msPerSprint);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Staggered x-axis labels — minimum 52px gap enforced
  const minGap = 52;
  const shownIdx: number[] = [];
  points.forEach((_, i) => {
    const x = xOf(i);
    const prev = shownIdx.at(-1);
    if (prev === undefined || x - xOf(prev) >= minGap) shownIdx.push(i);
  });
  if (shownIdx.at(-1) !== points.length - 1) shownIdx.push(points.length - 1);

  // Two-row stagger: even = upper (baseY+20), odd = lower (baseY+44)
  const ROW_Y = [baseY + 20, baseY + 44];

  const calloutY = Math.max(PT + 20, ly - 18);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">

      {/* ── Forecast date summary (top-left area, fades in last) ── */}
      {remaining > 0 && recentVel > 0 && (
        <g className={styles.pathFade} style={{ '--fade-delay': '1.5s' } as React.CSSProperties}>
          <text x={PL + 6} y={16} fontSize="10" fill="#22C55E" textAnchor="start" fontWeight="700">
            Best — {fmtDate(sprintsOpt)}
          </text>
          <text x={PL + 6} y={32} fontSize="10" fill="#888" textAnchor="start" fontWeight="600">
            → Expected — {fmtDate(sprintsExp)}
          </text>
          <text x={PL + 6} y={48} fontSize="10" fill="#F87171" textAnchor="start" fontWeight="700">
            Worst — {fmtDate(sprintsPess)}
          </text>
        </g>
      )}

      {/* ── Grid ── */}
      {[0, 0.25, 0.5, 0.75, 1].map(v => (
        <g key={v}>
          <line x1={PL} x2={W - PR} y1={yOf(total * v)} y2={yOf(total * v)}
            stroke="rgba(128,128,128,0.13)" strokeWidth="1" />
          <text x={PL - 10} y={yOf(total * v) + 4} fontSize="11" fill="#707070" textAnchor="end">
            {Math.round(total * v)}
          </text>
        </g>
      ))}

      {/* ── X-axis baseline ── */}
      <line x1={PL} x2={W - PR} y1={baseY} y2={baseY}
        stroke="rgba(128,128,128,0.2)" strokeWidth="1" />

      {/* ── Staggered sprint labels with tick marks ── */}
      {shownIdx.map((idx, li) => {
        const x     = xOf(idx);
        const row   = li % 2;
        const labelY = ROW_Y[row];
        const tickY  = baseY + (row === 0 ? 18 : 42);
        return (
          <g key={idx}>
            <line x1={x} x2={x} y1={baseY} y2={tickY}
              stroke="rgba(128,128,128,0.28)" strokeWidth="1" />
            <text x={x} y={labelY} fontSize="10" fill="#606060" textAnchor="middle">
              {points[idx].sprint.slice(0, 13)}
            </text>
          </g>
        );
      })}

      {/* ── Scope line + label ── */}
      <line x1={PL} x2={W - PR} y1={ty} y2={ty}
        stroke="rgba(100,100,100,0.30)" strokeWidth="1.5" strokeDasharray="6 4" />
      <text x={W - PR - 6} y={ty - 6} fontSize="11" fill="#888" textAnchor="end" fontWeight="600">
        Scope {total}
      </text>

      {/* ── Confidence band ── */}
      {remaining > 0 && bandPoly && (
        <path d={bandPoly} fill="#FF8A4C" opacity="0.04"
          className={styles.pathFade} style={{ '--fade-delay': '1.05s' } as React.CSSProperties} />
      )}

      {/* ── Forecast lines ── */}
      {remaining > 0 && recentVel > 0 && (
        <line x1={lx} y1={ly} x2={pessX} y2={ty}
          stroke="#F87171" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.6"
          className={styles.pathFade} style={{ '--fade-delay': '1.1s' } as React.CSSProperties} />
      )}
      {remaining > 0 && recentVel > 0 && (
        <line x1={lx} y1={ly} x2={optX} y2={ty}
          stroke="#22C55E" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.65"
          className={styles.pathFade} style={{ '--fade-delay': '1.15s' } as React.CSSProperties} />
      )}
      {remaining > 0 && recentVel > 0 && (
        <line x1={lx} y1={ly} x2={expX} y2={ty}
          stroke="#888" strokeWidth="2" strokeDasharray="8 4" opacity="0.8"
          className={styles.pathFade} style={{ '--fade-delay': '1.05s' } as React.CSSProperties} />
      )}

      {/* ── "Today" marker ── */}
      {remaining > 0 && (
        <g>
          <line x1={lx} x2={lx} y1={PT} y2={baseY}
            stroke="rgba(255,138,76,0.22)" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x={lx} y={PT - 6} fontSize="10" fill="rgba(200,100,0,0.75)" textAnchor="middle" fontWeight="700">
            Today
          </text>
        </g>
      )}

      {/* ── Actual area fill ── */}
      <path
        d={`${actualPath} L${lx.toFixed(1)},${baseY.toFixed(1)} L${xOf(0).toFixed(1)},${baseY.toFixed(1)} Z`}
        fill="#FF8A4C" opacity="0.05"
        className={styles.pathFade} style={{ '--fade-delay': '0.3s' } as React.CSSProperties}
      />

      {/* ── Actual line — animated draw ── */}
      <path
        d={actualPath} pathLength="1"
        stroke="#FF8A4C" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"
        className={styles.pathDraw}
        style={{ '--draw-dur': '1.6s', '--draw-delay': '0.1s' } as React.CSSProperties}
      />

      {/* ── Data dots ── */}
      {points.map((p, i) => (
        <circle key={i}
          cx={xOf(i)} cy={yOf(p.cumDone)} r="5"
          fill="#FF8A4C" stroke="#fff" strokeWidth="2"
          className={styles.dotPop}
          style={{ '--dot-delay': `${0.3 + i * 0.04}s` } as React.CSSProperties}
        />
      ))}

      {/* ── "X done" callout badge ── */}
      {points.length > 0 && (
        <g className={styles.pathFade} style={{ '--fade-delay': '1.7s' } as React.CSSProperties}>
          <rect x={lx + 10} y={calloutY - 15} width={82} height={22} rx="5"
            fill="#FF8A4C" opacity="0.14" />
          <text x={lx + 51} y={calloutY + 1} fontSize="11" fill="#c05000" textAnchor="middle" fontWeight="700">
            {last.cumDone.toLocaleString()} done
          </text>
        </g>
      )}
    </svg>
  );
}

// ── Chart: Combined Burn-up + Burn-down ───────────────────────────────────────

function CombinedBurnChart({ points, total }: { points: SprintPoint[]; total: number }) {
  if (points.length < 2) return <p className={styles.emptyChart}>Need ≥ 2 sprints for combined chart.</p>;

  const W = 580; const H = 280; const PL = 48; const PB = 44; const PT = 16; const PR = 24;
  const chartW = W - PL - PR; const chartH = H - PT - PB;
  const n = points.length;

  function xOf(i: number) { return PL + (i / Math.max(n - 1, 1)) * chartW; }
  function yOf(v: number) { return PT + chartH - (v / Math.max(total, 1)) * chartH; }

  const upPath    = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(p.cumDone).toFixed(1)}`).join(' ');
  const downPath  = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(total - p.cumDone).toFixed(1)}`).join(' ');
  const scopeY    = yOf(total);
  const zeroY     = yOf(0);
  const doneIdx   = points.findIndex(p => p.cumDone >= total);
  const idealDown = `M${xOf(0).toFixed(1)},${yOf(total).toFixed(1)} L${xOf(n - 1).toFixed(1)},${yOf(0).toFixed(1)}`;

  // Max 7 labels
  const maxLabels = 7;
  const labelStep = Math.max(1, Math.ceil(n / maxLabels));
  const showLabel = (i: number) => i === 0 || i === n - 1 || i % labelStep === 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(v => {
        const y = yOf(total * v);
        return (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="rgba(128,128,128,0.12)" strokeWidth="1" />
            <text x={PL - 6} y={y + 4} fontSize="10" fill="#606060" textAnchor="end">{Math.round(total * v)}</text>
          </g>
        );
      })}

      {/* X-axis labels */}
      {points.map((p, i) => showLabel(i) && (
        <text key={i} x={xOf(i)} y={H - 12} fontSize="9" fill="#606060" textAnchor="middle">
          {p.sprint.replace(/sprint\s*/i, 'S').slice(0, 8)}
        </text>
      ))}

      {/* Scope & zero lines */}
      <line x1={PL} x2={W - PR} y1={scopeY} y2={scopeY} stroke="rgba(128,128,128,0.35)" strokeWidth="1.5" strokeDasharray="5 3" />
      <line x1={PL} x2={W - PR} y1={zeroY}  y2={zeroY}  stroke="rgba(128,128,128,0.18)" strokeWidth="1" />
      <text x={W - PR - 4} y={scopeY - 5} fontSize="10" fill="#707070" textAnchor="end" fontWeight="600">Scope {total}</text>

      {/* Ideal burn-down */}
      <path d={idealDown} stroke="#888" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" fill="none"
        className={styles.pathFade} style={{ '--fade-delay': '0.3s' } as React.CSSProperties} />

      {/* Area fills */}
      <path d={`${downPath} L${xOf(n - 1).toFixed(1)},${scopeY.toFixed(1)} L${xOf(0).toFixed(1)},${scopeY.toFixed(1)} Z`}
        fill="#E85D12" opacity="0.05"
        className={styles.pathFade} style={{ '--fade-delay': '0.2s' } as React.CSSProperties} />
      <path d={`${upPath} L${xOf(n - 1).toFixed(1)},${zeroY.toFixed(1)} L${xOf(0).toFixed(1)},${zeroY.toFixed(1)} Z`}
        fill="#22C55E" opacity="0.07"
        className={styles.pathFade} style={{ '--fade-delay': '0.2s' } as React.CSSProperties} />

      {/* Burn-down line */}
      <path d={downPath} pathLength="1"
        stroke="#E85D12" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
        className={styles.pathDraw}
        style={{ '--draw-dur': '1.2s', '--draw-delay': '0.1s' } as React.CSSProperties} />

      {/* Burn-up line */}
      <path d={upPath} pathLength="1"
        stroke="#22C55E" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
        className={styles.pathDraw}
        style={{ '--draw-dur': '1.2s', '--draw-delay': '0.25s' } as React.CSSProperties} />

      {/* Dots */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xOf(i)} cy={yOf(p.cumDone)}         r="4" fill="#22C55E" stroke="#111" strokeWidth="1.5"
            className={styles.dotPop} style={{ '--dot-delay': `${0.4 + i * 0.04}s` } as React.CSSProperties} />
          <circle cx={xOf(i)} cy={yOf(total - p.cumDone)} r="4" fill="#E85D12" stroke="#111" strokeWidth="1.5"
            className={styles.dotPop} style={{ '--dot-delay': `${0.5 + i * 0.04}s` } as React.CSSProperties} />
        </g>
      ))}

      {/* Completion marker */}
      {doneIdx >= 0 && (
        <g>
          <circle cx={xOf(doneIdx)} cy={yOf(total / 2)} r="10" fill="#22C55E" opacity="0.15" />
          <circle cx={xOf(doneIdx)} cy={yOf(total / 2)} r="5"  fill="#22C55E" />
          <line x1={xOf(doneIdx)} x2={xOf(doneIdx)} y1={PT} y2={PT + chartH}
            stroke="#22C55E" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.45" />
        </g>
      )}
    </svg>
  );
}

// ── Chart: Risk & Scope Trend (FCAST-15/16/17) ────────────────────────────────
// Combines the three originally-separate "risk trend," "scope change trend,"
// and "blocker impact" chart requests into one grouped-bar chart — they are
// all risk-signal-over-time views of the same per-sprint data
// (SprintThroughput.blockedCount / addedScopeCount), and showing them as one
// chart avoids tripling chart density on an already-long page.

function RiskScopeTrendChart({ points }: { points: { sprint: string; added: number; removed: number; blocked: number }[] }) {
  if (points.length < 2) return <p className={styles.emptyChart}>Need ≥ 2 sprints with scope/blocker data for a trend.</p>;

  const W = 580; const H = 200; const PL = 36; const PB = 32; const PT = 12; const PR = 10;
  const chartW = W - PL - PR; const chartH = H - PT - PB;
  const maxVal = Math.max(...points.map(p => Math.max(p.added, p.blocked)), 1);
  const groupW = chartW / points.length;
  const barW = Math.max(6, Math.min(16, groupW * 0.3));

  function barH(v: number) { return Math.max(2, (v / maxVal) * chartH); }
  function barY(v: number) { return PT + chartH - barH(v); }

  const maxLabels = 8;
  const labelStep = Math.max(1, Math.ceil(points.length / maxLabels));
  const showLabel = (i: number) => i === 0 || i === points.length - 1 || i % labelStep === 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 0.5, 1].map(v => {
        const y = PT + chartH * (1 - v);
        return (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <text x={PL - 4} y={y + 4} fontSize="9" fill="#505050" textAnchor="end">{Math.round(maxVal * v)}</text>
          </g>
        );
      })}
      {points.map((p, i) => {
        const groupX = PL + i * groupW + groupW / 2;
        return (
          <g key={i}>
            <rect x={groupX - barW - 1} y={barY(p.added)} width={barW} height={barH(p.added)} rx="2" fill="#F59E0B" opacity="0.85" />
            <rect x={groupX + 1} y={barY(p.blocked)} width={barW} height={barH(p.blocked)} rx="2" fill="#F87171" opacity="0.85" />
            {showLabel(i) && (
              <text x={groupX} y={H - 8} fontSize="8" fill="#606060" textAnchor="middle">
                {p.sprint.replace(/sprint\s*/i, 'S').slice(0, 7)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Metadata maps ──────────────────────────────────────────────────────────────

const STATUS_META = {
  on_track:          { label: 'On Track',         color: '#22C55E', bg: 'rgba(34,197,94,0.07)',    border: 'rgba(34,197,94,0.18)',    text: '#4ade80', icon: 'checkCircle' },
  at_risk:           { label: 'At Risk',           color: '#F59E0B', bg: 'rgba(245,158,11,0.07)',   border: 'rgba(245,158,11,0.18)',   text: '#fcd34d', icon: 'warning' },
  off_track:         { label: 'Off Track',         color: '#F87171', bg: 'rgba(248,113,113,0.07)',  border: 'rgba(248,113,113,0.18)',  text: '#fca5a5', icon: 'crossCircle' },
  complete:          { label: 'Complete',          color: '#FF8A4C', bg: 'rgba(232,93,18,0.07)',    border: 'rgba(232,93,18,0.18)',    text: '#FF8A4C', icon: 'party' },
  insufficient_data: { label: 'Insufficient Data', color: '#F59E0B', bg: 'rgba(245,158,11,0.05)',   border: 'rgba(245,158,11,0.18)',   text: '#F59E0B', icon: 'info' },
};

const CONF_META: Record<string, { bg: string; color: string; border: string; label: string }> = {
  high:   { bg: 'rgba(34,197,94,0.10)',   color: '#4ade80', border: 'rgba(34,197,94,0.25)',   label: 'High confidence'   },
  medium: { bg: 'rgba(245,158,11,0.10)',  color: '#fcd34d', border: 'rgba(245,158,11,0.25)',  label: 'Medium confidence' },
  low:    { bg: 'rgba(248,113,113,0.10)', color: '#fca5a5', border: 'rgba(248,113,113,0.25)', label: 'Low confidence'    },
};

const TREND_META = {
  improving: { icon: 'arrowUp', color: 'var(--dc-green, #22C55E)', label: 'Velocity improving' },
  stable:    { icon: 'arrowRight', color: 'var(--dc-acc2, #FF8A4C)',  label: 'Velocity stable'    },
  declining: { icon: 'arrowDown', color: 'var(--dc-red, #F87171)',   label: 'Velocity declining' },
};

const PATTERN_COLORS: Partial<Record<SprintDeliveryPattern, string>> = {
  'Healthy Early Progress': '#22C55E',
  'End-Loaded Sprint':      '#F59E0B',
  'Scope Instability':      '#F87171',
  'Blocked Sprint':         '#ef4444',
  'Late Delivery Risk':     '#FF8A4C',
};

// FCAST-20 — labels for the diagnosis card's weakest-factor headline.
const WEAKEST_FACTOR_LABEL: Record<string, string> = {
  throughput:   'Weakest link: Throughput',
  blockers:     'Weakest link: Blockers',
  scope:        'Weakest link: Scope growth',
  data_quality: 'Weakest link: Data quality',
  none:         'No dominant risk factor',
};

// ── Data requirements guide ────────────────────────────────────────────────────

const REQUIREMENTS = [
  { icon: 'sprint', title: 'Sprint Assignment',   fields: 'Sprint · Actual Sprint',               level: 'required',  desc: 'Groups issues into sprints. Without this field no velocity can be calculated — the forecast cannot run.' },
  { icon: 'checkCircle', title: 'Completion Status',   fields: 'Status (Done · Closed · Resolved)',     level: 'required',  desc: 'Identifies which issues count as done per sprint. Drives every velocity and completion-rate calculation.' },
  { icon: 'calendar', title: 'Sprint Boundaries',   fields: 'Sprint Start · Sprint End',             level: 'important', desc: 'Enables mid-sprint delivery pattern analysis and accurate per-sprint completion windows.' },
  { icon: 'stopwatch', title: 'Flow Dates',          fields: 'In Progress Date · Done Date',          level: 'important', desc: 'Measures cycle time and lead time. Required for delivery confidence scoring and pattern detection.' },
  { icon: 'dataNumber', title: 'Story Points',         fields: 'Story Points',                          level: 'optional',  desc: 'Enables point-based velocity as an alternative to issue count. Useful when team size changes.' },
  { icon: 'priorityBlocker', title: 'Blocked Signals',      fields: 'Blocked Flag · Blocker Reason',         level: 'optional',  desc: 'Detects blocked items that suppress velocity. Improves confidence scoring and risk signal accuracy.' },
  { icon: 'plusCircle', title: 'Scope Changes',        fields: 'Added After Sprint Start · Scope Change Type', level: 'optional', desc: 'Identifies instability when scope is added mid-sprint. Used to detect the "Scope Instability" pattern.' },
  { icon: 'target', title: 'Priority',             fields: 'Priority',                              level: 'optional',  desc: 'Critical or Highest priority issues are flagged as forecast risk factors when unresolved at sprint end.' },
] as const;

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ForecastPage() {
  const router  = useRouter();
  const [result,     setResult]     = useState<ForecastResult | null>(null);
  const [throughput, setThroughput] = useState<SprintThroughputSummary | null>(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    async function load() {
      const r = await loadMetricsWithSource();
      const m = r.metrics as DashboardMetrics | null;
      if (!m) { router.replace('/'); return; }
      setResult(computeForecast(m));
      setThroughput((m.throughput as any)?.sprint ?? null);
      setLoading(false);
    }
    load().catch(() => router.replace('/'));
  }, [router]);

  if (loading) return (
    <AppShell showNav>
      <div className={styles.loading}>Computing forecast…</div>
    </AppShell>
  );
  if (!result) return null;

  const meta  = STATUS_META[result.status];
  const trend = TREND_META[result.velocityTrend];
  const conf  = CONF_META[result.confidence];

  const richSprints: SprintThroughput[] = throughput?.sprints ?? [];
  const hasRichData = richSprints.length > 0;

  const patternGroups = hasRichData
    ? richSprints.reduce<Record<string, number>>((acc, s) => {
        const p = s.deliveryPattern ?? 'Unknown';
        if (p !== 'Unknown') acc[p] = (acc[p] ?? 0) + 1;
        return acc;
      }, {})
    : {};

  const patternEntries = Object.entries(patternGroups).sort((a, b) => b[1] - a[1]);
  const maxPatternCount = Math.max(...patternEntries.map(([, n]) => n), 1);

  return (
    <AppShell showNav>
      <div className={styles.page}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.planningBadge}><SvgIcon name="eye" size={14} /> Planning</div>
          <h1 id="tour-header-forecast" className={styles.title}>Delivery Forecast</h1>
          <p className={styles.desc}>
            Velocity-based delivery outlook — how many sprints remain, when you&apos;ll ship, and what&apos;s putting that date at risk.
          </p>
        </div>

        {/* ── Insufficient data ── */}
        {result.status === 'insufficient_data' ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><SvgIcon name="chartBar" size={40} /></div>
            <h2 className={styles.emptyTitle}>Not enough data to forecast</h2>
            <p className={styles.emptyBody}>
              Upload Jira data that includes sprint history with completed issue counts.
              The forecast engine needs at least one sprint with completed work to generate velocity-based projections.
            </p>
          </div>
        ) : (
          <>
            {/* ── Status Banner ── */}
            <div
              id="tour-section-forecast-1"
              className={styles.statusBanner}
              style={{ '--banner-bg': meta.bg, '--banner-border': meta.border, '--banner-text': meta.text, '--banner-color': meta.color } as CSSProperties}
            >
              <div className={styles.bannerIcon}><SvgIcon name={meta.icon} size={28} /></div>
              <div className={styles.bannerContent}>
                <div className={styles.bannerRow}>
                  <h2 className={styles.bannerTitle}>{meta.label}</h2>
                  <span
                    className={styles.confChip}
                    style={{ '--chip-bg': conf.bg, '--chip-color': conf.color, '--chip-border': conf.border } as CSSProperties}
                  >
                    {conf.label}
                  </span>
                </div>
                {result.status === 'complete' ? (
                  <p className={styles.bannerBody}>
                    All {result.totalIssues.toLocaleString()} issues are complete. <SvgIcon name="party" size={14} style={{ verticalAlign: '-2px' }} />
                  </p>
                ) : (
                  <p className={styles.bannerBody}>
                    <strong>
                      {result.weeksRemaining >= 520
                        ? `~${Math.round(result.weeksRemaining / 52)} years`
                        : `~${result.weeksRemaining} weeks`}
                    </strong>{' '}
                    to complete {result.remainingIssues.toLocaleString()} remaining issues
                    at <strong>{result.avgThroughput} items/sprint</strong>.
                    Estimated completion: <strong>{result.estimatedEndDate}</strong>.
                  </p>
                )}
              </div>
              {result.status !== 'complete' && (
                <div className={styles.bannerStat}>
                  <p className={styles.bannerStatVal}>
                    {result.weeksRemaining >= 520
                      ? `${Math.round(result.weeksRemaining / 52)}y`
                      : result.weeksRemaining}
                  </p>
                  <p className={styles.bannerStatLabel}>
                    {result.weeksRemaining >= 520 ? 'years est.' : 'weeks est.'}
                  </p>
                </div>
              )}
            </div>

            {/* ── Forecast Diagnosis (FCAST-19/20/21 — are we on track, and why?) ── */}
            {result.status !== 'complete' && (
              <div className={styles.diagnosisCard} data-kind={result.weakestFactor.kind}>
                <span className={styles.diagnosisLabel}>{WEAKEST_FACTOR_LABEL[result.weakestFactor.kind]}</span>
                {result.weakestFactor.detail && <p className={styles.diagnosisText}>{result.weakestFactor.detail}</p>}
                <p className={styles.diagnosisReason}>{result.confidenceReason}</p>
              </div>
            )}

            {/* ── KPI Row ── */}
            <div id="tour-section-forecast-2" className={styles.kpiGrid}>
              {[
                { label: 'Total Issues',   value: result.totalIssues,   icon: 'clipboard', color: 'var(--dc-p1, #F2F2F2)',    delay: '0.08s' },
                { label: `Done (${result.completionPct}%)`, value: result.doneIssues, icon: 'checkCircle', color: 'var(--dc-green, #22C55E)', delay: '0.12s' },
                { label: 'Remaining',      value: result.remainingIssues, icon: 'clock', color: result.remainingIssues > 0 ? 'var(--dc-amber, #F59E0B)' : 'var(--dc-p3, #505050)', delay: '0.16s' },
                { label: 'Avg / Sprint',   value: result.avgThroughput > 0 ? `${result.avgThroughput}` : '—', icon: 'priorityHigh', color: 'var(--dc-acc2, #FF8A4C)', delay: '0.20s' },
                {
                  label: 'Delivery Conf.',
                  value: throughput ? `${throughput.overallDeliveryConfidence}%` : `${result.completionPct}%`,
                  icon: 'target',
                  color: (throughput?.overallDeliveryConfidence ?? result.completionPct) >= 70
                    ? 'var(--dc-green, #22C55E)'
                    : (throughput?.overallDeliveryConfidence ?? result.completionPct) >= 40
                      ? 'var(--dc-amber, #F59E0B)'
                      : 'var(--dc-red, #F87171)',
                  delay: '0.24s',
                },
              ].map(c => (
                <div key={c.label} className={styles.kpiCard} style={{ '--kpi-color': c.color, '--anim-delay': c.delay } as CSSProperties}>
                  <div className={styles.kpiIcon}><SvgIcon name={c.icon} size={24} /></div>
                  <p className={styles.kpiVal}>{c.value}</p>
                  <p className={styles.kpiLabel}>{c.label}</p>
                </div>
              ))}
            </div>

            {/* ── Sprint Health Summary ── */}
            {throughput && throughput.totalSprints > 0 && (
              <div className={styles.chartCard} style={{ '--anim-delay': '0.1s' } as CSSProperties}>
                <div className={styles.chartHead}>
                  <div className={styles.chartTitleGroup}>
                    <h2 className={styles.chartTitle}>Sprint Health Summary</h2>
                    <p className={styles.chartSubtitle}>
                      Aggregated health signals across {throughput.totalSprints} sprint{throughput.totalSprints !== 1 ? 's' : ''}.
                      End-loaded sprints indicate teams rushing work to the last day — a risk to quality and predictability.
                      Blocked sprints signal dependency or process issues that stall completion.
                    </p>
                  </div>
                </div>
                <div className={styles.healthStrip}>
                  {[
                    {
                      label: 'Delivery Confidence', sub: throughput.overallDeliveryConfidence >= 70 ? 'Strong' : throughput.overallDeliveryConfidence >= 40 ? 'Moderate' : 'Needs work',
                      val: `${throughput.overallDeliveryConfidence}%`,
                      color: throughput.overallDeliveryConfidence >= 70 ? 'var(--dc-green, #22C55E)' : throughput.overallDeliveryConfidence >= 40 ? 'var(--dc-amber, #F59E0B)' : 'var(--dc-red, #F87171)',
                    },
                    {
                      label: 'Avg Completion', sub: 'of committed work',
                      val: `${Math.round(throughput.averageCompletionPct)}%`,
                      color: throughput.averageCompletionPct >= 80 ? 'var(--dc-green, #22C55E)' : throughput.averageCompletionPct >= 60 ? 'var(--dc-amber, #F59E0B)' : 'var(--dc-red, #F87171)',
                    },
                    {
                      label: 'Best Sprint', sub: throughput.bestSprintName || '—',
                      val: 'star',
                      color: 'var(--dc-green, #22C55E)',
                    },
                    {
                      label: 'End-Loaded', sub: `of ${throughput.totalSprints} sprints`,
                      val: throughput.endLoadedSprintCount,
                      color: throughput.endLoadedSprintCount > 2 ? 'var(--dc-amber, #F59E0B)' : 'var(--dc-p1, #F2F2F2)',
                    },
                    {
                      label: 'Blocked Sprints', sub: `of ${throughput.totalSprints} sprints`,
                      val: throughput.blockedSprintCount,
                      color: throughput.blockedSprintCount > 0 ? 'var(--dc-red, #F87171)' : 'var(--dc-p1, #F2F2F2)',
                    },
                  ].map(s => (
                    <div key={s.label} className={styles.healthStat}>
                      <div className={styles.healthStatVal} style={{ '--stat-color': s.color } as CSSProperties}>
                        {s.val === 'star' ? <SvgIcon name="star" size={20} /> : s.val}
                      </div>
                      <div className={styles.healthStatLabel}>{s.label}</div>
                      <div className={styles.healthStatSub}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Throughput Required vs Current (FCAST-14) ── */}
            {result.status !== 'complete' && (() => {
              const requiredForOnTrack = result.remainingIssues / 6; // on_track threshold — see computeForecast()
              const maxVal = Math.max(result.avgThroughput, requiredForOnTrack, 1);
              const gapPct = result.avgThroughput > 0 ? Math.round(((requiredForOnTrack - result.avgThroughput) / result.avgThroughput) * 100) : 0;
              return (
                <div className={styles.chartCard} style={{ '--anim-delay': '0.12s' } as CSSProperties}>
                  <div className={styles.chartHead}>
                    <div className={styles.chartTitleGroup}>
                      <h2 className={styles.chartTitle}>Throughput: Required vs. Current</h2>
                      <p className={styles.chartSubtitle}>
                        How your current average throughput compares to what&apos;s needed to be on track (≤6 sprints remaining).
                      </p>
                    </div>
                  </div>
                  <div className={styles.throughputCompare}>
                    <div className={styles.throughputRow}>
                      <span className={styles.throughputRowLabel}>Current avg</span>
                      <div className={styles.throughputTrack}>
                        <div className={styles.throughputFill} style={{ '--fill-width': `${Math.round((result.avgThroughput / maxVal) * 100)}%`, '--fill-color': 'var(--dc-acc2, #FF8A4C)' } as CSSProperties} />
                      </div>
                      <span className={styles.throughputRowVal}>{result.avgThroughput}/sprint</span>
                    </div>
                    <div className={styles.throughputRow}>
                      <span className={styles.throughputRowLabel}>Required (on track)</span>
                      <div className={styles.throughputTrack}>
                        <div className={styles.throughputFill} style={{ '--fill-width': `${Math.round((requiredForOnTrack / maxVal) * 100)}%`, '--fill-color': requiredForOnTrack > result.avgThroughput ? 'var(--dc-red, #F87171)' : 'var(--dc-green, #22C55E)' } as CSSProperties} />
                      </div>
                      <span className={styles.throughputRowVal}>{requiredForOnTrack.toFixed(1)}/sprint</span>
                    </div>
                  </div>
                  <p className={styles.methodNote}>
                    {gapPct > 0
                      ? `Throughput would need to increase ~${gapPct}% to be on track within 6 sprints at current scope.`
                      : 'Current throughput already meets the on-track bar.'}
                  </p>
                </div>
              );
            })()}

            {/* ── Risk & Scope Trend (FCAST-15/16/17) ── */}
            {result.scopeTrend.length >= 2 && (
              <div className={styles.chartCard} style={{ '--anim-delay': '0.13s' } as CSSProperties}>
                <div className={styles.chartHead}>
                  <div className={styles.chartTitleGroup}>
                    <h2 className={styles.chartTitle}>Risk &amp; Scope Trend</h2>
                    <p className={styles.chartSubtitle}>
                      Mid-sprint scope additions and blocked-item counts per sprint. Rising bars signal growing risk to the forecast.
                    </p>
                  </div>
                  <div className={styles.chartLegend}>
                    <span className={styles.legendItem}><span className={styles.legendDot} style={{ '--legend-color': '#F59E0B' } as CSSProperties} /> Scope added</span>
                    <span className={styles.legendItem}><span className={styles.legendDot} style={{ '--legend-color': '#F87171' } as CSSProperties} /> Blocked</span>
                  </div>
                </div>
                <RiskScopeTrendChart points={result.scopeTrend} />
              </div>
            )}

            {/* ── Combined Burn Chart ── */}
            <div className={styles.chartCard} style={{ '--anim-delay': '0.14s' } as CSSProperties}>
              <div className={styles.chartHead}>
                <div className={styles.chartTitleGroup}>
                  <h2 className={styles.chartTitle}>Sprint Burn-up &amp; Burn-down</h2>
                  <p className={styles.chartSubtitle}>
                    Green rises as work is completed (burn-up). Orange falls as remaining work decreases (burn-down).
                    The lines converge at project completion. The grey dashed line shows the ideal linear burn-down.
                  </p>
                </div>
                <div className={styles.chartLegend}>
                  <span className={styles.legendItem}><span className={styles.legendLine} style={{ '--legend-color': '#22C55E' } as CSSProperties} /> Burn-up</span>
                  <span className={styles.legendItem}><span className={styles.legendLine} style={{ '--legend-color': '#E85D12' } as CSSProperties} /> Burn-down</span>
                  <span className={styles.legendItem}><span className={styles.legendLineDash} style={{ '--legend-color': '#505050' } as CSSProperties} /> Ideal</span>
                </div>
              </div>
              <CombinedBurnChart points={result.sprintPoints} total={result.totalIssues} />
            </div>

            {/* ── Ring + risk mini ── */}
            <div className={styles.ringCard} style={{ '--anim-delay': '0.16s' } as CSSProperties}>
              <CompletionRing pct={result.completionPct} color="var(--dc-acc2, #FF8A4C)" />
              <div className={styles.trendPill} style={{ '--trend-color': trend.color } as CSSProperties}>
                <SvgIcon name={trend.icon} size={14} /> {trend.label}
              </div>
              <div className={styles.riskPair}>
                <div className={styles.riskMini} data-type="blocked" data-active={result.blockedCount > 0 ? 'true' : 'false'}>
                  <div className={styles.riskMiniVal}>{result.blockedCount}</div>
                  <div className={styles.riskMiniLabel}>Blocked</div>
                </div>
                <div className={styles.riskMini} data-type="critical" data-active={result.criticalCount > 0 ? 'true' : 'false'}>
                  <div className={styles.riskMiniVal}>{result.criticalCount}</div>
                  <div className={styles.riskMiniLabel}>Critical</div>
                </div>
              </div>
            </div>

            {/* ── Burn-up Chart — full width ── */}
            <div className={styles.chartCard} style={{ '--anim-delay': '0.20s' } as CSSProperties}>
              <div className={styles.chartHead}>
                <div className={styles.chartTitleGroup}>
                  <h2 className={styles.chartTitle}>Burn-up Chart</h2>
                  <p className={styles.chartSubtitle}>
                    Actual cumulative progress (orange line) vs. optimistic, expected, and pessimistic completion forecasts based on recent 3-sprint velocity.
                    The shaded band shows the range of likely outcomes.
                  </p>
                </div>
                <div className={styles.chartLegend}>
                  <span className={styles.legendItem}><span className={styles.legendLine} style={{ '--legend-color': '#FF8A4C' } as CSSProperties} /> Actual</span>
                  <span className={styles.legendItem}><span className={styles.legendLineDash} style={{ '--legend-color': '#888' } as CSSProperties} /> Expected</span>
                  <span className={styles.legendItem}><span className={styles.legendLine} style={{ '--legend-color': '#22C55E' } as CSSProperties} /> Optimistic</span>
                  <span className={styles.legendItem}><span className={styles.legendLine} style={{ '--legend-color': '#F87171' } as CSSProperties} /> Pessimistic</span>
                </div>
              </div>
              <BurnUpChart points={result.sprintPoints} total={result.totalIssues} />
            </div>

            {/* ── Velocity Chart ── */}
            <div className={styles.chartCard} style={{ '--anim-delay': '0.22s' } as CSSProperties}>
              <div className={styles.chartHead}>
                <div className={styles.chartTitleGroup}>
                  <h2 className={styles.chartTitle}>Sprint Velocity</h2>
                  <p className={styles.chartSubtitle}>
                    Issues completed per sprint. The last 3 sprints (highlighted) are the primary input to the forecast.
                    The dashed line marks average throughput. A rising trend lowers the estimated completion date.
                  </p>
                </div>
                <div className={styles.chartLegend}>
                  <span className={styles.legendItem}><span className={styles.legendDot} style={{ '--legend-color': '#FF8A4C' } as CSSProperties} /> Last 3</span>
                  <span className={styles.legendItem}><span className={styles.legendDot} style={{ '--legend-color': '#323232' } as CSSProperties} /> Earlier</span>
                  <span className={styles.legendItem} style={{ color: trend.color }}><SvgIcon name={trend.icon} size={12} /> {trend.label}</span>
                </div>
              </div>
              <VelocityChart points={result.sprintPoints} avg={result.avgThroughput} />
            </div>

            {/* ── Sprint Performance Table ── */}
            {(result.sprintPoints.length > 0 || richSprints.length > 0) && (
              <div className={styles.chartCard} style={{ '--anim-delay': '0.26s' } as CSSProperties}>
                <div className={styles.chartHead}>
                  <div className={styles.chartTitleGroup}>
                    <h2 className={styles.chartTitle}>Sprint Performance</h2>
                    <p className={styles.chartSubtitle}>
                      {hasRichData
                        ? 'Commitment vs. completion, carryover scope, sprint delivery pattern, and goal outcome per sprint.'
                        : 'Issues completed per sprint and pace relative to average throughput.'}
                    </p>
                  </div>
                </div>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead className={styles.tableHead}>
                      <tr>
                        <th>Sprint</th>
                        {hasRichData ? (
                          <>
                            <th className="right">Committed</th>
                            <th className="right">Completed</th>
                            <th className="right">Carryover</th>
                            <th>Pattern</th>
                            <th>Goal</th>
                            <th className="right">Conf.</th>
                          </>
                        ) : (
                          <>
                            <th className="right">Completed</th>
                            <th className="right">Cumulative</th>
                            <th className="right">vs Avg</th>
                            <th>Pace</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {hasRichData
                        ? richSprints.map((s, i) => (
                            <tr key={i} className={styles.tableRow}>
                              <td>{s.sprintName.replace(/sprint\s*/i, 'Sprint ')}</td>
                              <td className="right bold">{s.committedCount}</td>
                              <td className={`right bold ${s.completedCount >= s.committedCount ? 'green' : s.completedCount >= s.committedCount * 0.8 ? 'amber' : 'red'}`}>{s.completedCount}</td>
                              <td className={`right ${s.carryoverCount > 0 ? 'amber' : 'muted'}`}>{s.carryoverCount}</td>
                              <td><span className={styles.patternBadge} data-pattern={s.deliveryPattern}>{s.deliveryPattern}</span></td>
                              <td><span className={styles.goalBadge} data-outcome={s.goalOutcome}>{s.goalOutcome}</span></td>
                              <td className={`right bold ${s.deliveryConfidence >= 70 ? 'green' : s.deliveryConfidence >= 40 ? 'amber' : 'red'}`}>{s.deliveryConfidence}%</td>
                            </tr>
                          ))
                        : result.sprintPoints.map((p, i) => {
                            const vs     = result.avgThroughput > 0 ? ((p.done - result.avgThroughput) / result.avgThroughput * 100) : 0;
                            const barPct = result.avgThroughput > 0 ? Math.min(100, (p.done / (result.avgThroughput * 1.5)) * 100) : 0;
                            const paceCol = vs > 10 ? '#22C55E' : vs < -10 ? '#F87171' : '#FF8A4C';
                            return (
                              <tr key={i} className={styles.tableRow}>
                                <td>{p.sprint.replace(/sprint\s*/i, 'Sprint ')}</td>
                                <td className="right green bold">{p.done}</td>
                                <td className="right">{p.cumDone}</td>
                                <td className={styles.vsCell} data-perf={vs > 10 ? 'good' : vs < -10 ? 'poor' : 'neutral'}>{vs >= 0 ? '+' : ''}{Math.round(vs)}%</td>
                                <td className={styles.paceCell}>
                                  <div className={styles.paceBar}>
                                    <div className={styles.paceBarFill} style={{ '--pace-width': `${barPct}%`, '--pace-color': paceCol } as CSSProperties} />
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

            {/* ── Delivery Pattern Breakdown ── */}
            {patternEntries.length > 0 && (
              <div className={styles.chartCard} style={{ '--anim-delay': '0.30s' } as CSSProperties}>
                <div className={styles.chartHead}>
                  <div className={styles.chartTitleGroup}>
                    <h2 className={styles.chartTitle}>Delivery Pattern Breakdown</h2>
                    <p className={styles.chartSubtitle}>
                      How sprint delivery patterns distribute across {richSprints.length} sprints.
                      Healthy Early Progress is the strongest predictor of on-time delivery.
                      End-Loaded and Blocked patterns are the most common risk signals.
                    </p>
                  </div>
                </div>
                <div className={styles.patternList}>
                  {patternEntries.map(([pattern, count]) => (
                    <div key={pattern} className={styles.patternRow}>
                      <span className={styles.patternLabel}>{pattern}</span>
                      <div className={styles.patternTrack}>
                        <div
                          className={styles.patternFill}
                          style={{
                            '--fill-width': `${Math.round((count / maxPatternCount) * 100)}%`,
                            '--pattern-color': PATTERN_COLORS[pattern as SprintDeliveryPattern] ?? '#505050',
                          } as CSSProperties}
                        />
                      </div>
                      <span className={styles.patternCount}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Delivery Levers ── */}
            {result.avgThroughput > 0 && result.remainingIssues > 0 && (() => {
              const ONE_YR = 26; const TWO_YR = 52; const FIVE_YR = 130;
              const vel1 = Math.ceil(result.remainingIssues / ONE_YR);
              const vel2 = Math.ceil(result.remainingIssues / TWO_YR);
              const vel5 = Math.ceil(result.remainingIssues / FIVE_YR);
              const cut1 = Math.max(0, result.remainingIssues - Math.round(result.avgThroughput * ONE_YR));
              const cut2 = Math.max(0, result.remainingIssues - Math.round(result.avgThroughput * TWO_YR));
              const cut5 = Math.max(0, result.remainingIssues - Math.round(result.avgThroughput * FIVE_YR));
              const gapColor = (gap: number) =>
                gap <= 0 ? '#22C55E' : gap <= result.avgThroughput ? '#F59E0B' : '#F87171';
              const gapBg = (gap: number) =>
                gap <= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.08)';
              return (
                <div className={styles.chartCard} style={{ '--anim-delay': '0.32s' } as CSSProperties}>
                  <div className={styles.chartHead}>
                    <div className={styles.chartTitleGroup}>
                      <h2 className={styles.chartTitle}><SvgIcon name="target" size={18} /> Delivery Levers</h2>
                      <p className={styles.chartSubtitle}>
                        What it takes to hit a target window — either increase velocity or reduce scope.
                        Currently {result.avgThroughput} items/sprint with{' '}
                        {result.remainingIssues.toLocaleString()} remaining.
                      </p>
                    </div>
                  </div>

                  <p className={styles.leverDivider}>Velocity needed (items / sprint)</p>
                  <div className={styles.leversGrid}>
                    {([
                      { target: '1 Year', vel: vel1, gap: vel1 - result.avgThroughput },
                      { target: '2 Years', vel: vel2, gap: vel2 - result.avgThroughput },
                      { target: '5 Years', vel: vel5, gap: vel5 - result.avgThroughput },
                    ] as const).map(l => (
                      <div key={l.target} className={styles.leverCard}
                        style={{ '--lever-color': gapColor(l.gap) } as CSSProperties}>
                        <div className={styles.leverTarget}>Target: {l.target}</div>
                        <div className={styles.leverNeed}>Need</div>
                        <div className={styles.leverVal}>{l.vel}</div>
                        <div className={styles.leverUnit}>items / sprint</div>
                        <div className={styles.leverGap}
                          style={{ '--gap-bg': gapBg(l.gap), '--gap-color': gapColor(l.gap) } as CSSProperties}>
                          {l.gap <= 0 ? (
                            <><SvgIcon name="checkCircle" size={13} /> Achievable now</>
                          ) : `+${Math.ceil(l.gap)} more/sprint`}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className={styles.leverDivider}>Scope to cut (at current velocity)</p>
                  <div className={styles.leversGrid}>
                    {([
                      { target: '1 Year', cut: cut1 },
                      { target: '2 Years', cut: cut2 },
                      { target: '5 Years', cut: cut5 },
                    ] as const).map(l => {
                      const pct = Math.round(l.cut / result.remainingIssues * 100);
                      const col = l.cut === 0 ? '#22C55E' : pct <= 30 ? '#F59E0B' : '#F87171';
                      return (
                        <div key={l.target} className={styles.leverCard}
                          style={{ '--lever-color': col } as CSSProperties}>
                          <div className={styles.leverTarget}>Target: {l.target}</div>
                          <div className={styles.leverNeed}>Cut</div>
                          <div className={styles.leverVal}>{l.cut === 0 ? '0' : l.cut.toLocaleString()}</div>
                          <div className={styles.leverUnit}>items from scope</div>
                          <div className={styles.leverGap}
                            style={{ '--gap-bg': l.cut === 0 ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.08)', '--gap-color': col } as CSSProperties}>
                            {l.cut === 0 ? (
                              <><SvgIcon name="checkCircle" size={13} /> Achievable</>
                            ) : `${pct}% descope`}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className={styles.leverNote}>
                    These are planning levers, not predictions. Use them in sprint planning to align stakeholders on what it takes to change the delivery date.
                  </p>
                </div>
              );
            })()}

            {/* ── Next Quarter Plan ── */}
            <div className={styles.chartCard} style={{ '--anim-delay': '0.34s' } as CSSProperties}>
              <h2 className={styles.chartTitle}><SvgIcon name="calendar" size={18} /> Next Quarter Plan</h2>
              <p className={styles.chartSubtitle} style={{ marginBottom: 16 }}>
                At {result.avgThroughput} items/sprint average, how much of the remaining backlog can fit within one quarter (6 sprints)?
              </p>
              {result.avgThroughput > 0 ? (
                <>
                  <div className={styles.quarterGrid}>
                    {[
                      { label: 'Capacity (6 sprints)', value: Math.round(result.avgThroughput * 6), color: 'var(--dc-acc2, #FF8A4C)' },
                      { label: 'Remaining backlog',    value: result.remainingIssues,               color: result.remainingIssues > result.avgThroughput * 6 ? 'var(--dc-red, #F87171)' : 'var(--dc-green, #22C55E)' },
                      { label: 'Gap (items at risk)',  value: Math.max(0, result.remainingIssues - Math.round(result.avgThroughput * 6)), color: 'var(--dc-amber, #F59E0B)' },
                    ].map(s => (
                      <div key={s.label} className={styles.quarterStat}>
                        <p className={styles.quarterVal} style={{ '--q-color': s.color } as CSSProperties}>{s.value}</p>
                        <p className={styles.quarterLabel}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {result.remainingIssues <= result.avgThroughput * 6
                    ? <p className={styles.quarterNoteGreen}><SvgIcon name="checkCircle" size={14} /> Full backlog is achievable within one quarter at current velocity.</p>
                    : <p className={styles.quarterNoteAmber}><SvgIcon name="warning" size={14} /> Backlog exceeds quarterly capacity — consider descoping or splitting into milestones.</p>
                  }
                </>
              ) : (
                <p className={styles.emptyChart}>Upload Jira data with sprint history for quarterly planning.</p>
              )}
            </div>

            {/* ── Data Requirements Guide ── */}
            <div className={styles.chartCard} style={{ '--anim-delay': '0.36s' } as CSSProperties}>
              <div className={styles.chartHead}>
                <div className={styles.chartTitleGroup}>
                  <h2 className={styles.chartTitle}><SvgIcon name="clipboard" size={18} /> What Drives This Forecast</h2>
                  <p className={styles.chartSubtitle}>
                    The forecast is only as good as the data behind it. Here&apos;s what each field in your Jira export contributes — and what you&apos;re missing.
                  </p>
                </div>
              </div>
              <div className={styles.reqGrid}>
                {REQUIREMENTS.map(r => (
                  <div key={r.title} className={styles.reqItem}>
                    <div className={styles.reqIcon}><SvgIcon name={r.icon} size={22} /></div>
                    <div className={styles.reqBody}>
                      <div className={styles.reqBadge} data-level={r.level}>
                        {r.level.toUpperCase()}
                      </div>
                      <div className={styles.reqTitle}>{r.title}</div>
                      <div className={styles.reqField}>{r.fields}</div>
                      <div className={styles.reqDesc}>{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Recommendations ── */}
            <div className={styles.chartCard} style={{ '--anim-delay': '0.40s' } as CSSProperties}>
              <h2 className={styles.chartTitle}><SvgIcon name="lightbulb" size={18} /> Recommendations</h2>
              <p className={styles.chartSubtitle} style={{ marginBottom: 12 }}>
                Actionable steps to improve forecast confidence and reduce delivery risk.
              </p>
              <div className={styles.recList}>
                {result.adjustments.map((a, i) => (
                  <div key={i} className={styles.recItem}>
                    <span className={styles.recArrow}>→</span>
                    {a}
                  </div>
                ))}
              </div>
              <p className={styles.methodNote}>
                Model: linear velocity extrapolation · 2-week sprints assumed · Confidence reflects data completeness and velocity stability.
                {throughput && ` · Delivery patterns computed from ${throughput.totalSprints} sprint${throughput.totalSprints !== 1 ? 's' : ''} of throughput analysis.`}
              </p>
            </div>

          </>
        )}

      </div>
    </AppShell>
  );
}
