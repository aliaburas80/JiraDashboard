// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import fs   from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import type { IssueTypeHierarchyConfig } from '@/types/issueTypeHierarchy';
import { DEFAULT_ISSUE_TYPE_HIERARCHY } from '@/types/issueTypeHierarchy';
import { readScopedSetting, writeScopedSetting, type SettingsScopeInput } from './scopedAppSettings.service';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'issue-type-hierarchy.json');
const HIERARCHY_KEY = 'issue-type-hierarchy';

let _cache: IssueTypeHierarchyConfig | null = null;
const _userCache = new Map<string, IssueTypeHierarchyConfig>();

function normalizeIssueTypeHierarchy(config: unknown): IssueTypeHierarchyConfig {
  const parsed = config as Partial<IssueTypeHierarchyConfig> | null;
  if (!Array.isArray(parsed?.types) || parsed.types.length === 0) {
    return { ...DEFAULT_ISSUE_TYPE_HIERARCHY };
  }
  return { ...DEFAULT_ISSUE_TYPE_HIERARCHY, ...parsed };
}

export function readIssueTypeHierarchy(): IssueTypeHierarchyConfig {
  if (_cache) return _cache;
  try {
    if (!fs.existsSync(CONFIG_FILE)) return { ...DEFAULT_ISSUE_TYPE_HIERARCHY };
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    _cache = normalizeIssueTypeHierarchy(parsed);
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

export async function readIssueTypeHierarchyForUser(userId: string): Promise<IssueTypeHierarchyConfig> {
  if (_userCache.has(userId)) return _userCache.get(userId)!;
  try {
    const saved = await prisma.userIssueTypeHierarchy.findUnique({ where: { userId } });
    if (saved?.configJson) {
      const config = normalizeIssueTypeHierarchy(JSON.parse(saved.configJson));
      _userCache.set(userId, config);
      return config;
    }
  } catch {
    // Fall through to the legacy file/default config if the DB is unavailable.
  }

  const fallback = await readScopedSetting(HIERARCHY_KEY, userId, readIssueTypeHierarchy);
  _userCache.set(userId, fallback);
  return fallback;
}

export async function writeIssueTypeHierarchyForUser(
  userId: string,
  config: IssueTypeHierarchyConfig,
  scope?: SettingsScopeInput & { updatedBy?: string },
): Promise<void> {
  const normalized = normalizeIssueTypeHierarchy(config);
  _userCache.delete(userId);
  if (scope?.isSuperAdmin) {
    await writeScopedSetting(HIERARCHY_KEY, normalized, scope);
    _userCache.clear();
    return;
  }
  await prisma.userIssueTypeHierarchy.upsert({
    where: { userId },
    create: { userId, configJson: JSON.stringify(normalized) },
    update: { configJson: JSON.stringify(normalized) },
  });
  _userCache.set(userId, normalized);
}

export function invalidateIssueTypeHierarchyCache(userId?: string): void {
  _cache = null;
  if (userId) _userCache.delete(userId);
  else _userCache.clear();
}
