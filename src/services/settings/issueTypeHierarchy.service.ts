// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
import fs   from 'fs';
import path from 'path';
import type { IssueTypeHierarchyConfig } from '@/types/issueTypeHierarchy';
import { DEFAULT_ISSUE_TYPE_HIERARCHY } from '@/types/issueTypeHierarchy';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'issue-type-hierarchy.json');

let _cache: IssueTypeHierarchyConfig | null = null;

export function readIssueTypeHierarchy(): IssueTypeHierarchyConfig {
  if (_cache) return _cache;
  try {
    if (!fs.existsSync(CONFIG_FILE)) return { ...DEFAULT_ISSUE_TYPE_HIERARCHY };
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.types) || parsed.types.length === 0) {
      return { ...DEFAULT_ISSUE_TYPE_HIERARCHY };
    }
    _cache = { ...DEFAULT_ISSUE_TYPE_HIERARCHY, ...parsed };
    return _cache!;
  } catch {
    return { ...DEFAULT_ISSUE_TYPE_HIERARCHY };
  }
}

export function writeIssueTypeHierarchy(config: IssueTypeHierarchyConfig): void {
  _cache = null;
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function invalidateIssueTypeHierarchyCache(): void { _cache = null; }
