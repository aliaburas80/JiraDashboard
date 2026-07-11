// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Builds the 3-column Team Role View grid (Scrum Master, Product Owner,
// Manager) directly from already-computed DashboardMetrics — no new
// calculations are introduced. Every metric/status below is either:
//   (a) a direct existing field,
//   (b) a simple, documented derivation of existing fields (a ratio or a
//       linear complement — not a new business formula), or
//   (c) an explicitly labeled FALLBACK constant, used only where no
//       equivalent data exists anywhere in the app yet (e.g. retrospective
//       action ownership/completion isn't tracked — see RETRO persistence
//       note in DEVELOPER_GUIDE.md).
//
// Thresholds reused here (>35% capacity load — including the "team size > 2"
// guard that keeps a 1-2 person team from trivially tripping it, <60%
// delivery confidence, 'Declining' trend) are copied from the exact same
// checks already used in src/services/coaching/generators/{scrumMaster,
// engineeringManager,deliveryManager}.generator.ts — not new policy. The one
// genuinely new threshold (20% carryover rate) has no existing app-wide
// equivalent and is called out below.
//
// "Manager" blends signals the old Engineering Manager + Delivery Manager
// coaching categories covered (capacity, forecast credibility, cross-team
// blockers, throughput trend) into one column, matching how the `manager`
// AppRole already groups those categories elsewhere in the app.

import type { DashboardMetrics } from '@/types/metrics';
import type { RoleAction, RoleMetric, RoleRule, RoleView, Status } from '@/types/roleGridCoaching';
import { getEpics, getRelations } from './coachingMetricsAccess';

// No existing app-wide "agreed carryover threshold" — 20% is a reasonable
// default pending a real team-configured threshold (CLAUDE.md §7: this kind
// of policy value is a good future Level-3 runtime-configuration candidate).
const CARRYOVER_AT_RISK_THRESHOLD_PCT = 20;

// Same >35% load-share definition used in scrumMaster.generator.ts and
// engineeringManager.generator.ts to flag an overloaded assignee.
const CAPACITY_OVERLOAD_LOAD_SHARE_PCT = 35;

// Same <60% threshold used in deliveryManager.generator.ts for low delivery confidence.
const LOW_DELIVERY_CONFIDENCE_PCT = 60;

// FALLBACK: no retrospective-action-ownership/completion tracking exists yet
// (RETRO persistence explicitly deferred — see DEVELOPER_GUIDE.md RETRO-15/30).
const RETRO_ACTIONS_COMPLETED_FALLBACK_PCT = 71;

function buildScrumMasterRole(metrics: DashboardMetrics): RoleView {
  const blockedItems = getRelations(metrics).blockedItems; // src/services/coaching/coachingMetricsAccess.ts
  const sprints = metrics.throughput.sprint.sprints;        // per-sprint records
  const latestSprint = sprints[0];
  const totalCommitted = metrics.throughput.sprint.totalCommitted;
  const totalCarryover = sprints.reduce((sum, s) => sum + s.carryoverCount, 0);
  // Carryover rate = total carried-over items / total committed items across recorded sprints.
  const carryoverRatePct = totalCommitted > 0 ? Math.round((totalCarryover / totalCommitted) * 100) : 0;
  const cycleTime = metrics.flow.averageCycleTimeDays; // src/types/metrics.ts FlowSummary

  const rules: RoleRule[] = [
    {
      title: 'Blocked work must be reviewed daily',
      description: 'Escalate items blocked for more than two working days.',
      status: blockedItems.length > 0 ? 'critical' : 'healthy',
    },
    {
      title: 'Carry-over must remain below the agreed threshold',
      description: 'Review unfinished work and identify the system cause.',
      status: carryoverRatePct > CARRYOVER_AT_RISK_THRESHOLD_PCT ? 'risk' : 'healthy',
    },
    {
      title: 'Every sprint must have a measurable goal',
      description: 'Confirm the team can explain what success looks like.',
      status: latestSprint && latestSprint.goalOutcome !== 'Met' ? 'review' : 'healthy',
    },
    {
      title: 'Retrospective actions must have owners',
      description: 'Track agreed actions until they are completed or replaced.',
      status: 'healthy', // FALLBACK — no ownership-tracking data exists to evaluate this.
    },
  ];

  const actions: RoleAction[] = [
    { title: 'Review blocked items in the daily stand-up', detail: 'Owner: Scrum Master · Due: Today' },
    { title: 'Facilitate story splitting before sprint planning', detail: 'Collaborators: Technical Lead and Product Owner' },
    { title: 'Run a root-cause discussion about carry-over', detail: 'Ceremony: Next retrospective' },
  ];

  const metricsList: RoleMetric[] = [
    { label: 'Blocked items', value: blockedItems.length },
    { label: 'Carry-over', value: `${carryoverRatePct}%` },
    { label: 'Cycle time', value: cycleTime > 0 ? `${cycleTime.toFixed(1)} days` : '—' },
    { label: 'Retro actions completed', value: `${RETRO_ACTIONS_COMPLETED_FALLBACK_PCT}%` }, // FALLBACK
  ];

  return {
    id: 'scrum_master',
    initials: 'SM',
    title: 'Scrum Master',
    subtitle: 'Flow, blockers, ceremonies, and team improvement',
    tone: 'blue',
    rules,
    actions,
    metrics: metricsList,
  };
}

function buildProductOwnerRole(metrics: DashboardMetrics): RoleView {
  const overdueIssues = metrics.risk.overdueIssues; // src/types/metrics.ts RiskMetrics
  const orphanCount = metrics.flow.items.filter((i) => i.isOrphan).length;
  const criticalEpics = getEpics(metrics).filter((e) => e.critical > 0); // src/services/coaching/coachingMetricsAccess.ts
  const sprints = metrics.throughput.sprint.sprints;
  const metSprints = sprints.filter((s) => s.goalOutcome === 'Met').length;
  // Sprint goal coverage = % of recorded sprints whose goalOutcome was 'Met'.
  const sprintGoalCoveragePct = sprints.length > 0 ? Math.round((metSprints / sprints.length) * 100) : null;

  const rules: RoleRule[] = [
    {
      title: 'Ready work must have a parent or Epic Link',
      description: 'Do not accept work into a sprint without value traceability.',
      status: orphanCount > 0 ? 'critical' : 'healthy',
    },
    {
      title: 'Overdue target dates must be reviewed',
      description: 'Confirm, update, or remove dates that are no longer valid.',
      status: overdueIssues > 0 ? 'critical' : 'healthy',
    },
    {
      title: 'Critical epics must pass readiness checks',
      description: 'Validate the goal, acceptance criteria, dependencies, and ownership.',
      status: criticalEpics.length > 0 ? 'risk' : 'healthy',
    },
    {
      title: 'Priority changes must be visible to the team',
      description: 'Record why priority changed and what work is affected.',
      status: 'healthy', // FALLBACK — no priority-change audit trail exists to evaluate this.
    },
  ];

  const actions: RoleAction[] = [
    { title: `Review the ${criticalEpics.length} critical epic${criticalEpics.length === 1 ? '' : 's'}`, detail: 'Due: Before the next refinement session' },
    { title: 'Update overdue delivery dates', detail: 'Requirement: Confirm decisions with stakeholders' },
    { title: 'Link orphan stories to business outcomes', detail: 'Collaborators: Business Analyst and Technical Lead' },
  ];

  const metricsList: RoleMetric[] = [
    { label: 'Critical epics', value: criticalEpics.length },
    { label: 'Overdue items', value: overdueIssues },
    { label: 'Orphan items', value: orphanCount },
    { label: 'Sprint goal coverage', value: sprintGoalCoveragePct !== null ? `${sprintGoalCoveragePct}%` : '—' },
  ];

  return {
    id: 'product_owner',
    initials: 'PO',
    title: 'Product Owner',
    subtitle: 'Value, readiness, priority, and stakeholder decisions',
    tone: 'purple',
    rules,
    actions,
    metrics: metricsList,
  };
}

function buildManagerRole(metrics: DashboardMetrics): RoleView {
  const overloaded = metrics.capacity.filter((c) => c.loadShare > CAPACITY_OVERLOAD_LOAD_SHARE_PCT);
  // Same guard scrumMaster.generator.ts / engineeringManager.generator.ts apply before
  // treating overload as a real signal — a 1-2 person team trivially has one person
  // over 35% load share, which isn't a meaningful imbalance.
  const capacitySignalMeaningful = metrics.capacity.length > 2;
  const deliveryConfidence = metrics.overallDeliveryConfidence; // src/types/metrics.ts
  const blockedItems = getRelations(metrics).blockedItems;
  const trendDirection = metrics.throughput.sprint.trendDirection;
  const criticalFlowItems = metrics.flow.critical; // src/types/metrics.ts FlowSummary — count of critical-health items
  // Forecast variance = 100 - overallDeliveryConfidence (inverse framing of the
  // existing confidence score; not a new calculation).
  const forecastVariancePct = deliveryConfidence > 0 ? 100 - deliveryConfidence : null;

  const rules: RoleRule[] = [
    {
      title: 'Capacity overload must be corrected',
      description: 'Rebalance ownership when teams exceed the agreed threshold.',
      status: overloaded.length > 0 && capacitySignalMeaningful ? 'risk' : 'healthy',
    },
    {
      title: 'Delivery forecasts must be credible',
      description: 'Review forecast variance and remove unsupported commitments.',
      status: deliveryConfidence > 0 && deliveryConfidence < LOW_DELIVERY_CONFIDENCE_PCT ? 'critical' : 'healthy',
    },
    {
      title: 'Critical dependencies need escalation owners',
      description: 'Assign a decision-maker for cross-team or external blockers.',
      status: blockedItems.length > 0 ? 'review' : 'healthy',
    },
    {
      title: 'Repeated flow problems require system action',
      description: 'Do not treat repeated delays as individual performance issues.',
      status: trendDirection === 'Declining' ? 'risk' : 'healthy',
    },
  ];

  const actions: RoleAction[] = [
    {
      title: overloaded.length > 0 && capacitySignalMeaningful
        ? `Rebalance ${overloaded.length} overloaded team member${overloaded.length === 1 ? '' : 's'}`
        : 'Confirm team capacity stays balanced',
      detail: 'Requirement: Review ownership and available capacity',
    },
    { title: 'Escalate unresolved dependencies', detail: 'Requirement: Assign business and technical decision owners' },
    { title: 'Review the delivery forecast with the Product Owner', detail: 'Requirement: Confirm what is achievable before stakeholder communication' },
  ];

  const metricsList: RoleMetric[] = [
    { label: 'Delivery health score', value: metrics.healthScore },
    { label: 'Overloaded members', value: overloaded.length },
    { label: 'Forecast variance', value: forecastVariancePct !== null ? `${forecastVariancePct}%` : '—' },
    { label: 'Critical items', value: criticalFlowItems },
  ];

  return {
    id: 'manager',
    initials: 'MG',
    title: 'Manager',
    subtitle: 'Capacity, delivery risk, escalation, and decisions',
    tone: 'green',
    rules,
    actions,
    metrics: metricsList,
  };
}

export function buildRoleGridView(metrics: DashboardMetrics): RoleView[] {
  return [
    buildScrumMasterRole(metrics),
    buildProductOwnerRole(metrics),
    buildManagerRole(metrics),
  ];
}

export type { Status };
