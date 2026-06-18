'use client';

import type { ReactNode } from 'react';
import styles from './DashboardSidebarNav.module.scss';
import { SvgIcon } from '@/components/ui/SvgIcon';

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

const NAV_ICONS: Record<string, string> = {
  home: 'dashboard',
  alertTri: 'warning',
  monitor: 'chartBar',
  clock: 'clock',
  shield: 'shield',
  barChart: 'chartBar',
  circle: 'chartPie',
  activity: 'activity',
  calendar: 'calendar',
  grid: 'board',
  zap: 'priorityHigh',
  users: 'people',
  tag: 'tag',
  layers: 'epic',
  list: 'list',
};

function Icon({ name, active }: { name: string; active: boolean }) {
  return (
    <SvgIcon name={NAV_ICONS[name] ?? name} className={`${styles.navIcon} ${active ? styles.iconActive : styles.iconInactive}`} />
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
