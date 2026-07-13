import type { MetricConfidence } from '@/types/metricConfidence';
import MetricConfidenceBadge from '@/components/ui/MetricConfidenceBadge';

interface Props {
  label: string;
  value: string | number;
  subtitle?: string;
  tone?: 'critical' | 'warning' | 'success' | 'info' | 'neutral';
  icon?: React.ReactNode;
  onClick?: () => void;
  confidence?: MetricConfidence;
}

const TONE_COLORS: Record<string, string> = {
  critical: 'var(--dc-critical)',
  warning:  'var(--dc-warning)',
  success:  'var(--dc-success)',
  info:     'var(--dc-info)',
  neutral:  'var(--dc-text-3)',
};

const TONE_BG: Record<string, string> = {
  critical: 'var(--dc-critical-soft)',
  warning:  'var(--dc-warning-soft)',
  success:  'var(--dc-success-soft)',
  info:     'var(--dc-info-soft)',
  neutral:  'var(--dc-surface-blue)',
};

export default function DCKpiCard({ label, value, subtitle, tone = 'neutral', icon, onClick, confidence }: Props) {
  const color = TONE_COLORS[tone];
  const bg    = TONE_BG[tone];

  return (
    <div
      className="dc-kpi-card"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 150ms' }}
      onMouseEnter={onClick ? e => (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(15,23,42,0.12)' : undefined}
      onMouseLeave={onClick ? e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--dc-shadow-card)' : undefined}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        {icon && (
          <div className="dc-kpi-icon" style={{ background: bg, color }}>
            {icon}
          </div>
        )}
        <p className="dc-kpi-label" style={{ flex: 1 }}>{label}</p>
        {confidence && <MetricConfidenceBadge confidence={confidence} size="sm" />}
      </div>
      <p className="dc-kpi-value" style={{ color }}>{value}</p>
      {subtitle && <p className="dc-kpi-sub" style={{ marginTop: 6 }}>{subtitle}</p>}
    </div>
  );
}
