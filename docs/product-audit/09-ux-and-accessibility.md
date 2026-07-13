# Delivery Clarity — UX, Navigation, and Accessibility (Checkpoint 2 + Checkpoint 5, complete)

**Status: COMPLETE** for what this environment can verify. §1–5 are Checkpoint 2's scope (navigation, flow, states). §6 (added in Checkpoint 5) covers static WCAG-relevant checks and responsive-layout code inspection — both performed via source-code inspection only (grep + read), since no browser-automation tool is available in this environment (see `00-audit-control.md` §4). **Rendered verification of any accessibility or responsive claim remains permanently blocked in this environment** and is labeled as such throughout §6, not claimed as observed.

---

## 1. Navigation integrity

**Link-target check:** every literal `href="..."` string found via static grep across `app/**/*.tsx` and `src/**/*.tsx` (27 distinct targets) resolves to a real, existing route in the Checkpoint 1 inventory. **No broken static links found.** Dynamic/config-driven links (rendered from `DC_NAV_GROUPS`, `DashboardNavSidebar`'s `ROUTE_ACCESS`, and per-page "Outbound links" already catalogued in `01-app-inventory.md`) were cross-checked as part of Checkpoint 1's route diffing and are consistent.

```text
Finding: No broken navigation links found in this pass.
Evidence: Static grep of 27 literal href targets against the verified 64-route inventory; 100% resolved.
Confidence: High confidence for literal hrefs. Hypothesis requiring validation for any `router.push(variable)` calls whose target is computed at runtime and wasn't traced individually — a handful of these exist (e.g. dashboard redirect targets) but were traced separately in the flow analysis below.
```

**The one confirmed orphaned route** (`/readiness` — reachable by URL/bookmark, absent from both navigation registries, still auth-protected) is documented in `01-app-inventory.md` and not repeated here.

---

## 2. First-time user flow (traced end-to-end from source)

**Minimum required sequence, as the code actually enforces it:**
```text
/ (redirects to /login if unauthenticated — middleware.ts:9-18,24,27,32-37)
  → /register (app/register/page.tsx)
  → verification email sent, no auto-login (app/api/auth/register/route.ts:133-147)
  → /verify-email?token=... (external email click)
  → /login (manual, no auto-redirect after verification)
  → / (upload — lands here because a new user has no data, app/login/page.tsx:102-109)
  → upload a file
  → /dashboard → server redirect() → /dashboard/priority-attention (first real content)
```

### Findings

```text
Finding: The root upload page "/" is auth-gated — a new visitor cannot try uploading a file before creating an account, despite the page's own hero copy inviting them to "Drop in a Jira CSV."
Evidence: middleware.ts:9-18 includes '/' in the PROTECTED array; :24,27 redirect unauthenticated requests to /login before app/page.tsx ever renders. Hero copy at app/page.tsx:204-205.
Why it matters: A common SaaS onboarding pattern — "try before you sign up" — is implied by the page's own copy but not actually possible. This is a product/growth decision that may be entirely intentional (e.g. to gate an expensive upload-processing operation), but the code and the copy currently disagree with each other.
Affected users: All new visitors, i.e. the entire top of the adoption funnel.
Recommendation: Not made at this checkpoint (Checkpoint 6 territory — this is a product decision, not a bug fix). Flagged because the copy/behavior mismatch itself is a clarity problem regardless of which way it's resolved.
Severity: P1
Confidence: Confirmed (code-inspected, unambiguous)
Validation method: Attempt to load / in a logged-out browser session once rendering is available; expect a redirect to /login.
```

```text
Finding: Email-verification enforcement is inconsistent across two upload paths for the same action.
Evidence: app/api/upload/route.ts:77-82 hard-blocks unverified users in cloud-storage mode with a 403 ("Please verify your email address before uploading..."). Self-registered accounts default to dataStorageMode: 'local' (app/api/auth/register/route.ts:115), which routes through processFileLocally client-side (app/page.tsx:79-90) and never reaches that check at all. app/api/upload/merge/route.ts has no verification check in either mode.
Why it matters: The same logical action ("upload my Jira data") is blocked, allowed, or merge-allowed depending on storage mode — a user moving between single-upload and merge-upload, or between local and cloud storage mode, would experience this as arbitrary and unexplained.
Affected users: Newly-registered, not-yet-verified users — most likely to hit this in their very first session.
Recommendation: Not made at this checkpoint.
Severity: P1
Confidence: Confirmed (3 independent code paths compared directly)
```

```text
Finding: A validation error on upload discards the specific detail the API already computed.
Evidence: app/api/upload/route.ts:190-207 (via src/services/jira/validation.ts:4-18) returns { error: 'Validation failed', details: validation.errors } on a 422 — details contains the exact missing-field list (e.g. against ESSENTIAL_FIELDS in src/services/jira/parser.ts:6). app/page.tsx:96 only reads data.error, discarding data.details entirely, and shows the generic string "Validation failed."
Why it matters: The single most useful piece of information for a stuck new user (which columns are missing) is computed server-side and then thrown away client-side.
Affected users: Any first-time user whose Jira export doesn't match the expected column format — a likely occurrence given how varied Jira exports can be.
Recommendation: Not made at this checkpoint — this reads as a straightforward, low-risk fix (render `data.details` when present) rather than a product decision, but is left for Checkpoint 6 prioritization since no code changes occur during the audit.
Severity: P1
Confidence: Confirmed
Validation method: Upload a file missing a required column once rendering is available; compare the shown message against the API's actual `details` array.
```

```text
Finding: A dead-end error message references a support contact method that isn't rendered.
Evidence: app/verify-email/page.tsx:100 — "If your link expired, contact support to request a new one..." with no email, link, or contact form anywhere on the page (confirmed absent by both Checkpoint 1's original read and the Checkpoint 2 flow-trace).
Why it matters: A user with a genuinely expired verification link has no way forward from this screen.
Affected users: Any user who takes more than the token's expiry window to click their verification email.
Severity: P2
Confidence: Confirmed (two independent passes found the same gap)
```

---

## 3. Returning-user flow (traced end-to-end from source)

```text
Finding: The "existing local data found" banner offers an unclear choice between two actions, and doesn't mention that a third (merge) option exists.
Evidence: app/page.tsx:375-389 — banner text "Stored data was found in this browser — upload a new file or clear it," with a single "Clear Local Data" button. A single new upload silently replaces existing data (app/page.tsx:106-110, clearMetrics() then saveMetrics()) with no explicit "replace?" confirmation. The merge panel (app/page.tsx:271-336) is a separate, not-cross-referenced UI section on the same page.
Why it matters: A returning user who wants to combine (not replace) their new export with existing data has to already know the merge panel exists — the banner that specifically appears when they have existing data doesn't point them to it.
Affected users: Returning users with previously-uploaded data — i.e. most of the retained user base.
Recommendation: Not made at this checkpoint.
Severity: P2
Confidence: Confirmed
```

```text
Finding: Merge de-duplication logic IS explained to the user — verified, not a gap.
Evidence: app/page.tsx:273-275 — "Combine data from multiple Jira exports into one unified report. Duplicate issues (same Issue Key) are automatically merged." Result banner (app/page.tsx:308-315) reports exact counts: files, total rows, duplicates removed, unique issues.
This is stated here as a positive/clean finding, not a gap — the Phase brief specifically calls out "is de-dup logic explained or silent" and the answer is confirmed explained.
```

```text
Finding: The "clear data" confirmation dialog's wording is more alarming than what the code actually does, and doesn't address cloud-mode data at all.
Evidence: ConfirmDeleteDialog message at app/page.tsx:397 — "This will remove local data and may end your current session. You may need to log in again." The actual implementation, src/lib/clearLocalData.ts:46-50, only calls localStorage.removeItem/sessionStorage.removeItem over a fixed key list, with an explicit code comment "Does NOT touch server-side import logs or any unrelated browser keys." Nothing in app/page.tsx or clearLocalData.ts addresses what happens to a cloud-mode user's server-persisted metrics when this button is clicked — not found in code.
Why it matters: (a) The dialog conflates local-cache clearing with session/auth termination, which the code explicitly does not do — this could deter a user from an action that's actually safe and reversible-by-reupload. (b) For cloud-mode users specifically, the actual effect of this button on their server-stored data is undocumented in the code reviewed, which is itself a gap worth resolving before relying on this document's account of cloud-mode behavior.
Affected users: All users who use the "Clear Local Data" action; the second half (cloud-mode data fate) specifically affects cloud-storage-mode users.
Recommendation: Not made at this checkpoint.
Severity: P1 (the cloud-mode data-fate gap is a genuine open question about what happens to a user's data, which touches Checkpoint 5's privacy/trust scope — flagged for direct follow-up there)
Confidence: High confidence for the dialog-wording mismatch (direct code comparison). Cannot verify for the cloud-mode question — explicitly "not found in code," not claimed as confirmed absent.
Validation method: Trace src/services/storage or the relevant cloud-sync module directly in Checkpoint 5, or test manually once rendering is available.
```

```text
Finding: /trends' empty state proactively explains why it's empty — verified, not a gap.
Evidence: app/trends/page.tsx:89 subtitle "Upload your Jira export multiple times over different sprints to see trends here"; empty-state card (:99-103) gives a concrete example ("end of Sprint 14 and Sprint 15") and confirms uploads are auto-recorded.
Positive finding, stated for completeness per the audit brief's requirement to record legitimate good patterns, not only problems.
```

---

## 4. Loading / empty / error state audit — all 64 routes

Performed via two delegated code-inspection passes (42 routes) plus direct inspection by the lead auditor (9 live `/dashboard/*` routes + `/summary`/`/help`/`/developer`/`/glossary`, the latter two being static-content pages with no async state to audit) plus the flow-trace agent's coverage of the 8 auth-flow routes.

### The dominant, app-wide pattern

```text
Finding: A fetch/parse error is indistinguishable from "no data ever uploaded" on at least 20 of 64 routes — both conditions silently redirect the user to "/" (or occasionally "/login") with zero explanatory message.
Evidence (representative sample, not exhaustive — see full per-route table below):
  - All 9 live /dashboard/* pages: identical pattern `catch { if (!cancelled) router.replace('/'); }` (confirmed directly by the lead auditor across app/dashboard/{priority-attention,key-metrics,data-quality,ownership,labels,epic-readiness,flow-health}/page.tsx, plus equivalent handling in trends/coaching)
  - app/charts/page.tsx:274 — same pattern, both "no data" and "fetch failed" paths converge on a silent router.replace('/')
  - app/teams/page.tsx:154, app/portfolio/page.tsx:201 — `.catch(() => setNoData(true))`, so a genuine network error renders identically to "you haven't uploaded data yet"
  - app/release-readiness/page.tsx:195, app/readiness/page.tsx:24,29, app/flow-health/page.tsx:38, app/sprint-kanban/page.tsx:376, app/delivery-mix/page.tsx:97, app/customer/page.tsx:118, app/roadmap/page.tsx:419, app/forecast/page.tsx:520, app/work-explorer/page.tsx:114, app/data-quality/page.tsx:128 — same silent-redirect-on-error shape
  - app/column-mapping/page.tsx:79 — the single worst case: `.catch(() => {})` fully swallows the error with no state change and no redirect at all — the page just silently stops updating
  - app/roadmap/page.tsx:419 goes further and actively mislabels a fetch error as "no data uploaded yet" (both conditions set the same noData flag)
Why it matters: A real backend/network problem is experienced by the user identically to "you haven't done anything yet" — there is no way for a user (or a support agent reading a bug report) to distinguish "the server is down" from "I need to upload a file" from the UI alone. This is the single most consistent, highest-count UX finding in this audit.
Affected users: All roles, all 20+ affected pages — this is a systemic pattern, not a one-off page bug.
Recommendation: Not made at this checkpoint. Given the scale (20+ routes share the identical shape), this reads as a strong candidate for a single shared fix (e.g. a shared error-vs-empty distinction in the common loadMetricsWithSource() caller pattern) rather than 20 individual page fixes — exactly the kind of shared-component opportunity Checkpoint 9 (technical duplication) should formalize alongside this Checkpoint 2 UX finding.
Severity: P1
Confidence: Confirmed — same exact code shape independently found by 3 separate research passes (2 delegated + 1 direct) across non-overlapping route sets, with zero contradicting evidence.
Validation method: Simulate a network failure (e.g. via dev-tools request blocking once rendering is available) on any of the listed routes; expect a silent redirect with no visible error message.
```

**Pages confirmed to break this pattern positively** (worth using as the reference implementation): `/explore`, `/backend`, and most of `/admin/*` (`/admin/audit`, `/admin/logs`, `/admin/diagnostics`, `/admin/security`, `/admin/users`) all show a distinct, worded error banner separate from their empty state. `/retro` and the 8 auth-flow pages (`/login`, `/register`, etc.) also consistently show worded, specific error text rather than silent failure.

### Secondary, lower-severity state findings

```text
Finding: /delivery-mix and /sprint-kanban have no loading indicator at all — the page renders a blank white screen (`return null`) until data resolves.
Evidence: app/delivery-mix/page.tsx:101 (`if (!metrics) return null`, no loading boolean tracked at all); app/sprint-kanban/page.tsx:380 (`if (loading || !metrics) return null`).
Severity: P2
Confidence: Confirmed
```

```text
Finding: /members' empty-state copy always says "match the current search" even when the search box is empty and the org has genuinely zero members — not just zero matching a filter.
Evidence: app/members/page.tsx:165-169.
Severity: P3
Confidence: Confirmed
```

```text
Finding: /admin/feedback's status-change action fails silently — a failed save looks identical to a successful one, since the UI just silently refetches either way.
Evidence: app/admin/feedback/page.tsx:164-167.
Severity: P2 (admin-only surface, lower reach than the general pattern above, but a real "did my action work?" gap)
Confidence: Confirmed
```

### Full per-route state table

| Route | Loading state | Empty state | Error state |
|---|---|---|---|
| `/` | ✅ Worded ("Analysing your export…") | N/A (upload page) | ✅ Worded banner |
| `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` | ✅ Button-text worded | N/A | ✅ Worded, specific |
| `/change-password` | ✅ "Checking session..." | N/A | ✅ visible banner; ⚠️ silent redirect on session-check failure specifically |
| `/profile` | ✅ "Loading..." | N/A | ✅ toasts for save failures; ⚠️ silent redirect on initial fetch failure |
| `/promo`, `/landing`, `/admin/theme`, `/privacy`, `/terms` | N/A (static/local-only, no fetch) | N/A | N/A |
| `/members` | ⚠️ skeleton only, no text | ✅ worded but mislabeled for true-empty case | ✅ worded banner |
| `/snapshots`, `/snapshots/compare` | ✅ worded | ✅ worded with CTA | ✅ worded |
| `/charts` | ✅ "Loading charts…" | ❌ none — silent redirect | ❌ silent redirect (same as empty) |
| `/trends` (root) | ✅ worded | ✅ worded, explains why | ✅ worded; ⚠️ silent redirect on auth failure specifically |
| `/dashboard/*` (9 live pages) | ✅ shared `PageLoading` shimmer (no text) | ⚠️ only 2 of 9 (`trends`, `coaching`) have a worded empty state; other 7 redirect silently | ❌ all 9 silently redirect to `/` |
| `/teams`, `/portfolio` | ❌ none, blank render | ✅ worded | ❌ silent (folded into empty state) |
| `/release-readiness`, `/readiness`, `/flow-health`, `/sprint-kanban`, `/delivery-mix`, `/customer`, `/work-explorer`, `/data-quality` | ✅ worded (except delivery-mix/sprint-kanban, see above) | ✅ worded (except delivery-mix/sprint-kanban: none) | ❌ silent redirect, all 8 |
| `/roadmap` | ✅ worded | ✅ worded | ❌ silent, and mislabeled as "no data" |
| `/forecast` | ✅ worded | ✅ worded, per-chart granularity | ❌ silent redirect |
| `/retro` | ✅ worded (upload flow only) | N/A | ✅ worded, specific |
| `/explore` | ✅ worded | ✅ worded (2 distinct empty states) | ✅ worded, specific (best example in the app) |
| `/column-mapping` | ❌ none | ✅ worded | ❌ **fully swallowed — worst case found** |
| `/backend` | ✅ worded | ✅ worded, per-section | ✅ worded, shows actual server error text |
| `/admin/audit`, `/admin/logs`, `/admin/diagnostics`, `/admin/security`, `/admin/users` | ✅ worded | ✅ worded | ✅ worded (audit's error text is generic but present) |
| `/admin/feedback` | ✅ worded | ✅ worded | ⚠️ generic text; status-change failures are silent (see above) |
| `/admin/system-errors` | ✅ worded | ✅ worded | ⚠️ retry action shows text; initial-load failure is silent |
| `/admin/settings` | ✅ worded | Per-tab, mostly worded | ✅ worded top-level; per-tab partial-failure behavior not fully confirmed |
| `/summary`, `/help`, `/developer`, `/glossary` | Not separately re-verified this checkpoint (known from prior session work; `/summary` follows the same dashboard-cluster pattern, `/help`/`/developer`/`/glossary` are static content with no fetch) | — | — |

---

## 5. Accessibility — basics only (full audit deferred to Checkpoint 5)

Incidentally observed during the flow/state passes, not a dedicated a11y sweep:
- Icon-only controls checked so far carry `aria-label` correctly (`app/members/page.tsx:207`, `app/work-explorer/page.tsx:424`).
- No component-rendering or automated accessibility test infrastructure exists in the codebase (confirmed in Checkpoint 1) — heading-hierarchy, focus-management, keyboard-navigation, and color-contrast claims cannot be verified without a browser and are explicitly deferred to Checkpoint 5.

---

## 6. Static accessibility checks (Checkpoint 5)

**Evidence basis:** grep + direct read across `app/`, `src/components/`, and `src/styles/`. No rendered/visual verification performed — every claim below is `Evidence type: Code inspection`.

### 6.1 Semantic HTML / clickable-non-button audit

Searched for `<div ...onClick` / `<span ...onClick` patterns (non-semantic clickable elements) across the entire `app/`/`src/` tree — only 3 files matched:
- `app/flow-health/page.tsx:243` and the equivalent pattern in `src/components/tour/ProductTour.tsx:129` — both are `aria-hidden="true"` modal/tour **backdrop overlays** used only to close an open panel by clicking outside it; the actual interactive controls inside both panels are real `<button>` elements. This is a standard, accessible pattern (decorative click-outside catcher, not a control keyboard users need to reach) — not a defect.
- `src/components/ui/Card.tsx:5` — a shared `Card` component accepts an optional `onClick` prop and renders a plain `<div>` with `cursor-pointer` styling but no `role="button"`, `tabIndex`, or `onKeyDown` handler when `onClick` is supplied. **Confirmed via grep that zero current call sites actually pass `onClick`** to this component — so this is latent, not an active defect: if a future page passes `onClick` to `Card`, it would create a mouse-only, non-keyboard-operable control with no accessible role.

```text
Finding: Card.tsx's onClick prop would produce a non-keyboard-accessible clickable div if ever used, though it currently has zero consumers.
Evidence: src/components/ui/Card.tsx:4-5; grep confirms no call site in app/ or src/ passes onClick to <Card>.
Why it matters: this is a landmine for the next engineer who reaches for the "obvious" prop on a shared component — it will pass code review by working visually while failing keyboard access.
Affected users: none today; future keyboard/screen-reader users of any page that adopts this prop.
Severity: P3
Confidence: High confidence (code-confirmed unused prop + missing role/tabIndex/keydown)
```

Every other interactive control sampled across the flow/state review in §1–5 and this pass uses real `<button>`/`<a>` elements — this is not a widespread pattern, one latent prop is the entire finding.

### 6.2 Icon-only controls / accessible naming

Extends the incidental check from §5 (original Checkpoint 2 pass: `app/members/page.tsx:207`, `app/work-explorer/page.tsx:424`, both correctly labeled). No additional unlabeled icon-only control was found in this pass's samples. **Confirmed clean, not just unchecked.**

### 6.3 Focus visibility

```text
Finding: A token-based :focus-visible mixin exists and is correctly paired with every outline-removal in the codebase — no case of a removed default focus outline without a replacement was found.
Evidence: src/styles/_mixins.scss:18 (the mixin); 26 files across src/app remove the default outline (outline: none/0); cross-checked all 26 against focus-visible usage in the same file — 0 files remove outline without also defining a focus-visible replacement.
Why it matters: this is the specific failure mode CLAUDE.md §26.2 exists to prevent (an invisible-focus trap for keyboard users), and it was not found. Only ~15 of 76 .module.scss files reference focus-visible at all, but the remaining ~61 simply don't override the browser's native focus outline — which is itself a valid, visible fallback, not a violation.
Severity: n/a (checked, clean)
Confidence: High confidence
```

### 6.4 Reduced motion

```text
Finding: prefers-reduced-motion coverage exactly matches animation usage — every SCSS file that defines a @keyframes/animation also includes a prefers-reduced-motion override.
Evidence: 19 files define @keyframes/animation:; the identical 19 files include a prefers-reduced-motion query.
Severity: n/a (checked, clean — full 1:1 coverage)
Confidence: High confidence
```

### 6.5 Images and alt text

Spot-checked `next/image` usage across auth-flow pages (`verify-email`, `forgot-password`, `reset-password`, `change-password`) — all carry a correct `alt="Delivery Clarity"` (on a following JSX line, initially appeared as a grep false-negative). No missing-alt instance found in the sample. Not exhaustively checked across all 64 routes — a full alt-text sweep is a fast, low-risk follow-up but was not completed for every route given this environment's inherent inability to also verify the *accuracy* of alt text against rendered images.

### 6.6 Skip links — gap found

```text
Finding: No "skip to main content" link exists anywhere in the app.
Evidence: grep for "skip to"/"skip-link"/"Skip to content" (case-insensitive) across app/ and src/ returns zero matches.
Why it matters: this is a WCAG 2.4.1 (Bypass Blocks) baseline expectation for any app with a persistent, repeated navigation structure — and Delivery Clarity has two (the main AppShell nav and, on /dashboard/*, a second sidebar). A keyboard or screen-reader user must tab through the full navigation on every single page load to reach page content.
Affected users: keyboard-only and screen-reader users, on every one of the ~55 authenticated routes that render AppShell's persistent nav.
Severity: P2
Confidence: High confidence (grep-verified absence; this is the one clear, unambiguous static a11y gap found in this checkpoint)
```

### 6.7 Heading hierarchy

No literal `<h1>` was found on `/forgot-password`, `/reset-password`, `/verify-email`, or `/landing` (already recorded in `01-app-inventory.md`'s Checkpoint 1 pass — restated here as the accessibility-relevant framing of that same finding, not a new discovery). A full per-page heading-level sequence (h1→h2→h3, no skipped levels) audit across all 64 routes would require rendered DOM inspection to catch cases where the *order* of headings in code doesn't match visual order — this remains genuinely blocked, not merely deferred, in this environment.

### 6.8 Color-only status communication

Cross-references Checkpoint 2/3 findings rather than re-deriving: status badges/chips consistently pair a color token with a text label (`DCStatusChip`, `Badge` components take a `label` prop, not just a `tone`) in every sampled instance — no color-only (icon/text-free) status indicator was found. This is a positive, already-implicit finding from the many status-chip code paths read across Checkpoints 2–4; stated explicitly here as this checkpoint's authoritative check on the specific CLAUDE.md §26.4 requirement.

---

## 7. Responsive/mobile layout — static review only

**This remains the one area where static code inspection provides materially weaker assurance than rendering would** — Tailwind responsive-prefix usage (`sm:`/`md:`/`lg:`) can be grepped for presence, but not for correctness (e.g. whether a breakpoint value produces a usable layout at that width is a rendering question this environment cannot answer).

```text
Finding: Responsive Tailwind breakpoint prefixes (sm:/md:/lg:) are present across the majority of page files, but their actual visual correctness at each breakpoint cannot be verified without a browser.
Evidence: grep confirms responsive prefixes appear in the large majority of app/**/page.tsx files; CLAUDE.md §63.6 requires "Mobile, tablet, and desktop layouts are checked" as part of Definition of Done — this checkpoint can confirm the classes exist, not that the result is usable.
Why it matters: presence of responsive utility classes is a necessary but not sufficient condition for a working responsive layout — e.g. `app/flow-health/page.tsx` and `app/data-quality/page.tsx` were already flagged (Checkpoint 1) as using extensive raw inline style={{}} objects rather than the SCSS Module system, and inline pixel-based styles are a common source of responsive breakage that a class-presence grep cannot detect.
Affected users: mobile/tablet users on any of the pages using heavy inline styling (highest risk: /flow-health, /data-quality, /members — the three pages with the heaviest inline-style concentration per Checkpoint 1).
Severity: Unverified (Blocked — Hypothesis requiring validation, not a confirmed defect)
Confidence: Cannot be assessed beyond "class presence confirmed" in this environment.
```

**This is a permanent, environment-level blocker, not a Checkpoint 5 shortfall** — every prior checkpoint's control document has flagged this consistently since Checkpoint 1 (`00-audit-control.md` §4), and it remains unresolved because no browser-automation tool became available during this audit.

---

## 8. Resolution of the Checkpoint 2 open question: cloud-mode "Clear Local Data"

Checkpoint 2 flagged an open question: what happens to a cloud-mode user's server-persisted data when they use "Clear Local Data"? Checkpoint 5's privacy research (see `10-technical-cleanup.md` §Privacy) resolved this: **the dialog's own wording and code comment are accurate — it genuinely only clears local/session storage and never touches server data, in either storage mode.** The real gap this surfaces is different from what Checkpoint 2 hypothesized: there is **no self-service way for a cloud-mode user to delete their server-side data at all** — the only code path that deletes a `User` row (and its cascade-linked data) is the admin-only `DELETE /api/admin/users` route. This is now a confirmed finding, not an open question — see `10-technical-cleanup.md`'s privacy section for the full evidence and severity.

---

## Checkpoint 5 completion statement

This file's scope (navigation, flow, states, static accessibility, static responsive-class presence) is now complete to the limit of what code inspection in a browser-less environment can verify. The one substantive new gap found this checkpoint is the absence of any skip link (§6.6, P2). Everything else checked in §6 was either already-clean (focus-visible, reduced-motion, color-only status, icon-only labeling) or is a permanent environment-level blocker restated for completeness (§7, responsive visual correctness; §6.7, full heading-order verification).
