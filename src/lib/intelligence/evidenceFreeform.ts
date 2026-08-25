// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Deterministic free-form QA over the compact Delivery Intelligence snapshot.

import type {
  IntelligenceAnswer,
  IntelligenceFinding,
  IntelligenceRiskItem,
  IntelligenceSnapshot,
} from './types';

const STOP_WORDS = new Set([
  'a', 'about', 'all', 'an', 'and', 'are', 'as', 'at', 'be', 'can', 'could', 'did', 'do', 'does',
  'for', 'from', 'give', 'has', 'have', 'how', 'i', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or',
  'our', 'please', 'show', 'tell', 'that', 'the', 'their', 'them', 'there', 'this', 'to', 'us', 'was',
  'what', 'when', 'where', 'which', 'who', 'why', 'with', 'would', 'you', 'your',
]);

const normalise = (value: string): string => value
  .toLowerCase()
  .replace(/[“”‘’'"?.,:;()\[\]{}]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const includesAny = (question: string, terms: string[]): boolean => terms.some(term => question.includes(term));

function finding(
  title: string,
  detail: string,
  severity: IntelligenceFinding['severity'] = 'neutral',
  evidence?: string,
): IntelligenceFinding {
  return { title, detail, severity, evidence };
}

function factualAnswer(
  base: IntelligenceAnswer,
  title: string,
  summary: string,
  findings: IntelligenceFinding[] = [],
): IntelligenceAnswer {
  return {
    ...base,
    title,
    summary,
    findings: findings.slice(0, 4),
    actions: [],
  };
}

function isBlocked(item: IntelligenceRiskItem): boolean {
  return item.blocked || normalise(item.status).includes('blocked');
}

function riskEvidence(item: IntelligenceRiskItem): string {
  const age = item.ageDays == null ? 'age unavailable' : `${item.ageDays} days`;
  return `${isBlocked(item) ? 'Blocked · ' : ''}${item.status} · ${age} · ${item.assignee}`;
}

function matchNamedValue(question: string, values: string[]): string | undefined {
  return [...values]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .find(value => question.includes(normalise(value)));
}

function issueQuestion(base: IntelligenceAnswer, snapshot: IntelligenceSnapshot, question: string): IntelligenceAnswer | null {
  const keys = question.match(/\b[a-z][a-z0-9]*-\d+\b/gi) ?? [];
  if (!keys.length) return null;

  const matches = keys
    .map(key => snapshot.riskItems.find(item => normalise(item.key) === normalise(key)))
    .filter((item): item is IntelligenceRiskItem => Boolean(item));

  if (!matches.length) {
    return factualAnswer(
      base,
      'Issue not present in this snapshot',
      `The current Intelligence snapshot does not contain evidence for ${keys.join(', ')}. It only carries the strongest ranked risk items, so I cannot answer about that issue without inventing data.`,
      [finding('Available risk items', snapshot.riskItems.length ? snapshot.riskItems.map(item => item.key).join(', ') : 'No ranked risk items are present.', 'neutral')],
    );
  }

  return factualAnswer(
    base,
    matches.length === 1 ? `${matches[0].key} snapshot detail` : 'Requested issue details',
    matches.map(item => `${item.key} is ${item.status}, assigned to ${item.assignee}${item.ageDays == null ? '' : `, and has aged ${item.ageDays} days`}. ${item.summary || item.reason}`)
      .join(' '),
    matches.map(item => finding(item.key, item.reason || item.summary || item.status, item.severity, riskEvidence(item))),
  );
}

function personQuestion(base: IntelligenceAnswer, snapshot: IntelligenceSnapshot, question: string): IntelligenceAnswer | null {
  const names = Array.from(new Set([
    ...snapshot.capacityHotspots.map(item => item.assignee),
    ...snapshot.riskItems.map(item => item.assignee),
  ].filter(Boolean)));
  const matchedName = matchNamedValue(question, names);
  if (!matchedName) return null;

  const capacity = snapshot.capacityHotspots.find(item => normalise(item.assignee) === normalise(matchedName));
  const risks = snapshot.riskItems.filter(item => normalise(item.assignee) === normalise(matchedName));
  const parts: string[] = [];
  if (capacity) parts.push(`${matchedName} has ${capacity.loadShare}% of measured load, ${capacity.activeIssues} active items, and ${capacity.issues} total items in the capacity snapshot.`);
  if (risks.length) parts.push(`${risks.length} of the ranked risk items are assigned to ${matchedName}: ${risks.map(item => item.key).join(', ')}.`);

  return factualAnswer(
    base,
    `${matchedName} in this snapshot`,
    parts.join(' ') || `The snapshot names ${matchedName}, but it does not contain enough additional evidence to answer more specifically.`,
    [
      ...(capacity ? [finding('Capacity', `${capacity.loadShare}% load share · ${capacity.activeIssues} active · ${capacity.issues} total`, capacity.loadShare >= 35 ? 'warning' : 'neutral')] : []),
      ...risks.slice(0, 3).map(item => finding(item.key, item.summary || item.reason || item.status, item.severity, riskEvidence(item))),
    ],
  );
}

function epicQuestion(base: IntelligenceAnswer, snapshot: IntelligenceSnapshot, question: string): IntelligenceAnswer | null {
  const matchedName = matchNamedValue(question, snapshot.epicSignals.map(item => item.name));
  if (!matchedName) return null;
  const epic = snapshot.epicSignals.find(item => normalise(item.name) === normalise(matchedName));
  if (!epic) return null;

  return factualAnswer(
    base,
    `${epic.name} epic signal`,
    `${epic.name} is ${epic.progress}% complete across ${epic.issues} issues, with ${epic.critical} critical and ${epic.warning} warning signals in the current snapshot.`,
    [finding(epic.name, `${epic.progress}% complete · ${epic.issues} issues`, epic.critical > 0 ? 'warning' : 'neutral', `${epic.critical} critical · ${epic.warning} warning`)],
  );
}

function metricQuestion(base: IntelligenceAnswer, snapshot: IntelligenceSnapshot, question: string): IntelligenceAnswer | null {
  // Check qualified issue counts before generic "how many issues" so queries
  // such as "how many issues are blocked?" cannot be mistaken for total count.
  if (includesAny(question, ['done issues', 'completed issues', 'how many done', 'how many completed'])) {
    return factualAnswer(base, 'Completed work', `${snapshot.doneIssues} of ${snapshot.totalIssues} issues are complete, which is ${snapshot.completionRate}%.`);
  }
  if (includesAny(question, ['active issues', 'active work', 'how many active', 'work in progress', ' wip '])) {
    return factualAnswer(base, 'Active work', `${snapshot.activeIssues} issues are active in the current analyzed snapshot.`);
  }
  if (includesAny(question, ['completion rate', 'completion percentage', 'percent complete', 'progress percentage'])) {
    return factualAnswer(base, 'Completion rate', `Current completion is ${snapshot.completionRate}% (${snapshot.doneIssues} of ${snapshot.totalIssues} issues complete).`);
  }
  if (includesAny(question, ['delivery confidence', 'confidence score'])) {
    return factualAnswer(base, 'Delivery confidence', `Delivery confidence is ${snapshot.deliveryConfidence}%. Health is ${snapshot.healthScore}% and data quality is ${snapshot.dataQualityScore}%.`, [
      finding('Delivery confidence', `${snapshot.deliveryConfidence}%`, snapshot.deliveryConfidence >= 75 ? 'good' : snapshot.deliveryConfidence >= 55 ? 'warning' : 'critical'),
    ]);
  }
  if (includesAny(question, ['health score', 'delivery health', 'health percentage'])) {
    return factualAnswer(base, 'Delivery health', `The current health score is ${snapshot.healthScore}%. Delivery confidence is ${snapshot.deliveryConfidence}%.`);
  }
  if (includesAny(question, ['blocked issues', 'blockers', 'blocked work', 'how many blocked', 'issues are blocked', 'issues blocked'])) {
    const blocked = snapshot.riskItems.filter(isBlocked);
    return factualAnswer(base, 'Blocked work', `${snapshot.blockedIssues} blocked issues are reported in the analyzed metrics.${blocked.length ? ` The ranked snapshot includes ${blocked.map(item => item.key).join(', ')} as blocked.` : ''}`, blocked.slice(0, 4).map(item => finding(item.key, item.summary || item.reason || item.status, item.severity, riskEvidence(item))));
  }
  if (includesAny(question, ['critical issues', 'how many critical', 'critical work', 'issues are critical', 'issues critical'])) {
    return factualAnswer(base, 'Critical work', `${snapshot.criticalIssues} critical items are visible in the analyzed metrics.`, snapshot.riskItems.filter(item => item.severity === 'critical').slice(0, 4).map(item => finding(item.key, item.summary || item.reason || item.status, item.severity, riskEvidence(item))));
  }
  if (includesAny(question, ['open defects', 'defects', 'bugs open', 'open bugs', 'how many bugs'])) {
    return factualAnswer(base, 'Open defects', `${snapshot.openDefects} open defects are reported in the current analyzed snapshot.`);
  }
  if (includesAny(question, ['data quality', 'quality score', 'data confidence'])) {
    return factualAnswer(base, 'Data quality', `The current data-quality score is ${snapshot.dataQualityScore}%.`, [
      finding('Data quality score', `${snapshot.dataQualityScore}%`, snapshot.dataQualityScore >= 85 ? 'good' : snapshot.dataQualityScore >= 65 ? 'warning' : 'critical'),
    ]);
  }
  if (includesAny(question, ['lead time', 'average lead'])) {
    return factualAnswer(base, 'Average lead time', `Average lead time is ${snapshot.averageLeadTimeDays} days in the analyzed data.`);
  }
  if (includesAny(question, ['cycle time', 'average cycle'])) {
    return factualAnswer(base, 'Average cycle time', `Average cycle time is ${snapshot.averageCycleTimeDays} days once work starts.`);
  }
  if (includesAny(question, ['velocity', 'items per day', 'items/day'])) {
    return factualAnswer(base, 'Forecast velocity', snapshot.forecast.velocityPerDay == null ? 'The current snapshot does not contain a forecast velocity.' : `The deterministic forecast is using ${snapshot.forecast.velocityPerDay} items per day.`);
  }
  if (includesAny(question, ['days remaining', 'remaining days'])) {
    return factualAnswer(base, 'Estimated days remaining', snapshot.forecast.complete ? 'The current scope is complete.' : snapshot.forecast.daysRemaining == null ? 'The current snapshot does not provide an estimated number of days remaining.' : `The deterministic forecast estimates about ${snapshot.forecast.daysRemaining} days remaining.`);
  }
  if (includesAny(question, ['predicted date', 'forecast date', 'finish date', 'completion date', 'when finish', 'when complete'])) {
    return factualAnswer(base, 'Predicted completion', snapshot.forecast.complete ? 'The current scope is complete.' : snapshot.forecast.predictedDate ? `The current predicted completion date is ${snapshot.forecast.predictedDate}.` : snapshot.forecast.daysRemaining != null ? `No calendar date is present, but the model estimates about ${snapshot.forecast.daysRemaining} days remaining.` : 'The current snapshot does not provide a reliable completion date.');
  }
  if (includesAny(question, ['total issues', 'how many issues', 'issue count', 'total work'])) {
    return factualAnswer(base, 'Total issues', `The analyzed dataset contains ${snapshot.totalIssues} issues. ${snapshot.doneIssues} are complete and ${snapshot.activeIssues} are active.`, [
      finding('Issue count', `${snapshot.totalIssues} total · ${snapshot.doneIssues} done · ${snapshot.activeIssues} active`),
    ]);
  }
  return null;
}

function rankingQuestion(base: IntelligenceAnswer, snapshot: IntelligenceSnapshot, question: string): IntelligenceAnswer | null {
  if (includesAny(question, ['oldest item', 'oldest issue', 'most aged', 'aged the most'])) {
    const oldest = [...snapshot.riskItems]
      .filter(item => item.ageDays != null)
      .sort((a, b) => (b.ageDays ?? -1) - (a.ageDays ?? -1))[0];
    return oldest
      ? factualAnswer(base, 'Oldest ranked item', `${oldest.key} is the oldest item in the ranked snapshot at ${oldest.ageDays} days. ${oldest.summary || oldest.reason}`, [finding(oldest.key, oldest.reason || oldest.summary || oldest.status, oldest.severity, riskEvidence(oldest))])
      : factualAnswer(base, 'Oldest ranked item', 'No age evidence is available for the ranked risk items in this snapshot.');
  }

  if (includesAny(question, ['highest load', 'most loaded', 'busiest', 'highest capacity', 'capacity hotspot'])) {
    const hotspot = snapshot.capacityHotspots[0];
    return hotspot
      ? factualAnswer(base, 'Highest measured load', `${hotspot.assignee} has the highest measured load share at ${hotspot.loadShare}%, with ${hotspot.activeIssues} active items and ${hotspot.issues} total items.`, [finding(hotspot.assignee, `${hotspot.loadShare}% load share`, hotspot.loadShare >= 35 ? 'warning' : 'neutral', `${hotspot.activeIssues} active · ${hotspot.issues} total`)])
      : factualAnswer(base, 'Highest measured load', 'No assignee-level capacity data is present in this snapshot.');
  }

  if (includesAny(question, ['highest risk', 'top risk', 'biggest risk', 'riskiest item'])) {
    const risk = snapshot.riskItems[0];
    return risk
      ? factualAnswer(base, 'Highest ranked risk', `${risk.key} is the highest-ranked risk item. ${risk.summary || risk.reason}`, [finding(risk.key, risk.reason || risk.summary || risk.status, risk.severity, riskEvidence(risk))])
      : factualAnswer(base, 'Highest ranked risk', 'No ranked risk items are present in this snapshot.');
  }

  return null;
}

function categoryQuestion(base: IntelligenceAnswer, snapshot: IntelligenceSnapshot, question: string): IntelligenceAnswer | null {
  if (includesAny(question, ['flow performance', 'flow metrics', 'delivery flow', 'about flow'])) {
    return factualAnswer(base, 'Flow evidence', `Average lead time is ${snapshot.averageLeadTimeDays} days and average cycle time is ${snapshot.averageCycleTimeDays} days. ${snapshot.blockedIssues} issues are blocked and ${snapshot.criticalIssues} are critical.`, snapshot.riskItems.slice(0, 3).map(item => finding(item.key, item.reason || item.summary || item.status, item.severity, riskEvidence(item))));
  }
  if (includesAny(question, ['team capacity', 'capacity distribution', 'workload', 'team load'])) {
    return factualAnswer(base, 'Capacity distribution', snapshot.capacityHotspots.length ? `The highest measured load shares are ${snapshot.capacityHotspots.slice(0, 3).map(item => `${item.assignee} ${item.loadShare}%`).join(', ')}.` : 'No assignee-level capacity distribution is available.', snapshot.capacityHotspots.slice(0, 4).map(item => finding(item.assignee, `${item.loadShare}% load share · ${item.activeIssues} active`, item.loadShare >= 35 ? 'warning' : 'neutral')));
  }
  if (includesAny(question, ['epics', 'epic progress', 'epic health'])) {
    return factualAnswer(base, 'Epic signals', snapshot.epicSignals.length ? `The strongest epic signals are ${snapshot.epicSignals.slice(0, 3).map(item => `${item.name} (${item.progress}% complete)`).join(', ')}.` : 'No epic signals are available in this snapshot.', snapshot.epicSignals.slice(0, 4).map(item => finding(item.name, `${item.progress}% complete across ${item.issues} issues`, item.critical > 0 ? 'warning' : 'neutral', `${item.critical} critical · ${item.warning} warning`)));
  }
  if (includesAny(question, ['risk picture', 'risk status', 'risk overview', 'risks overall'])) {
    return factualAnswer(base, 'Risk overview', `${snapshot.criticalIssues} critical items, ${snapshot.blockedIssues} blocked items, and ${snapshot.openDefects} open defects are visible.`, snapshot.riskItems.slice(0, 4).map(item => finding(item.key, item.reason || item.summary || item.status, item.severity, riskEvidence(item))));
  }
  return null;
}

type EvidenceDocument = {
  text: string;
  finding: IntelligenceFinding;
};

function tokens(value: string): string[] {
  return normalise(value)
    .split(' ')
    .filter(token => token.length >= 3 && !STOP_WORDS.has(token));
}

function evidenceDocuments(snapshot: IntelligenceSnapshot): EvidenceDocument[] {
  return [
    ...snapshot.riskItems.map(item => ({
      text: `${item.key} ${item.summary} ${item.status} ${item.assignee} ${item.reason} ${item.severity}`,
      finding: finding(item.key, item.summary || item.reason || item.status, item.severity, riskEvidence(item)),
    })),
    ...snapshot.capacityHotspots.map(item => ({
      text: `${item.assignee} capacity load workload active issues ${item.loadShare}`,
      finding: finding(item.assignee, `${item.loadShare}% load share · ${item.activeIssues} active · ${item.issues} total`, item.loadShare >= 35 ? 'warning' : 'neutral', 'Capacity distribution'),
    })),
    ...snapshot.epicSignals.map(item => ({
      text: `${item.name} epic progress critical warning issues ${item.progress}`,
      finding: finding(item.name, `${item.progress}% complete across ${item.issues} issues`, item.critical > 0 ? 'warning' : 'neutral', `${item.critical} critical · ${item.warning} warning`),
    })),
    ...snapshot.sourceInsights.map((insight, index) => ({
      text: insight,
      finding: finding(`Analysis insight ${index + 1}`, insight, 'neutral'),
    })),
  ];
}

function retrievalQuestion(base: IntelligenceAnswer, snapshot: IntelligenceSnapshot, question: string): IntelligenceAnswer | null {
  const qTokens = Array.from(new Set(tokens(question)));
  if (!qTokens.length) return null;

  const ranked = evidenceDocuments(snapshot)
    .map(doc => {
      const haystack = normalise(doc.text);
      const matched = qTokens.filter(token => haystack.includes(token));
      return { ...doc, score: matched.length, matched };
    })
    .filter(doc => doc.score > 0)
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || (best.score < 2 && qTokens.length > 1)) return null;
  const selected = ranked.filter(doc => doc.score === best.score).slice(0, 4);

  return factualAnswer(
    base,
    'Matching analyzed evidence',
    `I found ${selected.length} current evidence ${selected.length === 1 ? 'signal' : 'signals'} matching the question. The answer is limited to what is present in this delivery snapshot.`,
    selected.map(doc => doc.finding),
  );
}

function coverageAnswer(base: IntelligenceAnswer, snapshot: IntelligenceSnapshot): IntelligenceAnswer {
  return factualAnswer(
    base,
    'What I can answer from this snapshot',
    'I can answer questions grounded in the current analyzed delivery snapshot: issue counts and completion, confidence and health, blockers and critical work, defects, data quality, lead/cycle time, forecast and velocity, ranked risk items, named assignees/capacity hotspots, epic signals, and the included analysis insights.',
    [
      finding('Current coverage', `${snapshot.totalIssues} issues · ${snapshot.riskItems.length} ranked risks · ${snapshot.capacityHotspots.length} capacity hotspots · ${snapshot.epicSignals.length} epic signals`),
      finding('Data boundary', 'I will say insufficient evidence when the requested fact is not present in this snapshot rather than guess.', 'good'),
    ],
  );
}

function insufficientAnswer(base: IntelligenceAnswer, snapshot: IntelligenceSnapshot): IntelligenceAnswer {
  return factualAnswer(
    base,
    'Insufficient evidence in this snapshot',
    'I cannot answer that question from the current analyzed delivery snapshot without guessing. Ask about the available delivery metrics, ranked risk items, assignees/capacity, epic signals, forecast, flow, defects, data quality, or included analysis insights.',
    [finding('Snapshot coverage', `${snapshot.totalIssues} issues analyzed · ${snapshot.riskItems.length} ranked risk items · ${snapshot.capacityHotspots.length} capacity hotspots · ${snapshot.epicSignals.length} epic signals`, 'neutral')],
  );
}

/**
 * Answer a free-form question using only facts already present in the compact
 * Intelligence snapshot. Named entities and qualified metrics are resolved
 * before generic help/coverage intents so normal phrasing remains useful.
 */
export function answerFreeformEvidenceQuestion(
  base: IntelligenceAnswer,
  snapshot: IntelligenceSnapshot,
  rawQuestion: string,
): IntelligenceAnswer {
  const question = ` ${normalise(rawQuestion)} `;

  const entityAnswer = issueQuestion(base, snapshot, question)
    ?? personQuestion(base, snapshot, question)
    ?? epicQuestion(base, snapshot, question);
  if (entityAnswer) return entityAnswer;

  if (includesAny(question, ['what can you answer', 'available data', 'what information do you have', 'what data do you have', 'what do you know'])) {
    return coverageAnswer(base, snapshot);
  }

  return metricQuestion(base, snapshot, question)
    ?? rankingQuestion(base, snapshot, question)
    ?? categoryQuestion(base, snapshot, question)
    ?? retrievalQuestion(base, snapshot, question)
    ?? insufficientAnswer(base, snapshot);
}
