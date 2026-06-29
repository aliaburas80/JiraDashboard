// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.

export function normalizeAppUrl(value: string | undefined, fallback = 'http://localhost:3000'): string {
  const candidate = value?.trim();
  if (!candidate) return fallback;
  if (/^https?:\/\//i.test(candidate)) return candidate.replace(/\/+$/, '');
  return `https://${candidate.replace(/\/+$/, '')}`;
}
