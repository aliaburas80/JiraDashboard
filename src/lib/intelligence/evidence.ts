// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.

import type { DashboardMetrics, FlowItem } from '@/types/metrics';
import type {
  IntelligenceAction,
  IntelligenceAgentDefinition,
  IntelligenceAgentId,
  IntelligenceAnswer,
  IntelligenceEpicSignal,
  IntelligenceFinding,
  IntelligenceRiskItem,
  IntelligenceSeverity,
  IntelligenceSnapshot,
} from './types';

const norm = (value: unknown): string => String(value ?? '').trim().toLowerCase();
const asNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const clampPct = (value: unknown): number => Math.max(0, Math.min(100, Math.round(asNumber(value))));

export const INTELLIGENCE_AGENTS: IntelligenceAgentDefinition[] = [
  {
    id: 'executive',
    name: 'Executive Briefing Agent',
    shortName: 'Executive',
    description: 'Turns delivery metrics into a concise leadership brief: confidence, exposure, and decisions.',
    icon: 'briefcase',
    suggestedQuestions: [
      'What should leadership pay attention to today?',
      'Give me a one-minute delivery briefing.',
      'What is the biggest threat to delivery confidence?',
    ],
  },
  {
    id: 'flow',
    name: 'Flow & Bottleneck Agent',
    shortName: 'Flow',
    description: 'Finds blocked work, aging items, cycle-time pressure, and concentration that is slowing flow.',
    icon: 'activity',
    suggestedQuestions: [
      'Where is work getting stuck?',
      'Which items should we unblock first?',
      'Is team capacity concentrated on too few people?',
    ],
  },
  {
    id: 'risk',
    name: 'Risk & Quality Agent',
    shortName: 'Risk',
    description: 'Connects critical work, defects, blockers, and data confidence to concrete delivery risk.',
    icon: 'shield',
    suggestedQuestions: [
      'What are the top delivery risks?',
      'Which risks need action now versus monitoring?',
      'Can I trust this data enough to make a decision?',
    ],
  },
  {
    id: 'forecast',
    name: 'Forecast Agent',
    shortName: 'Forecast',
    description: 'Explains delivery outlook, prediction confidence, remaining work, and what could move the date.',
    icon: 'timeline',
    suggestedQuestions: [
      'When are we likely to finish?',
      'What could move the forecast date?',
      'How confident should I be in the current outlook?',
    ],
  },
];

export function isIntelligenceAgentId(value: unknown): value is IntelligenceAgentId {
  return INTELLIGENCE_AGENTS.some(agent => agent.id === value);
}

function riskSeverity(item: FlowItem): IntelligenceSeverity {
  if (item.health === 'critical' || item.blocked) return 'critical';
  if (item.health === 'warning' || norm(item.priority) === 'high' || norm(item.priority) === 'highest') return 'warning';
  if (item.health === 'good') return 'good';
  return 'neutral';
}

function riskScore(item: FlowItem): number {
  let score = 0;
  if (item.blocked) score += 100;
  if (item.health === 'critical') score += 80;
  if (item.health === 'warning') score += 35;
  if (norm(item.priority) === 'highest') score += 40;
  else if (norm(item.priority) === 'high') score += 25;
  score += Math.min(45, Math.max(0, asNumber(item.activeAgeDays ?? item.ageDays)));
  if (norm(item.type) === 'bug') score += 12;
  return score;
}

function buildRiskItems(metrics: DashboardMetrics): IntelligenceRiskItem[] {
  const items = metrics.flow?.items ?? [];
  const seen = new Set<string>();
  return [...items]
    .filter(item => {
      if (!item.key || seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    })
    .sort((a, b) => riskScore(b) - riskScore(a))
    .slice(0, 12)
    .map(item => ({
      key: item.key,
      summary: String(item.summary ?? '').slice(0, 180),
      status: item.status || 'Unknown',
      assignee: item.assignee || 'Unassigned',
      reason: String(item.reason ?? '').slice(0, 220),
      ageDays: Number.isFinite(Number(item.activeAgeDays ?? item.ageDays))
        ? Math.round(Number(item.activeAgeDays ?? item.ageDays))
        : null,
      blocked: Boolean(item.blocked),
      severity: riskSeverity(item),
    }));
}

function buildCapacityHotspots(metrics: DashboardMetrics) {
  return [...(metrics.capacity ?? [])]
    .filter(entry => entry.assignee)
    .sort((a, b) => asNumber(b.loadShare) - asNumber(a.loadShare))
    .slice(0, 6)
    .map(entry => ({
      assignee: entry.assignee || 'Unassigned',
      loadShare: clampPct(entry.loadShare),
      activeIssues: Math.round(asNumber(entry.activeIssues)),
      issues: Math.round(asNumber(entry.issues)),
    }));
}

function buildEpicSignals(metrics: DashboardMetrics): IntelligenceEpicSignal[] {
  const epics = Array.isArray(metrics.epics) ? metrics.epics : [];
  return epics
    .map(raw => {
      const epic = (raw ?? {}) as Record<string, unknown>;
      return {
        name: String(epic.epic ?? epic.name ?? '(unnamed epic)').slice(0, 120),
        progress: clampPct(epic.progress ?? epic.completionRate ?? epic.completion),
        critical: Math.round(asNumber(epic.critical)),
        warning: Math.round(asNumber(epic.warning)),
        issues: Math.round(asNumber(epic.issues ?? epic.count)),
      };
    })
    .sort((a, b) => (b.critical * 100 + b.warning * 10 + (100 - b.progress)) - (a.critical * 100 + a.warning * 10 + (100 - a.progress)))
    .slice(0, 8);
}

export function buildIntelligenceSnapshot(metrics: DashboardMetrics): IntelligenceSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    totalIssues: Math.round(asNumber(metrics.totalIssues)),
    doneIssues: Math.round(asNumber(metrics.doneIssues)),
    activeIssues: Math.round(asNumber(metrics.activeIssues)),
    completionRate: clampPct(metrics.completionRate),
    deliveryConfidence: clampPct(metrics.overallDeliveryConfidence),
    healthScore: clampPct(metrics.healthScore),
    blockedIssues: Math.round(asNumber(metrics.blockedIssues ?? metrics.risk?.blockedIssues)),
    criticalIssues: Math.round(asNumber(metrics.flow?.critical)),
    openDefects: Math.round(asNumber(metrics.openDefects ?? metrics.risk?.openDefects)),
    dataQualityScore: clampPct(metrics.dataQuality?.score),
    averageLeadTimeDays: Math.round(asNumber(metrics.flow?.averageLeadTimeDays) * 10) / 10,
    averageCycleTimeDays: Math.round(asNumber(metrics.flow?.averageCycleTimeDays) * 10) / 10,
    forecast: {
      complete: Boolean(metrics.prediction?.complete),
      daysRemaining: metrics.prediction?.daysRemaining == null ? null : Math.max(0, Math.round(asNumber(metrics.prediction.daysRemaining))),
      predictedDate: metrics.prediction?.predictedDate ? String(metrics.prediction.predictedDate) : null,
      velocityPerDay: metrics.prediction?.velocityPerDay == null ? null : Math.round(asNumber(metrics.prediction.velocityPerDay) * 100) / 100,
    },
    riskItems: buildRiskItems(metrics),
    capacityHotspots: buildCapacityHotspots(metrics),
    epicSignals: buildEpicSignals(metrics),
    sourceInsights: (metrics.insights ?? []).slice(0, 8).map(value => String(value).slice(0, 240)),
  };
}

function finding(title: string, detail: string, severity: IntelligenceSeverity, evidence?: string): IntelligenceFinding {
  return { title, detail, severity, evidence };
}

function action(title: string, owner: string, rationale: string, priority: IntelligenceAction['priority'], href?: string): IntelligenceAction {
  return { title, owner, rationale, priority, href };
}

function topRisk(snapshot: IntelligenceSnapshot): IntelligenceRiskItem | undefined {
  return snapshot.riskItems[0];
}

function executiveAnswer(snapshot: IntelligenceSnapshot): IntelligenceAnswer {
  const risk = topRisk(snapshot);
  const findings: IntelligenceFinding[] = [
    finding(
      `Delivery confidence is ${snapshot.deliveryConfidence}%`,
      `Completion is ${snapshot.completionRate}% with ${snapshot.activeIssues} active items and ${snapshot.criticalIssues} critical items.`,
      snapshot.deliveryConfidence >= 75 ? 'good' : snapshot.deliveryConfidence >= 55 ? 'warning' : 'critical',
      `Health score ${snapshot.healthScore}% · data quality ${snapshot.dataQualityScore}%`,
    ),
  ];
  if (risk) {
    findings.push(finding(
      `${risk.key} is the leading attention item`,
      risk.summary || risk.reason || `${risk.status} · ${risk.assignee}`,
      risk.severity,
      `${risk.blocked ? 'Blocked · ' : ''}${risk.ageDays ?? '—'} days · ${risk.assignee}`,
    ));
  }
  if (snapshot.capacityHotspots[0]?.loadShare >= 35) {
    const hotspot = snapshot.capacityHotspots[0];
    findings.push(finding(
      'Capacity is concentrated',
      `${hotspot.assignee} carries ${hotspot.loadShare}% of measured load across ${hotspot.activeIssues} active items.`,
      'warning',
      'Capacity distribution',
    ));
  }
  return {
    agent: 'executive',
    title: 'Leadership delivery brief',
    summary: `${snapshot.doneIssues} of ${snapshot.totalIssues} issues are complete. ${snapshot.blockedIssues} are blocked and ${snapshot.openDefects} open defects remain.`,
    findings: findings.slice(0, 4),
    actions: [
      action('Clear the highest-impact blocker', 'Delivery Manager', 'Protect the near-term plan by removing the strongest flow constraint first.', 'now', '/flow-health'),
      action('Review the top at-risk epic', 'Product Owner', 'Confirm scope, ownership, and whether current sequencing still supports the forecast.', 'next', '/roadmap'),
      action('Re-check confidence after the next meaningful status change', 'Leadership', 'Use trend movement rather than a single snapshot for the next decision.', 'watch', '/trends'),
    ],
    mode: 'evidence',
  };
}

function flowAnswer(snapshot: IntelligenceSnapshot): IntelligenceAnswer {
  const risk = topRisk(snapshot);
  const hotspot = snapshot.capacityHotspots[0];
  const findings: IntelligenceFinding[] = [
    finding(
      `${snapshot.blockedIssues} blocked · ${snapshot.criticalIssues} critical`,
      `Average cycle time is ${snapshot.averageCycleTimeDays} days and lead time is ${snapshot.averageLeadTimeDays} days.`,
      snapshot.blockedIssues > 0 || snapshot.criticalIssues > 0 ? 'warning' : 'good',
      'Current flow snapshot',
    ),
  ];
  if (risk) findings.push(finding(`Start with ${risk.key}`, risk.reason || risk.summary || 'Highest calculated flow-risk score.', risk.severity, `${risk.status} · ${risk.assignee}`));
  if (hotspot) findings.push(finding('Highest load concentration', `${hotspot.assignee}: ${hotspot.loadShare}% load share, ${hotspot.activeIssues} active items.`, hotspot.loadShare >= 35 ? 'warning' : 'neutral'));
  return {
    agent: 'flow',
    title: 'Flow bottleneck brief',
    summary: risk ? `${risk.key} currently has the strongest combination of blocking, health, priority, and aging signals.` : 'No high-signal flow item is available in the current snapshot.',
    findings,
    actions: [
      action('Swarm the top blocker before starting more work', 'Scrum Master', 'Reducing blocked WIP usually improves flow faster than adding parallel work.', 'now', '/work-explorer'),
      action('Review capacity concentration', 'Engineering Manager', 'Rebalance only where ownership can move safely; avoid blind equalisation.', 'next', '/teams'),
      action('Track cycle-time movement after changes', 'Scrum Master', 'Confirm that intervention improves flow rather than only changing status labels.', 'watch', '/flow-health'),
    ],
    mode: 'evidence',
  };
}

function riskAnswer(snapshot: IntelligenceSnapshot): IntelligenceAnswer {
  const top = snapshot.riskItems.slice(0, 3);
  return {
    agent: 'risk',
    title: 'Delivery risk brief',
    summary: `${snapshot.criticalIssues} critical items, ${snapshot.blockedIssues} blocked items, and ${snapshot.openDefects} open defects are visible in this snapshot. Data quality is ${snapshot.dataQualityScore}%.`,
    findings: [
      finding('Data decision confidence', `Data quality is ${snapshot.dataQualityScore}%. Treat weak/missing fields as uncertainty, not as zero risk.`, snapshot.dataQualityScore >= 80 ? 'good' : snapshot.dataQualityScore >= 60 ? 'warning' : 'critical'),
      ...top.map(item => finding(item.key, item.summary || item.reason || item.status, item.severity, `${item.blocked ? 'Blocked · ' : ''}${item.status} · ${item.assignee}`)),
    ].slice(0, 4),
    actions: [
      action('Assign an owner to each critical or blocked item', 'Delivery Manager', 'Unowned risk tends to age silently and weakens forecast credibility.', 'now', '/work-explorer'),
      action('Validate missing high-impact fields', 'Data Owner', 'Improve data confidence before using weak metrics for irreversible decisions.', 'next', '/data-quality'),
      action('Review risk trend, not only count', 'Product / Delivery', 'A stable count can hide churn or worsening age.', 'watch', '/trends'),
    ],
    mode: 'evidence',
  };
}

function forecastAnswer(snapshot: IntelligenceSnapshot): IntelligenceAnswer {
  const forecastLabel = snapshot.forecast.complete
    ? 'Current scope is complete.'
    : snapshot.forecast.predictedDate
      ? `Current predicted completion: ${snapshot.forecast.predictedDate}.`
      : snapshot.forecast.daysRemaining != null
        ? `Current model estimates about ${snapshot.forecast.daysRemaining} days remaining.`
        : 'The current snapshot does not provide a reliable completion date.';
  const risk = topRisk(snapshot);
  return {
    agent: 'forecast',
    title: 'Forecast brief',
    summary: `${forecastLabel} Completion is ${snapshot.completionRate}% and delivery confidence is ${snapshot.deliveryConfidence}%.`,
    findings: [
      finding('Current outlook', forecastLabel, snapshot.forecast.complete ? 'good' : snapshot.deliveryConfidence >= 70 ? 'neutral' : 'warning', snapshot.forecast.velocityPerDay != null ? `${snapshot.forecast.velocityPerDay} items/day model velocity` : undefined),
      finding('Forecast pressure', `${snapshot.blockedIssues} blocked and ${snapshot.criticalIssues} critical items can move the date if they affect remaining scope.`, snapshot.blockedIssues + snapshot.criticalIssues > 0 ? 'warning' : 'good'),
      ...(risk ? [finding(`Watch ${risk.key}`, risk.reason || risk.summary || 'Top risk item', risk.severity)] : []),
    ].slice(0, 4),
    actions: [
      action('Protect throughput by resolving blockers', 'Delivery Team', 'Forecasts improve when throughput becomes more stable, not when dates are manually adjusted.', 'now', '/flow-health'),
      action('Validate remaining scope and epic readiness', 'Product Owner', 'Scope movement is a major forecast driver and should be explicit.', 'next', '/roadmap'),
      action('Compare the next snapshot to this forecast', 'Delivery Manager', 'Use forecast movement as a signal of changing delivery conditions.', 'watch', '/snapshots'),
    ],
    mode: 'evidence',
  };
}

export function buildEvidenceAnswer(agent: IntelligenceAgentId, snapshot: IntelligenceSnapshot, question?: string): IntelligenceAnswer {
  const answer = agent === 'flow'
    ? flowAnswer(snapshot)
    : agent === 'risk'
      ? riskAnswer(snapshot)
      : agent === 'forecast'
        ? forecastAnswer(snapshot)
        : executiveAnswer(snapshot);

  if (!question?.trim()) return answer;
  return {
    ...answer,
    summary: `${answer.summary} Asked: “${question.trim().slice(0, 180)}”`,
  };
}

export function getAgentDefinition(agent: IntelligenceAgentId): IntelligenceAgentDefinition {
  return INTELLIGENCE_AGENTS.find(candidate => candidate.id === agent) ?? INTELLIGENCE_AGENTS[0];
}
