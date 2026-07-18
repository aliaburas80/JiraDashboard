'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './DashboardSidebarNav.module.scss';
import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { getHealthBand, type HealthBand } from '@/lib/utils';

// Which roles see each dashboard sub-route in the sidebar. This is relevance
// curation, not an access boundary: every role sees the same underlying
// dataset app-wide, so a hidden link is reachable and fully functional by
// direct URL for any authenticated user, on purpose. Confirmed intentional
// during the full-application product audit (docs/product-audit/, Checkpoint
// 4 §C) — do not add server-side enforcement here without a corresponding
// product decision to actually restrict data access by role, since none
// exists today.
const ROUTE_ACCESS: Record<string, string[]> = {
  '/dashboard/summary':             ['admin','scrum_master','product_owner','manager','c_level','user'],
  '/dashboard/priority-attention':  ['admin','scrum_master','manager','user'],
  '/dashboard/key-metrics':         ['admin','scrum_master','product_owner','manager','c_level','user'],
  '/dashboard/data-quality':        ['admin','scrum_master','product_owner','manager','c_level','user'],
  '/dashboard/trends':              ['admin','scrum_master','product_owner','manager','c_level','user'],
  '/dashboard/ownership':           ['admin','scrum_master','manager','user'],
  '/dashboard/labels':              ['admin','product_owner','user'],
  '/dashboard/epic-readiness':      ['admin','product_owner','user'],
  '/dashboard/flow-health':         ['admin','scrum_master','manager','user'],
  '/dashboard/coaching':            ['admin','scrum_master','product_owner','manager','c_level','user'],
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
// CP3-018: label text kept identical to the original hardcoded copy ("At-Risk"
// hyphenated); only the band cutoffs now come from the shared getHealthBand().
const HEALTH_BAND_LABELS: Record<HealthBand, string> = {
  excellent: 'Excellent', good: 'Good', moderate: 'Moderate', 'at-risk': 'At-Risk', critical: 'Critical',
};
function healthBandLabel(score: number): string {
  return HEALTH_BAND_LABELS[getHealthBand(score)];
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

function NavIcon({ name, active }: { name: string; active: boolean }) {
  return (
    <SvgIcon name={NAV_ICONS[name] ?? name} className={`${styles.navIcon} ${active ? styles.iconActive : styles.iconInactive}`} />
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
      <div className={styles.navItemText}>
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
  open?: boolean;
  onClose?: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DashboardNavSidebar({ metrics, open, onClose }: Props) {
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
  const scoreChipType: 'cc' | 'cw' | 'cg' = healthScore < 40 ? 'cc' : healthScore < 60 ? 'cw' : 'cg';
  const epicChipType: 'cc' | 'cw' | 'cg' = criticalEpics > 0 ? 'cc' : epics.length > 0 ? 'cw' : 'cg';

  return (
    <aside className={`${styles.sidebar}${open ? ` ${styles.sidebarOpen}` : ''}`}>

      {/* ── Mobile close button (hidden on desktop via CSS) ── */}
      {onClose && (
        <button type="button" className={styles.mobileClose} onClick={onClose} aria-label="Close navigation">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* ── Health block ── */}
      {/* id used as the guided tour's anchor for this sidebar — a small,
          fixed-height element near the top, so the tour's popover (which
          only positions above/below a target, not beside a tall one)
          doesn't end up placed off-screen the way it would if it targeted
          the full-height <aside> below. */}
      <div id="dashboard-nav-sidebar" className={`${styles.healthBlock} ${healthVariantClass}`}>
        <div className={styles.healthHeader}>
          <span className={styles.healthLabel}>Health Score</span>
          <span className={styles.healthBand}>{hband}</span>
        </div>
        <div className={styles.healthValue}>{healthScore}</div>
        <div className={styles.healthProgress}>
          {/* --progress-width is data-driven (healthScore); consumed by .healthProgressFill */}
          <div
            className={styles.healthProgressFill}
            style={{ '--progress-width': `${progressWidth}%` } as React.CSSProperties}
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
        {see('/dashboard/priority-attention') && <NavItem href="/dashboard/priority-attention"  icon="alertTri" title="Priority Attention"    meta="Blockers · overdue · actions"                chip={String(totalAttention)}        chipType={attentionChipType} />}
        {see('/dashboard/key-metrics')        && <NavItem href="/dashboard/key-metrics"         icon="monitor"  title="Key Metrics"           meta="6 KPI cards"                                 chip={hband}                         chipType={healthScore < 60 ? 'cw' : 'cg'} />}
        {see('/dashboard/data-quality')       && <NavItem href="/dashboard/data-quality"        icon="shield"   title="Data Quality & Composition" meta={`${dataQualityScore}% quality · ${completionRate}% complete`} chip={`${dataQualityScore}%`}        chipType={qualityChipType} />}

        <GroupLabel label="Delivery" />
        {see('/dashboard/trends')               && <NavItem href="/dashboard/trends"             icon="calendar" title="Trends"                meta="Sprints · quarters"                          chip={metrics?.sprint ? 'Active' : `${quarters.length}Q`} chipType={metrics?.sprint ? 'cg' : 'cn'} />}

        <GroupLabel label="Deep Dive" />
        {see('/dashboard/ownership')      && <NavItem href="/dashboard/ownership"       icon="users"  title="Ownership & Capacity" meta="Team load · epics"                              chip={(() => { const cap = (metrics?.capacity as any[]) ?? []; const sk = cap.filter((c: any) => c.loadShare > 35); return sk.length > 0 ? 'Skewed' : 'Even'; })()}  chipType={(() => { const cap = (metrics?.capacity as any[]) ?? []; return cap.some((c: any) => c.loadShare > 35) ? 'cw' : 'cg'; })()} />}
        {see('/dashboard/labels')         && <NavItem href="/dashboard/labels"          icon="tag"    title="Labels & Types"        meta={`${(metrics?.labels as any)?.uniqueLabels ?? 0} labels`}  chip="—"  chipType="cn" />}
        {see('/dashboard/epic-readiness') && <NavItem href="/dashboard/epic-readiness"  icon="layers" title="Epic Readiness"        meta={`${(metrics?.epics as any[])?.length ?? 0} epics · ${epicChipType === 'cc' ? criticalEpics + ' critical' : 'on track'}`}  chip={criticalEpics > 0 ? 'Critical' : 'Good'}  chipType={epicChipType} />}
        {see('/dashboard/flow-health')    && <NavItem href="/dashboard/flow-health"     icon="list"   title="Flow Health Table"     meta={`${flowItems.length.toLocaleString()} items · filters`}  chip="All"  chipType="cn" />}
        {see('/dashboard/coaching')       && <NavItem href="/dashboard/coaching"        icon="lightbulb" title="Team Role View"     meta="Scrum Master · Product Owner · Manager"  chip="New"  chipType="cn" />}
      </nav>
    </aside>
  );
}
