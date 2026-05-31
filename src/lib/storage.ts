const STORAGE_KEY = "dc_metrics_v2";

export function saveMetrics(metrics: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    // Silently handle quota errors or serialization failures
  }
}

export function loadMetrics(): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearMetrics(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function hasMetrics(): boolean {
  if (typeof window === "undefined") return false;
  return STORAGE_KEY in localStorage;
}
