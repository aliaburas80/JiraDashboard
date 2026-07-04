// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import fs   from 'fs';
import path from 'path';
import type { OrphanRules } from '@/types/orphanRules';
import { DEFAULT_ORPHAN_RULES } from '@/types/orphanRules';

const RULES_FILE = path.join(process.cwd(), 'data', 'orphan-rules.json');

let _cache: OrphanRules | null = null;

export function readOrphanRules(): OrphanRules {
  if (_cache) return _cache;
  try {
    if (!fs.existsSync(RULES_FILE)) return { ...DEFAULT_ORPHAN_RULES };
    const raw = fs.readFileSync(RULES_FILE, 'utf-8');
    _cache = { ...DEFAULT_ORPHAN_RULES, ...JSON.parse(raw) };
    return _cache!;
  } catch {
    return { ...DEFAULT_ORPHAN_RULES };
  }
}

export function writeOrphanRules(rules: OrphanRules): void {
  _cache = null;
  fs.mkdirSync(path.dirname(RULES_FILE), { recursive: true });
  fs.writeFileSync(RULES_FILE, JSON.stringify(rules, null, 2), 'utf-8');
}

export function invalidateOrphanCache(): void { _cache = null; }

// Core helper: is this issue an orphan according to the current rules?
export function isOrphanByRules(issue: Record<string, unknown>, rules: OrphanRules): boolean {
  const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

  // Check exempt issue types
  const issueType = norm(issue['Issue Type'] ?? issue['type'] ?? '');
  if (rules.exemptIssueTypes.map(t => t.toLowerCase()).includes(issueType)) return false;

  // Sub-task special handling
  if (!rules.flagSubTasksWithoutParent) {
    if (['sub-task', 'subtask'].includes(issueType)) return false;
  }

  // Check parent link fields — item is an orphan if NONE have a value
  const hasParentLink = rules.parentLinkFields.some(field => {
    const val = issue[field];
    return val !== null && val !== undefined && String(val).trim() !== '';
  });

  return !hasParentLink;
}
