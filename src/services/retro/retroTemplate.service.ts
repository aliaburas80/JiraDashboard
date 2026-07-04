// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Retrospective .xlsx template — RETRO-17, RETRO-19 to RETRO-22. Two sheets:
// "Retrospective" (header row + example rows) and "Instructions" (how to
// fill it in, required fields, examples, upload outcome, privacy note).
// Client-side generation — same pattern as exportExplorerToExcel().

import * as XLSX from 'xlsx';

const HEADERS = [
  'Sprint Name', 'Team Name', 'Retro Date', 'Sprint Goal Met (yes/no/partial)', 'Sprint Goal',
  'What Went Well', 'What Did Not Go Well', 'Blocker/Impediment',
  'Action Item', 'Action Owner', 'Action Due Date', 'Action Priority (high/medium/low)',
];

// RETRO-22 — example rows covering carryover/large stories, blockers found
// late, and scope changed mid-sprint, matching the existing CSV template's
// "carry-forward Sprint Name on blank rows" shape.
const EXAMPLE_ROWS: (string | number)[][] = [
  ['Sprint 42', 'Backend Team', '2026-06-10', 'partial', 'Ship login redesign', 'Good team collaboration', 'Sprint planning was too long', 'Dependency on infra team blocked 3 stories', 'Schedule shorter planning sessions', 'Scrum Master', '2026-06-17', 'high'],
  ['', '', '', '', '', 'Automated tests caught regressions', 'Story points were underestimated', '', 'Add complexity review to refinement', 'Tech Lead', '2026-06-24', 'medium'],
  ['Sprint 43', 'Backend Team', '2026-06-24', 'no', 'Migrate auth service', '', 'A large story carried over from last sprint and was not re-estimated', 'A blocker on the payments dependency was only found in the last 2 days of the sprint', 'Split the auth migration into smaller stories before next planning', 'Tech Lead', '2026-07-01', 'high'],
  ['', '', '', '', '', '', 'Scope changed mid-sprint when a P0 bug was added without removing other work', '', 'Agree on a mid-sprint scope-change policy with the Product Owner', 'Product Owner', '2026-07-01', 'medium'],
];

function makeDataSheet(): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...EXAMPLE_ROWS]);
  ws['!cols'] = HEADERS.map((h) => ({ wch: Math.max(18, h.length) }));
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: HEADERS.length - 1 } }) };
  return ws;
}

function makeInstructionsSheet(): XLSX.WorkSheet {
  const rows: string[][] = [
    ['Retrospective Template — Instructions'],
    [''],
    ['How to fill this in'],
    ['Each row is one observation, blocker, or action item for a sprint. To add multiple observations for the same sprint, leave "Sprint Name" blank on the following rows — it carries forward from the row above (see the example rows on the Retrospective sheet).'],
    [''],
    ['Required fields'],
    ['"Sprint Name" is required on the first row of every sprint. Every row needs at least one of: What Went Well, What Did Not Go Well, Blocker/Impediment, or Action Item — empty rows are skipped on import.'],
    [''],
    ['Recommended fields'],
    ['"Action Owner" and "Action Due Date" are strongly recommended for every Action Item — rows missing them are flagged as ownership gaps after import.'],
    [''],
    ['Examples'],
    ['See the 4 example rows already on the Retrospective sheet — they show a carryover/large-story scenario, a late-discovered blocker, and a mid-sprint scope change.'],
    [''],
    ['What happens after upload'],
    ['Delivery Clarity groups rows back into one retrospective per sprint, detects common themes (process, communication, requirements, QA/release, dependency, technical, planning), flags repeated blockers across sprints, flags missing owners/due dates, and generates next-sprint suggestions. You will see a preview before anything is imported.'],
    [''],
    ['Privacy note'],
    ['Retrospective content you upload is processed in memory to generate the preview and insights shown to you. Avoid including names of customers, personal data, or confidential information you would not want visible to your team.'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 100 }];
  return ws;
}

export function downloadRetroExcelTemplate(): void {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, makeDataSheet(), 'Retrospective');
  XLSX.utils.book_append_sheet(wb, makeInstructionsSheet(), 'Instructions');
  XLSX.writeFile(wb, 'Retrospective_Template.xlsx');
}
