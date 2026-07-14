# Delivery Clarity — Role-Based Review (Checkpoint 4)

**Status: COMPLETE**, built entirely from code-level role-gating logic (`middleware.ts`, `src/lib/roles.ts`, `src/components/dc-shell/navigation.ts`, `src/components/dashboard/DashboardNavSidebar.tsx`) since no rendered, logged-in-as-each-role walkthrough is possible in this environment (no browser tool, no seeded non-admin test accounts — see `00-audit-control.md` §3–4). Every claim below is `Evidence type: Code inspection`, explicitly labeled as inference about what each role *would* see, not an observation of what was rendered.

**The app defines 6 roles** (`src/lib/roles.ts` `AppRole`): `admin`, `scrum_master`, `product_owner`, `manager`, `c_level`, `user`.

---

## A. How role-gating actually works (two independent layers)

1. **Top-level routes** (everything outside `/dashboard/*` and `/admin/*`): nav visibility (`getNavGroupsForRole`) and request-level reachability (`middleware.ts`) both call the **same** `canAccessRoute()` function (`src/lib/roles.ts:119-123`). Because both consult one source of truth, top-level nav visibility and reachability cannot structurally diverge for these routes — a route hidden from a role's nav is also blocked by middleware for that role, and vice versa. `/admin/*` additionally has a second, independent middleware check (`ADMIN_ONLY`, `middleware.ts:19,43-45`) as defense-in-depth.
2. **`/dashboard/*` sub-routes**: gated for nav purposes only by a **separate, independent** registry — `DashboardNavSidebar.tsx`'s `ROUTE_ACCESS` (lines 11-22). Middleware only ever validates the generic `/dashboard` prefix, which is granted to **every** role (`ANALYTICS_ROUTES`, `roles.ts:69`, present in all 6 role branches). No individual `/dashboard/*` page adds its own role check (confirmed by grep — every redirect found in these pages fires on missing metrics data, not role). **This means `ROUTE_ACCESS`'s per-role differentiation is nav-visibility-only, not an enforced access boundary** — this is the single most consequential structural finding of this review, detailed in §C.

---

## B. Per-role summary

### `admin`
Full access to everything: all top-level routes, all 9 live `/dashboard/*` sub-pages, all `/admin/*` pages (independently double-enforced by `ADMIN_ONLY`), `/developer` (the only role that can reach it). No gaps found — this role's access model is coherent and consistently the broadest, as expected.

### `scrum_master`
Full Delivery-group access (`/flow-health`, `/sprint-kanban`, `/explore`) but **not** `/delivery-mix` or `/customer` (both excluded from this role's hand-written route list in `roles.ts`). In `/dashboard/*` nav: sees Priority Attention, Ownership, Flow Health Table — does **not** see Labels & Types or Epic Readiness in the sidebar, but (per §C) can still load both by direct URL with full content, since nothing server-side actually restricts them.

### `product_owner`
Sees `/delivery-mix`, `/customer`, `/explore` but **not** `/flow-health` or `/sprint-kanban`. In `/dashboard/*` nav: sees Labels & Types, Epic Readiness — does **not** see Priority Attention, Ownership, or Flow Health Table in the sidebar, all three of which are (per §C) still fully loadable by direct URL.

### `manager`
The broadest non-admin profile among the four operational roles — has both `DELIVERY_ROUTES` and most of `DATA_ROUTES` (`/work-explorer`, `/snapshots`, `/backend`, but not `/data-quality`/`/column-mapping`, which `manager` does get per the matrix — confirmed present at `roles.ts:99`). Sees all 9 `/dashboard/*` sidebar items except Epic Readiness and Labels & Types (mirrors `scrum_master`'s dashboard-sidebar profile, plus `/data-quality` which `scrum_master` lacks at the top level).

### `c_level`
The most restricted non-admin role, consistent with an executive/read-mostly persona:
- Top-level Delivery group: only 3 of 6 items visible (`/release-readiness`, `/delivery-mix`, `/customer`) — `/flow-health`, `/sprint-kanban`, `/explore` are hidden **and** blocked (consistent, since this route class uses the shared `canAccessRoute()` gate).
- **The entire "Data" nav group (5 items) disappears** for this role — not individually hidden, the whole group is dropped because `getNavGroupsForRole` removes empty groups (`navigation.ts:123-124,136-137`). This is a legitimate, intentional design (an executive persona plausibly doesn't need `/work-explorer`/`/column-mapping`/`/backend`), but it is worth flagging as a group-disappearance UX pattern for `07-information-architecture.md` to weigh.
- `/dashboard/*` sidebar: only 4 of 9 items (Key Metrics, Data Quality, Trends, Team Role View) — 5 items hidden, all still directly reachable by URL per §C.
- **`c_level` is the one role genuinely blocked from `/readiness`** at the middleware layer (omitted from `DELIVERY_ROUTES`'s hand-listing in the `c_level` branch, `roles.ts:102-108`) — every other operational role can reach it. See `04-remove-merge-keep.md` R-01 for the removal/merge recommendation this feeds into.
- Main nav is never fully empty for this role (Analytics + Planning groups always render), so this is not a "nothing to click" gap.

### `user`
Described in-code as a "standard contributor" (`roles.ts:20`) but has **broader route access than `scrum_master`, `product_owner`, `manager`, or `c_level`** in one specific dimension: full `DATA_ROUTES` (`/work-explorer`, `/data-quality`, `/column-mapping`, `/snapshots`, `/backend`) and all 9 `/dashboard/*` sidebar items with no exclusions. This is a genuine role-model oddity worth flagging: a role named/described as the most generic contributor ends up with the widest `/dashboard/*` sidebar and Data-group access of any non-admin role, wider than roles with more specific, senior-sounding titles (`manager`, `c_level`).

---

## C. The dominant finding: `/dashboard/*` role differentiation is cosmetic, not enforced

For every one of the 9 gated `/dashboard/*` sidebar items, across 5 of the 6 roles (every role except `user`, which has no exclusions to test), the pattern is identical: **the sidebar hides the link, but typing the URL directly loads the full page with no redirect or content restriction**, because middleware only validates the generic `/dashboard` prefix and no individual page adds a role check.

Concretely:
- `product_owner` cannot see "Priority Attention" or "Ownership & Capacity" in the sidebar, but `/dashboard/priority-attention` and `/dashboard/ownership` both load normally if visited directly.
- `scrum_master`/`manager` cannot see "Labels & Types" or "Epic Readiness," but both load normally.
- `c_level` cannot see 5 of 9 items, all of which load normally.

```text
Finding: DashboardNavSidebar's per-role ROUTE_ACCESS registry has no corresponding enforcement in middleware.ts or src/lib/roles.ts — it only controls whether a link appears in the sidebar, not whether the page itself is reachable or renders differently.
Evidence: src/components/dashboard/DashboardNavSidebar.tsx:11-22 (the registry); middleware.ts (only checks the generic '/dashboard' prefix, present for every role in ANALYTICS_ROUTES, roles.ts:69); grep confirms no /dashboard/*/page.tsx file contains a role-based redirect (all redirects found are for missing-data states only).
Why it matters: This is not a security vulnerability (all 6 roles are already authenticated, logged-in users, and the data shown is not classified by role — the same DashboardMetrics object powers every page) — but it is a broken product promise. The sidebar implies these views were deliberately scoped per role (e.g. "Product Owner doesn't need Priority Attention"), and a user who discovers they can reach a "hidden" page by URL, bookmark, or a shared link from a colleague with different sidebar access gets the full page with no indication anything was supposed to be restricted.
Affected users: product_owner, scrum_master, manager, c_level (5 of 9 gated items each, on average) — anyone who navigates by URL/bookmark/shared link rather than exclusively through the sidebar.
Severity: P2 (product-consistency risk, not a security finding, since no data is actually protected)
Confidence: High confidence (code-confirmed: registry exists, enforcement does not)
```

**This does not require a fix framed as "add missing security"** — no sensitive data crosses a role boundary here, since every role already sees the same uploaded dataset elsewhere in the app. The fix, if pursued, is a product decision: either enforce `ROUTE_ACCESS` server-side to match the sidebar's implied promise, or treat the sidebar filtering as pure information-density/relevance curation (in which case its current behavior is arguably fine, and the finding is really about intent not being documented anywhere).

**Resolved (2026-07-14):** Product decision made — the sidebar filtering is intentional relevance curation, not an access boundary; no server-side enforcement will be added. Documented directly in the code (`src/components/dashboard/DashboardNavSidebar.tsx`, comment above `ROUTE_ACCESS`) so a future engineer doesn't mistake the registry for a security control. This closes the "intent not being documented anywhere" half of this finding; the underlying behavior is unchanged.

---

## D. Secondary finding: `/members`' three-layer, inconsistent gate

```text
Finding: /members uses three different gating mechanisms that don't agree with each other: middleware/roles.ts grant it to every role (via COMMON_ROUTES), the nav registry hides it from everyone except isSuperAdmin (a flag separate from AppRole, documented in-code as "EP-025"), and the page itself independently redirects non-isSuperAdmin sessions (with the /api/members endpoint also 403ing them).
Evidence: src/lib/roles.ts:64 (COMMON_ROUTES includes /members, spread into all 6 role branches); src/components/dc-shell/navigation.ts:126-131 (isSuperAdmin special-case, bypassing canAccessRoute); app/members/page.tsx:38-41 (client-side redirect for non-isSuperAdmin); implied API-level 403.
Why it matters: not currently exploitable — the page-level and API-level checks close the gap the other two layers leave open — but it means /members is protected by the least consistent, most redundant layering of any route in the app: a bug in the nav-registry or page-level check (the two effectively-load-bearing ones) would not be caught by middleware, unlike every /admin/* route, which has real middleware-level defense-in-depth.
Affected users: none currently exposed (page + API layers hold); a latent maintenance risk if either of those two layers is ever refactored without noticing the middleware layer doesn't actually help here.
Severity: P3
Confidence: High confidence
```

---

## E. Positive findings (stated plainly)

- Top-level route gating (§A point 1) is architecturally sound — one function, one source of truth, no divergence possible by construction.
- `/admin/*` has genuine defense-in-depth: an independent `ADMIN_ONLY` middleware check backs up every individual page's own client-side `role !== 'admin'` check (except `/admin/theme`, already flagged in `01-app-inventory.md` as relying on middleware alone — re-confirmed here, not a new finding).
- No role produces a completely empty main navigation (§B, `c_level` check) — every role has at least Analytics and Planning groups available.
- Role names map to a coherent, documented mental model in `src/lib/roles.ts`'s own comments (e.g. `ANALYTICS_ROUTES` explicitly commented as "visible to every role so the nav is consistent everywhere") — the inconsistencies found here are gaps in *implementation follow-through* (the `/dashboard/*` sidebar registry, the `c_level`/`/readiness` omission, the `user` role's unexpectedly broad access), not evidence of an incoherent design intent.

---

## Summary

| Finding | Severity | Confidence |
|---|---|---|
| `/dashboard/*` sidebar role-gating is nav-only, not enforced (§C) | P2 | High |
| `/members` triple-layered, inconsistent gating (§D) | P3 | High |
| `/readiness` reachable by 5/6 roles despite zero nav visibility, `c_level` alone blocked (§B) | Feeds `04-remove-merge-keep.md` R-01 | High |
| `user` role has broader `/dashboard/*` and Data-group access than several nominally more senior roles | P3 (role-model consistency) | High |

No Keep/Merge/Remove recommendation is made in this file (see `04-remove-merge-keep.md` for the one item — R-01 — this review directly feeds).
