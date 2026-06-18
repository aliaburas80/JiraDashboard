type Tone = 'critical' | 'warning' | 'success' | 'info' | 'neutral' | 'purple';

const STYLES: Record<Tone, { bg: string; color: string; border: string }> = {
  critical: { bg: 'var(--dc-critical-soft)', color: 'var(--dc-critical)', border: 'rgba(244,63,94,0.25)' },
  warning:  { bg: 'var(--dc-warning-soft)',  color: '#B45309',             border: 'rgba(245,158,11,0.25)' },
  success:  { bg: 'var(--dc-success-soft)',  color: '#15803D',             border: 'rgba(34,197,94,0.25)'  },
  info:     { bg: 'var(--dc-info-soft)',     color: '#0369A1',             border: 'rgba(14,165,233,0.25)' },
  neutral:  { bg: 'var(--dc-surface-blue)', color: 'var(--dc-text-2)',    border: 'var(--dc-line)'         },
  purple:   { bg: 'var(--dc-purple-soft)',   color: 'var(--dc-purple)',    border: 'rgba(124,58,237,0.25)' },
};

interface Props {
  label: string;
  tone?: Tone;
  size?: 'sm' | 'md';
}

export default function DCStatusChip({ label, tone = 'neutral', size = 'sm' }: Props) {
  const s = STYLES[tone];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: size === 'md' ? '5px 10px' : '3px 8px',
      borderRadius: 8,
      fontSize: size === 'md' ? 12 : 11,
      fontWeight: 800,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} aria-hidden="true" />
      {label}
    </span>
  );
}
