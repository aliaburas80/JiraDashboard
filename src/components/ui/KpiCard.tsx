'use client';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import type { MetricConfidence } from '@/types/metricConfidence';
import MetricConfidenceBadge from './MetricConfidenceBadge';
import styles from './KpiCard.module.scss';

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

interface P {
  label:      string;
  value:      string | number;
  detail?:    string;
  accent?:    string;
  onClick?:   () => void;
  confidence?: MetricConfidence;
}

export default function KpiCard({ label, value, detail, accent='var(--dc-acc2, #FF8A4C)', onClick, confidence }: P) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl shadow-sm p-5 flex flex-col justify-between min-h-[110px] relative',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        styles.card,
      )}
      // DYNAMIC CSS VARIABLE: accent is an arbitrary caller-supplied color.
      style={{ '--kpi-accent': accent } as CSSVars}
    >
      <div className="flex items-start justify-between gap-1">
        <p className={cn('text-xs font-bold uppercase tracking-wider', styles.label)}>{label}</p>
        {confidence && (
          <MetricConfidenceBadge confidence={confidence} size="sm" />
        )}
      </div>
      <div>
        <p className={cn('font-black tracking-tight leading-none mt-2', styles.value)}>{value}</p>
        {detail && <p className={cn('text-xs mt-1.5 font-medium', styles.detail)}>{detail}</p>}
      </div>
    </div>
  );
}
