// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Question-aware deterministic Evidence mode used when the AI runtime is unavailable.

import type {
  IntelligenceAction,
  IntelligenceAnswer,
  IntelligenceFinding,
  IntelligenceRiskItem,
  IntelligenceSnapshot,
} from './types';

const normalise = (value: string): string => value.trim().toLowerCase();
const includesAny = (question: string, terms: string[]): boolean => terms.some(term => question.includes(term));
const isBlocked = (item: IntelligenceRiskItem): boolean => item.blocked || normalise(item.status).includes('blocked');

function finding(
  title: string,
  detail: string,
  severity: IntelligenceFinding['severity'],
  evidence?: string,
): IntelligenceFinding {
  return { title, detail, severity, evidence };
}

function action(
  title: string,
  owner: string,
  rationale: string,
  priority: IntelligenceAction['priority'],
  href?: string,
): IntelligenceAction {
  return { title, owner, rationale, priority, href };
}

function riskEvidence(item: IntelligenceRiskItem): string {
  const age = item.ageDays == null ? 'age unavailable' : `${item.ageDays} days`;
  return `${isBlocked(item) ? 'Blocked · ' : ''}${item.status} · ${age} · ${item.assignee}`;
}

function topRisk(snapshot: IntelligenceSnapshot): IntelligenceRiskItem | undefined {
  return snapshot.riskItems[0];
}

function blockedFirst(snapshot: IntelligenceSnapshot): IntelligenceRiskItem[] {
  return [...snapshot.riskItems]
    .sort((a, b) => Number(isBlocked(b)) - Number(isBlocked(a)))
    .slice(0, 3);
}

function executiveFocus(
  answer: IntelligenceAnswer,
  snapshot: IntelligenceSnapshot,
  question: string,
): IntelligenceAnswer {
  const risk = topRisk(snapshot);

  if (includesAny(question, ['one-minute', 'one minute', 'briefing', 'brief me'])) {
    const forecast = snapshot.forecast.complete
      ? 'Current scope is complete.'
      : snapshot.forecast.predictedDate
        ? `Forecast points to ${snapshot.forecast.predictedDate}.`
        : snapshot.forecast.daysRemaining != null
          ? `Forecast estimates about ${snapshot.forecast.daysRemaining} days remaining.`
          : 'No reliable completion date is available.';
    return {
      ...answer,
      title: 'One-minute delivery briefing',
      summary: `${snapshot.doneIssues} of ${snapshot.totalIssues} issues are complete (${snapshot.completionRate}%). Delivery confidence is ${snapshot.deliveryConfidence}%. ${snapshot.blockedIssues} blocked, ${snapshot.criticalIssues} critical, and ${snapshot.openDefects} open defects remain. ${forecast}`,
      findings: [
        finding('Delivery position', `${snapshot.activeIssues} items are active with health at ${snapshot.healthScore}%.`, snapshot.deliveryConfidence >= 70 ? 'neutral' : 'warning', `Data quality ${snapshot.dataQualityScore}%`),
        ...(risk ? [finding(`Immediate exposure: ${risk.key}`, risk.summary || risk.reason || risk.status, risk.severity, riskEvidence(risk))] : []),
        finding('Forecast signal', forecast, snapshot.deliveryConfidence >= 70 ? 'neutral' : 'warning', snapshot.forecast.velocityPerDay != null ? `${snapshot.forecast.velocityPerDay} items/day model velocity` : undefined),
      ].slice(0, 4),
      actions: [
        action('Resolve the first delivery constraint', 'Delivery Manager', risk ? `Start with ${risk.key}, the highest-ranked current exposure.` : 'Start with the highest verified delivery constraint.', 'now', '/flow-health'),
        action('Confirm scope and sequencing', 'Product Owner', 'Make sure the current plan still supports the forecast before adding more work.', 'next', '/roadmap'),
        action('Re-check confidence after movement', 'Leadership', 'Use the next meaningful status change to confirm whether confidence improves.', 'watch', '/trends'),
      ],
    };
  }

  if (includesAny(question, ['biggest threat', 'main threat', 'greatest threat', 'threat to delivery', 'threat to confidence'])) {
    const threat = risk
      ? `${risk.key}: ${risk.summary || risk.reason || risk.status}`
      : `${snapshot.criticalIssues} critical items and ${snapshot.blockedIssues} blocked items`;
    return {
      ...answer,
      title: 'Biggest threat to delivery confidence',
      summary: `The strongest visible threat is ${threat}. Delivery confidence is ${snapshot.deliveryConfidence}% while ${snapshot.criticalIssues} critical items and ${snapshot.blockedIssues} blocked items remain.`,
      findings: [
        ...(risk ? [finding(risk.key, risk.reason || risk.summary || risk.status, risk.severity, riskEvidence(risk))] : []),
        finding('Confidence pressure', `${snapshot.criticalIssues} critical items, ${snapshot.openDefects} open defects, and ${snapshot.blockedIssues} blocked items are visible.`, snapshot.criticalIssues + snapshot.blockedIssues > 0 ? 'critical' : 'good', `Health ${snapshot.healthScore}% · data quality ${snapshot.dataQualityScore}%`),
      ],
      actions: [
        action(risk ? `Remove the constraint around ${risk.key}` : 'Remove the strongest delivery constraint', 'Delivery Manager', 'Address the highest-evidence threat before changing dates or adding parallel work.', 'now', '/work-explorer'),
        action('Validate whether the threat affects forecast scope', 'Product Owner', 'Confirm whether the exposed work is on the critical delivery path.', 'next', '/forecast'),
        action('Watch confidence movement', 'Leadership', 'A threat is reducing only when the evidence moves, not when the narrative changes.', 'watch', '/trends'),
      ],
    };
  }

  if (includesAny(question, ['leadership', 'pay attention', 'attention today', 'today'])) {
    return {
      ...answer,
      title: 'Leadership attention today',
      summary: risk
        ? `Leadership should focus first on ${risk.key}, then on delivery confidence at ${snapshot.deliveryConfidence}% and the ${snapshot.criticalIssues} critical items still open.`
        : `Leadership should focus on delivery confidence at ${snapshot.deliveryConfidence}% and the ${snapshot.criticalIssues} critical items still open.`,
      actions: answer.actions,
    };
  }

  return answer;
}

function flowFocus(
  answer: IntelligenceAnswer,
  snapshot: IntelligenceSnapshot,
  question: string,
): IntelligenceAnswer {
  const hotspot = snapshot.capacityHotspots[0];
  const risks = blockedFirst(snapshot);

  if (includesAny(question, ['capacity', 'concentrated', 'too few people', 'load share'])) {
    return {
      ...answer,
      title: 'Capacity concentration check',
      summary: hotspot
        ? `${hotspot.assignee} has the highest measured load share at ${hotspot.loadShare}% with ${hotspot.activeIssues} active items.`
        : 'No assignee-level capacity hotspot is available in this snapshot.',
      findings: snapshot.capacityHotspots.slice(0, 4).map(item => finding(
        item.assignee,
        `${item.loadShare}% load share across ${item.activeIssues} active items (${item.issues} total).`,
        item.loadShare >= 35 ? 'warning' : 'neutral',
        'Capacity distribution',
      )),
      actions: [
        action('Review the highest concentration first', 'Engineering Manager', 'Check whether ownership can be redistributed without creating handoff delay.', 'now', '/teams'),
        action('Limit new WIP around overloaded owners', 'Scrum Master', 'Reduce additional parallel work while existing active items are being cleared.', 'next', '/flow-health'),
        action('Compare concentration after rebalancing', 'Engineering Manager', 'Confirm the change improved flow rather than only changing assignment.', 'watch', '/trends'),
      ],
    };
  }

  if (includesAny(question, ['unblock first', 'unblock', 'blocker first', 'which items'])) {
    return {
      ...answer,
      title: 'Unblock-first queue',
      summary: risks.length
        ? `Start with ${risks.map(item => item.key).join(', ')} based on blocking, severity, and aging evidence.`
        : 'No ranked items are available for an unblock-first queue.',
      findings: risks.map(item => finding(item.key, item.reason || item.summary || item.status, item.severity, riskEvidence(item))),
      actions: risks.slice(0, 3).map((item, index) => action(
        `Work ${item.key} ${index === 0 ? 'first' : 'next'}`,
        item.assignee || 'Delivery Team',
        item.reason || 'Resolve the highest-ranked flow constraint before starting more work.',
        index === 0 ? 'now' : 'next',
        '/work-explorer',
      )),
    };
  }

  if (includesAny(question, ['where is work getting stuck', 'getting stuck', 'stuck', 'bottleneck'])) {
    const risk = topRisk(snapshot);
    return {
      ...answer,
      title: 'Where work is getting stuck',
      summary: risk
        ? `${risk.key} is the strongest current bottleneck signal. Average cycle time is ${snapshot.averageCycleTimeDays} days and lead time is ${snapshot.averageLeadTimeDays} days.`
        : `No single item dominates the current bottleneck evidence. Average cycle time is ${snapshot.averageCycleTimeDays} days.`,
    };
  }

  return answer;
}

function riskFocus(
  answer: IntelligenceAnswer,
  snapshot: IntelligenceSnapshot,
  question: string,
): IntelligenceAnswer {
  const top = snapshot.riskItems.slice(0, 3);

  if (includesAny(question, ['trust this data', 'trust the data', 'data enough', 'data quality', 'make a decision'])) {
    const quality = snapshot.dataQualityScore;
    return {
      ...answer,
      title: 'Decision-data confidence',
      summary: `Data quality is ${quality}%. ${quality >= 85 ? 'The snapshot is strong enough for evidence-led decisions, while material gaps should still be checked.' : quality >= 65 ? 'Use the snapshot for directional decisions, but validate high-impact missing fields first.' : 'Do not use this snapshot alone for high-impact decisions until data gaps are addressed.'}`,
      findings: [
        finding('Data quality score', `${quality}% of the measured data-quality criteria are satisfied.`, quality >= 85 ? 'good' : quality >= 65 ? 'warning' : 'critical'),
        finding('Risk evidence still visible', `${snapshot.criticalIssues} critical items, ${snapshot.blockedIssues} blocked items, and ${snapshot.openDefects} open defects are currently measurable.`, snapshot.criticalIssues + snapshot.blockedIssues > 0 ? 'warning' : 'neutral'),
      ],
      actions: [
        action('Validate high-impact missing fields', 'Data Owner', 'Confirm fields that can change risk, forecast, ownership, or completion interpretation.', 'now', '/data-quality'),
        action('Use verified fields for the decision', 'Delivery Manager', 'Separate confirmed evidence from assumptions before committing to action.', 'next', '/summary'),
        action('Re-check data quality with the next import', 'Data Owner', 'Confidence should improve as missing or inconsistent fields are corrected.', 'watch', '/data-quality'),
      ],
    };
  }

  if (includesAny(question, ['action now', 'versus monitoring', 'vs monitoring', 'monitoring', 'need action'])) {
    const now = top.filter(item => isBlocked(item) || item.severity === 'critical');
    const watch = snapshot.riskItems.filter(item => !isBlocked(item) && item.severity !== 'critical').slice(0, 2);
    return {
      ...answer,
      title: 'Act now vs monitor',
      summary: `${now.length} of the top ${top.length} ranked risks need immediate attention based on critical/blocking evidence; ${watch.length} lower-severity items are suitable for monitoring.`,
      findings: [
        ...now.slice(0, 3).map(item => finding(`ACT NOW · ${item.key}`, item.reason || item.summary || item.status, item.severity, riskEvidence(item))),
        ...watch.slice(0, Math.max(0, 4 - now.length)).map(item => finding(`MONITOR · ${item.key}`, item.reason || item.summary || item.status, item.severity, riskEvidence(item))),
      ].slice(0, 4),
      actions: [
        ...(now[0] ? [action(`Assign and act on ${now[0].key}`, now[0].assignee || 'Delivery Manager', now[0].reason || 'Critical/blocking evidence requires immediate ownership.', 'now', '/work-explorer')] : []),
        action('Review monitored risks on the next snapshot', 'Delivery Manager', 'Promote a monitored item to immediate action if severity, blocking, or age worsens.', 'watch', '/trends'),
      ],
    };
  }

  if (includesAny(question, ['top delivery risks', 'top risks', 'delivery risks'])) {
    return {
      ...answer,
      title: 'Top delivery risks',
      summary: top.length
        ? `The top ranked risks are ${top.map(item => item.key).join(', ')}. Ranking uses blocking, severity, priority, and aging evidence.`
        : 'No ranked risk items are available in this snapshot.',
      findings: top.map(item => finding(item.key, item.reason || item.summary || item.status, item.severity, riskEvidence(item))),
    };
  }

  return answer;
}

function forecastFocus(
  answer: IntelligenceAnswer,
  snapshot: IntelligenceSnapshot,
  question: string,
): IntelligenceAnswer {
  const forecast = snapshot.forecast;
  const risk = topRisk(snapshot);

  if (includesAny(question, ['when are we likely to finish', 'when will we finish', 'likely to finish', 'finish date', 'completion date'])) {
    const finish = forecast.complete
      ? 'The current scope is complete.'
      : forecast.predictedDate
        ? `The current predicted completion is ${forecast.predictedDate}.`
        : forecast.daysRemaining != null
          ? `The current model estimates about ${forecast.daysRemaining} days remaining.`
          : 'The current snapshot does not provide a reliable completion date.';
    return {
      ...answer,
      title: 'Likely completion',
      summary: `${finish} Delivery confidence is ${snapshot.deliveryConfidence}% at ${snapshot.completionRate}% completion.`,
      findings: [
        finding('Current completion estimate', finish, forecast.complete ? 'good' : snapshot.deliveryConfidence >= 70 ? 'neutral' : 'warning', forecast.velocityPerDay != null ? `${forecast.velocityPerDay} items/day model velocity` : undefined),
        ...(risk ? [finding(`Top pressure: ${risk.key}`, risk.reason || risk.summary || risk.status, risk.severity, riskEvidence(risk))] : []),
      ],
    };
  }

  if (includesAny(question, ['move the forecast', 'move forecast', 'move the date', 'forecast date', 'could move'])) {
    return {
      ...answer,
      title: 'What could move the forecast date',
      summary: `${snapshot.blockedIssues} blocked and ${snapshot.criticalIssues} critical items are the clearest current pressure signals. ${forecast.velocityPerDay != null ? `Model velocity is ${forecast.velocityPerDay} items/day.` : 'Velocity evidence is unavailable.'}`,
      findings: [
        finding('Flow pressure', `${snapshot.blockedIssues} blocked items and ${snapshot.criticalIssues} critical items can reduce throughput if they affect remaining scope.`, snapshot.blockedIssues + snapshot.criticalIssues > 0 ? 'warning' : 'good'),
        ...(risk ? [finding(`Highest ranked pressure: ${risk.key}`, risk.reason || risk.summary || risk.status, risk.severity, riskEvidence(risk))] : []),
        finding('Scope/throughput sensitivity', 'Changes to remaining scope or sustained throughput will move the deterministic forecast.', 'neutral', forecast.velocityPerDay != null ? `${forecast.velocityPerDay} items/day model velocity` : undefined),
      ],
      actions: [
        action('Resolve forecast-relevant blockers', 'Delivery Team', 'Stabilize throughput before changing the target date.', 'now', '/flow-health'),
        action('Confirm remaining scope', 'Product Owner', 'Make scope movement explicit because it directly changes the completion estimate.', 'next', '/roadmap'),
        action('Compare forecast after the next snapshot', 'Delivery Manager', 'Use forecast movement to validate whether conditions improved.', 'watch', '/snapshots'),
      ],
    };
  }

  if (includesAny(question, ['how confident', 'confidence in', 'current outlook', 'forecast confidence'])) {
    const confidence = snapshot.deliveryConfidence;
    return {
      ...answer,
      title: 'Forecast confidence',
      summary: `Current delivery confidence is ${confidence}% with data quality at ${snapshot.dataQualityScore}%. ${confidence >= 75 ? 'The outlook is comparatively strong.' : confidence >= 55 ? 'The outlook should be treated with caution.' : 'The outlook has low confidence and should not be treated as a firm commitment.'}`,
      findings: [
        finding('Delivery confidence', `${confidence}%`, confidence >= 75 ? 'good' : confidence >= 55 ? 'warning' : 'critical', `Data quality ${snapshot.dataQualityScore}%`),
        finding('Pressure on confidence', `${snapshot.blockedIssues} blocked, ${snapshot.criticalIssues} critical, and ${snapshot.openDefects} open defects remain.`, snapshot.blockedIssues + snapshot.criticalIssues > 0 ? 'warning' : 'neutral'),
      ],
    };
  }

  return answer;
}

/**
 * Tailor deterministic Evidence mode to the user's question. This is not a
 * substitute for Qwen: it intentionally recognizes a bounded set of delivery
 * intents and stays within the supplied snapshot. Unmatched questions keep the
 * specialist's baseline evidence answer instead of pretending to understand
 * unrestricted natural language.
 */
export function refineEvidenceAnswer(
  answer: IntelligenceAnswer,
  snapshot: IntelligenceSnapshot,
  question: string,
): IntelligenceAnswer {
  const q = normalise(question);
  if (!q) return answer;

  if (answer.agent === 'executive') return executiveFocus(answer, snapshot, q);
  if (answer.agent === 'flow') return flowFocus(answer, snapshot, q);
  if (answer.agent === 'risk') return riskFocus(answer, snapshot, q);
  return forecastFocus(answer, snapshot, q);
}
