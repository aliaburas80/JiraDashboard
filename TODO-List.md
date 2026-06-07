# Delivery Clarity — Master TODO List

**Last updated:** 2026-06-07 (TRACE-01 first-pass matrix compiled and inserted)  
**Product:** Delivery Clarity  
**Brand:** Ali Delivery Intelligence  
**Product line:** From Jira Exports to Delivery Confidence  
**Main slogan:** From messy boards to measurable delivery confidence.  
**Supporting line:** Zero-credential Jira analytics, retrospective intelligence, role-based coaching, and delivery forecasting — all in one private workspace.  
**Current known branch from uploaded TODO:** `codex/flat-admin-settings`  
**Current known version from uploaded TODO:** `v4.2.2`  
**Current known test status from uploaded TODO:** `npm run lint` pass, `npm test` pass with 469 tests / 48 suites, `npm run build` pass.  
**Important correction:** Do **not** treat P0 as fully closed while `TRACE-01`, `TRACE-02`, full app coverage validation, and required-output reporting are still open.  
**TRACE-01 progress (2026-06-07):** First-pass traceability matrix compiled and inserted in Section 12 (~50 feature rows cross-referenced against SRS/UC/SCN/UJ/TC/Release Notes). ~38% of cells are `GAP — not found`. Status moved from ❌ Not started → 🔧 In progress. Highest-priority remaining gaps: F3-14/15/16 (admin user mgmt, members, forced password change — zero UC/SCN/UJ/TC), F2-05/06/07/09/11/12/13 (explorer visuals/filters), F4-05/06/08 (export sheets), UX-14 (flat admin redesign — zero anchoring). See Section 12 Gaps Summary for the full prioritized punch-list.

---

## 0. Operating Rule

Act as a senior cross-functional delivery/product team:

- Principal Software Engineer
- Senior Backend Engineer
- Senior Frontend Engineer
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

| Priority | Meaning | Rule |
|---|---|---|
| P0 | Critical release-control gate | Blocks everything else. Must be completed before new feature coding. |
| P1 | Current product hardening / UX / internal architecture | Start only after P0 gates are closed. |
| P2 | Product intelligence / forecasting / retrospective / architecture planning | Valuable, but only after P1 items are stable or explicitly approved. |
| P3 | Future full external integrations | Do not start until P2 design is approved. |
| P4 | Future communication/governance layer | Planning only unless explicitly approved. |

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
| ABS-01 | Do not start new feature coding until P0 reconciliation is complete | P0 | 🔍 Needs verification | P0 is not fully complete until documentation alignment, traceability, product-folder impact review, test count normalization, and release-candidate gate are all verified. |
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

## 7. Daily Master Prompt Regeneration

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| DAILY-01 | Regenerate Claude working prompt at the beginning of every new workday | P0 | ✅ Permanent | Do not reuse yesterday’s prompt blindly. |
| DAILY-02 | Include current date, branch, version, code status | P0 | ✅ Permanent | Must reflect actual repository state. |
| DAILY-03 | Include documentation, TODO, release-notes, lint/test/build status | P0 | ✅ Permanent | Must show what is current and what is behind. |
| DAILY-04 | Include what changed yesterday and what remains behind | P0 | ✅ Permanent | Any behind document becomes P0 immediately. |
| DAILY-05 | Include today’s P0 and what must not be started yet | P0 | ✅ Permanent | Prevents jumping into features before gates close. |
| DAILY-06 | Include updated execution order and Definition of Done | P0 | ✅ Permanent | Every day begins from current reality. |

---

## 8. Full App Coverage Rule

`product/SRS.md`, `product/USE_CASES.md`, and `product/TEST_CASES.md` must cover the entire app, not only the newest changes.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| COVER-01 | Validate every page is covered | P0 | ❌ Not started | Include dashboard, upload, admin, developer, help, charts, explore, readiness, members, login, profile, retrospective, forecasting, and future pages where applicable. |
| COVER-02 | Validate every route is covered | P0 | ❌ Not started | Include UI routes and protected route behavior. |
| COVER-03 | Validate every API route is covered | P0 | ❌ Not started | Include upload, metrics/latest, admin users, storage, auth, notifications/request workflow, gateway, retro, forecast APIs when implemented. |
| COVER-04 | Validate every user role is covered | P0 | ❌ Not started | Admin, Scrum Master, Product Owner, Manager, C-level, Team Lead, legacy/user roles if present. |
| COVER-05 | Validate every admin feature is covered | P0 | ❌ Not started | Users, privacy/retention, health thresholds, orphan rules, backup/restore, cloud storage, browser data, diagnostics, logs, security, future user requests. |
| COVER-06 | Validate upload flows are covered | P0 | ❌ Not started | Jira export upload, multi-file upload, retrospective file upload, template upload, upload preview, column mapping, invalid file handling. |
| COVER-07 | Validate dashboard sections are covered | P0 | ❌ Not started | Overview, sprints, Kanban, flow, risks, data quality, confidence, work items, coaching, retro, forecast, readiness. |
| COVER-08 | Validate all calculations are covered | P0 | ❌ Not started | Formula, source field, assumptions, limitations, benefit, alternatives, code location. |
| COVER-09 | Validate database models are covered | P0 | ❌ Not started | User, Session, ImportLog, DashboardSnapshot, AuditEvent, future UserAddRequest, Notification, RetroInsight if implemented. |
| COVER-10 | Validate browser storage behavior is covered | P0 | ❌ Not started | `dc_*` / `dc-*` keys, local/session storage, clear data, privacy reset, fallback rules. |
| COVER-11 | Validate security behavior is covered | P0 | ❌ Not started | Auth, role-route authorization, first-login password change, secret redaction, gateway SSRF protections. |
| COVER-12 | Validate error states are covered | P0 | ❌ Not started | Upload error, parsing error, storage failure, gateway failure, notification failure, invalid template, insufficient forecast data. |
| COVER-13 | Validate export features are covered | P0 | ❌ Not started | Smart Excel export, HTML export, future PDF/executive exports if planned. |
| COVER-14 | Validate customer/executive views are covered | P0 | ❌ Not started | C-level view, customer/reporting view, management summaries. |
| COVER-15 | Validate developer route features are covered | P0 | ❌ Not started | Package Reference, Calculation Reference, technical references. |
| COVER-16 | Validate storage behavior is covered | P0 | ❌ Not started | Local, S3/S3-compatible, Azure Blob, GCP, latest metrics, backup bundle, fallback, settings persistence. |
| COVER-17 | Validate gateway behavior is covered | P0 | ❌ Not started | Endpoint validation, allowlist, timeouts, retries, audit, provider registry, future routing. |
| COVER-18 | Validate notification/request behavior is covered | P0 | ❌ Not started | User-add request, admin queue, accept/reject, requester result notification, audit events. |
| COVER-19 | Validate forecasting behavior is covered | P2 | ❌ Not started | On-track/at-risk/off-track, confidence, charts, adjustment suggestions, insufficient-data fallback. |
| COVER-20 | Validate retrospective behavior is covered | P2 | ❌ Not started | Upload, template download, in-app form, validation, preview, mapping, insights, improvement backlog. |
| COVER-21 | Validate role-based coaching behavior is covered | P1 | ❌ Not started | Role tabs/cards, evidence, weak points, ceremonies, prevention advice, next sprint focus. |
| COVER-22 | Validate future roadmap items are clearly marked future | P0 | ❌ Not started | P3/P4 must not appear as implemented unless actually implemented. |
| TRACE-02 | Validate SRS, Use Cases, and Test Cases cover the full app | P0 | ❌ Not started | This is the missing P0 item from the uploaded TODO. Complete before HARD-01/HARD-02/HARD-03/RETRO/FCAST work. |

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
| REC-01 | Confirm current branch | P0 | 🔍 Needs verification | Must be read from repo, not assumed. |
| REC-02 | Confirm working tree status | P0 | 🔍 Needs verification | Must report uncommitted changes, if any. |
| REC-03 | Create safe baseline commit if needed | P0 | 🔍 Needs verification | Only if appropriate and approved. |
| REC-04 | Update `product/SRS.md`: P1.1 Calculation Reference Done/Verified | P0 | 🔍 Needs verification | Must show implemented in `/developer`, visible in blue side menu, covered by docs/tests. |
| REC-05 | Update `product/SRS.md`: P1.2 Clear Local Data Done/Verified | P0 | 🔍 Needs verification | Must show Admin Settings + Upload/Landing behavior, warning, session note, tests. |
| REC-06 | Update `product/SRS.md`: P1.3 Dashboard Section Show/Hide Done/Verified | P0 | 🔍 Needs verification | Must show section controls, all major sections, smooth scroll, animations, reduced-motion, tests. |
| REC-07 | Remove any text saying P1.1/P1.2/P1.3 are queued/planned/not started | P0 | 🔍 Needs verification | SRS, BRD, TODO, Use Cases, User Journeys must not conflict. |
| REC-08 | Update `product/USE_CASES.md` intro/scope to v4.2.x | P0 | 🔍 Needs verification | Remove old v1.0 and 40-use-case-only wording. |
| REC-09 | Remove “auth/multi-user out of scope” wording | P0 | 🔍 Needs verification | Auth, role-based access, admin users, snapshots/trends are in scope. |
| REC-10 | Add/verify use cases for admin user management | P0 | 🔍 Needs verification | Admin creates user, edits role, enables/disables account. |
| REC-11 | Add/verify use cases for route visibility | P0 | 🔍 Needs verification | Role-scoped route visibility and middleware enforcement. |
| REC-12 | Add/verify use cases for User Add-Member Request Workflow | P0/P1 | ❌ Not started | Request, admin accept/reject, requester result, first-login password change. |
| REC-13 | Add/verify use cases for Backend Gateway | P0/P1 | ❌ Not started | Gateway validation before external calls. |
| REC-14 | Add/verify use cases for Role-Based Coaching | P0/P1 | ❌ Not started | Role-specific suggestions and evidence. |
| REC-15 | Add/verify use cases for Retrospective Template/Form | P0/P2 | ❌ Not started | Template download, upload preview, in-app form, insights. |
| REC-16 | Add/verify use cases for Forecasting | P0/P2 | ❌ Not started | Delivery forecast and adjustment report. |
| REC-17 | Reconcile storage status across SRS/BRD/Developer Guide/Release Notes/README/Test Cases/TODO | P0 | 🔍 Needs verification | Current decision from uploaded TODO: implemented. Must confirm all docs agree. |
| REC-18 | Update `TODO-List.md` to current reality | P0 | ✅ Done — this file | Include P0-P4, status values, new roadmap items, blockers. |
| REC-19 | Normalize test count | P0 | 🔍 Needs verification | Uploaded TODO says 469 tests / 48 suites. Must verify by running tests. |
| REC-20 | Run `npm run lint` | P0 | 🔍 Needs verification | Required before release-candidate decision. |
| REC-21 | Run `npm test` | P0 | 🔍 Needs verification | Must report passing/failing/skipped count. |
| REC-22 | Run `npm run build` | P0 | 🔍 Needs verification | Must pass before release candidate. |
| REC-23 | Run `npm run test:coverage` if available | P0 | 🔍 Needs verification | Required only if project has coverage command. |
| REC-24 | Update Release Notes with verification result | P0 | 🔍 Needs verification | Include lint/test/build, doc reconciliation, open risks. |
| REC-25 | Decide Release Candidate status | P0 | ⚠️ Conflict | Uploaded TODO says Release Candidate, but TRACE-01/TRACE-02 are not complete. Recommended status: “RC candidate blocked by traceability coverage gate.” |

---

## 11. Storage Status Reconciliation

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| STORAGE-DEC-01 | Decide true storage implementation status | P0 | 🔍 Needs verification | Option A implemented / Option B partial / Option C planned. Uploaded TODO says implemented. |
| STORAGE-DEC-02 | Document supported providers | P0 | 🔍 Needs verification | Local, S3/S3-compatible, Azure Blob, GCP if confirmed. |
| STORAGE-DEC-03 | Document current limitations | P0 | 🔍 Needs verification | Include simultaneous replication limitations, if any. |
| STORAGE-DEC-04 | Document tests | P0 | 🔍 Needs verification | Include cloud restore hardening tests and settings persistence tests. |
| STORAGE-DEC-05 | Document admin UI | P0 | 🔍 Needs verification | Cloud Storage tab, initial-load guard, disabled states if implemented/planned. |
| STORAGE-DEC-06 | Document credential security | P0 | 🔍 Needs verification | No frontend secret exposure, persistence behavior, login/logout/session behavior. |
| STORAGE-DEC-07 | Document backup bundle behavior | P0 | 🔍 Needs verification | Include `latest-metrics.json` behavior. |
| STORAGE-DEC-08 | Document fallback behavior | P0 | 🔍 Needs verification | `loadMetricsWithSource()`, localStorage fallback, source detail display. |
| STORAGE-DEC-09 | Add visible source details | P0 | ❌ Not started | Provider, bucket key, last fetched, last pushed, fallback reason. This was `JIRA-GATE-03`. |
| STORAGE-DEC-10 | Add admin sync health check in diagnostics | P0 | ❌ Not started | Latest metrics availability + cloud copy freshness. This was `JIRA-GATE-04`. |
| STORAGE-DEC-11 | Add Cloud Storage initial-load guard | P0 | ❌ Not started | Disable provider cards/forms/actions until `/api/admin/storage` loads; prevent temporary default flash. This was `JIRA-GATE-05`. |
| STORAGE-DEC-12 | Verify cloud-backed user authority | P0 | ✅ Done / Needs regression | Uploaded TODO says done: sync from cloud before auth/admin reads/writes; push after user create/update/password change. |
| STORAGE-DEC-13 | Add email access notifications for created users | P0 | ❌ Not started | SMTP/email provider, send access URL/role, log delivery status/errors. This was `JIRA-GATE-07`. |

---

## 12. Traceability Rule

Every implemented feature must be traceable end-to-end.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TRACE-01 | Build full traceability matrix for every shipped v4.2.x feature | P0 | 🔧 In progress — first pass compiled 2026-06-07, ~38% gaps found | Cross-reference Feature ↔ SRS FR ID ↔ Use Case ID ↔ Scenario ID ↔ User Journey ID ↔ Test Case ID ↔ Release Note ↔ TODO Status. Filled matrix and prioritized gap punch-list now in Section 12. Cannot be marked ✅ Done until F3-14/15/16, F2-05/06/07/09/11/12/13, and F4-05/06/08 gaps are closed (see Gaps Summary). |
| TRACE-02 | Validate SRS, Use Cases, and Test Cases cover the full app | P0 | ❌ Not started | Added from missing prompt details. Must cover all pages/routes/APIs/roles/features/future items. |
| TRACE-03 | Block new coding if any implemented feature lacks traceability | P0 | ✅ Permanent | Any gap becomes P0 immediately. |
| TRACE-04 | Add traceability rows for P1.1 Calculation Reference | P0 | ❌ Not started | Must include doc/test references. |
| TRACE-05 | Add traceability rows for P1.2 Clear Local Data | P0 | ❌ Not started | Must include Upload/Admin behavior and tests. |
| TRACE-06 | Add traceability rows for P1.3 Dashboard Section Switcher | P0 | ❌ Not started | Must include all dashboard sections and tests. |
| TRACE-07 | Add traceability rows for Admin User Management and role-based route enforcement | P0 | ❌ Not started | Must include role matrix and middleware tests. |
| TRACE-08 | Add traceability rows for Cloud Storage and latest-metrics restore | P0 | ❌ Not started | Must include provider/admin UI/fallback tests. |
| TRACE-09 | Add traceability placeholders for Backend Gateway | P1 | ❌ Not started | Create once implemented. |
| TRACE-10 | Add traceability placeholders for User Add-Member Request | P1 | ❌ Not started | Create once implemented. |
| TRACE-11 | Add traceability placeholders for Role-Based Coaching | P1 | ❌ Not started | Create once implemented. |
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
| F1-07 TypeScript types `src/types/throughput.ts` | GAP — not found (only named in Release Notes, not specified by an FR) | GAP — not found | GAP — not found | GAP — not found | GAP — not found | v3.0 — "`src/types/throughput.ts` — full TypeScript coverage" | ✅ Done |
| F1-08 DashboardMetrics extended with `throughput` field | FR-215 | GAP — not found | GAP — not found | GAP — not found | GAP — not found | v3.0 — implied by FR-215 ("all throughput data under a `throughput` field"); no distinct bullet | ✅ Done |
| F2-01 Hierarchy reconstruction service | FR-218 | UC-046 | GAP — not found | GAP — not found | TC-E-01, TC-E-02, TC-E-07, TC-E-08 | v3.0 — "Hierarchy reconstruction (multi-signal: parent key, epic link, key prefix)" | ✅ Done |
| F2-02 Orphan risk detection with delivery impact | FR-219 | UC-046 (Alt Flow B) | GAP — not found | GAP — not found | TC-E-06 | v3.0 — "Orphan risk detection — 4-class classification with delivery impact statements" | ✅ Done |
| F2-03 Relation graph builder | FR-217, FR-218 | UC-046 | SCN-013 | UJ-011 | TC-E-01–TC-E-08 | v3.0 — implicit in "hierarchy reconstruction... React Flow visual graph" bullet | ✅ Done |
| F2-04 React Flow visual graph with Dagre layout | FR-220 | UC-046 | SCN-013 | UJ-011 | GAP — not found (no TC asserts Dagre layout positions) | v3.0 — "React Flow visual graph with Dagre layout, custom node cards, pan/zoom, minimap" | ✅ Done |
| F2-05 Node styles per issue type | FR-221 | UC-046 | GAP — not found | UJ-011 | GAP — not found | GAP — not found (Release Notes say only "custom node cards") | ✅ Done |
| F2-06 Orphan node visual treatment | FR-222 | UC-046 (Alt Flow B) | GAP — not found | GAP — not found | GAP — not found (TC-E-06 covers detection, not the visual badge/border) | GAP — not found | ✅ Done |
| F2-07 RelationLegend / RelationInsightPanel / RelationStatsCards / RelationDetailsTable | FR-223, FR-224 | UC-046 | GAP — not found | GAP — not found | GAP — not found | GAP — not found (Release Notes name "RelationCharts" and "custom node cards" but not these four panels) | ✅ Done |
| F2-08 RelationCharts (completion, health, types, assignee, sprint, orphan) | FR-223 | UC-046 | GAP — not found | UJ-011 | GAP — not found | v3.0 — "RelationCharts — 6 chart cards per issue" | ✅ Done |
| F2-09 Field-format bug fix for FlowItem/raw JiraIssue | GAP — not found (no FR documents this fix) | GAP — not found | GAP — not found | GAP — not found | GAP — not found | v3.0 — "Bug fix: field format compatibility (FlowItem and raw JiraIssue)" | ✅ Done |
| F2-10 Explore added to app navigation | FR-279 | GAP — not found (no dedicated UC; implied by UJ-011 step 1) | SCN-013, SCN-036 | UJ-011 | GAP — not found | v3.0 — "New Routes: `/explore`"; v4.0 — "grouped sub-menu... Delivery: ...Explore" | ✅ Done |
| F2-11 Risk-path highlight | GAP — not found (no FR documents `isOnRiskPath`) | GAP — not found | SCN-026 | GAP — not found | TC-RP-01–TC-RP-08 | v4.0 — "9.18 Risk-path highlight" | 🔍 Needs verification |
| F2-12 Largest unfinished branch insight | GAP — not found (only indirectly via FR-290 Excel sheet description) | GAP — not found | SCN-026 | GAP — not found | TC-LB-01–TC-LB-08 | v4.0 — "9.19 Largest unfinished branch" | 🔍 Needs verification |
| F2-13 Blocked branch filter | GAP — not found | GAP — not found | GAP — not found | GAP — not found | TC-BF-01–TC-BF-08 | v4.0 — "9.20 Blocked branch filter" | 🔍 Needs verification |
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
| F3-14 Admin user management with role assignment | FR-235A, FR-235B, FR-235C, FR-233 | UC-084 | SCN-039, SCN-040 | UJ-024 | TC-AU-01–TC-AU-07 (TC-AU-06/07 still ❌ Not Run — gaps) | v4.2.2 — "Added admin-managed users in `/admin/settings → Users`..." | ✅ Done — traceability closed 2026-06-07 (2 sub-gaps remain: TC-AU-06/07) |
| F3-15 Member directory `/members` | FR-235G | UC-085 | SCN-041 | UJ-025 | TC-MD-01–TC-MD-08 (TC-MD-05–08 still ❌ Not Run — gaps, no `members.test.ts` yet) | v4.2.2 — "Added `/members`: searchable member cards + detail popup" | ✅ Done — traceability closed 2026-06-07 (4 sub-gaps remain: TC-MD-05–08) |
| F3-16 Forced first-login password change | FR-235D | UC-086 | SCN-042 | UJ-026 | TC-PW-01–TC-PW-10 (TC-PW-07–10 still ❌ Not Run — gaps, end-to-end flow not yet automated) | v4.2.2 — "...first-login password-change enforcement" | ✅ Done — traceability closed 2026-06-07 (4 sub-gaps remain: TC-PW-07–10) |
| F4-01 Recommendation engine (evidence/impact/owner/action) | FR-238, FR-239, FR-295 | UC-049 | SCN-016 | UJ-013 | `excelExport.test.ts` (15 tests, no dedicated TC-X row) | v3.0 — "Recommendation engine (10+ rules, evidence + impact + owner + action)" | ✅ Done |
| F4-02 17-sheet statistical workbook | FR-236, FR-237 | UC-049 | SCN-016 | UJ-013 | TC-X-04 | v3.0 — full 17-sheet bullet | ✅ Done |
| F4-03 Executive Summary sheet | FR-238 | UC-049 | SCN-016 | UJ-013 | TC-X-02 | v3.0 — "Executive Summary..." | ✅ Done |
| F4-04 Sprint Throughput / Mid-Sprint / Kanban Flow sheets | FR-207, FR-236 | GAP — not found | SCN-012, SCN-014 | GAP — not found | TC-X-01 | v3.0 — sheet bullet | ✅ Done |
| F4-05 Risks & Blockers / Orphan & Data Quality / Release Readiness sheets | FR-236 | GAP — not found | GAP — not found | GAP — not found | GAP — not found | v3.0 — sheet bullet | ✅ Done |
| F4-06 Cycle & Lead Time percentile analysis | FR-236 | GAP — not found | SCN-016 | GAP — not found | GAP — not found | v3.0 — "Cycle & Lead Time, Throughput Trends..." | ✅ Done |
| F4-07 Metric Dictionary sheet | FR-240 | UC-049 | GAP — not found | UJ-013 | TC-X-05 | v3.0 — "Metric Dictionary, Raw Data Reference" | ✅ Done |
| F4-08 Export button triggers smart workbook | FR-236 | UC-049 | SCN-016 | UJ-013 | GAP — not found | v3.0 — "Export button in dashboard sticky bar and summary page" | ✅ Done |
| UX-01 Dashboard sections collapsible | FR-214 (implied) | GAP — not found | GAP — not found | UJ-010 | GAP — not found | v3.0 — "All dashboard sections collapsible" | ✅ Done |
| UX-02 Default open sections | GAP — not found | GAP — not found | GAP — not found | GAP — not found | GAP — not found | GAP — not found | ✅ Done |
| UX-03 Status chips on section triggers | GAP — not found | GAP — not found | GAP — not found | UJ-010 (fragment) | GAP — not found | GAP — not found | ✅ Done |
| UX-04 Upload-to-dashboard redirect fix | FR-200 | GAP — not found | GAP — not found | UJ-010 | TC-101 | v3.0 — "Upload → dashboard redirect bug fixed" | ✅ Done |
| UX-05 HTML export redesigned | FR-300 (brand mark) | GAP — not found | GAP — not found | GAP — not found | GAP — not found | v4.0 — "HTML report export: Lightning bolt brand mark... footer 'Delivery Clarity v4.1'" | ✅ Done |
| UX-06 Calculation Reference visible in /developer side menu | FR-283 | UC-059 | SCN-022 | GAP — not found | GAP — not found (no formal TC-xxx) | "P1.1 — Done" via FR-283 acceptance detail | ✅ Done |
| UX-07 Clear Local Data in Admin Settings | FR-284, FR-286 | UC-057, UC-060 | SCN-018, SCN-023 | UJ-017, UJ-020 | TC-CLD-01–TC-CLD-10 | v4.1 — "P1.2 — Clear Local Data... 10 automated tests (TC-CLD-01–10)" | ✅ Done |
| UX-08 Clear Local Data on Upload/Landing page | FR-284 | UC-056, UC-060 | SCN-019, SCN-023 | UJ-017 | TC-CLD-01–TC-CLD-10 | v4.1 — same P1.2 bullet (banner detection on upload page) | ✅ Done |
| UX-09 Dashboard Section Switcher with smooth scroll/animation | FR-285 | UC-058, UC-061 | SCN-020, SCN-024, SCN-025 | UJ-019 | TC-DS-01–TC-DS-10 | v4.1 — "P1.3 — Dashboard Section Switcher... 10 automated tests (TC-DS-01–10)" | ✅ Done |
| UX-10 Product tour animation | FR-303 | UC-079, UC-080 | SCN-035 | GAP — not found | TC-PT-01–TC-PT-08 | v4.1 — "P3 — Product Tour Animation: 8-step guided tour... 8 tests (TC-PT-01–08)" | ✅ Done |
| UX-11 Advanced theme customization | FR-304 | UC-081 | GAP — not found | GAP — not found | TC-TC-01–TC-TC-08 | v4.1 — "P3 — Advanced Theme Customization: 8 tests (TC-TC-01–08)" | ✅ Done |
| UX-12 Custom dashboard layout builder | FR-305 | UC-082 | GAP — not found | GAP — not found | TC-LB2-01–TC-LB2-09 | v4.1 — "P3 — Custom Dashboard Layout Builder: 9 tests (TC-LB2-01–08)" | ✅ Done |
| UX-13 Advanced chart customization | FR-306 | GAP — not found | GAP — not found | GAP — not found | TC-CC-01–TC-CC-08 | v4.1 — "P3 — Advanced Chart Customization: 9 tests (TC-CC-01–08)" | ✅ Done |
| UX-14 Flat admin-settings UI redesign | FR-260A | UC-087 | SCN-043 | UJ-027 | TC-AC-01–TC-AC-03 | v4.2.2 — "Redesigned `/admin/settings` to match the flat admin settings mockup..." | ✅ Done |

### Gaps Summary — Punch List to Close TRACE-01 (prioritized)

1. ~~**Highest priority — Feature 3 admin/user/member items (F3-14, F3-15, F3-16)**~~ — **CLOSED 2026-06-07.** Added `UC-084/085/086`, `SCN-039–042`, `UJ-024–026`, and formal `TC-AU-01–07` / `TC-MD-01–08` / `TC-PW-01–10` IDs (see `product/USE_CASES.md`, `SCENARIOS.md`, `USER_JOURNEYS.md`, `TEST_CASES.md` §9.43). **Residual sub-gaps** (now tracked as concrete ❌ Not Run test rows rather than open documentation gaps): `TC-AU-06` (self-disable-protection test), `TC-AU-07` (duplicate-email-409 test), `TC-MD-05–08` (no dedicated `members.test.ts` — route handler, search filter, contact-email fallback, anonymous-redirect all untested), `TC-PW-07–10` (forced-password-change end-to-end flow — middleware redirect, must-differ-from-temp check, success path, wrong-temp-password path — none automated yet, only route-access and password-strength/hash are). **Next action**: write these 14 test cases (they map to existing, identified code branches — see file/line references in TEST_CASES.md §9.43) to fully close this cluster.
2. **Feature 2 explorer visual/filter items (F2-05, F2-06, F2-07, F2-09, F2-11, F2-12, F2-13)**: Node styling, orphan visual badge/border, the four Relation* panels, the FlowItem/JiraIssue compatibility fix, and the three "Needs verification" items (risk-path highlight, largest-branch insight, blocked-branch filter) lack SRS FR and/or SCN/UJ coverage even though TC-RP/TC-LB/TC-BF test suites exist. **Action**: add FR entries for the uncovered behaviours, write SCN/UJ narratives for the visual graph experience, and re-verify F2-11/12/13 at the code level before their TODO Status can move from 🔍 to ✅.
3. **Feature 4 export sheets (F4-05, F4-06, F4-08)**: Risks & Blockers / Orphan & Data Quality / Release Readiness sheets and the Cycle & Lead Time percentile sheet have no dedicated UC/TC; the export button trigger has no TC. **Action**: add `TC-X-06`–`TC-X-1x` rows naming each sheet, plus a UC for the export-trigger flow.
4. **F1-07/F1-08 (types & DashboardMetrics field)**: Pure implementation/data-model items with zero UC/SCN/UJ/TC — only named in Release Notes. **Action**: either mark these as "implementation detail — not independently traceable" in a matrix legend, or add a minimal UC/TC asserting `metrics.throughput` shape coverage.
5. **UX items (UX-02, UX-03, UX-05, UX-11, UX-13)**: "Default open sections", "status chips", "HTML export redesign", and "advanced theme/chart customization" still lack UC/SCN/UJ/TC anchoring. **UX-14 (flat admin-settings redesign)** is now anchored with `UC-087`, `SCN-043`, `UJ-027`, and `TC-AC-01–TC-AC-03`. **Action**: backfill narrative coverage for the remaining UX items.
6. **Cross-cutting ambiguity**: USE_CASES.md bundles multiple FRs under one UC via "Related FR: FR-207–FR-214" style ranges (e.g., UC-043, UC-046), which makes strict 1:1 FR↔UC traceability ambiguous. **Action**: either split these UCs or add an FR→UC index table as a TRACE-01 appendix.

**Net assessment (updated 2026-06-07):** Gap cluster #1 (F3-14/15/16 — 18 GAP cells) is now closed via new product-doc entries; residual work is 14 concrete test cases with known code locations (no longer "documentation gaps" but "test-writing backlog" — see item 1). Remaining matrix gap clusters are #2 (Feature 2 explorer visuals/filters), #3 (Excel export sheets), #4 (F1-07/08 type/data-model items), and #5 (UX items, esp. UX-14). TRACE-01 cannot be marked ✅ Done until those are closed too. TRACE-02 (full app coverage validation) should follow the same evidence-based approach once this matrix's gaps are filled, since many `COVER-*` rows depend on the same UC/SCN/TC inventory being complete.

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
| F1-TRACE | Add/verify traceability for all Feature 1 items | P0 | 🔍 Needs verification — matrix compiled, F1-07/F1-08 lack UC/SCN/UJ/TC anchoring (see Section 12 Gaps Summary item 4) |

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
| F2-11 | Risk-path highlight | P1 | 🔍 Needs verification |
| F2-12 | Largest unfinished branch insight | P1 | 🔍 Needs verification |
| F2-13 | Blocked branch filter | P1 | 🔍 Needs verification |
| F2-TRACE | Add/verify traceability for all Feature 2 items | P0 | 🔍 Needs verification — matrix compiled, F2-05/06/07/09/11/12/13 are densest gap cluster (see Section 12 Gaps Summary item 2) |

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
| F3-TRACE | Add/verify traceability for all Feature 3 items | P0 | 🔍 Needs verification — F3-14/15/16 doc anchoring closed 2026-06-07 (UC-084/085/086, SCN-039–042, UJ-024–026, TC-AU/MD/PW IDs added); 14 newly-identified test cases (TC-AU-06/07, TC-MD-05–08, TC-PW-07–10) still ❌ Not Run — write these to fully close (see Section 12 Gaps Summary item 1) |

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
| F4-TRACE | Add/verify traceability for all Feature 4 items | P0 | 🔍 Needs verification — matrix compiled, F4-05/06/08 sheets lack UC/TC rows (see Section 12 Gaps Summary item 3) |

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
| UX-TRACE | Add/verify traceability for all UX items | P0 | 🔍 Needs verification — matrix compiled, UX-14 (flat admin redesign) has zero UC/SCN/UJ/TC anchoring — prioritize (see Section 12 Gaps Summary item 5) |

---

## 14. P1 — Backend Integration Gateway Foundation

**Feature:** Backend Integration Gateway  
**Priority:** P1 / Architecture Hardening  
**Rule:** This is not full Jira integration and not full cloud integration. It is a controlled backend foundation that all future external calls must use.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| GW-01 | Create gateway architecture design before code | P1 | ❌ Not started | Explain purpose, scope, providers, security, logging, timeout/retry, and future routing. |
| GW-02 | Create `src/server/gateway/types.ts` | P1 | ❌ Not started | Include `GatewayResult<T>`, provider types, error categories, routing strategies. |
| GW-03 | Create `src/server/gateway/externalGateway.ts` | P1 | ❌ Not started | All future external calls go through this gateway. |
| GW-04 | Create `src/server/gateway/providerRegistry.ts` | P1 | ❌ Not started | Providers: jira, aws_s3, azure_blob, gcp_storage, email, slack, teams, push_notification, custom. |
| GW-05 | Create `src/server/gateway/endpointPolicy.ts` | P1 | ❌ Not started | Allowlist, hostname validation, protocol validation, path pattern validation. |
| GW-06 | Create `src/server/gateway/retryPolicy.ts` | P1 | ❌ Not started | Defaults: timeout 10000ms, maxRetries 2, exponential backoff, retryable 408/429/500/502/503/504, non-retryable 400/401/403/404/409/422. |
| GW-07 | Create `src/server/gateway/gatewayLogger.ts` | P1 | ❌ Not started | Safe audit logging with secret redaction. |
| GW-08 | Support endpoint validation | P1 | ❌ Not started | Only `https` except local dev allowlist. |
| GW-09 | Block unsafe protocols | P1 | ❌ Not started | Reject file, ftp, javascript, data, non-https in production. |
| GW-10 | Block disallowed hosts | P1 | ❌ Not started | Host must be explicitly allowed. |
| GW-11 | Block private/internal IPs in production | P1 | ❌ Not started | SSRF protection. |
| GW-12 | Block localhost in production unless explicitly configured | P1 | ❌ Not started | SSRF protection. |
| GW-13 | Prevent path/query injection where possible | P1 | ❌ Not started | Validate path and sanitize query usage. |
| GW-14 | Ensure secrets never reach frontend | P1 | ❌ Not started | Tokens/API keys/passwords remain server-side. |
| GW-15 | Redact sensitive headers and payload fields | P1 | ❌ Not started | Never log tokens, API keys, cookies, passwords, cloud credentials, service JSON. |
| GW-16 | Support server-side environment/encrypted credential storage | P1 | ❌ Not started | Least privilege only. |
| GW-17 | Support timeout handling | P1 | ❌ Not started | Return consistent timeout error category. |
| GW-18 | Support retry policy | P1 | ❌ Not started | Retry only retryable errors. |
| GW-19 | Support non-retryable errors | P1 | ❌ Not started | Do not retry 400/401/403/404/409/422. |
| GW-20 | Support audit and observability fields | P1 | ❌ Not started | requestId, userId, provider, operation, endpoint alias, start/end, duration, status, retry count, error category, redacted error, correlation ID, instance ID if available. |
| GW-21 | Prepare load-balancer readiness | P1 | ❌ Not started | Stateless handling, shared config, provider health, correlation IDs, idempotency keys. |
| GW-22 | Implement initial routing strategy `single` only | P1 | ❌ Not started | Architecture must allow future round_robin, weighted_round_robin, failover, least_error_rate. |
| GW-23 | Add gateway tests | P1 | ❌ Not started | See TEST-GW section. |
| GW-24 | Update all related product docs | P1 | ❌ Not started | SRS, BRD, Use Cases, User Journeys, Scenarios, Test Cases, Developer Guide, Release Notes, README, Technical Method, Appendix, TODO. |
| GW-25 | Produce product documentation impact matrix before push | P0/P1 | ❌ Not started | Required gate. |

---

## 15. P1/P2 — User Add-Member Request Workflow

**Feature:** Request Add User / Add Member Approval Workflow  
**Priority:** P1 if simple in-app notifications/admin approval; P2 if full Notification Center is required.  
**Rule:** Do not expose temporary passwords to requester. Do not allow non-admin direct user creation.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| USERREQ-01 | Decide implementation scope | P1 | ❌ Not started | Start with simple in-app request record, admin queue, requester result notification. No browser push/email/Slack yet. |
| USERREQ-02 | Add requester button: `Request Add User` / `Request Add Member` | P1 | ❌ Not started | Place in allowed area: User Management read-only view, Profile/Team area, or header quick action. |
| USERREQ-03 | Build request modal | P1 | ❌ Not started | Fields: full name, email, requested role, business reason, team/project optional, notes optional. |
| USERREQ-04 | Validate requester form | P1 | ❌ Not started | Name required, valid email, role required, reason required. |
| USERREQ-05 | Add duplicate email warning/prevention | P1 | ❌ Not started | Prevent accidental duplicate account creation. |
| USERREQ-06 | Add high-privilege role warning | P1 | ❌ Not started | Admin and C-level require extra confirmation. |
| USERREQ-07 | Add Prisma model `UserAddRequest` | P1 | ❌ Not started | id, requestedName, requestedEmail, requestedRole, reason, teamOrProject, notes, requestedByUserId, status, adminDecisionById, adminDecisionAt, adminDecisionNote, createdUserId, createdAt, updatedAt. |
| USERREQ-08 | Add statuses | P1 | ❌ Not started | pending, accepted, rejected, cancelled, expired. |
| USERREQ-09 | Add minimal notification model if none exists | P1/P2 | ❌ Not started | recipientUserId, type, title, message, relatedEntityType, relatedEntityId, readAt, createdAt. |
| USERREQ-10 | Add requester API `POST /api/user-add-requests` | P1 | ❌ Not started | Logged-in users only. |
| USERREQ-11 | Add requester API `GET /api/user-add-requests/mine` | P1 | ❌ Not started | Requester can see own requests. |
| USERREQ-12 | Add admin API `GET /api/admin/user-add-requests` | P1 | ❌ Not started | Admin only. |
| USERREQ-13 | Add admin API accept action | P1 | ❌ Not started | `PATCH /api/admin/user-add-requests/:id/accept`. |
| USERREQ-14 | Add admin API reject action | P1 | ❌ Not started | `PATCH /api/admin/user-add-requests/:id/reject`. |
| USERREQ-15 | Add notification API if needed | P1/P2 | ❌ Not started | `GET /api/notifications`, `PATCH /api/notifications/:id/read`. |
| USERREQ-16 | Add admin request queue | P1 | ❌ Not started | `/admin/user-requests` or `/admin/settings → User Requests`. Must follow flat admin design. |
| USERREQ-17 | Add pending request indicator on admin login | P1 | ❌ Not started | Badge, admin dashboard card, or request queue alert. |
| USERREQ-18 | Add request review details | P1 | ❌ Not started | Requested user, email, role, requester, reason, date/time, duplicate warning, permission warning. |
| USERREQ-19 | Add accept flow | P1 | ❌ Not started | Confirm creation, create user, mark accepted, notify requester, audit. |
| USERREQ-20 | Add reject flow | P1 | ❌ Not started | Optional reason, mark rejected, notify requester, audit. |
| USERREQ-21 | Enforce transaction/atomicity on accept | P1 | ❌ Not started | Validate pending, email unused, create user, mark accepted, notify, audit; avoid misleading partial state. |
| USERREQ-22 | Require first-login password change for created user | P1 | ❌ Not started | Temporary-password or setup flow. |
| USERREQ-23 | Prevent requester approving own request | P1 | ❌ Not started | Admin decision only. |
| USERREQ-24 | Prevent editing after admin decision | P1 | ❌ Not started | Decision is immutable except admin audit-safe corrections if designed. |
| USERREQ-25 | Add rate limiting | P1 | ❌ Not started | Prevent request spam. |
| USERREQ-26 | Add audit events | P1 | ❌ Not started | Submit, accept, reject, create user, notification fail/success. |
| USERREQ-27 | Add mobile layout | P1 | ❌ Not started | Modal and admin queue must work on mobile. |
| USERREQ-28 | Add tests | P1 | ❌ Not started | See TEST-REQ. |
| USERREQ-29 | Update all related product docs | P1 | ❌ Not started | SRS, BRD, Use Cases, User Journeys, Scenarios, Test Cases, Developer Guide, Release Notes, README, Appendix, TODO. |
| USERREQ-30 | Produce product documentation impact matrix before push | P0/P1 | ❌ Not started | Required gate. |

---

## 16. P1 — Role-Based Delivery Coaching Insights

**Feature:** Role-Based Delivery Coaching Insights  
**Rule:** No generic Agile advice. Every recommendation must cite evidence from uploaded data/metrics.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| RBC-01 | Define `RoleBasedCoachingInsight` type | P1 | ❌ Not started | role, healthSummary, weakPoints, focusAreas, recommendedActions, preventionAdvice, ceremonyAdvice, nextSprintSuggestions, evidence, severity, confidence. |
| RBC-02 | Use existing calculated metrics/signals | P1 | ❌ Not started | Completion %, throughput, SP throughput, lead/cycle time, flow efficiency, aging WIP, blocked ratio, orphan ratio, carryover, added/removed scope, sprint goal outcome, data quality, metric confidence, bottlenecks, readiness, Explorer signals, snapshots, trends, forecast. |
| RBC-03 | Generate Scrum Master / Agile Coach insights | P1 | ❌ Not started | Blocked items, aging WIP, flow efficiency, cycle time, daily discipline, retro actions, impediment removal, WIP limits, collaboration. |
| RBC-04 | Generate Product Owner insights | P1 | ❌ Not started | Sprint goal clarity, scope change, added/removed scope, carryover, orphan ratio, backlog readiness, AC quality, refinement discipline. |
| RBC-05 | Generate Engineering Manager insights | P1 | ❌ Not started | Delivery predictability, throughput trend, capacity imbalance, bottlenecks, dependencies, overload, release readiness. |
| RBC-06 | Generate Delivery Manager insights | P1 | ❌ Not started | Release confidence, timeline risk, cross-team blockers, forecast vs target, dependencies, recovery plan, stakeholder communication. |
| RBC-07 | Generate C-level / Executive insights | P1 | ❌ Not started | Delivery health, business risk, forecast confidence, escalation needs, decision support, scope/time/resource trade-offs. |
| RBC-08 | Generate Team Lead insights | P1 | ❌ Not started | Technical blockers, review bottlenecks, QA bottlenecks, work splitting, code review delays, ownership gaps. |
| RBC-09 | Generate Admin insights only for system/admin actions | P1 | ❌ Not started | Storage, data, security, users, governance, diagnostics. |
| RBC-10 | Add daily standup advice rules | P1 | ❌ Not started | Recommend daily when blockers, aging WIP, low midpoint completion, uncertainty, rising cycle time. |
| RBC-11 | Add refinement/grooming advice rules | P1 | ❌ Not started | Recommend when orphan ratio, scope change, carryover, missing estimates/AC, low data quality. |
| RBC-12 | Add sprint planning guidance | P1 | ❌ Not started | Sprint goal, capacity, previous throughput, carryover, leave, ready backlog only, dependencies, AC, estimates, avoid overcommitment, confirm plan, document risks. |
| RBC-13 | Add sprint review advice | P1 | ❌ Not started | Trigger when sprint goal missed, stakeholder visibility weak, delivered value unclear. |
| RBC-14 | Add retrospective topic advice | P1 | ❌ Not started | Trigger when cycle time worsens, blockers repeat, carryover repeats, data quality poor, confidence low. |
| RBC-15 | Add dashboard section `Role-Based Coaching Insights` | P1 | ❌ Not started | Role tabs/cards, severity badge, evidence panel, suggested actions, ceremony advice, prevention section, next sprint focus. |
| RBC-16 | Enforce role visibility | P1 | ❌ Not started | Scrum Master sees SM first; PO sees PO first; Manager sees management; C-level sees executive; Admin sees all. |
| RBC-17 | Adjust confidence using Data Quality and Metric Confidence | P1 | ❌ Not started | Low/missing data reduces confidence and uses safe fallback. |
| RBC-18 | Add tests | P1 | ❌ Not started | See TEST-RBC. |
| RBC-19 | Update all related product docs | P1 | ❌ Not started | SRS, BRD, Use Cases, User Journeys, Scenarios, Test Cases, Developer Guide, Release Notes, README, Algorithm Spec if logic added, Appendix, TODO. |
| RBC-20 | Produce product documentation impact matrix before push | P0/P1 | ❌ Not started | Required gate. |

---

## 17. P2 — Retrospective Upload, Template Download, In-App Form, and Improvement Backlog

**Feature:** Retrospective Upload and Improvement Backlog  
**Rule:** Retrospective upload must be clearly separate from Jira delivery upload unless explicitly labeled.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| RETRO-01 | Create separate retrospective area | P2 | ❌ Not started | `/retro`, dashboard Retrospective section, or Upload page secondary option. |
| RETRO-02 | Add three clear actions | P2 | ❌ Not started | Upload Retrospective File, Download Retrospective Template, Fill Retrospective in App. |
| RETRO-03 | Design three-card layout | P2 | ❌ Not started | Left: Upload Retro File; Middle: Download Template; Right: Fill in App. Each card explains when to use it. |
| RETRO-04 | Support retrospective file upload | P2 | ❌ Not started | CSV, XLSX, XLS, Markdown, plain text. |
| RETRO-05 | Define supported columns | P2 | ❌ Not started | Sprint Name, Team Name, Date, What Went Well, What Did Not Go Well, Blockers, Root Cause, Action Item, Owner, Due Date, Priority, Category, Status, Notes. |
| RETRO-06 | Validate file structure | P2 | ❌ Not started | Required headers present or mappable. |
| RETRO-07 | Detect missing required fields | P2 | ❌ Not started | Sprint Name plus at least one observation/action item. |
| RETRO-08 | Show preview before import | P2 | ❌ Not started | User can cancel before import. |
| RETRO-09 | Allow column mapping if names differ | P2 | ❌ Not started | User-friendly mapping UI. |
| RETRO-10 | Parse retro data | P2 | ❌ Not started | Handle invalid rows and show clear row-level errors. |
| RETRO-11 | Generate Retrospective Insights | P2 | ❌ Not started | Summary, themes, repeated problems, root cause patterns. |
| RETRO-12 | Generate improvement TODO list | P2 | ❌ Not started | Action items, owners, due dates, priorities, status. |
| RETRO-13 | Generate suggested next sprint actions | P2 | ❌ Not started | Ceremony-linked suggestions with expected benefit. |
| RETRO-14 | Link retro items to delivery metrics where possible | P2 | ❌ Not started | Example: carryover/blocked ratio/scope change linked to retro theme. |
| RETRO-15 | Save retrospective record if persistence is available | P2 | ❌ Not started | Save source, insights, actions, draft/final state. |
| RETRO-16 | Add `Download Retrospective Template` button | P2 | ❌ Not started | Locations: `/retro`, Upload page, Dashboard Retro section, Help Guide/System Tour. |
| RETRO-17 | Generate `.xlsx` template | P2 | ❌ Not started | Preferred: `Retrospective_Template.xlsx`. |
| RETRO-18 | Add optional `.csv` template | P2 | ❌ Not started | Nice-to-have. |
| RETRO-19 | Add optional `.md` template | P2 | ❌ Not started | Nice-to-have. |
| RETRO-20 | Add required template columns | P2 | ❌ Not started | Sprint Name required; Action Item required if improvement exists; Owner/Due Date recommended. |
| RETRO-21 | Add `Instructions` sheet to `.xlsx` | P2 | ❌ Not started | Explain how to fill, required fields, examples, usage, upload outcome, privacy note. |
| RETRO-22 | Add example rows to template | P2 | ❌ Not started | Carryover/large stories, blockers found late, scope changed mid-sprint. |
| RETRO-23 | Add `Fill Retrospective in App` / `Create Retrospective` button | P2 | ❌ Not started | Clear CTA. |
| RETRO-24 | Build Retro Context form section | P2 | ❌ Not started | Sprint Name, Team Name, Retro Date, Facilitator/Scrum Master, Sprint Goal, Sprint Goal Met Yes/No/Partially. |
| RETRO-25 | Build What Went Well section | P2 | ❌ Not started | Multiple entries: description, category, related metric optional. |
| RETRO-26 | Build What Did Not Go Well section | P2 | ❌ Not started | Multiple entries: description, impact, root cause, category. |
| RETRO-27 | Build Blockers/Impediments section | P2 | ❌ Not started | Description, owner, status, impact, suggested prevention. |
| RETRO-28 | Build Action Items section | P2 | ❌ Not started | Title, description, owner, due date, priority, status, related issue/metric optional. |
| RETRO-29 | Build Next Sprint Suggestions section | P2 | ❌ Not started | System-generated and manually added suggestions; priority, owner, ceremony, expected benefit. |
| RETRO-30 | Add save draft | P2 | ❌ Not started | If persistence is available. |
| RETRO-31 | Add submit final retrospective | P2 | ❌ Not started | Analysis triggers after submit. |
| RETRO-32 | Validate in-app form | P2 | ❌ Not started | Sprint Name, at least one observation/action, valid priority/date, missing owner/due date highlighted. |
| RETRO-33 | Detect duplicate action items | P2 | ❌ Not started | Flag duplicates before import/submit. |
| RETRO-34 | Identify common themes | P2 | ❌ Not started | Process, communication, requirements, QA/release, dependency, technical, planning. |
| RETRO-35 | Identify repeated blockers | P2 | ❌ Not started | Include repeated unresolved actions from previous retros if available. |
| RETRO-36 | Identify ownership gaps | P2 | ❌ Not started | Missing owners and missing due dates. |
| RETRO-37 | Create `RetrospectiveInsight` model/type | P2 | ❌ Not started | id, sprintName, team, source, themes, positives, painPoints, blockers, actionItems, nextSprintSuggestions, ceremonyRecommendations, risksIfIgnored, confidence. |
| RETRO-38 | Add tests | P2 | ❌ Not started | See TEST-RETRO. |
| RETRO-39 | Update all related product docs | P2 | ❌ Not started | SRS, BRD, Use Cases, User Journeys, Scenarios, Test Cases, Developer Guide, Release Notes, README, Appendix, TODO; Algorithm Spec/Technical Method if parsing logic added. |
| RETRO-40 | Produce product documentation impact matrix before push | P0/P2 | ❌ Not started | Required gate. |

---

## 18. P2 — Forecasting Progress and Delivery Adjustment Report

**Feature:** Forecasting Progress and Delivery Adjustment Report  
**Rule:** Forecasting must be conservative and explainable. Do not overpromise. Low data quality reduces confidence.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| FCAST-01 | Define `DeliveryForecast` type | P2 | ❌ Not started | forecastStatus, expectedCompletionDate, targetDate, confidence, remainingWork, requiredThroughput, currentThroughput, gapAnalysis, adjustmentOptions, chartData. |
| FCAST-02 | Calculate forecast status | P2 | ❌ Not started | on_track, at_risk, off_track, insufficient_data. |
| FCAST-03 | Calculate expected completion date | P2 | ❌ Not started | Based on throughput/velocity and remaining work. |
| FCAST-04 | Calculate confidence | P2 | ❌ Not started | Low/medium/high based on data quality, history, missing fields, volatility. |
| FCAST-05 | Calculate remaining work | P2 | ❌ Not started | Item count and story points if available. |
| FCAST-06 | Calculate required throughput | P2 | ❌ Not started | Items/day, SP/day, items/sprint, SP/sprint if applicable. |
| FCAST-07 | Calculate current throughput | P2 | ❌ Not started | Items/day, SP/day, items/sprint, SP/sprint if applicable. |
| FCAST-08 | Generate gap analysis | P2 | ❌ Not started | Throughput gap, scope risk, blocker risk, confidence reason. |
| FCAST-09 | Generate adjustment options | P2 | ❌ Not started | Reduce scope, remove blockers, increase capacity, reduce WIP, split work, improve refinement. |
| FCAST-10 | Generate chart data | P2 | ❌ Not started | date, planned, actual, forecast. |
| FCAST-11 | Add Planned vs Actual progress chart | P2 | ❌ Not started | Dashboard section. |
| FCAST-12 | Add forecast completion line chart | P2 | ❌ Not started | Dashboard section. |
| FCAST-13 | Add remaining work burn-up/burn-down | P2 | ❌ Not started | Dashboard section. |
| FCAST-14 | Add required vs current throughput chart | P2 | ❌ Not started | Dashboard section. |
| FCAST-15 | Add delivery risk trend | P2 | ❌ Not started | Dashboard section. |
| FCAST-16 | Add scope change trend | P2 | ❌ Not started | Dashboard section. |
| FCAST-17 | Add blocker impact chart | P2 | ❌ Not started | Dashboard section. |
| FCAST-18 | Add dashboard section `Forecasting & Delivery Adjustment` | P2 | ❌ Not started | Status card, expected completion, confidence badge, charts, weakest point, adjustments, executive summary, delivery manager action plan. |
| FCAST-19 | Answer “Are we on track?” | P2 | ❌ Not started | Must explain why. |
| FCAST-20 | Identify weakest delivery point | P2 | ❌ Not started | Throughput, blockers, scope, WIP, refinement, capacity, data quality. |
| FCAST-21 | Recommend adjustment to deliver on time | P2 | ❌ Not started | Scope/capacity/WIP/blockers/splitting/refinement/sprint goal renegotiation. |
| FCAST-22 | Handle insufficient data safely | P2 | ❌ Not started | Message: “Forecast confidence is low because the uploaded data is missing key fields or has limited historical delivery records.” |
| FCAST-23 | Use Data Quality Score and Metric Confidence Score | P2 | ❌ Not started | Must affect forecast confidence. |
| FCAST-24 | Add tests | P2 | ❌ Not started | See TEST-FCAST. |
| FCAST-25 | Update all related product docs | P2 | ❌ Not started | SRS, BRD, Use Cases, User Journeys, Scenarios, Test Cases, Developer Guide, Release Notes, README, Algorithm Spec, Technical Method, Appendix, TODO. |
| FCAST-26 | Produce product documentation impact matrix before push | P0/P2 | ❌ Not started | Required gate. |

---

## 19. P2 — Architecture / Planning Track

Do not implement PostgreSQL, CI/CD, or expanded gateway routing without explicit approval.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| ARCH-01 | CI/CD design with GitHub Actions | P2 | ❌ Not started | Pipeline stages: lint, test, build, Docker image, deploy; branch/PR gates; secrets handling; design doc only. |
| ARCH-02 | PostgreSQL migration assessment | P2 | ❌ Not started | Feasibility, Prisma schema diff, migration strategy, rollback plan, performance comparison; assessment only. |
| ARCH-03 | Load-balancer-aware gateway expansion design | P2 | ❌ Not started | round_robin, weighted_round_robin, failover, least_error_rate; depends on GW foundation. |
| ARCH-04 | Advanced notification architecture | P2 | ❌ Not started | Plan only; P4 implementation not approved. |
| ARCH-05 | Jira API read-only architecture | P2/P0 | ❌ Not started | Must include auth model, API scope, field mapping, refresh, storage tables/files, failure modes, export fallback. |
| ARCH-06 | Storage provider architecture refinement | P2 | 🔍 Needs verification | Confirm current implementation and future replication needs. |
| ARCH-07 | Deployment guide update for Vercel / Docker / VPS | P2 | 🔍 Needs verification | Verify existing docs; update if behind. |
| ARCH-08 | System health/admin diagnostics page | P2 | 🔍 Needs verification | Check implementation and docs. |
| ARCH-09 | Branding integration across login, favicon, reports, and exports | P2 | 🔍 Needs verification | Align with Delivery Clarity branding bundle if approved. |
| ARCH-10 | Landing page inside app | P2 | 🔍 Needs verification | Verify status and docs. |
| ARCH-11 | Audit Charts page KPI chips and truncated values | P2 | ✅ Done / Needs traceability | Uploaded TODO says done. Verify traceability. |

---

## 20. P3 — Future Full External Integrations

Do not implement until P2 design is documented and reviewed.

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| FUT-JIRA-01 | Full Jira API read integration | P3 | 🚫 Blocked | Start only after Jira gates and design doc are complete. |
| FUT-JIRA-02 | Jira write-back / ticket creation from system suggestions | P3 | ❌ Not started | Requires safe approval workflow, backlog selection, audit, rollback/failure handling. |
| FUT-JIRA-03 | Jira OAuth support | P3 | ❌ Not started | Requires security design. |
| FUT-CLOUD-01 | Full enterprise cloud integration | P3 | 🔍 Partly done / future refinement | Local/S3/Azure/GCP provider support exists per uploaded TODO; future may include multi-provider replication. |
| FUT-POSTGRES-01 | PostgreSQL production migration | P3 | 🚫 Blocked | Do not start until P2 migration assessment is approved. |
| FUT-CICD-01 | Full CI/CD deployment automation | P3 | 🚫 Blocked | Do not start until P2 GitHub Actions design is approved. |
| FUT-MULTI-01 | Advanced multi-node deployment | P3 | 🚫 Blocked | Requires load-balanced gateway and shared persistence design. |

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
| TEST-GW-01 | Safe configured endpoint allowed | P1 | ❌ Not started | Unit test. |
| TEST-GW-02 | Unsafe protocol blocked | P1 | ❌ Not started | Unit test. |
| TEST-GW-03 | Disallowed host blocked | P1 | ❌ Not started | Unit test. |
| TEST-GW-04 | Private/internal IP blocked in production | P1 | ❌ Not started | SSRF protection test. |
| TEST-GW-05 | Timeout applied | P1 | ❌ Not started | Unit test. |
| TEST-GW-06 | Retry policy applied for retryable errors | P1 | ❌ Not started | 408/429/500/502/503/504. |
| TEST-GW-07 | Non-retryable errors are not retried | P1 | ❌ Not started | 400/401/403/404/409/422. |
| TEST-GW-08 | Secrets redacted in logs | P1 | ❌ Not started | Token/API key/cookie/password redaction. |
| TEST-GW-09 | Audit event created | P1 | ❌ Not started | requestId/userId/provider/operation/duration/status/retry count. |
| TEST-GW-10 | Consistent `GatewayResult` returned | P1 | ❌ Not started | Success/error shape. |
| TEST-GW-11 | Provider registry supported | P1 | ❌ Not started | provider enum and lookup. |
| TEST-GW-12 | No secrets exposed to client | P1 | ❌ Not started | API response/client boundary test. |

### User Add-Member Request Tests

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TEST-REQ-01 | Anonymous user cannot submit request | P1 | ❌ Not started | Auth guard. |
| TEST-REQ-02 | Logged-in user submits request | P1 | ❌ Not started | Happy path. |
| TEST-REQ-03 | Invalid email rejected | P1 | ❌ Not started | Validation. |
| TEST-REQ-04 | Missing reason rejected | P1 | ❌ Not started | Validation. |
| TEST-REQ-05 | Duplicate email prevented/warned | P1 | ❌ Not started | No duplicate accounts. |
| TEST-REQ-06 | Admin sees pending request | P1 | ❌ Not started | Queue/badge/card. |
| TEST-REQ-07 | Admin accepts request | P1 | ❌ Not started | Creates user and updates status. |
| TEST-REQ-08 | Admin rejects request | P1 | ❌ Not started | Does not create user. |
| TEST-REQ-09 | Requester gets accepted notification | P1 | ❌ Not started | In-app notification. |
| TEST-REQ-10 | Requester gets rejected notification | P1 | ❌ Not started | In-app notification. |
| TEST-REQ-11 | High-privilege role warning | P1 | ❌ Not started | Admin/C-level. |
| TEST-REQ-12 | Two admins cannot double-accept same request | P1 | ❌ Not started | Transaction/concurrency. |
| TEST-REQ-13 | Audit event created | P1 | ❌ Not started | Submit/accept/reject. |
| TEST-REQ-14 | Mobile layout works | P1 | ❌ Not started | Responsive UI. |

### Role-Based Coaching Tests

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TEST-RBC-01 | Suggestions generated per role | P1 | ❌ Not started | Scrum Master, PO, EM, DM, C-level, Team Lead, Admin. |
| TEST-RBC-02 | Suggestions differ by role | P1 | ❌ Not started | Role responsibility matters. |
| TEST-RBC-03 | Suggestions include metric evidence | P1 | ❌ Not started | No generic advice. |
| TEST-RBC-04 | Weak points identified | P1 | ❌ Not started | Evidence-based. |
| TEST-RBC-05 | Ceremony advice included | P1 | ❌ Not started | Daily/refinement/planning/review/retro. |
| TEST-RBC-06 | Prevention advice included | P1 | ❌ Not started | What could have prevented situation. |
| TEST-RBC-07 | Next-sprint suggestions included | P1 | ❌ Not started | Actionable. |
| TEST-RBC-08 | Low data quality reduces confidence | P1 | ❌ Not started | Confidence logic. |
| TEST-RBC-09 | Missing metrics produce safe fallback | P1 | ❌ Not started | No hallucinated certainty. |

### Retrospective Tests

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TEST-RETRO-01 | Retro file upload works | P2 | ❌ Not started | CSV/XLSX/XLS/Markdown/plain text. |
| TEST-RETRO-02 | Invalid retro file handled | P2 | ❌ Not started | Clear error. |
| TEST-RETRO-03 | Retrospective template downloads successfully | P2 | ❌ Not started | `.xlsx` first. |
| TEST-RETRO-04 | Template includes expected columns | P2 | ❌ Not started | All specified columns. |
| TEST-RETRO-05 | Template includes Instructions sheet | P2 | ❌ Not started | How to fill, required fields, examples, privacy note. |
| TEST-RETRO-06 | Template includes example rows | P2 | ❌ Not started | Carryover, blockers, scope change examples. |
| TEST-RETRO-07 | Completed template upload works | P2 | ❌ Not started | Parse and import. |
| TEST-RETRO-08 | Upload preview works | P2 | ❌ Not started | Before import. |
| TEST-RETRO-09 | Column mapping works when names differ | P2 | ❌ Not started | Mapping UI. |
| TEST-RETRO-10 | In-app retrospective form opens | P2 | ❌ Not started | UI. |
| TEST-RETRO-11 | In-app retrospective form validates required fields | P2 | ❌ Not started | Sprint Name + observation/action. |
| TEST-RETRO-12 | Draft save works if persistence exists | P2 | ❌ Not started | Optional based on persistence. |
| TEST-RETRO-13 | Themes extracted | P2 | ❌ Not started | Insight generation. |
| TEST-RETRO-14 | Action items extracted | P2 | ❌ Not started | Improvement backlog. |
| TEST-RETRO-15 | Missing owner identified | P2 | ❌ Not started | Owner gap. |
| TEST-RETRO-16 | Missing due date identified | P2 | ❌ Not started | Due date gap. |
| TEST-RETRO-17 | Duplicate action items flagged | P2 | ❌ Not started | Duplicate detection. |
| TEST-RETRO-18 | Suggested TODO created | P2 | ❌ Not started | Next sprint improvement list. |
| TEST-RETRO-19 | Next sprint suggestions generated | P2 | ❌ Not started | Ceremony and improvement advice. |
| TEST-RETRO-20 | Retro insights linked to metrics when possible | P2 | ❌ Not started | Evidence linkage. |

### Forecasting Tests

| ID | Task | Priority | Status | Details / Acceptance Criteria |
|---|---|---:|---|---|
| TEST-FCAST-01 | Forecast calculates on-track / at-risk / off-track | P2 | ❌ Not started | Core status. |
| TEST-FCAST-02 | Forecast handles insufficient data | P2 | ❌ Not started | Low-confidence safe message. |
| TEST-FCAST-03 | Forecast uses current throughput | P2 | ❌ Not started | Items/SP/day/sprint. |
| TEST-FCAST-04 | Forecast compares required vs current throughput | P2 | ❌ Not started | Gap analysis. |
| TEST-FCAST-05 | Forecast shows confidence | P2 | ❌ Not started | Low/medium/high. |
| TEST-FCAST-06 | Forecast explains confidence | P2 | ❌ Not started | Reason, not just badge. |
| TEST-FCAST-07 | Forecast chart data is generated | P2 | ❌ Not started | planned/actual/forecast data. |
| TEST-FCAST-08 | Adjustment suggestions are generated | P2 | ❌ Not started | Scope, blockers, capacity, WIP, splitting, refinement. |
| TEST-FCAST-09 | Data Quality Score affects forecast confidence | P2 | ❌ Not started | Confidence downgrade. |

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
| 19 | Push only if no product file is behind code | P0 | 🚫 Blocked until matrix is done |
| 20 | If P0 is clean, implement Backend Integration Gateway | P1 | ❌ Not started |
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
| NEXT-01 | Complete `TRACE-01` full traceability matrix | P0 | ❌ Not started | This is the main blocker before new P1/P2 development. |
| NEXT-02 | Complete `TRACE-02` full app coverage validation | P0 | ❌ Not started | This was missing from the uploaded TODO and is required by the master prompt. |
| NEXT-03 | Produce actual product documentation impact matrix | P0 | ❌ Not started | The template exists, but the filled matrix must be produced before push. |
| NEXT-04 | Verify storage docs and open storage gates | P0 | 🔍 Needs verification | JIRA-GATE-03/04/05/07 remain open and must be considered before Jira integration. |
| NEXT-05 | Re-run lint/test/build and update normalized test count | P0 | 🔍 Needs verification | Uploaded TODO says 469/48; must be current. |
| NEXT-06 | Then begin HARD-01 Backend Integration Gateway if P0 is clean | P1 | 🚫 Blocked | Depends on P0 closure. |

---

## 27. Release Status Recommendation

Current uploaded TODO says: `v4.2.2 — Release Candidate` and “P0 reconciliation pass complete.”

Recommended corrected status:

> `v4.2.2 — Release Candidate Candidate / P0 Mostly Reconciled`  
> Lint/test/build were reported passing in the uploaded TODO, but the P0 gate is not fully closed because the full traceability matrix (`TRACE-01`), full app coverage validation (`TRACE-02`), and filled product documentation impact matrix are still not complete. Do not start HARD-01, HARD-02, HARD-03, RETRO, or Forecasting work until those P0 items are closed.

---

*Delivery Clarity — Ali Delivery Intelligence — Master TODO aligned with the full Claude prompt and corrected with missing prompt details.*
