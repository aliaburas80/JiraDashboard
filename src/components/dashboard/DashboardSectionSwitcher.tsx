// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';

export type { SectionMode, SwitcherSection } from '@/lib/dashboardSections';
export { DASHBOARD_SECTIONS, OVERVIEW_KEYS } from '@/lib/dashboardSections';
import { type SectionMode } from '@/lib/dashboardSections';

// ─── Icon SVG paths (from delivery-toolbar.html reference) ────────────────────
const ICONS: Record<string, { path: string; color: string }> = {
  full:            { path: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z', color: '#2563eb' },
  overview_mode:   { path: 'M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3Zm1 1v8h7A8 8 0 0 0 13 4Z', color: '#64748b' },
  overview:        { path: 'M5 21V9h3v12H5Zm5 0V3h3v18h-3Zm5 0V13h3v8h-3Z', color: '#64748b' },
  attention:       { path: 'M12 2 4 5.5v6.1c0 5 3.4 9.6 8 10.8 4.6-1.2 8-5.8 8-10.8V5.5L12 2Zm1 14h-2v-2h2v2Zm0-4h-2V7h2v5Z', color: '#ef4444' },
  recommendations: { path: 'M12 5C7 5 3.2 8.1 1.6 12c1.6 3.9 5.4 7 10.4 7s8.8-3.1 10.4-7C20.8 8.1 17 5 12 5Zm0 10.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z', color: '#8b5cf6' },
  ratios:          { path: 'm12 2 9 4.8-9 4.8-9-4.8L12 2Zm-7.6 8.1L12 14l7.6-3.9L21 11l-9 4.7L3 11l1.4-.9Zm0 4.3L12 18.3l7.6-3.9 1.4.9-9 4.7-9-4.7 1.4-.9Z', color: '#14b8a6' },
  visuals:         { path: 'M4 19h16v2H2V3h2v16Zm3-2 4-5 3 3.5L19 8l1.7 1.1-6.5 9.8-3.1-3.6L8.5 18 7 17Z', color: '#334155' },
  delivery:        { path: 'M3 5h13v10h2.2l1.8 2.2V19h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3V5Zm2 2v8h9V7H5Zm12 3v3h2.1L17 10Z', color: '#334155' },
  quarters:        { path: 'M4 17.5 10.5 11l3.5 3.5L21 7.5V13h-2V10.9l-5 5-3.5-3.5L5.4 19 4 17.5Z', color: '#ff6b57' },
  kanban:          { path: 'M4 4h16v16H4V4Zm2 2v12h12V6H6Zm2 2h3v8H8V8Zm5 0h3v8h-3V8Z', color: '#14b8a6' },
  sprint:          { path: 'M7 7h9.2l-2.6-2.6L15 3l5 5-5 5-1.4-1.4L16.2 9H7a3 3 0 0 0 0 6h2v2H7A5 5 0 0 1 7 7Zm10 10H7.8l2.6 2.6L9 21l-5-5 5-5 1.4 1.4L7.8 15H17a3 3 0 0 0 0-6h-2V7h2a5 5 0 0 1 0 10Z', color: '#8b5cf6' },
  ownership:       { path: 'M12 3a9 9 0 0 1 9 9h-2a7 7 0 1 0-7 7v2a9 9 0 0 1 0-18Zm1 1v8h7a8 8 0 0 0-7-8Zm2 10h2v2h-2v-2Zm-4 0h2v5h-2v-5Z', color: '#fb923c' },
  labels:          { path: 'M20 11.2 12.8 4H5v7.8l7.2 7.2a2 2 0 0 0 2.8 0l5-5a2 2 0 0 0 0-2.8ZM7.5 9A1.5 1.5 0 1 1 7.5 6a1.5 1.5 0 0 1 0 3Z', color: '#38bdf8' },
  relations:       { path: 'M6 2h9l5 5v15H6V2Zm8 2v4h4l-4-4ZM8 12h8v2H8v-2Zm0 4h8v2H8v-2Z', color: '#2563eb' },
  readiness:       { path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1 13.5-4-4L8.4 10l2.6 2.6 5.6-5.6L18 8.5l-7 7Z', color: '#22c55e' },
  throughput:      { path: 'M12 3a9 9 0 0 1 9 9 8.9 8.9 0 0 1-2.6 6.4l-1.4-1.4A7 7 0 1 0 5 12a6.9 6.9 0 0 0 2 5l-1.4 1.4A9 9 0 0 1 12 3Zm4.9 5.7-4.4 6.7a2.1 2.1 0 1 1-1.7-1.2l4.4-6.7 1.7 1.2Z', color: '#a855f7' },
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
  onMode:         (mode: SectionMode) => void;
  onFocusSection: (key: string) => void;
}

function NavIcon({ path, color, size = 16 }: { path: string; color: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true"
      style={{ width: size, height: size, fill: color, flexShrink: 0 }}>
      <path d={path} />
    </svg>
  );
}

function NavItem({
  label, iconPath, iconColor, active, highlighted, dot, onClick,
}: {
  label: string; iconPath: string; iconColor: string;
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
      <NavIcon path={iconPath} color={active ? '#2563eb' : highlighted ? '#8b5cf6' : iconColor} size={12} />
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
  mode, hiddenKeys, alertKeys = new Set(), onMode, onFocusSection,
}: Props) {
  function handleSection(key: string) {
    onMode(key);
    onFocusSection(key);
  }

  const visibleKeys = SECTION_KEYS.filter(k => !hiddenKeys.has(k));

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
          iconPath={ICONS.full.path}
          iconColor={ICONS.full.color}
          active={mode === 'full'}
          onClick={() => onMode('full')}
        />

        {/* Overview mode */}
        <NavItem
          label="Overview"
          iconPath={ICONS.overview_mode.path}
          iconColor={ICONS.overview_mode.color}
          active={mode === 'overview'}
          onClick={() => onMode('overview')}
        />

        {/* Section tabs */}
        {visibleKeys.map(k => (
          <NavItem
            key={k}
            label={SECTION_LABELS[k]}
            iconPath={ICONS[k]?.path ?? ICONS.overview.path}
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
