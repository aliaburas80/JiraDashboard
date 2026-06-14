'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './DashboardSidebarNav.module.scss';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';

// Which roles can see each dashboard sub-route
const ROUTE_ACCESS: Record<string, string[]> = {
  '/dashboard/summary':             ['admin','scrum_master','product_owner','manager','c_level','user'],
  '/dashboard/priority-attention':  ['admin','scrum_master','manager','user'],
  '/dashboard/key-metrics':         ['admin','scrum_master','product_owner','manager','c_level','user'],
  '/dashboard/actions':             ['admin','scrum_master','manager','user'],
  '/dashboard/data-quality':        ['admin','scrum_master','product_owner','manager','user'],
  '/dashboard/visual-analytics':    ['admin','scrum_master','manager','user'],
  '/dashboard/delivery-composition':['admin','product_owner','manager','c_level','user'],
  '/dashboard/delivery-controls':   ['admin','scrum_master','manager','user'],
  '/dashboard/quarter-statistics':  ['admin','product_owner','manager','c_level','user'],
  '/dashboard/kanban-health':       ['admin','scrum_master','manager','user'],
  '/dashboard/sprint-status':       ['admin','scrum_master','manager','user'],
  '/dashboard/ownership':           ['admin','scrum_master','manager','user'],
  '/dashboard/labels':              ['admin','product_owner','user'],
  '/dashboard/epic-readiness':      ['admin','product_owner','user'],
  '/dashboard/flow-health':         ['admin','scrum_master','manager','user'],
};

function canSee(href: string, role: string): boolean {
  return ROUTE_ACCESS[href]?.includes(role) ?? true;
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ type, label }: { type: 'cc' | 'cw' | 'cg' | 'cm' | 'cn'; label: string }) {
  const cls = type === 'cc' ? styles.chipCc : type === 'cw' ? styles.chipCw
    : type === 'cg' ? styles.chipCg : type === 'cm' ? styles.chipCm : styles.chipCn;
  return <span className={`${styles.chip} ${cls}`}>{label}</span>;
}

// ─── Health helpers ───────────────────────────────────────────────────────────
function healthBandLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'At-Risk';
  return 'Critical';
}

// ─── Icons ────────────────────────────────────────────────────────────────────
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
  users:     <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
  tag:       <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  layers:    <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
  list:      <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
};

function NavIcon({ name, active }: { name: string; active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`${styles.navIcon} ${active ? styles.iconActive : styles.iconInactive}`} aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

// ─── Nav item (Link-based) ────────────────────────────────────────────────────
function NavItem({ href, icon, title, meta, chip, chipType }: {
  href: string; icon: string; title: string; meta: string;
  chip: string; chipType: 'cc' | 'cw' | 'cg' | 'cm' | 'cn';
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
    >
      {active && <span className={styles.activeIndicator} />}
      <NavIcon name={icon} active={active} />
      <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
        <span className={`${styles.navTextTitle} ${active ? styles.navTextActive : styles.navTextInactive}`}>
          {title}
        </span>
        <span className={styles.navTextMeta}>{meta}</span>
      </div>
      <Chip type={chipType} label={chip} />
    </Link>
  );
}

function GroupLabel({ label }: { label: string }) {
  return <span className={styles.groupLabel}>{label}</span>;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  metrics: DashboardMetrics | null;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DashboardNavSidebar({ metrics }: Props) {
  const [userRole, setUserRole] = useState<string>('user');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.role) setUserRole(data.role); })
      .catch(() => {});
  }, []);

  const see = (href: string) => canSee(href, userRole);

  const flow = metrics?.flow;
  const storyPoints = metrics?.storyPoints;
  const healthScore = metrics?.healthScore ?? 0;
  const completionRate = metrics?.completionRate ?? 0;
  const criticalCount = flow?.critical ?? 0;
  const cycleTimeDays = flow?.averageCycleTimeDays ?? 0;
  const prediction = metrics?.prediction;
  const estimatedDone = prediction?.complete
    ? 'Done ✅'
    : (prediction?.predictedDate ?? (prediction?.daysRemaining != null ? `~${prediction.daysRemaining}d` : 'N/A'));

  const flowItems: FlowItem[] = metrics?.flow?.items ?? [];
  const DONE_STATUSES = ['done', 'closed', 'resolved'];
  const overdueCount = flowItems.filter(i => Number(i.ageDays) > 10 && !DONE_STATUSES.includes(String(i.status ?? '').trim().toLowerCase())).length;
  const orphanCount = flowItems.filter(i => i.isOrphan).length;
  const dataQualityScore: number = (metrics as any)?.dataQuality?.score ?? 80;
  const quarters = (metrics?.quarters as any[]) ?? [];
  const epics = (metrics?.epics as any[]) ?? [];
  const criticalEpics = epics.filter((e: any) => (e.critical ?? 0) > 0).length;
  const smartActionsLen = (() => {
    if (!metrics) return 0;
    let count = 0;
    const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
    const critBlockers = flowItems.filter(i => i.health === 'critical' && norm(i.reason).includes('block'));
    if (critBlockers.length) count++;
    const staleActive = flowItems.filter(i => i.health === 'critical' && norm(i.reason).includes('in progress over 14'));
    if (staleActive.length) count++;
    const capacity = ((metrics?.capacity || []) as any[]);
    const overloaded = capacity.filter((c: any) => c.loadShare > 35);
    if (overloaded.length && capacity.length > 2) count++;
    if (orphanCount > 0) count++;
    if (criticalEpics > 0) count++;
    return Math.min(count, 5);
  })();

  const totalAttention = overdueCount + orphanCount;
  const hband = healthBandLabel(healthScore);
  const healthVariantClass =
    healthScore >= 90 ? styles.healthBlockExcellent
      : healthScore >= 75 ? styles.healthBlockGood
      : healthScore >= 60 ? styles.healthBlockModerate
      : healthScore >= 40 ? styles.healthBlockAtRisk
      : styles.healthBlockCritical;
  const progressWidth = Math.min(100, Math.max(0, healthScore));

  const attentionChipType: 'cc' | 'cw' | 'cn' = totalAttention > 200 ? 'cc' : totalAttention > 50 ? 'cw' : 'cn';
  const qualityChipType: 'cg' | 'cm' | 'cw' = dataQualityScore >= 80 ? 'cg' : dataQualityScore >= 60 ? 'cm' : 'cw';
  const completionChipType: 'cg' | 'cw' | 'cc' = completionRate >= 70 ? 'cg' : completionRate >= 40 ? 'cw' : 'cc';
  const kanbanColor: 'cg' | 'cw' | 'cc' = criticalCount < 100 ? 'cg' : criticalCount < 500 ? 'cw' : 'cc';
  const scoreChipType: 'cc' | 'cw' | 'cg' = healthScore < 40 ? 'cc' : healthScore < 60 ? 'cw' : 'cg';
  const epicChipType: 'cc' | 'cw' | 'cg' = criticalEpics > 0 ? 'cc' : epics.length > 0 ? 'cw' : 'cg';

  return (
    <aside className={styles.sidebar}>

      {/* ── Health block ── */}
      <div className={`${styles.healthBlock} ${healthVariantClass}`}>
        <div className={styles.healthHeader}>
          <span className={styles.healthLabel}>Health Score</span>
          <span className={styles.healthBand}>{hband}</span>
        </div>
        <div className={styles.healthValue}>{healthScore}</div>
        <div className={styles.healthProgress}>
          <div
            className={styles.healthProgressFill}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        <div className={styles.vitalsGrid}>
          {[
            { label: 'Complete', value: `${completionRate}%`, valueClass: completionRate >= 70 ? styles.healthPositive : styles.healthWarning },
            { label: 'Critical', value: criticalCount.toLocaleString(), valueClass: styles.healthDanger },
            { label: 'Cycle', value: `${cycleTimeDays}d`, valueClass: cycleTimeDays > 14 ? styles.healthWarning : styles.healthPositive },
            { label: 'Est. done', value: estimatedDone, valueClass: styles.healthNeutral },
          ].map(({ label, value, valueClass }) => (
            <div key={label} className={styles.vitalCard}>
              <div className={styles.vitalLabel}>{label}</div>
              <div className={`${styles.vitalValue} ${valueClass}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className={styles.navSection}>
        <GroupLabel label="Overview" />
        {see('/dashboard/summary')            && <NavItem href="/dashboard/summary"             icon="home"     title="Delivery Summary"      meta="Health · broadcast"                          chip={String(healthScore)}           chipType={scoreChipType} />}
        {see('/dashboard/priority-attention') && <NavItem href="/dashboard/priority-attention"  icon="alertTri" title="Priority Attention"    meta="Blockers · overdue"                          chip={String(totalAttention)}        chipType={attentionChipType} />}
        {see('/dashboard/key-metrics')        && <NavItem href="/dashboard/key-metrics"         icon="monitor"  title="Key Metrics"           meta="6 KPI cards"                                 chip={hband}                         chipType={healthScore < 60 ? 'cw' : 'cg'} />}
        {see('/dashboard/actions')            && <NavItem href="/dashboard/actions"             icon="clock"    title="Smart Actions"         meta={`${smartActionsLen} recommendations`}        chip={String(smartActionsLen)}       chipType="cn" />}
        {see('/dashboard/data-quality')       && <NavItem href="/dashboard/data-quality"        icon="shield"   title="Data Quality"          meta={`${dataQualityScore}% · field check`}        chip={`${dataQualityScore}%`}        chipType={qualityChipType} />}

        <GroupLabel label="Delivery" />
        {see('/dashboard/visual-analytics')     && <NavItem href="/dashboard/visual-analytics"    icon="barChart" title="Visual Analytics"      meta="Charts · bars"                               chip="—"                             chipType="cn" />}
        {see('/dashboard/delivery-composition') && <NavItem href="/dashboard/delivery-composition" icon="circle"  title="Delivery Composition"  meta="5-segment ring"                              chip={`${completionRate}%`}          chipType={completionChipType} />}
        {see('/dashboard/delivery-controls')    && <NavItem href="/dashboard/delivery-controls"   icon="activity" title="Delivery Controls"     meta="Flow · points · risk"                        chip={criticalCount > 500 ? 'Degraded' : 'OK'} chipType={criticalCount > 500 ? 'cc' : 'cg'} />}
        {see('/dashboard/quarter-statistics')   && <NavItem href="/dashboard/quarter-statistics"  icon="calendar" title="Quarter Statistics"    meta={`${quarters.length} quarters`}               chip={`${quarters.length}Q`}         chipType="cn" />}
        {see('/dashboard/kanban-health')        && <NavItem href="/dashboard/kanban-health"       icon="grid"     title="Kanban Health"         meta="Board statuses"                              chip={kanbanColor === 'cg' ? 'Good' : 'Mixed'} chipType={kanbanColor} />}
        {see('/dashboard/sprint-status')        && <NavItem href="/dashboard/sprint-status"       icon="zap"      title="Sprint Status"         meta={metrics?.sprint ? 'Sprint data' : 'No sprint'} chip={metrics?.sprint ? 'Active' : 'N/A'} chipType={metrics?.sprint ? 'cg' : 'cn'} />}

        <GroupLabel label="Deep Dive" />
        {see('/dashboard/ownership')      && <NavItem href="/dashboard/ownership"       icon="users"  title="Ownership & Capacity" meta="Team load · epics"                              chip={(() => { const cap = (metrics?.capacity as any[]) ?? []; const sk = cap.filter((c: any) => c.loadShare > 35); return sk.length > 0 ? 'Skewed' : 'Even'; })()}  chipType={(() => { const cap = (metrics?.capacity as any[]) ?? []; return cap.some((c: any) => c.loadShare > 35) ? 'cw' : 'cg'; })()} />}
        {see('/dashboard/labels')         && <NavItem href="/dashboard/labels"          icon="tag"    title="Labels & Types"        meta={`${(metrics?.labels as any)?.uniqueLabels ?? 0} labels`}  chip="—"  chipType="cn" />}
        {see('/dashboard/epic-readiness') && <NavItem href="/dashboard/epic-readiness"  icon="layers" title="Epic Readiness"        meta={`${(metrics?.epics as any[])?.length ?? 0} epics · ${epicChipType === 'cc' ? criticalEpics + ' critical' : 'on track'}`}  chip={criticalEpics > 0 ? 'Critical' : 'Good'}  chipType={epicChipType} />}
        {see('/dashboard/flow-health')    && <NavItem href="/dashboard/flow-health"     icon="list"   title="Flow Health Table"     meta={`${flowItems.length.toLocaleString()} items · filters`}  chip="All"  chipType="cn" />}
      </nav>
    </aside>
  );
}
