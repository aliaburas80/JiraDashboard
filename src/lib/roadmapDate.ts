// Cross-browser roadmap date parsing.
// Jira CSV exports commonly use DD/Mon/YYYY (for example 08/Feb/2025),
// which is not an ECMAScript-required Date.parse format and fails in WebKit.
const MONTH_INDEX: Record<string, number> = {
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

export function parseRoadmapDateMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const input = value.trim();
  if (!input) return null;

  // Parse Jira's locale-independent export shape ourselves rather than
  // relying on browser-specific Date.parse behaviour. An optional time suffix
  // is intentionally ignored because roadmap bars operate at day granularity.
  const jiraDate = /^(\d{1,2})\/([A-Za-z]{3})\/(\d{4})(?:\s+.*)?$/.exec(input);
  if (jiraDate) {
    const day = Number(jiraDate[1]);
    const month = MONTH_INDEX[jiraDate[2].toLowerCase()];
    const year = Number(jiraDate[3]);
    if (month === undefined || day < 1 || day > 31) return null;

    const timestamp = Date.UTC(year, month, day);
    const parsed = new Date(timestamp);
    // Date.UTC normalises impossible dates (for example 31/Feb). Reject those.
    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month ||
      parsed.getUTCDate() !== day
    ) {
      return null;
    }
    return timestamp;
  }

  // ISO-8601 and other standards-supported inputs remain accepted.
  const timestamp = Date.parse(input);
  return Number.isNaN(timestamp) ? null : timestamp;
}
