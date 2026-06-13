'use client';

// ─── Chip classes (inline styles matching the spec) ───────────────────────────
function Chip({ type, label }: { type: 'cc' | 'cw' | 'cg' | 'cm' | 'cn'; label: string }) {
  const styles: Record<string, React.CSSProperties> = {
    cc: { background: '#FEF2F2', color: '#DC2626' },
    cw: { background: '#FFFBEB', color: '#D97706' },
    cg: { background: '#ECFDF5', color: '#059669' },
    cm: { background: '#ECFEFF', color: '#0891B2' },
    cn: { background: '#F1F5F9', color: '#64748B' },
  };
  return (
    <span style={{
      display: 'inline-flex', padding: '2px 6px', borderRadius: 3,
      fontSize: 8, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap',
      ...styles[type],
    }}>
      {label}
    </span>
  );
}

// ─── Health colour ────────────────────────────────────────────────────────────
function healthColor(score: number): string {
  if (score >= 75) return '#059669';
  if (score >= 60) return '#D97706';
  if (score >= 40) return '#DC2626';
  return '#991B1B';
}
function healthBandLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'At-Risk';
  return 'Critical';
}

// ─── Icon SVGs (13×13 stroke, fill:none) ─────────────────────────────────────
const icons: Record<string, React.ReactNode> = {
  home:      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>,
  alertTri:  <><path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></>,
  monitor:   <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>,
  clock:     <><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></>,
  shield:    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>,
  barChart:  <path d="M18 20V10M12 20V4M6 20v-6"/>,
  circle:    <><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 010 20"/></>,
  activity:  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>,
  calendar:  <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  grid:      <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 17h7m-3.5-3.5v7"/></>,
  zap:       <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>,
  users:     <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></>,
  tag:       <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  layers:    <><path d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>,
  list:      <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
};

function Icon({ name, active }: { name: string; active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{ width: 13, height: 13, stroke: active ? '#2563EB' : '#94A3B8', strokeWidth: 1.8, fill: 'none', flexShrink: 0 }}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}

// ─── Nav item ─────────────────────────────────────────────────────────────────
function NavItem({
  id, icon, title, meta, chip, chipType, active, onClick,
}: {
  id: string; icon: string; title: string; meta: string;
  chip: string; chipType: 'cc' | 'cw' | 'cg' | 'cm' | 'cn';
  active: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
        padding: '7px 9px', borderRadius: 7, border: 'none',
        background: active ? '#EFF6FF' : 'transparent',
        cursor: 'pointer', marginBottom: 1, position: 'relative',
        transition: 'background 100ms',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {active && (
        <span style={{
          position: 'absolute', left: 0, top: '18%', bottom: '18%',
          width: 3, borderRadius: '0 2px 2px 0', background: '#2563EB',
        }} />
      )}
      <Icon name={icon} active={active} />
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <span style={{
          fontSize: 11, fontWeight: active ? 600 : 500,
          color: active ? '#2563EB' : '#64748B',
          display: 'block', lineHeight: 1.3,
        }}>{title}</span>
        <span style={{ fontSize: 9, color: '#94A3B8', display: 'block', marginTop: 1 }}>
          {meta}
        </span>
      </div>
      <Chip type={chipType} label={chip} />
    </button>
  );
}

// ─── Group label ──────────────────────────────────────────────────────────────
function GroupLabel({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 8, fontWeight: 700, letterSpacing: '.10em',
      textTransform: 'uppercase', color: '#94A3B8',
      padding: '10px 8px 4px', display: 'block',
    }}>
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface SidebarProps {
  activeSection:   string;
  onSection:       (id: string) => void;
  healthScore:     number;
  completionRate:  number;
  criticalCount:   number;
  cycleTimeDays:   number;
  estimatedDone:   string;
  totalIssues:     number;
  overdueCount:    number;
  orphanCount:     number;
  blockerCount:    number;
  smartActionsLen: number;
  dataQuality:     number;
  quartersLen:     number;
  epicsLen:        number;
  criticalEpics:   number;
  flowItemsLen:    number;
  hasSprintData:   boolean;
  capacitySkewed:  boolean;
  labelsLen:       number;
  typesLen:        number;
}

export default function DashboardSidebarNav({
  activeSection, onSection,
  healthScore, completionRate, criticalCount, cycleTimeDays,
  estimatedDone, totalIssues, overdueCount, orphanCount, blockerCount,
  smartActionsLen, dataQuality, quartersLen, epicsLen, criticalEpics,
  flowItemsLen, hasSprintData, capacitySkewed, labelsLen, typesLen,
}: SidebarProps) {
  const hc    = healthColor(healthScore);
  const hband = healthBandLabel(healthScore);
  const totalAttention = overdueCount + orphanCount;

  // Dynamic chips per section
  const attentionChipType: 'cc' | 'cw' | 'cn' = totalAttention > 200 ? 'cc' : totalAttention > 50 ? 'cw' : 'cn';
  const qualityChipType:   'cg' | 'cm' | 'cw'  = dataQuality >= 80 ? 'cg' : dataQuality >= 60 ? 'cm' : 'cw';
  const completionChipType:'cg' | 'cw' | 'cc'  = completionRate >= 70 ? 'cg' : completionRate >= 40 ? 'cw' : 'cc';
  const kanbanColor: 'cg' | 'cw' | 'cc' = criticalCount < 100 ? 'cg' : criticalCount < 500 ? 'cw' : 'cc';
  const epicChipType: 'cc' | 'cw' | 'cg' = criticalEpics > 0 ? 'cc' : epicsLen > 0 ? 'cw' : 'cg';
  const scoreChipType: 'cc' | 'cw' | 'cg' = healthScore < 40 ? 'cc' : healthScore < 60 ? 'cw' : 'cg';

  return (
    <aside style={{
      width: 228, flexShrink: 0,
      background: '#ffffff',
      borderRight: '1px solid #E2E8F0',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 52, bottom: 0, left: 0,
      overflowY: 'auto',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>

      {/* ── Health block ── */}
      <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid #E2E8F0' }}>
        {/* Row 1 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#94A3B8' }}>
            Health Score
          </span>
          <span style={{ fontSize: 9, fontWeight: 700, color: hc }}>{hband}</span>
        </div>

        {/* Score number */}
        <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 700, color: hc, lineHeight: 1, marginBottom: 5 }}>
          {healthScore}
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{
            height: '100%', width: `${Math.min(healthScore, 100)}%`,
            background: 'linear-gradient(90deg, #DC2626 0%, #EA580C 50%, #D97706 100%)',
            borderRadius: 2,
          }} />
        </div>

        {/* 2×2 vitals grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {[
            { label: 'Complete', value: `${completionRate}%`, color: completionRate >= 70 ? '#059669' : '#D97706' },
            { label: 'Critical',  value: criticalCount.toLocaleString(), color: '#DC2626' },
            { label: 'Cycle',     value: `${cycleTimeDays}d`, color: cycleTimeDays > 14 ? '#D97706' : '#059669' },
            { label: 'Est. done', value: estimatedDone, color: '#475569', size: 10 },
          ].map(({ label, value, color, size }) => (
            <div key={label} style={{ background: '#F1F5F9', borderRadius: 5, padding: '5px 7px' }}>
              <div style={{ fontSize: 7, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 1 }}>
                {label}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: size ?? 11, fontWeight: 600, color }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section nav ── */}
      <nav style={{ flex: 1, padding: '8px 8px 16px', overflowY: 'auto' }}>

        <GroupLabel label="Overview" />
        <NavItem id="summary"     icon="home"     title="Delivery Summary"    meta="Health · broadcast"                          chip={String(healthScore)}            chipType={scoreChipType}      active={activeSection === 'summary'}     onClick={() => onSection('summary')} />
        <NavItem id="attention"   icon="alertTri" title="Priority Attention"  meta="Blockers · overdue"                          chip={String(totalAttention)}          chipType={attentionChipType}  active={activeSection === 'attention'}   onClick={() => onSection('attention')} />
        <NavItem id="metrics"     icon="monitor"  title="Key Metrics"         meta="6 KPI cards"                                 chip={hband}                          chipType={healthScore < 60 ? 'cw' : 'cg'} active={activeSection === 'metrics'}  onClick={() => onSection('metrics')} />
        <NavItem id="actions"     icon="clock"    title="Smart Actions"       meta={`${smartActionsLen} recommendations`}        chip={String(smartActionsLen)}         chipType="cn"                 active={activeSection === 'actions'}     onClick={() => onSection('actions')} />
        <NavItem id="data-quality" icon="shield"  title="Data Quality"        meta={`${dataQuality}% · field check`}            chip={`${dataQuality}%`}              chipType={qualityChipType}    active={activeSection === 'data-quality'} onClick={() => onSection('data-quality')} />

        <GroupLabel label="Delivery" />
        <NavItem id="visuals"     icon="barChart" title="Visual Analytics"    meta="Charts · bars"                              chip="—"                               chipType="cn"                 active={activeSection === 'visuals'}     onClick={() => onSection('visuals')} />
        <NavItem id="ratios"      icon="circle"   title="Delivery Composition" meta="5-segment ring"                            chip={`${completionRate}%`}            chipType={completionChipType} active={activeSection === 'ratios'}      onClick={() => onSection('ratios')} />
        <NavItem id="delivery"    icon="activity" title="Delivery Controls"   meta="Flow · points · risk"                       chip={criticalCount > 500 ? 'Degraded' : 'OK'}  chipType={criticalCount > 500 ? 'cc' : 'cg'}  active={activeSection === 'delivery'}    onClick={() => onSection('delivery')} />
        <NavItem id="quarters"    icon="calendar" title="Quarter Statistics"  meta={`${quartersLen} quarters`}                  chip={`${quartersLen}Q`}              chipType="cn"                 active={activeSection === 'quarters'}    onClick={() => onSection('quarters')} />
        <NavItem id="kanban"      icon="grid"     title="Kanban Health"       meta="Board statuses"                             chip={kanbanColor === 'cg' ? 'Good' : 'Mixed'}  chipType={kanbanColor}  active={activeSection === 'kanban'}      onClick={() => onSection('kanban')} />
        <NavItem id="sprint"      icon="zap"      title="Sprint Status"       meta={hasSprintData ? 'Sprint data' : 'No sprint detected'}  chip={hasSprintData ? 'Active' : 'N/A'}  chipType={hasSprintData ? 'cg' : 'cn'}  active={activeSection === 'sprint'}  onClick={() => onSection('sprint')} />

        <GroupLabel label="Deep Dive" />
        <NavItem id="ownership"   icon="users"    title="Ownership & Capacity" meta="Team load"                                chip={capacitySkewed ? 'Skewed' : 'Even'}  chipType={capacitySkewed ? 'cw' : 'cg'}  active={activeSection === 'ownership'}  onClick={() => onSection('ownership')} />
        <NavItem id="labels"      icon="tag"      title="Labels & Types"       meta={`${labelsLen} labels · ${typesLen} types`}  chip="—"                           chipType="cn"                 active={activeSection === 'labels'}      onClick={() => onSection('labels')} />
        <NavItem id="readiness"   icon="layers"   title="Epic Readiness"       meta={`${epicsLen} epics · ${criticalEpics} critical`}  chip={criticalEpics > 0 ? 'Critical' : 'Good'}  chipType={epicChipType}  active={activeSection === 'readiness'}  onClick={() => onSection('readiness')} />
        <NavItem id="flow"        icon="list"     title="Flow Health Table"    meta={`${flowItemsLen.toLocaleString()} items · filters`}  chip="All"             chipType="cn"                 active={activeSection === 'flow'}        onClick={() => onSection('flow')} />
      </nav>
    </aside>
  );
}
