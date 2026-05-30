// Migrated from backend/src/services/metrics.js
// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DONE_STATUSES: string[] = ['Done', 'Closed', 'Resolved'];
const IN_PROGRESS_STATUSES: string[] = ['In Progress', 'Code Review', 'QA', 'Testing', 'UAT'];
const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

// ---------------------------------------------------------------------------
// Inline types
// ---------------------------------------------------------------------------

type HealthStatus = 'good' | 'warning' | 'critical';

interface JiraIssue {
  [key: string]: unknown;
}

interface FlowItem {
  key: string;
  summary: string;
  type: string;
  status: string;
  highLevelStatus: string;
  sprint: string;
  epic: string;
  isOrphan: boolean;
  assignee: string;
  priority: string;
  storyPoints: number;
  createdDate: string;
  startedDate: string;
  doneDate: string;
  leadTimeDays: number | null;
  cycleTimeDays: number | null;
  ageDays: number | null;
  activeAgeDays: number | null;
  labels: string;
  parent: string;
  project: string;
  health: HealthStatus;
  reason: string;
  linkedTo?: string;
}

interface FlowSummary {
  issues: number;
  done: number;
  good: number;
  warning: number;
  critical: number;
  averageLeadTimeDays: number;
  averageCycleTimeDays: number;
  leadTimeSampleSize: number;
  cycleTimeSampleSize: number;
}

interface StatusBreakdownItem extends FlowSummary {
  name: string;
  count: number;
  storyPoints: number;
  done: number;
}

interface FlowMetrics extends FlowSummary {
  items: FlowItem[];
}

interface SprintEntry extends FlowSummary {
  name: string;
  issues: number;
  completedIssues: number;
  committedPoints: number;
  completedPoints: number;
  completionRate: number;
  pointCompletionRate: number;
}

interface SprintMetrics {
  hasSprintData: boolean;
  sprintCount: number;
  sprints: SprintEntry[];
}

interface CapacityEntry {
  assignee: string;
  issues: number;
  activeIssues: number;
  doneIssues: number;
  storyPoints: number;
  doneStoryPoints: number;
  loadShare: number;
}

interface EpicEntry extends FlowSummary {
  epic: string;
  issues: number;
  completedIssues: number;
  storyPoints: number;
  doneStoryPoints: number;
  progress: number;
  pointProgress: number;
}

interface QuarterEntry extends FlowSummary {
  quarter: string;
  issues: number;
  doneIssues: number;
  activeIssues: number;
  storyPoints: number;
  completedStoryPoints: number;
  completionRate: number;
  pointCompletionRate: number;
  statusBreakdown: StatusBreakdownItem[];
}

interface LabelEntry extends FlowSummary {
  label: string;
  count: number;
  done: number;
  completionRate: number;
  storyPoints: number;
}

interface LabelMetrics {
  labelStats: LabelEntry[];
  totalLabeled: number;
  totalUnlabeled: number;
  uniqueLabels: number;
}

interface TypeEntry extends FlowSummary {
  type: string;
  count: number;
  done: number;
  completionRate: number;
  storyPoints: number;
}

interface ProjectEntry extends FlowSummary {
  project: string;
  count: number;
  done: number;
  completionRate: number;
  storyPoints: number;
}

interface ParentEntry extends FlowSummary {
  parent: string;
  count: number;
  done: number;
  completionRate: number;
  storyPoints: number;
}

interface RiskMetrics {
  blockedIssues: number;
  overdueIssues: number;
  highPriorityOpenIssues: number;
  openDefects: number;
}

interface LinkStat {
  type: string;
  count: number;
  uniqueFrom: number;
}

interface MostLinkedItem {
  key: string;
  summary: string;
  status: string;
  linkCount: number;
  linkTypes: string;
}

interface BlockedItem {
  key: string;
  summary: string;
  status: string;
  blockedBy: string;
  blockCount: number;
}

interface LinksMetrics {
  hasLinks: boolean;
  linkStats: LinkStat[];
  mostLinked: MostLinkedItem[];
  blockedItems: BlockedItem[];
  totalLinks: number;
  itemsWithLinks: number;
  linkTypes: number;
  _issueLinksText?: Record<string, string>;
}

interface StoryPointMetrics {
  totalStoryPoints: number;
  completedStoryPoints: number;
  remainingStoryPoints: number;
  pointCompletionRate: number;
}

interface HealthScoreInput {
  totalIssues: number;
  completionRate: number;
  flow: FlowMetrics;
  sprint: SprintMetrics;
  storyPoints: StoryPointMetrics;
}

interface PredictionResult {
  complete: boolean;
  daysRemaining: number | null;
  predictedDate?: string;
  velocityPerDay?: number;
}

interface DashboardMetrics {
  totalIssues: number;
  doneIssues: number;
  activeIssues: number;
  blockedIssues: number;
  openDefects: number;
  completionRate: number;
  customerVisibleProgress: number;
  overallDeliveryConfidence: number;
  totalCustomerVisible: number;
  flow: FlowMetrics;
  sprint: SprintMetrics;
  kanban: { byStatus: StatusBreakdownItem[]; byHighLevelStatus: StatusBreakdownItem[] };
  quarters: QuarterEntry[];
  capacity: CapacityEntry[];
  epics: EpicEntry[];
  labels: LabelMetrics;
  types: TypeEntry[];
  projects: ProjectEntry[];
  parents: ParentEntry[];
  relations: LinksMetrics;
  risk: RiskMetrics;
  storyPoints: StoryPointMetrics;
  healthScore: number;
  prediction: PredictionResult;
  insights: string[];
}

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

function sum(values: number[]): number {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

function round(value: number | null | undefined, decimals: number = 1): number {
  const factor = 10 ** decimals;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function safeAverage(values: number[]): number {
  const valid = values.filter((value) => Number.isFinite(Number(value)));
  return valid.length ? sum(valid) / valid.length : 0;
}

function parseNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function buildDate(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0,
): Date | null {
  const parsed = new Date(year, month, day, hour, minute);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function normalizeTwoDigitYear(year: string | number): number {
  const fullYear = Number(year);
  if (fullYear >= 100) return fullYear;
  return fullYear >= 70 ? fullYear + 1900 : fullYear + 2000;
}

function parseTimeParts(
  hour: string = '0',
  minute: string = '0',
  period?: string,
): { hour: number; minute: number } {
  let fullHour = Number(hour);
  if (period) {
    const normalizedPeriod = period.toUpperCase();
    if (normalizedPeriod === 'PM' && fullHour < 12) fullHour += 12;
    if (normalizedPeriod === 'AM' && fullHour === 12) fullHour = 0;
  }

  return { hour: fullHour, minute: Number(minute) };
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const text = String(value).trim();

  const numericValue = Number(text);
  if (Number.isFinite(numericValue) && numericValue > 20000 && numericValue < 80000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const millis = excelEpoch.getTime() + numericValue * 86400000;
    const parsed = new Date(millis);
    return buildDate(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  }

  const jiraDate = text.match(
    /^(\d{1,2})\/([A-Za-z]{3})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i,
  );
  if (jiraDate) {
    const [, day, month, year, hour = '0', minute = '0', period] = jiraDate;
    const time = parseTimeParts(hour, minute, period);
    return buildDate(
      normalizeTwoDigitYear(year),
      MONTHS[month.toLowerCase()],
      Number(day),
      time.hour,
      time.minute,
    );
  }

  const numericDate = text.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?$/i,
  );
  if (numericDate) {
    const [, first, second, year, hour = '0', minute = '0', period] = numericDate;
    const firstNumber = Number(first);
    const secondNumber = Number(second);
    const day = secondNumber > 12 ? secondNumber : firstNumber;
    const month = secondNumber > 12 ? firstNumber - 1 : secondNumber - 1;
    const time = parseTimeParts(hour, minute, period);
    return buildDate(normalizeTwoDigitYear(year), month, day, time.hour, time.minute);
  }

  const isoDate = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2}))?/);
  if (isoDate) {
    const [, year, month, day, hour = '0', minute = '0'] = isoDate;
    return buildDate(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysBetween(start: Date | null, end: Date | null): number | null {
  if (!start || !end || end < start) return null;
  const days = (end.getTime() - start.getTime()) / 86400000;
  return days > 3650 ? null : days;
}

// ---------------------------------------------------------------------------
// Issue field accessors
// ---------------------------------------------------------------------------

function parseLabels(issue: JiraIssue): string[] {
  const raw = String(issue['Labels'] || '').trim();
  if (!raw) return [];
  return raw
    .split(/[,;|]+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function isDone(issue: JiraIssue): boolean {
  return DONE_STATUSES.includes(issue['Status'] as string);
}

function isActive(issue: JiraIssue): boolean {
  return IN_PROGRESS_STATUSES.includes(issue['Status'] as string);
}

function countIssues(issues: JiraIssue[], predicate: (issue: JiraIssue) => boolean): number {
  return issues.filter(predicate).length;
}

function getStoryPoints(issue: JiraIssue): number {
  return parseNumber(issue['Story Points']);
}

function getDoneDate(issue: JiraIssue): Date | null {
  return (
    parseDate(issue['Done Date']) ||
    parseDate(issue['Resolution Date']) ||
    (isDone(issue) ? parseDate(issue['Updated Date']) : null)
  );
}

function getSprintName(issue: JiraIssue): string {
  return (
    (issue['Sprint'] as string) ||
    (issue['Actual Sprint'] as string) ||
    (issue['Planned Sprint'] as string) ||
    'No sprint'
  );
}

function getStartedDate(issue: JiraIssue): Date | null {
  return parseDate(issue['In Progress Date']) || parseDate(issue['Sprint Start']);
}

// ---------------------------------------------------------------------------
// Health / flow computation
// ---------------------------------------------------------------------------

function getHealthFromIssue(issue: JiraIssue, today: Date = new Date()): FlowItem {
  const created = parseDate(issue['Created Date']);
  const started = getStartedDate(issue);
  const done = getDoneDate(issue);
  const dueDate = parseDate(issue['Due Date']);
  const leadTimeDays = daysBetween(created, done);
  const cycleTimeDays = daysBetween(started, done);
  const ageDays = !done && created ? daysBetween(created, today) : null;
  const activeAgeDays = started && !done ? daysBetween(started, today) : null;
  const isBlocked =
    issue['Blocked Flag'] === true ||
    String(issue['Blocked Flag']).toLowerCase() === 'true';
  const isOverdue = dueDate && dueDate < today && !isDone(issue);
  const isHighPriority = ['High', 'Highest', 'Critical'].includes(issue['Priority'] as string);

  const reasons: string[] = [];
  let health: HealthStatus = 'good';

  if (isDone(issue)) {
    if (cycleTimeDays !== null && cycleTimeDays > 14) {
      health = 'critical';
      reasons.push('Cycle time is over 14 days.');
    } else if (cycleTimeDays !== null && cycleTimeDays > 7) {
      health = 'warning';
      reasons.push('Cycle time is over 7 days.');
    } else {
      reasons.push('Completed within expected cycle time.');
    }
  } else if (isActive(issue)) {
    if (activeAgeDays !== null && activeAgeDays > 14) {
      health = 'critical';
      reasons.push('Active work has been in progress over 14 days.');
    } else if (activeAgeDays !== null && activeAgeDays > 7) {
      health = 'warning';
      reasons.push('Active work has been in progress over 7 days.');
    } else {
      reasons.push('Active work is within expected age.');
    }
  } else if (ageDays !== null && ageDays > 30) {
    health = 'warning';
    reasons.push('Item has waited over 30 days.');
  } else {
    reasons.push('No flow risk detected from available dates.');
  }

  if (isBlocked) {
    health = 'critical';
    reasons.push('Blocked flag is set.');
  }

  if (isOverdue) {
    health = 'critical';
    reasons.push('Due date has passed.');
  }

  if (isHighPriority && !isDone(issue) && health === 'good') {
    health = 'warning';
    reasons.push('High-priority item is still open.');
  }

  return {
    key: (issue['Issue Key'] as string) || '',
    summary: (issue['Summary'] as string) || '',
    type: (issue['Issue Type'] as string) || '',
    status: (issue['Status'] as string) || 'Unknown',
    highLevelStatus: (issue['High Level Status'] as string) || '',
    sprint: getSprintName(issue),
    epic: (issue['Epic Link'] as string) || (issue['Parent Key'] as string) || '',
    isOrphan: !(issue['Epic Link'] || issue['Parent Key']),
    assignee: (issue['Assignee'] as string) || 'Unassigned',
    priority: (issue['Priority'] as string) || '',
    storyPoints: round(getStoryPoints(issue)),
    createdDate: (issue['Created Date'] as string) || '',
    startedDate: (issue['In Progress Date'] as string) || (issue['Sprint Start'] as string) || '',
    doneDate: (issue['Done Date'] as string) || (issue['Resolution Date'] as string) || '',
    leadTimeDays: leadTimeDays === null ? null : round(leadTimeDays),
    cycleTimeDays: cycleTimeDays === null ? null : round(cycleTimeDays),
    ageDays: ageDays === null ? null : round(ageDays),
    activeAgeDays: activeAgeDays === null ? null : round(activeAgeDays),
    labels: parseLabels(issue).join(', '),
    parent: (issue['Parent Key'] as string) || '',
    project: (issue['Project'] as string) || '',
    health,
    reason: reasons.join(' '),
  };
}

// ---------------------------------------------------------------------------
// Grouping utility
// ---------------------------------------------------------------------------

function groupBy(
  issues: JiraIssue[],
  keyFn: (issue: JiraIssue) => string | undefined | null,
): Record<string, JiraIssue[]> {
  return issues.reduce<Record<string, JiraIssue[]>>((groups, issue) => {
    const key = keyFn(issue) || 'Unassigned';
    groups[key] = groups[key] || [];
    groups[key].push(issue);
    return groups;
  }, {});
}

// ---------------------------------------------------------------------------
// Metric builders
// ---------------------------------------------------------------------------

function summarizeFlowItems(items: FlowItem[]): FlowSummary {
  const leadTimes = items
    .map((item) => item.leadTimeDays)
    .filter((value): value is number => value !== null);
  const cycleTimes = items
    .map((item) => item.cycleTimeDays)
    .filter((value): value is number => value !== null);

  return {
    issues: items.length,
    done: countIssues(items as unknown as JiraIssue[], (item) =>
      DONE_STATUSES.includes((item as unknown as FlowItem).status),
    ),
    good: countIssues(items as unknown as JiraIssue[], (item) =>
      (item as unknown as FlowItem).health === 'good',
    ),
    warning: countIssues(items as unknown as JiraIssue[], (item) =>
      (item as unknown as FlowItem).health === 'warning',
    ),
    critical: countIssues(items as unknown as JiraIssue[], (item) =>
      (item as unknown as FlowItem).health === 'critical',
    ),
    averageLeadTimeDays: round(safeAverage(leadTimes)),
    averageCycleTimeDays: round(safeAverage(cycleTimes)),
    leadTimeSampleSize: leadTimes.length,
    cycleTimeSampleSize: cycleTimes.length,
  };
}

function buildStatusBreakdown(
  issues: JiraIssue[],
  key: string,
  flowItems: FlowItem[],
): StatusBreakdownItem[] {
  return Object.entries(groupBy(issues, (issue) => (issue[key] as string) || 'Unknown'))
    .map(([name, items]) => {
      const issueKeys = new Set(items.map((issue) => issue['Issue Key']));
      const matchingFlowItems = flowItems.filter((item) => issueKeys.has(item.key));

      return {
        name,
        count: items.length,
        storyPoints: round(sum(items.map(getStoryPoints))),
        done: countIssues(items, isDone),
        ...summarizeFlowItems(matchingFlowItems),
      };
    })
    .sort((a, b) => b.count - a.count);
}

function buildFlowMetrics(flowItems: FlowItem[]): FlowMetrics {
  const summary = summarizeFlowItems(flowItems);

  return {
    ...summary,
    items: flowItems.slice().sort((a, b) => {
      const healthOrder: Record<HealthStatus, number> = { critical: 0, warning: 1, good: 2 };
      return (
        healthOrder[a.health] - healthOrder[b.health] ||
        (b.ageDays || 0) - (a.ageDays || 0)
      );
    }),
  };
}

function buildSprintMetrics(issues: JiraIssue[], flowItems: FlowItem[]): SprintMetrics {
  const sprintIssues = issues.filter(
    (issue) => issue['Sprint'] || issue['Actual Sprint'] || issue['Planned Sprint'],
  );
  const sprintGroups = groupBy(sprintIssues, getSprintName);

  const sprints: SprintEntry[] = Object.entries(sprintGroups)
    .map(([name, items]) => {
      const committedPoints = sum(items.map(getStoryPoints));
      const completedPoints = sum(items.filter(isDone).map(getStoryPoints));
      const issueKeys = new Set(items.map((issue) => issue['Issue Key']));
      const matchingFlowItems = flowItems.filter((item) => issueKeys.has(item.key));

      return {
        name,
        issues: items.length,
        completedIssues: countIssues(items, isDone),
        committedPoints: round(committedPoints),
        completedPoints: round(completedPoints),
        completionRate: items.length
          ? Math.round((countIssues(items, isDone) / items.length) * 100)
          : 0,
        pointCompletionRate: committedPoints
          ? Math.round((completedPoints / committedPoints) * 100)
          : 0,
        ...summarizeFlowItems(matchingFlowItems),
      };
    })
    .sort((a, b) => b.completedPoints - a.completedPoints);

  return {
    hasSprintData: sprints.length > 0,
    sprintCount: sprints.length,
    sprints: sprints.slice(0, 8),
  };
}

function buildCapacityMetrics(issues: JiraIssue[]): CapacityEntry[] {
  return Object.entries(groupBy(issues, (issue) => (issue['Assignee'] as string) || 'Unassigned'))
    .map(([assignee, items]) => {
      const storyPoints = sum(items.map(getStoryPoints));
      const doneStoryPoints = sum(items.filter(isDone).map(getStoryPoints));

      return {
        assignee,
        issues: items.length,
        activeIssues: countIssues(items, isActive),
        doneIssues: countIssues(items, isDone),
        storyPoints: round(storyPoints),
        doneStoryPoints: round(doneStoryPoints),
        loadShare: issues.length
          ? Math.round((items.length / issues.length) * 100)
          : 0,
      };
    })
    .sort((a, b) => b.issues - a.issues)
    .slice(0, 10);
}

function buildEpicMetrics(issues: JiraIssue[], flowItems: FlowItem[]): EpicEntry[] {
  const groups = groupBy(
    issues,
    (issue) =>
      (issue['Epic Link'] as string) ||
      (issue['Parent Key'] as string) ||
      'No epic / parent',
  );

  return Object.entries(groups)
    .map(([epic, items]) => {
      const storyPoints = sum(items.map(getStoryPoints));
      const doneStoryPoints = sum(items.filter(isDone).map(getStoryPoints));
      const issueKeys = new Set(items.map((issue) => issue['Issue Key']));
      const matchingFlowItems = flowItems.filter((item) => issueKeys.has(item.key));

      return {
        epic,
        issues: items.length,
        completedIssues: countIssues(items, isDone),
        storyPoints: round(storyPoints),
        doneStoryPoints: round(doneStoryPoints),
        progress: items.length
          ? Math.round((countIssues(items, isDone) / items.length) * 100)
          : 0,
        pointProgress: storyPoints
          ? Math.round((doneStoryPoints / storyPoints) * 100)
          : 0,
        ...summarizeFlowItems(matchingFlowItems),
      };
    })
    .sort((a, b) => b.issues - a.issues)
    .slice(0, 10);
}

function getQuarterLabel(date: Date | null): string {
  if (!date) return 'No date';
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()} Q${quarter}`;
}

function getQuarterDate(issue: JiraIssue): Date | null {
  return (
    getDoneDate(issue) ||
    parseDate(issue['Created Date']) ||
    parseDate(issue['Updated Date'])
  );
}

function buildQuarterMetrics(issues: JiraIssue[], flowItems: FlowItem[]): QuarterEntry[] {
  const groups = groupBy(issues, (issue) => getQuarterLabel(getQuarterDate(issue)));

  return Object.entries(groups)
    .map(([quarter, items]) => {
      const storyPoints = sum(items.map(getStoryPoints));
      const completedStoryPoints = sum(items.filter(isDone).map(getStoryPoints));
      const issueKeys = new Set(items.map((issue) => issue['Issue Key']));
      const matchingFlowItems = flowItems.filter((item) => issueKeys.has(item.key));

      return {
        quarter,
        issues: items.length,
        doneIssues: countIssues(items, isDone),
        activeIssues: countIssues(items, isActive),
        storyPoints: round(storyPoints),
        completedStoryPoints: round(completedStoryPoints),
        completionRate: items.length
          ? Math.round((countIssues(items, isDone) / items.length) * 100)
          : 0,
        pointCompletionRate: storyPoints
          ? Math.round((completedStoryPoints / storyPoints) * 100)
          : 0,
        statusBreakdown: buildStatusBreakdown(items, 'Status', matchingFlowItems).slice(0, 6),
        ...summarizeFlowItems(matchingFlowItems),
      };
    })
    .sort((a, b) => {
      if (a.quarter === 'No date') return 1;
      if (b.quarter === 'No date') return -1;
      return b.quarter.localeCompare(a.quarter);
    });
}

function buildLabelMetrics(issues: JiraIssue[], flowItems: FlowItem[]): LabelMetrics {
  const labelMap: Record<string, JiraIssue[]> = {};
  issues.forEach((issue) => {
    const ls = parseLabels(issue);
    const targets = ls.length ? ls : ['(unlabeled)'];
    targets.forEach((label) => {
      if (!labelMap[label]) labelMap[label] = [];
      labelMap[label].push(issue);
    });
  });

  const labelStats: LabelEntry[] = Object.entries(labelMap)
    .map(([label, items]) => {
      const keys = new Set(items.map((i) => i['Issue Key']));
      const matching = flowItems.filter((fi) => keys.has(fi.key));
      return {
        label,
        count: items.length,
        done: countIssues(items, isDone),
        completionRate: items.length
          ? Math.round((countIssues(items, isDone) / items.length) * 100)
          : 0,
        storyPoints: round(sum(items.map(getStoryPoints))),
        ...summarizeFlowItems(matching),
      };
    })
    .sort((a, b) => {
      if (a.label === '(unlabeled)') return 1;
      if (b.label === '(unlabeled)') return -1;
      return b.count - a.count;
    });

  const totalLabeled = issues.filter((i) => parseLabels(i).length > 0).length;
  return {
    labelStats: labelStats.slice(0, 15),
    totalLabeled,
    totalUnlabeled: issues.length - totalLabeled,
    uniqueLabels: Object.keys(labelMap).filter((l) => l !== '(unlabeled)').length,
  };
}

function buildTypeMetrics(issues: JiraIssue[], flowItems: FlowItem[]): TypeEntry[] {
  return Object.entries(groupBy(issues, (i) => (i['Issue Type'] as string) || 'Unknown'))
    .map(([type, items]) => {
      const keys = new Set(items.map((i) => i['Issue Key']));
      const matching = flowItems.filter((fi) => keys.has(fi.key));
      return {
        type,
        count: items.length,
        done: countIssues(items, isDone),
        completionRate: items.length
          ? Math.round((countIssues(items, isDone) / items.length) * 100)
          : 0,
        storyPoints: round(sum(items.map(getStoryPoints))),
        ...summarizeFlowItems(matching),
      };
    })
    .sort((a, b) => b.count - a.count);
}

function buildProjectMetrics(issues: JiraIssue[], flowItems: FlowItem[]): ProjectEntry[] {
  return Object.entries(groupBy(issues, (i) => (i['Project'] as string) || 'Unknown'))
    .map(([project, items]) => {
      const keys = new Set(items.map((i) => i['Issue Key']));
      const matching = flowItems.filter((fi) => keys.has(fi.key));
      return {
        project,
        count: items.length,
        done: countIssues(items, isDone),
        completionRate: items.length
          ? Math.round((countIssues(items, isDone) / items.length) * 100)
          : 0,
        storyPoints: round(sum(items.map(getStoryPoints))),
        ...summarizeFlowItems(matching),
      };
    })
    .sort((a, b) => b.count - a.count);
}

function buildParentMetrics(issues: JiraIssue[], flowItems: FlowItem[]): ParentEntry[] {
  const issuesWithParent = issues.filter(
    (i) => i['Parent Key'] && String(i['Parent Key']).trim(),
  );
  if (!issuesWithParent.length) return [];
  return Object.entries(groupBy(issuesWithParent, (i) => i['Parent Key'] as string))
    .map(([parent, items]) => {
      const keys = new Set(items.map((i) => i['Issue Key']));
      const matching = flowItems.filter((fi) => keys.has(fi.key));
      return {
        parent,
        count: items.length,
        done: countIssues(items, isDone),
        completionRate: items.length
          ? Math.round((countIssues(items, isDone) / items.length) * 100)
          : 0,
        storyPoints: round(sum(items.map(getStoryPoints))),
        ...summarizeFlowItems(matching),
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

function buildRiskMetrics(issues: JiraIssue[]): RiskMetrics {
  const today = new Date();
  const blockedIssues = countIssues(
    issues,
    (issue) =>
      issue['Blocked Flag'] === true ||
      String(issue['Blocked Flag']).toLowerCase() === 'true',
  );
  const overdueIssues = countIssues(issues, (issue) => {
    const dueDate = parseDate(issue['Due Date']);
    return !!(dueDate && dueDate < today && !isDone(issue));
  });
  const highPriorityOpenIssues = countIssues(
    issues,
    (issue) =>
      ['High', 'Highest', 'Critical'].includes(issue['Priority'] as string) &&
      !isDone(issue),
  );
  const openDefects = countIssues(
    issues,
    (issue) =>
      ['Defect', 'Bug'].includes(issue['Issue Type'] as string) && !isDone(issue),
  );

  return {
    blockedIssues,
    overdueIssues,
    highPriorityOpenIssues,
    openDefects,
  };
}

function buildLinksMetrics(issues: JiraIssue[]): LinksMetrics {
  if (!issues.length)
    return {
      hasLinks: false,
      linkStats: [],
      mostLinked: [],
      blockedItems: [],
      totalLinks: 0,
      itemsWithLinks: 0,
      linkTypes: 0,
    };

  const allFields = Object.keys(issues[0]);
  const linkColumns = allFields.filter((f) => /issue\s*link/i.test(f));

  if (!linkColumns.length) {
    return {
      hasLinks: false,
      linkStats: [],
      mostLinked: [],
      blockedItems: [],
      totalLinks: 0,
      itemsWithLinks: 0,
      linkTypes: 0,
    };
  }

  const linksByType: Record<string, { from: string; to: string; direction: string }[]> = {};
  const issueLinksMap: Record<string, { type: string; target: string; direction: string }[]> = {};

  issues.forEach((issue) => {
    const key = issue['Issue Key'] as string;
    if (!key) return;

    linkColumns.forEach((col) => {
      const raw = String(issue[col] || '').trim();
      if (!raw) return;

      const typeMatch = col.match(/\(([^)]+)\)/);
      const linkType = typeMatch ? typeMatch[1] : col;
      const direction = /inward/i.test(col)
        ? 'inward'
        : /outward/i.test(col)
        ? 'outward'
        : 'unknown';

      raw
        .split(/[,;]+/)
        .map((t) => t.replace(/\s*\([^)]+\)/g, '').trim())
        .filter(Boolean)
        .forEach((target) => {
          if (!linksByType[linkType]) linksByType[linkType] = [];
          linksByType[linkType].push({ from: key, to: target, direction });
          if (!issueLinksMap[key]) issueLinksMap[key] = [];
          issueLinksMap[key].push({ type: linkType, target, direction });
        });
    });
  });

  const totalLinks = Object.values(linksByType).reduce((s, arr) => s + arr.length, 0);
  if (!totalLinks) {
    return {
      hasLinks: false,
      linkStats: [],
      mostLinked: [],
      blockedItems: [],
      totalLinks: 0,
      itemsWithLinks: 0,
      linkTypes: 0,
    };
  }

  const linkStats: LinkStat[] = Object.entries(linksByType)
    .map(([type, links]) => ({
      type,
      count: links.length,
      uniqueFrom: new Set(links.map((l) => l.from)).size,
    }))
    .sort((a, b) => b.count - a.count);

  const mostLinked: MostLinkedItem[] = Object.entries(issueLinksMap)
    .map(([key, links]) => {
      const issue = issues.find((i) => i['Issue Key'] === key);
      return {
        key,
        summary: issue ? (issue['Summary'] as string) || '' : '',
        status: issue ? (issue['Status'] as string) || '' : '',
        linkCount: links.length,
        linkTypes: Array.from(new Set(links.map((l) => l.type))).join(', '),
      };
    })
    .sort((a, b) => b.linkCount - a.linkCount)
    .slice(0, 10);

  const blockedItems: BlockedItem[] = Object.entries(issueLinksMap)
    .reduce<BlockedItem[]>((acc, [key, links]) => {
      const blocking = links.filter(
        (l) => /block/i.test(l.type) && l.direction === 'inward',
      );
      if (!blocking.length) return acc;
      const issue = issues.find((i) => i['Issue Key'] === key);
      acc.push({
        key,
        summary: issue ? (issue['Summary'] as string) || '' : '',
        status: issue ? (issue['Status'] as string) || '' : '',
        blockedBy: blocking.map((l) => l.target).join(', '),
        blockCount: blocking.length,
      });
      return acc;
    }, [])
    .sort((a, b) => b.blockCount - a.blockCount)
    .slice(0, 10);

  const issueLinksText: Record<string, string> = Object.fromEntries(
    Object.entries(issueLinksMap).map(([k, links]) => [
      k,
      Array.from(new Set(links.map((l) => `${l.type}: ${l.target}`))).slice(0, 4).join(' · '),
    ]),
  );

  return {
    hasLinks: true,
    totalLinks,
    itemsWithLinks: Object.keys(issueLinksMap).length,
    linkTypes: linkStats.length,
    linkStats,
    mostLinked,
    blockedItems,
    _issueLinksText: issueLinksText,
  };
}

// ---------------------------------------------------------------------------
// Score & prediction
// ---------------------------------------------------------------------------

function calculateHealthScore({
  totalIssues,
  completionRate,
  flow,
  sprint,
  storyPoints,
}: HealthScoreInput): number {
  const total = Math.max(totalIssues, 1);
  const criticalRatio = (flow.critical || 0) / total;
  const warningRatio = (flow.warning || 0) / total;
  const orphanCount = (flow.items || []).filter((i) => i.isOrphan).length;
  const orphanRatio = orphanCount / total;
  const latestSprintRate = sprint.sprints?.[0]?.completionRate ?? completionRate;
  const avgCycle = flow.averageCycleTimeDays || 0;
  const cycleScore = avgCycle === 0 ? 100 : Math.max(0, 100 - (avgCycle - 3) * 8);

  const raw =
    completionRate * 0.28 +
    (1 - Math.min(criticalRatio, 1)) * 100 * 0.24 +
    (1 - Math.min(warningRatio, 1)) * 100 * 0.12 +
    latestSprintRate * 0.14 +
    (1 - Math.min(orphanRatio, 1)) * 100 * 0.12 +
    Math.min(cycleScore, 100) * 0.1;

  // storyPoints param is accepted for interface compatibility but not used in the formula
  void storyPoints;

  return Math.round(Math.max(0, Math.min(100, raw)));
}

function calculatePrediction(
  issues: JiraIssue[],
  doneIssues: number,
  totalIssues: number,
): PredictionResult {
  if (doneIssues >= totalIssues) return { complete: true, daysRemaining: 0 };
  const remaining = totalIssues - doneIssues;

  const timestamps = issues
    .map((i) => parseDate(i['Created Date']))
    .filter((d): d is Date => d !== null)
    .map((d) => d.getTime());

  if (!timestamps.length) return { complete: false, daysRemaining: null };

  const elapsed = Math.max((Date.now() - Math.min(...timestamps)) / 86400000, 1);
  const velocity = doneIssues / elapsed;

  if (velocity < 0.01) return { complete: false, daysRemaining: null };

  const daysRemaining = Math.round(remaining / velocity);
  const predicted = new Date(Date.now() + daysRemaining * 86400000);

  return {
    complete: false,
    daysRemaining,
    predictedDate: predicted.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    velocityPerDay: round(velocity, 2),
  };
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

function buildInsights(metrics: Omit<DashboardMetrics, 'healthScore' | 'prediction' | 'insights'>): string[] {
  const insights: string[] = [];

  if (metrics.flow.leadTimeSampleSize) {
    insights.push(
      `Average lead time is ${metrics.flow.averageLeadTimeDays} days across ${metrics.flow.leadTimeSampleSize} completed items.`,
    );
  } else {
    insights.push(
      'Lead time needs Created Date plus Done/Resolution data to calculate.',
    );
  }

  if (metrics.flow.cycleTimeSampleSize) {
    insights.push(
      `Average cycle time is ${metrics.flow.averageCycleTimeDays} days once work starts.`,
    );
  } else {
    insights.push(
      'Cycle time needs In Progress/Sprint Start dates plus Done/Resolution data.',
    );
  }

  if (metrics.sprint.hasSprintData) {
    insights.push(
      `${metrics.sprint.sprintCount} sprint groups were found for sprint commitment and completion analysis.`,
    );
  } else {
    insights.push(
      'No sprint field was found, so sprint health is inferred from item-level flow and kanban status.',
    );
  }

  if (metrics.flow.critical || metrics.flow.warning) {
    insights.push(
      `${metrics.flow.critical} critical and ${metrics.flow.warning} warning items need attention based on age, overdue, blocked, priority, or cycle-time signals.`,
    );
  }

  if (metrics.storyPoints.totalStoryPoints) {
    insights.push(
      `${metrics.storyPoints.completedStoryPoints} of ${metrics.storyPoints.totalStoryPoints} story points are complete.`,
    );
  } else {
    insights.push(
      'Story point fields are missing or empty, so capacity is issue-count based.',
    );
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function calculateDashboardMetrics(issues: JiraIssue[]): DashboardMetrics {
  const totalIssues = issues.length;
  const doneIssues = countIssues(issues, isDone);
  const activeIssues = countIssues(issues, isActive);
  const completionRate = totalIssues
    ? Math.round((doneIssues / totalIssues) * 100)
    : 0;
  const flowItems = issues.map((issue) => getHealthFromIssue(issue));
  const risk = buildRiskMetrics(issues);
  const flow = buildFlowMetrics(flowItems);
  const sprint = buildSprintMetrics(issues, flowItems);
  const kanban = {
    byStatus: buildStatusBreakdown(issues, 'Status', flowItems),
    byHighLevelStatus: buildStatusBreakdown(issues, 'High Level Status', flowItems),
  };
  const quarters = buildQuarterMetrics(issues, flowItems);
  const capacity = buildCapacityMetrics(issues);
  const epics = buildEpicMetrics(issues, flowItems);
  const labels = buildLabelMetrics(issues, flowItems);
  const types = buildTypeMetrics(issues, flowItems);
  const projects = buildProjectMetrics(issues, flowItems);
  const parents = buildParentMetrics(issues, flowItems);
  const relations = buildLinksMetrics(issues);

  if (relations._issueLinksText) {
    flow.items = flow.items.map((item) => ({
      ...item,
      linkedTo: relations._issueLinksText![item.key] || '',
    }));
    delete relations._issueLinksText;
  }

  const totalStoryPoints = sum(issues.map(getStoryPoints));
  const completedStoryPoints = sum(issues.filter(isDone).map(getStoryPoints));
  const totalCustomerVisible = countIssues(
    issues,
    (issue) => String(issue['Customer Visible']).toLowerCase() === 'true',
  );
  const doneCustomerVisible = countIssues(
    issues,
    (issue) =>
      String(issue['Customer Visible']).toLowerCase() === 'true' && isDone(issue),
  );
  const issuesWithConfidence = issues.filter(
    (issue) =>
      issue['Effort Confidence'] !== undefined && issue['Effort Confidence'] !== '',
  );
  const overallDeliveryConfidence = issuesWithConfidence.length
    ? round(
        safeAverage(
          issuesWithConfidence.map((issue) => parseNumber(issue['Effort Confidence'])),
        ),
        2,
      )
    : 0;

  const metrics = {
    totalIssues,
    doneIssues,
    activeIssues,
    blockedIssues: risk.blockedIssues,
    openDefects: risk.openDefects,
    completionRate,
    customerVisibleProgress: totalCustomerVisible
      ? Math.round((doneCustomerVisible / totalCustomerVisible) * 100)
      : 0,
    overallDeliveryConfidence,
    totalCustomerVisible,
    flow,
    sprint,
    kanban,
    quarters,
    capacity,
    epics,
    labels,
    types,
    projects,
    parents,
    relations,
    risk,
    storyPoints: {
      totalStoryPoints: round(totalStoryPoints),
      completedStoryPoints: round(completedStoryPoints),
      remainingStoryPoints: round(totalStoryPoints - completedStoryPoints),
      pointCompletionRate: totalStoryPoints
        ? Math.round((completedStoryPoints / totalStoryPoints) * 100)
        : 0,
    },
  };

  const healthScore = calculateHealthScore(metrics);
  const prediction = calculatePrediction(issues, doneIssues, totalIssues);

  return {
    ...metrics,
    healthScore,
    prediction,
    insights: buildInsights(metrics),
  };
}
