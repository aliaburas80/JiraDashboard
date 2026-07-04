// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.

export function normalizeAppUrl(value: string | undefined, fallback = 'http://localhost:3000'): string {
  const candidate = value?.trim();
  if (!candidate) return fallback;
  if (/^https?:\/\//i.test(candidate)) return candidate.replace(/\/+$/, '');
  return `https://${candidate.replace(/\/+$/, '')}`;
}

// Derives the public-facing origin (scheme + host) from the request that triggered it,
// rather than trusting a configured APP_URL/NEXT_PUBLIC_APP_URL env var that can go stale
// or simply be unset in a given environment (e.g. Render) and silently fall back to
// localhost. Honours X-Forwarded-Proto/Host set by reverse proxies (Render, etc.) so a
// request that actually arrived over HTTPS never gets downgraded to an http:// link.
export function resolveRequestOrigin(req: { headers: Headers; nextUrl: URL }): string {
  const forwardedProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost  = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host  = forwardedHost || req.headers.get('host') || req.nextUrl.host;
  const proto = forwardedProto || req.nextUrl.protocol.replace(':', '');
  return `${proto}://${host}`;
}
