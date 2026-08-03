// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// P0B-06: IndexedDB-backed durable event queue. Pure storage adapter — no
// network, no timers (see eventFlush.ts for orchestration). Kept separate so
// each module has one reason to change (CLAUDE.md §5.1).

import type { AnalyticsEvent } from './track';

const DB_NAME    = 'dc-analytics-queue';
const DB_VERSION = 1;
const STORE_NAME = 'events';

function isSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'event_id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx      = db.transaction(STORE_NAME, mode);
      const store    = tx.objectStore(STORE_NAME);
      const request  = run(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror   = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function enqueueEvent(event: AnalyticsEvent): Promise<void> {
  if (!isSupported()) return;
  await withStore('readwrite', store => store.put(event));
}

export async function getQueuedEvents(limit: number): Promise<AnalyticsEvent[]> {
  if (!isSupported()) return [];
  const all = await withStore<AnalyticsEvent[]>('readonly', store => store.getAll());
  // Oldest-first — matches occurred_at insertion order for typical use;
  // callers that need strict ordering guarantees should sort explicitly.
  return all.slice(0, limit);
}

export async function deleteEvents(eventIds: string[]): Promise<void> {
  if (!isSupported() || eventIds.length === 0) return;
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      eventIds.forEach(id => store.delete(id));
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function countQueuedEvents(): Promise<number> {
  if (!isSupported()) return 0;
  return withStore<number>('readonly', store => store.count());
}

/** Removes events older than maxAgeMs — a stale unsent analytics event is no longer useful. */
export async function pruneExpiredEvents(maxAgeMs: number): Promise<void> {
  const all = await getQueuedEvents(Number.MAX_SAFE_INTEGER);
  const cutoff = Date.now() - maxAgeMs;
  const expired = all.filter(e => new Date(e.occurred_at).getTime() < cutoff).map(e => e.event_id);
  await deleteEvents(expired);
}

/** Drops oldest-first when the queue exceeds max — analytics is best-effort, never critical data. */
export async function enforceMaxQueueSize(max: number): Promise<void> {
  const all = await getQueuedEvents(Number.MAX_SAFE_INTEGER);
  if (all.length <= max) return;
  const sorted = [...all].sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
  const overflow = sorted.slice(0, sorted.length - max).map(e => e.event_id);
  await deleteEvents(overflow);
}
