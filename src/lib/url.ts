// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.

const PUBLIC_HOST_ALIASES: Readonly<Record<string, string>> = {
  'www.deliveryclarity.app': 'deliveryclarity.app',
};

export function normalizeAppUrl(value: string | undefined, fallback = 'http://localhost:3000'): string {
  const candidate = value?.trim();
  if (!candidate) return fallback;
  if (/^https?:\/\//i.test(candidate)) return candidate.replace(/\/+$/, '');
  return `https://${candidate.replace(/\/+$/, '')}`;
}

function canonicalizePublicOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    const canonicalHost = PUBLIC_HOST_ALIASES[url.hostname.toLowerCase()];
    if (!canonicalHost) return url.origin;

    url.hostname = canonicalHost;
    url.protocol = 'https:';
    url.port = '';
    return url.origin;
  } catch {
    return origin;
  }
}

// Derives the public-facing origin (scheme + host) from the request that triggered it,
// rather than trusting a configured APP_URL/NEXT_PUBLIC_APP_URL env var that can go stale
// or simply be unset in a given environment (e.g. Render) and silently fall back to
// localhost. Honours X-Forwarded-Proto/Host set by reverse proxies (Render, Hostinger,
// etc.) so a request that actually arrived over HTTPS never gets downgraded to an
// http:// link. Known public aliases are canonicalized so transactional emails always
// point at the production hostname that is actually served.
export function resolveRequestOrigin(req: { headers: Headers; nextUrl: URL }): string {
  const forwardedProto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost  = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host  = forwardedHost || req.headers.get('host') || req.nextUrl.host;
  const proto = forwardedProto || req.nextUrl.protocol.replace(':', '');
  return canonicalizePublicOrigin(`${proto}://${host}`);
}
