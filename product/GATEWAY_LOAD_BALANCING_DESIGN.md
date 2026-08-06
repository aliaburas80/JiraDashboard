# Backend Integration Gateway — Load-Balancer-Aware Expansion Design

**Status:** Design only — not approved for implementation (`ARCH-03`)
**Depends on:** `GW-01`–`GW-25` (Backend Integration Gateway Foundation, implemented 2026-06-08)
**Author note:** This document assesses and designs; it does not implement. No code in this repo
changes as a result of it.

---

## 1. What already exists

The gateway foundation (`src/server/gateway/`) already anticipates this work:

- `GatewayRoutingStrategy` (`types.ts`) is already typed with `'single' | 'round_robin' |
  'weighted_round_robin' | 'failover' | 'least_error_rate'`, with a comment: *"typed for future
  use — not yet implemented."*
- `resolveRoutingTarget<T>(strategy, candidates: T[])` (`externalGateway.ts`) is the intended
  extension point — a switch statement that today only handles `'single'` (returns the first
  candidate) and falls through to the same behavior for everything else.
- `GW-21` already added `requestId`/`correlationId`/`idempotencyKey` to
  `GatewayRequestOptions`/`GatewayResult` specifically to make the gateway safe to retry/route
  across multiple targets — its own note calls this "load-balancer readiness."

**What does not exist yet, and is the actual gap this design closes:** every provider resolves to
exactly one `baseUrl`. `ProviderConfig`/`ProviderBlueprint` (`providerRegistry.ts`) have no concept
of multiple endpoints for the same provider. `callExternal()` builds `candidateUrls` as a
single-element array (`[buildRequestUrl(config.baseUrl, ...)]`) — there is nothing to load-balance
across today, for any provider, regardless of strategy. The routing-strategy switch is not the
missing piece; the missing piece is upstream of it.

## 2. Design

### 2.1 Multi-endpoint provider config

Extend `ProviderBlueprint`/`ProviderConfig` (additive, backward-compatible) so a provider can
declare more than one endpoint:

```ts
export interface ProviderEndpoint {
  baseUrl: string;
  weight?: number;        // for weighted_round_robin — defaults to 1
  label?: string;         // for logs/audit — e.g. "us-east", "eu-west"
}

export interface ProviderConfig {
  // ...existing fields unchanged...
  baseUrl?: string;           // kept for backward compatibility — single-endpoint providers
  endpoints?: ProviderEndpoint[]; // new — when present, takes precedence over baseUrl
}
```

`data/gateway-providers.json` gains an optional `endpoints` array per provider, following the same
"zero code change, edit the JSON file" convention `providerRegistry.ts`'s header comment already
establishes for every other field. A provider with no `endpoints` array behaves exactly as today
(single `baseUrl`, `'single'` strategy, no behavior change) — this is why the change is additive
and not a breaking one for the 9 already-typed provider types, none of which have live traffic yet
(`GatewayProviderType`'s own header comment: "Not a live integration: zero providers are registered
by default").

### 2.2 Per-strategy selection logic

All four strategies plug into the existing `resolveRoutingTarget<T>()` switch. State that must
persist *between* calls (round-robin position, error counts) cannot live in `resolveRoutingTarget`
itself — it's a pure function today and should stay one for testability. Selection state moves to a
new sibling module, `src/server/gateway/routingState.ts`, keyed by provider type:

- **`round_robin`** — a module-level `Map<GatewayProviderType, number>` cursor, incremented (mod
  candidate count) on every call. No persistence needed across process restarts; an uneven
  distribution for the first few requests after a restart is an acceptable, standard trade-off.
- **`weighted_round_robin`** — the same cursor concept, but walking a precomputed cumulative-weight
  array (built once per `endpoints` config, cached) instead of a flat index — standard smooth-WRR,
  avoids bursty clustering that naive weighted-random can produce.
- **`failover`** — no rotation at all: always try `endpoints[0]` first. `callExternal()`'s existing
  retry loop (`retryPolicy.ts`) already re-attempts on `network`/`timeout`/`retryable_http` — this
  strategy's only real change is that a *new* attempt after exhausting retries against endpoint 0
  moves to endpoint 1, not straight to `GatewayResult.ok: false`. This needs `callExternal()`'s
  attempt loop itself to become endpoint-aware, not just `resolveRoutingTarget()` — the one place
  this design touches gateway call flow beyond the routing function.
- **`least_error_rate`** — a rolling per-endpoint counter (last N attempts, or a time-decayed rate)
  in the same `routingState.ts` module, updated from `gatewayLogger.ts`'s existing per-attempt log
  point (which already records `errorCategory`/`status` per call — the data this strategy needs is
  already being captured, just not aggregated). Selection picks the lowest current rate, ties broken
  by round-robin to avoid pinning all traffic to one endpoint the instant its rate hits zero.

### 2.3 Multi-instance deployment caveat

All in-memory state above is correct for a single Node process. `FUT-MULTI-01` ("Advanced
multi-node deployment," currently 🚫 Blocked) would need this state moved to a shared store (Redis,
or Postgres via a lightweight table) for `round_robin`/`weighted_round_robin` fairness and
`least_error_rate` accuracy across instances — explicitly out of scope here and blocked on that
separate, currently-blocked ticket. Until then, per-process state is the correct, simplest design —
this repo's current deployment (`render.yaml`, `product/DEPLOYMENT_GUIDE.md`) is a single web
service, so this caveat has no present-day impact.

### 2.4 What this design deliberately does not add

- No new provider types, no new credentials, no new allowlist entries — this is purely about
  selecting among endpoints *within* an already-allowlisted provider.
- No admin UI for configuring endpoints/weights — `data/gateway-providers.json` remains the
  configuration surface, matching every other gateway-provider field today. An admin UI would be a
  separate, later ticket once a real multi-endpoint provider exists to justify one (CLAUDE.md §5.5
  — no speculative UI for a capability nothing uses yet).
- No change to `endpointPolicy.ts`'s SSRF/allowlist validation — every endpoint in the new
  `endpoints[]` array is validated exactly the same way a single `baseUrl` is today, per-candidate,
  before it can ever be selected.

## 3. Testing strategy (for whenever this is approved and implemented)

- Unit tests for each strategy's selection function in isolation (deterministic given a fixed
  candidate list + call count), following `gateway.test.ts`'s existing `TC-GW-*` numbering
  convention.
- A `failover`-specific test asserting endpoint 1 is only attempted after endpoint 0's retry budget
  is exhausted, not on the first failure (retries and failover are distinct concepts and must not be
  conflated).
- A `least_error_rate` test seeding known error histories and asserting the lower-error endpoint is
  preferred, plus a tie-breaking test.
- No live-provider test — same constraint every existing gateway test already works within
  (`GW-23`'s 23 tests are 100% mocked at the `fetch` boundary; zero real external calls).

## 4. Recommendation

Do not implement until a real provider needs more than one endpoint. Today every registered
provider type (Jira, S3, Azure Blob, GCS, email, Slack, Teams, push, custom) is a single external
service with a single base URL — none of the four strategies have a concrete use case yet. This
document exists so the *shape* of the eventual work is known and the existing type contract
(`GatewayRoutingStrategy`, `resolveRoutingTarget`) isn't accidentally designed against later.
