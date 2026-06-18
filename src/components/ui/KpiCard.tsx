'use client';
import { cn } from '@/lib/utils';
import type { MetricConfidence } from '@/types/metricConfidence';
import MetricConfidenceBadge from './MetricConfidenceBadge';

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
      )}
      style={{ background: 'var(--dc-s2, #fff)', border: '1px solid var(--dc-bdr, rgba(203,213,225,0.5))', borderLeft: '4px solid ' + accent }}
    >
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--dc-p2, #64748b)' }}>{label}</p>
        {confidence && (
          <MetricConfidenceBadge confidence={confidence} size="sm" />
        )}
      </div>
      <div>
        <p className="text-2xl font-black tracking-tight leading-none mt-2" style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--dc-p1, #0f172a)' }}>{value}</p>
        {detail && <p className="text-xs mt-1.5 font-medium" style={{ color: 'var(--dc-p2, #64748b)' }}>{detail}</p>}
      </div>
    </div>
  );
}
