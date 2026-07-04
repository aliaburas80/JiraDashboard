// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Retrospective domain types — RETRO-37. Shared by the in-app retro form
// (single record) and the uploaded retro file flow (one or many records,
// one per row/sprint).

export type GoalOutcome = 'yes' | 'partial' | 'no' | '';
export type ActionPriority = 'high' | 'medium' | 'low';

export interface RetroActionItem {
  text:     string;
  owner:    string;
  dueDate:  string;
  priority: ActionPriority;
}

// One retrospective — one row in an uploaded file, or the single in-app form.
export interface RetroRecord {
  sprintName:  string;
  teamName:    string;
  retroDate:   string;
  goalMet:     GoalOutcome;
  sprintGoal:  string;
  wentWell:    string[];
  didntGoWell: string[];
  blockers:    string[];
  actions:     RetroActionItem[];
}

// RETRO-06/RETRO-07 — a row skipped or auto-corrected during file import.
export interface RetroDataCorrection {
  field:         string;
  originalValue: unknown;
  reason:        string;
  severity:      'info' | 'warning' | 'error';
}

export type ThemeCategory =
  | 'process' | 'communication' | 'requirements'
  | 'qa-release' | 'dependency' | 'technical' | 'planning';

export interface ThemeMatch {
  category: ThemeCategory;
  count:    number;
  examples: string[];
}

// RETRO-29 — a concrete, backlog-ready story/task/spike suggestion for next
// sprint, distinct from the free-text ceremony/process advice in
// nextSprintSuggestions. Each one must be traceable to a real signal from
// this retrospective (a blocker, a repeated blocker, a theme, or a missed
// goal) — never a generic placeholder item.
export type BacklogItemType = 'story' | 'task' | 'spike';

export interface SuggestedBacklogItem {
  type:        BacklogItemType;
  title:       string;
  // Standard story/task/spike write-up — "As a ... I want ... so that ..."
  // for a story, "Task: ... Acceptance criteria: ..." for a task, "Spike:
  // ... Goal: ..." for a spike. This is the text meant to be pasted
  // directly into a backlog tool, not a sentence describing the suggestion.
  description: string;
  // The real retro signal (a quoted blocker/observation, a mention count)
  // that triggered this suggestion — kept separate from description so the
  // backlog item itself reads as a normal backlog item, not retro commentary.
  evidence:    string;
  priority:    ActionPriority;
}

// RETRO-37 — aggregate insight produced from one or more RetroRecords.
export interface RetrospectiveInsight {
  id:                       string;
  sprintName:               string;
  team:                     string;
  source:                   'form' | 'upload';
  themes:                   ThemeMatch[];
  positives:                string[];
  painPoints:               string[];
  blockers:                 string[];
  actionItems:              RetroActionItem[];
  nextSprintSuggestions:    string[];
  suggestedBacklogItems:    SuggestedBacklogItem[];
  ceremonyRecommendations:  string[];
  risksIfIgnored:           string[];
  ownershipGaps:            string[];
  repeatedBlockers:         string[];
  duplicateActionItems:     string[];
  confidence:               'high' | 'medium' | 'low';
}
