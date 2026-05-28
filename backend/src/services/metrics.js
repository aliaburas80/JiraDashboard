const DONE_STATUSES = ['Done', 'Closed', 'Resolved'];
const IN_PROGRESS_STATUSES = ['In Progress', 'Code Review', 'QA', 'Testing', 'UAT'];
const MONTHS = {
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

function sum(values) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function safeAverage(values) {
  const valid = values.filter((value) => Number.isFinite(Number(value)));
  return valid.length ? sum(valid) / valid.length : 0;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildDate(year, month, day, hour = 0, minute = 0) {
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

function normalizeTwoDigitYear(year) {
  const fullYear = Number(year);
  if (fullYear >= 100) return fullYear;
  return fullYear >= 70 ? fullYear + 1900 : fullYear + 2000;
}

function parseTimeParts(hour = '0', minute = '0', period) {
  let fullHour = Number(hour);
  if (period) {
    const normalizedPeriod = period.toUpperCase();
    if (normalizedPeriod === 'PM' && fullHour < 12) fullHour += 12;
    if (normalizedPeriod === 'AM' && fullHour === 12) fullHour = 0;
  }

  return { hour: fullHour, minute: Number(minute) };
}

function parseDate(value) {
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

  const jiraDate = text.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i);
  if (jiraDate) {
    const [, day, month, year, hour = '0', minute = '0', period] = jiraDate;
    const time = parseTimeParts(hour, minute, period);
    return buildDate(normalizeTwoDigitYear(year), MONTHS[month.toLowerCase()], Number(day), time.hour, time.minute);
  }

  const numericDate = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?$/i);
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

function daysBetween(start, end) {
  if (!start || !end || end < start) return null;
  const days = (end.getTime() - start.getTime()) / 86400000;
  return days > 3650 ? null : days;
}

function isDone(issue) {
  return DONE_STATUSES.includes(issue['Status']);
}

function isActive(issue) {
  return IN_PROGRESS_STATUSES.includes(issue['Status']);
}

function countIssues(issues, predicate) {
  return issues.filter(predicate).length;
}

function getStoryPoints(issue) {
  return parseNumber(issue['Story Points']);
}

function getDoneDate(issue) {
  return parseDate(issue['Done Date']) || parseDate(issue['Resolution Date']) || (isDone(issue) ? parseDate(issue['Updated Date']) : null);
}

function getSprintName(issue) {
  return issue['Sprint'] || issue['Actual Sprint'] || issue['Planned Sprint'] || 'No sprint';
}

function getStartedDate(issue) {
  return parseDate(issue['In Progress Date']) || parseDate(issue['Sprint Start']);
}

function getHealthFromIssue(issue, today = new Date()) {
  const created = parseDate(issue['Created Date']);
  const started = getStartedDate(issue);
  const done = getDoneDate(issue);
  const dueDate = parseDate(issue['Due Date']);
  const leadTimeDays = daysBetween(created, done);
  const cycleTimeDays = daysBetween(started, done);
  const ageDays = !done && created ? daysBetween(created, today) : null;
  const activeAgeDays = started && !done ? daysBetween(started, today) : null;
  const isBlocked = issue['Blocked Flag'] === true || String(issue['Blocked Flag']).toLowerCase() === 'true';
  const isOverdue = dueDate && dueDate < today && !isDone(issue);
  const isHighPriority = ['High', 'Highest', 'Critical'].includes(issue['Priority']);

  const reasons = [];
  let health = 'good';

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
    key: issue['Issue Key'] || '',
    summary: issue['Summary'] || '',
    type: issue['Issue Type'] || '',
    status: issue['Status'] || 'Unknown',
    highLevelStatus: issue['High Level Status'] || '',
    sprint: getSprintName(issue),
    epic: issue['Epic Link'] || issue['Parent Key'] || '',
    isOrphan: !(issue['Epic Link'] || issue['Parent Key']),
    assignee: issue['Assignee'] || 'Unassigned',
    priority: issue['Priority'] || '',
    storyPoints: round(getStoryPoints(issue)),
    createdDate: issue['Created Date'] || '',
    startedDate: issue['In Progress Date'] || issue['Sprint Start'] || '',
    doneDate: issue['Done Date'] || issue['Resolution Date'] || '',
    leadTimeDays: leadTimeDays === null ? null : round(leadTimeDays),
    cycleTimeDays: cycleTimeDays === null ? null : round(cycleTimeDays),
    ageDays: ageDays === null ? null : round(ageDays),
    activeAgeDays: activeAgeDays === null ? null : round(activeAgeDays),
    health,
    reason: reasons.join(' '),
  };
}

function groupBy(issues, keyFn) {
  return issues.reduce((groups, issue) => {
    const key = keyFn(issue) || 'Unassigned';
    groups[key] = groups[key] || [];
    groups[key].push(issue);
    return groups;
  }, {});
}

function summarizeFlowItems(items) {
  const leadTimes = items.map((item) => item.leadTimeDays).filter((value) => value !== null);
  const cycleTimes = items.map((item) => item.cycleTimeDays).filter((value) => value !== null);

  return {
    issues: items.length,
    done: countIssues(items, (item) => DONE_STATUSES.includes(item.status)),
    good: countIssues(items, (item) => item.health === 'good'),
    warning: countIssues(items, (item) => item.health === 'warning'),
    critical: countIssues(items, (item) => item.health === 'critical'),
    averageLeadTimeDays: round(safeAverage(leadTimes)),
    averageCycleTimeDays: round(safeAverage(cycleTimes)),
    leadTimeSampleSize: leadTimes.length,
    cycleTimeSampleSize: cycleTimes.length,
  };
}

function buildStatusBreakdown(issues, key, flowItems) {
  return Object.entries(groupBy(issues, (issue) => issue[key] || 'Unknown'))
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

function buildFlowMetrics(flowItems) {
  const summary = summarizeFlowItems(flowItems);

  return {
    ...summary,
    items: flowItems
      .slice()
      .sort((a, b) => {
        const healthOrder = { critical: 0, warning: 1, good: 2 };
        return healthOrder[a.health] - healthOrder[b.health] || (b.ageDays || 0) - (a.ageDays || 0);
      }),
  };
}

function buildSprintMetrics(issues, flowItems) {
  const sprintIssues = issues.filter((issue) => issue['Sprint'] || issue['Actual Sprint'] || issue['Planned Sprint']);
  const sprintGroups = groupBy(sprintIssues, getSprintName);

  const sprints = Object.entries(sprintGroups)
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
        completionRate: items.length ? Math.round((countIssues(items, isDone) / items.length) * 100) : 0,
        pointCompletionRate: committedPoints ? Math.round((completedPoints / committedPoints) * 100) : 0,
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

function buildCapacityMetrics(issues) {
  return Object.entries(groupBy(issues, (issue) => issue['Assignee'] || 'Unassigned'))
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
        loadShare: issues.length ? Math.round((items.length / issues.length) * 100) : 0,
      };
    })
    .sort((a, b) => b.issues - a.issues)
    .slice(0, 10);
}

function buildEpicMetrics(issues, flowItems) {
  const groups = groupBy(issues, (issue) => issue['Epic Link'] || issue['Parent Key'] || 'No epic / parent');

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
        progress: items.length ? Math.round((countIssues(items, isDone) / items.length) * 100) : 0,
        pointProgress: storyPoints ? Math.round((doneStoryPoints / storyPoints) * 100) : 0,
        ...summarizeFlowItems(matchingFlowItems),
      };
    })
    .sort((a, b) => b.issues - a.issues)
    .slice(0, 10);
}

function getQuarterLabel(date) {
  if (!date) return 'No date';
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()} Q${quarter}`;
}

function getQuarterDate(issue) {
  return getDoneDate(issue) || parseDate(issue['Created Date']) || parseDate(issue['Updated Date']);
}

function buildQuarterMetrics(issues, flowItems) {
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
        completionRate: items.length ? Math.round((countIssues(items, isDone) / items.length) * 100) : 0,
        pointCompletionRate: storyPoints ? Math.round((completedStoryPoints / storyPoints) * 100) : 0,
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

function buildRiskMetrics(issues) {
  const today = new Date();
  const blockedIssues = countIssues(issues, (issue) => issue['Blocked Flag'] === true || String(issue['Blocked Flag']).toLowerCase() === 'true');
  const overdueIssues = countIssues(issues, (issue) => {
    const dueDate = parseDate(issue['Due Date']);
    return dueDate && dueDate < today && !isDone(issue);
  });
  const highPriorityOpenIssues = countIssues(issues, (issue) => ['High', 'Highest', 'Critical'].includes(issue['Priority']) && !isDone(issue));
  const openDefects = countIssues(issues, (issue) => ['Defect', 'Bug'].includes(issue['Issue Type']) && !isDone(issue));

  return {
    blockedIssues,
    overdueIssues,
    highPriorityOpenIssues,
    openDefects,
  };
}

function buildInsights(metrics) {
  const insights = [];

  if (metrics.flow.leadTimeSampleSize) {
    insights.push(`Average lead time is ${metrics.flow.averageLeadTimeDays} days across ${metrics.flow.leadTimeSampleSize} completed items.`);
  } else {
    insights.push('Lead time needs Created Date plus Done/Resolution data to calculate.');
  }

  if (metrics.flow.cycleTimeSampleSize) {
    insights.push(`Average cycle time is ${metrics.flow.averageCycleTimeDays} days once work starts.`);
  } else {
    insights.push('Cycle time needs In Progress/Sprint Start dates plus Done/Resolution data.');
  }

  if (metrics.sprint.hasSprintData) {
    insights.push(`${metrics.sprint.sprintCount} sprint groups were found for sprint commitment and completion analysis.`);
  } else {
    insights.push('No sprint field was found, so sprint health is inferred from item-level flow and kanban status.');
  }

  if (metrics.flow.critical || metrics.flow.warning) {
    insights.push(`${metrics.flow.critical} critical and ${metrics.flow.warning} warning items need attention based on age, overdue, blocked, priority, or cycle-time signals.`);
  }

  if (metrics.storyPoints.totalStoryPoints) {
    insights.push(`${metrics.storyPoints.completedStoryPoints} of ${metrics.storyPoints.totalStoryPoints} story points are complete.`);
  } else {
    insights.push('Story point fields are missing or empty, so capacity is issue-count based.');
  }

  return insights;
}

function calculateDashboardMetrics(issues) {
  const totalIssues = issues.length;
  const doneIssues = countIssues(issues, isDone);
  const activeIssues = countIssues(issues, isActive);
  const completionRate = totalIssues ? Math.round((doneIssues / totalIssues) * 100) : 0;
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
  const totalStoryPoints = sum(issues.map(getStoryPoints));
  const completedStoryPoints = sum(issues.filter(isDone).map(getStoryPoints));
  const totalCustomerVisible = countIssues(issues, (issue) => String(issue['Customer Visible']).toLowerCase() === 'true');
  const doneCustomerVisible = countIssues(
    issues,
    (issue) => String(issue['Customer Visible']).toLowerCase() === 'true' && isDone(issue)
  );
  const issuesWithConfidence = issues.filter((issue) => issue['Effort Confidence'] !== undefined && issue['Effort Confidence'] !== '');
  const overallDeliveryConfidence = issuesWithConfidence.length
    ? round(safeAverage(issuesWithConfidence.map((issue) => parseNumber(issue['Effort Confidence']))), 2)
    : 0;

  const metrics = {
    totalIssues,
    doneIssues,
    activeIssues,
    blockedIssues: risk.blockedIssues,
    openDefects: risk.openDefects,
    completionRate,
    customerVisibleProgress: totalCustomerVisible ? Math.round((doneCustomerVisible / totalCustomerVisible) * 100) : 0,
    overallDeliveryConfidence,
    totalCustomerVisible,
    flow,
    sprint,
    kanban,
    quarters,
    capacity,
    epics,
    risk,
    storyPoints: {
      totalStoryPoints: round(totalStoryPoints),
      completedStoryPoints: round(completedStoryPoints),
      remainingStoryPoints: round(totalStoryPoints - completedStoryPoints),
      pointCompletionRate: totalStoryPoints ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0,
    },
  };

  return {
    ...metrics,
    insights: buildInsights(metrics),
  };
}

module.exports = { calculateDashboardMetrics };
