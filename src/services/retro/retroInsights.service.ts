// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
//
// Retrospective insights engine — RETRO-11 to RETRO-14, RETRO-29, RETRO-33 to
// RETRO-36. Works over one or more RetroRecord (single in-app form submission,
// or every sprint parsed from an uploaded file) and produces a single
// RetrospectiveInsight per record plus cross-record signals (repeated
// blockers, duplicate action items) that only emerge with multiple records.

import type {
  RetroRecord, RetrospectiveInsight, SuggestedBacklogItem, ThemeCategory, ThemeMatch,
} from '@/types/retrospective';

function compact(lines: (string | null)[]): string[] {
  return lines.filter((line): line is string => line !== null);
}

// RETRO-34 — common themes, detected by keyword match against free-text entries.
export const THEME_LABEL: Record<ThemeCategory, string> = {
  process: 'Process', communication: 'Communication', requirements: 'Requirements',
  'qa-release': 'QA & Release', dependency: 'Dependency', technical: 'Technical', planning: 'Planning',
};

const THEME_KEYWORDS: Record<ThemeCategory, RegExp> = {
  process:       /process|ceremony|standup|retro|workflow|ritual|sprint planning|refinement (session|meeting)|too (long|many) meeting/i,
  communication: /communicat|misunderstand|alignment|silo|hand.?off|out of the loop|not (informed|aware)/i,
  requirements:  /requirement|acceptance criteria|\bscope\b|unclear|ambigu|not (well )?defined/i,
  'qa-release':  /\bqa\b|test(ing)?|release|deploy|regression|defect|\bbug(s)?\b|broke production|hotfix/i,
  dependency:    /depend|blocked by|waiting on|external team|third.?party|another team/i,
  technical:     /tech(nical)? debt|refactor|architecture|infrastructure|performance|flaky|legacy code/i,
  planning:      /estimat|capacity|sprint goal|carryover|over.?committed|under.?estimat|too much work/i,
};

function detectThemes(text: string[]): ThemeMatch[] {
  const matches: ThemeMatch[] = [];
  (Object.keys(THEME_KEYWORDS) as ThemeCategory[]).forEach((category) => {
    const pattern = THEME_KEYWORDS[category];
    const examples = text.filter((line) => pattern.test(line));
    if (examples.length) matches.push({ category, count: examples.length, examples: examples.slice(0, 3) });
  });
  return matches.sort((a, b) => b.count - a.count);
}

// RETRO-36 — missing owners and missing due dates on action items.
function detectOwnershipGaps(record: RetroRecord): string[] {
  const filled = record.actions.filter((a) => a.text.trim());
  const noOwner = filled.filter((a) => !a.owner.trim()).length;
  const noDue   = filled.filter((a) => !a.dueDate.trim()).length;
  return compact([
    noOwner > 0 ? `${noOwner} action item${noOwner > 1 ? 's are' : ' is'} missing an owner.` : null,
    noDue > 0   ? `${noDue} action item${noDue > 1 ? 's are' : ' is'} missing a due date.` : null,
  ]);
}

// RETRO-33 — flag duplicate action items within one record (case-insensitive, trimmed).
function detectDuplicateActionItems(record: RetroRecord): string[] {
  const seen = new Map<string, number>();
  record.actions.forEach((a) => {
    const key = a.text.trim().toLowerCase();
    if (!key) return;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  });
  return [...seen.entries()].filter(([, count]) => count > 1).map(([text]) => text);
}

// RETRO-12/RETRO-29 — actionable next-sprint suggestions, each gated by a real signal.
function buildNextSprintSuggestions(record: RetroRecord, themes: ThemeMatch[]): string[] {
  const blockerCount = record.blockers.filter((b) => b.trim()).length;
  const topTheme = themes[0];
  return compact([
    record.goalMet === 'no' || record.goalMet === 'partial'
      ? 'Re-plan the sprint goal with a smaller, more achievable scope and confirm capacity before committing.'
      : null,
    blockerCount > 0
      ? `Address the ${blockerCount} recorded blocker${blockerCount > 1 ? 's' : ''} during refinement, before they recur next sprint.`
      : null,
    topTheme
      ? `"${THEME_LABEL[topTheme.category]}" was the most common concern this sprint (${topTheme.count} mention${topTheme.count > 1 ? 's' : ''}: ${topTheme.examples[0]}) — discuss it explicitly at the next planning session.`
      : null,
  ]);
}

// RETRO-29 — concrete, backlog-ready story/task/spike suggestions for next
// sprint. Unlike buildNextSprintSuggestions() (free-text ceremony advice),
// every item here is meant to be pasteable straight into a backlog. Each is
// gated by a real signal — blocker, repeated blocker, top theme, or a missed
// goal — and a repeated blocker produces a spike instead of a duplicate task
// so the same issue isn't suggested twice in two different forms.
function buildSuggestedBacklogItems(
  record: RetroRecord, themes: ThemeMatch[], repeatedBlockers: string[],
): SuggestedBacklogItem[] {
  const repeatedSet = new Set(repeatedBlockers);
  const blockers = record.blockers.filter((b) => b.trim());

  const blockerItems: SuggestedBacklogItem[] = blockers.map((blocker) => {
    const isRepeated = repeatedSet.has(blocker.trim().toLowerCase());
    return isRepeated
      ? {
          type: 'spike', priority: 'high',
          title: `Investigate root cause: "${blocker}"`,
          rationale: 'This blocker has recurred across multiple sprints — a one-off workaround clearly is not resolving it; the next step is root-cause investigation, not another retry.',
        }
      : {
          type: 'task', priority: 'high',
          title: `Resolve blocker: "${blocker}"`,
          rationale: 'Recorded as a blocker this sprint — addressing it removes a known risk to next sprint\'s flow.',
        };
  });

  const topTheme = themes[0];
  const themeItem: SuggestedBacklogItem | null = topTheme
    ? {
        type: 'story', priority: topTheme.count >= 2 ? 'high' : 'medium',
        title: `Improve: ${THEME_LABEL[topTheme.category]}`,
        rationale: `${topTheme.count} mention${topTheme.count > 1 ? 's' : ''} this sprint, e.g. "${topTheme.examples[0]}" — worth a dedicated story rather than letting it recur silently.`,
      }
    : null;

  const goalItem: SuggestedBacklogItem | null = record.goalMet === 'no'
    ? {
        type: 'spike', priority: 'medium',
        title: `Investigate why the sprint goal was not met${record.sprintGoal ? `: "${record.sprintGoal}"` : ''}`,
        rationale: 'The sprint goal was not met — understanding why (scope, capacity, blockers, or estimation) prevents repeating the same miss next sprint.',
      }
    : null;

  return [...blockerItems, themeItem, goalItem].filter((item): item is SuggestedBacklogItem => item !== null);
}

// RETRO-13 — ceremony-linked recommendations.
function buildCeremonyRecommendations(record: RetroRecord, ownershipGaps: string[]): string[] {
  return compact([
    record.blockers.some((b) => b.trim())
      ? 'Daily standup: lead with blockers so they get escalated same-day, not at the next retro.'
      : null,
    ownershipGaps.length > 0
      ? 'Sprint planning: assign an owner and due date to every action item before the sprint starts.'
      : null,
    record.didntGoWell.some((w) => w.trim())
      ? 'Retrospective: revisit this sprint\'s "What Did Not Go Well" items at the start of the next retro to confirm they were actually addressed.'
      : null,
  ]);
}

function deriveConfidence(record: RetroRecord): 'high' | 'medium' | 'low' {
  const fields = [record.sprintGoal, record.goalMet, ...record.wentWell, ...record.didntGoWell, ...record.blockers]
    .filter((v) => v && v.trim()).length;
  if (fields >= 4) return 'high';
  if (fields >= 2) return 'medium';
  return 'low';
}

export function generateRetrospectiveInsight(
  record: RetroRecord,
  source: 'form' | 'upload',
  repeatedBlockers: string[] = [],
): RetrospectiveInsight {
  // Themes are problem signals — only derived from negative text (pain points
  // and blockers). Including "wentWell" here previously caused positive
  // feedback (e.g. "Automated tests caught regressions") to be flagged as a
  // theme to "discuss" or "address," which is actively misleading.
  const concerns = [...record.didntGoWell, ...record.blockers].filter((t) => t.trim());
  const themes = detectThemes(concerns);
  const ownershipGaps = detectOwnershipGaps(record);

  return {
    id: `${record.sprintName || 'retro'}-${record.retroDate || Date.now()}`,
    sprintName: record.sprintName,
    team: record.teamName,
    source,
    themes,
    positives: record.wentWell.filter((t) => t.trim()),
    painPoints: record.didntGoWell.filter((t) => t.trim()),
    blockers: record.blockers.filter((t) => t.trim()),
    actionItems: record.actions.filter((a) => a.text.trim()),
    nextSprintSuggestions: buildNextSprintSuggestions(record, themes),
    suggestedBacklogItems: buildSuggestedBacklogItems(record, themes, repeatedBlockers),
    ceremonyRecommendations: buildCeremonyRecommendations(record, ownershipGaps),
    risksIfIgnored: compact([
      record.blockers.some((b) => b.trim())
        ? 'Unresolved blockers tend to recur and compound delivery delay if not escalated.'
        : null,
      ownershipGaps.length > 0 ? 'Action items without an owner are unlikely to be completed.' : null,
    ]),
    ownershipGaps,
    repeatedBlockers,
    duplicateActionItems: detectDuplicateActionItems(record),
    confidence: deriveConfidence(record),
  };
}

// RETRO-35 — blockers that appear (case-insensitive substring match) in more
// than one record, i.e. across multiple sprints in an uploaded file.
export function detectRepeatedBlockers(records: RetroRecord[]): string[] {
  const counts = new Map<string, number>();
  records.forEach((r) => {
    const unique = new Set(r.blockers.map((b) => b.trim().toLowerCase()).filter(Boolean));
    unique.forEach((b) => counts.set(b, (counts.get(b) ?? 0) + 1));
  });
  return [...counts.entries()].filter(([, count]) => count > 1).map(([text]) => text);
}

export function generateInsightsForRecords(records: RetroRecord[], source: 'form' | 'upload'): RetrospectiveInsight[] {
  const repeated = detectRepeatedBlockers(records);
  return records.map((r) => generateRetrospectiveInsight(r, source, repeated));
}
