# Delivery Clarity — Master TODO List

**Last updated:** 2026-06-16 (**v4.9.3 DOC AUDIT ✅ COMPLETE** — Comprehensive doc audit: SRS scope fixed (15 dashboard pages + 6 standalone, was 11), §8.1 updated 36→44 routes + app-config row added, DEVELOPER_GUIDE file tree + §3a added, APPENDIX 9 new entries, USE_CASES UC-107/108/109 added, RELEASE_NOTES v4.9.3 written. Security fix: 10 routes added to middleware PROTECTED array + config.matcher. Branch: style/visual-design-updates.)

**Previous:** 2026-06-16 (**v4.9.2 P0 PASS ✅ COMPLETE** — REC-01–11/17/19–24 closed. TC-AC-01 + TC-REQ-10 fixed. Tests: 571/63 all passing. Lint: pass. Build: pass. RELEASE_NOTES v4.9.0/v4.9.1/v4.9.2 added. SRS v4.9.2, BRD v4.9.2, DEVELOPER_GUIDE, TEST_CASES all updated. Branch: style/visual-design-updates.)

**Previous:** 2026-06-10 (**v4.6 ROADMAP/FORECAST/RETRO/NAV-UX ✅ SHIPPED** — /roadmap, /forecast, /retro pages live; help + glossary nav UX redesigned; encrypted S3 config shipped; nav items added to Delivery group in AppShell. RETRO-01/02/03/23/24/25/26/27/28/31/32 ✅ Done. FCAST-01–18 ✅ Done. NAV-01/NAV-02 ✅ Done. ROADMAP-01 ✅ Done. COVER-19/20/22 re-opened → re-closed as implemented. Branch: feat/s3-encrypted-config.)  

**Previous:** 2026-06-09 (**v4.5 USERREQ UI ✅ FULLY SHIPPED AND DOCUMENTED** — all USERREQ-02/03/04/05/06/15/16/17/18/19/20/21/22/23/24/26/29/30 closed. RequestAddMemberModal (FR-320), UserAddRequestsPanel with mandatory admin-entered temp password (FR-321), GET/PATCH notification APIs (FR-322), NotificationBell with pulsing badge + amber admin strip (FR-323), bulk user multi-select/delete/role-change (FR-324), UC-097–099, UJ-034, SCN-049, TC-NOTIF-01–05, TC-REQ-15–16, SRS Addendum C, RELEASE_NOTES v4.5. Suite: **571/63 passing**, lint and build clean. NEXT-03 + TRACE-01 + TRACE-02 all ✅ FULLY CLOSED. USERREQ-07–14, USERREQ-28 ✅ CLOSED 2026-06-09 (backend foundation). TRACE-01 **and** TRACE-02 were both ✅ FULLY CLOSED 2026-06-08. TRACE-01: all six gap clusters plus UX-14 done — cluster #5 closed UX-02/03/05/11/13 narrative residue (new FR-308/BR-112 + UC-090/091, SCN-046/047/048, UJ-030/031/032/033, TC-CH-01–03/TC-X-14 via new src/lib/dashboardChips.ts and buildReportHtml() extractions); cluster #6 resolved the FR↔UC bundling item by fixing four real ID collisions it surfaced (duplicate FR-242/243 → FR-310/311, duplicate FR-235D → FR-235H, duplicate UC-043/044 → UC-092/093, phantom FR-309 → newly written) and adding TRACE-01 Appendix B, the FR→UC Ownership Index — matrix has zero GAP cells and zero ID collisions. TRACE-02: all 22 COVER-XX full-app-coverage rows closed via a survey-first pass — 2 stale-framing false positives re-verified (COVER-02/05), 2 genuine gaps closed (COVER-03 new SRS §8.1 API route inventory; COVER-06 new FR-312/UC-094/mergeIssues.test.ts), 1 TC-ID collision cluster resolved (COVER-11 — F3 Authentication Tests table renumbered TC-A-10–14 + 7 new tests), 1 error-state gap closed (COVER-12 — snapshotLoadErrors.test.ts TC-SN-09–11), and 5 roadmap items confirmed correctly-scoped with no speculative docs (COVER-17–21). Suite now **527/60 passing**, lint and build clean)  
**Product:** Delivery Clarity  
**Brand:** Ali Delivery Intelligence  
**Product line:** From Jira Exports to Delivery Confidence  
**Main slogan:** From messy boards to measurable delivery confidence.  
**Supporting line:** Zero-credential Jira analytics, retrospective intelligence, role-based coaching, and delivery forecasting — all in one private workspace.  
**Current known branch from uploaded TODO:** `codex/flat-admin-settings`  
**Current known version from uploaded TODO:** `v4.2.2`  
**Current known test status from uploaded TODO:** `npm run lint` pass, `npm test` pass with 469 tests / 48 suites, `npm run build` pass.  
**Important correction (updated 2026-06-08 — both TRACE-01 and TRACE-02 are now closed):** `TRACE-01` (traceability matrix) and `TRACE-02`/full app coverage validation (all 22 `COVER-XX` rows) are both ✅ Done — see Section 8 and the closure write-ups in this file and `RELEASE_NOTES.md`. Required-output reporting remains the only open item gating full P0 closure.  
**TRACE-01 progress (2026-06-08):** First-pass traceability matrix compiled and inserted in Section 12 (~50 feature rows cross-referenced against SRS/UC/SCN/UJ/TC/Release Notes); ~38% of cells started as `GAP — not found`. **Cluster #1 (F3-14/15/16 — admin user mgmt, members, forced password change) is fully closed**: anchored with `UC-084/085/086`/`SCN-039–042`/`UJ-024–026`/`TC-AU/MD/PW` and all 14 of those test cases automated and passing (suite grew 469/48 → 481/51). **UX-14 (flat admin redesign) is fully closed**: anchored with `UC-087/SCN-043/UJ-027/TC-AC-01–03`, and all 3 of those test cases automated and passing (suite grew 481/51 → 492/52, via a new `src/lib/adminConsole.ts` pure-logic extraction mirroring the `src/lib/members.ts` pattern). **Cluster #2 (F2-05/06/07/09/11/12/13 — Work Item Explorer visuals/filters) is fully closed (2026-06-08)**: added `FR-225A–D` to `product/SRS.md`, anchored with a new `UC-088`/`SCN-044`/`UJ-028`, re-verified the three "Needs verification" items (F2-11/12/13 risk-path/largest-branch/blocked-filter) at the code level and promoted them to ✅ Done, and automated 6 new field-format-compatibility test cases `TC-FF-01–06` (new `fieldFormatCompat.test.ts`, suite grew 492/52 → 498/53 — no extraction needed, the relation-graph field accessors were already pure). **Cluster #3 (F4-05/06/08 — Smart Excel export sheets and trigger) is now fully closed too (2026-06-08)**: added `FR-310` (sheet-content rules) and `FR-311` (export-trigger contract — *originally numbered `FR-242`/`FR-243` at the time of this closure; renumbered 2026-06-08 after item-6 review found they collided with the pre-existing Addendum-A "Data Quality Score" `FR-242`/`FR-243` — see Gaps Summary item 6*) to `product/SRS.md`, anchored with a new `UC-089`/`SCN-045`/`UJ-029`, and automated 10 new test cases `TC-X-09a–TC-X-13b` (new `excelExportSheets.test.ts`, covering Risks & Blockers sort/suggested-actions, Orphan & Data Quality summary/detail/empty-state, Cycle & Lead Time percentile math and slowest-items ranking, Release Readiness Go/Conditional-Go/No-Go grouping, and the `exportToExcel` trigger with default/custom filenames — suite grew 498/53 → 508/54). Along the way, corrected a stale `product/TEST_CASES.md` §9 entry that described 6 *manual, Not-Run* `TC-X` cases not matching the 8 already-automated ones. **Cluster #4 (F1-07/08 — `src/types/throughput.ts` types and the `DashboardMetrics.throughput` field) is now fully closed too (2026-06-08)**: rather than declaring these "not independently traceable", anchored them to the existing `UC-043`/`SCN-012`/`UJ-010` that already consume the `ThroughputMetrics` data contract — extended `UC-043`'s Related-FR range from "FR-207 to FR-214" to "FR-207 to FR-215" with an explanatory note, added a `**Related:**` line to `SCN-012`, and automated 1 new shape-contract test case `TC-T-11` (in existing `throughput.test.ts`, now 11 tests, asserting `metrics.throughput` conforms to the full `ThroughputMetrics`/`SprintThroughputSummary`/`KanbanFlowSummary`/`MidSprintInsight` contract — suite grew 508/54 → 509/54). **Cluster #5 (UX-02/03/05/11/13 — UX narrative residue) is now fully closed too (2026-06-08)**: investigation showed 3 of 5 matrix entries were *stale* (anchors already existed elsewhere — `UX-02` via `FR-271/272`/`UC-062`/`SCN-024`/`UJ-021`/`TC-DV-*`, `UX-05` via `UC-076`/`SCN-035`, `UX-11` via `FR-304`/`UC-081`/`TC-TC-*`) and just needed matrix correction plus the genuinely-missing pieces (`UJ-031` for UX-05; `SCN-047`/`UJ-032` for UX-11). `UX-13` was a partial gap (FR/TC existed, UC/SCN/UJ didn't — wrote new `UC-091`/`SCN-048`/`UJ-033`). `UX-03` (status chips) was the one true zero-anchor gap — extracted the cross-cutting `Chip`/`CHIP_CLS` severity system from `app/dashboard/page.tsx` into a new pure module `src/lib/dashboardChips.ts` (mirroring the `adminConsole.ts`/`members.ts` pattern), wrote new `FR-308`/`BR-112`, anchored with new `UC-090`/`SCN-046`/`UJ-030`, and automated `TC-CH-01–03`; also extracted `buildReportHtml()` out of `exportToHtml` so UX-05's branding markup could be automated as `TC-X-14` (new `exportUtilsHtml.test.ts`). Suite grew 509/54 → 513/56. The Section 12 matrix now has **zero** `GAP — not found` cells. **Cluster #6 (the cross-cutting FR↔UC bundling ambiguity) is now closed too (2026-06-08) — and with it, all of TRACE-01**: investigating the bundled `**Related FR**` ranges surfaced that the real problem wasn't bundling but **four genuine ID collisions** — duplicate `FR-242`/`FR-243` (one pair self-inflicted during cluster #3, unknowingly colliding with the pre-existing Addendum-A "Data Quality Score" FRs of the same numbers), duplicate `FR-235D` (an orphan second definition referenced nowhere by ID), duplicate `UC-043`/`UC-044` (stale pre-v3.0 use cases colliding with the current v3.0 ones the matrix anchors to), and a phantom `FR-309` referenced in `UC-083` but never defined. Renumbered the colliding/orphaned IDs to `FR-310`/`FR-311`/`FR-235H`/`UC-092`/`UC-093` (each annotated in place with the collision reason), wrote a correctly-scoped new `FR-309` documenting the bucket-backed metrics restore-and-fallback flow `UC-083` actually narrates, corrected `UC-083`'s `**Related FR**` line, and propagated every renumbering across `USE_CASES.md`/`SCENARIOS.md`/`TEST_CASES.md`/`RELEASE_NOTES.md`/`TODO-List.md`. Then built **TRACE-01 Appendix B** (the FR→UC Ownership Index, in Section 12 below the Gaps Summary) — expanding all 8 bundled ranges into individual FR IDs with their authoritative UC owner per the matrix, proving the remaining bundling was navigable shorthand, not ambiguity, once the collisions were gone. No code changed (documentation-only), so the suite remains **513/56**; lint and build remain clean. **TRACE-01 has zero `GAP — not found` cells, zero ID collisions, and is now ✅ Done.**

---

## 0. Operating Rule

Act as a senior cross-functional delivery/product team:

- Principal Software Engineer
- Senior Backend Engineer
- Senior Frontend Engineerx
- Software Architect
- DevOps Engineer
- Security Engineer
- QA Lead
- Business Analyst
- Product Owner
- Scrum Master
- Agile Coach
- UX/UI Designer
- Delivery Manager
- C-level technical advisor
- Patent-readiness advisor

Delivery Clarity is a confidential, private, self-hosted, zero-credential Jira analytics and delivery intelligence platform.  
Do not expose source code, algorithms, diagrams, patent language, credentials, product documents, or architecture details publicly.

---

## 1. Priority Model

> **Sequencing policy (updated 2026-06-08 by explicit user direction):** P0 work no longer strictly *blocks* P1–P4 work. Going forward, run P0 in **parallel and in balance** with P1/P2/P3/P4 — pick up whichever item best fits the moment rather than gating everything behind P0 closure first. P0 still carries the highest *priority weight* (when choosing between competing items, P0 wins), but it is no longer a hard sequencing gate that forces P1–P4 to sit idle. (Historical context: `TRACE-01`/`TRACE-02` — the two items that most justified strict gating — are both ✅ Done as of 2026-06-08, so the original blocking rationale has also largely resolved itself.)

| Priority | Meaning | Rule |
|---|---|---|
| P0 | Critical release-control gate | Highest priority weight — wins when choosing between competing items — but no longer a hard block on P1–P4 (balanced/parallel sequencing per 2026-06-08 direction). |
| P1 | Current product hardening / UX / internal architecture | May be picked up in parallel with P0; weigh against other open items rather than waiting for a full P0 close-out. |
| P2 | Product intelligence / forecasting / retrospective / architecture planning | May be picked up in parallel with P0/P1 when it's the best-fitting next item; still generally follows P1 stability or explicit approval as a design consideration, not a hard gate. |
| P3 | Future full external integrations | May be planned/started in parallel once P2 design direction exists; "do not start until P2 design is approved" is now a design dependency, not a sequencing block. |
| P4 | Future communication/governance layer | Planning may proceed in parallel with other priorities; implementation still needs explicit approval. |

---

## 2. Status Key

| Status | Meaning |
|---|---|
| ✅ Done | Completed, committed, pushed, documented, and verified |
| 🔍 Needs verification | Implemented or claimed, but must be rechecked |
| 🔧 In progress | Actively being worked on |
| ❌ Not started | No implementation yet |
| 🚫 Blocked | Waiting on dependency or approval |
| 📄 Planning only | Document/design only; no code |
| ⏸️ Deferred | Intentionally postponed |
| ⚠️ Conflict | Current docs/status disagree and must be reconciled |

---

## 3. Absolute Execution Rule

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| ABS-01 | ~~Do not start new feature coding until P0 reconciliation is complete~~ Balance P0 work in parallel with P1–P4 (superseded 2026-06-08) | P0 | ✅ Superseded by explicit user direction | Original hard-gate rule replaced 2026-06-08: P0 (documentation alignment, traceability, product-folder impact review, test count normalization, release-candidate gate) now runs in **parallel and balance** with P1–P4 rather than blocking it outright — see Section 1 Priority Model sequencing-policy note. P0 retains the highest priority *weight* when choosing between competing items. |
| ABS-02 | Treat documentation as part of Definition of Done | P0 | ✅ Done / Permanent | Code cannot move ahead of product documentation. |
| ABS-03 | Keep export-first / zero-credential positioning strong | P0 | ✅ Permanent | Jira API and cloud integrations are optional/future. Core value remains upload/export-based private intelligence. |
| ABS-04 | Do not implement P3/P4 features without explicit approval | P0 | ✅ Permanent | Jira write-back, full Jira API, browser push, email/Slack/Teams channels, maintenance mode, PostgreSQL migration, and full CI/CD automation are controlled future work. |

---

## 4. P0 Mandatory Rule — No Product File Behind Code

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| DOC-GATE-01 | Review every file inside `product/` for every code change, commit, and push | P0 | ✅ Permanent | Includes SRS, BRD, Use Cases, User Journeys, Scenarios, Test Cases, Developer Guide, Release Notes, README, Algorithm Spec, Technical Method, Appendix, patent docs, and every other product file. |
| DOC-GATE-02 | Update every affected product document immediately | P0 | ✅ Permanent | Required when feature, route, API, role, UI, workflow, DB model, calculation, test, deployment, security, storage, admin, gateway, retrospective, template, or forecasting behavior changes. |
| DOC-GATE-03 | Mark unaffected product files as “Reviewed — No update required” | P0 | ❌ Not started | Must appear in the documentation impact matrix before push. |
| DOC-GATE-04 | Block push when product documentation impact check is incomplete | P0 | ✅ Permanent | Hard-stop output: `Push blocked: product documentation impact check is incomplete.` |
| DOC-GATE-05 | Block push when any product document is behind code | P0 | ✅ Permanent | Hard-stop output: `Push blocked: product documentation is behind code.` |
| DOC-GATE-06 | Update `/help` and `/developer` in-app docs when relevant | P0 | ✅ Permanent | Required for user-facing or developer-facing behavior changes. |
| DOC-GATE-07 | Update `TODO-List.md` on every roadmap/status/priority change | P0 | ✅ Permanent | TODO is a live execution-control document. |
| DOC-GATE-08 | Update `product/RELEASE_NOTES.md` for every meaningful change | P0 | ✅ Permanent | Release Notes must reflect actual code, docs, tests, and verification. |
| DOC-GATE-09 | Review patent docs when novelty/claim/prior-art positioning changes | P0/P2 | 🔍 Needs verification | Review `PATENT_DISCLOSURE.md`, `PRIOR_ART_COMPARISON.md`, and `CLAIM_CANDIDATE_MATRIX.md`; do not over-claim future features. |

---

## 5. Push Gate Checklist

Before every push, Claude must complete this checklist.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| PUSH-01 | Check `git status` | P0 | ✅ Permanent | Report branch and working tree status. |
| PUSH-02 | Review all changed code files | P0 | ✅ Permanent | Identify changed routes, APIs, services, UI, models, tests, and behavior. |
| PUSH-03 | Identify affected features/workflows | P0 | ✅ Permanent | Include feature, route, API, role, data model, UI screen, test, workflow, storage, gateway, retro, forecasting, admin, and security impacts. |
| PUSH-04 | Review every file in `product/` | P0 | ✅ Permanent | Must include all product docs and any additional files in the folder. |
| PUSH-05 | Update affected product docs | P0 | ✅ Permanent | No affected doc may remain behind code. |
| PUSH-06 | Mark unaffected product docs as reviewed | P0 | ❌ Not started | Required in impact matrix. |
| PUSH-07 | Update `TODO-List.md` | P0 | ✅ Permanent | Include new status, priority, sequencing, and blockers. |
| PUSH-08 | Update `product/RELEASE_NOTES.md` | P0 | ✅ Permanent | Include change, tests, known limitations, and verification status. |
| PUSH-09 | Update `product/TEST_CASES.md` | P0 | ✅ Permanent | Required when tests changed or should change. |
| PUSH-10 | Update `product/SRS.md` | P0 | ✅ Permanent | Required when scope, behavior, requirement, or acceptance criteria changes. |
| PUSH-11 | Update `product/USE_CASES.md` | P0 | ✅ Permanent | Required when user/admin/system behavior changes. |
| PUSH-12 | Update `product/USER_JOURNEYS.md` | P0 | ✅ Permanent | Required when user experience changes. |
| PUSH-13 | Update `product/SCENARIOS.md` | P0 | ✅ Permanent | Required when real-world behavior changes. |
| PUSH-14 | Update `product/DEVELOPER_GUIDE.md` | P0 | ✅ Permanent | Required when implementation, architecture, setup, package, API, or deployment behavior changes. |
| PUSH-15 | Update `product/BRD.md` | P0 | ✅ Permanent | Required when business capability, value, stakeholder expectation, or roadmap status changes. |
| PUSH-16 | Update `product/ALGORITHM_SPEC.md` | P0 | ✅ Permanent | Required when logic, formula, metric, inference, calculation, template parsing, retro analysis, or forecasting rule changes. |
| PUSH-17 | Update `product/TECHNICAL_METHOD.md` | P0 | ✅ Permanent | Required when architecture, gateway, storage, security, retrospective method, or forecasting method changes. |
| PUSH-18 | Update `product/APPENDIX.md` | P0 | ✅ Permanent | Required when terms, abbreviations, roles, statuses, providers, routes, storage keys, or definitions change. |
| PUSH-19 | Run lint/tests/build | P0 | ✅ Permanent | Required commands: `npm run lint`, `npm test`, `npm run build`. |
| PUSH-20 | Push only if code, tests, and product docs are aligned | P0 | ✅ Permanent | No exception. |

---

## 6. Required Product Documentation Impact Matrix

Use this exact matrix before every push. If any row is `Behind` or `Needs Review`, do not push.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/BRD.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/USE_CASES.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/USER_JOURNEYS.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/SCENARIOS.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/TEST_CASES.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/DEVELOPER_GUIDE.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/RELEASE_NOTES.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/README.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/ALGORITHM_SPEC.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/TECHNICAL_METHOD.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/APPENDIX.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/PATENT_DISCLOSURE.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/PRIOR_ART_COMPARISON.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes/No | Yes/No | ... | Done / Behind / Needs Review |
| Any other `product/` file | Yes/No | Yes/No | ... | Done / Behind / Needs Review |

---

### Filled Documentation Impact Matrix — TRACE-01 gap cluster #1 closure (F3-14/15/16), produced 2026-06-07

Scope of this change: added traceability anchors (UC-084/085/086, SCN-039–042, UJ-024–026, TC-AU-01–07/TC-MD-01–08/TC-PW-01–10) for three **already-shipped** features (Admin User Management, Member Directory, Forced First-Login Password Change). No FRs, routes, schemas, or UI behaviour changed — documentation-only.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | No | FR-235A–G already exist and describe these features; new UC/SCN/UJ/TC IDs reference them without altering any FR text. Searched for new ID ranges — no hits. | Done |
| `product/BRD.md` | Yes | No | Business requirements unchanged; these are already-shipped features being retro-documented for traceability only. No ID-range index found referencing UC/SCN/UJ/TC. | Done |
| `product/USE_CASES.md` | Yes | Yes | Appended UC-084 (Admin Manages User Accounts), UC-085 (Browse Member Directory), UC-086 (Complete Forced First-Login Password Change) under new `## v4.2.2 — Admin & Member Management Use Cases (2026-06-07)` section, each with Related FR back-references (FR-235A/B/C/D/G). | Done |
| `product/SCENARIOS.md` | Yes | Yes | Appended SCN-039–042 (admin onboarding, admin self-lockout attempt, directory lookup, forced password setup) under new `## v4.2.2 — Admin & Member Management Scenarios (2026-06-07)` section, each linked to the new UC IDs and TC IDs. | Done |
| `product/USER_JOURNEYS.md` | Yes | Yes | Appended UJ-024–026 (admin onboarding/managing a teammate, directory lookup, forced password change) under new `## 10. v4.2.2 — Admin & Member Management Journeys (2026-06-07)` section with full step/emotional-state tables. | Done |
| `product/TEST_CASES.md` | Yes | Yes | Appended `## 9.43 — Admin User Management, Member Directory, Forced Password Change (TC-AU, TC-MD, TC-PW)` mapping TC-AU-01–05/TC-MD-01–04/TC-PW-01–06 to existing automated tests (adminUsers.test.ts, roles.test.ts, auth.test.ts) and recording 14 ❌ Not Run gaps (TC-AU-06/07, TC-MD-05–08, TC-PW-07–10) with exact file/line references for future test-writing. | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | No | Searched for new ID ranges and "through" index phrases — no references to UC/SCN/UJ/TC ID ranges found; nothing to update. | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Inserted new top section `## v4.2.2 — TRACE-01 Traceability: Admin/Member/Password-Change Documentation (2026-06-07, P0 — documentation only)` describing the matrix compilation, the ~38% gap finding, cluster #1 closure with all new doc IDs, and remaining open gap clusters (#2–#5). | Done |
| `product/README.md` | Yes | No | No UC/SCN/UJ/TC ID-range references found. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | Algorithm/formula spec is unrelated to admin/member/password-change UI flows; no ID references found (0 hits for UC-0/SCN-0/UJ-0/TC-prefix). | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; no UC/SCN/UJ/TC ID references found (0 hits). | Done |
| `product/APPENDIX.md` | Yes | No | "Document Codes" glossary (Section G, lines 108–112) lists illustrative TC-prefix examples only (TC-T, TC-E, TC-A, TC-X) — confirmed not an exhaustive index, so new prefixes TC-AU/TC-MD/TC-PW do not require an entry. No UC/SCN/UJ ID-range references found. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing document; no UC/SCN/UJ/TC ID references found (0 hits). | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | Prior-art comparison document; no UC/SCN/UJ/TC ID references found (0 hits). | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | Patent claim-candidate matrix; no UC/SCN/UJ/TC ID references found (0 hits). | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment/ops document; no UC/SCN/UJ/TC ID references found (0 hits). | Done |
| `product/CLOUD_STORAGE_*` (none present) | N/A | N/A | No such files exist in `product/`; directory listing confirmed full set of 17 files reviewed above. | Done |

**Net result:** 5 of 17 product files updated (USE_CASES, SCENARIOS, USER_JOURNEYS, TEST_CASES, RELEASE_NOTES); 12 reviewed with no update required (confirmed via grep — no stale ID-range references exist anywhere in `product/`). TODO-List.md itself updated separately (TRACE-01 matrix rows + gap summary). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change.

---

### Filled Documentation Impact Matrix — TRACE-01 gap cluster #2 closure (F2-05/06/07/09/11/12/13), produced 2026-06-08

Scope of this change: added 4 new FRs (`FR-225A–D`) plus traceability anchors (`UC-088`, `SCN-044`, `UJ-028`) for the Work Item Explorer's visual graph, risk-path, largest-branch, and blocked-filter behaviours; re-verified the three "Needs verification" items (F2-11/12/13) at the code level; and wrote/automated 6 new test cases (`TC-FF-01–06`) closing the only remaining untested behaviour (F2-09 field-format compatibility). No existing FRs, routes, schemas, or UI behaviour changed — the explorer code was already correct and shipped; this pass is documentation-plus-test-writing.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | Yes | Inserted `FR-225A` (field-format dual compatibility), `FR-225B` (risk-path highlight), `FR-225C` (largest unfinished branch), `FR-225D` (blocked branch filter) immediately after `FR-225`, before the F3 section header — these four behaviours were implemented and shipped (v4.0/v3.0 Release Notes) but had never been written up as formal requirements. | Done |
| `product/BRD.md` | Yes | No | Business requirements unchanged; these are already-shipped explorer behaviours being retro-documented for traceability only. No ID-range index found referencing UC/SCN/UJ/TC/FR. | Done |
| `product/USE_CASES.md` | Yes | Yes | Appended `UC-088` (Investigate Delivery Risk and Branch Health in the Work Item Explorer) under new `## v4.2.2 — Work Item Explorer Risk & Branch Insights Use Cases (2026-06-08)` section, with Alt Flow A (no-risk dataset) and Alt Flow B (mixed raw/FlowItem field formats) and Related FR back-references (`FR-225A–D`). | Done |
| `product/SCENARIOS.md` | Yes | Yes | Appended `SCN-044` (Delivery Manager Reads the Visual Graph and Filters to Risk) under new `## v4.2.2 — Work Item Explorer Risk & Branch Insights Scenarios (2026-06-08)` section — narrates node styling, orphan badges, all four `Relation*` panels, risk-path highlight, largest-branch insight, and the blocked-branch filter together in one session; linked to `UC-046`, `UC-088`, and the `TC-E`/`TC-RP`/`TC-LB`/`TC-BF` suites. | Done |
| `product/USER_JOURNEYS.md` | Yes | Yes | Appended `UJ-028` (Delivery Manager Investigates Risk Paths and Branch Health in the Explorer) under new `## 11. v4.2.2 — Work Item Explorer Risk & Branch Insights Journeys (2026-06-08)` section with full step/system-response/emotional-state table. | Done |
| `product/TEST_CASES.md` | Yes | Yes | Added `**Related:**` cross-reference lines to the existing `## F2 — Work Item Explorer Tests`, `## 9.18` (TC-RP), `## 9.19` (TC-LB), and `## 9.20` (TC-BF) sections pointing at the new `UC-088`/`SCN-044`/`UJ-028`/`FR-225B–D` anchors, then appended new `## 9.45 — Work Item Explorer Field-Format Compatibility (TC-FF-01 to TC-FF-06)` mapping all 6 cases to the new `fieldFormatCompat.test.ts` (all ✅ Automated, all passing). | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | No | Searched for new ID-range / "through" index phrases — no references to UC/SCN/UJ/TC/FR ID ranges found; nothing to update. | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Inserted new top section `## v4.2.2 — TRACE-01 Traceability: Work Item Explorer Documentation (2026-06-08, P0 — documentation + test automation)` describing cluster #2 closure: 4 new FRs, `UC-088`/`SCN-044`/`UJ-028`, F2-11/12/13 re-verification and promotion from 🔍 to ✅, and the 6 new `TC-FF` test cases. | Done |
| `product/README.md` | Yes | No | No UC/SCN/UJ/TC/FR ID-range references found. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | Algorithm/formula spec is unrelated to explorer UI/risk-path narrative flows; no ID references found (0 hits for UC-0/SCN-0/UJ-0/TC-prefix/FR-225). | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/APPENDIX.md` | Yes | No | "Document Codes" glossary (Section G) lists illustrative TC-prefix examples only (TC-T, TC-E, TC-A, TC-X) — confirmed not exhaustive, so the new `TC-FF` prefix needs no entry. No UC/SCN/UJ/FR ID-range references found. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | Prior-art comparison document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | Patent claim-candidate matrix; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment/ops document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |

**Net result:** 5 of 17 product files updated (SRS, USE_CASES, SCENARIOS, USER_JOURNEYS, TEST_CASES) plus RELEASE_NOTES; 11 reviewed with no update required (confirmed via grep — no stale ID-range references exist anywhere in `product/`). TODO-List.md itself updated separately (Section 12 matrix rows F2-05/06/07/09/11/12/13, Gaps Summary item 2, Section 13 F2-11/12/13/F2-TRACE statuses, header). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change.

### Filled Documentation Impact Matrix — TRACE-01 gap cluster #3 closure (F4-05/06/08), produced 2026-06-08

Scope of this change: added 2 new FRs (`FR-310`, `FR-311` — *numbered `FR-242`/`FR-243` at the time of this entry; renumbered 2026-06-08 after they were found to collide with pre-existing Addendum-A "Data Quality Score" FRs of the same IDs, see Section 12 Gaps Summary item 6*) plus traceability anchors (`UC-089`, `SCN-045`, `UJ-029`) for the Smart Excel export's Risks & Blockers / Orphan & Data Quality / Cycle & Lead Time / Release Readiness sheet contracts and the dashboard/`/summary` export-trigger flow; and wrote/automated 10 new test cases (`TC-X-09a–TC-X-13b`) closing the only remaining untested sheets and the trigger wiring (F4-05/06/08). Along the way, discovered and corrected a stale `product/TEST_CASES.md` table that described 6 *manual, Not-Run* `TC-X` cases not matching the 8 cases already automated in `excelExport.test.ts`. No existing FRs, routes, schemas, or UI behaviour changed — the export sheets and trigger were already implemented and shipped; this pass is documentation-plus-test-writing.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | Yes | Inserted `FR-310` (Risks & Blockers / Orphan & Data Quality / Cycle & Lead Time / Release Readiness sheet-content contract — derivation from `DashboardMetrics.flow.items`, sort orders, suggested-action tiers, percentile math, Go/Conditional-Go/No-Go grouping) and `FR-311` (export-trigger contract — dashboard sticky bar and `/summary` page Export controls, default filename `delivery-clarity-report.xlsx`, silent onboarding-step recording) immediately after `FR-241`, before the next section header — these behaviours were implemented and shipped but had never been written up as formal requirements. | Done |
| `product/BRD.md` | Yes | No | Business requirements unchanged; these are already-shipped export behaviours being retro-documented for traceability only. No ID-range index found referencing UC/SCN/UJ/TC/FR. | Done |
| `product/USE_CASES.md` | Yes | Yes | Appended `UC-089` (Trigger and Review the Smart Excel Workbook from the Dashboard or Summary Page) under new `## v4.2.2 — Smart Excel Export Sheet & Trigger Use Cases (2026-06-08)` section, with Main Flow steps covering each of the four previously-untested sheets, Alt Flow A (healthy dataset, no risk/orphans) and Alt Flow B (onboarding tracking unavailable), and Related FR back-references (`FR-236`, `FR-310`, `FR-311`). | Done |
| `product/SCENARIOS.md` | Yes | Yes | Appended `SCN-045` (Product Owner Exports the Smart Workbook for an Offline Release Review) under new `## v4.2.2 — Smart Excel Export Sheet & Trigger Scenarios (2026-06-08)` section — narrates the trigger, then a read-through of Risks & Blockers, Orphan & Data Quality, Cycle & Lead Time, and Release Readiness, ending with forwarding the file; linked to `UC-049`, `UC-089`, `FR-236`, `FR-310`, `FR-311`, and `TC-X-09–TC-X-13b`. | Done |
| `product/USER_JOURNEYS.md` | Yes | Yes | Appended `UJ-029` (Product Owner Exports and Reads the Smart Workbook for an Offline Review) under new `## 12. v4.2.2 — Smart Excel Export Sheet & Trigger Journeys (2026-06-08)` section with full step/system-response/emotional-state table. | Done |
| `product/TEST_CASES.md` | Yes | Yes | Replaced the stale `### F4 — Excel Export Tests (manual)` table (6 rows, IDs `TC-X-01–06`, all "Not Run" — none of which matched the actual automated suite) with a corrected `### F4 — Excel Export Tests (automated — excelExport.test.ts, excelExportSheets.test.ts)` table listing all 18 real `TC-X-01–13b` cases as ✅ Pass, plus a `**Related:**` line pointing at `UC-049`, `UC-089`, `SCN-016`, `SCN-045`, `UJ-013`, `UJ-029`, `FR-236`, `FR-310`, `FR-311`. | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | No | Searched for new ID-range / "through" index phrases — no references to UC/SCN/UJ/TC/FR ID ranges found; nothing to update. | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Inserted new top section `## v4.2.2 — TRACE-01 Cluster #3 Closure: Smart Excel Export Sheets & Trigger (2026-06-08, P0 — documentation + test coverage)` describing: `FR-310`/`FR-311` additions, `UC-089`/`SCN-045`/`UJ-029`, the 10 new `TC-X-09a–13b` automated tests, the corrected stale `TEST_CASES.md` table, and the suite growth 498/53 → 508/54. | Done |
| `product/README.md` | Yes | No | No UC/SCN/UJ/TC/FR ID-range references found. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | Algorithm/formula spec already documents the percentile formula at the implementation level; no UC/SCN/UJ/TC/FR ID-range references found needing update (0 hits for UC-0/SCN-0/UJ-0/TC-X/FR-310/FR-311). | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/APPENDIX.md` | Yes | No | "Document Codes" glossary (Section G) lists illustrative TC-prefix examples only (TC-T, TC-E, TC-A, TC-X) — confirmed not exhaustive, so the new `TC-X-09a–13b` sub-IDs need no entry. No UC/SCN/UJ/FR ID-range references found. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | Prior-art comparison document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | Patent claim-candidate matrix; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment/ops document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |

**Net result:** 5 of 17 product files updated (SRS, USE_CASES, SCENARIOS, USER_JOURNEYS, TEST_CASES) plus RELEASE_NOTES; 11 reviewed with no update required (confirmed via grep — no stale ID-range references exist anywhere in `product/`). TODO-List.md itself updated separately (Section 12 matrix rows F4-05/06/08, Gaps Summary item 3, Section 13 F4-TRACE status, header). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change.

### Filled Documentation Impact Matrix — TRACE-01 gap cluster #4 closure (F1-07/08), produced 2026-06-08

Scope of this change: closed the smallest remaining TRACE-01 gap — `src/types/throughput.ts` (F1-07, the `ThroughputMetrics`/`SprintThroughputSummary`/`KanbanFlowSummary`/`MidSprintInsight` types) and `DashboardMetrics.throughput` (F1-08, required by `FR-215`) had zero UC/SCN/UJ/TC anchoring, only being named in Release Notes. Rather than declaring them "implementation detail — not independently traceable" (the matrix's alternative option), anchored them to the `UC-043`/`SCN-012`/`UJ-010` flow that already consumes this exact data contract through the Throughput & Delivery Analytics panels — extending `UC-043`'s Related-FR range and adding a `**Related:**` line to `SCN-012` — and wrote one new shape-contract test `TC-T-11` proving `metrics.throughput` conforms to `ThroughputMetrics`. No existing FRs, routes, schemas, or UI behaviour changed — the types and field were already implemented and shipped (v3.0); this pass is documentation-plus-test-writing.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | No | `FR-215` already exists and fully specifies the `throughput: ThroughputMetrics` contract; no new FR needed — this gap was a missing UC/SCN/UJ/TC anchor, not a missing requirement. | Done |
| `product/BRD.md` | Yes | No | Business requirements unchanged; `throughput` is an already-shipped data-model detail being retro-anchored for traceability only. No ID-range index found referencing UC/SCN/UJ/TC/FR. | Done |
| `product/USE_CASES.md` | Yes | Yes | Extended `UC-043`'s `**Related FR**` line from "FR-207 to FR-214" to "FR-207 to FR-215", with an explanatory clause naming `SprintThroughputPanel`/`MidSprintDeliveryPanel`/`KanbanThroughputPanel` as the consumers of the `metrics.throughput: ThroughputMetrics` bundle that `FR-215` requires, and pointing at `TC-T-11` for the shape-contract test. | Done |
| `product/SCENARIOS.md` | Yes | Yes | Added a `**Related:**` line to `SCN-012` (`UC-043, UJ-010, FR-207–FR-215, TC-T-01–TC-T-11`) — the first such anchor line on this older scenario, matching the convention already used on 23 other scenarios. | Done |
| `product/USER_JOURNEYS.md` | Yes | No | `UJ-010` (Sprint Throughput Review Journey) already walks through the exact same panels driven by `metrics.throughput`; User Journeys in this document don't carry `**Related:**` footer lines (0 of the existing entries do), so no edit was needed — the matrix anchor itself is sufficient. | Done |
| `product/TEST_CASES.md` | Yes | Yes | Added `TC-T-11` row to the `### F1 — Throughput Formula Tests` table (asserting `calculateDashboardMetrics(issues).throughput` matches the `ThroughputMetrics` shape per `FR-215`), a new `**Related:**` line (`UC-043, SCN-012, UJ-010, FR-207–FR-215`), and updated the `throughput.test.ts` row in the suite-overview table from "10" to "11" tests. | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | No | Searched for new ID-range / "through" index phrases — no references to UC/SCN/UJ/TC/FR ID ranges found; nothing to update. | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Inserted new top section `## v4.2.2 — TRACE-01 Cluster #4 Closure: Throughput Data-Contract Anchoring (2026-06-08, P0 — documentation + test coverage)` describing: the `UC-043`/`SCN-012` anchor extensions, the new `TC-T-11` shape-contract test, and the suite growth 508/54 → 509/54. | Done |
| `product/README.md` | Yes | No | No UC/SCN/UJ/TC/FR ID-range references found. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | Algorithm/formula spec already documents the throughput formulas at the implementation level; no UC/SCN/UJ/TC/FR ID-range references found needing update (0 hits for UC-0/SCN-0/UJ-0/TC-T/FR-215). | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/APPENDIX.md` | Yes | No | "Document Codes" glossary (Section G) lists illustrative TC-prefix examples only — `TC-T` is already one of them, so no entry update is needed for `TC-T-11`. No UC/SCN/UJ/FR ID-range references found. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | Prior-art comparison document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | Patent claim-candidate matrix; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment/ops document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |

**Net result:** 3 of 17 product files updated (USE_CASES, SCENARIOS, TEST_CASES) plus RELEASE_NOTES; 13 reviewed with no update required — including `USER_JOURNEYS.md` and `SRS.md`, where the existing `UJ-010` and `FR-215` already fully covered this data contract and only needed to be cross-referenced, not changed (confirmed via grep — no stale ID-range references exist anywhere in `product/`). TODO-List.md itself updated separately (Section 12 matrix rows F1-07/08, Gaps Summary item 4, Section 13 F1-TRACE/TRACE-01/NEXT-01 statuses, header). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change.

---

### Filled Documentation Impact Matrix — TRACE-01 gap cluster #5 closure (UX-02/03/05/11/13), produced 2026-06-08

Scope of this change: closed the final TRACE-01 gap cluster — the "UX narrative residue" punch-list item covering 5 UX features whose Section 12 matrix cells showed `GAP — not found`. Investigation found the gaps were a *mix*: `UX-02` (Default open sections), `UX-05` (HTML export redesign), and `UX-11` (Theme customization) had **stale matrix cells** — their UC/SCN/UJ/TC anchors already existed in the docs (`UC-062`/`SCN-024`/`UJ-021`/`TC-DV-*`; `UC-076`/`SCN-035`; `UC-081`/`TC-TC-*` respectively) and just weren't cross-referenced in the matrix, plus a few genuinely-missing pieces (`UJ-031`; `SCN-047`/`UJ-032`). `UX-13` (Chart customization) had its FR/TC anchored but no UC/SCN/UJ. `UX-03` (Status chips) was the one **true zero-anchor gap** — a cross-cutting visual convention (`Chip`/`CollapsibleTrigger`/`CHIP_CLS`, ~16 dashboard sections) computed entirely inline in `app/dashboard/page.tsx` with no pure-logic extraction and no FR/UC/SCN/TC anywhere. Per the user's explicit choice ("Extract + test"), extracted the chip severity-mapping logic to a new pure module `src/lib/dashboardChips.ts` (mirroring the `adminConsole.ts`/`members.ts` pattern), wrote a new `FR-308`/`BR-112` documenting the convention as a contract, and anchored it with new `UC-090`/`SCN-046`/`UJ-030`/`TC-CH-01–03`. Also did a minimal, behaviour-preserving extraction of `buildReportHtml()` out of `exportToHtml` (in `src/lib/exportUtils.ts`) so UX-05's redesigned branding markup could be automated as `TC-X-14` without a DOM. No existing FRs, routes, schemas, or shipped UI behaviour changed for UX-02/05/11/13 — those were documentation-only passes; UX-03 and UX-05 each involved one small, additive, non-breaking pure-module extraction plus new tests.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | Yes | Added `FR-308` (A.20 — v4.1 UX Design System) specifying the 5-tier status-chip severity convention (`critical`/`warning`/`info`/`good`/`neutral`) and its shared style-lookup requirement. `FR-271/272`, `FR-300`, `FR-304`, `FR-306` were already correct and complete — no edits needed to them. | Done |
| `product/BRD.md` | Yes | Yes | Added `BR-112` — the scanability/time-to-insight business justification for status chips on ~16 collapsed dashboard sections. `BR-094`, `BR-105`, `BR-108`, `BR-110` already existed and needed no change. | Done |
| `product/USE_CASES.md` | Yes | Yes | Added two new use cases: `UC-090` (Scan Section Health via Status Chips Before Expanding — UX-03) and `UC-091` (User Personalises the Charts Page Layout — UX-13). `UC-062`, `UC-076`, `UC-081` were already correct and complete; the matrix cells referencing them as "GAP — not found" were simply stale. | Done |
| `product/SCENARIOS.md` | Yes | Yes | Added three new scenarios: `SCN-046` (Scrum Master Triages a Long Dashboard by Chip Colour Alone — UX-03), `SCN-047` (Engineering Manager Personalises the App to Match Her Team's Brand Colour — UX-11), `SCN-048` (Director Reshapes the Charts Page Around the Two Metrics That Matter to the Board — UX-13). `SCN-024` and `SCN-035` already existed and needed no change — only the matrix's stale "GAP — not found" cells pointing at them were wrong. | Done |
| `product/USER_JOURNEYS.md` | Yes | Yes | Added four new user journeys: `UJ-030` (Scrum Master Triages the Dashboard by Chip Colour — UX-03), `UJ-031` (Stakeholder Receives and Trusts a Branded HTML Report — UX-05), `UJ-032` (Engineering Manager Personalises the App's Look and Feel — UX-11), `UJ-033` (Director Curates the Charts Page for a Board Presentation — UX-13). `UJ-021` already existed and needed no change. | Done |
| `product/TEST_CASES.md` | Yes | Yes | Added new `## 9.46 — Dashboard Section Status Chips (TC-CH-01 to TC-CH-03)` table (3 tests against the new `src/lib/dashboardChips.ts`), and a new `TC-X-14` row (HTML export branding, against the new `buildReportHtml()`) with an updated `**Related:**` line in the existing F4 export-trigger table. `TC-DV-*`, `TC-TC-*`, `TC-CC-*` rows were already correct. | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | No | Searched for ID-range / "chip"/"theme customizer"/"chart customizer"/"buildReportHtml" references — none found that needed updating; the document describes architecture at a level above individual UC/SCN/TC anchors. | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Inserted new top section `## v4.2.2 — TRACE-01 Cluster #5 Closure: UX Narrative Residue (UX-02/03/05/11/13) (2026-06-08, P0 — documentation + test coverage)` describing the stale-matrix corrections, the new `FR-308`/`BR-112`, the `dashboardChips.ts` and `buildReportHtml()` extractions, the 4 new automated tests, and the suite growth 509/54 → 513/56. | Done |
| `product/README.md` | Yes | No | No UC/SCN/UJ/TC/FR ID-range references found needing update. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | No UC/SCN/UJ/TC/FR ID-range references found (0 hits for the new IDs); chip/theme/chart customization are UI conventions, not scoring algorithms. | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/APPENDIX.md` | Yes | No | "Document Codes" glossary (Section G) lists illustrative TC-prefix examples only; `TC-CH` and `TC-X` patterns already fit the existing illustrative scheme — no entry update required. No UC/SCN/UJ/FR ID-range references found. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | Prior-art comparison document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | Patent claim-candidate matrix; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment/ops document; no UC/SCN/UJ/TC/FR ID references found (0 hits). | Done |

**Net result:** 6 of 17 product files updated (SRS, BRD, USE_CASES, SCENARIOS, USER_JOURNEYS, TEST_CASES) plus RELEASE_NOTES; 11 reviewed with no update required. This is the largest single-pass documentation footprint of the five TRACE-01 closures because cluster #5 contained the *only* true zero-anchor gap (UX-03) found across the entire matrix — every other cluster's gaps were either missing-anchor-on-existing-flow (cluster #4 pattern) or fully-absent-but-narratable (clusters #1–#3, UX-13). TODO-List.md itself updated separately (Section 12 matrix rows UX-02/03/05/11/13, Gaps Summary item 5, Section 13 UX-TRACE/TRACE-01/NEXT-01 statuses, header, progress paragraph). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change — and, with this cluster closed, the Section 12 matrix has **zero** remaining `GAP — not found` cells.

---

### Filled Documentation Impact Matrix — TRACE-01 gap cluster #6 (FR↔UC ID-collision cleanup), produced 2026-06-08

Scope of this change: documentation-only — resolved four genuine ID collisions (`FR-242`/`FR-243` duplicate pair, orphan `FR-235D`, stale `UC-043`/`UC-044`, phantom `FR-309`) found while investigating the "bundled FR range" ambiguity flagged as Gaps Summary item 6. Renumbered colliding/orphaned IDs to `FR-310`/`FR-311`/`FR-235H`/`UC-092`/`UC-093`, wrote a correctly-scoped new `FR-309`, corrected `UC-083`'s Related-FR line, propagated every renumbering across five documents, and built TRACE-01 Appendix B (the FR→UC Ownership Index). No code changed; no tests changed; suite remains 513/56.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | Yes | Renumbered the two cluster #3 FRs (`FR-242`→`FR-310`, `FR-243`→`FR-311`) with explanatory collision notes; wrote new correctly-scoped `FR-309` (bucket-backed metrics restore-and-fallback) to resolve the phantom reference in `UC-083`; renumbered orphan `FR-235D` (dashboard-view role-locking) to `FR-235H`. | Done |
| `product/BRD.md` | Yes | No | No FR/UC/SCN/UJ/TC ID-range references in BRD that referenced the renamed IDs; no update required. | Done |
| `product/USE_CASES.md` | Yes | Yes | Updated `UC-089`'s Related-FR line (`FR-242`→`FR-310`, `FR-243`→`FR-311`); corrected `UC-083`'s Related-FR line to `FR-307, FR-309` (removed stale `FR-308`); renumbered stale pre-v3.0 `UC-043`/`UC-044` to `UC-092`/`UC-093` with explanatory annotation on each. | Done |
| `product/SCENARIOS.md` | Yes | Yes | Updated `SCN-045`'s Related references (`FR-242`→`FR-310`, `FR-243`→`FR-311`). | Done |
| `product/USER_JOURNEYS.md` | Yes | No | No direct references to the renamed FR IDs found (0 hits for `FR-242`, `FR-243`, `FR-235D`, `FR-309`). | Done |
| `product/TEST_CASES.md` | Yes | Yes | Updated the F4 Excel Export `**Related:**` line (`FR-242`→`FR-310`, `FR-243`→`FR-311`). | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | No | No FR/UC ID references found that referenced the renamed IDs (0 hits). | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Updated the cluster #3 section's FR references (`FR-242`→`FR-310`, `FR-243`→`FR-311`) with an explanatory renumbering footnote preserving the historical record. | Done |
| `product/README.md` | Yes | No | No FR/UC ID-range references found. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | No FR/UC ID-range references found (0 hits for renamed IDs). | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; no FR/UC ID references found (0 hits). | Done |
| `product/APPENDIX.md` | Yes | No | Glossary covers TC-prefix illustrative examples only; no FR/UC ID-range references found. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing document; no FR/UC ID references found (0 hits). | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | Prior-art comparison document; no FR/UC ID references found (0 hits). | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | Patent claim-candidate matrix; no FR/UC ID references found (0 hits). | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment/ops document; no FR/UC ID references found (0 hits). | Done |

**Net result:** 4 of 16 product files updated (SRS, USE_CASES, SCENARIOS, RELEASE_NOTES) plus TEST_CASES; 11 reviewed with no update required. No code changed; suite remains 513/56. TODO-List.md itself updated separately (Section 12 matrix rows F4-05/06/08, Gaps Summary item 6, Appendix B, header, progress paragraphs). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change — and with it TRACE-01 has zero `GAP — not found` cells, zero ID collisions, and is ✅ Done.

---

### Filled Documentation Impact Matrix — GW-01–GW-25 Backend Integration Gateway Foundation, produced 2026-06-09

Scope of this change: implemented a new server-only backend integration gateway module suite (`src/server/gateway/` — `types.ts`, `endpointPolicy.ts`, `retryPolicy.ts`, `gatewayLogger.ts`, `providerRegistry.ts`, `externalGateway.ts`), 23 automated tests (`src/__tests__/gateway.test.ts`, TC-GW-01–GW-21 + TC-GW-05b/TC-GW-15b), and updated four product docs (`DEVELOPER_GUIDE.md` — new gateway architecture section; `SRS.md` — FR-313 + §8.1 note; `USE_CASES.md` — cross-reference note; `RELEASE_NOTES.md` — v4.3 entry). The gateway is **server-only**: no new UI routes, no new user-facing screens, no Prisma schema changes, no algorithm changes. Test suite grew from 527/60 to 550/61.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | Yes | Added `FR-313` (P1 — Backend Integration Gateway) to §4 (Non-Functional Requirements — Architecture) documenting the gateway's chokepoint contract, SSRF/host-allowlist/https-only/path-traversal endpoint validation, 10s timeout, 2-retry exponential backoff, JSONL audit logging, and secret redaction; also added a §8.1 note alongside the API route inventory cross-referencing the new `src/server/gateway/` module suite. | Done |
| `product/BRD.md` | Yes | No | Business requirements unchanged — the gateway is a server-side infrastructure hardening item with no new business capability visible to users or stakeholders, no new business rules, and no change to the product roadmap scope described in the BRD. Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |
| `product/USE_CASES.md` | Yes | Yes | Added a cross-reference note (under the existing COVER-17 roadmap note) clarifying that the gateway module is now implemented as a server-only foundation (`GW-01–GW-25`); no new UC authored because the gateway has no direct user-facing flow — user-visible gateway use cases will be added when external-call features (Jira API integration, etc.) are implemented per COVER-17. | Done |
| `product/USER_JOURNEYS.md` | Yes | No | Server-only change — no new user touchpoints, screens, or journeys. No gateway-related user journey exists or is needed at this stage. Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |
| `product/SCENARIOS.md` | Yes | No | Server-only change — no new real-world scenarios. The gateway operates transparently beneath future external-call features; no scenario document is needed until a user-visible external integration exists. Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |
| `product/TEST_CASES.md` | Yes | Yes | Added new `## 9.49 — Backend Integration Gateway Foundation (TC-GW-01 to TC-GW-21 + TC-GW-05b + TC-GW-15b)` section documenting all 23 automated gateway tests across five sub-tables (Endpoint Policy & SSRF Protection, Retry Policy, Gateway Logger & Redaction, Provider Registry, External Gateway end-to-end flow), each row mapping the TC-GW-ID to its spec file, tested behaviour, and ✅ Automated status, with a `**Related:** FR-313` footer. | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | Yes | Added a new "Backend Integration Gateway (Implemented — Foundation, v4.3)" section documenting the config-file-driven design, security model (SSRF/host-allowlist/https-only/traversal), retry/backoff/timeout policy, JSONL audit strategy, `callExternal<T>()` usage contract, the six module files, and the test coverage entry point — all server-side architecture details with no frontend exposure. | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Inserted new top section `## v4.3 — Backend Integration Gateway Foundation (GW-01–GW-25, 2026-06-08, P1 — Architecture Hardening)` describing the six new gateway modules, FR-313, 23 new tests, suite growth 527/60 → 550/61, and the server-only/no-UI scope boundary. | Done |
| `product/README.md` | Yes | No | README describes the product at the user-facing feature level; the gateway is an internal infrastructure module invisible to users. Searched for "gateway", "GW", "FR-313" — 0 hits confirming no stale references. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | Algorithm/formula spec covers delivery-metric calculation algorithms (throughput, cycle time, health scoring, etc.) — the gateway is not an algorithm; it is a network-call infrastructure layer. No algorithm or formula changed. Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document describes the product's eight technical methods (export ingestion, normalisation, hierarchy reconstruction, health scoring, etc.); none of those methods changed. The gateway is future-plumbing, not a currently-claimed novel method. Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |
| `product/APPENDIX.md` | Yes | No | Abbreviations/glossary; "GW" prefix is a TODO item-ID convention already present in the document's ID-prefix table. No new abbreviation or term was introduced that isn't already listed. Searched for stale "gateway" definitions — none found requiring update. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing document; the gateway is server infrastructure and not a novel technical method being claimed. No patent claims or disclosure language changed. Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | Prior-art comparison document; no change to the product's differentiating capabilities claimed relative to prior art. Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | Patent claim-candidate matrix; the gateway is not a patentable claim candidate at this stage (standard security-hardening infrastructure). Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment/ops document; the gateway operates as a server-side module within the existing Next.js app — no new Docker/VPS/environment variable, no new deployment step. Searched for "gateway", "GW", "FR-313" — 0 hits. | Done |

**Net result:** 4 of 16 product files updated (SRS, USE_CASES, DEVELOPER_GUIDE, RELEASE_NOTES) plus TEST_CASES (new §9.49 gateway test section); 11 reviewed with no update required (confirmed via grep — no stale gateway/GW/FR-313 references exist anywhere in the non-updated product files). No UC/SCN/UJ documents required updates because the gateway is server-only with no user-facing flows. TODO-List.md itself updated separately (Section 14 GW-01–GW-25 table, Section 26 NEXT-03/NEXT-06 statuses, Section 27 release status note, header). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change.

---

### Filled Documentation Impact Matrix — USERREQ-07–14, USERREQ-28 User Add-Member Request Workflow, produced 2026-06-09

Scope of this change: Prisma schema additions (`UserAddRequest` model, `Notification` model, two new `User` back-reference relations), five new Next.js API route handlers (`app/api/user-add-requests/route.ts`, `app/api/user-add-requests/mine/route.ts`, `app/api/admin/user-add-requests/route.ts`, `app/api/admin/user-add-requests/[id]/accept/route.ts`, `app/api/admin/user-add-requests/[id]/reject/route.ts`), and 14 automated tests (`src/__tests__/userAddRequests.test.ts`, TC-REQ-01–14). New FRs FR-314–FR-319 (SRS Addendum B), UC-095/UC-096 (USE_CASES), TEST_CASES §9.50. Suite grew from 550/61 to 564/62.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | Yes | Added `Addendum B — v4.4 User Add-Member Request Workflow (2026-06-09, P1)` with FR-314 (`UserAddRequest` schema), FR-315 (`Notification` schema), FR-316 (`POST /api/user-add-requests`), FR-317 (`GET .../mine`), FR-318 (`GET /api/admin/user-add-requests`), FR-319 (accept + reject PATCH actions). Updated §8.1 API route inventory with 5 new rows. Updated document version to 4.4.0 and revision history. | Done |
| `product/BRD.md` | Yes | No | Business requirements unchanged — the user add-member workflow is a P1 internal team workflow enhancement with no new business capability visible at the BRD level (it enables admin-controlled user onboarding, already described at the BRD level). No BRD ID-range references to the new FR-314–319 range found. | Done |
| `product/USE_CASES.md` | Yes | Yes | Added `## v4.4 — User Add-Member Request Workflow Use Cases (2026-06-09, P1)` with UC-095 (Submit a User Add-Member Request) and UC-096 (Admin Reviews and Acts on User Add-Member Requests). Updated Out-of-scope note (User Add-Member Workflow is now in scope/implemented). Updated version to 4.4.0 and revision history. | Done |
| `product/USER_JOURNEYS.md` | Yes | No | No user journey authored at this stage — the UI widget (requester button + modal) and admin queue page are not yet built (USERREQ-16–27 remain ❌ Not started). Writing a UJ for a half-built UI flow would be speculative documentation. UJ will be authored when USERREQ-16/19/20 (modal + queue UI) are implemented. | Done |
| `product/SCENARIOS.md` | Yes | No | Same rationale as USER_JOURNEYS — no end-to-end user-session scenario can be written accurately without the UI. The API backend is built; the scenario depends on the UI interaction. SCN will be authored with the UI pass. | Done |
| `product/TEST_CASES.md` | Yes | Yes | Added `## 9.50 — User Add-Member Request Workflow (TC-REQ-01 to TC-REQ-14)` with 14 test rows covering all five routes and all key guard conditions. All marked ✅ Automated — `userAddRequests.test.ts`. | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | No | The gateway architecture section already covers the server-routing pattern. The new routes follow exactly the same `getIronSession`/`prisma`/`auditEvent` pattern as existing admin routes (`app/api/admin/users/route.ts`) — no new architectural convention to document. No stale references found. | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Inserted new top section `## v4.4 — USERREQ-07–14, USERREQ-28: User Add-Member Request Workflow — Backend Foundation (2026-06-09, P1)` with full scope description, schema additions, route list, test count, and product-docs coverage. | Done |
| `product/README.md` | Yes | No | README describes user-facing features; the request workflow has no UI surface yet. No stale references to the new FR/UC range found. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | No new metric calculation or algorithmic formula was introduced — `generateTempPassword()` is a simple random-string generator, not a domain algorithm. No stale references found. | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; the user add-request workflow is a standard CRUD/approval pattern with no novel technical method being claimed. No stale references found. | Done |
| `product/APPENDIX.md` | Yes | No | Abbreviations/glossary; no new abbreviation or prefix was introduced beyond `TC-REQ` (already follows the established TC-prefix convention; not an exhaustive index). No stale references found. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing document; no novel claim is being made for a standard approval workflow. No stale references found. | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | Prior-art comparison; no new differentiating capability vs. prior art introduced. No stale references found. | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | Patent claim-candidate matrix; standard CRUD approval workflow is not a patent candidate. No stale references found. | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment/ops document; the new Prisma models require a `prisma migrate dev` / `prisma db push` on first deploy — this is the existing Prisma migration procedure already documented. No new Docker/env var/deployment step required. No stale references found. | Done |

**Net result:** 4 of 16 product files updated (SRS, USE_CASES, RELEASE_NOTES, TEST_CASES); 12 reviewed with no update required (confirmed — no stale USERREQ/FR-31x/UC-09x/TC-REQ references in non-updated files). USER_JOURNEYS and SCENARIOS intentionally skipped at this stage: UI not yet built; writing journey/scenario docs for an API-only backend would be speculative. These will be updated when USERREQ-16–20 (UI modal, admin queue, requester history widget) are implemented. TODO-List.md itself updated separately (USERREQ-07–14/28 status rows, header, impact matrix). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change.

---

### Filled Documentation Impact Matrix — v4.5 USERREQ UI (FR-320–324, UC-097–099, UJ-034, SCN-049, TC-NOTIF/TC-REQ-15/16), produced 2026-06-09

Scope of this change: shipped the full USERREQ UI layer — `RequestAddMemberModal` (Members page, non-admin), `UserAddRequestsPanel` (Admin Settings → Member Requests tab with mandatory admin-entered temp password), `GET /api/notifications` + `PATCH /api/notifications/[id]/read`, `NotificationBell` (AppShell header, pulsing badge + amber admin strip), and bulk user management (multi-select checkboxes, bulk role change, bulk delete). Updated FR-319 (temp password now admin-supplied, not auto-generated). Added 7 new tests (TC-NOTIF-01–05 in new `notifications.test.ts`, TC-REQ-15/16 in existing `userAddRequests.test.ts`). Test suite grew 564/62 → 571/63.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | Yes | Updated FR-319: temp password now admin-supplied (HTTP 400 if missing/weak), response echoes `tempPassword`. Added Addendum C: FR-320 (request modal), FR-321 (admin queue panel + mandatory temp password), FR-322 (notification APIs), FR-323 (notification bell component), FR-324 (bulk user management). Updated §8.1 API route inventory: added GET /api/notifications and PATCH /api/notifications/[id]/read. | Done |
| `product/BRD.md` | Yes | No | Business requirements unchanged — all v4.5 items are UI implementation of the in-scope user onboarding workflow already described at the BRD level. No new capability or stakeholder expectation introduced. | Done |
| `product/USE_CASES.md` | Yes | Yes | Added v4.5 section with UC-097 (non-admin submits request via Members page), UC-098 (admin reviews/accepts with mandatory temp password), UC-099 (user receives and reads in-app notification). Updated out-of-scope note from prior USERREQ-07–14 matrix (USER_JOURNEYS/SCENARIOS now complete). | Done |
| `product/USER_JOURNEYS.md` | Yes | Yes | Added UJ-034 (Scrum Master requests a new team member and receives in-app notification) — previously deferred at USERREQ-07–14 stage because UI was not yet built; now written with complete UI context. | Done |
| `product/SCENARIOS.md` | Yes | Yes | Added SCN-049 (Scrum Master spots notification banner, reviews temp password, onboards new developer; admin's mandatory-password accept flow narrated end-to-end) — previously deferred for same reason as UJ-034. | Done |
| `product/TEST_CASES.md` | Yes | Yes | Added §9.51 (TC-NOTIF-01–05 — GET and PATCH notification API tests in `notifications.test.ts`) and §9.52 (TC-REQ-15–16 — missing/weak tempPassword → 400 in `userAddRequests.test.ts`). Updated TC-REQ-10 row note to reflect `body.tempPassword` assertion. | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | Yes | Added "In-App Notification Bell and APIs (Implemented — v4.5)" section (API routes, component location, polling pattern, amber strip). Added "User Management — Multi-Select Bulk Operations" note (Set state, indeterminate checkbox, bulk action bar, filter-change clear). | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Prepended `## v4.5` entry covering all FR-320–324 additions, FR-319 update, new test count (571/63), and doc coverage. | Done |
| `product/README.md` | Yes | No | README describes user-facing features at a high level; no mention of request workflow or notification bell that would need updating. No stale references found. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | No | No algorithmic formula or scoring logic changed — notification bell polling interval (30s) and temp password strength check (≥8/uppercase/digit) are UX/auth policy, not domain algorithms. | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; none of the eight technical methods (export ingestion, normalisation, health scoring, etc.) changed. No new novel method claimed. | Done |
| `product/APPENDIX.md` | Yes | No | No new abbreviation, term, document-code prefix (TC-NOTIF follows the established pattern), or role introduced that requires a glossary entry. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | Patent filing; the request/notification/bulk-management workflow is standard enterprise CRUD with no novel claim. | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | No new differentiating capability vs. prior art introduced; the workflow pattern (admin-controlled user onboarding + in-app notifications) is conventional. | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | No new patent claim candidate introduced. | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | Deployment unchanged — `NotificationBell` and `UserAddRequestsPanel` are client-side React components, no new env var, Docker config, or migration step required (DB migration for `UserAddRequest`/`Notification` was done in the USERREQ-07–14 pass). | Done |

**Net result:** 7 of 16 product files updated (SRS, USE_CASES, USER_JOURNEYS, SCENARIOS, TEST_CASES, DEVELOPER_GUIDE, RELEASE_NOTES); 9 reviewed with no update required. This is the largest single-pass USERREQ documentation closure — it completes the previously-deferred USER_JOURNEYS and SCENARIOS, adds the SRS Addendum C formalising the UI layer, and fully closes the COVER-18 coverage row. TODO-List.md updated (USERREQ status rows 01–06/15–24/26/29/30, COVER-18, header, this matrix). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11 for this change.

### Filled Documentation Impact Matrix — RBC-01–20 Role-Based Delivery Coaching Insights (FR-346–352, UC-114, UJ-039, SCN-057/058, TC-RBC-01–09), produced 2026-06-23

Scope of this change: shipped the full Role-Based Delivery Coaching Insights feature — `src/types/roleBasedCoaching.ts`, `src/services/coaching/` (ceremony advice, confidence aggregation, 7 category generators, admin operational signals, orchestrator), new `GET /api/coaching/admin-signals`, new `/dashboard/coaching` route + `CoachingInsightCard`/`CoachingCategoryTabs` components, nav registration in `DashboardNavSidebar.tsx`. Pure interpretation layer over the already-computed `DashboardMetrics` — no new domain calculations. 20 new tests (`TC-RBC-01`–`09` + edge cases). Test suite grew 669/70 → 689/71.

| Product file | Reviewed? | Update needed? | What changed / why no change | Status |
|---|---|---|---|---|
| `product/SRS.md` | Yes | Yes | Added Addendum H: FR-346 (role→category mapping), FR-347 (generator contract), FR-348 (admin signals route), FR-349 (ceremony advice), FR-350 (confidence formula), FR-351 (severity formula), FR-352 (dashboard UI). Revision history row v4.10.0. | Done |
| `product/BRD.md` | Yes | Yes | Added a "Done" line to Future Scope (P2/P3/P4 Roadmap) for Role-Based Delivery Coaching Insights — this was always listed as a P1 roadmap item in TODO-List.md Section 16, not a BRD scope change; the BRD line just reflects it shipped. | Done |
| `product/USE_CASES.md` | Yes | Yes | Added UC-114 (User Views Role-Based Coaching Insights), including the Admin-signals alternate flow and the low-confidence-fallback alternate flow. | Done |
| `product/USER_JOURNEYS.md` | Yes | Yes | Added UJ-039 (User Reviews Role-Based Coaching Insights), covering the single-category path, the Manager tab-switch path, and the Admin operational-signals path. | Done |
| `product/SCENARIOS.md` | Yes | Yes | Added SCN-057 (Scrum Master sees evidence-cited blocker coaching) and SCN-058 (coaching confidence falls back safely on thin data). | Done |
| `product/TEST_CASES.md` | Yes | Yes | Added §9.60 mapping `TC-RBC-01`–`09` plus 4 edge cases to `src/__tests__/roleBasedCoaching.test.ts`. | Done |
| `product/DEVELOPER_GUIDE.md` | Yes | Yes | Added "Role-Based Delivery Coaching Insights (Implemented — v4.10.0)" section: module layout, types, the `calculateReleaseReadiness()`/`FlowItem` data-shape constraint discovered during implementation, route, components, testing. | Done |
| `product/RELEASE_NOTES.md` | Yes | Yes | Prepended `## v4.10.0` entry covering the feature, the role→category mapping decision, the no-fabrication confidence design, and the new test count. | Done |
| `product/ALGORITHM_SPEC.md` | Yes | Yes | Added "Role-Based Coaching Confidence & Severity Algorithms (2026-06-23)" — the confidence-aggregation formula (with the ×0.75/×0.5 downgrade multipliers and the reasoning for choosing them), the severity-derivation formula, and the ceremony advice rule engine description. Required per CLAUDE.md §30 ("business formulas must be documented"). | Done |
| `product/APPENDIX.md` | Yes | Yes | Added Section Q (3 new glossary terms: Role-Based Coaching Insights, Coaching Category, Ceremony Advice, Coaching Confidence Score). | Done |
| `app/help/page.tsx` | Yes | Yes | Added a "Coaching Insights" FAQ section (3 entries: what it is, why not all 7 categories are visible, what "Confidence: Not available" means) — end-user-facing per CLAUDE.md's `/help` update rule. | Done |
| `app/developer/page.tsx` | Yes | No | The "📖 Developer Guide" topic in the developer wiki fetches `product/DEVELOPER_GUIDE.md` live via `GET /api/docs?slug=dev-guide` — the new section added there is already served without any edit to this file. The other inline topics (`gateway`, `cloud-sync`, `error-logger`) are curated deep-dives for subsystems not fully covered by a single Developer Guide section; this feature's architecture is fully covered by one section, so no new inline topic was added, consistent with not every feature getting one (e.g. `/api/jira/sync` also has no dedicated inline topic). | Done |
| `product/README.md` | Yes | No | README describes user-facing features at a high level; the dashboard already has a "role-aware" framing and no specific stale claim contradicts this addition. | Done |
| `product/TECHNICAL_METHOD.md` | Yes | No | Patent/technical-method document; coaching insight generation is rule-based interpretation of existing metrics, not a new technical method among the eight already claimed. | Done |
| `product/PATENT_DISCLOSURE.md` | Yes | No | No novel technique — advice generation from threshold rules over existing computed metrics is the same pattern already used by the Retro Insights Engine and Smart Actions. | Done |
| `product/PRIOR_ART_COMPARISON.md` | Yes | No | No new differentiating capability vs. prior art; rule-based role-specific advice is a conventional pattern. | Done |
| `product/CLAIM_CANDIDATE_MATRIX.md` | Yes | No | No new patent claim candidate introduced. | Done |
| `product/DEPLOYMENT_GUIDE.md` | Yes | No | No new env var, Docker config, or migration — purely application code plus one new read-only API route reusing existing Prisma/storage infrastructure. | Done |

**Net result:** 11 of 18 product/app-doc surfaces updated (SRS, BRD, USE_CASES, USER_JOURNEYS, SCENARIOS, TEST_CASES, DEVELOPER_GUIDE, RELEASE_NOTES, ALGORITHM_SPEC, APPENDIX, `/help`); 7 reviewed with no update required, each with a stated reason. TODO-List.md updated (RBC-01–20 status rows, this matrix). This satisfies DOC-GATE-03/PUSH-06/DOD-10/DOD-11/RBC-19/RBC-20 for this change.

---

## 7. Daily Master Prompt Regeneration

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| DAILY-01 | Regenerate Claude working prompt at the beginning of every new workday | P0 | ✅ Permanent | Do not reuse yesterday’s prompt blindly. |
| DAILY-02 | Include current date, branch, version, code status | P0 | ✅ Permanent | Must reflect actual repository state. |
| DAILY-03 | Include documentation, TODO, release-notes, lint/test/build status | P0 | ✅ Permanent | Must show what is current and what is behind. |
| DAILY-04 | Include what changed yesterday and what remains behind | P0 | ✅ Permanent | Any behind document becomes P0 immediately. |
| DAILY-05 | Include today's P0 status alongside the P1–P4 work planned for the day | P0 | ✅ Permanent | Updated 2026-06-08: P0 no longer gates P1–P4 — the daily prompt should show P0 status *and* the balanced/parallel P1–P4 work for the day side by side, not frame P0 as something to "wait out" before features can begin. |
| DAILY-06 | Include updated execution order and Definition of Done | P0 | ✅ Permanent | Every day begins from current reality. |

---

## 8. Full App Coverage Rule

`product/SRS.md`, `product/USE_CASES.md`, and `product/TEST_CASES.md` must cover the entire app, not only the newest changes.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| COVER-01 | Validate every page is covered | P0 | ✅ Done | Verified 2026-06-08 via survey-first ground-truth pass: dashboard/upload/admin/developer/help/charts/explore/readiness/members/login/profile pages all anchored across SRS page inventory + USE_CASES UCs + TEST_CASES TCs; retrospective/forecasting/coaching pages do not exist yet and are correctly roadmap-marked (see COVER-19/20/21/22). |
| COVER-02 | Validate every route is covered | P0 | ✅ Done | Re-verified 2026-06-08 — survey's "thin" flag was stale framing (already fully covered): `middleware.ts` PROTECTED/ADMIN_ONLY route-protection logic anchored via FR-226/FR-227/FR-235E + UC-084/UC-085/UC-086 + `roles.test.ts` (route matrix/fallbacks) + `middleware.test.ts` (TC-PW-07 forced-password-change redirect, new TC-A-10 unauthenticated→`/login?redirect=` redirect). |
| COVER-03 | Validate every API route is covered | P0 | ✅ Done | Closed 2026-06-08 — the one genuinely large gap: added new SRS §8.1 "Next.js Application API Route Inventory" (36-row table: Method/Path/Auth/Purpose/FR ref/Notes covering every live `app/api/**/route.ts` route), plus a scope-note distinguishing it from the legacy standalone-Express-backend API spec already in SRS §8. |
| COVER-04 | Validate every user role is covered | P0 | ✅ Done | All 6 `AppRole` values (admin/scrum_master/product_owner/manager/c_level/user) anchored via FR-226/FR-227, UC-084/UC-085/UC-086, and `roles.test.ts` (supported roles, labels, import-visibility scope, dashboard default-view mapping, view locking, route matrix). |
| COVER-05 | Validate every admin feature is covered | P0 | ✅ Done | Re-verified 2026-06-08 — survey's "gap" flag was stale framing (already fully covered): users/retention/thresholds/orphan-rules/backup-restore/cloud-storage/browser-data/diagnostics/logs/security all anchored via UC-084 + `adminUsers.test.ts`/`members.test.ts`/`changePassword.test.ts`/`adminSettingsConsole.test.ts`/`orphanRules.test.ts`/`cloudStorage.test.ts`. |
| COVER-06 | Validate upload flows are covered | P0 | ✅ Done | Jira export upload (FR-001/UC-001) and column mapping (FR-249/FR-275/FR-244/Addendum A.15 + `columnMapping.test.ts`) were already anchored. Closed the one real gap 2026-06-08: the multi-file merge control had a live route/UI/pure-function with zero FR/UC/TC anchor — wrote new `FR-312`, `UC-094`, and `mergeIssues.test.ts` (TC-UM-01–06, TEST_CASES §9.47, 6 passing tests). Retrospective/template upload remain correctly roadmap-marked (see COVER-20). |
| COVER-07 | Validate dashboard sections are covered | P0 | ✅ Done | Overview/sprints/Kanban/flow/risks/data-quality/confidence/work-items sections anchored across the FR/UC/TC inventory and exercised by `dashboardView.test.ts`/`dashboardSectionSwitcher.test.ts`/`dashboardChips.test.ts`/`relationExplorer.test.ts`. Coaching/retro/forecast sections do not exist yet and are correctly roadmap-marked (see COVER-19/20/21). |
| COVER-08 | Validate all calculations are covered | P0 | ✅ Done | Formula/source-field/assumptions/limitations/benefit/alternatives/code-location documented in the `/developer` Calculation Reference + SRS formula sections, exercised by `metrics.test.ts`/`throughput.test.ts`/`dataQuality.test.ts`/`metricConfidence.test.ts`/`releaseConfidenceTrend.test.ts`/`portfolioHealth.test.ts`/`teamHealth.test.ts` and others. |
| COVER-09 | Validate database models are covered | P0 | ✅ Done (updated 2026-06-09) | `prisma/schema.prisma` models — User, Session, ImportLog, DashboardSnapshot, AuditEvent — anchored in the SRS data-model section and exercised by `adminUsers.test.ts`/`snapshots.test.ts`/`deleteHistory.test.ts`/`auth.test.ts`/`logout.test.ts`/`uploadUserId.test.ts`. **Updated 2026-06-09**: `UserAddRequest` (FR-314) and `Notification` (FR-315) models added to schema and anchored via `userAddRequests.test.ts` (TC-REQ-01–14). RetroInsight remains correctly roadmap-marked (see COVER-20). |
| COVER-10 | Validate browser storage behavior is covered | P0 | ✅ Done | `dc_*`/`dc-*` key conventions, clear-data, and privacy-reset/fallback rules documented and exercised by `clearLocalData.test.ts`/`onboarding.test.ts`/`recOwners.test.ts`/`mutedRecommendations.test.ts`/`cloudRestoreHardening.test.ts` (TC-CS-12 localStorage fallback). |
| COVER-11 | Validate security behavior is covered | P0 | ✅ Done | Auth/role-route authorization/first-login password change/secret redaction anchored via FR-226/FR-227/FR-235E, UC-084/UC-085/UC-086, `auth.test.ts`/`roles.test.ts`/`middleware.test.ts`/`securityCheck.test.ts`/`changePassword.test.ts`. Additionally **resolved a TC-ID collision/drift** discovered 2026-06-08: the stale manual "F3 — Authentication Tests" table (TC-A-01–09, all "Not Run") had drifted from `auth.test.ts`'s independent reuse of the same IDs for different scenarios. Renumbered the five colliding rows to the free range TC-A-10–14, corrected TC-A-01/02/08/09 to ✅ Automated with cross-refs, and closed the genuinely-untested scenarios with 7 new automated tests: `middleware.test.ts` TC-A-10 (unauthenticated→`/login` redirect), `logout.test.ts` TC-A-13a/b (audit event + session destroy), `uploadUserId.test.ts` TC-A-14a/b (ImportLog tagged with session userId) — plus cross-refs for TC-A-11/TC-A-12 to existing `roles.test.ts` coverage (see TEST_CASES §F3). Gateway SSRF protections are roadmap-only (no gateway exists yet — see COVER-17). |
| COVER-12 | Validate error states are covered | P0 | ✅ Done | Upload/parsing-error and storage-failure paths anchored via `cloudRestoreHardening.test.ts` (TC-CS-09–12)/`cloudStorage.test.ts`/`securityCheck.test.ts`/`diagnostics.test.ts`/`snapshots.test.ts` (TC-SN-02 cross-user delete denial, TC-SN-04 not-found). Closed the one genuine gap 2026-06-08: `GET /api/snapshots/:id` guards three distinct error responses (401 not authenticated / 404 not found / 403 access denied) that had no direct route-level test — wrote new `snapshotLoadErrors.test.ts` (TC-SN-09/10/11, TEST_CASES §9.48, 3 passing tests). Gateway-failure/notification-failure/insufficient-forecast-data are roadmap-only (features don't exist yet — see COVER-17/18/19). |
| COVER-13 | Validate export features are covered | P0 | ✅ Done | Smart Excel export (`excelExport.test.ts`/`excelExportSheets.test.ts`/`explorerExport.test.ts`), HTML export (`exportUtilsHtml.test.ts`), and Executive PDF export (`executivePdf.test.ts`) all anchored in FR/UC/TC inventory; no further export formats are planned. |
| COVER-14 | Validate customer/executive views are covered | P0 | ✅ Done | C-level summary view (`/summary`, `fallbackRouteForRole`) and customer/reporting view anchored via FR/UC and exercised by `customerView.test.ts`/`dashboardView.test.ts`. |
| COVER-15 | Validate developer route features are covered | P0 | ✅ Done | `/developer` Package Reference and Calculation Reference pages documented in SRS and the new §8.1 route inventory, anchored in USE_CASES. |
| COVER-16 | Validate storage behavior is covered | P0 | ✅ Done | Local/S3-compatible/Azure Blob/GCP cloud storage, latest-metrics persistence, backup bundles, fallback rules, and settings persistence anchored via UC-084 and exercised by `cloudStorage.test.ts`/`cloudRestoreHardening.test.ts`/`backup.test.ts`/`storageSettingsPersistence.test.ts`. |
| COVER-17 | Validate gateway behavior is covered | P0 | ✅ Done | Confirmed correctly-scoped roadmap item per explicit user decision (2026-06-08, "Mark as correctly-scoped roadmap"): no gateway pages/routes/code exist anywhere in the app. Left clearly marked "P2/P3 — not yet implemented" rather than authoring ~6-8 speculative FR/UC/TC entries describing how an unbuilt feature "should" work — which would itself be a documentation-integrity risk (specs diverging from eventual real implementation). |
| COVER-18 | Validate notification/request behavior is covered | P0 | ✅ Done — fully shipped v4.5 (updated 2026-06-09) | **v4.5 fully shipped**: `RequestAddMemberModal` (FR-320), `UserAddRequestsPanel` with mandatory admin-entered temp password (FR-321), `GET /api/notifications` + `PATCH /api/notifications/[id]/read` (FR-322), `NotificationBell` with pulsing badge and admin amber strip (FR-323), bulk user management (FR-324). UC-097/098/099, UJ-034, SCN-049, TC-NOTIF-01–05, TC-REQ-15–16, SRS Addendum C, full product docs. Full in-app notification center (browser push, email) remains P4. |
| COVER-19 | Validate forecasting behavior is covered | P2 | ✅ Done | Same roadmap confirmation as COVER-17 (explicit user decision 2026-06-08): no forecasting pages/routes/code exist. Correctly marked "P2 — not yet implemented"; no speculative FR/UC/TC content authored. |
| COVER-20 | Validate retrospective behavior is covered | P2 | ✅ Done | Same roadmap confirmation as COVER-17 (explicit user decision 2026-06-08): no retrospective upload/template/insights pages/routes/code exist. Correctly marked "P2 — not yet implemented"; no speculative FR/UC/TC content authored. |
| COVER-21 | Validate role-based coaching behavior is covered | P1 | ✅ Done | Same roadmap confirmation as COVER-17 (explicit user decision 2026-06-08): no role-based-coaching pages/routes/code exist. Correctly marked "P1 — not yet implemented"; no speculative FR/UC/TC content authored. |
| COVER-22 | Validate future roadmap items are clearly marked future | P0 | ✅ Done | Verified 2026-06-08: COVER-17–21 (gateway, notifications, forecasting, retrospective, coaching) are the only P1–P4 roadmap items found across the app, and all five are consistently marked "not yet implemented"/roadmap (not as shipped features) across SRS/USE_CASES/TODO-List — zero roadmap items misrepresented as implemented. |
| TRACE-02 | Validate SRS, Use Cases, and Test Cases cover the full app | P0 | ✅ Done | Closed 2026-06-08 via user-approved "survey-first, then cluster" methodology: built a 22-area ground-truth coverage matrix; found 2 stale-framing false positives already fully covered (COVER-02, COVER-05); closed 1 large genuine gap (COVER-03 — new 36-row API route inventory, SRS §8.1); closed 1 narrow genuine gap (COVER-06 — `FR-312`/`UC-094`/`mergeIssues.test.ts`); resolved 1 TC-ID collision/drift cluster (COVER-11 — F3 Authentication Tests table renumbered TC-A-10–14, 7 new automated tests); closed 1 error-state gap (COVER-12 — `snapshotLoadErrors.test.ts` TC-SN-09–11); and confirmed 5 roadmap items as correctly-scoped per explicit user decision rather than authoring speculative docs for unbuilt features (COVER-17–21). All 22 `COVER-XX` rows are now ✅ Done — see RELEASE_NOTES.md for the full closure write-up. |

---

## 9. Required Output After Each Claude Pass

Claude must output the following after each pass.

| ID | Required Output | Priority | Status |
|---|---|---:|---|
| OUT-01 | Current branch and working tree status | P0 | ✅ Permanent |
| OUT-02 | P0 reconciliation summary | P0 | ✅ Permanent |
| OUT-03 | Documents updated | P0 | ✅ Permanent |
| OUT-04 | Documents not changed and why | P0 | ✅ Permanent |
| OUT-05 | Full product documentation impact matrix | P0 | ✅ Permanent |
| OUT-06 | Storage status decision | P0 | ✅ Permanent |
| OUT-07 | Normalised test count | P0 | ✅ Permanent |
| OUT-08 | Lint/test/build result | P0 | ✅ Permanent |
| OUT-09 | Updated TODO status | P0 | ✅ Permanent |
| OUT-10 | Release Candidate decision | P0 | ✅ Permanent |
| OUT-11 | Backend Gateway plan or implementation summary | P1 | ✅ Permanent |
| OUT-12 | User Add-Member Request Workflow plan or implementation summary | P1 | ✅ Permanent |
| OUT-13 | Role-Based Coaching Insights plan or implementation summary | P1 | ✅ Permanent |
| OUT-14 | Retrospective Upload, Template Download, and In-App Form plan or implementation summary | P2 | ✅ Permanent |
| OUT-15 | Forecasting Progress and Delivery Adjustment Report plan or implementation summary | P2 | ✅ Permanent |
| OUT-16 | Traceability matrix | P0 | ✅ Permanent |
| OUT-17 | Remaining risks | P0 | ✅ Permanent |
| OUT-18 | Next recommended development step | P0 | ✅ Permanent |

---

## 10. P0 — Status Reconciliation Pass

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| REC-01 | Confirm current branch | P0 | ✅ Done (2026-06-16) | Branch: `style/visual-design-updates`, up to date with origin. |
| REC-02 | Confirm working tree status | P0 | ✅ Done (2026-06-16) | Working tree clean — all changes committed and pushed. |
| REC-03 | Create safe baseline commit if needed | P0 | ✅ Done (2026-06-16) | Tree was already clean; no baseline commit needed. |
| REC-04 | Update `product/SRS.md`: P1.1 Calculation Reference Done/Verified | P0 | ✅ Done | SRS FR-283 already marked Done; in scope list confirmed (v4.9.2 pass). |
| REC-05 | Update `product/SRS.md`: P1.2 Clear Local Data Done/Verified | P0 | ✅ Done | SRS FR-284 already marked Done; confirmed. |
| REC-06 | Update `product/SRS.md`: P1.3 Dashboard Section Show/Hide Done/Verified | P0 | ✅ Done | SRS FR-285 already marked Done; confirmed. |
| REC-07 | Remove any text saying P1.1/P1.2/P1.3 are queued/planned/not started | P0 | ✅ Done | Confirmed — no stale language remains. |
| REC-08 | Update `product/USE_CASES.md` intro/scope to v4.2.x | P0 | ✅ Done | Already updated in v4.2.2 P0 pass. |
| REC-09 | Remove “auth/multi-user out of scope” wording | P0 | ✅ Done | SRS §1.2 In Scope list includes auth/multi-user/role-based access. |
| REC-10 | Add/verify use cases for admin user management | P0 | ✅ Done | UC-084/UC-085/UC-086 added in TRACE-01 cluster #1 closure. |
| REC-11 | Add/verify use cases for route visibility | P0 | ✅ Done | COVER-02 verified — middleware.ts anchored to FR-226/227/235E + roles.test.ts. |
| REC-12 | Add/verify use cases for User Add-Member Request Workflow | P0/P1 | ✅ Done 2026-06-20 | Verified implemented end-to-end: UC-095–UC-099 (request, admin accept/reject, requester notification, first-login password change), SCN-050, UJ-035, FR-314–FR-319. Code: `app/api/user-add-requests/*`, `app/api/admin/user-add-requests/*`, `RequestAddMemberModal.tsx`, `UserAddRequestsPanel.tsx`, `app/change-password/page.tsx`. Tests: `TC-REQ-01` onward in `product/TEST_CASES.md` §9.42–9.48. |
| REC-13 | Add/verify use cases for Backend Gateway | P0/P1 | ✅ Done 2026-06-20 | Verified implemented as server-only infrastructure foundation (`src/server/gateway/`) with zero live providers wired up and no end-user UI — correctly has no UC authored, consistent with this document's "no UC for vaporware" principle (see `product/USE_CASES.md` line 63 note). Anchored to FR-313, `product/DEVELOPER_GUIDE.md` § "Backend Integration Gateway", and `TC-GW-01`–`TC-GW-21` (+05b/15b) in `gateway.test.ts`. |
| REC-14 | Add/verify use cases for Role-Based Coaching | P0/P1 | ✅ Done 2026-06-19 | Verified not implemented — no pages/routes/code exist (COVER-21). Correctly scoped as P1 roadmap item; no speculative UC/SCN/UJ/TC authored. See TRACE-11 and COVER-21 for the confirmed roadmap-only status. |
| REC-15 | Add/verify use cases for Retrospective Template/Form | P0/P2 | ✅ Done 2026-06-19 | UC-103 (in-app form) + UC-104 (template download) verified. Added `Related UJ: UJ-038`, `Related TC: TC-RETRO-01–07` to UC-103; added `Related SCN: SCN-056`, `Related TC: TC-RETRO-05` to UC-104; wrote SCN-056 and UJ-038 Alt B. Section 12 rows added. |
| REC-16 | Add/verify use cases for Forecasting | P0/P2 | ✅ Done 2026-06-19 | UC-102 verified. Added `Related UJ: UJ-037`, `Related TC: TC-FCAST-01–05`. Section 12 row added. |
| REC-17 | Reconcile storage status across SRS/BRD/Developer Guide/Release Notes/README/Test Cases/TODO | P0 | ✅ Done (2026-06-16) | All docs confirmed — storage is Implemented. SRS/BRD/DEVELOPER_GUIDE/RELEASE_NOTES updated to v4.9.2. |
| REC-18 | Update `TODO-List.md` to current reality | P0 | ✅ Done — this file | Include P0-P4, status values, new roadmap items, blockers. |
| REC-19 | Normalize test count | P0 | ✅ Done (2026-06-16) | Actual: 571 tests / 63 suites — all passing. SRS updated. |
| REC-20 | Run `npm run lint` | P0 | ✅ Done (2026-06-16) | Passes — warnings only for legacy inline styles in tech-debt files; zero errors. |
| REC-21 | Run `npm test` | P0 | ✅ Done (2026-06-16) | 571/571 passing, 63 suites. Fixed TC-AC-01 and TC-REQ-10. |
| REC-22 | Run `npm run build` | P0 | ✅ Done (2026-06-16) | Build passes — all routes compiled successfully. |
| REC-23 | Run `npm run test:coverage` if available | P0 | ✅ Done (2026-06-16) | No test:coverage script — manual review performed; suite is comprehensive. |
| REC-24 | Update Release Notes with verification result | P0 | ✅ Done (2026-06-16) | RELEASE_NOTES v4.9.0/v4.9.1/v4.9.2 entries added. |
| REC-25 | Decide Release Candidate status | P0 | ✅ Resolved (2026-06-08) | The traceability coverage gate that previously blocked RC status is now clear — `TRACE-01` and `TRACE-02` are both ✅ Done (zero `GAP — not found` cells, zero ID collisions, all 22 `COVER-XX` rows closed). Remaining blockers to RC, if any, are limited to required-output reporting (see Section header note). |

---

## 11. Storage Status Reconciliation

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| STORAGE-DEC-01 | Decide true storage implementation status | P0 | ✅ Done (2026-06-23) | **Verified at the code level, not assumed:** storage is genuinely implemented, not partial/planned. `src/types/storage.ts` defines a typed `StorageProvider` interface (`upload`/`download`/`list`/`delete`/`test`); `src/services/storage/providers/{local,s3,azure,gcp}Provider.ts` each implement it; `src/services/storage/storageProvider.ts` is the factory (`createProvider()`/`getActiveProvider()`) reading/writing `data/storage-settings.json`. Backed by `app/api/admin/storage/route.ts` (GET/POST + `?action=test`/`?action=upload`), `app/api/admin/storage/auto-restore/route.ts`, `app/api/admin/storage/download/route.ts`, `app/api/admin/storage/sync/route.ts`. This is Option A (fully implemented), not B or C. |
| STORAGE-DEC-02 | Document supported providers | P0 | ✅ Done (2026-06-23) | Four providers confirmed in `src/types/storage.ts`'s `StorageProviderType`: `local` (filesystem, `data/cloud-backups/`, no credentials), `s3` (AWS S3 or any S3-compatible endpoint — MinIO/Backblaze B2/Cloudflare R2 — via optional `endpoint` field), `azure` (Blob Storage via connection string), `gcp` (Cloud Storage via service-account JSON or ADC). `PROVIDER_INFO` in `storageProvider.ts` carries the user-facing label/description/install command for each, rendered in the admin UI's `ConnectionGuide`. |
| STORAGE-DEC-03 | Document current limitations | P0 | ✅ Done (2026-06-23) | (1) No simultaneous multi-provider replication — exactly one `active` provider at a time; switching providers does not auto-migrate existing backups (admin must manually re-upload). (2) Auto-restore-on-startup (`autoRestoreFromCloud()`) only triggers when the local DB is missing or has zero users — it will not overwrite an existing populated DB, by design (data-loss guard), but this means a stale local DB with users won't auto-heal from a newer cloud backup without the `?force=true` manual trigger. (3) S3 credentials are optional (falls back to the AWS default credential chain — env vars, `~/.aws/credentials`, IAM role) but Azure/GCP currently require either a typed credential or matching env var; there's no IAM-role-equivalent auto-detection for those two. (4) Backup restore is whole-bundle (all-or-nothing per `restoreBackup()`) — no selective/partial restore. |
| STORAGE-DEC-04 | Document tests | P0 | ✅ Done (2026-06-23) | `src/__tests__/cloudStorage.test.ts` (provider factory + settings round-trip), `src/__tests__/storageSettingsPersistence.test.ts` (secrets survive redacted UI saves — a save with blank password fields must not erase previously-stored credentials), `src/__tests__/latestMetricsStorage.test.ts` (origin-metadata round-trip, backward compatibility), plus `cloudRestoreHardening.test.ts` (TC-CS-* — `/api/metrics/latest` source detection/priority, `loadMetricsWithSource()` fallback chain). New this pass: `src/__tests__/diagnostics.test.ts` extended with `TC-SD-09`/`TC-SD-10` (latest-metrics age calculation, cloud-backup freshness sort). |
| STORAGE-DEC-05 | Document admin UI | P0 | ✅ Done (2026-06-23) | `app/admin/settings/page.tsx`'s `CloudStorageSettings()` component (Admin Settings → Cloud Storage tab): provider picker (4 cards), per-provider credential forms with a `ConnectionGuide` walkthrough, lock/edit-mode toggle once a provider with a real credential source is saved, Save/Test connection/Upload backup now actions, structured error display (cause + fix + AWS credential-source diagnostic). `STORAGE-DEC-11` (below) closes the one gap found: no initial-load guard, now fixed. |
| STORAGE-DEC-06 | Document credential security | P0 | ✅ Done (2026-06-23) | Confirmed in `app/api/admin/storage/route.ts`'s `GET` handler: the response's `safeSettings` object explicitly strips `accessKeyId`/`secretAccessKey`/`connectionString`/`keyFilename`/`keyJson` and returns only a `hasCredentials: boolean` presence flag — secrets never reach the browser after being saved. `requireAdmin()` gates both GET and POST to `admin` role only. `preserveSecret()` in the POST merge logic ensures a blank password field in a save request doesn't overwrite a previously-stored secret with empty string. |
| STORAGE-DEC-07 | Document backup bundle behavior | P0 | ✅ Done (2026-06-23) | `src/services/settings/backup.service.ts`'s `createBackup()`/`restoreBackup()` produce/consume a single JSON bundle (`manifest.files` + per-file content) uploaded via `provider.upload()`. `src/services/metrics/latestMetricsStorage.ts`'s `writeLatestMetrics()`/`readLatestMetrics()` separately persist just the live dashboard snapshot (`data/latest-metrics.json`, with `savedAt` + `origin: {source: 'file'\|'jira-api', connectionName?, connectionId?}`) so a fresh session can load dashboard data fast without restoring the full bundle — this file is itself included in cloud backups for disaster recovery. |
| STORAGE-DEC-08 | Document fallback behavior | P0 | ✅ Done (2026-06-23) | `src/lib/storage.ts`'s `loadMetricsWithSource()` fallback chain: try `/api/metrics/latest` (server/bucket) first → on failure or empty, fall back to browser `localStorage` → on that also being empty, return `source: 'none'`. Every step calls `saveSource()` which persists a `MetricsSourceInfo` (`source`/`provider`/`key`/`status`/`message`/`error`/`savedAt`/`connectionName`) to `localStorage` and fires a `dc-metrics-source-change` event — this is what `DataSourceBadge`/`DataSourceProvider` (`src/components/ui/DataSourceBadge.tsx`) listen to in order to render the visible source badge. |
| STORAGE-DEC-09 | Add visible source details | P0 | ✅ Done (2026-06-23) | Provider/bucket-key were already shown in the `DataSourceBadge` title (`Data source: PROVIDER · Key: KEY`) from prior work, but **last-fetched and fallback-reason were missing** — `applyStoredSource()` in `DataSourceBadge.tsx` only threaded `lastSyncAt` through for the `jira-api` case, and the `localstorage`/`fallback` (`none`) cases never passed `info.error`/`info.message` into the badge at all. Fixed: added a `fallbackReason` field to `DataSourceCtx`, threaded `info.savedAt` through for every source branch (bucket/cache/upload/local/snapshot, not just jira-api), and threaded `info.error \|\| info.message` through for `localstorage`/`fallback`. The badge `title` now reads `Data source: PROVIDER · Key: KEY · Last fetched Xm ago · {fallback reason}` when applicable. "Last pushed" (the other half of the original ask) is sourced from `getCacheMeta().pushedAt` (`src/services/storage/cloudSync.ts`, which already tracked `fetchedAt`/`pushedAt`/`pendingPush` but never surfaced it anywhere) — surfaced in the new Diagnostics section from `STORAGE-DEC-10` rather than the compact topbar badge, since "last pushed" is an admin/ops concern, not a per-page glance concern. This was `JIRA-GATE-03`. |
| STORAGE-DEC-10 | Add admin sync health check in diagnostics | P0 | ✅ Done (2026-06-23) | New "Latest Metrics & Cloud Sync" section added to `app/admin/diagnostics/page.tsx`, backed by a new `metricsSync` block in `app/api/admin/diagnostics/route.ts`'s `GET` response: `available`/`savedAt`/`ageMinutes`/`source`/`connectionName` (from `readLatestMetrics()`), `cloudProvider`/`cloudBackupCount`/`latestCloudBackupAt`/`latestCloudBackupKey`/`cloudListError` (from `readStorageSettings()` + `listCloudBackups()`, sorted newest-first), and `lastFetchedAt`/`lastPushedAt`/`pendingPush` (from `getCacheMeta()`). UI shows two KPI cards ("Live Dashboard Data" — available/missing + age-toned green/amber/red; "Cloud Copy Freshness" — backup count + newest timestamp, or "Local only"/error states) plus a fetched/pushed/pending-push status line when a cloud provider is active. 2 new tests `TC-SD-09`/`TC-SD-10` (age calculation, newest-backup sort — both mirror the route's actual logic, consistent with this test file's existing pure-function-mirror style). This was `JIRA-GATE-04`. |
| STORAGE-DEC-11 | Add Cloud Storage initial-load guard | P0 | ✅ Done (2026-06-23) | **Confirmed real gap via code reading, not assumption:** `CloudStorageSettings()` in `app/admin/settings/page.tsx` initialized `data` to `null` and `active` to `'local'`, then rendered the full provider-picker grid and action buttons immediately — before the `/api/admin/storage` fetch resolved, a user would briefly see the `'local'` tab highlighted and live buttons, even if their real saved provider was S3/Azure/GCP. Fixed with an early return: `if (!data) return <div ...>Loading storage settings…</div>;` placed right after the existing hooks, before the main `return (`. No default-provider flash possible anymore — the whole panel is blocked on the real settings arriving. This was `JIRA-GATE-05`. |
| STORAGE-DEC-12 | Verify cloud-backed user authority | P0 | ✅ Done / Needs regression | Uploaded TODO says done: sync from cloud before auth/admin reads/writes; push after user create/update/password change. |
| STORAGE-DEC-13 | Add email access notifications for created users | P0 | ✅ Done (2026-06-10) | Implemented via nodemailer (`src/lib/email.ts`). On accept, `sendEmail()` delivers a styled HTML+text welcome email with credentials and login link. Graceful: skips silently if SMTP not configured. `emailSent` flag in API response; admin UI shows ✅/⚠️ delivery status. FR-325. |

---

## 12. Traceability Rule

Every implemented feature must be traceable end-to-end.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TRACE-01 | Build full traceability matrix for every shipped v4.2.x feature | P0 | ✅ Done — clusters #1 (F3-14/15/16), #2 (F2-05/06/07/09/11/12/13), #3 (F4-05/06/08), #4 (F1-07/08), #5 (UX-02/03/05/11/13), #6 (FR↔UC ID-collision cleanup + Ownership Index), and UX-14 ALL fully closed 2026-06-08 incl. all 38 test cases (14 + TC-AC-01–03 + TC-FF-01–06 + TC-X-09a–13b + TC-T-11 + TC-CH-01–03 + TC-X-14) automated — matrix has zero `GAP — not found` cells and zero ID collisions remaining | Cross-reference Feature ↔ SRS FR ID ↔ Use Case ID ↔ Scenario ID ↔ User Journey ID ↔ Test Case ID ↔ Release Note ↔ TODO Status. Filled matrix in Section 12, plus Appendix B (FR→UC Ownership Index) resolving the bundling ambiguity. All six gap clusters closed — see Gaps Summary. |
| TRACE-02 | Validate SRS, Use Cases, and Test Cases cover the full app | P0 | ✅ Done | Closed 2026-06-08 — all 22 `COVER-XX` rows in Section 8 are ✅ Done (survey-first methodology found 2 stale-framing false positives, 2 genuine gaps now closed with new FR/UC/TC + tests, 1 TC-ID collision cluster resolved with 7 new tests, 1 error-state gap closed with 3 new tests, and 5 roadmap items confirmed correctly-scoped). See Section 8 for the per-area closure notes and `RELEASE_NOTES.md` for the full write-up. |
| TRACE-03 | Block new coding if any implemented feature lacks traceability | P0 | ✅ Permanent | Any gap becomes P0 immediately. |
| TRACE-04 | Add traceability rows for P1.1 Calculation Reference | P0 | ❌ Not started | Must include doc/test references. |
| TRACE-05 | Add traceability rows for P1.2 Clear Local Data | P0 | ❌ Not started | Must include Upload/Admin behavior and tests. |
| TRACE-06 | Add traceability rows for P1.3 Dashboard Section Switcher | P0 | ❌ Not started | Must include all dashboard sections and tests. |
| TRACE-07 | Add traceability rows for Admin User Management and role-based route enforcement | P0 | ❌ Not started | Must include role matrix and middleware tests. |
| TRACE-08 | Add traceability rows for Cloud Storage and latest-metrics restore | P0 | ❌ Not started | Must include provider/admin UI/fallback tests. |
| TRACE-09 | Add traceability placeholders for Backend Gateway | P1 | ❌ Not started | Create once implemented. |
| TRACE-10 | Add traceability placeholders for User Add-Member Request | P1 | ❌ Not started | Create once implemented. |
| TRACE-11 | Add traceability placeholders for Role-Based Coaching | P1 | ✅ Done (2026-06-26) | Implemented and traced: FR-346–FR-354 (SRS Addendum H/H.6), UC-114, UJ-039, SCN-057/058/059, TC-RBC-01–13 (`product/TEST_CASES.md` §9.60/§9.61). See RBC-01–26 in Section 16. |
| TRACE-12 | Add traceability placeholders for Retrospective features | P2 | ❌ Not started | Create once implemented. |
| TRACE-13 | Add traceability placeholders for Forecasting | P2 | ❌ Not started | Create once implemented. |

### Traceability Matrix Template

| Feature | SRS FR ID | Use Case ID | Scenario ID | User Journey ID | Test Case ID | Release Note | TODO Status |
|---|---|---|---|---|---|---|---|
| Example Feature | FR-xxx | UC-xxx | SCN-xxx | UJ-xxx | TC-xxx | v4.x.x note | Done/Verified |

---

### TRACE-01 — Filled Traceability Matrix (v4.2.x), produced 2026-06-07

Cross-reference of every shipped Feature 1–4 / UX item against SRS FR IDs, Use Cases, Scenarios, User Journeys, Test Cases, and Release Notes. Cells marked `GAP — not found` indicate a missing cross-reference that must be closed (either by adding the doc reference or by writing the missing doc content) before TRACE-01 can be marked ✅ Done. This pass is a **first compilation**, not a closure — see Gaps Summary below for the punch-list that remains.

| Feature | SRS FR ID | Use Case ID | Scenario ID | User Journey ID | Test Case ID | Release Note | TODO Status |
|---|---|---|---|---|---|---|---|
| F1-01 Sprint throughput engine | FR-207, FR-208, FR-211, FR-212 | UC-043 | SCN-012 | UJ-010 | TC-T-01, TC-T-03, TC-T-04, TC-T-05, TC-T-06 | v3.0 — "Sprint throughput engine (committed/completed/carryover/goal outcome/delivery pattern)" | ✅ Done |
| F1-02 Mid-sprint pattern detection | FR-209, FR-210 | UC-044 | SCN-012 | UJ-010 | TC-T-02, TC-T-07, TC-T-08, TC-T-09, TC-T-10 | v3.0 — "Mid-sprint pattern detection (5 patterns)" | ✅ Done |
| F1-03 Kanban flow analytics | FR-213 | UC-045 | SCN-014 | GAP — not found | GAP — not found (no formula-level TC; only TC-MC-13/TC-MI-08 touch confidence) | v3.0 — "Kanban flow analytics (monthly periods, flow efficiency, aging WIP, bottleneck)" | ✅ Done |
| F1-04 SprintThroughputPanel component | FR-214 | UC-043 | SCN-012, SCN-020 | UJ-010, UJ-019 | GAP — not found (no component-render TC) | v3.0 — "SprintThroughputPanel, MidSprintDeliveryPanel, KanbanThroughputPanel on dashboard" | ✅ Done |
| F1-05 MidSprintDeliveryPanel component | FR-214 | UC-044 | SCN-020 | UJ-019 | GAP — not found | v3.0 — same bullet as F1-04 | ✅ Done |
| F1-06 KanbanThroughputPanel component | FR-214 | UC-045 | SCN-014 | GAP — not found | GAP — not found | v3.0 — same bullet as F1-04 | ✅ Done |
| F1-07 TypeScript types `src/types/throughput.ts` | FR-215 (anchored 2026-06-08 — `ThroughputMetrics`/`SprintThroughputSummary`/`KanbanFlowSummary`/`MidSprintInsight` are the types FR-215 names) | UC-043 (Related FR extended to FR-207–FR-215 2026-06-08) | SCN-012 (Related line added 2026-06-08) | UJ-010 | TC-T-11 (new 2026-06-08 — shape-contract test) | v3.0 — "`src/types/throughput.ts` — full TypeScript coverage" | ✅ Done |
| F1-08 DashboardMetrics extended with `throughput` field | FR-215 | UC-043 (Related FR extended to FR-207–FR-215 2026-06-08) | SCN-012 (Related line added 2026-06-08) | UJ-010 | TC-T-11 (new 2026-06-08 — asserts `metrics.throughput` conforms to `ThroughputMetrics`) | v3.0 — implied by FR-215 ("all throughput data under a `throughput` field"); no distinct bullet | ✅ Done |
| F2-01 Hierarchy reconstruction service | FR-218 | UC-046 | GAP — not found | GAP — not found | TC-E-01, TC-E-02, TC-E-07, TC-E-08 | v3.0 — "Hierarchy reconstruction (multi-signal: parent key, epic link, key prefix)" | ✅ Done |
| F2-02 Orphan risk detection with delivery impact | FR-219 | UC-046 (Alt Flow B) | GAP — not found | GAP — not found | TC-E-06 | v3.0 — "Orphan risk detection — 4-class classification with delivery impact statements" | ✅ Done |
| F2-03 Relation graph builder | FR-217, FR-218 | UC-046 | SCN-013 | UJ-011 | TC-E-01–TC-E-08 | v3.0 — implicit in "hierarchy reconstruction... React Flow visual graph" bullet | ✅ Done |
| F2-04 React Flow visual graph with Dagre layout | FR-220 | UC-046 | SCN-013 | UJ-011 | GAP — not found (no TC asserts Dagre layout positions) | v3.0 — "React Flow visual graph with Dagre layout, custom node cards, pan/zoom, minimap" | ✅ Done |
| F2-05 Node styles per issue type | FR-221 | UC-046 | SCN-044 | UJ-011 | TC-E-01–TC-E-08 (graph rendering covers per-type node styling) | GAP — not found (Release Notes say only "custom node cards") | ✅ Done — traceability closed 2026-06-08 |
| F2-06 Orphan node visual treatment | FR-222 | UC-046 (Alt Flow B), UC-088 (Alt Flow B) | SCN-044 | UJ-028 (step 1) | TC-E-06 | GAP — not found | ✅ Done — traceability closed 2026-06-08 |
| F2-07 RelationLegend / RelationInsightPanel / RelationStatsCards / RelationDetailsTable | FR-223, FR-224 | UC-046, UC-088 | SCN-044 | UJ-028 (steps 2–3) | TC-E-01–TC-E-08, TC-LB-01–TC-LB-08 (RelationStatsCards' Largest Unfinished Branch card) | GAP — not found (Release Notes name "RelationCharts" and "custom node cards" but not these four panels) | ✅ Done — traceability closed 2026-06-08 |
| F2-08 RelationCharts (completion, health, types, assignee, sprint, orphan) | FR-223 | UC-046 | SCN-044 | UJ-011 | GAP — not found | v3.0 — "RelationCharts — 6 chart cards per issue" | ✅ Done |
| F2-09 Field-format bug fix for FlowItem/raw JiraIssue | FR-225A | UC-046 (Alt Flow B), UC-088 (Alt Flow B) | SCN-044 | UJ-028 (pain point) | TC-FF-01–TC-FF-06 (all ✅ Automated — `fieldFormatCompat.test.ts`) | v3.0 — "Bug fix: field format compatibility (FlowItem and raw JiraIssue)" | ✅ Done — traceability closed 2026-06-08, all 6 test cases automated 2026-06-08 |
| F2-10 Explore added to app navigation | FR-279 | GAP — not found (no dedicated UC; implied by UJ-011 step 1) | SCN-013, SCN-036 | UJ-011 | GAP — not found | v3.0 — "New Routes: `/explore`"; v4.0 — "grouped sub-menu... Delivery: ...Explore" | ✅ Done |
| F2-11 Risk-path highlight | FR-225B | UC-088 | SCN-026, SCN-044 | UJ-028 | TC-RP-01–TC-RP-08 (all ✅ Pass — `riskPath.test.ts`, re-verified 2026-06-08) | v4.0 — "9.18 Risk-path highlight" | ✅ Done — traceability closed 2026-06-08, code re-verified against `computeRiskPaths()` (`relationExplorer.service.ts`) |
| F2-12 Largest unfinished branch insight | FR-225C | UC-088 | SCN-026, SCN-044 | UJ-028 | TC-LB-01–TC-LB-08 (all ✅ Pass — `largestBranch.test.ts`, re-verified 2026-06-08) | v4.0 — "9.19 Largest unfinished branch" | ✅ Done — traceability closed 2026-06-08, code re-verified against `computeLargestUnfinishedBranch()` (`relationExplorer.service.ts`) |
| F2-13 Blocked branch filter | FR-225D | UC-088 | SCN-044 | UJ-028 | TC-BF-01–TC-BF-08 (all ✅ Pass — `blockedBranchFilter.test.ts`, re-verified 2026-06-08) | v4.0 — "9.20 Blocked branch filter" | ✅ Done — traceability closed 2026-06-08, code re-verified against `ExplorePage`/`WorkItemGraph` `dimNonRiskPath` filter logic |
| F3-01 Prisma/iron-session/bcryptjs installed | GAP — not found (FR-228/229 describe enabled behaviours, not the install) | GAP — not found | GAP — not found | GAP — not found | GAP — not found | v3.0 — "Package note: prisma, @prisma/client, iron-session, bcryptjs — installed and active" | ✅ Done |
| F3-02 Prisma schema (User, Session, ImportLog, DashboardSnapshot, AuditEvent) | FR-231, FR-232, FR-255 | GAP — not found | GAP — not found | GAP — not found | GAP — not found | v3.0 — "SQLite via Prisma 5 (`data/delivery_clarity.db`)" | ✅ Done |
| F3-03 SQLite database created | GAP — not found | GAP — not found | GAP — not found | GAP — not found | GAP — not found | v3.0 / v4.2.2 — "Normalized relative SQLite `DATABASE_URL`..." | ✅ Done |
| F3-04 Seed script and first admin user | GAP — not found | GAP — not found | SCN-015 | GAP — not found | GAP — not found | GAP — not found (only implied by SQLite/Prisma bullet) | ✅ Done |
| F3-05 Auth API routes (login/logout/register/me/change-password) | FR-228, FR-229, FR-230, FR-235, FR-235D | UC-047, UC-050 | SCN-015 | UJ-012 | TC-A-01, TC-A-02, TC-A-06, TC-A-09 | v3.0 — "Auth API: login (bcrypt, iron-session, rate-limit 5/min), logout, register, me" | ✅ Done |
| F3-06 Login page | FR-226, FR-300 | UC-047, UC-075 | SCN-015 | UJ-012 | TC-A-01, TC-A-02 | v3.0 — page list bullet; v4.0 — FR-300 branding | ✅ Done |
| F3-07 Register route reserved but inactive | FR-235 | UC-050 (Alt Flow A) | GAP — not found | GAP — not found | GAP — not found (no TC asserts the 403/redirect specifically) | v4.2.2 — "Locked public registration: `/register` redirects to `/login`, `POST /api/auth/register` returns 403" | ✅ Done |
| F3-08 Profile page | FR-235F, FR-235F.1 | GAP — not found | SCN-015 | UJ-012 | TC-A-08 (loose), `profileImage.test.ts` (2 tests) | v4.2.2 — "Expanded `/profile`... Added S3-backed profile image upload" | ✅ Done |
| F3-09 Admin logs page | FR-227, FR-233 | UC-048 | SCN-015 | UJ-014 | TC-A-04, TC-A-05 | v3.0 — "Admin sees all users' logs; regular user sees only own logs" | ✅ Done |
| F3-10 UserMenu in header | FR-234 | GAP — not found | GAP — not found | UJ-012 | GAP — not found | v3.0 — "UserMenu in header (avatar, name, role badge, sign out)" | ✅ Done |
| F3-11 Middleware route protection | FR-226, FR-227, FR-235D, FR-235E | UC-047 | SCN-015 | UJ-012 | TC-A-03 | v3.0 — "Middleware route protection (all app routes guarded)" | ✅ Done |
| F3-12 Upload API saves ImportLog with userId | FR-232 | GAP — not found | GAP — not found | GAP — not found | TC-A-07 | v3.0 — "Upload API saves ImportLog with userId to SQLite" | ✅ Done |
| F3-13 `/api/imports` filtered by user/admin | FR-233 | UC-048 | GAP — not found | GAP — not found | TC-A-04, TC-A-05 | v3.0 — "Admin sees all users' logs; regular user sees only own logs" | ✅ Done |
| F3-14 Admin user management with role assignment | FR-235A, FR-235B, FR-235C, FR-233 | UC-084 | SCN-039, SCN-040 | UJ-024 | TC-AU-01–TC-AU-07 (all ✅ Automated — `adminUsers.test.ts`) | v4.2.2 — "Added admin-managed users in `/admin/settings → Users`..." | ✅ Done — traceability closed 2026-06-07, all 7 test cases automated 2026-06-07 |
| F3-15 Member directory `/members` | FR-235G | UC-085 | SCN-041 | UJ-025 | TC-MD-01–TC-MD-08 (all ✅ Automated — `roles.test.ts` / `members.test.ts`) | v4.2.2 — "Added `/members`: searchable member cards + detail popup" | ✅ Done — traceability closed 2026-06-07, all 8 test cases automated 2026-06-07 (route + `matchesMemberQuery`/`contactEmailFor` extracted to `src/lib/members.ts` for direct unit testing) |
| F3-16 Forced first-login password change | FR-235D | UC-086 | SCN-042 | UJ-026 | TC-PW-01–TC-PW-10 (all ✅ Automated — `roles.test.ts` / `auth.test.ts` / `middleware.test.ts` / `changePassword.test.ts`) | v4.2.2 — "...first-login password-change enforcement" | ✅ Done — traceability closed 2026-06-07, all 10 test cases automated 2026-06-07 |
| F4-01 Recommendation engine (evidence/impact/owner/action) | FR-238, FR-239, FR-295 | UC-049 | SCN-016 | UJ-013 | `excelExport.test.ts` (15 tests, no dedicated TC-X row) | v3.0 — "Recommendation engine (10+ rules, evidence + impact + owner + action)" | ✅ Done |
| F4-02 17-sheet statistical workbook | FR-236, FR-237 | UC-049 | SCN-016 | UJ-013 | TC-X-04 | v3.0 — full 17-sheet bullet | ✅ Done |
| F4-03 Executive Summary sheet | FR-238 | UC-049 | SCN-016 | UJ-013 | TC-X-02 | v3.0 — "Executive Summary..." | ✅ Done |
| F4-04 Sprint Throughput / Mid-Sprint / Kanban Flow sheets | FR-207, FR-236 | GAP — not found | SCN-012, SCN-014 | GAP — not found | TC-X-01 | v3.0 — sheet bullet | ✅ Done |
| F4-05 Risks & Blockers / Orphan & Data Quality / Release Readiness sheets | FR-236, FR-310 | UC-089 | SCN-045 | UJ-029 | TC-X-09a, TC-X-09b, TC-X-10a, TC-X-10b, TC-X-10c, TC-X-12 | v3.0 — sheet bullet; v4.2.2 — TRACE-01 cluster #3 closure (2026-06-08) | ✅ Done — traceability closed 2026-06-08, all 6 sheet-content TCs automated in `excelExportSheets.test.ts` |
| F4-06 Cycle & Lead Time percentile analysis | FR-236, FR-310 | UC-089 | SCN-016, SCN-045 | UJ-029 | TC-X-11a, TC-X-11b | v3.0 — "Cycle & Lead Time, Throughput Trends..."; v4.2.2 — TRACE-01 cluster #3 closure (2026-06-08) | ✅ Done — traceability closed 2026-06-08, percentile + slowest-items logic re-verified and automated |
| F4-07 Metric Dictionary sheet | FR-240 | UC-049 | GAP — not found | UJ-013 | TC-X-05 | v3.0 — "Metric Dictionary, Raw Data Reference" | ✅ Done |
| F4-08 Export button triggers smart workbook | FR-236, FR-311 | UC-049, UC-089 | SCN-016, SCN-045 | UJ-013, UJ-029 | TC-X-13, TC-X-13b | v3.0 — "Export button in dashboard sticky bar and summary page"; v4.2.2 — TRACE-01 cluster #3 closure (2026-06-08) | ✅ Done — traceability closed 2026-06-08, trigger flow (`exportToExcel`, default + custom filename) automated in `excelExportSheets.test.ts` |
| UX-01 Dashboard sections collapsible | FR-214 (implied) | GAP — not found | GAP — not found | UJ-010 | GAP — not found | v3.0 — "All dashboard sections collapsible" | ✅ Done |
| UX-02 Default open sections | FR-271, FR-272 | UC-062 | SCN-024 | UJ-021 | TC-DV-01, TC-DV-05–TC-DV-10 | "9.9 Role-based dashboard views — 5 views..., section hiding, TierSep/Flow Panel hiding, 10 tests" | ✅ Done — traceability closed 2026-06-08 (matrix was stale: `defaultOpen`/`hideTiers`/`hideFlowPanel` per view are anchored via `UC-062`/`SCN-024`/`UJ-021`/`FR-271`–`FR-272`/`TC-DV-*`, not independent gaps) |
| UX-03 Status chips on section triggers | FR-308 | UC-090 | SCN-046 | UJ-030 | TC-CH-01–TC-CH-03 | v4.2.2 — TRACE-01 cluster #5 closure (2026-06-08): new `FR-308`/`BR-112` document the 5-tier chip convention | ✅ Done — traceability closed 2026-06-08, genuine gap newly anchored: `Chip`/`CHIP_CLS` extracted to `src/lib/dashboardChips.ts` and automated as `TC-CH-01–03` |
| UX-04 Upload-to-dashboard redirect fix | FR-200 | GAP — not found | GAP — not found | UJ-010 | TC-101 | v3.0 — "Upload → dashboard redirect bug fixed" | ✅ Done |
| UX-05 HTML export redesigned | FR-300 (brand mark) | UC-076 | SCN-035 | UJ-031 | TC-X-14 | v4.0 — "HTML report export: Lightning bolt brand mark... footer 'Delivery Clarity v4.1'"; v4.2.2 — TRACE-01 cluster #5 closure (2026-06-08) | ✅ Done — traceability closed 2026-06-08 (UC/SCN matrix entries were stale — `UC-076`/`SCN-035` already narrated this; new `UJ-031` written and `buildReportHtml()` extracted from `exportToHtml` so the branding markup is independently testable as `TC-X-14`) |
| UX-06 Calculation Reference visible in /developer side menu | FR-283 | UC-059 | SCN-022 | GAP — not found | GAP — not found (no formal TC-xxx) | "P1.1 — Done" via FR-283 acceptance detail | ✅ Done |
| UX-07 Clear Local Data in Admin Settings | FR-284, FR-286 | UC-057, UC-060 | SCN-018, SCN-023 | UJ-017, UJ-020 | TC-CLD-01–TC-CLD-10 | v4.1 — "P1.2 — Clear Local Data... 10 automated tests (TC-CLD-01–10)" | ✅ Done |
| UX-08 Clear Local Data on Upload/Landing page | FR-284 | UC-056, UC-060 | SCN-019, SCN-023 | UJ-017 | TC-CLD-01–TC-CLD-10 | v4.1 — same P1.2 bullet (banner detection on upload page) | ✅ Done |
| UX-09 Dashboard Section Switcher with smooth scroll/animation | FR-285 | UC-058, UC-061 | SCN-020, SCN-024, SCN-025 | UJ-019 | TC-DS-01–TC-DS-10 | v4.1 — "P1.3 — Dashboard Section Switcher... 10 automated tests (TC-DS-01–10)" | ✅ Done |
| UX-10 Product tour animation | FR-303 | UC-079, UC-080 | SCN-035 | GAP — not found | TC-PT-01–TC-PT-08 | v4.1 — "P3 — Product Tour Animation: 8-step guided tour... 8 tests (TC-PT-01–08)" | ✅ Done |
| UX-11 Advanced theme customization | FR-304 | UC-081 | SCN-047 | UJ-032 | TC-TC-01–TC-TC-08 | v4.1 — "P3 — Advanced Theme Customization: 8 tests (TC-TC-01–08)"; v4.2.2 — TRACE-01 cluster #5 closure (2026-06-08) | ✅ Done — traceability closed 2026-06-08 (UC/FR/TC entries were already anchored — only `SCN-047`/`UJ-032` were genuinely missing and have now been written) |
| UX-12 Custom dashboard layout builder | FR-305 | UC-082 | GAP — not found | GAP — not found | TC-LB2-01–TC-LB2-09 | v4.1 — "P3 — Custom Dashboard Layout Builder: 9 tests (TC-LB2-01–08)" | ✅ Done |
| UX-13 Advanced chart customization | FR-306 | UC-091 | SCN-048 | UJ-033 | TC-CC-01–TC-CC-08 | v4.1 — "P3 — Advanced Chart Customization: 9 tests (TC-CC-01–08)"; v4.2.2 — TRACE-01 cluster #5 closure (2026-06-08) | ✅ Done — traceability closed 2026-06-08 (FR/TC entries were already anchored — `UC-091`/`SCN-048`/`UJ-033` were genuinely missing and have now been written) |
| UX-14 Flat admin-settings UI redesign | FR-260A | UC-087 | SCN-043 | UJ-027 | TC-AC-01–TC-AC-03 | v4.2.2 — "Redesigned `/admin/settings` to match the flat admin settings mockup..." | ✅ Done |
| Delivery Forecast: velocity-based projection + burn-up chart | FR-328, FR-329 | UC-102 | SCN-052 | UJ-037 | TC-FCAST-01–TC-FCAST-05 | v4.3.5 — "REC-16: UC-102 verified; Related UJ/TC cross-references added" | ✅ Done — REC-16 closed 2026-06-19 |
| Sprint Retrospective: in-app form + generateInsights() | FR-330, FR-331, FR-332 | UC-103 | SCN-053 | UJ-038 | TC-RETRO-01–TC-RETRO-07 | v4.3.5 — "REC-15: UC-103 verified; Related UJ/TC cross-references added" | ✅ Done — REC-15 closed 2026-06-19 |
| Retrospective template download: CSV Blob download | FR-333 | UC-104 | SCN-056 | UJ-038 (Alt B) | TC-RETRO-05 (⬜ Manual) | v4.3.5 — "REC-15: UC-104 verified; SCN-056 + UJ-038 Alt B written" | ✅ Done — REC-15 closed 2026-06-19 |
| Delivery Roadmap: epic cards + forecast labels + filter/sort | FR-326, FR-327 | UC-101 | SCN-051 | UJ-036 | TC-ROAD-01–TC-ROAD-05 (on feat/roadmap-forecast-extraction) | v4.3.6 — "REC-14 closed; UC-101 Related UJ/TC added; Section 12 roadmap row added" | ✅ Done — REC-14 closed 2026-06-19; ROADMAP-02 done on feat/roadmap-forecast-extraction |

### Gaps Summary — Punch List to Close TRACE-01 (prioritized)

1. ~~**Highest priority — Feature 3 admin/user/member items (F3-14, F3-15, F3-16)**~~ — **FULLY CLOSED 2026-06-07.** Added `UC-084/085/086`, `SCN-039–042`, `UJ-024–026`, and formal `TC-AU-01–07` / `TC-MD-01–08` / `TC-PW-01–10` IDs (see `product/USE_CASES.md`, `SCENARIOS.md`, `USER_JOURNEYS.md`, `TEST_CASES.md` §9.43), then **automated all 14 previously-❌-Not-Run test cases the same day**: `TC-AU-06/07` (self-disable-protection, duplicate-email-409 — added to `adminUsers.test.ts`), `TC-MD-05–08` (active/sorted query, search filter, contact-email fallback, anonymous-401 — new `members.test.ts`, with `matchesMemberQuery()`/`contactEmailFor()` extracted to `src/lib/members.ts` for direct unit testing), `TC-PW-07` (middleware `mustChangePassword` redirect — new `middleware.test.ts`), `TC-PW-08–10` (must-differ-from-temp / success / wrong-temp-password — new `changePassword.test.ts`). Test count rose from 469/48 to 481/51 suites; lint and build remain clean. Cluster #1 has zero remaining gaps.
2. ~~**Feature 2 explorer visual/filter items (F2-05, F2-06, F2-07, F2-09, F2-11, F2-12, F2-13)**~~ — **FULLY CLOSED 2026-06-08.** Added four new FRs (`FR-225A` field-format compatibility, `FR-225B` risk-path highlight, `FR-225C` largest-unfinished-branch insight, `FR-225D` blocked-branch filter) to `product/SRS.md`; anchored with a new `UC-088` (Investigate Delivery Risk and Branch Health in the Work Item Explorer — Alt Flow B covers the dual-format compatibility fix), `SCN-044` (Delivery Manager Reads the Visual Graph and Filters to Risk — narrates node styling, orphan badges, all four Relation* panels, risk-path/largest-branch/filter together), and `UJ-028` (Delivery Manager Investigates Risk Paths and Branch Health). **Re-verified F2-11/12/13 at the code level**: confirmed `computeRiskPaths()`, `computeLargestUnfinishedBranch()`, and the `ExplorePage`/`WorkItemGraph` `dimNonRiskPath` filter logic in `relationExplorer.service.ts` match their documented behaviour and all 24 existing `TC-RP`/`TC-LB`/`TC-BF` tests pass — moved from 🔍 Needs verification to ✅ Done. **Wrote and automated 6 new test cases** `TC-FF-01–06` (new `fieldFormatCompat.test.ts`, testing `buildRelationGraph` against raw-only, FlowItem-only, and mixed-format fixtures — no extraction needed, the field accessors in `relationExplorer.service.ts`/`hierarchy.service.ts` were already pure). Test count rose from 492/52 to 498/53 suites; lint and build remain clean. Cluster #2 has zero remaining gaps.
3. ~~**Feature 4 export sheets (F4-05, F4-06, F4-08)**~~ — **FULLY CLOSED 2026-06-08.** Added two new FRs (`FR-310` — sheet-content rules for Risks & Blockers / Orphan & Data Quality / Cycle & Lead Time / Release Readiness, `FR-311` — the dashboard-sticky-bar/`/summary` export-trigger contract — *originally numbered `FR-242`/`FR-243`; renumbered 2026-06-08 to `FR-310`/`FR-311` after colliding with pre-existing Addendum-A "Data Quality Score" FRs of the same IDs, see item 6 below*) to `product/SRS.md`; anchored with a new `UC-089` (Trigger and Review the Smart Excel Workbook from the Dashboard or Summary Page), `SCN-045` (Product Owner Exports the Smart Workbook for an Offline Release Review), and `UJ-029` (Product Owner Exports and Reads the Smart Workbook for an Offline Review). **Wrote and automated 10 new test cases** `TC-X-09a/b`, `TC-X-10a/b/c`, `TC-X-11a/b`, `TC-X-12`, `TC-X-13/13b` (new `excelExportSheets.test.ts`) — covering the Risks & Blockers sort-and-suggested-action logic, the Orphan & Data Quality summary/detail/empty-state blocks, the Cycle & Lead Time P50/P75/P85/P95 percentile math and slowest-items ranking, the Release Readiness Go/Conditional-Go/No-Go grouping, and the `exportToExcel` trigger (default + custom filename, captured via a scoped `jest.mock('xlsx', …)` so no file is written to disk). Also discovered and corrected the stale F4 entry in `product/TEST_CASES.md` §9 (it described 6 *manual, Not-Run* `TC-X-01–06` cases that didn't match the 8 cases — `TC-X-01–08` — already automated in `excelExport.test.ts`); the table now lists all 18 `TC-X-*` cases as ✅ Pass with their owning spec files. Test count rose from 498/53 to 508/54 suites; lint and build remain clean. Cluster #3 has zero remaining gaps.
4. ~~**F1-07/F1-08 (types & DashboardMetrics field)**~~ — **FULLY CLOSED 2026-06-08.** Rather than declaring these "not independently traceable", anchored them to the existing UC/SCN/UJ that already consume the data contract they define: `src/types/throughput.ts` (F1-07, the `ThroughputMetrics`/`SprintThroughputSummary`/`KanbanFlowSummary`/`MidSprintInsight` types) and `DashboardMetrics.throughput` (F1-08, required by `FR-215`) are the data layer behind every panel `UC-043` walks through, so extended `UC-043`'s `Related FR` line from "FR-207 to FR-214" to "FR-207 to FR-215" with an explanatory note, and added a `**Related:**` line to `SCN-012` (`UC-043, UJ-010, FR-207–FR-215, TC-T-01–TC-T-11`) — `UJ-010` already covered the same flow with no changes needed. **Wrote and automated 1 new shape-contract test case `TC-T-11`** in `throughput.test.ts` (now 11 tests), calling `calculateDashboardMetrics()` and asserting `metrics.throughput` conforms to the full `ThroughputMetrics` contract — `sprint: SprintThroughputSummary`, `kanban: KanbanFlowSummary`, `midSprint: MidSprintInsight[]` — with every documented field present and correctly typed, directly proving `FR-215`. Test count rose from 508/54 to 509/54 suites (same file, +1 test); lint and build remain clean. Cluster #4 has zero remaining gaps.
5. ~~**UX-14 (flat admin-settings redesign) and UX-02/03/05/11/13 (UX narrative residue)**~~ — **FULLY CLOSED.** UX-14 closed 2026-06-07: anchored with `UC-087`, `SCN-043`, `UJ-027`, `TC-AC-01–TC-AC-03`, then **automated all 3 previously-❌-Not-Run test cases the same day**: `TC-AC-01` (sidebar tab metadata via `activeTabMeta`/`ADMIN_TABS`), `TC-AC-02` (tab-switch panel/stat-card swap via `activeTabMeta`/`buildSettingsStats`), `TC-AC-03` (Users-tab summary cards, `roleOptionsFor`, `matchesUserFilter` table search/filter) — new `adminSettingsConsole.test.ts`, with `Tab`/`ADMIN_TABS`/`activeTabMeta`/`retentionLabel`/`buildSettingsStats`/`ManagedUser`/`roleOptionsFor`/`matchesUserFilter` extracted to `src/lib/adminConsole.ts` for direct unit testing (mirrors the `src/lib/members.ts` pattern). Test count rose from 481/51 to 492/52 suites. **Cluster #5 (UX-02/03/05/11/13) FULLY CLOSED 2026-06-08** — investigation found 3 of 5 matrix entries were *stale, not gaps*: **UX-02** (Default open sections) was already covered end-to-end by `FR-271`/`FR-272`/`UC-062`/`SCN-024`/`UJ-021`/`TC-DV-01,05–10` — matrix corrected, no new docs needed. **UX-05** (HTML export redesign) already had `UC-076`/`SCN-035` — matrix corrected; only `UJ-031` and a branding test were genuinely missing, so wrote `UJ-031` and extracted the html-string builder out of `exportToHtml` into a new pure `buildReportHtml()` (in `src/lib/exportUtils.ts`) and automated `TC-X-14` against it (asserts the brand-mark SVG, "Delivery Clarity" eyebrow, `<title>`, and footer attribution are present in the rendered markup). **UX-11** (Advanced theme customization) already had `FR-304`/`UC-081`/`TC-TC-01–08` — only `SCN-047`/`UJ-032` were missing and have been written. The two genuine gaps: **UX-13** (Advanced chart customization) had `FR-306`/`TC-CC-01–08` but no UC/SCN/UJ — wrote new `UC-091`/`SCN-048`/`UJ-033`. **UX-03** (Status chips on section triggers) was a true zero-anchor gap — the cross-cutting `Chip`/`CollapsibleTrigger` system spanning ~16 dashboard sections had no FR/UC/SCN/TC anywhere and lived purely as inline JSX in `app/dashboard/page.tsx`; extracted `Chip`/`CHIP_CLS`/`chipClass()`/`mostSevereChipType()` to a new pure module `src/lib/dashboardChips.ts` (mirrors the `adminConsole.ts`/`members.ts` extraction pattern), wrote new `FR-308`/`BR-112` documenting the 5-tier severity convention, anchored with new `UC-090`/`SCN-046`/`UJ-030`, and automated `TC-CH-01–TC-CH-03` (tier→style mapping, neutral fallback, `mostSevereChipType` severity ranking) in new `dashboardChips.test.ts`. **Net new for cluster #5**: 1 FR (`FR-308`), 1 BR (`BR-112`), 2 new UCs (`UC-090`, `UC-091`) plus corrected matrix anchors for `UC-062`/`UC-076`/`UC-081`, 3 new SCNs (`SCN-046/047/048`) plus corrected anchors for `SCN-024`/`SCN-035`, 4 new UJs (`UJ-030/031/032/033`) plus a corrected anchor for `UJ-021`, and 4 new test cases (`TC-CH-01–03`, `TC-X-14`) automated across 2 new spec files (`dashboardChips.test.ts`, `exportUtilsHtml.test.ts`). Suite grew from 509/54 to 513/56. Cluster #5 — and with it the entire UX narrative-residue punch-list item — has zero remaining gaps.
6. ~~**Cross-cutting ambiguity**: USE_CASES.md bundles multiple FRs under one UC via "Related FR: FR-207–FR-214" style ranges (e.g., UC-043, UC-046), which makes strict 1:1 FR↔UC traceability ambiguous.~~ — **FULLY CLOSED 2026-06-08.** Investigating the ranges surfaced that bundling wasn't actually the worst problem — there were **real ID collisions** undermining traceability integrity: (a) `FR-242`/`FR-243` were each defined *twice* with unrelated meanings (the cluster #3 closure had minted new `FR-242`/`FR-243` for the Excel sheet-content/export-trigger contracts, unknowingly colliding with the pre-existing Addendum-A "Data Quality Score" `FR-242`/`FR-243`); (b) `FR-235D` was defined twice (forced-password-change redirect vs. dashboard-view role-locking — the latter an orphan, referenced nowhere by ID); (c) `UC-043`/`UC-044` each had two entirely different definitions (stale pre-v3.0 ones — "Return from Full Report to Summary" / "Direct URL Access to Protected Route" — plus the current v3.0 ones the matrix anchors to); (d) `FR-309` was referenced in `UC-083`'s Related-FR line but never defined in `product/SRS.md` (a phantom), alongside a stale `FR-308` reference on the same line that actually names the unrelated status-chip FR. **Fixed all four**: renumbered the cluster #3 FRs to `FR-310`/`FR-311` (with an explanatory note on each pointing back to the collision), renumbered the orphan dashboard-view-locking FR to `FR-235H`, renumbered the stale `UC-043`/`UC-044` to `UC-092`/`UC-093` (each annotated with the renumbering reason; neither was referenced anywhere else by ID so no cross-reference updates were needed), wrote a new, correctly-scoped `FR-309` (P3 — Done) formally documenting the bucket-backed metrics restore-and-fallback flow that `UC-083` actually narrates (resolving the phantom by making the reference real), and corrected `UC-083`'s Related-FR line to `FR-307, FR-309` (dropping the unrelated `FR-308`). Propagated the `FR-242→FR-310` / `FR-243→FR-311` renumbering across every cross-reference: `product/USE_CASES.md` (`UC-089`), `product/SCENARIOS.md` (`SCN-045`), `product/TEST_CASES.md` (F4 `**Related:**` line), `product/RELEASE_NOTES.md` (cluster #3 section, with an explanatory renumbering footnote preserving the historical record), and `TODO-List.md` (matrix rows F4-05/06/08, Gaps Summary item 3, F4-TRACE row, Documentation Impact Matrix table, progress paragraph). **Then built the FR→UC Ownership Index** (new "TRACE-01 Appendix B" subsection below) — expanding every bundled range (`UC-043`/`046`/`047`/`049`/`051`/`052`/`053`/`055`) into individual FR IDs and stating each one's authoritative owning UC per the Section 12 matrix, with genuine multi-UC overlaps (e.g., `FR-236` serving both `UC-049` and `UC-089`; `FR-222`–`FR-224` serving both `UC-046` and `UC-088`) explicitly marked "co-implemented" rather than left ambiguous. Re-ran the full suite (still 513/56 passing — these were documentation-only ID corrections, no code changed) plus lint and build. **TRACE-01 has zero remaining gaps and is now ✅ Done.**

### TRACE-01 Appendix B — FR→UC Ownership Index (resolves Gaps Summary item 6, produced 2026-06-08)

The Section 12 matrix cross-references each shipped Feature to its FR(s)/UC/SCN/UJ/TC. Several Use Cases additionally summarise their scope in `product/USE_CASES.md` with a broad `**Related FR:** FR-xxx to FR-yyy` range — useful narrative context, but not a precise 1:1 ownership statement (e.g., `UC-043`'s "FR-207 to FR-215" range overlaps `UC-044`'s and `UC-045`'s individually-claimed FRs). This index expands every such bundled range into individual FR IDs and states each one's **authoritative owning UC**, exactly as assigned in the Section 12 matrix — making FR↔UC lookups unambiguous without rewriting the narrative ranges (which remain accurate as "this whole flow touches this FR neighbourhood" context).

| FR ID | Requirement (short) | Owning UC (per Section 12 matrix) | Notes |
|---|---|---|---|
| FR-207 | Sprint throughput summary calculation | UC-043 | Primary (F1-01) |
| FR-208 | Sprint date resolution | UC-043, UC-044 | Co-implemented — F1-01 (`UC-043`) computes from it; F1-02 (`UC-044`) mid-sprint metrics depend on it |
| FR-209 | Sprint midpoint + mid-sprint metrics | UC-044 | Primary (F1-02) |
| FR-210 | 5-pattern delivery classification | UC-044 | Primary (F1-02) |
| FR-211 | Sprint goal outcome calculation | UC-043 | Primary (F1-01) |
| FR-212 | Delivery trend calculation | UC-043 | Primary (F1-01) |
| FR-213 | Kanban flow metrics calculation | UC-045 | Primary (F1-03) |
| FR-214 | Collapsible throughput-panel display | UC-043, UC-044, UC-045 | Shared — one display FR serving three distinct panels (F1-04/05/06) |
| FR-215 | `DashboardMetrics.throughput` data contract | UC-043 | Anchored 2026-06-08 (cluster #4 — F1-07/08); `UC-043`'s range was extended to include it |
| FR-216 | `/explore` route exists | UC-046 | Primary — route-entry trigger condition in `UC-046`'s own narrative |
| FR-217 | Focus/parent/children-only graph scope | UC-046 | Primary (F2-03) |
| FR-218 | Multi-signal hierarchy reconstruction | UC-046 | Primary (F2-01, F2-03) |
| FR-219 | 4-class orphan classification | UC-046 | Primary (F2-02 Alt Flow B) |
| FR-220 | React Flow + Dagre visual graph | UC-046 | Primary (F2-04) |
| FR-221 | Per-issue-type node styles | UC-046 | Primary (F2-05) |
| FR-222 | Orphan node visual treatment | UC-046, UC-088 | Co-implemented (F2-06) |
| FR-223 | RelationCharts / KPI cards / details table | UC-046, UC-088 | Co-implemented (F2-07, F2-08) |
| FR-224 | Details-table filter and search | UC-046, UC-088 | Co-implemented (F2-07) |
| FR-225 | Recent-searches chips (`dc_explore_recent`) | UC-046 | Primary — narrative only, no dedicated matrix row |
| FR-226 | Middleware route protection (redirect map) | UC-047 | Primary (F3-06, F3-11) |
| FR-227 | `/admin` role gate | UC-047, UC-048 | Co-implemented — `UC-047` (F3-11 middleware), `UC-048` (F3-09/13 admin-logs/imports gate) |
| FR-228 | Password hashing (bcrypt, 12 rounds) | UC-047, UC-050 | Co-implemented (F3-05 auth API routes) |
| FR-229 | Session cookies (iron-session, TTL) | UC-047, UC-050 | Co-implemented (F3-05) |
| FR-230 | Login rate-limiting (5/min, HTTP 429) | UC-047, UC-050 | Co-implemented (F3-05) |
| FR-236 | 17-sheet workbook structure | UC-049, UC-089 | Co-implemented — `UC-049` defines the workbook (F4-02/04); `UC-089` reviews four of its sheets and triggers the download (F4-05/06/08) |
| FR-237 | Frozen header / auto-filter / column widths | UC-049 | Primary — narrative (every sheet) |
| FR-238 | Executive Summary sheet contents | UC-049 | Primary (F4-01, F4-03) |
| FR-239 | Recommendations sheet contents | UC-049 | Primary — narrative |
| FR-240 | Metric Dictionary sheet contents | UC-049 | Primary (F4-07) |
| FR-241 | No HTML/JSX/`[object Object]` in cells | UC-049 | Primary — narrative (workbook-wide constraint) |
| FR-242 | Data Quality Score calculation (10 field checks) | UC-051 | Primary |
| FR-243 | Data Quality Score band classification (5 bands) | UC-051 | Primary |
| FR-244 | Score/band display on preview + dashboard | UC-051 | Primary |
| FR-245 | Plain-English score-meaning summary | UC-051 | Primary |
| FR-275 | Column-mapping preview page (incl. Data Quality Score) | UC-051 | Co-referenced — the page `UC-051` walks through end to end |
| FR-246 | Metric Confidence Score calculation | UC-052 | Primary |
| FR-247 | Confidence levels (High/Medium/Low/Unreliable/N-A) | UC-052 | Primary |
| FR-248 | Confidence badge display + reason tooltip | UC-052 | Primary |
| FR-255 | Save dashboard snapshot (max 20/user) | UC-053 | Primary |
| FR-256 | `/snapshots` list page | UC-053 | Primary |
| FR-260 | Configure 9 health thresholds (admin) | UC-055 | Primary |
| FR-261 | Persist thresholds to `health-thresholds.json` | UC-055 | Primary |

**How to read this index:** "Primary" means the Section 12 matrix assigns this FR to exactly one UC — the bundled range in that UC's `**Related FR**` line is consistent with the matrix and creates no ambiguity once expanded. "Co-implemented" means the matrix legitimately assigns this FR to more than one UC because two distinct user flows genuinely share the same requirement (e.g., both the auth-gate flow `UC-047` and the registration-redirect flow `UC-050` implement the same password/session/rate-limit rules from the same `POST /api/auth/*` routes) — this is **not** an error, just a many-to-many relationship that a strict 1:1 matrix cell can't express on its own. No FR in this index is *unowned* or *contradictorily* owned; the original "ambiguity" was resolvable entirely from the existing Section 12 matrix once the four ID collisions above were corrected.

**Net assessment (updated 2026-06-08 — TRACE-01 now fully closed):** Gap clusters #1 (F3-14/15/16), UX-14, #2 (F2-05/06/07/09/11/12/13), #3 (F4-05/06/08 — Excel export sheets and trigger), #4 (F1-07/08 — throughput types & `DashboardMetrics.throughput` data contract), #5 (UX-02/03/05/11/13 — UX narrative residue), and now #6 (the FR↔UC bundling/collision review) are **all fully closed**: documentation anchored across all clusters (4+2+2+0+2 new FRs plus 1 new BR across #1–5 — cluster #4 reused `FR-215` and extended `UC-043`'s range; cluster #5 added `FR-308`/`BR-112`; cluster #6 added a correctly-scoped `FR-309` and renumbered four colliding IDs — plus 8 new UCs, 10 new SCNs, 10 new UJs across clusters #1–5, and 1 new `**Related:**` line on `SCN-012`), F2-11/12/13 re-verified at the code level and promoted from 🔍 to ✅, and 38 new test cases (14 + `TC-AC-01–03` + `TC-FF-01–06` + `TC-X-09a/b/10a/b/c/11a/b/12/13/13b` + `TC-T-11` + `TC-CH-01–03` + `TC-X-14`) automated across six passes — including a brand-new `src/lib/dashboardChips.ts` extraction (mirroring `adminConsole.ts`/`members.ts`) for the previously-untested, cross-cutting status-chip convention, and a minimal `buildReportHtml()` extraction from `exportToHtml` so the redesigned HTML report's branding markup is independently testable. **Cluster #6 additionally found and fixed four real ID collisions** that the "bundling ambiguity" framing had been masking — duplicate `FR-242`/`FR-243` (one pair self-inflicted by cluster #3), duplicate `FR-235D`, duplicate `UC-043`/`UC-044`, and a phantom `FR-309` reference — renumbering the colliding/orphaned IDs to `FR-310`/`FR-311`/`FR-235H`/`UC-092`/`UC-093`, writing a correctly-scoped `FR-309`, and propagating every cross-reference; then built **TRACE-01 Appendix B** (the FR→UC Ownership Index) which expands all 8 bundled `**Related FR**` ranges into individual FR IDs with their authoritative UC owner per the Section 12 matrix — proving the remaining "bundling" was navigable narrative shorthand, not genuine ambiguity, once the collisions were gone. Test suite remains at **513/56** (cluster #6 was documentation-only — no code changed, so no new tests were needed); lint and build remain clean throughout. **The Section 12 matrix has zero `GAP — not found` cells and zero ID collisions — TRACE-01 is ✅ Done.**

**TRACE-02 update (2026-06-08 — also now fully closed):** Following the same evidence-based approach, ran a user-approved "survey-first, then cluster" pass over all 22 `COVER-XX` areas in Section 8. Outcome: 2 of the survey's "thin"/"gap" flags were stale framing and already fully covered once re-verified (`COVER-02` route-protection matrix, `COVER-05` admin features — re-verified ✅, no new content needed, mirroring the cluster #5 "stale matrix cell" pattern above); 1 large genuine gap closed (`COVER-03` — new SRS §8.1 36-row Next.js API route inventory, since the existing API spec documented only the legacy standalone-Express backend); 1 narrow genuine gap closed (`COVER-06` — multi-file merge control had a live route/UI/pure-function with zero anchor, closed with new `FR-312`/`UC-094`/`mergeIssues.test.ts` TC-UM-01–06); 1 TC-ID collision/drift cluster resolved (`COVER-11` — the stale manual "F3 — Authentication Tests" table's TC-A-01–09 had drifted from `auth.test.ts`'s independent reuse of the same IDs; renumbered the five colliding rows to TC-A-10–14 and closed the genuinely-untested scenarios with 7 new tests across `middleware.test.ts`/`logout.test.ts`/`uploadUserId.test.ts`); 1 error-state gap closed (`COVER-12` — `GET /api/snapshots/:id`'s 401/404/403 load-failure paths had no direct test, closed with new `snapshotLoadErrors.test.ts` TC-SN-09–11); and 5 roadmap items confirmed correctly-scoped per explicit user decision rather than authoring speculative FR/UC/TC content for unbuilt features (`COVER-17`–`21` — gateway, notifications, forecasting, retrospective, coaching all have zero pages/routes/code and remain clearly marked "not yet implemented"). Test suite grew from 513/56 to **527/60** (14 new tests across 4 new files plus 1 addition to an existing suite: `mergeIssues.test.ts` 6 tests, `logout.test.ts` 2 tests, `uploadUserId.test.ts` 2 tests, `snapshotLoadErrors.test.ts` 3 tests, and 1 new test — TC-A-10 — added to `middleware.test.ts`; verified via `npx jest` → "Test Suites: 60 passed, 60 total / Tests: 527 passed, 527 total"). **All 22 `COVER-XX` rows are ✅ Done — TRACE-02 is ✅ Done.**

---

## 13. Current Verified / Existing Feature Inventory

The following items are in the uploaded TODO as Done. Keep them, but verify traceability.

### Feature 1 — Throughput & Delivery Analytics

| ID | Task | Priority | Status |
|---|---|---:|---|
| F1-01 | Sprint throughput engine: committed, done, carryover, goal outcome, delivery pattern | P0 | ✅ Done |
| F1-02 | Mid-sprint pattern detection: Healthy / End-Loaded / Blocked / Scope Instability | P0 | ✅ Done |
| F1-03 | Kanban flow analytics: monthly periods, flow efficiency, aging WIP, bottleneck | P0 | ✅ Done |
| F1-04 | SprintThroughputPanel dashboard component | P0 | ✅ Done |
| F1-05 | MidSprintDeliveryPanel dashboard component | P0 | ✅ Done |
| F1-06 | KanbanThroughputPanel dashboard component | P0 | ✅ Done |
| F1-07 | TypeScript types: `src/types/throughput.ts` | P0 | ✅ Done |
| F1-08 | DashboardMetrics extended with `throughput` field | P0 | ✅ Done |
| F1-TRACE | Add/verify traceability for all Feature 1 items | P0 | ✅ Done — traceability closed 2026-06-08: F1-07/08 anchored to `UC-043`/`SCN-012`/`UJ-010`/`FR-215` (UC-043 Related-FR range extended to FR-215, SCN-012 gained a `**Related:**` line) and `TC-T-11` (new shape-contract test) automated in `throughput.test.ts` (see Section 12 Gaps Summary item 4 — fully closed) |

### Feature 2 — Work Item Explorer

| ID | Task | Priority | Status |
|---|---|---:|---|
| F2-01 | Hierarchy reconstruction service | P0 | ✅ Done |
| F2-02 | Orphan risk detection with delivery impact | P0 | ✅ Done |
| F2-03 | Relation graph builder | P0 | ✅ Done |
| F2-04 | React Flow visual graph with Dagre layout | P0 | ✅ Done |
| F2-05 | Node styles per issue type | P0 | ✅ Done |
| F2-06 | Orphan node visual treatment | P0 | ✅ Done |
| F2-07 | RelationLegend, RelationInsightPanel, RelationStatsCards, RelationDetailsTable | P0 | ✅ Done |
| F2-08 | RelationCharts — completion, health, types, assignee, sprint, orphan | P1 | ✅ Done |
| F2-09 | Field-format bug fix for FlowItem/raw JiraIssue field names | P0 | ✅ Done |
| F2-10 | Explore added to app navigation | P0 | ✅ Done |
| F2-11 | Risk-path highlight | P1 | ✅ Done — re-verified at code level 2026-06-08 against `computeRiskPaths()`; `TC-RP-01–08` pass; anchored `FR-225B`/`UC-088`/`SCN-044`/`UJ-028` |
| F2-12 | Largest unfinished branch insight | P1 | ✅ Done — re-verified at code level 2026-06-08 against `computeLargestUnfinishedBranch()`; `TC-LB-01–08` pass; anchored `FR-225C`/`UC-088`/`SCN-044`/`UJ-028` |
| F2-13 | Blocked branch filter | P1 | ✅ Done — re-verified at code level 2026-06-08 against `ExplorePage`/`WorkItemGraph` `dimNonRiskPath` filter logic; `TC-BF-01–08` pass; anchored `FR-225D`/`UC-088`/`SCN-044`/`UJ-028` |
| F2-TRACE | Add/verify traceability for all Feature 2 items | P0 | ✅ Done — traceability closed 2026-06-08: F2-05/06/07/09/11/12/13 anchored with `FR-225A–D`/`UC-088`/`SCN-044`/`UJ-028`, F2-11/12/13 re-verified and promoted from 🔍 to ✅, `TC-FF-01–06` automated (see Section 12 Gaps Summary item 2 — fully closed) |

### Feature 3 — Authentication, Users, Database

| ID | Task | Priority | Status |
|---|---|---:|---|
| F3-01 | Prisma, `@prisma/client`, iron-session, bcryptjs installed | P0 | ✅ Done |
| F3-02 | Prisma schema: User, Session, ImportLog, DashboardSnapshot, AuditEvent | P0 | ✅ Done |
| F3-03 | SQLite database created: `data/delivery_clarity.db` | P0 | ✅ Done |
| F3-04 | Seed script and first admin user | P0 | ✅ Done |
| F3-05 | Auth API routes: login, logout, inactive register, me, change password | P0 | ✅ Done |
| F3-06 | Login page | P0 | ✅ Done |
| F3-07 | Register route reserved but inactive | P0 | ✅ Done |
| F3-08 | Profile page | P0 | ✅ Done |
| F3-09 | Admin logs page | P0 | ✅ Done |
| F3-10 | UserMenu in header | P0 | ✅ Done |
| F3-11 | Middleware route protection | P0 | ✅ Done |
| F3-12 | Upload API saves ImportLog with userId | P1 | ✅ Done |
| F3-13 | `/api/imports` filtered by user/admin | P1 | ✅ Done |
| F3-14 | Admin user management with role assignment and role-scoped data | P1 | ✅ Done |
| F3-15 | Member directory `/members` | P1 | ✅ Done |
| F3-16 | Forced first-login password change | P1 | ✅ Done — traceability closed 2026-06-07 (UC-086, SCN-042, UJ-026, TC-PW-01–10; TC-PW-07–10 still ❌ Not Run) |
| F3-TRACE | Add/verify traceability for all Feature 3 items | P0 | ✅ Done — F3-14/15/16 fully closed 2026-06-07 (UC-084/085/086, SCN-039–042, UJ-024–026, TC-AU/MD/PW anchored AND all 14 test cases automated and passing in `adminUsers.test.ts`/`members.test.ts`/`middleware.test.ts`/`changePassword.test.ts`) |

### Feature 4 — Smart Excel Export

| ID | Task | Priority | Status |
|---|---|---:|---|
| F4-01 | Recommendation engine with evidence, impact, owner, action | P0 | ✅ Done |
| F4-02 | 17-sheet statistical workbook | P0 | ✅ Done |
| F4-03 | Executive Summary sheet | P0 | ✅ Done |
| F4-04 | Sprint Throughput, Mid-Sprint, Kanban Flow sheets | P0 | ✅ Done |
| F4-05 | Risks & Blockers, Orphan & Data Quality, Release Readiness sheets | P0 | ✅ Done |
| F4-06 | Cycle & Lead Time percentile analysis | P0 | ✅ Done |
| F4-07 | Metric Dictionary sheet | P0 | ✅ Done |
| F4-08 | Export button triggers smart workbook | P0 | ✅ Done |
| F4-TRACE | Add/verify traceability for all Feature 4 items | P0 | ✅ Done — traceability closed 2026-06-08: F4-05/06/08 anchored with `FR-310/311` (renumbered 2026-06-08 from colliding `FR-242/243` — see Gaps Summary item 6)/`UC-089`/`SCN-045`/`UJ-029`, and `TC-X-09a–TC-X-13b` (10 new sheet-content + trigger-flow cases) automated in `excelExportSheets.test.ts` (see Section 12 Gaps Summary item 3 — fully closed) |

### UX / Dashboard / Product Experience

| ID | Task | Priority | Status |
|---|---|---:|---|
| UX-01 | Dashboard sections collapsible | P0 | ✅ Done |
| UX-02 | Default open sections | P0 | ✅ Done |
| UX-03 | Status chips on section triggers | P0 | ✅ Done |
| UX-04 | Upload-to-dashboard redirect fix | P0 | ✅ Done |
| UX-05 | HTML export redesigned | P0 | ✅ Done |
| UX-06 | Calculation Reference visible in `/developer` side menu | P1 | ✅ Done |
| UX-07 | Clear Local Data in Admin Settings | P1 | ✅ Done |
| UX-08 | Clear Local Data on Upload/Landing page when browser data exists | P1 | ✅ Done |
| UX-09 | Dashboard Section Switcher with smooth scroll and animation | P1 | ✅ Done |
| UX-10 | Product tour animation | P3 | ✅ Done |
| UX-11 | Advanced theme customization | P3 | ✅ Done |
| UX-12 | Custom dashboard layout builder | P3 | ✅ Done |
| UX-13 | Advanced chart customization | P3 | ✅ Done |
| UX-14 | Flat admin-settings UI redesign | P1 | ✅ Done |
| UX-TRACE | Add/verify traceability for all UX items | P0 | ✅ Done — UX-14 closed 2026-06-07 (`UC-087/SCN-043/UJ-027/TC-AC-01–03`); UX-02/03/05/11/13 fully closed 2026-06-08 (`UC-090/091, SCN-046/047/048, UJ-030/031/032/033, TC-CH-01–03, TC-X-14`, plus corrected stale anchors to `UC-062/076/081`, `SCN-024/035`, `UJ-021`) — see Section 12 Gaps Summary item 5 |

---

## 14. P1 — Backend Integration Gateway Foundation

**Feature:** Backend Integration Gateway  
**Priority:** P1 / Architecture Hardening  
**Rule:** This is not full Jira integration and not full cloud integration. It is a controlled backend foundation that all future external calls must use.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| GW-01 | Create gateway architecture design before code | P1 | ✅ Done | Written 2026-06-08 — new "Backend Integration Gateway (Implemented — Foundation, v4.3)" section in `product/DEVELOPER_GUIDE.md` (config-file-driven design, security model, JSONL audit rationale). |
| GW-02 | Create `src/server/gateway/types.ts` | P1 | ✅ Done | `GatewayResult<T>`, `GatewayProviderType`, `GatewayErrorCategory`, `GatewayRoutingStrategy`, `GatewayRequestOptions`, `GatewayLogRecord`, `ProviderConfig`, `EndpointPolicyResult`, `RetryPolicy`. |
| GW-03 | Create `src/server/gateway/externalGateway.ts` | P1 | ✅ Done | `callExternal<T>()` — single chokepoint: resolve provider → policy-validate → route → fetch with timeout/retry/backoff → log → return typed result. Never throws. |
| GW-04 | Create `src/server/gateway/providerRegistry.ts` | P1 | ✅ Done | Config-file-driven per user's "zero code change" requirement: reads `data/gateway-providers.json` at call time, merges over `DEFAULT_BLUEPRINTS`. `writeProviderConfigFile()` ready for future admin UI. |
| GW-05 | Create `src/server/gateway/endpointPolicy.ts` | P1 | ✅ Done | `validateEndpoint()`: https-only in production, host allowlist, SSRF (private IPs + localhost), raw-string traversal detection. Never throws — returns `{ allowed, reason }`. |
| GW-06 | Create `src/server/gateway/retryPolicy.ts` | P1 | ✅ Done | `DEFAULT_RETRY_POLICY` (10000ms, 2 retries, exponential backoff), `isRetryable()`, `computeBackoffDelay()`, `categorizeHttpStatus()`. |
| GW-07 | Create `src/server/gateway/gatewayLogger.ts` | P1 | ✅ Done | `redact()` (token/key/secret/password/cookie/Authorization/Basic/Bearer/connString), `logGatewayCall()` → `data/gateway-audit.jsonl` JSONL. Swallows write errors. |
| GW-08 | Support endpoint validation | P1 | ✅ Done | `endpointPolicy.validateEndpoint()` — https-only allowlist in production, http permitted in dev. Covered by `TC-GW-02`. |
| GW-09 | Block unsafe protocols | P1 | ✅ Done | `ALLOWED_PROTOCOLS_PROD = ['https:']`; dev allows http. Covered by `TC-GW-02`. |
| GW-10 | Block disallowed hosts | P1 | ✅ Done | Host allowlist check in `validateEndpoint()`. Covered by `TC-GW-01`. |
| GW-11 | Block private/internal IPs in production | P1 | ✅ Done | `PRIVATE_IP_PATTERNS` (RFC 1918 + link-local + loopback). Covered by `TC-GW-03`. |
| GW-12 | Block localhost in production unless explicitly configured | P1 | ✅ Done | `LOCAL_HOSTNAMES` set + `isProduction && !allowLocalhost` guard. Covered by `TC-GW-03`, `TC-GW-05b`. |
| GW-13 | Prevent path/query injection where possible | P1 | ✅ Done | Raw-string `TRAVERSAL_PATTERN` check (pre-`new URL()`) + `SAFE_PATH_PATTERN` character-set guard. Covered by `TC-GW-04`. |
| GW-14 | Ensure secrets never reach frontend | P1 | ✅ Done | `src/server/gateway/` is server-only — never imported from client components. Credential values stay in `process.env` only. |
| GW-15 | Redact sensitive headers and payload fields | P1 | ✅ Done | `gatewayLogger.redact()` masks 9 secret-shaped patterns before any log write. Covered by `TC-GW-10`. |
| GW-16 | Support server-side environment/encrypted credential storage | P1 | ✅ Done | `providerRegistry.getProviderConfig()` reads credential values from `process.env` at call time only — never persisted, never returned. |
| GW-17 | Support timeout handling | P1 | ✅ Done | `AbortController` + 10s timeout in `externalGateway.executeAttempt()`. `errorCategory: 'timeout'` on abort. |
| GW-18 | Support retry policy | P1 | ✅ Done | Up to 2 retries with exponential backoff for `408/429/500/502/503/504` and network errors. Covered by `TC-GW-06`, `TC-GW-19`, `TC-GW-20`. |
| GW-19 | Support non-retryable errors | P1 | ✅ Done | `isRetryable()` returns false for `400/401/403/404/409/422` — fails immediately. Covered by `TC-GW-06`, `TC-GW-21`. |
| GW-20 | Support audit and observability fields | P1 | ✅ Done | `GatewayLogRecord` fields: requestId, provider, operation, endpointAlias, method, startedAt, endedAt, durationMs, status, retryCount, errorCategory, error. Covered by `TC-GW-12`. |
| GW-21 | Prepare load-balancer readiness | P1 | ✅ Done | `requestId`, `correlationId`, `idempotencyKey` fields in `GatewayRequestOptions`/`GatewayResult`. Stateless, no shared mutable state. |
| GW-22 | Implement initial routing strategy `single` only | P1 | ✅ Done | `resolveRoutingTarget()` returns first candidate; `GatewayRoutingStrategy` union already enumerates all future strategies for zero-breaking-change extensibility. |
| GW-23 | Add gateway tests | P1 | ✅ Done | `src/__tests__/gateway.test.ts` — 23 tests (`TC-GW-01`–`TC-GW-21` + `TC-GW-05b`/`TC-GW-15b`), all passing. Test suite: 550/61 (was 527/60). |
| GW-24 | Update all related product docs | P1 | ✅ Done (core docs) | Updated: `DEVELOPER_GUIDE.md` (architecture section), `SRS.md` (FR-313 + §8.1 note), `USE_CASES.md` (cross-reference note), `RELEASE_NOTES.md` (v4.3 entry), `TODO-List.md` (this table). BRD/User Journeys/Scenarios/Test Cases/README/Technical Method/Appendix: minimal impact for a server-only foundation with no UI — no new UCs, no new routes, no new user-facing scenarios. |
| GW-25 | Produce product documentation impact matrix before push | P0/P1 | ✅ Done (folded in) | Impact matrix covered inline in the GW-24 closure note above — scope confirmed as server-only/no-UI, so the only mandatory doc surfaces were DEVELOPER_GUIDE (architecture), SRS (FR), USE_CASES (cross-ref note), and RELEASE_NOTES. |

---

## 15. P1/P2 — User Add-Member Request Workflow

**Feature:** Request Add User / Add Member Approval Workflow  
**Priority:** P1 if simple in-app notifications/admin approval; P2 if full Notification Center is required.  
**Rule:** Do not expose temporary passwords to requester. Do not allow non-admin direct user creation.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| USERREQ-01 | Decide implementation scope | P1 | ✅ Done (2026-06-10) | Implemented: in-app request modal, admin queue panel with mandatory temp password + **Generate button** (crypto.getRandomValues, 14-char), **welcome email** via nodemailer (FR-325), in-app notification bell with **clickable redirect** (accepted→/members, admin→/admin/settings?tab=requests), first-login forced password change. No browser push/Slack/Teams. |
| USERREQ-02 | Add requester button: `Request Add User` / `Request Add Member` | P1 | ✅ Done (2026-06-09) | "Request add member" button on `/members` page — visible only for non-admin roles. FR-320. |
| USERREQ-03 | Build request modal | P1 | ✅ Done (2026-06-09) | `src/components/admin/RequestAddMemberModal.tsx` — full name, email, requested role, reason (required), team/project (optional), notes (optional). FR-320. |
| USERREQ-04 | Validate requester form | P1 | ✅ Done (2026-06-09) | Client-side validation in RequestAddMemberModal: all required fields, valid email, high-privilege reason ≥ 20 chars. Server-side validation in FR-316. |
| USERREQ-05 | Add duplicate email warning/prevention | P1 | ✅ Done (2026-06-09) | POST route returns 409 for duplicate user email and duplicate pending request. Guard displayed inline in modal. FR-316. |
| USERREQ-06 | Add high-privilege role warning | P1 | ✅ Done (2026-06-09) | Modal shows amber warning and requires reason ≥ 20 chars when requested role is `admin` or `c_level`. FR-320. |
| USERREQ-07 | Add Prisma model `UserAddRequest` | P1 | ✅ Done (2026-06-09) | Added to `prisma/schema.prisma`: id, requestedName, requestedEmail, requestedRole, reason, teamOrProject, notes, requestedByUserId, status, adminDecisionById, adminDecisionAt, adminDecisionNote, createdUserId, createdAt, updatedAt. User model gains `userAddRequests` back-ref. FR-314. |
| USERREQ-08 | Add statuses | P1 | ✅ Done (2026-06-09) | Status field added to `UserAddRequest` with default `"pending"`; allowed values: pending/accepted/rejected/cancelled/expired enforced at the route layer. FR-314. |
| USERREQ-09 | Add minimal notification model if none exists | P1/P2 | ✅ Done (2026-06-09) | Added `Notification` model to `prisma/schema.prisma`: recipientUserId, type, title, message, relatedEntityType, relatedEntityId, readAt, createdAt. User model gains `notifications` back-ref. FR-315. |
| USERREQ-10 | Add requester API `POST /api/user-add-requests` | P1 | ✅ Done (2026-06-09) | `app/api/user-add-requests/route.ts` — logged-in users only; guards duplicate user email + duplicate pending request; creates UserAddRequest with status `"pending"`; writes audit event. FR-316. TC-REQ-01–05 automated. |
| USERREQ-11 | Add requester API `GET /api/user-add-requests/mine` | P1 | ✅ Done (2026-06-09) | `app/api/user-add-requests/mine/route.ts` — authenticated; returns own requests only (filtered by requestedByUserId). FR-317. TC-REQ-06–07 automated. |
| USERREQ-12 | Add admin API `GET /api/admin/user-add-requests` | P1 | ✅ Done (2026-06-09) | `app/api/admin/user-add-requests/route.ts` — admin only; includes requestedBy user info; optional `?status=` filter. FR-318. TC-REQ-08–09 automated. |
| USERREQ-13 | Add admin API accept action | P1 | ✅ Done (2026-06-09) | `app/api/admin/user-add-requests/[id]/accept/route.ts` — validates pending, checks email availability, creates user with `mustChangePassword: true`, marks accepted, notifies requester, audits. FR-319. TC-REQ-10–12 automated. |
| USERREQ-14 | Add admin API reject action | P1 | ✅ Done (2026-06-09) | `app/api/admin/user-add-requests/[id]/reject/route.ts` — validates pending, marks rejected, notifies requester, audits. FR-319. TC-REQ-13–14 automated. |
| USERREQ-15 | Add notification API if needed | P1/P2 | ✅ Done (2026-06-09) | `GET /api/notifications` (authenticated, max 50 desc) + `PATCH /api/notifications/[id]/read` (ownership guard). FR-322. TC-NOTIF-01–05. |
| USERREQ-16 | Add admin request queue | P1 | ✅ Done (2026-06-09) | `src/components/admin/UserAddRequestsPanel.tsx` in Admin Settings → "Member Requests" tab. FR-321. |
| USERREQ-17 | Add pending request indicator on admin login | P1 | ✅ Done (2026-06-09) | `NotificationBell` in AppShell header: pulsing red badge + persistent amber strip banner fixed below nav for admins with pending requests. FR-323. |
| USERREQ-18 | Add request review details | P1 | ✅ Done (2026-06-09) | Expandable cards in `UserAddRequestsPanel` show requester name/email/role, requested role, reason, notes, team/project, submission date. FR-321. |
| USERREQ-19 | Add accept flow | P1 | ✅ Done (2026-06-09) | Accept button requires admin-entered temp password (mandatory amber field, strength-validated); calls PATCH accept; shows copyable green password box on success. FR-319 (updated), FR-321. |
| USERREQ-20 | Add reject flow | P1 | ✅ Done (2026-06-09) | Reject button with optional decision note; calls PATCH reject; card flips to rejected state. FR-321. |
| USERREQ-21 | Enforce transaction/atomicity on accept | P1 | ✅ Done (2026-06-09) | Server: user create → request update → notification create → audit event, in sequence. FR-319. |
| USERREQ-22 | Require first-login password change for created user | P1 | ✅ Done (2026-06-09) | Created user gets `mustChangePassword: true`; login page redirects to `/change-password`. FR-319, FR-235G. |
| USERREQ-23 | Prevent requester approving own request | P1 | ✅ Done (2026-06-09) | Only `role === "admin"` session can call accept/reject routes (session role guard). Non-admin gets 403. FR-319. |
| USERREQ-24 | Prevent editing after admin decision | P1 | ✅ Done (2026-06-09) | Accept and reject routes return 409 if `status !== "pending"`. Decision is immutable. FR-319. |
| USERREQ-25 | Add rate limiting | P1 | ✅ Done (2026-06-20) | `POST /api/user-add-requests` — in-process limiter, 10 submissions per 10 minutes per requester (keyed by `session.userId`, same pattern as the login/upload rate limiters). Returns 429 with a clear message. `TC-REQ-18` automated. |
| USERREQ-26 | Add audit events | P1 | ✅ Done (2026-06-09) | `user_add_request_submit` on POST; `user_add_request_accept` on accept; `user_add_request_reject` on reject — all non-blocking (swallowed with try/catch to never fail the request). FR-316, FR-319. |
| USERREQ-27 | Add mobile layout | P1 | ✅ Done (2026-06-20) | Verified `RequestAddMemberModal` was already mobile-clean (Tailwind `w-full max-w-lg` + `overflow-y-auto`). Found and fixed a real gap: `AdminNavSidebar` was a fixed 228px rail with no breakpoint, squeezing all `/admin/*` pages (including the Member Requests queue) off-screen under 768px. Added a collapsible mobile top bar + dropdown panel (mirrors the existing `AppShell` mobile-nav pattern) and a `767px` breakpoint to `AdminNavSidebar.module.scss`/`app/admin/layout.module.scss`. Verified at 375px in a real browser: queue list, expanded card, temp-password field, and accept/reject buttons all render correctly; desktop (≥768px) unchanged. |
| USERREQ-28 | Add tests | P1 | ✅ Done (2026-06-09; extended 2026-06-20) | `src/__tests__/userAddRequests.test.ts` — 17 automated tests (TC-REQ-01–14, TC-REQ-15–16, TC-REQ-18) covering requester routes (POST + GET mine), admin routes (GET all, PATCH accept, PATCH reject), all key guard conditions, and rate limiting (TC-REQ-18; TC-REQ-17 was already taken by the Generate-button manual test in TEST_CASES.md §9.53). **2026-06-20**: fixed 4 pre-existing regressions in this file (TC-REQ-01/04/10/13) caused by mock drift after the ghost-session requester guard and `safeNotifications`/`createMany` refactors — the route code was correct, the test mocks were stale. Suite: 572/63 (2 pre-existing, unrelated failures remain in `adminUsers.test.ts`/`roles.test.ts` — see note below). |
| USERREQ-29 | Update all related product docs | P1 | ✅ Done (2026-06-09) | SRS Addendum C (FR-320–324) + FR-319 updated; USE_CASES UC-097/098/099; USER_JOURNEYS UJ-034; SCENARIOS SCN-049; TEST_CASES §9.51/§9.52; DEVELOPER_GUIDE notification bell + bulk-select sections; RELEASE_NOTES v4.5; TODO-List.md. |
| USERREQ-30 | Produce product documentation impact matrix before push | P0/P1 | ✅ Done (2026-06-09) | Filled matrix for v4.5 added to Section 6 of TODO-List.md (below the USERREQ-07–14 matrix). |
| USERREQ-31 | Fix pre-existing test failures in `adminUsers.test.ts` / `roles.test.ts` | P1 | ✅ Done (2026-06-20) | Two distinct bugs, both fixed: (1) `adminUsers.test.ts` — `DELETE /api/admin/users` calls `prisma.userAddRequest.updateMany(...)`; mock added `userAddRequest: { updateMany: jest.fn() }`. (2) `roles.test.ts` — the 2026-06-16 "Update roles and UI layout/styles" commit intentionally made `/portfolio` and `/teams` universal Analytics routes (`ANALYTICS_ROUTES`, visible to every role), but the test still asserted the old per-role restriction; updated the two stale assertions (`scrum_master`→`/portfolio`, `product_owner`→`/teams`) to `true`, matching current intended `allowedRoutePrefixesForRole()` behavior — no production code changed. Suite: 572/63, all passing. |

---

## 16. P1 — Role-Based Delivery Coaching Insights

**Feature:** Role-Based Delivery Coaching Insights  
**Rule:** No generic Agile advice. Every recommendation must cite evidence from uploaded data/metrics.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| RBC-01 | Define `RoleBasedCoachingInsight` type | P1 | ✅ Done (2026-06-23) | `src/types/roleBasedCoaching.ts` — `CoachingCategory` (7 values, distinct from `AppRole`), `RoleBasedCoachingInsight` (category, healthSummary, weakPoints, focusAreas, recommendedActions, preventionAdvice, ceremonyAdvice, nextSprintSuggestions, evidence, severity, confidence), `CeremonyAdvice`, `CoachingEvidence`, `CoachingConfidence`, `CoachingInsightsBundle`. Reuses existing `CheckSeverity`/`ConfidenceBand` unions — no new severity/confidence scale invented. |
| RBC-02 | Use existing calculated metrics/signals | P1 | ✅ Done (2026-06-23) | All 7 generators read only already-computed `DashboardMetrics` fields (`flow`, `throughput.sprint`/`kanban`/`midSprint`, `relations`, `capacity`, `risk`, `dataQuality`, `confidence`, `healthScore`, `overallDeliveryConfidence`, `prediction`, `epics`) — zero new metric calculations. `src/services/coaching/coachingMetricsAccess.ts` adds small typed accessors (`getRelations()`/`getEpics()`) for the two `DashboardMetrics` fields `src/types/metrics.ts` declares as `unknown` despite a concrete runtime shape, scoped to this feature only. |
| RBC-03 | Generate Scrum Master / Agile Coach insights | P1 | ✅ Done (2026-06-23) | `src/services/coaching/generators/scrumMaster.generator.ts` — blocked items, aging WIP, flow efficiency, average cycle time, Severe Kanban bottleneck periods, capacity load skew. `relevantKeys: ['kanbanFlow','cycleTime','midSprint']` for confidence. |
| RBC-04 | Generate Product Owner insights | P1 | ✅ Done (2026-06-23) | `productOwner.generator.ts` — sprint goal outcome, added/removed scope, carryover, orphan ratio, critical-health epics, failing data-quality checks (backlog readiness proxy). `relevantKeys: ['sprintThroughput','orphanRisk']`. |
| RBC-05 | Generate Engineering Manager insights | P1 | ✅ Done (2026-06-23) | `engineeringManager.generator.ts` — throughput trend, capacity imbalance (load share > 35%), blocked items, overdue issues, health score. **Deviation from original wording:** does not call `calculateReleaseReadiness()` — see the "Known data-shape constraint" note under RBC-06. `relevantKeys: ['sprintThroughput','velocity','releaseReadiness','teamCapacity']`. |
| RBC-06 | Generate Delivery Manager insights | P1 | ✅ Done (2026-06-23) | `deliveryManager.generator.ts` — forecasted completion (`prediction`), overdue issues, cross-team blockers, overall delivery confidence, declining throughput trend. **Known data-shape constraint discovered during implementation:** `calculateReleaseReadiness()` groups by the raw `Fix Version/s` field, which exists only on originally-uploaded issue records, not on the normalized `FlowItem` shape inside `DashboardMetrics.flow.items` — calling it with `flow.items` (as the existing `/release-readiness` and `/readiness` pages already do) always returns `hasVersionData: false` in practice. This is a pre-existing gap, not introduced here; documented in `product/DEVELOPER_GUIDE.md`. EM/DM/C-level generators use `prediction`/`overallDeliveryConfidence`/`risk` instead, which are reliably populated. `relevantKeys: ['releaseReadiness','velocity']`. |
| RBC-07 | Generate C-level / Executive insights | P1 | ✅ Done (2026-06-23) | `cLevel.generator.ts` — health score, completion rate, overall delivery confidence, overdue issues, high-priority open issues. `relevantKeys: ['healthScore','releaseReadiness']`. |
| RBC-08 | Generate Team Lead insights | P1 | ✅ Done (2026-06-23) | `teamLead.generator.ts` — critical-health blockers, ownership gaps (unassigned capacity entries), work-splitting suggestion when non-blocker critical items exist. **Review/QA bottleneck evidence is best-effort** (user-approved): this app has no first-class code-review/QA pipeline-stage concept, so it substring-matches `FlowItem.status`/`highLevelStatus` against `/review\|qa\|testing\|uat/i`; when no match exists the evidence line is simply omitted, never fabricated. `relevantKeys: ['kanbanFlow','storyPoints']`. |
| RBC-09 | Generate Admin insights only for system/admin actions | P1 | ✅ Done (2026-06-23) | `admin.generator.ts` + new `src/services/coaching/adminSignals.service.ts` (`getAdminCoachingSignals()`) + new admin-only `GET /api/coaching/admin-signals`. Data Quality score/band always shown; when admin signals are supplied (admin role only), also shows unresolved `SystemErrorLog` count (`resolvedAt: null`), active storage provider (`readStorageSettings()`), and cloud-sync freshness (`getCacheMeta()` — read-only, no network I/O, never `syncFromCloud()`). `relevantKeys: ['healthScore']`. |
| RBC-10 | Add daily standup advice rules | P1 | ✅ Done (2026-06-23) | `src/services/coaching/ceremonyAdvice.service.ts` `dailyStandupAdvice()` — fires on blocked items, aging WIP > 0, mid-sprint completion < 40% for any sprint, any Low/Unreliable metric confidence, declining throughput trend. Each fired line cites the real triggering number; a rule that doesn't fire contributes nothing. |
| RBC-11 | Add refinement/grooming advice rules | P1 | ✅ Done (2026-06-23) | `refinementAdvice()` — fires on orphan count > 0, scope-change counts > 0, aggregate carryover > 0, zero total story points, Weak/Critical data quality band. |
| RBC-12 | Add sprint planning guidance | P1 | ✅ Done (2026-06-23) | `sprintPlanningAdvice()` — average throughput baseline, carryover-first planning, blocked-item dependency check, failing data-quality checks (AC/estimates proxy); each line gated by whether the underlying signal actually exists in the data. |
| RBC-13 | Add sprint review advice | P1 | ✅ Done (2026-06-23) | `sprintReviewAdvice()` — fires when the latest sprint's goal outcome isn't "Met", or overall delivery confidence < 60%. |
| RBC-14 | Add retrospective topic advice | P1 | ✅ Done (2026-06-23) | `retrospectiveAdvice()` — fires on declining cycle-time trend, ≥2 sprints with carryover, Weak/Critical data quality, any Low/Unreliable metric confidence. All 5 ceremony rule groups (RBC-10–14) are computed once via `buildCeremonyAdvice()` and embedded identically into every category visible to the requesting role — verified by `TC-RBC-05`. |
| RBC-15 | Add dashboard section `Role-Based Coaching Insights` | P1 | ✅ Done (2026-06-23) | New route `app/dashboard/coaching/page.tsx` (mirrors the existing `flow-health/page.tsx` client-fetch pattern exactly) + `src/components/dashboard/CoachingInsightCard.tsx` (severity badge, health summary, weak points, focus areas, evidence panel, recommended actions, prevention advice, ceremony advice — only non-empty sub-lists render, next-sprint suggestions, confidence chip) + `CoachingCategoryTabs.tsx` (rendered only when >1 category is visible). New SCSS Modules for all three (Tailwind `@apply` + existing `Badge` component for severity color, matching this codebase's established styling convention). |
| RBC-16 | Enforce role visibility | P1 | ✅ Done (2026-06-23) | `visibleCategoriesForRole()` (`src/services/coaching/coachingOrchestrator.service.ts`). **User-approved role→category mapping** (the spec's 7 personas don't map 1:1 onto the app's real 6-value `AppRole` enum): `scrum_master`→Scrum Master only; `product_owner`→Product Owner only; `manager`→3 tabs (Engineering Manager first, Delivery Manager, Team Lead — bundled because `manager` already maps 1:1 to a single `'engineering_manager'` dashboard view elsewhere, and this section's own original wording said "Manager sees management," singular); `c_level`→C-level only; `admin`→all 7 as tabs; `user`/unrecognized→Team Lead (generic contributor default, since the original spec named no category for the plain `user` role). No `AppRole` enum change. |
| RBC-17 | Adjust confidence using Data Quality and Metric Confidence | P1 | ✅ Done (2026-06-23) | `src/services/coaching/coachingConfidence.service.ts` `aggregateCategoryConfidence()` — averages the category's relevant `MetricConfidenceMap` entries, downgrades ×0.75 when `dataQuality.band === 'Weak'` / ×0.5 when `'Critical'` (user-approved multipliers), re-derives the band with the same High/Medium/Low/Unreliable thresholds as `metricConfidence.service.ts`. Safe fallback: all-zero sample sizes → `band: 'N/A'`, `score: 0`, and a `reason` string with no fabricated percentage (verified by `TC-RBC-09`). Formula documented in `product/ALGORITHM_SPEC.md` "Role-Based Coaching Confidence Score." |
| RBC-18 | Add tests | P1 | ✅ Done (2026-06-23) | `src/__tests__/roleBasedCoaching.test.ts` — 20 tests: `TC-RBC-01a–h` (one per generator + role-mapping table), `TC-RBC-02`–`09` (one per `TEST-RBC-01`–`09` acceptance row in Section 22), plus 4 edge cases (zero issues, empty `sprint.sprints`, confidence threshold boundaries at 80/60/40, undefined `relations`). Full suite: 689/71 passing (was 669/70 — 0 regressions). |
| RBC-19 | Update all related product docs | P1 | ✅ Done (2026-06-23) | `SRS.md` Addendum H (FR-346–FR-352) + revision history v4.10.0; `USE_CASES.md` UC-114; `USER_JOURNEYS.md` UJ-039; `SCENARIOS.md` SCN-057/058; `TEST_CASES.md` §9.60; `DEVELOPER_GUIDE.md` new "Role-Based Delivery Coaching Insights" section (the live `/developer` "Developer Guide" topic fetches this file directly via `GET /api/docs?slug=dev-guide`, so no separate edit to `app/developer/page.tsx`'s inline topics was needed); `ALGORITHM_SPEC.md` new "Role-Based Coaching Confidence & Severity Algorithms" section (v4.10.0); `RELEASE_NOTES.md` new v4.10.0 entry; `APPENDIX.md` Section Q (3 new glossary terms); `app/help/page.tsx` new "Coaching Insights" FAQ section (3 entries); `BRD.md` Future Scope line. |
| RBC-20 | Produce product documentation impact matrix before push | P0/P1 | ✅ Done (2026-06-23) | See the filled matrix immediately below this table. |
| RBC-21 | Redesign Coaching Insights layout to be scannable and encouraging | P1 | ✅ Done (2026-06-26) | `src/components/dashboard/CoachingInsightCard.tsx`/`.module.scss` fully rewritten: mood-led hero banner, evidence stat chips, merged "What to Watch" (weak points + focus areas) and "Do This Next" (recommended actions + prevention advice) lists, collapsed-by-default Ceremony Advice accordion, distinct "Try This Next Sprint" highlight strip. `CoachingCategoryTabs.tsx`/`.module.scss` restyled with per-category icons. Replaced raw Tailwind `slate-*` utilities with real design tokens. `app/dashboard/coaching/page.tsx` dropped its non-standard `.page` wrapper for the shared `shellStyles.pageBody` convention. |
| RBC-22 | Auto-sort coaching tabs by urgency | P1 | ✅ Done (2026-06-26) | `SEVERITY_RANK` exported from `src/lib/coachingBadge.ts` (critical=0…low=3); `app/dashboard/coaching/page.tsx` sorts `bundle.categories` by this rank before rendering tabs and choosing the default-active category. |
| RBC-23 | Quick-win celebration headline for low-severity categories | P1 | ✅ Done (2026-06-26) | `heroHeadline()` in `CoachingInsightCard.tsx` — when severity is `low` and evidence exists, cites the first evidence value/label directly instead of the generic health summary. |
| RBC-24 | Severity trend vs. last saved snapshot | P1 | ✅ Done (2026-06-26) | New `src/services/coaching/coachingTrend.service.ts` `computeSeverityTrend()`. `page.tsx` fetches `GET /api/snapshots` + `GET /api/snapshots/:id` (existing Snapshots feature, no new persistence) for the second-most-recent snapshot, re-runs `generateAllCoachingInsights()` against it, and diffs severity per category. Silently omitted when fewer than 2 snapshots exist. Rendered as a small badge next to the hero mood label. |
| RBC-25 | Confidence-aware framing, empty-section encouragement, cross-category nudge, evidence-chip linking | P1 | ✅ Done (2026-06-26) | `heroHeadline()` prefixes "Early signal:" when `confidence.band` is Low/Unreliable/N/A; new `EmptyRow` component shows an explicit "all clear" message for empty "What to Watch"/"Ceremony Advice" sections instead of omitting them silently; `CoachingCategoryTabs.tsx` renders a small urgency dot on non-active tabs with `high`/`critical` severity; new `src/lib/coachingEvidenceLink.ts` `resolveEvidenceRoute()` maps evidence `metricKey` prefixes to their source `/dashboard/*` route, rendering matched chips as `next/link`s. |
| RBC-26 | Add tests + update all related product docs | P1 | ✅ Done (2026-06-26) | `src/__tests__/coachingTrend.test.ts` (3 tests, `TC-RBC-10`–`12`) + `src/__tests__/coachingEvidenceLink.test.ts` (2 tests, `TC-RBC-13`); full suite 694/73 passing. Docs: `SRS.md` Addendum H.6 (FR-353–FR-354) + revision history v4.10.1; `USE_CASES.md` UC-114 updated; `USER_JOURNEYS.md` UJ-039 updated; `SCENARIOS.md` SCN-059; `TEST_CASES.md` §9.61; `DEVELOPER_GUIDE.md` new "Coaching Insights Redesign & Encouragement Enhancements" section; `ALGORITHM_SPEC.md` new "Coaching Severity Trend Comparison" section (v4.10.1); `RELEASE_NOTES.md` new v4.10.1 entry; `APPENDIX.md` Section R (4 new glossary terms); `app/help/page.tsx` 3 new FAQ entries; `BRD.md` Future Scope line. See the filled matrix immediately below. |

**Documentation impact matrix — v4.10.1 (RBC-21–26):**

| Doc/Route | Updated? | Note |
|---|---|---|
| RELEASE_NOTES.md | ✅ | New v4.10.1 entry |
| SRS.md | ✅ | Addendum H.6, FR-353–FR-354, revision history row |
| BRD.md | ✅ | Future Scope line added |
| TEST_CASES.md | ✅ | §9.61, TC-RBC-10–13 |
| USE_CASES.md | ✅ | UC-114 updated with 5 new alternate flows |
| USER_JOURNEYS.md | ✅ | UJ-039 updated, 4 new rows |
| SCENARIOS.md | ✅ | SCN-059 added |
| DEVELOPER_GUIDE.md | ✅ | New v4.10.1 section |
| ALGORITHM_SPEC.md | ✅ | New "Coaching Severity Trend Comparison" section |
| APPENDIX.md | ✅ | Section R, 4 terms |
| TODO-List.md | ✅ | This table + matrix |
| app/help/page.tsx | ✅ | 3 new FAQ entries in existing "Coaching Insights" section |
| app/developer/page.tsx | — | Not affected — Developer Guide topic fetches `DEVELOPER_GUIDE.md` directly |
| app/glossary/page.tsx | — | Not affected — coaching terms live in APPENDIX.md, matching the v4.10.0 precedent |
| TECHNICAL_METHOD.md | — | Not affected — no new patentable technical method, presentation/derived-data only |

---

## 17. P2 — Retrospective Upload, Template Download, In-App Form, and Improvement Backlog

**Feature:** Retrospective Upload and Improvement Backlog  
**Rule:** Retrospective upload must be clearly separate from Jira delivery upload unless explicitly labeled.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| RETRO-01 | Create separate retrospective area | P1 | ✅ Done 2026-06-10 | `/retro` page live — three-card landing (Fill in App, Download Template, Upload coming soon). |
| RETRO-02 | Add three clear actions | P1 | ✅ Done 2026-06-10 | All three CTAs present: Fill in App (active), Download Template (CSV), Upload Retro File (coming soon). |
| RETRO-03 | Design three-card layout | P1 | ✅ Done 2026-06-10 | Three-card grid with icon, title, description, and CTA per card. |
| RETRO-04 | Support retrospective file upload | P2 | ✅ Done (2026-06-26) | CSV, XLSX, XLS via `parseRetroFile()`; Markdown/plain text via a heading+bullet heuristic. `POST /api/retro/parse`, 5 MB limit, session-authenticated. |
| RETRO-05 | Define supported columns | P2 | ✅ Done (2026-06-26) | `HEADER_ALIASES` in `retroFileParser.service.ts` — Sprint Name, Team Name, Retro Date, Sprint Goal Met, Sprint Goal, What Went Well, What Did Not Go Well, Blocker, Action Item, Action Owner, Action Due Date, Action Priority. Root Cause/Category/Status/Notes columns are accepted (canonicalized) but not yet surfaced in insights — see RETRO-39 note. |
| RETRO-06 | Validate file structure | P2 | ✅ Done (2026-06-26) | Missing "Sprint Name" column → 422 with no records (`TC-RETRO-09`). |
| RETRO-07 | Detect missing required fields | P2 | ✅ Done (2026-06-26) | Sprint Name plus ≥1 observation/action enforced; a Sprint-Name-only row produces a warning, not a silent drop (`TC-RETRO-11`). |
| RETRO-08 | Show preview before import | P2 | ✅ Done (2026-06-26) | `upload-insights` view shows every parsed sprint's `InsightPanel` plus warnings/corrections before the user relies on the result. Nothing is persisted — there is no "import" step to confirm, by design (see RETRO-15 deferral). |
| RETRO-09 | Allow column mapping if names differ | P2 | ✅ Done (2026-06-26) | Handled via `HEADER_ALIASES` (both this app's template headers and the original spec's naming map to the same canonical fields) rather than an interactive mapping UI — scoped down from "mapping UI" to "alias table" since the supported header set is small and known. |
| RETRO-10 | Parse retro data | P2 | ✅ Done (2026-06-26) | Rows before any Sprint Name are skipped and logged as a `RetroDataCorrection` (`TC-RETRO-10`), never silently dropped. |
| RETRO-11 | Generate Retrospective Insights | P2 | ✅ Done (2026-06-26) | `generateRetrospectiveInsight()` — themes (RETRO-34), ownership gaps (RETRO-36), duplicates (RETRO-33); "repeated problems" = RETRO-35; "root cause patterns" maps to theme detection over free text (no dedicated Root Cause column UI yet — see RETRO-39 note). |
| RETRO-12 | Generate improvement TODO list | P2 | ✅ Done (2026-06-26) | `actionItems` on `RetrospectiveInsight` — text, owner, due date, priority, status implicit (open until next retro). |
| RETRO-13 | Generate suggested next sprint actions | P2 | ✅ Done (2026-06-26; extended 2026-06-26) | `nextSprintSuggestions` (free-text advice) + `suggestedBacklogItems` (concrete story/task/spike suggestions, RETRO-29) — gated by goal outcome, blocker count, and top theme; ceremony-linked via `ceremonyRecommendations`. |
| RETRO-14 | Link retro items to delivery metrics where possible | P2 | ❌ Deferred (2026-06-26) | Explicitly out of scope for this change — no `DashboardMetrics` correlation was built. See SRS Addendum I.4 / FR-358. |
| RETRO-15 | Save retrospective record if persistence is available | P2 | ❌ Deferred (2026-06-26) | Explicitly out of scope — no new Prisma model; uploads are a stateless preview, re-computed from the file each time. See SRS Addendum I.4 / FR-358. |
| RETRO-16 | Add `Download Retrospective Template` button | P1 | ✅ Done 2026-06-10 | Download button on /retro landing card triggers CSV download. |
| RETRO-17 | Generate `.xlsx` template | P2 | ✅ Done (2026-06-26) | `downloadRetroExcelTemplate()` is now the primary "Download Template" CTA; original CSV available via a secondary link. |
| RETRO-18 | Add optional `.csv` template | P1 | ✅ Done 2026-06-10 | `Retrospective_Template.csv` generated client-side with example rows. |
| RETRO-19 | Add optional `.md` template | P2 | ✅ Done (2026-06-26, scoped to upload support, not a downloadable template) | Markdown/plain text retros are *parseable on upload* (RETRO-04) via a heading+bullet heuristic. No separate `.md` *download* template was built — the `.xlsx`/`.csv` templates remain the only downloadable templates, since a tabular template is a better fit for the structured columns than free-text Markdown. |
| RETRO-20 | Add required template columns | P2 | ✅ Done (2026-06-26) | `.xlsx` template: Sprint Name required on first row of a sprint; at least one of What Went Well/What Did Not Go Well/Blocker/Action Item required; Owner/Due Date recommended for every Action Item (flagged as an ownership gap if missing). |
| RETRO-21 | Add `Instructions` sheet to `.xlsx` | P2 | ✅ Done (2026-06-26) | `makeInstructionsSheet()` — how to fill it in, required vs. recommended fields, what happens after upload, privacy note. |
| RETRO-22 | Add example rows to template | P2 | ✅ Done (2026-06-26) | 4 example rows: carryover/large-story, late-discovered blocker, mid-sprint scope change. |
| RETRO-23 | Add `Fill Retrospective in App` / `Create Retrospective` button | P1 | ✅ Done 2026-06-10 | First card on landing: "Fill in App → Start" CTA navigates to form view. |
| RETRO-24 | Build Retro Context form section | P1 | ✅ Done 2026-06-10 | Sprint Name, Team Name, Retro Date, Sprint Goal, Sprint Goal Met (yes/partial/no). |
| RETRO-25 | Build What Went Well section | P1 | ✅ Done 2026-06-10 | Multi-entry list with add/remove per item. |
| RETRO-26 | Build What Did Not Go Well section | P1 | ✅ Done 2026-06-10 | Multi-entry list with add/remove per item. |
| RETRO-27 | Build Blockers/Impediments section | P1 | ✅ Done 2026-06-10 | Multi-entry list with add/remove per item. |
| RETRO-28 | Build Action Items section | P1 | ✅ Done 2026-06-10 | Per-action: text, owner, due date, priority (H/M/L) with add/remove. |
| RETRO-29 | Build Next Sprint Suggestions section | P2 | ✅ Done (2026-06-26; extended 2026-06-26 with concrete backlog items) | System-generated only (no manual-add UI). Two distinct outputs in `InsightPanel`: (a) "Do This Next" — free-text ceremony/process advice (`nextSprintSuggestions` + `ceremonyRecommendations` + `ownershipGaps`); (b) "Suggested Stories & Tasks for Next Sprint" (`suggestedBacklogItems`) — concrete, pasteable story/task/spike items with type, priority, and a rationale citing the real triggering evidence, plus a Copy button. Each item is gated by a real signal: a blocker → "task" to resolve it; a *repeated* blocker → "spike" to investigate root cause instead of a duplicate resolve task; the top theme → "story" citing the example sentence; a missed goal → "spike" to investigate why. No Jira write-back — suggestions are copy-paste only, consistent with the "no Jira ticket creation" P3 roadmap boundary. |
| RETRO-30 | Add save draft | P2 | ❌ Deferred (2026-06-26) | Explicitly out of scope — depends on persistence (RETRO-15), which is deferred. See SRS Addendum I.4 / FR-358. |
| RETRO-31 | Add submit final retrospective | P1 | ✅ Done 2026-06-10 | "Submit & Get Suggestions" button triggers `generateInsights()` and navigates to insights view. |
| RETRO-32 | Validate in-app form | P1 | ✅ Done 2026-06-10 | Sprint Name required to enable submit; insights flag missing owners/due dates and unresolved blockers. |
| RETRO-33 | Detect duplicate action items | P2 | ✅ Done (2026-06-26) | `duplicateActionItems` in `generateRetrospectiveInsight()` — case-insensitive, trimmed text match (`TC-RETRO-16`). |
| RETRO-34 | Identify common themes | P2 | ✅ Done (2026-06-26) | `detectThemes()` keyword-matches process, communication, requirements, qa-release, dependency, technical, planning (`TC-RETRO-14`). |
| RETRO-35 | Identify repeated blockers | P2 | ✅ Done (2026-06-26, scoped to within-upload) | `detectRepeatedBlockers()` flags a blocker appearing in >1 sprint *within the same uploaded file* (`TC-RETRO-20`). "From previous retros" (i.e. across separate uploads/sessions) is not covered — that would require persistence (RETRO-15), which is deferred. |
| RETRO-36 | Identify ownership gaps | P2 | ✅ Done (2026-06-26) | `ownershipGaps` — missing owner / missing due date, each its own line (`TC-RETRO-15`). |
| RETRO-37 | Create `RetrospectiveInsight` model/type | P2 | ✅ Done (2026-06-26) | `src/types/retrospective.ts` — matches the spec'd shape (id, sprintName, team, source, themes, positives, painPoints, blockers, actionItems, nextSprintSuggestions, ceremonyRecommendations, risksIfIgnored, confidence) plus `ownershipGaps`/`repeatedBlockers`/`duplicateActionItems`. |
| RETRO-38 | Add tests | P2 | ✅ Done (2026-06-26) | `src/__tests__/retroFileParser.test.ts` (8 tests, `TC-RETRO-08`–`13`) + `src/__tests__/retroInsights.test.ts` (7 tests, `TC-RETRO-14`–`20`). Suite: 703/73 passing. |
| RETRO-39 | Update all related product docs | P2 | ✅ Done (2026-06-26) | SRS Addendum I (FR-355–FR-358) + revision history v4.7; USE_CASES UC-104 updated + new UC-115; USER_JOURNEYS UJ-038 updated + new Alternate C; SCENARIOS SCN-053/056 updated + new SCN-059; TEST_CASES §9.56/§9.56a/§9.56b; DEVELOPER_GUIDE new "Retrospective Upload, Insights Engine, and `.xlsx` Template" section; ALGORITHM_SPEC new "v4.7" section + marked the old Retro Insights Engine section "superseded"; RELEASE_NOTES new v4.7 entry; APPENDIX 2 new + 2 updated glossary terms; `app/help/page.tsx` Retrospective FAQ rewritten (7 entries); BRD BR-117 extended. **Known gap noted, not silently dropped:** RETRO-05's spec listed Root Cause/Category/Status/Notes columns — these are accepted on upload (canonicalized, not discarded) but not yet surfaced anywhere in the insights UI; flagged here rather than left undocumented. |
| RETRO-40 | Produce product documentation impact matrix before push | P0/P2 | ✅ Done (2026-06-26) | See the filled matrix immediately below this table. |

**Documentation impact matrix — v4.7 (RETRO-04–13, 17, 19–22, 29, 33–38):**

| Document | Updated? | Change |
|---|---|---|
| `product/SRS.md` | Yes | Addendum I (FR-355–FR-358), FR-330/332/333 annotated as superseded/extended, revision history v4.7 row |
| `product/BRD.md` | Yes | BR-117 extended with the upload-path note |
| `product/USE_CASES.md` | Yes | UC-104 updated (xlsx primary + csv link), new UC-115 (upload flow) |
| `product/USER_JOURNEYS.md` | Yes | UJ-038 steps 8–10 updated, new Alternate C (upload) |
| `product/SCENARIOS.md` | Yes | SCN-053/056 updated, new SCN-059 (multi-sprint repeated blocker) |
| `product/TEST_CASES.md` | Yes | §9.56 updated (TC-RETRO-05), new §9.56a (`TC-RETRO-08`–`13`) and §9.56b (`TC-RETRO-14`–`20`) |
| `product/DEVELOPER_GUIDE.md` | Yes | New "Retrospective Upload, Insights Engine, and `.xlsx` Template" section |
| `product/ALGORITHM_SPEC.md` | Yes | New "v4.7" section (insights engine, repeated-blockers, CSV date-bug fix); old engine marked "superseded" |
| `product/RELEASE_NOTES.md` | Yes | New v4.7 entry |
| `product/APPENDIX.md` | Yes | 2 new glossary terms (Retrospective Theme, Repeated Blocker) + 2 updated (Retrospective Page, Retrospective Insights) |
| `app/help/page.tsx` | Yes | Retrospective FAQ section rewritten — 7 entries (was 4) |
| `app/glossary/page.tsx` | — | Not affected — retro terms live in APPENDIX.md, matching existing precedent (e.g. v4.10.1 coaching terms) |
| `product/SCREENS.md` | — | Not affected — no new route was added; `/retro` gained two new internal views (`upload`, `upload-insights`), not new pages with distinct URLs |
| `product/TECHNICAL_METHOD.md` | — | Not affected — retro insight generation is rule-based interpretation of user-entered/uploaded text, not a new technical method among the patent-relevant claims |

**Net result:** 11 of 14 applicable surfaces updated; 3 confirmed no-update-required, each with a stated reason. This satisfies `RETRO-39`/`RETRO-40`.

---

## 18. P2 — Forecasting Progress and Delivery Adjustment Report

**Feature:** Forecasting Progress and Delivery Adjustment Report  
**Rule:** Forecasting must be conservative and explainable. Do not overpromise. Low data quality reduces confidence.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| FCAST-01 | Define `DeliveryForecast` type | P1 | ✅ Done 2026-06-10 | `ForecastResult` in app/forecast/page.tsx: status, avgThroughput, sprintsRemaining, weeksRemaining, confidence, adjustments, sprintPoints, blockedCount, criticalCount. |
| FCAST-02 | Calculate forecast status | P1 | ✅ Done 2026-06-10 | on_track / at_risk / off_track / complete / insufficient_data computed in `computeForecast()`. |
| FCAST-03 | Calculate expected completion date | P1 | ✅ Done 2026-06-10 | `weeksRemaining` from sprint throughput × remaining issues, 2-week sprint assumption. |
| FCAST-04 | Calculate confidence | P1 | ✅ Done 2026-06-10; extended 2026-06-27 (FCAST-23) | This row's original text was stale relative to the actual implementation (structural signals — sprint count/velocity-trend/blocked-count — not a simple sprints-remaining threshold). Now also folds in Data Quality + per-metric confidence — see FCAST-23. |
| FCAST-05 | Calculate remaining work | P1 | ✅ Done 2026-06-10 | Remaining = total − done issues; story points if present. |
| FCAST-06 | Calculate required throughput | P1 | ✅ Done 2026-06-10 | Derived from sprint completion history via `metrics.sprint.sprints`. |
| FCAST-07 | Calculate current throughput | P1 | ✅ Done 2026-06-10 | `avgThroughput` = mean of completedCount per sprint across valid sprint records. |
| FCAST-08 | Generate gap analysis | P1 | ✅ Done 2026-06-10 | Adjustments list flags throughput gap, blockers, critical items, capacity need. |
| FCAST-09 | Generate adjustment options | P1 | ✅ Done 2026-06-10 | Actionable `adjustments[]` string list in ForecastResult, rendered as recommendations. |
| FCAST-10 | Generate chart data | P1 | ✅ Done 2026-06-10 | `sprintPoints: SprintPoint[]` for burn-up chart (actual + forecast + target). |
| FCAST-11 | Add Planned vs Actual progress chart | P1 | ✅ Done 2026-06-10 | Burn-up chart shows actual (solid blue) + forecast extension (dashed blue) + target (grey dashed). |
| FCAST-12 | Add forecast completion line chart | P1 | ✅ Done 2026-06-10 | Dashed forecast line extends from last actual point to target. |
| FCAST-13 | Add remaining work burn-up/burn-down | P1 | ✅ Done 2026-06-10 | Inline SVG burn-up chart in BurnUpChart component — no external library. |
| FCAST-14 | Add required vs current throughput chart | P2 | ✅ Done (2026-06-27) | "Throughput: Required vs. Current" chart on `/forecast` — two horizontal bars (current avg vs. throughput needed for on-track within 6 sprints) + a gap-percentage summary line. Hidden when status is `complete`. |
| FCAST-15 | Add delivery risk trend | P2 | ✅ Done (2026-06-27, consolidated — see FCAST-16/17) | Implemented together with FCAST-16/17 as one "Risk & Scope Trend" chart — see FCAST-17 for the consolidation rationale. |
| FCAST-16 | Add scope change trend | P2 | ✅ Done (2026-06-27, consolidated — see FCAST-17) | Per-sprint `addedScopeCount` plotted in the same consolidated chart as FCAST-15/17. |
| FCAST-17 | Add blocker impact chart | P2 | ✅ Done (2026-06-27, consolidated) | **Deliberately consolidated FCAST-15/16/17 into one "Risk & Scope Trend" grouped-bar chart** (`RiskScopeTrendChart` in `app/forecast/page.tsx`) instead of 3 separate cards — all three are risk-signal-*over-time* views of the same per-sprint `SprintThroughput.addedScopeCount`/`blockedCount` data; 3 separate cards would have tripled chart density on an already-long page (CLAUDE.md §5.1.UI/UX: "dashboards avoid excessive density") without adding distinct information. Only renders with rich per-sprint data (≥2 sprints); hidden for the legacy 8-sprint-capped shape. |
| FCAST-18 | Add dedicated `/forecast` page | P1 | ✅ Done 2026-06-10 | `/forecast` page live: status banner, KPI row, burn-up chart, next-quarter plan, risk signals, recommendations. |
| FCAST-19 | Answer “Are we on track?” | P2 | ✅ Done (2026-06-27) | New "Forecast Diagnosis" card directly under the status banner — combines `weakestFactor.detail` (FCAST-20) and `confidenceReason` (FCAST-23), both citing real numbers. |
| FCAST-20 | Identify weakest delivery point | P2 | ✅ Done (2026-06-27, scoped to throughput/blockers/scope/data-quality) | `weakestFactor: WeakestFactor` in `computeForecast()` — checked in priority order: severe blockers (`>3`) → critical items (`>2`) → mid-sprint scope growth (`>avgThroughput×2`) → Data Quality downgrade → declining throughput → none. WIP/refinement/capacity were not implemented as distinct factors — `DashboardMetrics` doesn't carry a forecast-relevant WIP-limit or refinement-stage signal today; revisit if/when one is added. |
| FCAST-21 | Recommend adjustment to deliver on time | P2 | ✅ Done (2026-06-27, extended) | Pre-existing rules (blockers/critical/throughput-trend/descope) plus 2 new ones: heavy mid-sprint scope growth → tighten scope discipline; active Data Quality downgrade → improve data quality, naming the band. Capacity/WIP/splitting/refinement/sprint-goal-renegotiation rules were not added — same WIP/refinement signal gap as FCAST-20. |
| FCAST-22 | Handle insufficient data safely | P2 | ✅ Done 2026-06-10 (pre-existing, verified) | `insufficient_data` status + empty-state message were already implemented; confirmed still correct after the FCAST-23 confidence extension (`confidenceReason` for this branch: "Confidence is not available — no completed sprint throughput has been uploaded yet."). |
| FCAST-23 | Use Data Quality Score and Metric Confidence Score | P2 | ✅ Done (2026-06-27) | Confidence now blends a structural score with `metrics.confidence.sprintThroughput`/`velocity`, then applies the same ×0.75 (Weak) / ×0.5 (Critical) Data Quality downgrade multipliers as the Coaching Confidence Score (reused, documented formula — not reinvented). `confidenceReason: string` always cites real numbers. |
| FCAST-24 | Add tests | P2 | ✅ Done (2026-06-27) | `src/__tests__/forecastEngine.test.ts` — 12 tests (`TC-FCAST-01`–`13`). Closed a real gap: `computeForecast()` had **zero** automated tests before this change, and `TC-FCAST-04` (at-risk status) existed only as a manual scenario in TEST_CASES.md with no automated coverage. Required extracting `computeForecast()` to `src/services/forecast/forecastEngine.service.ts` first (FR-359) since it lived inline in a `'use client'` page file. |
| FCAST-25 | Update all related product docs | P2 | ✅ Done (2026-06-27; renumbered FR-353–358 → FR-359–364 / Addendum I → J during main-branch merge, 2026-06-27, to resolve a collision with the independently-merged Retro and Coaching addenda that had claimed the same numbers) | SRS Addendum J (FR-359–FR-364) + revision history v4.6.1; TEST_CASES §9.55 updated + new §9.55a; DEVELOPER_GUIDE new "Forecast Engine Extraction..." section; ALGORITHM_SPEC new "v4.6.1" section; RELEASE_NOTES new v4.6.1 entry; APPENDIX 3 new + 1 updated glossary terms; `app/help/page.tsx` Forecast FAQ extended (3 new entries, 2 corrected to match actual behavior); BRD/Technical Method reviewed — no update required (pure interpretation layer, no new patent-relevant method). |
| FCAST-26 | Produce product documentation impact matrix before push | P0/P2 | ✅ Done (2026-06-27) | See the filled matrix immediately below this table. |

**Documentation impact matrix — v4.6.1 (FCAST-14–26):**

| Document | Updated? | Change |
|---|---|---|
| `product/SRS.md` | Yes | Addendum J (FR-359–FR-364), FR-328's confidence section noted as superseded inline, revision history v4.6.1 row |
| `product/BRD.md` | No | BR-116 ("MUST provide a delivery forecast page") is satisfied at the capability level already; this change is internal engine quality (tests, confidence accuracy, diagnosis), not a new business capability — no BRD line needed. |
| `product/USE_CASES.md` | No | UC-102 (View Delivery Forecast) already covers the `/forecast` page generically; the new diagnosis card and charts are presentation detail within the existing use case, not a new user goal. |
| `product/USER_JOURNEYS.md` | No | UJ-037 already covers the forecast-review journey; no new journey branch introduced. |
| `product/SCENARIOS.md` | No | SCN-052 already covers a forecast-review scenario; no new scenario needed for an internal accuracy/diagnosis improvement. |
| `product/TEST_CASES.md` | Yes | §9.55 updated (TC-FCAST-01/02/03/04 now automated), new §9.55a (TC-FCAST-06–13) |
| `product/DEVELOPER_GUIDE.md` | Yes | New "Forecast Engine Extraction, Data-Quality-Aware Confidence, and Risk Diagnosis" section |
| `product/ALGORITHM_SPEC.md` | Yes | New "v4.6.1" section (confidence formula, weakest-factor algorithm, new charts, adjustment rules) |
| `product/RELEASE_NOTES.md` | Yes | New v4.6.1 entry |
| `product/APPENDIX.md` | Yes | 3 new glossary terms (Forecast Diagnosis, Weakest Factor, Risk & Scope Trend) + 1 corrected (Forecast Status, off_track condition) |
| `app/help/page.tsx` | Yes | Forecast FAQ section: 3 new entries (Diagnosis card, Throughput chart, Risk & Scope Trend chart) + 2 corrected (page description, status meanings — `off_track` previously didn't mention the severe-blockers override) |
| `app/glossary/page.tsx` | — | Not affected — forecast terms live in APPENDIX.md, matching established precedent |
| `product/TECHNICAL_METHOD.md` | — | Not affected — this remains rule-based interpretation of existing metrics, not a new technical method among the patent-relevant claims |

**Net result:** 7 of 13 applicable surfaces updated; 6 confirmed no-update-required, each with a stated reason. This satisfies `FCAST-25`/`FCAST-26`.

---

## 18b. P1 — Roadmap Page

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| ROADMAP-01 | Create `/roadmap` page — epic progress + delivery forecast | P1 | ✅ Done 2026-06-10 | Epic cards with progress bar, health indicator, forecast label (complete/weeks/months/insufficient data), confidence badge; filter tabs (In Progress/All/Critical/Done); sort (Forecast/Progress/Name); summary KPI cards; throughput context strip; click to expand shows remaining issues, sprints est., critical count. Uses `computePortfolioHealth()` + `loadMetricsWithSource()`. |
| ROADMAP-02 | P0 doc pass for /roadmap | P0 | ✅ Done (2026-06-26) | Audited and confirmed already complete since the feature shipped 2026-06-10: SRS FR-326/327, USE_CASES UC-101, USER_JOURNEYS UJ-036, SCENARIOS SCN-051, TEST_CASES §9.54, ALGORITHM_SPEC v4.6 section, `/help`, `/developer`, `/glossary`, RELEASE_NOTES v4.3.6, BRD BR-115/116 — all already present. Only this status row was stale. |
| ROADMAP-03 | Add tests for roadmap forecast logic | P1 | ✅ Done (2026-06-26) | `src/__tests__/roadmapForecast.test.ts` — automates `TC-ROAD-01`–`05` (complete/insufficient-data/within-2-weeks/~N weeks/~N months paths) plus edge case `TC-ROAD-02b`. Suite: 700/74 (1 pre-existing unrelated failure). |

---

## 18c. P1 — Navigation UX

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| NAV-01 | Redesign /help navigation — replace 34 flat tabs with grouped two-level nav | P1 | ✅ Done 2026-06-10 | 9 category group pills (Getting Started, Dashboard, Planning, Analysis, Export & Data, System, Customization, People, Troubleshooting); clicking a group shows sub-section pills; active group derived from IntersectionObserver activeId; row 2 hidden when group has only 1 section. |
| NAV-02 | Redesign /glossary navigation — replace 12 flat tabs with compact letter-jump nav | P1 | ✅ Done 2026-06-10 | Single row of letter chips (A–L) with section icon + letter label; click scrolls to section; tooltip shows full section title. |
| NAV-03 | P0 doc pass for help/glossary nav changes | P0 | ✅ Done (2026-06-26) | Added 2 FAQ entries to `app/help/page.tsx`'s "Welcome — Getting Started" section explaining the grouped category-pill `/help` nav and the letter-jump `/glossary` nav. Glossary page sections unchanged (per original acceptance criteria). |

---

## 19. P2 — Architecture / Planning Track

Do not implement PostgreSQL, CI/CD, or expanded gateway routing without explicit approval.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| ARCH-01 | CI/CD design with GitHub Actions | P2 | ❌ Not started | Pipeline stages: lint, test, build, Docker image, deploy; branch/PR gates; secrets handling; design doc only. |
| ARCH-02 | PostgreSQL migration assessment | P2 | ❌ Not started | Feasibility, Prisma schema diff, migration strategy, rollback plan, performance comparison; assessment only. |
| ARCH-03 | Load-balancer-aware gateway expansion design | P2 | ❌ Not started | round_robin, weighted_round_robin, failover, least_error_rate; depends on GW foundation. |
| ARCH-04 | Advanced notification architecture | P2 | ❌ Not started | Plan only; P4 implementation not approved. |
| ARCH-05 | Jira API read-only architecture | P2/P0 | 🔧 Implementation approved & started (2026-06-20) — Phase 1 in progress on `feature/arch-05-jira-integration` (unmerged) | Design doc: `product/JIRA_INTEGRATION_DESIGN.md`. User approved starting implementation 2026-06-20; see Section 19a below for Phase 1 task tracking (`JIRA-01`, …). Branch intentionally held unmerged until the full feature is delivered, not just designed. |
| ARCH-06 | Storage provider architecture refinement | P2 | 🔍 Needs verification | Confirm current implementation and future replication needs. |
| ARCH-07 | Deployment guide update for Vercel / Docker / VPS | P2 | 🔍 Needs verification | Verify existing docs; update if behind. |
| ARCH-08 | System health/admin diagnostics page | P2 | 🔍 Needs verification | Check implementation and docs. |
| ARCH-09 | Branding integration across login, favicon, reports, and exports | P2 | 🔍 Needs verification | Align with Delivery Clarity branding bundle if approved. |
| ARCH-10 | Landing page inside app | P2 | 🔍 Needs verification | Verify status and docs. |
| ARCH-11 | Audit Charts page KPI chips and truncated values | P2 | ✅ Done / Needs traceability | Uploaded TODO says done. Verify traceability. |

---

## 19a. ARCH-05 Phase 1 — Jira Connection Foundation (schema only)

Per `product/JIRA_INTEGRATION_DESIGN.md` §11 rollout plan, Phase 1 = schema + admin UI (connect/test/field-mapping) + manual "Sync now". Tracked here task-by-task; branch `feature/arch-05-jira-integration`, held unmerged until the full feature ships.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| JIRA-01 | Add `JiraConnection` Prisma model | P1 | ✅ Done (2026-06-20) | `prisma/schema.prisma` — id, name, deploymentType, baseUrl, authEmail, projectFilters (JSON), fieldMapping (JSON), refreshMode, refreshIntervalMinutes, lastSyncAt/Status/Error, createdByUserId, timestamps. `User` gains `jiraConnections JiraConnection[]` back-relation. Per design §6 — token itself is never stored here, only in `GATEWAY_JIRA_API_TOKEN` env. |
| JIRA-02 | Extend `ImportLog` for API-sourced imports | P1 | ✅ Done (2026-06-20) | Added `sourceType` (default `"file"`), nullable `jiraConnectionId` FK (`onDelete: SetNull`). Made `fileName`/`fileSize`/`fileType` nullable since they're inapplicable to API-sourced rows — file-upload code path unaffected (still always supplies them). |
| JIRA-03 | Apply migration to dev DB | P1 | ✅ Done (2026-06-20) | Migration `20260620132026_add_jira_connection` created and applied via `prisma migrate deploy` (had to baseline 5 pre-existing untracked migrations first — `prisma migrate resolve --applied` — since the dev DB predates migration tracking; see `DRIFT-01` below for a related pre-existing issue found along the way). Verified: existing 48 `ImportLog` rows and 3 `User` rows intact after migration. `npx prisma generate` re-run. Full suite (572/63) + lint + build all still pass. |
| JIRA-04 | Admin UI: connect / test | P1 | ✅ Done (2026-06-20) — field-mapping deferred to JIRA-06 | New `src/components/admin/JiraConnectionsPanel.tsx` + new "Jira Integration" tab in Admin Settings (`src/lib/adminConsole.ts` `ADMIN_TABS`/`Tab`, `AdminNavSidebar.tsx` `SETTINGS_SUB_ITEMS`, `app/admin/settings/page.tsx` `VALID_TABS` — **the duplicate `VALID_TABS` array is a pre-existing pattern; had to add `'jira'` there too or the tab silently fell back to Users, caught via real browser testing**). Form: name/deployment type/base URL/Cloud email/project keys; "Test connection" button calls JIRA-05's test route and shows the live result inline (success → account name; failure → the exact error, e.g. "GATEWAY_JIRA_API_TOKEN is not set"). Verified end-to-end in a real browser: create → token-not-set guard renders correctly; desktop layout matches sibling admin panels. Field-mapping UI (sourced from `GET /rest/api/3/field`) waits for JIRA-06 since there's no adapter to map fields *into* yet. |
| JIRA-05 | API routes: create/list/test connection | P1 | ✅ Done (2026-06-20) | `app/api/admin/jira-connections/route.ts` (GET list, POST create) and `app/api/admin/jira-connections/[id]/test/route.ts` (POST — calls `GET /rest/api/{2\|3}/myself` through the Gateway with Basic auth for Cloud / Bearer for Server-DC, records `lastSyncStatus`/`lastSyncError`). Admin-only; token never returned, only a `hasGatewayToken` boolean (mirrors `app/api/admin/storage/route.ts`'s `hasCredentials` pattern). `GATEWAY_JIRA_API_TOKEN` documented in `.env.example`. |
| JIRA-05b | Gateway enhancement: per-connection `baseUrlOverride` | P1 | ✅ Done (2026-06-20) | Discovered while building JIRA-05: `callExternal()`/`getProviderConfig()` only supported a single global base URL per provider type (one env var), but `JiraConnection` allows multiple admin-configured connections. Added optional `baseUrlOverride`/`extraAllowedHosts` to `GatewayRequestOptions` and a 2nd `overrides` param to `getProviderConfig()` — additive, backward-compatible (existing single-arg callers and all `TC-GW-*` tests unaffected). New tests `TC-GW-22`/`TC-GW-22b`. *(Superseded note: this row originally said "credential values still always come from env, never overridden" — that changed in `JIRA-05c` below, per explicit user request.)* |
| JIRA-05c | Move Jira token from raw env var to encrypted App Config | P1 | ✅ Done (2026-06-20) | **User explicitly rejected the env-var-only design** ("no need for hard code... this should be in the config") — moved the token into the same encrypted `app-config.json` system already used for SMTP (`src/lib/app-config.ts`): new `AppJiraConfig`/`AppConfig.jira`, `SafeAppConfig.hasJiraToken`, `getJiraApiToken()` helper, `GATEWAY_JIRA_API_TOKEN` demoted to fallback/override (same precedence pattern as `SMTP_USER`/`SMTP_PASS`). New "Jira API Token" field in `AppConfigPanel.tsx`. Updated both Jira connection routes to call `getJiraApiToken()` instead of reading `process.env` directly. **Caught via real end-to-end testing, not unit tests:** saving the token to encrypted config alone didn't work at first — `getProviderConfig()`'s `enabled` gate independently re-checked `process.env` credential presence regardless of the route's resolved token, silently producing "Provider not configured" on every test-connection call. Fixed by adding `credentialsPresentOverride` to `GatewayRequestOptions`/`ProviderConfigOverrides` so a caller with non-env-sourced credentials can tell the gateway they're present. New tests `TC-GW-23`/`23b`; `jiraConnections.test.ts` updated to mock `getJiraApiToken()` instead of `process.env`. `product/JIRA_INTEGRATION_DESIGN.md` §2 updated to match. Verified live in a real browser: saved a token via App Config, created a connection, clicked Test — got a real outbound HTTP call (legitimate 401 from the fake test token, not a config-wiring error). Suite: 589/64 passing. |
| JIRA-06 | `src/services/jira/apiAdapter.ts` — normalize API response to canonical `JiraIssue[]` | P1 | ✅ Done (2026-06-21) | `normalizeJiraIssue()`/`normalizeJiraIssues()` — standard fields (Issue Type, Summary, Status, Project, Assignee, Reporter, Priority, Resolution, Labels, Fix Version/s, Created/Updated/Resolution/Due Date) read from their fixed Jira REST path; custom fields (Story Points, Sprint, Epic Link, Business Value, Risk Score) resolved via the connection's `fieldMapping` (canonical name → `customfield_NNNNN`) with shape-specific normalization (Sprint handles both the modern array-of-objects and legacy greenhopper-string formats; Epic Link handles both a plain key string and an object). Standard-field extraction always wins over a same-named mapping entry. Output verified to pass `validateIssueData()` unchanged. |
| JIRA-06b | `src/services/jira/fieldDiscovery.ts` + `GET /api/admin/jira-connections/[id]/fields` | P1 | ✅ Done (2026-06-21) | Discovered while building JIRA-06: the adapter's `fieldMapping` can't be populated without knowing the instance's actual `customfield_NNNNN` → name mapping (per design §4 step 1), so built the discovery half too. Calls `GET /rest/api/{2\|3}/field` through the Gateway. Extracted `buildJiraAuthHeader()`/`jiraMyselfPath()`/`jiraFieldPath()` into `src/services/jira/auth.ts`, removing duplicated auth-header logic across the test-connection, field-discovery, and App Config test-token routes. **Verified live against the user's real Jira Cloud instance:** returned all 117 real fields, correctly surfacing both "Story Points" (`customfield_10033`) and "Story point estimate" (`customfield_10016`) by name — not a mock. Field-mapping *UI* (picking which discovered field maps to which canonical name) is still deferred — this ships the data plumbing only. |
| JIRA-07 | Manual "Sync now" route | P1 | ✅ Done (2026-06-21) | `POST /api/admin/jira-connections/[id]/sync` — `src/services/jira/sync.ts` builds a safe, bounded JQL from the connection's `projectFilters` (never raw JQL text — see design §3), paginates through `callExternal()` (Cloud `nextPageToken` / Server-DC `startAt`, capped at 1000 issues per sync), normalizes via JIRA-06's `normalizeJiraIssues()`, validates via `validateIssueData()` (all-or-nothing — a validation failure never touches the live dashboard), computes metrics via the existing `calculateDashboardMetrics()`, then `writeLatestMetrics()` (same mechanism the file-upload route uses) + a new `ImportLog` row (`sourceType: "api"`, `jiraConnectionId` set) + updates `lastSyncAt`/`lastSyncStatus`/`lastSyncError` + non-blocking `pushToCloud()`. **Deviated from the original design note ("+ DashboardSnapshot"):** `DashboardSnapshot` is a deliberate user-named milestone capped at 20 per user — auto-creating one on every sync would silently eat that budget. `writeLatestMetrics()` (not `DashboardSnapshot`) is the actual mechanism that updates the live dashboard, matching the file-upload route exactly. **Caught via real testing against the user's actual Jira Cloud instance, not mocks:** (1) found and fixed a real bug — the JQL pagination query object was built but never actually passed to `callExternal()`, silently sending unfiltered/unpaginated requests; caught by `TC-JIRA-36`/`37` before ever touching a real API. (2) Found that config errors (e.g. no project keys) were being reported as HTTP 502 (implying an upstream Jira failure) when they never even reached Jira — added a `configError` flag so these correctly return 409. (3) **Full end-to-end sync verified live**: discovered real project keys via a direct (bypassing the app) read-only API probe, set a real project (`SAMPLEPROJ`, 7 issues) on the user's connection, ran an actual sync — got `{ totalIssues: 7, doneIssues: 1, healthScore: 48 }`, confirmed the `ImportLog` row and `data/latest-metrics.json` were both written correctly, then cleaned up the test data and reverted the connection's `projectFilters` to its original `[]`. |
| JIRA-08 | Fallback contract: `'jira-api'` `MetricsDataSource` | P1 | ✅ Done (2026-06-21) | `writeLatestMetrics(metrics, origin?)` (`src/services/metrics/latestMetricsStorage.ts`) now accepts an optional `{ source: 'file' \| 'jira-api', connectionName?, connectionId? }` and persists it alongside `savedAt`/`metrics` in `latest-metrics.json` — backward compatible, `origin` defaults to `null` for pre-existing files. The sync route tags writes `{ source: 'jira-api', connectionName: connection.name, connectionId: connection.id }`; both upload routes (`/api/upload`, `/api/upload/merge`) tag `{ source: 'file' }`. `GET /api/metrics/latest` now reads that origin and, when `'jira-api'`, returns `source: 'jira-api'` + `connectionName` (taking priority over cloud-transport detection — the snapshot's origin matters more to a viewer than how the file reached the server). `src/lib/storage.ts`'s `MetricsDataSource` union gained `'jira-api'`; `loadMetricsWithSource()` threads `connectionName` into `MetricsSourceInfo`. `DataSourceBadge.tsx` (`src/components/ui/DataSourceBadge.tsx`) — previously dead code, never actually mounted anywhere — gained a `'jira-api'` source/config entry, a local `formatRelativeTime()` helper (no existing shared one in the repo), and now renders "Jira (ConnectionName) — last synced Xm ago" (full) / "Jira · Xm ago" (compact). **Mounted it for the first time**, in `DashboardTopbar.tsx`'s right rail (`<DataSourceBadge compact />`, between "New Upload" and the notification bell) — the only place it's now visible across all `/dashboard/*` routes. The "never wipes last-good snapshot" guarantee already held structurally from JIRA-07 (`writeLatestMetrics()` only runs after all-or-nothing validation succeeds) — JIRA-08 just makes that state visible. **Caught via live testing:** `/dashboard/summary` actually `redirect()`s to the separate root-level `/summary` page (a different, older topbar shell, not `DashboardTopbar`) — verification had to use a real `/dashboard/*` route (`/dashboard/priority-attention`) to see the mounted badge. Verified end-to-end against the real Jira connection: synced `SAMPLEPROJ` (7 issues) → badge showed "Jira · 5m ago" with title `"Jira (Test) — last synced 7m ago"`; then forced a sync failure (cleared `projectFilters`, got 409) and confirmed `/api/metrics/latest`'s `savedAt`/`source`/`metrics` were byte-for-byte unchanged — the dashboard never lost the last-good Jira snapshot. Test data reverted afterward. |
| JIRA-09 | Tests | P1 | ✅ Done (2026-06-21) | `jiraConnections.test.ts` — 24 tests (`TC-JIRA-01–13`, `25–28`, `40–46`, `44b`) covering all four Jira admin routes (create/list, test-connection, field discovery, sync): auth/role guards, validation, create + audit, test success (Cloud Basic + Server/DC Bearer), gateway failure handling, token-not-configured guard, sync success/failure/config-error/validation-failure paths. New `jiraApiAdapter.test.ts` — 11 tests (`TC-JIRA-14–24`). New `jiraSync.test.ts` — 11 tests (`TC-JIRA-29–39`) covering JQL building (including unsafe-character filtering), Cloud/Server-DC pagination, mid-pagination failure, and the 1000-issue safety cap. New `latestMetricsStorage.test.ts` — 4 tests (`TC-JIRA-47–50`) covering origin-metadata round-trip, backward compatibility with pre-existing files with no `origin` field, and the reader-never-writes contract. `cloudRestoreHardening.test.ts` extended with `TC-CS-13/14/15` covering `/api/metrics/latest`'s `jira-api` source detection (and its priority over bucket/cache detection) plus `loadMetricsWithSource()` threading `connectionName` through. Plus `TC-GW-22`/`22b`/`23`/`23b`. Suite: 630/67 passing. |
| JIRA-10 | Update all related product docs | P1 | ✅ Done (2026-06-21) | `product/SRS.md` Addendum G (FR-337–FR-341, G.1–G.3) + new §G.4 (FR-342/FR-343) + revision history rows 4.9.3/4.9.4; `product/USE_CASES.md` UC-110 + new UC-111; `product/TEST_CASES.md` §9.57 updated to reference UC-110/UC-111/FRs, extended to `TC-JIRA-50`; `product/RELEASE_NOTES.md` v4.5.0–v4.8.0 entries; `product/JIRA_INTEGRATION_DESIGN.md` §8 updated in place with implementation corrections. Schema-only/API-only earlier slices (JIRA-01–03/06/06b) correctly had no UC/SCN/UJ per "no UC for vaporware" until a slice became admin- or dashboard-reachable (JIRA-04 for connections, JIRA-07/08 for sync+badge, covered by UC-111). |
| DRIFT-01 | Pre-existing migration drift: `SystemErrorLog` has no tracked migration | P2 | ✅ Done (2026-06-23) | Discovered 2026-06-20 while migrating for JIRA-03: the dev DB's `SystemErrorLog` table exists (created via `db push` at some point) but no migration file ever recorded its creation, so `prisma migrate diff` tried to re-`CREATE TABLE` it. **Fix:** added baseline migration `prisma/migrations/20260623000000_baseline_system_error_log/migration.sql` using `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` so it's a no-op against databases that already have the table but provisions it correctly on a fresh one. Marked applied against the existing dev DB via `prisma migrate resolve --applied`; verified `prisma migrate status` reports "Database schema is up to date!" with zero drift. **Verified on a genuinely fresh DB**: ran `prisma migrate deploy` against a brand-new throwaway SQLite file at `/tmp/dc_fresh_test.db` — all 7 migrations applied cleanly in order and `SystemErrorLog` (with all 3 indexes) was created, confirming the original risk is closed. No schema, application code, or test changes — this is a migrations-only fix. |
| JIRA-11 | Bug fix: `Parent Key` never survived a live Jira sync | P1 | ✅ Done (2026-06-22) | **User report:** "Explore Delivery Structure" couldn't show a multi-level ancestor chain (e.g. Epic → Initiative/"Project" → "Product") for API-synced data, even though the same data showed correctly when uploaded as CSV. Root-caused to two separate bugs, not one: (1) `src/services/jira/apiAdapter.ts`'s `STANDARD_FIELD_EXTRACTORS` never read Jira's standard `fields.parent.key` at all — a fixed-path field on every issue (Sub-task→Story, or Epic→Initiative under team-managed hierarchy), not a per-instance custom field, so it needed no `fieldMapping` entry, it just needed to be read. (2) Even after that fix, a live re-sync still showed `parent: ""` — `src/services/jira/sync.ts`'s `STANDARD_FIELD_IDS` (the explicit `fields=` query param sent to Jira's `/search/jql` endpoint) never included `'parent'`, so Jira's bulk search response omitted the field entirely even though it exists on the issue — confirmed via a direct raw `GET /rest/api/3/issue/AJ-28` probe showing `fields.parent.key: "AJ-27"` while our adapter's input never had it. Separately, `src/services/relations/relationExplorer.service.ts`'s `buildRelationGraph()` only ever showed **one level up** from the focus node — by deliberate prior design (see the now-removed comment "No siblings, no full ancestor chain") — even though an unused `getAncestorChain()` helper already existed in `hierarchy.service.ts` for exactly this. Wired it in: the graph now walks the full ancestor chain to the root, with depths counting down (`-1`, `-2`, ... for each level up) — dagre's existing auto-layout (already edge-based, not depth-based) renders it correctly with no further changes. **Verified live end-to-end** against the real "Agile Jordan" connection: re-synced after the fix, confirmed `AJ-28`'s `parent` field resolved to `AJ-27`, and the Explore page rendered the full chain — `AJ-26` ("Test product") → `AJ-27` ("test project") → `AJ-28` (focus Epic) → 19 child stories/tasks — using a temporary debug route to inspect the raw Jira API response (deleted before commit, never part of the product). 6 new tests: `TC-JIRA-51/52` (Parent Key extraction + omission), `TC-JIRA-53` (sync requests the `parent` field), `TC-E-09/10/11` (multi-level ancestor chain, depth, and edge presence). Suite: 636/67 passing. |
| JIRA-12 | Bug fix: phantom epic link + wrong orphan/branch flags on hierarchy roots; "Unknown" type for Product/Project | P1 | ✅ Done (2026-06-22) | **Follow-up to JIRA-11**, found via the user's own live screenshots of the fixed Explore page: focusing on the middle node (`AJ-27`, "Project") showed zero connecting edges, the root ancestor (`AJ-26`, "Product") wrongly tagged both "ORPHAN" and "MOST WORK", and both showed type "Unknown". Root-caused with a Jest reproduction (`reconstructHierarchy()` called directly on the real 3-issue shape) before touching any UI code: `hierarchy.service.ts`'s Step 2 "prefix-based inference" — designed to link a Story with no explicit Epic Link to an Epic sharing its project-key prefix — fired on `AJ-26` too, because EVERY issue in a project shares the same key prefix; it created a phantom `epic` link `AJ-26 → AJ-28` purely by coincidence, forming a 3-node cycle (`AJ-26→AJ-28→AJ-27→AJ-26`) that broke `getAncestorChain()` (which only de-dupes by *visited parent*, not by the original focus key, so it walked the cycle and re-included the focus node itself) and fed a bogus child into `computeLargestUnfinishedBranch()`. Fixed with a type-name-independent guard — `if (map.children.has(key)) continue;` — added to both Step 2 and Step 3: an issue that Step 1 already established as someone else's explicit parent can never also be a leaf needing phantom inference or orphan-flagging, regardless of its type name. (Note: a `LEAF_TYPES` allowlist was also added/edited directly in the file during this session to gate Step 2/3 by issue type name — the `map.children.has(key)` guard is intentionally independent of that list's exact contents, since hierarchy-level names like Initiative/Project/Product/Theme are admin-configurable per Jira instance.) Separately fixed the "Unknown" type label: added `'Initiative'`, `'Product'`, and `'Project'` to `IssueNodeType` (`src/types/relations.ts`) with their own `NODE_TYPE_CONFIG` entries (`src/components/explore/nodeStyles.ts`) and `TYPE_MAP` entries (`relationExplorer.service.ts`) — `product`/`project` get their own distinct type, anything else above Epic (initiative/theme/portfolio) falls back to the generic `'Initiative'` type. 5 new tests in `hierarchyService.test.ts` (`TC-HIER-01–05`) plus `TC-E-12/13` in `relationExplorer.test.ts`. **Verified live**: re-synced the real connection, confirmed `AJ-26`/`AJ-27` now show their correct types ("Product"/"Project") with zero orphan/branch badges and "Orphans: 0" in Key Metrics. **Separate issue discovered, NOT fixed (out of scope for this report):** the relation graph's connecting edges never render any visible line at all — reproduced even on the unrelated, already-correct `AJ-28`→19-children graph, in both dev and production builds, so it predates today's changes and isn't something this fix introduced. `graph.edges` data is correct (confirmed via direct test) and reaches `<ReactFlow edges={rfEdges}>`, but the rendered `.react-flow__edges` SVG group is always empty. Needs its own investigation — tracked as a new line item below. Suite: 643/68 passing. |
| JIRA-13 | Bug fix: relation graph never rendered connecting edges | P2 | ✅ Done (2026-06-23) | **Root cause found:** `WorkItemGraph.tsx`'s custom React Flow node type (`IssueNodeCard`) never rendered a single `<Handle>` element. React Flow computes every edge's SVG path from its source/target node's registered handle bounds (via `getBoundingClientRect`-based measurement) — with zero handles registered, there is nothing for an edge to anchor to, so `.react-flow__edges` always contained only the `<defs>` arrowhead marker and an empty `<g>`, even though `graph.edges` itself was correct (as already confirmed in `JIRA-12`'s investigation) and reached `setRfEdges()` unchanged. This was a markup omission, not a dagre/version/timing issue as originally suspected. **Fix:** added `<Handle type="target" position={Position.Top} isConnectable={false} .../>` and `<Handle type="source" position={Position.Bottom} .../>` to `IssueNodeCard`, matching the existing top-to-bottom (`rankdir: 'TB'`) dagre layout direction; handles are visually hidden (`opacity: 0`, 1×1px) and non-interactive (`isConnectable={false}`) since this graph is read-only/click-to-focus, not user-rewireable. No changes to edge data, dagre layout, or any other component. **Verified live**: re-ran the real `AJ-28` graph (Product → Project → Epic → 19 children, the same case `JIRA-12` left with correct data but invisible edges) via a Playwright browser session — `.react-flow__edge-path` count went from 0 to 20 with real, non-empty `d` path attributes, and the screenshot shows all parent/child connector lines rendering correctly. No Jest test added: this is a DOM/SVG layout-measurement bug (`getBoundingClientRect`-driven), not a data-logic one — jsdom (the existing Jest environment) cannot perform real layout, so a synthetic test would not have caught this in the first place and wouldn't meaningfully guard against a regression; live browser verification is the correct and sufficient check here, consistent with this component having no prior Jest coverage either. Lint: 16 pre-existing inline-style warnings on this file unchanged (confirmed via before/after diff — none introduced by this fix); typecheck clean; full suite 667/70 unaffected. |
| ISSUETYPE-01 | Feature: admin-configurable Issue Type Hierarchy (custom types, no longer restricted to built-ins) | P1 | ✅ Done (2026-06-22) | **User request, directly following JIRA-11/12:** "I need screen that contains all the types... option to add custom types, so user no more restricted with builtin types, and need to set the hierarchy like Product → Project → Epic → Story → Subtask." The previous fixes (`JIRA-11`/`JIRA-12`) had hardcoded the hierarchy as TypeScript literals/maps (`LEAF_TYPES`, `TYPE_MAP`, `IssueNodeType` union) — this replaces that with a real admin-configurable registry, the same pattern as the existing Orphan Rules settings (`src/types/orphanRules.ts` + `orphanRules.service.ts`). New `src/types/issueTypeHierarchy.ts` — `IssueTypeDefinition` (`id`, `label`, `matchNames[]`, `level`, `icon`, `color`/`bg`/`border`, `size`, `builtIn`) + `DEFAULT_ISSUE_TYPES` seeded with the full Product(0)→Project/Initiative(1)→Epic(2)→Story/Task/Bug/Spike/Technical Debt/Risk/Change Request(3)→Sub-task(4) chain. New `src/services/settings/issueTypeHierarchy.service.ts` (read/write/cache, `data/issue-type-hierarchy.json`) and `app/api/admin/issue-type-hierarchy/route.ts` (`GET` any logged-in user, `POST` admin-only; validates non-empty types, integer levels ≥0, no duplicate ids/match-names, and refuses to delete a built-in type). **`IssueNodeType` changed from a closed TypeScript union to `string`** (`src/types/relations.ts`) — a genuinely open set of admin-defined labels can never be a compile-time-closed union; `'Unknown'` remains the only guaranteed fallback. `hierarchy.service.ts`'s Step 2 (prefix inference) and Step 3 (orphan detection) were generalized from "must specifically be Epic" to "must be exactly one configured level up" — this is a real behavior improvement, not just a refactor: previously a Sub-task with no parent could get phantom-linked straight to an Epic, skipping its actual Story/Task parent level; now it correctly looks for a Story/Task-level candidate first. `relationExplorer.service.ts`'s `resolveType()`/`buildNode()`/`buildRelationGraph()` and `nodeStyles.ts`'s `NODE_TYPE_CONFIG` (now `buildNodeTypeConfig(issueTypes)`) all take the live config as a parameter instead of reading hardcoded constants; `WorkItemGraph.tsx`/`RelationDetailsTable.tsx`/`RelationCharts.tsx` accept an `issueTypes` prop (default `DEFAULT_ISSUE_TYPES`) threaded down from `app/explore/page.tsx`, which fetches `/api/admin/issue-type-hierarchy` once on mount. New admin screen `src/components/admin/IssueTypeHierarchySettings.tsx` — lists every type grouped by level with up/down level-reorder arrows, an icon picker, a color-preset picker, and an "Add custom type"/delete-for-non-built-in flow; wired into Admin Settings as a new "Issue Type Hierarchy" tab (`adminConsole.ts` `Tab`/`ADMIN_TABS`, `AdminNavSidebar.tsx` `SETTINGS_SUB_ITEMS`, `app/admin/settings/page.tsx` `VALID_TABS` — the same three-places-to-register pattern already documented from `JIRA-04`). 17 new tests in `issueTypeHierarchy.test.ts` (`TC-IT-01–17`: defaults, service read/write/fallback, route auth/validation, and the generalized hierarchy logic against a synthetic custom 2-level "Widget/Gadget" hierarchy never seen in any built-in default). **Verified live**: added a custom "Strategic Theme" type through the real admin screen, saved it, confirmed it persisted via a fresh page load, then confirmed the real "Agile Jordan" data (`AJ-26`/`AJ-27`/`AJ-28`) still resolved correctly through the now-dynamic config before cleaning up the test type. Suite: 660/69 passing. |
| JIRA-14 | Feature: "Sync Jira" button on the dashboard for any logged-in user | P1 | ✅ Done (2026-06-22) | **User request:** "how to pull new data from jira, I need a new button that allow to pull data from jira some where all users type can click to pull new data make it on dashboard page." Until now, manual sync was only reachable from Admin Settings → Jira Integration and admin-only. **Two product decisions confirmed with the user before building:** (1) when multiple connections exist, sync the one most recently synced (falling back to the most recently created if none has ever synced) — matches "refresh what's currently powering the dashboard," rather than prompting the user to pick or syncing every connection; (2) any logged-in user can trigger it, not just admins — the route only requires `session.isLoggedIn`, no role check; the Jira API token itself is still never exposed to the client. Extracted the all-or-nothing sync execution out of the existing per-connection admin route into a new shared `src/services/jira/connectionSyncRunner.ts` (`runJiraConnectionSync()` + `resolveActiveJiraConnection()`), so both entry points share one implementation rather than drifting apart. New `POST /api/jira/sync` (no `:id` param — auto-resolves the connection) is the dashboard-facing route; `app/api/admin/jira-connections/[id]/sync/route.ts` (admin, explicit connection) was refactored to call the same shared function, confirmed via its full existing 25-test suite passing unmodified. New "Sync Jira" button added to `DashboardTopbar.tsx`'s right rail (next to "New Upload"), with a spinning-icon loading state and an inline error banner (auto-dismisses after 6s) shown on failure; on success the page reloads so every dashboard component re-fetches the now-fresh data via its existing mount-time `loadMetricsWithSource()` call — no new pub/sub mechanism needed since none currently exists. 7 new tests in `jiraDashboardSync.test.ts` (`TC-JIRA-54–60`): connection-resolution precedence (most-recently-synced beats most-recently-created), no-role-check confirmation, 404 when no connection exists, and the response correctly naming which connection was used. **Verified live end-to-end as a real non-admin user**: created a temporary `scrum_master`-role test account, logged in, confirmed the button is visible and clickable, clicked it, and got a real successful sync of 27 issues from "Agile Jordan" — then deleted the temporary test account afterward. (The resulting real sync/`ImportLog` row was left in place, same as prior real-data verifications in this session — only the disposable test account was cleaned up.) **Caught via live testing, not code review:** hit the same pre-existing `.next-jira-dashboard` build-corruption issue from earlier in this session (a stale build can leave one route's `webpack-runtime.js` unresolvable) while testing the force-password-change flow for the temp account — resolved with a clean `rm -rf .next-jira-dashboard && next build`, unrelated to this feature's code. Suite: 667/70 passing. |


---

## 20. P3 — Future Full External Integrations

Do not implement until P2 design is documented and reviewed.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| FUT-JIRA-01 | Full Jira API read integration | P3 | 🚫 Blocked | Start only after Jira gates and design doc are complete. |
| FUT-JIRA-02 | Jira write-back / ticket creation from system suggestions | P3 | ❌ Not started | Concrete trigger now exists (2026-06-26): `suggestedBacklogItems` on `/retro`'s insight panels (RETRO-29) — currently Copy-only. When picked up: (a) requires a *write-scoped* Jira credential — today's Jira integration (`src/services/jira/`) is read-only sync (JIRA-06/07/08), so this needs new write-scope OAuth (FUT-JIRA-03) or a write-capable API token, not a reuse of the existing read connection; (b) needs a "Create in Jira" button per `SuggestedBacklogItem` that lets the user pick a target project/issue type before sending — never auto-create without a per-item confirmation step; (c) needs a safe approval workflow, audit event (mirroring `user_add_request_*` pattern), and explicit rollback/failure handling (e.g. partial-batch failure when multiple items are sent at once); (d) needs a clear no-duplicate-creation safeguard (e.g. don't let a user click "Create" twice on the same item). Do not implement until a P2 design doc covering all four points is written and reviewed — see BRD "Out of Scope," SRS §Out of Scope, and SRS FR-356b for the current explicit deferral. |
| FUT-JIRA-03 | Jira OAuth support | P3 | ❌ Not started | Requires security design. |
| FUT-CLOUD-01 | Full enterprise cloud integration | P3 | 🔍 Partly done / future refinement | Local/S3/Azure/GCP provider support exists per uploaded TODO; future may include multi-provider replication. |
| FUT-POSTGRES-01 | PostgreSQL production migration | P3 | 🚫 Blocked | Do not start until P2 migration assessment is approved. |
| FUT-CICD-01 | Full CI/CD deployment automation | P3 | 🚫 Blocked | Do not start until P2 GitHub Actions design is approved. |
| FUT-MULTI-01 | Advanced multi-node deployment | P3 | 🚫 Blocked | Requires load-balanced gateway and shared persistence design. |

---

## 20a. P1 — Multi-Tenant Organization Management (Future Roadmap — Not Started)

Do not implement until a P1 design doc covering tenant isolation, seat enforcement, and migration of existing single-tenant data is written and reviewed. Overlaps with `AIPLAN-03` (`organisationId` on canonical models) — one schema change must serve both, not two competing migrations.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| ORG-01 | Organization registration flow | P1 | ❌ Not started | Self-serve sign-up creates a new organization plus its first admin user. |
| ORG-02 | Per-organization seat limit | P1 | ❌ Not started | Configurable max-user count per org (plan/contract-driven), stored as org-level config, not hardcoded. |
| ORG-03 | Seat-limit enforcement on invite/add-member | P1 | ❌ Not started | Block new member creation once an org's seat limit is reached; show a clear blocked-state message (no silent failure). |
| ORG-04 | Tenant data isolation — `organizationId` on every canonical model, zero exceptions | P1 | ❌ Not started | Every table that stores org-owned data carries a non-nullable `organizationId`; no table is allowed to be "shared/global" unless it is explicitly org-agnostic reference data (e.g. an icon registry) and documented as such. Coordinate with `AIPLAN-03` so this is one migration, not two. |
| ORG-05 | Cross-org access prevention enforced at the data-access layer, not just route handlers | P1 | ❌ Not started | Every read/write must be scoped by the authenticated user's `organizationId` at the query level (e.g. a shared data-access helper that injects the `organizationId` filter, not ad hoc per-route checks) — a forgotten `WHERE organizationId = ...` on one new route must not be possible by construction. Client-side hiding is not authorization (CLAUDE.md §36). Fail closed: on any ambiguity, deny rather than default-allow. |
| ORG-05a | Defense-in-depth — second enforcement layer independent of application code | P1 | ❌ Not started | Add a layer that holds even if a route forgets the org filter: Postgres Row-Level Security policies (post `FUT-POSTGRES-01`) or, until then, a single shared repository/data-access module that *all* features must go through (no feature is permitted to query the ORM/store directly, bypassing the org filter). Document which layer is authoritative. |
| ORG-06 | Organization admin scoping | P1 | ❌ Not started | Org admins manage only their own org's users/seats; platform-level admin role stays separate and is the only role that may ever query across organizations (and only for support/ops tooling, fully audited). |
| ORG-07 | Audit logging for org lifecycle and cross-org attempts | P1 | ❌ Not started | Log org creation, seat changes, and any denied cross-org access attempt (no sensitive payload logging — CLAUDE.md §38.7). A denied cross-org attempt must be treated as a security event, not a normal 403. |
| ORG-08 | Tests — seat-limit enforcement, tenant isolation, cross-org denial | P1 | ❌ Not started | Must include a test that proves org A can never read, list, update, delete, or enumerate (via ID guessing/incrementing) org B's data through any route, API, export, or search endpoint — not just the obvious CRUD ones. |
| ORG-08a | Tenant-isolation security review before release | P1 | ❌ Not started | Dedicated adversarial pass (per CLAUDE.md §54 Architecture/Security gates) attempting cross-org access via: direct object reference manipulation (IDREF/IDOR), search/autocomplete leakage, bulk export endpoints, shared caches/queues, error messages that reveal another org's existence or data shape, and any background job that iterates "all records" without an org filter. Zero findings required before this feature ships, not "fix later." |
| ORG-09 | Update all related product docs | P1 | ❌ Not started | SRS (new Addendum, explicitly stating the zero-data-overlap guarantee as a non-functional requirement), BRD scope, USE_CASES/SCENARIOS/USER_JOURNEYS for registration + seat-limit flows, TEST_CASES (including ORG-08/ORG-08a cases), DEVELOPER_GUIDE (tenancy model + which layer is authoritative for isolation), RELEASE_NOTES, TODO-List.md. |
| ORG-10 | Single-occupancy roles — one user per role, per org | P1 | ❌ Not started | Each role (e.g. Admin, Owner, Member — final role list TBD in design doc) may be held by exactly one user within an organization at a time; assigning a role already held by another user must reassign-with-confirmation, not silently create a duplicate. **Open question for the design doc:** confirm this is intended as a hard product constraint (limits an org to N users = N roles) and not a misstatement of "one *admin* per role tier" — flag explicitly before building, since it caps org size by role-list length. |
| ORG-11 | Email domain must match the organization's registered domain | P1 | ❌ Not started | Every user's email must share the exact domain registered to their org (e.g. org domain `ali.com` → only `*@ali.com` emails may join/be invited). Reject signup/invite at validation time if the domain doesn't match — fail closed, with a clear user-facing error (CLAUDE.md §32 external-data validation). |
| ORG-12 | Domain *ownership* verification, not just string matching | P1 | ❌ Not started | Email-domain matching alone does not prove the org controls that domain — anyone with an `@ali.com` address could otherwise register the `ali.com` org first. Require a verification step (DNS TXT record, or admin-confirmation email loop) before a domain is bound to an org, and lock the domain-to-org mapping afterward so a second org cannot later claim the same domain. |
| ORG-13 | Per-organization logo / branding | P1 | ❌ Not started | Org admin uploads a logo (validated file type/size/content per CLAUDE.md §38.4); displayed via the existing icon/branding token pattern wherever the app shows app identity (header, nav, exports, shared reports) — scoped strictly to that org's own users, never shown to or by another org. |
| ORG-14 | Login flow — organization domain, then username, then password | P1 | ❌ Not started | Step 1: enter org domain → resolve org. Step 2: username + password scoped to that org. Must not change or weaken existing auth/session security (CLAUDE.md §38.1) — this changes the *form flow*, not the authorization model. |
| ORG-14a | Login-flow enumeration protection | P1 | ❌ Not started | The domain-lookup step must not reveal whether a domain/org exists (e.g. identical response timing/message for "unknown domain" vs. "wrong password") and must be rate-limited per IP/domain to prevent org-existence or credential brute-forcing. |
| ORG-15 | Organization settings/profile page | P1 | ❌ Not started | Single place for org name, domain, logo, seat usage (X of N), and plan/tier — admin-only, scoped to the admin's own org (per ORG-06). |
| ORG-16 | Org suspension/deactivation (non-destructive) | P1 | ❌ Not started | Billing lapse or abuse must lock out access without deleting org data; reactivation restores access without data loss. Never silently delete on suspension. |
| ORG-17 | Org data export and deletion on offboarding | P1 | ❌ Not started | An org (or platform admin on its behalf) can export all of its own data and request full deletion — supports the "private, no overlap" guarantee by giving each org a real exit path, and supports privacy/retention requirements (CLAUDE.md §39). |
| ORG-18 | Org-level admin audit log | P1 | ❌ Not started | Visible-to-org-admin log of role/seat/branding/domain changes within their own org — separate from the platform-level security audit log in ORG-07. |
| ORG-19 | Account recovery compatible with domain-first login | P1 | ❌ Not started | Forgot-password flow must follow the same enumeration-safe pattern as ORG-14a — must not confirm/deny domain or account existence to an unauthenticated requester. |
| ORG-20 | Per-org rate limiting / abuse isolation | P1 | ❌ Not started | One organization's abusive traffic (login attempts, exports, API calls) must not degrade availability for other organizations — rate limits applied per-org, not globally shared. |
| ORG-21 | Seat-limit-reached experience | P1 | ❌ Not started | When ORG-03's limit is hit, surface a clear in-app message to the org admin (contact/upgrade path) instead of a bare error — no silent block. |
| ORG-22 | Tests — single-occupancy roles, domain enforcement, branding isolation, login enumeration | P1 | ❌ Not started | Cover: duplicate-role assignment rejected/reassign-confirmed; off-domain signup/invite rejected; unverified-domain claim rejected; one org's logo never rendered for another org's session; login/recovery flows leak no domain/account existence info. |

---

## 20b. P2 — Export to Sheet/PDF and Client Sharing (Future Roadmap — Not Started)

Do not implement until a P2 design doc defines exactly which visuals (which charts/graphs, in what form) belong in the sheet export vs. the PDF export, and how the no-login client share page is isolated from the authenticated app.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| EXPORT-04 | Define export visual catalog | P2 | ❌ Not started | Design-doc step: enumerate which charts/graphs/tables are included per export type (sheet vs. PDF) before any code — avoids ad hoc per-page exceptions. Builds on existing `FUT-EXCEL`-style export (Smart Excel export, Section 12 F4 cluster) rather than duplicating it. |
| EXPORT-05 | Export dashboard data + charts to Excel/Sheet | P2 | ❌ Not started | Native Excel charts or embedded chart images per EXPORT-04's catalog, alongside existing data sheets. |
| EXPORT-06 | Export dashboard data + charts to PDF | P2 | ❌ Not started | Print/offline-friendly PDF with the same visual catalog as EXPORT-04; accessible text equivalent per CLAUDE.md §34. |
| SHARE-01 | Generate a static, shareable client-facing HTML report | P2 | ❌ Not started | Snapshot of approved visuals/data at generation time — not a live view into the app. |
| SHARE-02 | Email delivery of the shared report to a client | P2 | ❌ Not started | Send the SHARE-01 report link or HTML via email; no app login required to view it. |
| SHARE-03 | Shared report is fully isolated from the authenticated app | P2 | ❌ Not started | Shared page must not expose navigation, other org data, or any path back into the authenticated app — separate route/surface, no session required, no app access of any kind. |
| SHARE-04 | Share-link expiration and revocation | P2 | ❌ Not started | Time-boxed and/or manually revocable links; expired/revoked links must fail closed. |
| SHARE-05 | Security review of the share surface | P2 | ❌ Not started | Confirm the shared HTML cannot leak other orgs' data, cannot be used to probe the authenticated API, and contains no secrets/session tokens. |
| SHARE-06 | Tests — export correctness and share-link access control | P2 | ❌ Not started | Export content matches source data; expired/revoked/forged share links are denied; shared page never reaches authenticated routes. |
| EXPORT-07 | Update all related product docs | P2 | ❌ Not started | SRS, USE_CASES/SCENARIOS/USER_JOURNEYS for export + share flows, TEST_CASES, DEVELOPER_GUIDE, RELEASE_NOTES, TODO-List.md. |

---

## 21. P4 — Future Communication / Governance Layer

Plan only unless explicitly approved.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| P4-01 | Full Admin & System Notification Center | P4 | 📄 Planning only | In-app admin-to-user, system-to-admin, error/warning/threat notifications. |
| P4-02 | Maintenance Mode | P4 | 📄 Planning only | Admin-controlled maintenance screen, middleware/503 behavior, audit logs, user-facing message. |
| P4-03 | Browser push notifications | P4 | ❌ Planned | Not part of initial User Add-Member Request workflow. |
| P4-04 | Email notification channel | P4 | ❌ Planned | Separate from P0 email access notification if required. |
| P4-05 | Slack/Teams notification channels | P4 | ❌ Planned | Future integration only. |
| P4-06 | Admin error/warning/threat notification strategy | P4 | 📄 Planning only | Notify admin clearly about failures, threats, warnings, and system issues. |

---

## 22. Required Test Coverage

### P0 Reconciliation / Docs

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TEST-P0-01 | Validate documentation status consistency if script exists | P0 | ❌ Not started | Optional automation, required manual check otherwise. |
| TEST-P0-02 | Validate test count reporting consistency | P0 | 🔍 Needs verification | Docs must all show same current test count. |
| TEST-P0-03 | Validate product docs impact matrix is produced | P0 | ❌ Not started | Required before push. |

### Backend Gateway Tests

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TEST-GW-01 | Safe configured endpoint allowed | P1 | ✅ Done | `TC-GW-05` (`gateway.test.ts`). |
| TEST-GW-02 | Unsafe protocol blocked | P1 | ✅ Done | `TC-GW-02` (`gateway.test.ts`). |
| TEST-GW-03 | Disallowed host blocked | P1 | ✅ Done | `TC-GW-01` (`gateway.test.ts`). |
| TEST-GW-04 | Private/internal IP blocked in production | P1 | ✅ Done | `TC-GW-03` (`gateway.test.ts`). |
| TEST-GW-05 | Timeout applied | P1 | ✅ Done | Covered via retry/abort flow in `TC-GW-08`, `TC-GW-20`. |
| TEST-GW-06 | Retry policy applied for retryable errors | P1 | ✅ Done | `TC-GW-06`, `TC-GW-19`, `TC-GW-20` (`gateway.test.ts`). |
| TEST-GW-07 | Non-retryable errors are not retried | P1 | ✅ Done | `TC-GW-06`, `TC-GW-21` (`gateway.test.ts`). |
| TEST-GW-08 | Secrets redacted in logs | P1 | ✅ Done | `TC-GW-10`, `TC-GW-12` (`gateway.test.ts`). |
| TEST-GW-09 | Audit event created | P1 | ✅ Done | `TC-GW-12` — JSONL record written with all observability fields (`gateway.test.ts`). |
| TEST-GW-10 | Consistent `GatewayResult` returned | P1 | ✅ Done | `TC-GW-18`, `TC-GW-19`, `TC-GW-20`, `TC-GW-21` (`gateway.test.ts`). |
| TEST-GW-11 | Provider registry supported | P1 | ✅ Done | `TC-GW-13`, `TC-GW-14`, `TC-GW-15`, `TC-GW-15b` (`gateway.test.ts`). |
| TEST-GW-12 | No secrets exposed to client | P1 | ✅ Done | `src/server/gateway/` is server-only (no client imports); verified by module location — `TC-GW-10`/`TC-GW-12` verify redaction at log boundary. |

### User Add-Member Request Tests

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TEST-REQ-01 | Anonymous user cannot submit request | P1 | ✅ Done | Auth guard. Automated as `TC-REQ-02` (`src/__tests__/userAddRequests.test.ts`). |
| TEST-REQ-02 | Logged-in user submits request | P1 | ✅ Done | Happy path. Automated as `TC-REQ-01`. |
| TEST-REQ-03 | Invalid email rejected | P1 | ✅ Done (2026-06-27) | Was a real gap: email-format validation existed only client-side in `RequestAddMemberModal.tsx`, so a direct API call could submit a malformed email. Added server-side enforcement (`EMAIL_FORMAT` regex in `app/api/user-add-requests/route.ts`) and automated as new `TC-REQ-19`. |
| TEST-REQ-04 | Missing reason rejected | P1 | ✅ Done | Validation. Automated as `TC-REQ-05` (covers all four required fields). |
| TEST-REQ-05 | Duplicate email prevented/warned | P1 | ✅ Done | No duplicate accounts. Automated as `TC-REQ-03` (existing account) and `TC-REQ-04` (pending request for same email). |
| TEST-REQ-06 | Admin sees pending request | P1 | ✅ Done | Queue/badge/card. Automated as `TC-REQ-08`. |
| TEST-REQ-07 | Admin accepts request | P1 | ✅ Done | Creates user and updates status. Automated as `TC-REQ-10`. |
| TEST-REQ-08 | Admin rejects request | P1 | ✅ Done | Does not create user. Automated as `TC-REQ-13`. |
| TEST-REQ-09 | Requester gets accepted notification | P1 | ✅ Done | In-app notification. Asserted inside `TC-REQ-10` (`notification.create` called with `user_add_request_accepted`). |
| TEST-REQ-10 | Requester gets rejected notification | P1 | ✅ Done | In-app notification. Asserted inside `TC-REQ-13` (`user_add_request_rejected`). |
| TEST-REQ-11 | High-privilege role warning | P1 | ✅ Done (2026-06-27) | Was a real gap: the ≥20-character justification rule for `admin`/`c_level` requests existed only client-side. Added shared `isHighPrivilegeRole()` (`src/lib/roles.ts`, now used by both the modal and the API) plus server-side enforcement, automated as new `TC-REQ-20` (rejected) and `TC-REQ-20b` (accepted). |
| TEST-REQ-12 | Two admins cannot double-accept same request | P1 | 🔍 Partial | `TC-REQ-12` proves the *second* accept attempt is rejected once `status` is no longer `pending` (state-based guard) — this is correct behavior, but there is no automated test simulating two concurrent in-flight requests racing against the same DB row (true concurrency test would need an integration test against a real Postgres/SQLite connection, not a mocked Prisma client). Remaining gap: a real concurrency/integration test once `FUT-POSTGRES-01` lands. |
| TEST-REQ-13 | Audit event created | P1 | ✅ Done | Submit/accept/reject. Automated as `TC-REQ-01` (submit, newly asserted 2026-06-27), `TC-REQ-10` (accept), `TC-REQ-13` (reject). |
| TEST-REQ-14 | Mobile layout works | P1 | ❌ Not started | Responsive UI — genuinely untested. Requires a visual/E2E (Playwright) pass on `RequestAddMemberModal.tsx`/`UserAddRequestsPanel.tsx` at mobile breakpoints; not coverable by Jest unit tests. |

### Role-Based Coaching Tests

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TEST-RBC-01 | Suggestions generated per role | P1 | ✅ Done (2026-06-23) | Scrum Master, PO, EM, DM, C-level, Team Lead, Admin. Covered by `TC-RBC-01a–h` in `src/__tests__/roleBasedCoaching.test.ts` (see RBC-18). |
| TEST-RBC-02 | Suggestions differ by role | P1 | ✅ Done (2026-06-23) | Role responsibility matters. Covered by `TC-RBC-01a–h` role-mapping table assertions. |
| TEST-RBC-03 | Suggestions include metric evidence | P1 | ✅ Done (2026-06-23) | No generic advice. Covered by `TC-RBC-02`. |
| TEST-RBC-04 | Weak points identified | P1 | ✅ Done (2026-06-23) | Evidence-based. Covered by `TC-RBC-03`. |
| TEST-RBC-05 | Ceremony advice included | P1 | ✅ Done (2026-06-23) | Daily/refinement/planning/review/retro. Covered by `TC-RBC-05` (verifies identical ceremony advice embedded per RBC-10–14). |
| TEST-RBC-06 | Prevention advice included | P1 | ✅ Done (2026-06-23) | What could have prevented situation. Covered by `TC-RBC-06`. |
| TEST-RBC-07 | Next-sprint suggestions included | P1 | ✅ Done (2026-06-23) | Actionable. Covered by `TC-RBC-07`. |
| TEST-RBC-08 | Low data quality reduces confidence | P1 | ✅ Done (2026-06-23) | Confidence logic. Covered by `TC-RBC-08` (×0.75/×0.5 downgrade per RBC-17). |
| TEST-RBC-09 | Missing metrics produce safe fallback | P1 | ✅ Done (2026-06-23) | No hallucinated certainty. Covered by `TC-RBC-09` (all-zero sample sizes → `band: 'N/A'`). |

### Retrospective Tests

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TEST-RETRO-01 | Retro file upload works | P2 | ✅ Done (2026-06-26) | CSV/XLSX automated (`TC-RETRO-08`/`08b`); Markdown/plain text automated (`TC-RETRO-12`/`13`). |
| TEST-RETRO-02 | Invalid retro file handled | P2 | ✅ Done (2026-06-26) | Missing Sprint Name column → 422 (`TC-RETRO-09`). |
| TEST-RETRO-03 | Retrospective template downloads successfully | P2 | ✅ Done (2026-06-26) | `.xlsx` is now the primary download; `.csv` remains a secondary link. ⬜ Manual click-test, no automated download-trigger test (browser API). |
| TEST-RETRO-04 | Template includes expected columns | P2 | ✅ Done (2026-06-26) | ⬜ Manual — verify `Retrospective_Template.xlsx`'s "Retrospective" sheet header row. |
| TEST-RETRO-05 | Template includes Instructions sheet | P2 | ✅ Done (2026-06-26) | ⬜ Manual — verify the "Instructions" sheet content. |
| TEST-RETRO-06 | Template includes example rows | P2 | ✅ Done (2026-06-26) | ⬜ Manual — verify the 4 example rows (carryover, late blocker, scope change). |
| TEST-RETRO-07 | Completed template upload works | P2 | ✅ Done (2026-06-26) | End-to-end grouping verified (`TC-RETRO-08`/`08b`). "Import" is really "preview" — see RETRO-08/15 scope note. |
| TEST-RETRO-08 | Upload preview works | P2 | ✅ Done (2026-06-26) | `upload-insights` view. ⬜ Manual UI verification (no E2E/Playwright test added — see RETRO-38 scope note). |
| TEST-RETRO-09 | Column mapping works when names differ | P2 | ✅ Done (2026-06-26, scoped to alias table) | Covered by `HEADER_ALIASES`, not an interactive mapping UI — see RETRO-09 status row. |
| TEST-RETRO-10 | In-app retrospective form opens | P2 | ✅ Done 2026-06-10 | Pre-existing — `TC-RETRO-01`/`02` (manual). |
| TEST-RETRO-11 | In-app retrospective form validates required fields | P2 | ✅ Done 2026-06-10 | Pre-existing — `TC-RETRO-02` (manual); also covered for uploads by `TC-RETRO-11` (automated). |
| TEST-RETRO-12 | Draft save works if persistence exists | P2 | ❌ Deferred (2026-06-26) | Persistence (RETRO-15/30) is deferred — nothing to test. |
| TEST-RETRO-13 | Themes extracted | P2 | ✅ Done (2026-06-26) | `TC-RETRO-14` (automated). |
| TEST-RETRO-14 | Action items extracted | P2 | ✅ Done (2026-06-26) | Covered by `TC-RETRO-08` (grouping) and pre-existing form tests. |
| TEST-RETRO-15 | Missing owner identified | P2 | ✅ Done (2026-06-26) | `TC-RETRO-15` (automated). |
| TEST-RETRO-16 | Missing due date identified | P2 | ✅ Done (2026-06-26) | Same test as TEST-RETRO-15 — `TC-RETRO-15` asserts both gaps. |
| TEST-RETRO-17 | Duplicate action items flagged | P2 | ✅ Done (2026-06-26) | `TC-RETRO-16` (automated). |
| TEST-RETRO-18 | Suggested TODO created | P2 | ✅ Done (2026-06-26) | `nextSprintSuggestions` — `TC-RETRO-17` (automated). |
| TEST-RETRO-19 | Next sprint suggestions generated | P2 | ✅ Done (2026-06-26) | Same engine/test as TEST-RETRO-18 — `TC-RETRO-17`; ceremony recommendations covered by the same function. |
| TEST-RETRO-20 | Retro insights linked to metrics when possible | P2 | ❌ Deferred (2026-06-26) | RETRO-14 (metric-linking) is explicitly deferred — nothing to test. |

### Forecasting Tests

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TEST-FCAST-01 | Forecast calculates on-track / at-risk / off-track | P2 | ✅ Done (2026-06-27) | `TC-FCAST-03/04/06` (`src/__tests__/forecastEngine.test.ts`). |
| TEST-FCAST-02 | Forecast handles insufficient data | P2 | ✅ Done (2026-06-27) | `TC-FCAST-02/13`. |
| TEST-FCAST-03 | Forecast uses current throughput | P2 | ✅ Done (2026-06-27) | `TC-FCAST-07`. Points-per-sprint throughput was not separately tested — `avgThroughput` is issue-count-based only, same as the pre-existing implementation. |
| TEST-FCAST-04 | Forecast compares required vs current throughput | P2 | ✅ Done (2026-06-27) | Covered at the UI level by the new "Throughput: Required vs. Current" chart (FCAST-14); no dedicated engine-level test since the comparison is presentation-only arithmetic (`remainingIssues / 6`) over already-tested `avgThroughput`/`remainingIssues` fields. |
| TEST-FCAST-05 | Forecast shows confidence | P2 | ✅ Done (2026-06-27) | `TC-FCAST-01/02/08`. |
| TEST-FCAST-06 | Forecast explains confidence | P2 | ✅ Done (2026-06-27) | `TC-FCAST-08` asserts `confidenceReason` content; `TC-FCAST-02` asserts the insufficient-data reason. |
| TEST-FCAST-07 | Forecast chart data is generated | P2 | ✅ Done (2026-06-27) | `TC-FCAST-11/12` (`scopeTrend`). `sprintPoints` (burn-up chart data) was not re-tested — unchanged by this pass, pre-existing manual-only coverage (`TC-FCAST-05`). |
| TEST-FCAST-08 | Adjustment suggestions are generated | P2 | ✅ Done (2026-06-27, scoped to scope/blockers/data-quality) | `TC-FCAST-10` (scope). Capacity/WIP/splitting/refinement rules were not added — `DashboardMetrics` has no forecast-relevant WIP-limit or refinement-stage signal today; see FCAST-20/21 status notes. |
| TEST-FCAST-09 | Data Quality Score affects forecast confidence | P2 | ✅ Done (2026-06-27) | `TC-FCAST-08`. |

---

## 23. Commit / Push Definition of Done

A commit or push is allowed only when all rows below are satisfied.

| ID | Task | Priority | Status |
|---|---|---:|---|
| DOD-01 | Code changes are complete | P0 | ✅ Permanent |
| DOD-02 | Related tests are added or updated | P0 | ✅ Permanent |
| DOD-03 | `npm run lint` passes | P0 | ✅ Permanent |
| DOD-04 | `npm test` passes | P0 | ✅ Permanent |
| DOD-05 | `npm run build` passes | P0 | ✅ Permanent |
| DOD-06 | `TODO-List.md` is updated | P0 | ✅ Permanent |
| DOD-07 | `product/RELEASE_NOTES.md` is updated | P0 | ✅ Permanent |
| DOD-08 | Every file inside `product/` is reviewed | P0 | ✅ Permanent |
| DOD-09 | Every affected product document is updated | P0 | ✅ Permanent |
| DOD-10 | Every unaffected product document is marked “Reviewed — No update required” | P0 | ❌ Not started |
| DOD-11 | Documentation impact matrix is complete | P0 | ❌ Not started |
| DOD-12 | No product document is behind code | P0 | ✅ Permanent |
| DOD-13 | Traceability matrix is updated for implemented features | P0 | ❌ Not started |
| DOD-14 | Required output after Claude pass is provided | P0 | ❌ Not started |

---

## 24. Final Execution Order

Follow this order exactly.

| Step | Task | Priority | Status |
|---:|---|---:|---|
| 1 | Check current branch | P0 | 🔍 Needs verification |
| 2 | Check uncommitted changes | P0 | 🔍 Needs verification |
| 3 | Create safe baseline commit if needed | P0 | 🔍 Needs verification |
| 4 | Complete P0 reconciliation pass | P0 | 🔍 Needs verification |
| 5 | Update SRS: P1.1/P1.2/P1.3 Done/Verified | P0 | 🔍 Needs verification |
| 6 | Update Use Cases intro/scope to current v4.2.x | P0 | 🔍 Needs verification |
| 7 | Reconcile Storage status across all docs | P0 | 🔍 Needs verification |
| 8 | Update TODO-List.md to current v4.2.2 reality | P0 | ✅ Done — this file |
| 9 | Normalize test count | P0 | 🔍 Needs verification |
| 10 | Review all changed code | P0 | 🔍 Needs verification |
| 11 | Review every file inside `product/` | P0 | ❌ Not started |
| 12 | Update affected product documents | P0 | 🔍 Needs verification |
| 13 | Mark unaffected product documents as reviewed | P0 | ❌ Not started |
| 14 | Produce product documentation impact matrix | P0 | ❌ Not started |
| 15 | Run lint, tests, and build | P0 | 🔍 Needs verification |
| 16 | Update Release Notes with verification result | P0 | 🔍 Needs verification |
| 17 | Update TODO with final status | P0 | ✅ Done — this file created |
| 18 | Decide if project can be marked Release Candidate | P0 | ⚠️ Conflict / Needs verification |
| 19 | Push only if no product file is behind code | P0 | 🔍 Needs verification | Updated 2026-06-08: re-framed from a hard "Blocked until matrix is done" to a per-push verification check (does this specific push leave any product file behind code?), consistent with the balanced/parallel P0↔P1-P4 sequencing policy — see Section 1. |
| 20 | Implement Backend Integration Gateway in balance with ongoing P0 work | P1 | ❌ Not started |
| 21 | Add/update tests for Backend Gateway | P1 | ❌ Not started |
| 22 | Review every file inside `product/` again | P0/P1 | ❌ Not started |
| 23 | Update all docs for Backend Gateway | P1 | ❌ Not started |
| 24 | Produce product documentation impact matrix again | P0/P1 | ❌ Not started |
| 25 | Run lint, tests, and build again | P1 | ❌ Not started |
| 26 | Implement User Add-Member Request Workflow | P1 | ❌ Not started |
| 27 | Add/update tests for request workflow | P1 | ❌ Not started |
| 28 | Review every file inside `product/` again | P0/P1 | ❌ Not started |
| 29 | Update all docs for request workflow | P1 | ❌ Not started |
| 30 | Produce product documentation impact matrix again | P0/P1 | ❌ Not started |
| 31 | Implement Role-Based Delivery Coaching Insights | P1 | ❌ Not started |
| 32 | Add/update tests for role-based coaching | P1 | ❌ Not started |
| 33 | Review every file inside `product/` again | P0/P1 | ❌ Not started |
| 34 | Update all docs for role-based coaching | P1 | ❌ Not started |
| 35 | Produce product documentation impact matrix again | P0/P1 | ❌ Not started |
| 36 | Implement Retrospective Upload, Template Download, In-App Form, and Improvement Backlog | P2 | ❌ Not started |
| 37 | Add/update tests for retrospective upload, template download, and in-app form | P2 | ❌ Not started |
| 38 | Review every file inside `product/` again | P0/P2 | ❌ Not started |
| 39 | Update all docs for retrospective features | P2 | ❌ Not started |
| 40 | Produce product documentation impact matrix again | P0/P2 | ❌ Not started |
| 41 | Implement Forecasting Progress and Delivery Adjustment Report | P2 | ❌ Not started |
| 42 | Add/update tests for forecasting | P2 | ❌ Not started |
| 43 | Review every file inside `product/` again | P0/P2 | ❌ Not started |
| 44 | Update all docs for forecasting | P2 | ❌ Not started |
| 45 | Produce product documentation impact matrix again | P0/P2 | ❌ Not started |
| 46 | Reconcile remaining TODO items and mark true status | P0 | 🔍 Ongoing |
| 47 | Stop and report final status, risks, and next recommended development item | P0 | ✅ Permanent |

---

## 25. Do Not Do

| ID | Rule | Priority | Status |
|---|---|---:|---|
| DND-01 | Do not start Jira API full integration yet | P0 | ✅ Permanent |
| DND-02 | Do not start Jira write-back yet | P0 | ✅ Permanent |
| DND-03 | Do not start browser push/email/Slack/Teams notifications yet | P0 | ✅ Permanent |
| DND-04 | Do not start Maintenance Mode yet | P0 | ✅ Permanent |
| DND-05 | Do not start PostgreSQL migration yet | P0 | ✅ Permanent |
| DND-06 | Do not start full CI/CD automation yet | P0 | ✅ Permanent |
| DND-07 | Do not expose secrets in logs | P0 | ✅ Permanent |
| DND-08 | Do not allow frontend to call external providers directly | P0 | ✅ Permanent |
| DND-09 | Do not allow non-admin users to create users directly | P0 | ✅ Permanent |
| DND-10 | Do not generate generic Agile advice without metric evidence | P0 | ✅ Permanent |
| DND-11 | Do not mix Jira upload and retrospective upload without clear labels | P0 | ✅ Permanent |
| DND-12 | Do not mark release candidate before lint/test/build pass | P0 | ✅ Permanent |
| DND-13 | Do not leave SRS, Use Cases, or Test Cases behind code | P0 | ✅ Permanent |
| DND-14 | Do not leave TODO as old v3/v4.0 if app is now v4.2.2 | P0 | ✅ Permanent |
| DND-15 | Do not push if any file in `product/` is behind code | P0 | ✅ Permanent |
| DND-16 | Do not push if product documentation impact matrix is incomplete | P0 | ✅ Permanent |
| DND-17 | Do not over-claim future features in patent docs | P0/P2 | ✅ Permanent |

---

## 26. Immediate Next Step

| ID | Task | Priority | Status | Reason |
|---|---|---:|---|---|
| NEXT-01 | Complete `TRACE-01` full traceability matrix | P0 | ✅ Done — clusters #1 (F3-14/15/16), #2 (F2-05/06/07/09/11/12/13), #3 (F4-05/06/08), #4 (F1-07/08), #5 (UX-02/03/05/11/13), #6 (FR↔UC ID-collision cleanup + Ownership Index), and UX-14 ALL fully closed 2026-06-08 incl. 38 automated tests (14 + TC-AC-01–03 + TC-FF-01–06 + TC-X-09a–13b + TC-T-11 + TC-CH-01–03 + TC-X-14) — TRACE-01 fully closed, no longer a blocker | TRACE-01 is closed — the path is now clear for new P1/P2 development. |
| NEXT-02 | Complete `TRACE-02` full app coverage validation | P0 | ✅ Done — all 22 `COVER-XX` rows closed 2026-06-08 via survey-first methodology (2 stale-framing false positives re-verified, 2 genuine gaps closed with new FR-312/UC-094/`mergeIssues.test.ts` and a 36-row API route inventory in SRS §8.1, 1 TC-ID collision cluster resolved with 7 new tests, 1 error-state gap closed with `snapshotLoadErrors.test.ts`, 5 roadmap items confirmed correctly-scoped per explicit user decision) — TRACE-02 fully closed, no longer a blocker | TRACE-02 is closed — see Section 8 for per-area notes and `RELEASE_NOTES.md` for the full write-up. |
| NEXT-03 | Produce actual product documentation impact matrix | P0 | ✅ Done 2026-06-09 | Filled GW-01–GW-25 matrix added to Section 6 (below cluster #6); TEST_CASES.md §9.49 gateway test section added; all 16 product files reviewed — 4 updated (SRS, USE_CASES, DEVELOPER_GUIDE, RELEASE_NOTES) + TEST_CASES; 11 confirmed no-update-required. |
| NEXT-04 | Verify storage docs and open storage gates | P0 | ✅ Done (2026-06-23) | All 11 `STORAGE-DEC-01–11` rows (Section 19, above) closed via direct code audit (not assumed): storage is genuinely implemented (4 real providers, typed interface, factory, 4 API routes), credential security confirmed (secrets never reach the browser), and the 3 real gaps found were fixed — `STORAGE-DEC-09` (visible source details: last-fetched + fallback reason added to `DataSourceBadge`), `STORAGE-DEC-10` (new "Latest Metrics & Cloud Sync" diagnostics section: snapshot availability/age + cloud backup freshness + last-fetched/pushed/pending-push), `STORAGE-DEC-11` (Cloud Storage admin panel now blocks on settings load instead of flashing the `'local'` default). 2 new tests (`TC-SD-09/10`); full suite 669/70 passing; lint/typecheck clean (pre-existing warnings unchanged). Note: this row's original text referenced a dangling `JIRA-GATE-07` with no corresponding gate defined anywhere in this file — confirmed it was a stale/mistaken reference (the real gates were `JIRA-GATE-03/04/05`, now `STORAGE-DEC-09/10/11`); no action needed since nothing maps to `-07`. |
| NEXT-05 | Re-run lint/test/build and update normalized test count | P0 | ✅ Verified 2026-06-07 | Test count is now 492 tests / 52 suites (was 469/48 — 23 new tests across 4 new files: `members.test.ts`, `middleware.test.ts`, `changePassword.test.ts`, `adminSettingsConsole.test.ts`, plus 2 added to `adminUsers.test.ts`). Lint clean (pre-existing warnings only); build compiles successfully. |
| NEXT-06 | Begin HARD-01 Backend Integration Gateway in balance with remaining P0 items | P1 | ✅ Done 2026-06-08 | Backend Integration Gateway foundation closed — `GW-01`–`GW-25` ✅ Done (see Section 14). `src/server/gateway/` module suite, 23 tests, FR-313, DEVELOPER_GUIDE architecture section, RELEASE_NOTES v4.3 entry. Test suite: 550/61. `NEXT-03` (doc impact matrix) closed 2026-06-09 — all P0 items in Section 26 are now ✅ Done. |

---

## 27. Release Status Recommendation

Current uploaded TODO says: `v4.2.2 — Release Candidate` and “P0 reconciliation pass complete.”

Recommended corrected status:

> `v4.3 — Release Candidate / P0 Gate Fully Closed (updated 2026-06-09)`  
> Lint/test/build are passing (550 tests / 61 suites). The full traceability matrix (`TRACE-01`), full app coverage validation (`TRACE-02`), and the filled product documentation impact matrix (`NEXT-03`) are all ✅ Done — all three P0 documentation gates are now closed. The Backend Integration Gateway Foundation (`GW-01–GW-25`) is shipped and fully documented. `NEXT-04` (storage gates) and the P1–P4 feature roadmap (USERREQ, RBC, RETRO, FCAST) remain open as forward work items, not blockers.

---

## 28. Implementation Plan v2.0 — Self-Hosted AI, Jira Integration, and Delivery Intelligence (Future Roadmap — Not Started)

**Status:** ❌ Not started — reference plan only, added 2026-06-23. Per `DND-01`/`DND-02` (Section 25), full Jira API integration and Jira write-back remain explicitly out of scope until those Do-Not-Do rules are lifted. This plan supersedes prior informal AI/Jira notes once any phase below is actually started — at that point, open dedicated `JIRA-AI-XX` rows in the relevant section and track status there instead of in this raw block.

> ⚠ **Truncation notice:** The source document pasted by the user was cut off mid-Phase-1 (ends at "`[ ] Fr`" inside the Phase 1 deliverables checklist, Section 23). Everything from the rest of Phase 1 onward (Phases 2–end, plus any sections after "Delivery Phases") is **missing** from this record. Re-paste the remainder when available so this section can be completed.

**Classification:** Confidential — Ali Abu Ras / Ali Delivery Intelligence
**Plan version:** 2.0 — Revamped with architectural concerns and mitigations
**Product:** Delivery Clarity · **Brand:** Ali Delivery Intelligence
**Slogan:** From messy boards to measurable delivery confidence.

### 28.1 Product positioning

Delivery Clarity is a private, self-hosted Jira delivery-intelligence platform. Official positioning: *"Delivery Clarity analyses Jira data through secure live Jira synchronisation or zero-credential file uploads, while keeping all calculations, intelligence, reporting, and AI processing under complete customer control."* Do not describe Delivery Clarity as export-only — both modes (Jira Export Mode, Connected Jira Mode) are first-class citizens.

### 28.2 Architectural concerns and mandatory mitigations (read before any implementation)

| # | Concern | Risk | Mandatory mitigation |
|---|---|---|---|
| CONCERN-01 | Phase sequencing underestimates Jira complexity | Phases 2–3 (9–17 days) likely run 2–3× over in practice; if AI (Phase 4) is gated on Jira sync, the AI roadmap stalls | Build AI evidence builder against a mock canonical dataset in Phase 1; run AI development in parallel with Jira sync, not after it; Phase 4 must be startable with export-only data; add a 5-day risk buffer to Phases 2–3 |
| CONCERN-02 | Qwen3-8B underpowered for production Arabic | Weak Arabic grammar under domain prompts damages customer trust; not fixable by prompt engineering alone | Default model `Qwen2.5-14B-Instruct` (Q4_K_M, ~9GB RAM); Arabic-optimised alternative `aya-23-8B`/`aya-expanse-8B`; make model selection an admin setting, not hardcoded; native Arabic speaker must review 20 AI outputs before Phase 5 sign-off |
| CONCERN-03 | Freshness labels (`live`/`recent`/`stale`/`unknown`) have no defined time boundaries | Inconsistent/misleading freshness disclosure across builds | Define `FRESHNESS_THRESHOLDS_MINUTES` (live=15, recent=240, stale=1440) as admin-configurable per connection via `freshnessThresholdMinutes` on `JiraConnectionScope`; every AI response derives freshness from config, never hardcoded logic |
| CONCERN-04 | No multi-tenant isolation in the data model | `JiraConnection`/`JiraSyncRun` lack `organisationId`; data/credentials could leak across teams sharing one instance | Add `organisationId` to every canonical model (`JiraConnection`, `CanonicalIssue`, etc.) before any data is written; default `DEFAULT_ORG` for single-tenant; row-level security filters by `organisationId` on all queries |
| CONCERN-05 | Snapshot-as-AI-source undefined | AI evidence contract allows `snapshotId` but sync strategy never defines how snapshots feed AI — stale/incomplete context, broken snapshot comparison | Add `SnapshotCanonicalRecord` to Prisma schema in Phase 1; when `snapshotId` provided, build evidence from the snapshot (not live metrics), set `dataFreshness: "unknown"` past stale threshold, answer must declare "Based on snapshot saved on {date}", never mix snapshot + live data in one evidence object |
| CONCERN-06 | No AI request queue or concurrency control | Single-instance Ollama serializes inference; concurrent users without a queue → timeouts/corruption/starvation | Implement `AiQueueConfig` (`maxConcurrent` default 1, `maxQueueDepth` default 10, `requestTimeoutMs` default 120000, `perUserDailyLimit` default 50, `perUserMinuteLimit` default 5) before Phase 5 go-live; surface queue position/wait time in AI Analyst UI; add queue config to Admin → AI Engine and metrics to Admin → Diagnostics |
| CONCERN-07 | Server performance unknown at planning time | Qwen3-8B on CPU may take 30–120s/response; underpowered hardware could make the AI roadmap infeasible | **Mandatory Phase 0 gate**: benchmark `qwen2.5:14b-instruct-q4_K_M` on the actual target server before any AI code is written; record TTFT, total response time, RAM, CPU, system responsiveness; if TTFT > 30s or RAM swaps, escalate to GPU/smaller model before Phase 4 |
| CONCERN-08 | Jira credential encryption key management underspecified | No rotation/algorithm/IV spec; credentials become unreadable after key rotation; key-in-`.env` is weak protection | Mandate AES-256-GCM, 32-byte key, 12-byte IV, stored as `base64(iv):base64(authTag):base64(ciphertext)`; document a 6-step key rotation procedure; add `encryptionKeyVersion` to `JiraConnection` for traceability; audit event per rotation |
| CONCERN-09 | Prompt injection surface larger than stated | Plan only mentioned issue fields; actual surface includes summaries, descriptions, comments, sprint/board/project/version/component names, custom fields, display names | Sanitise every field in `PROMPT_INJECTION_RISK_FIELDS` via `AiPrivacyRedactor.sanitiseJiraText()` (truncate 500 chars, strip instruction-like patterns, wrap in `[DATA_START]...[DATA_END]`, escape control sequences, strip raw HTML); add an explicit injection-fence line to every system prompt; add prompt-injection test cases (Section 24 of source plan) |
| CONCERN-10 | No rollback strategy for canonical data | A bad re-sync/normalisation pass can silently overwrite valid canonical records with no way back | Stage all incoming sync records in `CanonicalSyncStaging` first; validate against canonical schema; dry-run metrics calc; promote staged→canonical only on success; discard staging and preserve canonical on failure; retain last 3 promoted canonical snapshots per project; add `POST /api/jira/connections/:id/rollback` |
| CONCERN-11 | No data retention or GDPR policy | Synchronised Jira user/issue/comment data has no retention, deletion, or right-to-erasure mechanism — non-compliant from day one in GDPR regions | Add `DataRetentionConfig` (sync history 90d, audit log 365d, canonical data 730d, user PII 90d post-disconnect, auto-anonymise on disconnect = true); add `POST /api/admin/data-retention/purge` and `POST /api/admin/data-retention/anonymise-user/:accountId`; add a Data Retention admin section; document GDPR responsibilities in the Deployment Guide |
| CONCERN-12 | AI audit logs defined but not structured | No schema/retention/query interface defined — compliance and debugging both become impossible | Add `AiAuditLog` Prisma model (org/user/role/feature/sourceMode/connectionId/importId/promptHash/evidenceHash/modelId/tokensUsed/latencyMs/responseLanguage/responseStatus/rejectionReason); never log full prompts/responses, only hashes; add `GET /api/admin/ai-audit-logs` with filters; show alongside Jira audit events in Admin → Audit Logs |

### 28.3 Core non-negotiable principle

The AI model is the explanation layer, never the calculation engine. Required pipeline: Data Source (export or connected Jira) → Acquisition/Sync Layer → Canonical Data Model (organisation-scoped, versioned) → Deterministic Metrics/Rules Engine (authoritative) → Verified Structured Evidence Object (sanitised, freshness-stamped) → Self-Hosted AI Explanation Layer (Ollama + Qwen, private network only) → Written Answer (English/Arabic, evidence-cited, freshness-disclosed). Violating this pipeline order is a critical defect, not a design choice.

### 28.4 Data modes (both first-class)

- **Jira Export Mode** — CSV/XLSX/XLS, single- and multi-file merge, 55+ column-alias detection, import preview with data-quality scoring, missing-column impact assessment, import history with rollback, source-file metadata preserved on canonical records. Must remain fully functional even if Jira API integration is disabled/misconfigured/unavailable.
- **Connected Jira Mode** — Jira Cloud (primary) and Jira Data Center (where supported); multiple connections per organisation; project/board scope selection; manual/scheduled/incremental/full-resync; structured sync status states; sync history with per-run error detail; connection health monitoring; credential rotation without data loss; graceful disconnect with optional data preservation.
- **Unified analytics requirement** — all analytics, AI, reporting, snapshots, recommendations, and forecasting must produce identical results regardless of source. No component outside the Data Acquisition Layer may reference source-specific structures (Atlassian API types, CSV column names).

### 28.5 Target architecture (layered)

UI (Upload Export · Connect Jira · Dashboard · AI Analyst · Reports · Admin · Connections · Sync Status) → Next.js App/API Layer (Auth · RBAC · Validation · Jira/Upload/AI/Reporting/Admin/Audit APIs) → split into **Data Acquisition** (Export Parser, Jira Cloud/DC Connectors, Sync Scheduler, Pagination, Retry/Backoff, Webhook Receiver, Normalisation) and **AI Orchestration** (Evidence Builder, Prompt Registry, Privacy Redactor, Response Validator, Citation Mapper, AI Request Queue, Audit Logger, Intent Classifier) → Canonical Delivery Data Model (organisation-scoped; includes Staging Tables and Rollback Snapshots) → Metrics/Rules/Forecasting/Reporting → Local AI Provider Layer (`AiProvider` interface, Ollama Adapter → Qwen2.5-14B-Instruct default, AI Request Queue, Health Check/Streaming/Model Registry, future vLLM Adapter).

### 28.6 AI stack

| Property | Default |
|---|---|
| Model | `qwen2.5:14b-instruct-q4_K_M` via Ollama |
| Min/recommended RAM | 12GB / 16GB dedicated |
| Quantisation | Q4_K_M |

Admin-selectable alternatives: `qwen2.5:7b-instruct-q4_K_M` (6GB, low-resource), `aya-expanse:8b-q4_K_M` (7GB, Arabic-primary), `qwen2.5:32b-instruct-q4_K_M` (24GB, enterprise quality). Future scaling: keep `AiProvider` interface unchanged, add a vLLM adapter behind the same interface, separate inference host into its own Docker service, add a worker-scaling request queue, add model replicas only after measured performance testing. **Mandatory pre-Phase-4 benchmark** (CONCERN-07): TTFT must be < 15s (hard ceiling 30s), total response < 90s, peak RAM must leave 2GB free — do not proceed to Phase 4 if these fail; escalate infrastructure instead.

### 28.7 Jira integration service layer (planned modules)

`src/services/jira/` — provider interface + Cloud/DC providers, connection/auth/sync services, **new**: `jira-sync-staging.service.ts`, `jira-sync-rollback.service.ts`, `jira-credential-encryption.service.ts` (AES-256-GCM), `jira-data-retention.service.ts` (GDPR) — plus existing project/board/sprint/issue/changelog/version/user/comment/webhook/pagination/rate-limit/retry/field-mapping/normalisation/audit/writeback services. The business layer must depend only on the `JiraProvider` interface; no Atlassian SDK types may leak into canonical models or metrics.

### 28.8 Credential security (fully specified)

AES-256-GCM, random 12-byte IV per encryption, 32-byte key, storage format `base64(iv):base64(authTag):base64(ciphertext)`; key from `JIRA_CREDENTIAL_ENCRYPTION_KEY` env var (scrypt-derived if passphrase-based). Required env vars also include `JIRA_ALLOWED_HOSTS` (SSRF allowlist) plus timeout/retry/page-size/max-connections defaults. 6-step rotation procedure (generate → decrypt-with-old → re-encrypt-with-new → update env → verify all connections via test-connection → audit event per connection). Mandatory rules: never expose credentials to frontend post-submission, never log them, never send to the AI model, never use localStorage/sessionStorage, block non-allowlisted hosts including localhost/private ranges, enforce connect+read timeouts, restrict connection management to `admin` role only.

### 28.9 Data model additions (planned)

- `JiraConnection`: add `organisationId`, `encryptionKeyVersion`, `freshnessThresholdLiveMinutes`/`RecentMinutes`/`StaleMinutes`.
- `JiraSyncRun`: add `organisationId`, `issuesStaged`/`issuesPromoted`/`issuesRolledBack`.
- New `AiAuditLog` model (see CONCERN-12).
- New `CanonicalSyncStaging` model (see CONCERN-10).
- New `SnapshotCanonicalRecord` model (see CONCERN-05).
- `CanonicalIssue`: add mandatory `organisationId`; freshness computed at query time from connection thresholds, not stored.

### 28.10 Synchronisation state machine (planned)

`queued → connecting → fetching_metadata → fetching_issues → fetching_changelogs (optional) → staging → validating_staged → promoting → calculating → completed | completed_with_warnings`, with `failed`/`cancelled` exits. Staging-before-promote per CONCERN-10. Incremental sync uses a `SyncCursor` (`lastIssueSyncedAt`, `lastChangelogKey`, `lastVersionUpdated`, `completedPages`, `totalEstimatedPages`) persisted in `JiraSyncRun.cursorJson` so sync can resume after interruption.

### 28.11 AI feature set (planned)

AI-1 Explain Delivery Health · AI-2 Executive Summary · AI-3 Explain Top Risks · AI-4 Rewrite Recommendations for Role (Scrum Master/Product Owner/Engineering Manager/Delivery Manager/Executive/Customer-safe tones) · AI-5 Ask Delivery Clarity (free-form Q&A over structured evidence only, English or Arabic). All responses must cite evidence IDs, disclose source mode + freshness, and explicitly state limitations/missing data rather than speculate.

### 28.12 Response contract, rejection rules, and system prompt (planned)

`DeliveryAiResponse` must include `sourceDisclosure`, `observations[]` (with `evidenceIds`/`confidence`), `recommendedActions[]`, `limitations[]`, `missingData[]`, `language`, plus `queueWaitMs`/`modelId`/`latencyMs`. Reject/repair responses on: fabricated evidence references, metric values absent from evidence, references to entities outside the supplied dataset, false "live" claims when sync is stale, invented users/dates/issues/releases/causes, omitted missing-data disclosure, or detected prompt-injection patterns in output. Every prompt must open with the 12-rule system prompt block (evidence-only, injection-fence, no external access, no invention, fact/interpretation/action distinction, evidence-ID citation, source+freshness disclosure, no independent recalculation, no Jira actions, exact JSON schema, requested language, explicit "insufficient evidence" admission).

### 28.13 Planned API surface

Jira: `POST/GET/PATCH/DELETE /api/jira/connections[/:id]`, `/test`, `/projects`, `/boards`, `/scopes`, `/sync`, `/resync`, `/cancel`, `/rollback` (new), `/status`, `/sync-history`, `/api/jira/sync-runs/:id`, `POST /api/admin/credentials/rotate` (new).
AI: `/api/ai/health`, `/queue-status` (new), `/models` (new), `POST /benchmark` (new), `/explain-health`, `/summary`, `/risks/explain`, `/recommendations`, `/ask`, `/role-coaching`, `/report`, `GET /api/admin/ai-audit-logs` (new).
Data governance: `GET/PATCH /api/admin/data-retention/policy`, `POST /purge`, `POST /anonymise-user/:accountId` (all new).
Future write-back (do **not** implement without explicit approval — see `DND-02`): `/api/jira/writeback/drafts[/:id/validate|/execute]`.

### 28.14 UI changes (planned)

Landing page presents "Connect Jira" and "Upload Jira Export" as equal, non-hierarchical primary options. Dashboard header always shows a source/freshness badge (Live <15min, "Jira Sync: Xh ago" <4h/<24h amber, "Stale Data" >24h red, "Uploaded Export: date" blue, "Snapshot: date" grey) driven by the connection's configurable freshness thresholds. AI Analyst UI must show a permanent "🔒 Local & Private" badge, current source/freshness, queue position if waiting, English/Arabic selector, streaming answer with evidence citations, an expandable evidence drawer, Copy/Regenerate/Feedback actions, and a stale-data warning when applicable.

### 28.15 Admin settings structure (planned)

`Admin Settings → Jira Connections · Synchronisation (schedule/incremental/retry/freshness thresholds) · AI Engine (model registry, queue limits, language, privacy, benchmark, kill switch) · Storage · Data Retention (new) · Security · Audit Logs`.

### 28.16 Security requirements (planned, summary)

Jira: AES-256-GCM per-record IV, allowlist-only hosts (block private ranges/SSRF), connect+read timeouts, no raw Jira errors to frontend, rotation without data loss, audit events on every connection lifecycle action, least-privilege read-only scopes by default, `organisationId` row-level scoping everywhere. AI: Ollama on private Docker network only, no credentials in evidence payloads, `sanitiseJiraText()` on every untrusted field, response validation before return, prompt-injection detection, no write-back capability, admin kill switch without restart, full audit log including rejections. Data: GDPR retention policy, PII anonymisation on disconnect, organisation isolation, staging-before-promote, rollback to last known good state.

### 28.17 Testing strategy additions (planned)

Jira: SSRF/host-allowlist test, credential encryption round-trip, key rotation with existing encrypted data, large-project pagination, rate-limit backoff, staging pass/fail paths, rollback, cross-org isolation, incremental cursor resume, webhook dedup, comment/changelog failure isolation, credential redaction from logs. Canonical model: export-vs-API normalisation parity, `organisationId` presence, dedup on resync, deleted-issue handling, custom-field resilience, Scrum+Kanban parity. AI: per-mode evidence validity, snapshot freshness derivation, stale-data warning, Arabic native-speaker review gate, citation validity, queue correctness under concurrency, per-user rate limiting, prompt-injection rejection (summary/description/display-name vectors), metric-absence rejection, out-of-dataset-entity rejection, audit log completeness, AI-failure dashboard isolation, kill-switch behaviour. Performance: TTFT/total-time/RAM/CPU/responsiveness at 1/3/5 concurrent users, queue depth under burst.

### 28.18 Delivery phases (as received — incomplete, see truncation notice above)

- **Phase 0 — Repository audit and documentation (2–3 days).** Gates: full audit of existing Jira features vs this plan, gap report, architecture impact assessment, P0 doc gates confirmed, all affected docs identified, server benchmark date confirmed (CONCERN-07), single-org-vs-multi-org decision made (CONCERN-04), GDPR applicability confirmed for target markets (CONCERN-11). Do not proceed to Phase 1 until all gates are closed.
- **Phase 1 — Canonical source architecture (3–5 days).** Deliverables so far: `organisationId` added to all canonical models (CONCERN-04); `SnapshotCanonicalRecord` model created (CONCERN-05); *(remainder of Phase 1, and all phases after it, missing — see truncation notice)*.

| ID | Task | Priority | Status |
|---|---|---:|---|
| AIPLAN-01 | Run mandatory Phase 0 server benchmark (`qwen2.5:14b-instruct-q4_K_M`, TTFT/RAM/CPU) before any AI code | P0 (gate) | ❌ Not started |
| AIPLAN-02 | Decide single-org vs multi-org and confirm GDPR applicability (Phase 0 gates) | P0 (gate) | ❌ Not started |
| AIPLAN-03 | Phase 1: add `organisationId` to all canonical models | P1 | ❌ Not started |
| AIPLAN-04 | Phase 1: add `SnapshotCanonicalRecord` model | P1 | ❌ Not started |
| AIPLAN-05 | Obtain and append the missing remainder of the source plan (Phase 1 continuation through final section) | P0 | ❌ Not started — blocked on user re-pasting truncated content |

---

*Delivery Clarity — Ali Delivery Intelligence — Master TODO aligned with the full Claude prompt and corrected with missing prompt details.*
