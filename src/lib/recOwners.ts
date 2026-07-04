// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Action-owner assignment for Smart Recommendations — 9.34
// Persists a user-assigned owner name per recommendation key to localStorage.

const STORAGE_KEY = 'dc_rec_owners';

export interface RecOwnerMap {
  [recKey: string]: string;
}

function load(): RecOwnerMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function save(map: RecOwnerMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export function getRecOwner(key: string): string {
  return load()[key] ?? '';
}

export function setRecOwner(key: string, owner: string): void {
  const map = load();
  if (owner.trim()) {
    map[key] = owner.trim();
  } else {
    delete map[key];
  }
  save(map);
}

export function clearRecOwner(key: string): void {
  const map = load();
  delete map[key];
  save(map);
}

export function getAllRecOwners(): RecOwnerMap {
  return load();
}

export function clearAllRecOwners(): void {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
