'use client';

import type { ReactNode } from 'react';
import styles from './DashboardSidebarNav.module.scss';

// ─── Chip classes (inline styles matching the spec) ───────────────────────────
function Chip({ type, label }: { type: 'cc' | 'cw' | 'cg' | 'cm' | 'cn'; label: string }) {
  const className =
    type === 'cc' ? styles.chipCc
      : type === 'cw' ? styles.chipCw
      : type === 'cg' ? styles.chipCg
      : type === 'cm' ? styles.chipCm
      : styles.chipCn;

  return <span className={`${styles.chip} ${className}`}>{label}</span>;
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
      className={`${styles.navIcon} ${active ? styles.iconActive : styles.iconInactive}`}
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
      className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
    >
      {active && <span className={styles.activeIndicator} />}
      <Icon name={icon} active={active} />
      <div className="min-w-0 flex-1 text-left">
        <span className={`${styles.navTextTitle} ${active ? styles.navTextActive : styles.navTextInactive}`}>
          {title}
        </span>
        <span className={styles.navTextMeta}>{meta}</span>
      </div>
      <Chip type={chipType} label={chip} />
    </button>
  );
}

// ─── Group label ──────────────────────────────────────────────────────────────
function GroupLabel({ label }: { label: string }) {
  return <span className={styles.groupLabel}>{label}</span>;
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
  const hband = healthBandLabel(healthScore);
  const totalAttention = overdueCount + orphanCount;
  const healthVariantClass =
    healthScore >= 90 ? styles.healthBlockExcellent
      : healthScore >= 75 ? styles.healthBlockGood
      : healthScore >= 60 ? styles.healthBlockModerate
      : healthScore >= 40 ? styles.healthBlockAtRisk
      : styles.healthBlockCritical;
  const progressWidthClass =
    styles[`healthProgressWidth${Math.min(100, Math.max(0, healthScore))}` as keyof typeof styles];

  // Dynamic chips per section
  const attentionChipType: 'cc' | 'cw' | 'cn' = totalAttention > 200 ? 'cc' : totalAttention > 50 ? 'cw' : 'cn';
  const qualityChipType:   'cg' | 'cm' | 'cw'  = dataQuality >= 80 ? 'cg' : dataQuality >= 60 ? 'cm' : 'cw';
  const completionChipType:'cg' | 'cw' | 'cc'  = completionRate >= 70 ? 'cg' : completionRate >= 40 ? 'cw' : 'cc';
  const kanbanColor: 'cg' | 'cw' | 'cc' = criticalCount < 100 ? 'cg' : criticalCount < 500 ? 'cw' : 'cc';
  const epicChipType: 'cc' | 'cw' | 'cg' = criticalEpics > 0 ? 'cc' : epicsLen > 0 ? 'cw' : 'cg';
  const scoreChipType: 'cc' | 'cw' | 'cg' = healthScore < 40 ? 'cc' : healthScore < 60 ? 'cw' : 'cg';

  return (
    <aside className={styles.sidebar}>

      {/* ── Health block ── */}
      <div className={`${styles.healthBlock} ${healthVariantClass}`}>
        <div className={styles.healthHeader}>
          <span className={styles.healthLabel}>Health Score</span>
          <span className={styles.healthBand}>{hband}</span>
        </div>

        {/* Score number */}
        <div className={styles.healthValue}>{healthScore}</div>

        {/* Progress bar */}
        <div className={styles.healthProgress}>
          <div className={`${styles.healthProgressFill} ${progressWidthClass}`} />
        </div>

        {/* 2×2 vitals grid */}
        <div className={styles.vitalsGrid}>
          {[
            { label: 'Complete', value: `${completionRate}%`, valueClass: completionRate >= 70 ? styles.healthPositive : styles.healthWarning, size: 11 },
            { label: 'Critical',  value: criticalCount.toLocaleString(), valueClass: styles.healthDanger, size: 11 },
            { label: 'Cycle',     value: `${cycleTimeDays}d`, valueClass: cycleTimeDays > 14 ? styles.healthWarning : styles.healthPositive, size: 11 },
            { label: 'Est. done', value: estimatedDone, valueClass: styles.healthNeutral, size: 10 },
          ].map(({ label, value, valueClass, size }) => (
            <div key={label} className={styles.vitalCard}>
              <div className={styles.vitalLabel}>{label}</div>
              <div className={`${styles.vitalValue} ${valueClass}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section nav ── */}
      <nav className={styles.navSection}>

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
