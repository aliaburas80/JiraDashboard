// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';

export type { SectionMode, SwitcherSection } from '@/lib/dashboardSections';
export { DASHBOARD_SECTIONS, OVERVIEW_KEYS } from '@/lib/dashboardSections';
import { type SectionMode } from '@/lib/dashboardSections';
import { SvgIcon } from '@/components/ui/SvgIcon';

const ICONS: Record<string, { name: string; color: string }> = {
  full:            { name: 'grid', color: '#2563eb' },
  overview_mode:   { name: 'dashboard', color: '#64748b' },
  overview:        { name: 'chartBar', color: '#64748b' },
  attention:       { name: 'warning', color: '#ef4444' },
  recommendations: { name: 'eye', color: '#8b5cf6' },
  ratios:          { name: 'chartPie', color: '#14b8a6' },
  visuals:         { name: 'chartTrendUp', color: '#334155' },
  delivery:        { name: 'dataFlow', color: '#334155' },
  quarters:        { name: 'calendar', color: '#ff6b57' },
  kanban:          { name: 'board', color: '#14b8a6' },
  sprint:          { name: 'sprint', color: '#8b5cf6' },
  ownership:       { name: 'people', color: '#fb923c' },
  labels:          { name: 'tag', color: '#38bdf8' },
  relations:       { name: 'workItems', color: '#2563eb' },
  readiness:       { name: 'checkCircle', color: '#22c55e' },
  throughput:      { name: 'timeline', color: '#a855f7' },
};

const SECTION_KEYS = [
  'overview','attention','recommendations','ratios','visuals',
  'delivery','quarters','kanban','sprint','ownership','labels','relations','readiness','throughput',
];

const SECTION_LABELS: Record<string, string> = {
  overview: 'Key Metrics', attention: 'Risks', recommendations: 'Actions',
  ratios: 'Delivery Mix', visuals: 'Analytics', delivery: 'Delivery',
  quarters: 'Trends', kanban: 'Kanban', sprint: 'Sprints',
  ownership: 'Capacity', labels: 'Labels', relations: 'Work Items',
  readiness: 'Readiness', throughput: 'Throughput',
};

interface Props {
  mode:           SectionMode;
  hiddenKeys:     Set<string>;
  alertKeys?:     Set<string>;
  orderedKeys?:   string[];   // custom section order from layout builder
  onMode:         (mode: SectionMode) => void;
  onFocusSection: (key: string) => void;
}

function NavItem({
  label, iconName, iconColor, active, highlighted, dot, onClick,
}: {
  label: string; iconName: string; iconColor: string;
  active: boolean; highlighted?: boolean; dot?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'inline-flex',
        minWidth: 'max-content',
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        padding: '6px 10px',
        borderRadius: 12,
        border: 'none',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
        fontFamily: 'inherit',
        transition: 'transform 180ms ease, background 180ms ease, color 180ms ease',
        color: active ? '#2563eb' : highlighted ? '#8b5cf6' : '#334155',
        background: active
          ? 'linear-gradient(180deg, rgba(239,246,255,0.95), rgba(241,245,249,0.72))'
          : highlighted
          ? 'radial-gradient(circle at center, rgba(139,92,246,0.10), rgba(255,255,255,0))'
          : 'transparent',
      }}
    >
      {dot && (
        <span style={{
          position: 'absolute', top: 6, right: 6,
          width: 7, height: 7, borderRadius: '50%', background: '#ef4444',
        }} aria-hidden="true" />
      )}
      <SvgIcon name={iconName} size={12} style={{ color: active ? '#2563eb' : highlighted ? '#8b5cf6' : iconColor }} />
      <span>{label}</span>
      {(active || highlighted) && (
        <span style={{
          position: 'absolute',
          left: 10, right: 10, bottom: -4,
          height: 3, borderRadius: 999,
          background: active ? '#2563eb' : '#8b5cf6',
          boxShadow: active ? '0 0 0 4px rgba(37,99,235,0.10)' : '0 0 0 4px rgba(139,92,246,0.10)',
        }} aria-hidden="true" />
      )}
    </button>
  );
}

export default function DashboardSectionSwitcher({
  mode, hiddenKeys, alertKeys = new Set(), orderedKeys, onMode, onFocusSection,
}: Props) {
  function handleSection(key: string) {
    onMode(key);
    onFocusSection(key);
  }

  const baseKeys   = orderedKeys ?? SECTION_KEYS;
  const visibleKeys = baseKeys.filter(k => !hiddenKeys.has(k));

  return (
    <div
      className="print:hidden"
      aria-label="Dashboard section switcher"
      style={{
        display: 'grid',
        gridTemplateColumns: '72px minmax(0, 1fr)',
        alignItems: 'center',
        gap: 16,
        padding: '12px 0 8px',
      }}
    >
      {/* ── Brand mark — gradient lightning bolt ──────────────────────────── */}
      <button
        type="button"
        onClick={() => onMode('full')}
        title="Full Dashboard"
        aria-label="Full Dashboard"
        style={{
          width: 56, height: 56,
          borderRadius: 14,
          border: 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          background: 'linear-gradient(135deg, #1455f5 0%, #2563eb 48%, #17b8d6 100%)',
          boxShadow: '0 10px 24px rgba(37,99,235,0.32)',
          transition: 'box-shadow 180ms ease, transform 180ms ease',
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"
          style={{ width: 26, height: 26, fill: 'white' }}>
          <path d="M13.7 2.3 4.8 13.1c-.5.6-.1 1.5.7 1.5h5.2l-1 6.6c-.1.8.9 1.2 1.4.6l8.1-10.5c.5-.6.1-1.5-.7-1.5h-4.8l1.4-6.8c.2-.8-.9-1.3-1.4-.7Z" />
        </svg>
      </button>

      {/* ── Nav items — wrap to next line when needed, no scroll ────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          paddingBottom: 6,
        }}
      >
        {/* Full */}
        <NavItem
          label="Full"
          iconName={ICONS.full.name}
          iconColor={ICONS.full.color}
          active={mode === 'full'}
          onClick={() => onMode('full')}
        />

        {/* Overview mode */}
        <NavItem
          label="Overview"
          iconName={ICONS.overview_mode.name}
          iconColor={ICONS.overview_mode.color}
          active={mode === 'overview'}
          onClick={() => onMode('overview')}
        />

        {/* Section tabs */}
        {visibleKeys.map(k => (
          <NavItem
            key={k}
            label={SECTION_LABELS[k]}
            iconName={ICONS[k]?.name ?? ICONS.overview.name}
            iconColor={ICONS[k]?.color ?? '#64748b'}
            active={mode === k}
            highlighted={k === 'recommendations' && mode !== k}
            dot={alertKeys.has(k)}
            onClick={() => handleSection(k)}
          />
        ))}
      </div>
    </div>
  );
}
