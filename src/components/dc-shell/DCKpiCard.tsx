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

export default function DCKpiCard({ label, value, subtitle, tone = 'neutral', icon, onClick, confidence }: Props) {
  return (
    <div
      className="dc-kpi-card"
      data-clickable={!!onClick}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? e => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="dc-kpi-header">
        {icon && (
          <div className="dc-kpi-icon" data-tone={tone}>
            {icon}
          </div>
        )}
        <p className="dc-kpi-label">{label}</p>
        {confidence && <MetricConfidenceBadge confidence={confidence} size="sm" />}
      </div>
      <p className="dc-kpi-value" data-tone={tone}>{value}</p>
      {subtitle && <p className="dc-kpi-sub">{subtitle}</p>}
    </div>
  );
}
