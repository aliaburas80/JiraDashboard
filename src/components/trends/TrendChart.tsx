// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Pure SVG line chart for upload-to-upload trend visualisation.
'use client';
import { useState } from 'react';
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import styles from './TrendChart.module.scss';

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

export interface TrendDataPoint {
  label:  string;   // short x-axis label
  value:  number;
  date:   string;   // full date for tooltip
  file?:  string;   // filename for tooltip
}

interface Props {
  title:      string;
  unit?:      string;
  color:      string;
  data:       TrendDataPoint[];
  yMin?:      number;
  yMax?:      number;
  higherIsBetter?: boolean;
  height?:    number;
}

const W = 500;  // viewBox width
const H = 140;  // viewBox height
const PX = 40;  // horizontal padding
const PY = 16;  // vertical padding

export default function TrendChart({ title, unit = '', color, data, yMin, yMax, higherIsBetter = true, height = 160 }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length < 2) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{title}</p>
        <p className="text-xs text-slate-400 italic">
          {data.length === 0 ? 'No upload history yet.' : 'Need at least 2 uploads to show a trend.'}
        </p>
      </div>
    );
  }

  const values = data.map(d => d.value);
  const minVal = yMin ?? Math.min(...values);
  const maxVal = yMax ?? Math.max(...values);
  const range  = Math.max(maxVal - minVal, 1);

  function xPos(i: number): number {
    return PX + (i / (data.length - 1)) * (W - PX * 2);
  }
  function yPos(val: number): number {
    return PY + H - ((val - minVal) / range) * H;
  }

  const points = data.map((d, i) => `${xPos(i).toFixed(1)},${yPos(d.value).toFixed(1)}`).join(' ');

  // Trend direction (last vs first)
  const first = data[0].value;
  const last  = data[data.length - 1].value;
  const trendUp = last > first;
  const trendDir = Math.abs(last - first) < 0.5 ? 'stable'
    : (trendUp && higherIsBetter) || (!trendUp && !higherIsBetter) ? 'positive' : 'negative';

  const trendIcon  = trendDir === 'positive' ? '↑' : trendDir === 'negative' ? '↓' : '→';

  const hov = hovered !== null ? data[hovered] : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">{title}</p>
        <span className={clsx('flex items-center gap-1 text-xs font-bold', styles.trendLabel)} data-trend={trendDir}>
          {trendIcon}
          {Math.abs(Math.round((last - first) * 10) / 10)}{unit} vs first
        </span>
      </div>

      {/* SVG chart */}
      <div
        className={styles.chartWrap}
        // DYNAMIC CSS VARIABLE: height is a runtime prop set per caller.
        style={{ '--chart-height': `${height}px` } as CSSVars}
      >
        <svg viewBox={`0 0 ${W} ${H + PY * 2}`} className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(t => {
            const y = PY + H - t * H;
            const val = minVal + t * range;
            return (
              <g key={t}>
                <line x1={PX} y1={y} x2={W - PX} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={PX - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">
                  {Math.round(val * 10) / 10}{unit}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <defs>
            <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.15" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon
            points={`${xPos(0)},${PY + H} ${points} ${xPos(data.length - 1)},${PY + H}`}
            fill={`url(#grad-${title})`}
          />

          {/* Line */}
          <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Dots */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={xPos(i)}
              cy={yPos(d.value)}
              r={hovered === i ? 5 : 3.5}
              fill={hovered === i ? color : '#fff'}
              stroke={color}
              strokeWidth="2"
              className={styles.dot}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}

          {/* X-axis labels */}
          {data.map((d, i) => {
            // Only show labels for first, last, and every ~3rd
            if (i !== 0 && i !== data.length - 1 && i % Math.max(1, Math.floor(data.length / 4)) !== 0) return null;
            return (
              <text key={i} x={xPos(i)} y={PY + H + 16} textAnchor="middle" fontSize="8" fill="#94a3b8">
                {d.label}
              </text>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hov && hovered !== null && (
          <div
            className={clsx('bg-slate-900 text-white rounded-xl px-3 py-2 text-xs shadow-xl pointer-events-none z-10', styles.tooltip)}
            // DYNAMIC CSS VARIABLE: horizontal position tracks the hovered
            // data point's index, which varies per render.
            style={{ '--tooltip-left': `${(hovered / (data.length - 1)) * 100}%` } as CSSVars}
          >
            <p className="font-black">{hov.value}{unit}</p>
            <p className="text-slate-400 text-[10px]">{hov.date}</p>
            {hov.file && <p className="text-slate-500 text-[9px] truncate max-w-[160px]">{hov.file}</p>}
          </div>
        )}
      </div>

      {/* Min / Max / Latest */}
      <div className="flex justify-between text-[10px] text-slate-400 mt-2">
        <span>Min: <strong className="text-slate-600">{Math.min(...values)}{unit}</strong></span>
        <span>Latest: <strong className={styles.latestValue} style={{ '--chart-color': color } as CSSVars}>{last}{unit}</strong></span>
        <span>Max: <strong className="text-slate-600">{Math.max(...values)}{unit}</strong></span>
      </div>
    </div>
  );
}
