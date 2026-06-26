# Delivery Clarity — Business Requirements Document

---

## Document Control

| Field | Detail |
|---|---|
| **Document Title** | Delivery Clarity — Business Requirements Document |
| **Version** | 4.9.2 |
| **Date** | 2026-06-16 |
| **Author** | Ali Abu Ras |
| **Status** | Approved — reconciled with v4.9.2 (P0 pass 2026-06-16: navigation architecture overhaul, admin layout injection, developer wiki theme, frontend standards enforced; test suite 571/63 all passing; lint and build clean) |
| **Classification** | Internal |

### Revision History

| Version | Date | Author | Description |
|---|---|---|---|
| 0.1 | 2026-04-10 | Ali Abu Ras | Initial draft — scope and objectives |
| 0.2 | 2026-04-28 | Ali Abu Ras | Added business requirements BR-001–BR-020, personas |
| 0.3 | 2026-05-12 | Ali Abu Ras | Expanded dashboard sections, business rules, risk register |
| 0.4 | 2026-05-22 | Ali Abu Ras | Incorporated roadmap items into Future Scope; added glossary |
| 1.0 | 2026-05-30 | Ali Abu Ras | Final review, all sections complete — approved for development baseline |
| 4.0 | 2026-06-03 | Ali Abu Ras | v4 Quality & Trust Layer; scope updated; auth and database now in scope; BR-070–BR-090 added |
| 4.9.2 | 2026-06-16 | Ali Abu Ras | P0 doc pass: navigation architecture overhaul (11 routed dashboard pages, DashboardTopbar, AdminNavSidebar, developer wiki, DC shell library, unified DC_NAV_GROUPS, frontend standards enforced) reflected in scope and capabilities |

---

## 1. Executive Summary

Engineering teams operating in modern agile environments generate enormous volumes of tracking data inside Jira, yet the act of extracting meaningful delivery intelligence from that data remains slow, inconsistent, and heavily manual. Engineering managers and scrum masters routinely spend 30–60 minutes before each sprint review or stakeholder meeting exporting data, writing formulas in spreadsheets, and composing narrative summaries — work that is error-prone, repetitive, and impossible to standardise across teams. The result is that delivery health is often reported too late, surface-level, and without the analytical depth needed to drive corrective action.

Delivery Clarity solves this problem by transforming any standard Jira CSV or Excel export into a comprehensive, multi-dimensional delivery health dashboard in seconds — no Jira login, no configuration, no standing infrastructure beyond a self-hosted Node.js server. Teams upload once and receive an immediately actionable view of sprint health, flow efficiency, risk signals, capacity distribution, epic readiness, and a predictive completion estimate, together with auto-generated action items and a manager-ready executive report.

**Product in one sentence:** Delivery Clarity is a self-hosted Jira analytics platform that converts a raw Jira export into a full delivery intelligence dashboard — including a scored health index, smart recommendations, and an executive quick-overview report — in under five seconds.

**Strategic fit:** Delivery Clarity aligns with the organisational objective of reducing delivery risk visibility lag. By making accurate, consistent delivery health data available to every engineering manager and scrum master on demand, the platform supports faster escalation of risks, better sprint planning decisions, and more credible stakeholder communication — without requiring any changes to existing Jira configuration or procurement of additional SaaS tooling.

---

## 2. Business Context

### Current Pain Points Without the Tool

Without Delivery Clarity, engineering managers and scrum masters must manually export data from Jira, load it into Excel or Google Sheets, manually classify issues, hand-calculate cycle times, and write narrative summaries for stakeholder updates. This process has the following measurable costs and failure modes:

- **Time cost:** Preparing a sprint health report takes 30–90 minutes per sprint cycle per team. Across an organisation with eight engineering teams, this represents up to 12 hours of senior engineering time per week consumed by data wrangling rather than decision-making.
- **Inconsistency:** Different managers use different spreadsheet templates and different definitions for terms like "cycle time," "blocked," and "at risk." This makes cross-team health comparisons unreliable.
- **Latency:** Risks are often identified only at sprint review, two weeks after they emerged. A blocked item sitting untouched for ten days may not surface until it has already delayed a release.
- **Error rate:** Manual formula construction in spreadsheets introduces calculation errors. Misclassified statuses, stale filters, and incorrect date references result in inaccurate health signals being reported to leadership.
- **Insight shallowness:** Manual analysis rarely goes beyond completion percentage. Flow efficiency, orphan items, capacity imbalance, and predictive completion estimates are typically absent from manually produced reports.
- **Stakeholder communication friction:** Translating raw metrics into an executive-ready narrative requires additional writing effort. Many teams skip this step entirely, presenting raw data to stakeholders who lack context to interpret it.

### Market Opportunity

The market for agile delivery intelligence tooling is large and growing. Commercial platforms such as LinearB, Jellyfish, Waydev, and Atlassian's own Analytics add-on charge significant per-seat fees and require persistent Jira OAuth integrations, posing both cost and security barriers for smaller engineering organisations or teams operating in regulated environments where third-party Jira access is restricted. Delivery Clarity occupies the underserved self-hosted, zero-credential niche — delivering comparable analytical depth at zero recurring cost, with full data sovereignty.

For organisations with existing Jira licences who cannot or will not grant third-party API access to their project management system, Delivery Clarity provides a compelling alternative that requires no change to existing security posture.

### Project Initiation

This project was initiated by the engineering leadership function in response to recurring feedback from scrum masters and engineering managers that sprint health reporting was consuming disproportionate preparation time and producing inconsistent outputs. A secondary driver was the need to provide executive stakeholders with a standardised, credible delivery health signal across multiple teams without requiring those stakeholders to interpret raw Jira boards or backlogs directly. The project was authorised as an internal tooling investment with the goal of reclaiming senior engineering time and improving delivery risk detection latency.

---

## 3. Stakeholders

| Role | Name / Title | Interest | Influence |
|---|---|---|---|
| **Engineering Manager** | Engineering Manager (primary user) | Wants fast, accurate delivery health visibility for their team; needs manager reports ready for stakeholder updates without manual effort | High |
| **Scrum Master** | Scrum Master / Agile Coach | Wants to identify blockers, stale work, and sprint completion risks before ceremonies; needs flow efficiency and cycle time data | High |
| **Product Owner** | Product Owner | Wants to understand epic readiness, release risk, and completion predictions to manage stakeholder expectations | High |
| **CTO / Engineering Director** | Director of Engineering / CTO | Wants cross-team delivery health at a glance; needs executive-ready summaries without digging into individual Jira boards | High |
| **Team Lead** | Senior Engineer / Tech Lead | Wants to understand capacity distribution and identify overloaded team members; interested in orphan items and blocked work | Medium |
| **Developer** | Individual Contributor | May use the tool to understand their own work health, cycle times, or sprint context; generally a secondary user | Low |
| **Business Analyst** | Business Analyst / Delivery Manager | Wants accurate reporting to support governance, programme reviews, and release readiness gates | Medium |
| **Platform / DevOps** | Infrastructure / Platform Engineer | Responsible for deploying and maintaining the self-hosted service; interested in operational simplicity and security posture | Medium |

---

## 4. Business Objectives

The following objectives are specific, measurable, achievable, relevant, and time-bound (SMART). All baselines are measured at the point of first production deployment.

**BO-01 — Reduce report preparation time by 80% within 90 days of deployment.**
Success criterion: Engineering managers and scrum masters report spending fewer than 10 minutes preparing a sprint health update, compared to a baseline of 45–60 minutes. Measured via team survey at 30-day and 90-day post-deployment checkpoints.

**BO-02 — Standardise health classification definitions across all teams within 60 days.**
Success criterion: All engineering teams using Delivery Clarity use the same health score formula, cycle time definition, and risk classification thresholds. Zero divergence in metric definitions detectable via cross-team audit at 60-day mark.

**BO-03 — Reduce average delivery risk detection latency from 14 days to 3 days within one quarter.**
Success criterion: Blocked items, stale active work, and overdue issues are surfaced in the Smart Recommendations panel within 24 hours of their health threshold being breached (dependent on upload frequency). Teams commit to uploading exports at least three times per week.

**BO-04 — Enable executive stakeholders to self-serve delivery health without engineering mediation within 30 days.**
Success criterion: At least 70% of recurring executive delivery status requests are satisfied by Manager Quick Overview reports generated in Delivery Clarity, without requiring a separate slide deck or email from an engineering manager. Measured by reduction in ad hoc "what is the status?" Slack/email requests.

**BO-05 — Achieve a system processing time of under 5 seconds for any valid Jira export up to 20 MB.**
Success criterion: 95th-percentile upload-to-dashboard render time is below 5 seconds for exports containing up to 1,000 issues, measured in production over a 30-day period.

**BO-06 — Attain adoption across at least 5 engineering teams within the first 6 months.**
Success criterion: At least 5 distinct teams each record a minimum of 10 uploads within 6 months of deployment, as evidenced by the import audit log.

**BO-07 — Deliver a net promoter score (NPS) of 40 or higher among primary users within 6 months.**
Success criterion: Internal NPS survey administered at the 6-month mark records a score of 40 or above, with at least 15 respondents across the Engineering Manager and Scrum Master roles.

---

## 5. Business Problem Statement

### Problem Description

Engineering organisations that use Jira as their primary project management tool accumulate rich delivery data across thousands of issues, sprints, epics, and assignments. However, Jira itself does not provide integrated delivery health analytics. Its built-in reports (velocity chart, burndown, cumulative flow) are narrow in scope, require active board configuration, and do not synthesise multiple signals into a single health index. Advanced Analytics (the Jira premium add-on) offers richer reporting but requires a specific Jira plan tier and does not support self-hosted, offline, or export-based workflows.

The practical consequence is that the people most responsible for delivery outcomes — engineering managers, scrum masters, and product owners — are forced to become part-time data analysts every sprint cycle. They export data, build and maintain spreadsheet templates, manually identify patterns, and translate findings into stakeholder-readable narratives. This is not a minor inconvenience; it is a structural tax on senior delivery capacity that accumulates to dozens of hours per team per quarter.

Beyond the time cost, the manual approach introduces systematic blind spots. Cycle time gaps (items waiting in backlog for weeks before being started), capacity imbalance (one assignee holding 40% of all open work), and orphan items (issues with no epic or parent link that will never surface in roadmap reporting) are rarely detected in manual spreadsheet analysis because they require cross-cutting queries that are difficult to construct ad hoc. By the time these issues are noticed — typically at a retrospective or during a programme review — they have already contributed to delivery delays or reporting inaccuracies.

### Impact

The impact of this problem is felt at three levels:

1. **Team level:** Scrum masters and managers spend time on mechanical data work instead of coaching, risk mitigation, and process improvement. Sprint reviews are less informed, and corrective actions are raised too late to change outcomes.

2. **Programme level:** Cross-team delivery health is difficult to assess consistently. Programme managers and directors must aggregate ad hoc reports from multiple teams, each using different templates and definitions, producing a mosaic of incompatible data.

3. **Stakeholder level:** Executives and product leadership receive delivery status updates that are inconsistent in format, variable in depth, and often delayed. This erodes confidence in engineering's ability to forecast accurately and communicate transparently.

### Urgency

The urgency of this problem is increasing as engineering organisations scale. Each additional team added to the portfolio multiplies the reporting burden. Delivery Clarity addresses this urgency by providing a zero-configuration, instant-analysis tool that any team can adopt without IT procurement, Jira reconfiguration, or infrastructure change. The self-hosted model means the tool can be deployed and in active use within hours of a decision to proceed.

---

## 6. Scope

### In Scope — v1.0 Historical Baseline (superseded by v4.0 section below)

> This subsection is preserved as a historical record of the original v1.0 baseline scope (pre-authentication, single-user). It no longer reflects the current product — see "In Scope (v4.0 — Current)" immediately below for the authoritative current scope, which supersedes every "v1.0" assumption in this subsection (in particular, authentication, multi-user roles, and historical comparison are now implemented and in scope).

The following capabilities were in scope for the original v1.0 release of Delivery Clarity:

- File upload and parsing: CSV, XLSX, and XLS Jira export files up to 20 MB, with 55+ column header aliases for automatic field normalisation
- Backend validation of required fields (Issue Key, Issue Type, Summary, Status) with specific error messages on failure
- Full metrics calculation pipeline executed server-side in memory on each upload, covering all metrics described in this document
- Delivery Health Score calculation (0–100 composite index) with band labelling
- Smart Recommendations: up to 5 auto-generated, prioritised action cards surfaced client-side
- Predictive completion estimate based on historical velocity
- Manager Quick Overview modal: 8-cell snapshot grid, 7 report rows with deep-links, print mode
- All 16 named dashboard sections as specified in Section 7 of this document
- Interactive Help guide with 17 animated journeys
- Floating section navigator with 14 colour-coded dots tracking the active section
- Dark mode with system preference detection and manual toggle
- Mobile responsiveness down to 375 px viewport width
- Print mode with clean print styles
- Rate limiting: 20 requests per 15-minute window per IP
- Import audit log persisted to `backend/data/import-logs.json`
- Backend control centre at port 4000: import history, field statistics, Excel download
- Detail panel modal for deep-dive into individual issue sets
- Flow Health table with 11 filters and show-more pagination
- Quick filter bar with five preset filter modes
- Export risk report as CSV download

### In Scope (v4.0 — Current)

The following capabilities are implemented and in scope as of v4.0:

- File upload and parsing (CSV/XLSX/XLS, max 20 MB, multi-file merge up to 10 files)
- Metrics calculation pipeline covering all delivery dimensions
- Delivery Health Score (0–100), smart recommendations, executive summary
- **User authentication** — login, register, profile, role management (user/admin)
- **Multi-user sessions** — iron-session HTTP-only cookies, session TTL configurable
- **SQLite database persistence** via Prisma 5 — User, ImportLog, DashboardSnapshot, AuditEvent
- **Role-based access control** — admin users see all import logs, access admin pages
- **Data Quality Score** and Metric Confidence Score
- **Missing-column impact explanation**
- **Column-mapping preview** before dashboard generation
- **Saved dashboard snapshots** and **snapshot comparison**
- **Upload-to-upload trend analysis** and "What changed?" panel
- **Configurable health thresholds** and orphan detection rules
- **Recommendation mute/snooze**
- **Customer View** (`/customer`) — stakeholder-facing summary
- **Role-based dashboard views** — 5 curated presets
- **Release Readiness checklist** (`/readiness`)
- **Database backup and restore**
- **Production security checklist** (`/admin/security`)
- **Docker deployment** — Dockerfile + docker-compose
- **Privacy and data-retention controls**
- F1 Throughput Analytics, F2 Work Item Explorer, F3 Auth & Database, F4 Smart Excel Export
- Mobile responsiveness including `/explore` mobile polish
- Performance optimised for 5,000+ issues

### Out of Scope (v4.0 — Not Yet Implemented)

- Real-time Jira API integration or OAuth authentication with Jira (P3 roadmap)
- Scheduled email or Slack report delivery (P4 roadmap)
- Native mobile application (iOS or Android)
- In-app Notification Center (P4 roadmap)
- Maintenance Mode (P4 roadmap)
- Jira write-back or ticket creation (P3 roadmap)
- AI-generated narrative via external LLM API (unscheduled)

### P1 — Done / Verified (shipped in v4.2.x)

- Calculation Reference clearly visible in `/developer` blue side menu (P1.1) — Done, Verified
- Clear Local Data — Admin window + Upload page with detection, warning, confirmation (P1.2) — Done, Verified
- Dashboard Section Show/Hide controls — Overview/Single/Full modes, smooth scroll, animation (P1.3) — Done, Verified

### Future Scope (P2/P3/P4 Roadmap)

- **Done** Admin Storage & Backup (Local, S3/S3-compatible, Azure Blob, Google Cloud Storage) — implemented with bucket-first restore, push-on-change, and local fallback
- **P2/P3** Optional Jira API Integration — read-only; export-first model remains default
- **P4** Admin & System Notification Center — in-app notifications, admin-to-user messaging
- **P4** Maintenance Mode — admin-controlled maintenance screen with audit log
- **Done** Role-Based Delivery Coaching Insights (v4.10.0) — `/dashboard/coaching`, evidence-cited per-role advice generated entirely from existing metrics, no new calculations

---

## 7. Business Requirements

Requirements are assigned a priority of **Must** (required for v1.0 launch), **Should** (high value, included if feasible), or **Could** (desirable, may be deferred).

| ID | Requirement | Priority | Source |
|---|---|---|---|
| **BR-001** | The system must accept file uploads in CSV, XLSX, and XLS formats via a multipart/form-data POST request to `/api/upload`. | Must | Engineering Manager |
| **BR-002** | The system must reject files larger than 20 MB and return HTTP 413 with a user-readable error message. | Must | Platform/Security |
| **BR-003** | The system must normalise Jira column headers against a library of 55 or more known field aliases, enabling exports from different Jira configurations to be parsed without manual column mapping. | Must | Scrum Master |
| **BR-004** | The system must validate the presence of Issue Key, Issue Type, Summary, and Status fields and return HTTP 422 with specific field-level error messages if any are missing. | Must | Engineering Manager |
| **BR-005** | The system must compute the full metrics payload for a valid 500-issue export in under 500 milliseconds on the server side (synchronous calculation). | Must | Engineering Manager |
| **BR-006** | The system must calculate and return a Delivery Health Score as a single integer between 0 and 100, using the weighted formula defined in Business Rule BIZ-001, and categorise it into one of five named bands. | Must | Engineering Manager / Director |
| **BR-007** | The system must generate up to five Smart Recommendation action cards, ranked by priority, covering: blocked critical items, stale active work, capacity imbalance, orphan items, critical epics, and explicitly blocked-by-link items. | Must | Scrum Master |
| **BR-008** | The system must calculate a predictive completion estimate (days remaining and projected date) from issue velocity when sufficient date data is available, and display it as the fourth delta card in the Summary bar. | Should | Engineering Manager |
| **BR-009** | The system must display a Manager Quick Overview modal containing a health banner, an 8-cell snapshot grid covering key delivery metrics, and 7 report rows each with a deep-link to the relevant dashboard section. | Must | Director / Engineering Manager |
| **BR-010** | The Manager Quick Overview must include a print action that triggers a clean browser print layout, hiding all interactive elements. | Must | Director |
| **BR-011** | The system must render a Summary bar (`#dashboard-summary`) displaying: overall health status, target vs actual comparison, completion/risk/cycle/prediction delta cards, Quick Overview button, Review high-risk items button, Export risk report button, and Save layout button. | Must | Engineering Manager |
| **BR-012** | The system must provide a sticky filter bar with five quick filter preset modes (All, High Risk, Blocked, Needs Review, Sprint Today) and a Clear action that resets all filters simultaneously. | Should | Scrum Master |
| **BR-013** | The system must display an Attention strip (`#section-attention`) showing the top three items from each of the following categories: blockers, overdue items, and orphan items. | Must | Scrum Master |
| **BR-014** | The system must render a KPI grid (`#section-overview`) with six KPI cards: Completion %, Health Alerts, Active Work, Lead Time, Cycle Time, and Story Points. Each card must be clickable, scrolling to the relevant detailed dashboard section. | Must | Engineering Manager |
| **BR-015** | The system must render a charts section (`#section-visuals`) containing: a Health Mix donut chart, a Quarter Progress bar chart, a Work State distribution chart, a Kanban distribution chart, a Sprint Comparison chart, and an Orphan Items indicator. | Must | Engineering Manager |
| **BR-016** | The system must render a Delivery Composition ring (`#section-ratios`) that classifies every issue into exactly one of five segments — Done, In Progress, At Risk, Critical, or Backlog — with no double-counting, using the priority order defined in Business Rule BIZ-004. | Must | Engineering Manager |
| **BR-017** | The system must render a Delivery Controls panel (`#section-delivery-controls`) displaying: Flow Efficiency, Story Point Delivery, and a Risk Readout panel. | Must | Scrum Master |
| **BR-018** | The system must render a Quarter Statistics section (`#section-quarters`) showing throughput, completion rate, lead time, cycle time, and top statuses per quarter, sorted by quarter descending. | Should | Engineering Manager |
| **BR-019** | The system must render a Kanban Status Health section (`#section-kanban`) showing volume, health counts, and timing data per workflow status, supported by a donut chart, bar chart, and metric table. | Must | Scrum Master |
| **BR-020** | The system must render a Sprint Status section (`#section-sprint`) showing velocity, completion rate, and story points delivered per sprint, including up to 8 sprints sorted by completed points descending. | Must | Engineering Manager |
| **BR-021** | The system must render an Ownership section (`#section-ownership`) with two sub-panels: Capacity By Assignee (top 10 by issue count) and Epic / Parent Performance (top 10 epics by issue count), including load share percentages and orphan detection. | Must | Engineering Manager |
| **BR-022** | The system must render a Labels and Classification section (`#section-labels`) displaying: label distribution (top 15), issue type breakdown, label health and completion table, and conditionally a parent key breakdown and project breakdown when data is present. | Should | Product Owner |
| **BR-023** | The system must render a Relations section (`#section-relations`) displaying: link type distribution, the top 10 most-connected items, and a table of items explicitly blocked by inward blocking links, when issue link columns are present in the export. | Should | Scrum Master |
| **BR-024** | The system must render a Readiness section (`#section-readiness`) displaying: the top at-risk epics with a View Items action, and dependency callouts derived from the relations analysis. | Must | Product Owner |
| **BR-025** | The system must render a Justification panel containing a plain-language delivery narrative generated from all computed health signals. | Should | Director |
| **BR-026** | The system must render a Story / Task Flow Health panel (`#flow-health-panel`) as a collapsible section containing a filterable, paginated table of all issues with 11 independent filter controls: key, summary, status, sprint, assignee, lead time maximum, cycle time maximum, open age maximum, health, reason, and labels. | Must | Scrum Master / Engineering Manager |
| **BR-027** | The Flow Health table must paginate results at 100 items per page with a "Show N more" button, and must show the first 100 items by default. | Should | Engineering Manager |
| **BR-028** | The system must provide a floating section navigator (`SectionNav`) on the right edge of the viewport with 14 colour-coded dots corresponding to each named dashboard section, tracking and highlighting the currently visible section as the user scrolls. | Must | All Users |
| **BR-029** | The system must provide an interactive Help guide with at least 17 animated journeys (4–6 steps each), accessible from help buttons on every major section header, supporting keyboard arrow navigation. | Should | New Users |
| **BR-030** | The system must support dark mode, detecting the user's system colour-scheme preference on initial load and providing a manual toggle. | Should | All Users |
| **BR-031** | The system must be fully functional and visually coherent on viewport widths down to 375 px, with iOS safe-area insets applied to all modals. | Must | All Users |
| **BR-032** | The system must apply a rate limit of 20 upload requests per 15-minute window per IP address, returning HTTP 429 when exceeded. | Must | Platform/Security |
| **BR-033** | The system must persist an import audit log to `backend/data/import-logs.json` recording file details, status, column statistics, and row counts for every upload. | Should | Platform |
| **BR-034** | The system must expose a backend control centre at the backend root URL showing all past imports with status, file details, column statistics, and a link to download import history as XLSX. | Should | Platform |
| **BR-035** | The system must provide a Detail panel modal accessible from the Readiness section and the high-risk items action, displaying individual issue data with optional deep-link to the originating Jira issue URL and a clipboard copy action per item. | Must | Scrum Master / Engineering Manager |
| **BR-036** | The system must allow the user to export a CSV risk report of all issues classified as critical or warning, downloadable from the Summary bar. | Must | Engineering Manager |
| **BR-037** | The system must display a scroll-to-top floating action button that becomes visible when the user has scrolled more than 400 px from the top of the page. | Could | All Users |
| **BR-038** | The frontend must save the current filter state to `localStorage` when the user activates the Save layout action, restoring it on subsequent visits. | Could | Engineering Manager |

---

## 8. Business Rules

The following rules define the fixed logic that governs system behaviour. These rules are not negotiable for v1.0 and may only be changed through a formal change request process.

**BIZ-001 — Delivery Health Score formula**
The health score is computed as:
```
score = (completionRate × 0.28)
      + ((1 − criticalRatio) × 100 × 0.24)
      + ((1 − warningRatio) × 100 × 0.12)
      + (latestSprintCompletionRate × 0.14)
      + ((1 − orphanRatio) × 100 × 0.12)
      + (cycleTimeScore × 0.10)
```
Where `cycleTimeScore = max(0, 100 − (averageCycleTimeDays − 3) × 8)`. The result is clamped to [0, 100] and rounded to the nearest integer. Score bands: 90–100 = Excellent, 75–89 = Good, 60–74 = Moderate, 40–59 = At Risk, 0–39 = Critical.

**BIZ-002 — Per-issue health classification thresholds**
Each issue is assigned a health value of `good`, `warning`, or `critical` based on the following signals:

| Signal | Warning threshold | Critical threshold |
|---|---|---|
| Active work age (time in an active status) | > 7 days | > 14 days |
| Cycle time (done items only) | > 7 days | > 14 days |
| Waiting age (not started, in backlog) | > 30 days | — |
| Due date | — | Overdue and status not done |
| Priority field | — | High / Highest / Critical and status not done |
| Blocked Flag field | — | Blocked Flag = true |

Multiple signals may be present simultaneously. All matching reason strings are concatenated and displayed. An item with a critical signal always overrides a warning signal.

**BIZ-003 — Lead time and cycle time definitions**
- **Lead time** = Created Date to Done/Resolution Date (total elapsed calendar days including backlog waiting)
- **Cycle time** = In Progress Date (or Sprint Start if In Progress Date is absent) to Done Date (active delivery time only)
- Both metrics are computed only for issues with the required date fields present. Values greater than 3,650 days are discarded as invalid.

**BIZ-004 — Delivery Composition classification priority order**
Every issue is assigned to exactly one segment in the following priority order (no double-counting):
1. Done — status is Done, Closed, or Resolved
2. Critical — health = critical AND not done
3. At Risk — health = warning AND not done
4. In Progress — status is an active status AND no health concern
5. Backlog — all remaining issues

**BIZ-005 — Active status definition**
The following status values are treated as active (in-progress) states: `In Progress`, `Code Review`, `QA`, `Testing`, `UAT`. All other non-done statuses are treated as not-started or backlog states.

**BIZ-006 — Done status definition**
The following status values are treated as done: `Done`, `Closed`, `Resolved`. Matching is case-insensitive.

**BIZ-007 — Orphan item definition**
An issue is classified as an orphan if both the `Epic Link` field and the `Parent Key` field are absent or empty. Orphan ratio = orphan count / total issues.

**BIZ-008 — Capacity imbalance threshold**
A Smart Recommendation is generated for capacity imbalance when any single assignee holds more than 35% of the total issue count across all issues in the export.

**BIZ-009 — Link column detection**
Any column whose name matches the pattern `*issue link*` (case-insensitive substring match) is treated as a link column. Standard Jira link column names include: `Inward issue link (Blocks)`, `Outward issue link (Blocks)`, `Inward issue link (Relates)`, `Outward issue link (Relates)`, `Inward issue link (Duplicate)`, `Outward issue link (Duplicate)`. Additional columns matching the pattern are processed automatically.

**BIZ-010 — File format and size limits**
Accepted file extensions: `.csv`, `.xlsx`, `.xls`. Maximum file size: 20 MB. Files exceeding this limit are rejected with HTTP 413 before parsing begins.

**BIZ-011 — Rate limiting**
Upload requests are rate-limited to 20 requests per 15-minute rolling window per originating IP address. Requests exceeding this limit receive HTTP 429. The rate limit applies to the `/api/upload` endpoint only.

**BIZ-012 — Predictive completion velocity floor**
Predictive completion is suppressed (returned as `daysRemaining: null`) when computed daily velocity is below 0.01 issues per day, to avoid nonsensical far-future projections from near-zero velocity data. It is also suppressed when no Created Date fields are present in the export.

**BIZ-013 — Two-digit year normalisation**
When parsing date values that contain a two-digit year, years >= 70 are interpreted as 1900s (e.g. 75 = 1975); years < 70 are interpreted as 2000s (e.g. 26 = 2026).

**BIZ-014 — Excel serial number date range**
Excel numeric serial numbers are treated as dates only when they fall in the range 20,000–80,000, corresponding approximately to the years 1955–2119. Values outside this range are treated as non-date numbers and not parsed as dates.

**BIZ-015 — Smart Recommendations generation priority**
Smart Recommendations are generated in the following priority order and capped at 5 total: (1) blocked critical items, (2) stale active work (active > 14 days), (3) capacity imbalance, (4) orphan items, (5) critical epics, (6) explicitly blocked-by-link items.

**BIZ-016 — Sprint metrics cap**
Sprint metrics display the top 8 sprints sorted by completed story points descending. Additional sprints are computed but not displayed in the sprint comparison section.

---

## 9. User Personas

### Persona 1 — The Engineering Manager

**Name:** Sarah Chen
**Title:** Engineering Manager, Platform Squad
**Experience:** 8 years in software engineering, 3 years in management

**Background:** Sarah manages a team of nine engineers working across two-week sprints in a SaaS product organisation. She is responsible for delivery forecasting, stakeholder reporting, and team health. She is comfortable with data but does not have time to build or maintain complex analytical tooling. Her primary Jira interaction is exporting data and reviewing boards before weekly leadership updates.

**Goals:**
- Know by Monday morning whether her team is on track for the sprint and the quarter
- Identify risks before they become blockers
- Produce a credible, consistent status update for her VP without spending an hour on data preparation
- Detect capacity imbalance before team members become overwhelmed or disengaged

**Pain points:**
- Sprint health reports take her 45–60 minutes to prepare manually, using an outdated Excel template that does not account for cycle time or orphan items
- She often discovers blockers at sprint review rather than mid-sprint
- Her VP asks for "a quick health update" with very little notice, requiring her to estimate from memory

**How she uses Delivery Clarity:**
Sarah exports her Jira backlog every Monday morning and uploads it to Delivery Clarity. She opens the Manager Quick Overview, pastes the snapshot into her Slack update to the VP, and then reviews the Smart Recommendations to assign follow-up actions in the team standup. She checks the Ownership section to monitor for any capacity imbalance and the Readiness section before sprint planning to identify at-risk epics.

**Technical comfort:** High — comfortable with dashboards, filters, and data terminology. Expects precise, trustworthy numbers.

---

### Persona 2 — The Scrum Master

**Name:** Marcus Obinna
**Title:** Scrum Master, Growth Tribe
**Experience:** 5 years as a scrum master across three product companies

**Background:** Marcus facilitates ceremonies for two squads (16 engineers total). He is deeply invested in flow efficiency, impediment removal, and continuous improvement. He tracks cycle time, throughput, and blocked items obsessively. His frustration with Jira is that it forces him to manually assemble the flow data he needs — status distribution, age of work, blocked items — from multiple boards and exports.

**Goals:**
- See at a glance which items are blocked, overdue, or stale before daily standup
- Understand flow efficiency trends across sprints
- Identify items that have been in a status for too long without movement
- Prepare sprint retrospective data without any manual aggregation

**Pain points:**
- Identifying blocked and stale items across 16 engineers requires scanning multiple Jira boards individually
- Sprint retrospectives lack quantitative flow data — Marcus relies on team memory rather than cycle time evidence
- He cannot easily show the team a visual breakdown of where work is stuck

**How he uses Delivery Clarity:**
Marcus uploads a combined export from both squads three times per week. He uses the quick filter bar to jump directly to Blocked and High Risk items before standup. He uses the Flow Health table with multiple filters to prepare his retrospective data, exporting the risk CSV to share with the team. The Sprint Status section provides the velocity and completion rate data he needs for sprint ceremonies without any manual calculation.

**Technical comfort:** Medium-high — comfortable with dashboards and tables but prefers visual representations over raw numbers where available.

---

### Persona 3 — The Executive / Director

**Name:** Rachel Okonkwo
**Title:** Director of Engineering
**Experience:** 15 years in technology, 5 years in director-level roles

**Background:** Rachel is responsible for delivery outcomes across six engineering squads totalling 45 engineers. She has weekly reviews with the CPO and quarterly business reviews with the board. She does not use Jira directly but relies on her engineering managers to provide consistent, accurate delivery health signals. Her primary frustration is receiving six different formats of status update from six different managers, making cross-team comparison impossible.

**Goals:**
- Understand the aggregate delivery health of the engineering organisation in under 5 minutes
- Identify which teams or programmes are at risk before they escalate to her
- Communicate credibly to the CPO and board about delivery confidence and estimated completion
- Reduce the preparation burden on her engineering managers so they spend more time on engineering and less on reporting

**Pain points:**
- Each engineering manager produces a different format of sprint update, making cross-team comparison impossible
- She has no reliable predictive completion signal — estimates from teams are narrative and inconsistent
- Preparing for board QBRs requires gathering and reconciling six separate documents

**How she uses Delivery Clarity:**
Rachel's engineering managers share their Manager Quick Overview PDF/print-out in the weekly leadership sync. Rachel reviews the Health Score and the prediction card to assess delivery confidence. For programme-level reviews, she requests that managers upload their full backlog exports and share the Justification section narrative. She does not operate the tool herself but sets the expectation that all status updates are produced from Delivery Clarity outputs to enforce consistency.

**Technical comfort:** Low-medium — expects clean, self-explanatory outputs. Does not interpret raw filter tables; relies on the health score, narrative, and snapshot grid.

---

## 10. User Journey Maps

### Journey 1 — Engineering Manager (Sarah): Monday Morning Sprint Health Check

| Step | Action | System Response | Value Delivered |
|---|---|---|---|
| 1. Export from Jira | Sarah opens Jira, navigates to her squad's backlog, selects Export → Excel (all fields) | Jira generates a .xlsx file including 18 key columns | Raw data collected |
| 2. Open Delivery Clarity | Sarah opens `http://localhost:3000` in her browser | Upload page displayed with drag-and-drop zone and column guidance | Zero configuration required |
| 3. Upload the file | Sarah drags the .xlsx file onto the upload zone | Progress indicator displays; backend parses and validates the file; dashboard renders in under 5 seconds | Data transformed into insights |
| 4. Review Health Score | Sarah sees the circular health score gauge in the dashboard header — score is 68 (Moderate) | Health score colour-coded amber; score band label "Moderate" displayed | Immediate health signal without reading the detail |
| 5. Read Smart Recommendations | Three action cards appear: "2 items blocked for > 14 days", "Capacity imbalance: Jordan Lee holds 38% of open work", "4 orphan items detected" | Each card colour-coded and deep-linked to the relevant section | Prioritised action list generated automatically |
| 6. Open Manager Quick Overview | Sarah clicks Quick Overview in the Summary bar | Modal opens showing health banner, 8-cell snapshot grid (completion rate, active items, cycle time, etc.), and 7 deep-linked report rows | Report ready to paste into Slack/email |
| 7. Paste into stakeholder update | Sarah copies the snapshot grid text and pastes it into her Slack weekly update message | N/A | Executive communication completed in under 3 minutes |
| 8. Review Ownership section | Sarah scrolls to Capacity by Assignee; sees Jordan Lee at 38% | Bar chart shows imbalance visually; item list available via the detail panel | Corrective action identified before standup |
| 9. Check Readiness | Sarah opens the Readiness section; one epic flagged as critical risk with 2 dependencies unresolved | At-risk epic listed with View Items deep-link | Sprint planning input ready |
| 10. Export risk CSV | Sarah clicks Export risk report | CSV downloaded with all critical and warning items | Artefact available for team discussion |

**Total time from Jira export to completed stakeholder update: under 8 minutes.**

---

### Journey 2 — Scrum Master (Marcus): Pre-standup Blocked Item Review

| Step | Action | System Response | Value Delivered |
|---|---|---|---|
| 1. Upload export | Marcus uploads a combined export from both squads | Dashboard renders; 187 issues processed | All items available for analysis |
| 2. Use Blocked quick filter | Marcus clicks the Blocked quick filter button in the sticky filter bar | Flow Health panel opens automatically; reasonFilter set to "block"; table shows only blocked items | Blocked items isolated in one click |
| 3. Review blocked items | 6 items shown: 3 blocked by flag, 3 blocked by inward link | Each item shows assignee, days active, health badge, and reason string | Standup agenda items identified |
| 4. Open a blocked item's detail | Marcus clicks a Jira deep-link icon on one blocked item | New tab opens to the Jira issue | Issue context accessible immediately |
| 5. Use High Risk quick filter | Marcus switches to High Risk filter | Table now shows all critical health items | Full risk picture visible |
| 6. Review Sprint Status | Marcus scrolls to Sprint Status section | Velocity chart shows last 3 sprints; current sprint at 55% completion rate with 4 days remaining | Sprint risk signal quantified |
| 7. Check Flow Health table for stale items | Marcus sets Open Age filter to 14 days maximum, inverts to > 14 by using the filter alongside health=warning | Items active for more than 14 days with warning health surfaced | Stale work visible for retrospective discussion |
| 8. Export risk report | Marcus downloads the risk CSV | 11 items in the CSV | Artefact for retrospective facilitation |

**Total time from upload to standup preparation complete: under 6 minutes.**

---

### Journey 3 — Director (Rachel): Programme Health Review Preparation

| Step | Action | System Response | Value Delivered |
|---|---|---|---|
| 1. Request upload from managers | Rachel sends a standing request for all 6 teams to upload their full backlog exports to Delivery Clarity by 9am Friday | N/A (organisational process) | Data collection standardised |
| 2. Review Manager Quick Overview from each team | Each manager shares their Quick Overview print-out or screenshot | Health Score, snapshot grid, and prediction visible per team | Cross-team comparison possible on a consistent format |
| 3. Identify lowest-scoring team | Rachel sees one team at Health Score 42 (At Risk) vs others at 68–81 | Colour-coded health bands make the outlier immediately visible | Risk identification without reading six separate reports |
| 4. Request deep-dive on at-risk team | Rachel asks the at-risk team's manager to walk through the Justification section and Readiness section live | Manager shares screen; Justification narrative explains the risk in plain language; Readiness shows two critical epics | Structured conversation about risk with specific data |
| 5. Review prediction card | Rachel notes the at-risk team's predicted completion date is 3 weeks beyond the committed release date | Prediction card shows projected date vs target date | Escalation decision data available |
| 6. Prepare QBR input | Rachel screenshots the snapshot grids from all 6 teams and assembles them into a single QBR slide | N/A | QBR preparation time reduced from 3 hours to 20 minutes |

**Total time for Rachel's programme review preparation: under 30 minutes, down from 3+ hours.**

---

## 11. Success Metrics / KPIs

The following metrics define product success and will be measured at 30, 90, and 180 days post-deployment.

| Metric | Baseline (pre-launch) | Target (90 days) | Target (180 days) | Measurement Method |
|---|---|---|---|---|
| Average sprint health report preparation time | 45–60 minutes | < 10 minutes | < 8 minutes | User survey (n ≥ 10) |
| Number of active teams (≥ 10 uploads in period) | 0 | 3 teams | 5 teams | Import audit log |
| Upload-to-dashboard render time (P95) | N/A | < 5 seconds | < 5 seconds | Backend timing logs |
| Risk detection latency (days from threshold breach to manager awareness) | 7–14 days | < 3 days | < 2 days | User survey + sprint retrospective feedback |
| Manager Quick Overview usage rate (% of uploads that result in report open) | N/A | 40% | 60% | Frontend analytics (if instrumented) |
| User NPS | N/A | ≥ 30 | ≥ 40 | Internal NPS survey |
| System uptime | N/A | 99% during business hours | 99% | Server monitoring |
| Smart Recommendations actioned rate (% of recommendations resulting in a Jira action within 24 hours) | N/A | 30% | 50% | User survey |
| Reduction in ad hoc "delivery status" escalations to engineering managers from executives | Not measured (qualitative) | Perceived decrease reported by 70% of managers surveyed | Confirmed decrease vs baseline | Survey |
| Cross-team health format standardisation | 0% (no standard) | 50% of teams using Delivery Clarity outputs as primary status format | 80% | Governance review |

---

## 12. Assumptions

1. Users have access to Jira and can export their project backlog as a CSV or Excel file without restriction.
2. Exported Jira files will include at minimum the four required fields: Issue Key, Issue Type, Summary, and Status. Richer analysis is conditional on additional columns being included in the export.
3. The Jira export format is stable enough that column header aliases captured in the 55+ alias library cover the majority of real-world exports. Edge cases may require alias additions in future maintenance releases.
4. The self-hosted deployment environment runs Node.js >= 18 and npm >= 9 on a server or workstation accessible to all intended users via a browser.
5. *(Historical v1.0 assumption, superseded — see Section 6 "In Scope (v4.0 — Current)")* User authentication and role-based access control are now implemented and required: every route is gated by `iron-session` cookies and a role matrix enforced in `middleware.ts`. Admin-managed accounts replace the original "anyone who can reach the URL is authorised" model. Self-hosting teams no longer need to add an external authentication proxy.
6. Browser state has a layered restore model: the app first loads the latest server/bucket metrics and then falls back to browser `localStorage` if needed.
7. Jira Sprint field values in exports are assumed to be text strings (sprint names) from which sprint grouping and comparison can be derived.
8. The "Blocked Flag" signal is available only in Jira exports that include a custom "Blocked Flag" field. Teams without this custom field will only have blocking links (not the flag) as a blocking signal.
9. Story points are assumed to be numeric. Exports using T-shirt sizing (S/M/L/XL) will not yield meaningful story point metrics unless the values have been converted to numbers in Jira.
10. The import audit log file (`backend/data/import-logs.json`) is writable by the Node.js process. File system permissions are the responsibility of the deployment administrator.
11. All date fields in Jira exports are in one of the supported formats: ISO 8601, Jira short date (DD/MMM/YY), Excel serial number, or native JavaScript Date-parseable strings.
12. Users with mobile devices will primarily use the tool in a read/review capacity rather than as the primary upload path.
13. The existing React and Node.js technology stack is approved for use and no technology substitution will be required during v1.0 delivery.
14. The deployment remains single-organisation, self-hosted, and single-database (no cross-organisation multi-tenancy). Within that organisation, the product now supports multiple authenticated users with distinct roles (admin, manager, c_level, scrum_master, product_owner, engineering_manager, member) — multi-user support is implemented and in scope (see Section 6 "In Scope (v4.0 — Current)"); cross-organisation multi-tenancy remains out of scope.

---

## 13. Constraints

### Technical Constraints

- **Latest metrics require persistent app storage:** Returning sessions depend on `data/latest-metrics.json` plus the configured bucket/cache. Deployments without persistent storage can still use browser `localStorage` fallback, but server-side latest metrics will not survive cold starts.
- **Flat file import log:** The current import log uses a flat JSON file, which is not safe for concurrent writes under high load. This constrains the system to low-concurrency deployments for v1.0.
- **File size ceiling:** The 20 MB upload limit is a product of the current server-side memory allocation and processing model. Exports exceeding this size (typically > 5,000 issues) are not supported in v1.0.
- **No database:** All analysis is recomputed on every upload. Historical trending and cross-session comparison are not technically possible without a persistent data store.
- **React single-page application:** All client-side state lives in React `useState`. Deep-linking to a specific dashboard section is not possible via URL; navigation is scroll-based.
- **Browser compatibility:** The application targets modern evergreen browsers (Chrome, Firefox, Edge, Safari). Internet Explorer is not supported. iOS Safari safe-area insets are explicitly handled.

### Business Constraints

- **No Jira API credentials:** The v1.0 product is explicitly designed to operate without any Jira API credentials, tokens, or OAuth grants. This is both a feature (data sovereignty) and a constraint (no automated data refresh).
- **Single-file analysis:** Each upload session analyses one Jira export. Comparative analysis across multiple teams or multiple time periods requires multiple separate uploads and manual comparison of outputs.
- **Self-hosted only:** There is no cloud-hosted or SaaS variant planned for v1.0. Organisations that cannot operate self-hosted Node.js infrastructure cannot use the product in its current form.
- **Internal use licence:** The software is licensed for internal use only. Redistribution, resale, or white-labelling is not permitted under the current licence terms.

### Regulatory / Compliance Constraints

- **Data residency:** Because the product is self-hosted and processes no data outside the organisation's own infrastructure, there are no third-party data residency concerns. However, the deploying organisation is responsible for ensuring the server environment meets their own data classification requirements for Jira project data.
- **Audit trail:** *(Historical v1.0 limitation, resolved in v4.x)* The import log now records the authenticated `userId` for every upload alongside file name, timestamp, column statistics, and row count, since user authentication and role-based access are implemented (see Section 6 "In Scope (v4.0 — Current)" and `AuditEvent` in the Prisma schema).

---

## 14. Dependencies

| Dependency | Type | Description | Risk if Unavailable |
|---|---|---|---|
| **Jira export capability** | External — third-party product | The system is entirely dependent on users' ability to export Jira project data as CSV or XLSX. Jira configuration changes or permission restrictions that disable exports would break the input path. | Critical — no alternative data input in v1.0 |
| **Node.js >= 18** | Technical — runtime | The backend is a Node.js Express application. Node.js 18 or later must be available on the deployment host. | Critical — application cannot start |
| **npm >= 9** | Technical — package manager | Required to install backend and frontend dependencies. | High — installation fails |
| **xlsx npm package** | Technical — library | Used by `parser.js` for reading `.xlsx` and `.xls` files. Version pinned in `package.json`. | High — Excel file parsing fails; CSV still works |
| **React 18** | Technical — framework | The frontend is a React single-page application. React 18 is required for concurrent features and hooks used in `DashboardPage.js`. | Critical — frontend does not render |
| **Browser File API** | Technical — browser API | The upload flow uses the browser's native File API for drag-and-drop and file input. Unavailable in very old browsers or restricted environments. | Medium — upload UI breaks; direct API call still possible |
| **Browser localStorage API** | Technical — browser API | Used for the Save layout feature that persists filter state across sessions. | Low — save feature fails silently; core functionality unaffected |
| **Browser Print API** | Technical — browser API | The print report functionality calls `window.print()`. Restricted in some kiosk or locked-down browser environments. | Low — print fails; all other features unaffected |
| **CSS custom properties and grid** | Technical — browser feature | The UI uses CSS custom properties (variables) and CSS Grid extensively. Required for the responsive layout and dark mode theming. | Low — visual degradation in very old browsers; not supported |
| **Network connectivity (localhost)** | Technical — infrastructure | The frontend at port 3000 must be able to reach the backend at port 4000. Firewall or proxy rules that block inter-process localhost communication will prevent uploads from completing. | High — upload fails; dashboard does not populate |
| **File system write access** | Technical — infrastructure | The Node.js process must have write access to `backend/data/import-logs.json` for audit logging. | Low — logging fails silently; core analysis unaffected |

---

## 15. Risks and Mitigations

| Risk ID | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| RISK-01 | Jira export column headers differ from the 55+ alias library, causing fields to be unrecognised and producing incomplete metrics | Medium | High | Maintain and extend the alias library based on real-world export samples. Provide clear warnings in the upload response when expected fields are absent. Document the column list in the setup guide. |
| RISK-02 | Users do not upload frequently enough for Smart Recommendations to surface risks in time to act | Medium | High | Establish an organisational norm of minimum three uploads per week. Future roadmap item: direct Jira API integration to enable automated refresh. |
| RISK-03 | The flat JSON import log suffers data corruption under concurrent writes | Low | Medium | For v1.0, the tool is scoped for single-team or low-concurrency use. Document the limitation. Roadmap item: migrate to SQLite for v1.1. |
| RISK-04 | Exports exceed 20 MB for large backlogs (> 5,000 issues), preventing analysis | Low | Medium | Advise users to filter exports to the active programme or current quarter. Roadmap item: increase limit and implement streaming parse for large files. |
| RISK-05 | Latest dashboard state is unavailable on refresh if both bucket/server metrics and browser fallback are missing | Medium | Low | Upload writes `data/latest-metrics.json` and browser `dc_metrics_v2`; source badge explains bucket/cache/upload/localStorage fallback state. |
| RISK-06 | Health score thresholds do not fit all team contexts (e.g. a team with a 14-day cycle time norm flags as critical) | Medium | Medium | Document all threshold logic. Roadmap item: custom threshold configuration per project. Short-term: users can review the raw data in the Flow Health table alongside the score. |
| RISK-07 | The self-hosted deployment model creates a maintenance burden on platform teams | Low | Medium | Provide clear setup documentation and a health check endpoint. The application has no external API dependencies in v1.0, minimising ongoing maintenance surface. |
| RISK-08 | Users misinterpret the Health Score as a performance metric rather than a delivery health signal | Medium | High | Name the score "Delivery Health Score" (not "Team Score" or "Performance Score"). Include contextual Help guide content explaining the formula components. State clearly in the Manager Quick Overview that the score reflects delivery flow health, not team productivity. |
| RISK-09 | Rate limiting blocks legitimate heavy users (e.g. a CI/CD pipeline calling the API) | Low | Low | Rate limit is 20 requests per 15 minutes — sufficient for human use patterns. Document the limit. Future roadmap item: configurable rate limit per IP range for automated use. |
| RISK-10 | Missing `In Progress Date` fields cause cycle time to fall back to Sprint Start Date, which may not be accurate | High | Low | Fall-back is documented in the metrics specification. Warn users in the upload response when In Progress Date is absent. Advise including the field in exports. |
| RISK-11 | Orphan item detection produces false positives for projects that deliberately use flat issue structures without epics | Medium | Low | Orphan ratio is one component of six in the health score (12% weight). Teams using flat structures will see a persistent orphan signal; they can discount this from their interpretation. Future roadmap item: configurable orphan detection rules. |
| RISK-12 | The predictive completion estimate misleads stakeholders when velocity is too low or too variable | Medium | High | The prediction is suppressed when velocity is below 0.01 issues/day. When shown, it is presented with the velocity-per-day figure so users can assess reliability. The Help guide explains the formula and its limitations. |

---

## 16. Glossary

| Term | Definition |
|---|---|
| **Active status** | A Jira issue status indicating work is currently in progress. In Delivery Clarity, the active statuses are: In Progress, Code Review, QA, Testing, UAT. |
| **Assignee** | The person to whom a Jira issue is assigned for completion. Used in capacity and load distribution analysis. |
| **At Risk** | A classification applied to issues with a `warning` health signal that are not yet done. One of five segments in the Delivery Composition ring. |
| **Blocked Flag** | A custom Jira field that, when set to `true`, causes an issue to be classified as `critical` health and surfaced in blocked item reports. |
| **Capacity imbalance** | A condition where a single assignee holds more than 35% of the total open issue count, triggering a Smart Recommendation. |
| **Cycle time** | The elapsed calendar days from when an issue entered an active status (In Progress Date, or Sprint Start as a fallback) to when it was completed (Done Date). Measures active delivery time only, excluding backlog waiting time. |
| **Delivery Composition** | The classification of every issue in an export into exactly one of five mutually exclusive segments: Done, In Progress, At Risk, Critical, or Backlog. Visualised as a single ring chart. |
| **Delivery Health Score** | A composite integer score between 0 and 100 summarising the overall delivery health of a project or sprint. Computed from six weighted signals: completion rate, critical ratio, warning ratio, sprint completion rate, orphan ratio, and cycle time score. |
| **Done status** | A Jira issue status indicating work is complete. In Delivery Clarity, the done statuses are: Done, Closed, Resolved. |
| **Epic** | A large body of work in Jira that groups related stories, tasks, and bugs. Referenced via the Epic Link or Parent Key field. |
| **Epic Link** | A Jira field on child issues that references the parent epic. Used for orphan detection and epic readiness analysis. |
| **Export** | A Jira-generated file (CSV or XLSX) containing all issues from a project, board, or filtered view, including all selected field columns. |
| **Flow efficiency** | The ratio of active working time to total elapsed time (cycle time / lead time). A high flow efficiency indicates little waiting time relative to active work time. |
| **Flow item** | An individual Jira issue after it has been enriched with computed health fields (lead time, cycle time, age, active age, health classification, reason strings). The core unit of analysis throughout the dashboard. |
| **Health band** | One of five named categories for the Delivery Health Score: Excellent (90–100), Good (75–89), Moderate (60–74), At Risk (40–59), Critical (0–39). |
| **Health Score** | See Delivery Health Score. |
| **Import audit log** | A JSON file (`backend/data/import-logs.json`) that records metadata for every file uploaded to Delivery Clarity, including file name, upload timestamp, detected column list, and row count. |
| **Inward issue link** | A Jira link direction indicating that another issue is linked to this issue. For blocking links, an inward "Blocks" link means this issue is being blocked by another issue. |
| **Issue key** | The unique identifier for a Jira issue, typically in the format PROJECT-123. Used as the primary key throughout Delivery Clarity. |
| **Issue type** | A Jira field classifying the nature of an issue (e.g. Story, Task, Bug, Epic, Sub-task). Used for type breakdown and defect analysis. |
| **KPI card** | One of six summary metric tiles displayed in the Executive Delivery Snapshot section, each showing a headline number and trend indicator for a key delivery metric. |
| **Label** | A user-defined tag applied to Jira issues for classification. Multiple labels can be applied to a single issue. Used in the Labels and Classification section. |
| **Lead time** | The elapsed calendar days from when an issue was created to when it was completed (Done/Resolution Date). Includes all waiting time in backlog before active work began. |
| **Manager Quick Overview** | A modal report in Delivery Clarity providing an executive-ready delivery health snapshot, including the health score, an 8-cell metric grid, and 7 deep-linked report rows. Designed to be pasted directly into a stakeholder communication. |
| **Orphan item** | A Jira issue that has no value in either the Epic Link or Parent Key field, meaning it is not associated with any epic or parent story. Orphan items will not surface in roadmap or epic-level reporting. |
| **Orphan ratio** | The proportion of all issues that are orphans (orphan count / total issues). Used as one of the six signals in the Delivery Health Score formula. |
| **Outward issue link** | A Jira link direction indicating that this issue links to another issue. For blocking links, an outward "Blocks" link means this issue is blocking another issue. |
| **Predictive completion** | A velocity-based estimate of how many days remain until all open issues are complete, and the projected completion date. Calculated as remaining issues / daily velocity. |
| **Priority** | A Jira field indicating the urgency of an issue (Lowest, Low, Medium, High, Highest, Critical). Issues with priority High, Highest, or Critical that are not done are classified as critical health. |
| **Quarter** | A three-month calendar period (Q1–Q4) used to group issues for throughput and trend analysis in the Quarter Statistics section. |
| **Rate limit** | A restriction of 20 upload requests per 15-minute rolling window per IP address, enforced by the backend to prevent abuse. |
| **Smart Recommendation** | An auto-generated, prioritised action card surfaced in the dashboard based on analysis of the current upload. Up to five are shown, covering the highest-priority delivery concerns detected in the data. |
| **Sprint** | A fixed-length delivery iteration in Jira (typically 1–2 weeks). Sprint data is derived from the Sprint field in the export. |
| **Sprint completion rate** | The percentage of committed sprint issues that were completed within the sprint. Used in the Sprint Status section and as a component of the Delivery Health Score. |
| **Story points** | A numeric estimate of the relative effort required to complete an issue. Used for velocity and capacity tracking. Story points are optional; the dashboard degrades gracefully when absent. |
| **Stale active work** | Issues that have been in an active status for more than 14 days without being completed. Triggers a Smart Recommendation and warning/critical health classification. |
| **Status** | A Jira field indicating the current workflow state of an issue (e.g. To Do, In Progress, Code Review, Done). The primary signal for health classification and flow analysis. |
| **Throughput** | The number of issues completed in a given time period. Used in Quarter Statistics and as the basis for velocity calculation. |
| **Velocity** | The average number of issues completed per day, calculated from the total done issues divided by elapsed days since the earliest created date. Used for predictive completion. |
| **Warning** | A health classification assigned to issues that meet one or more of the warning-level health signal thresholds (e.g. active age > 7 days, cycle time > 7 days, waiting age > 30 days). Distinct from Critical, which represents a more severe threshold. |

---

*Document prepared by Ali Abu Ras · Delivery Clarity v1.0 · 2026-05-30*

---

## Revision Note — v1.1 (2026-05-30)

### New Routes (Business Requirements Update)

**BR-041 (Must):** On file upload success, the system MUST display the Summary page (/summary) as the first view. The full report (/dashboard) is a secondary page reached by explicit user action.

**BR-042 (Must):** The Summary page (/summary) MUST display: delivery health score with band colour, health status banner, 6 KPI cards, attention indicators (blockers/overdue/orphans), top 4 plain-language insights, estimated completion chip, and a "View Full Report →" call-to-action button.

**BR-043 (Must):** The Help guide MUST be accessible as a standalone page at /help with section-level deep-linking via ?section= URL parameter. All Help button and context ? buttons navigate to this route rather than opening a modal overlay.

### Route Structure
| Route | Component | Description |
|---|---|---|
| / | UploadPage | File upload landing; redirects to /summary if data loaded |
| /summary | SummaryPage | **First page after upload** — executive overview |
| /dashboard | DashboardPage | Full 16-section delivery report (all sections collapsible) |
| /charts | ChartsPage | Visual analytics — donuts, bars, Gantt |
| /explore | ExplorePage | Work Item Explorer — visual hierarchy map |
| /login | LoginPage | Authentication — sign in |
| /register | RegisterPage | Account creation (open registration optional) |
| /profile | ProfilePage | User profile and sign out |
| /admin/logs | AdminLogsPage | Admin view of all import logs |
| /help | HelpGuide (pageMode) | Full-page interactive help with section deep-links |

---

## Revision Note — v3.0 (2026-05-31)

### Feature 1 — Throughput & Delivery Analytics

**BR-050 (Must):** The system MUST calculate sprint throughput (count and story points) for every sprint group found in the export.

**BR-051 (Must):** The system MUST detect mid-sprint delivery patterns and classify each sprint as: Healthy Early Progress, End-Loaded Sprint, Late Delivery Risk, Scope Instability, or Blocked Sprint.

**BR-052 (Must):** The system MUST calculate Kanban flow metrics (throughput per month, flow efficiency, aging WIP, bottleneck status) for issues without sprint fields.

**BR-053 (Must):** Throughput data MUST be included in the DashboardMetrics response from the upload API.

**BR-054 (Must):** The Full Report MUST display Sprint Throughput Panel, Mid-Sprint Delivery Panel, and Kanban Throughput Panel.

### Feature 2 — Work Item Explorer

**BR-055 (Must):** A `/explore` route MUST allow users to enter any issue key and visualise its immediate parent and direct children on an interactive graph.

**BR-056 (Must):** The visual graph MUST use React Flow with Dagre layout, supporting pan, zoom, mini-map, and node click.

**BR-057 (Must):** Orphan issues MUST be visually distinct — dashed orange border, "ORPHAN" badge.

**BR-058 (Must):** The Explorer MUST show: visual graph, charts section, KPI stats, and detail table for the searched issue.

**BR-059 (Must):** Each issue type MUST have its own node colour and icon (Epic=purple, Story=blue, Task=slate, Bug=red, etc.).

### Feature 3 — Authentication

**BR-060 (Must):** Users MUST authenticate with email and password before accessing /dashboard, /summary, /charts, /explore, /backend, /profile, or /admin.

**BR-061 (Must):** Passwords MUST be hashed with bcryptjs (rounds=12) and never stored in plain text.

**BR-062 (Must):** Sessions MUST use HTTP-only cookies via iron-session.

**BR-063 (Must):** Each upload MUST be logged to the SQLite ImportLog table with the authenticated userId.

**BR-064 (Should):** Admin users MUST see all users' import logs at /admin/logs. Regular users see only their own.

**BR-065 (Must):** A UserMenu component MUST appear in the header showing the user's name, with Profile and Sign Out options.

### Feature 4 — Smart Excel Export

**BR-066 (Must):** The Excel export MUST produce a 17-sheet statistical workbook — not a copy of the UI.

**BR-067 (Must):** The Executive Summary sheet MUST include a health score, top 5 recommendations with evidence, and an auto-generated executive narrative paragraph.

**BR-068 (Must):** Every recommendation MUST carry: priority, area, text, evidence, impact, suggested owner, and suggested action.

**BR-069 (Must):** The Metric Dictionary sheet MUST define every metric used in the workbook.

---

## Revision Note — v4.0 (2026-06-03)

### v4 — Quality & Trust Layer (Implemented)

**BR-070 (Must):** The system MUST calculate and display a Data Quality Score (0–100%) after every upload based on 10 data completeness checks. This is a business capability: it enables teams to understand the reliability of their delivery data before acting on it.

**BR-071 (Must):** The system MUST display a per-KPI Metric Confidence badge (High / Medium / Low / Unreliable / N/A) explaining which fields are missing and how that affects the metric. This is a trust feature: it prevents users from making decisions based on misleading numbers.

**BR-072 (Must):** The system MUST explain, per missing field, which dashboard metrics are degraded and what the user would gain by improving their Jira data. This is an explainability feature: it gives users a clear, prioritised action plan.

**BR-073 (Must):** Admin users MUST be able to configure data retention period for import logs. This is a compliance and governance feature enabling organisations to meet data minimisation requirements.

**BR-074 (Must):** Users MUST be able to save, load, and delete named dashboard snapshots. This enables sprint-over-sprint and quarter-over-quarter comparison without requiring re-upload.

**BR-075 (Must):** The snapshot comparison view MUST show delta values for 12 key metrics between any two snapshots. This enables engineering managers to demonstrate delivery improvement to stakeholders.

**BR-076 (Must):** The system MUST provide upload-to-upload trend charts for 8 metrics over the last 30 uploads. This is a historical performance visibility feature.

**BR-077 (Must):** The "What changed since last upload?" panel MUST automatically compare current and previous uploads and generate a plain-English narrative. This replaces manual sprint review preparation.

**BR-078 (Should):** Scrum Masters and Engineering Managers MUST be able to configure health thresholds (cycle time, lead time, active age, orphan ratio) via the admin settings UI. This is an adaptability requirement: different teams have different delivery norms.

**BR-079 (Should):** Users MUST be able to mute or snooze individual recommendations for 7 days, 30 days, or permanently. This prevents recommendation fatigue and ensures high-signal recommendations stay visible.

**BR-080 (Must):** A Role-based View selector MUST allow users to switch between 5 curated dashboard presets: Full Report, Executive, Scrum Master, Product Owner, Engineering Manager. This is a stakeholder communication feature.

**BR-081 (Must):** A Customer View page (`/customer`) MUST present delivery health in a format suitable for non-technical stakeholders with print/PDF capability. This is an executive reporting feature.

**BR-082 (Must):** A Release Readiness checklist (`/readiness`) MUST evaluate Go/Conditional Go/No-Go per Fix Version using a 7-item checklist. This is a release governance feature.

**BR-083 (Should):** The production security checklist (`/admin/security`) MUST provide a 0–100 security score and production-ready flag to help self-hosters verify their deployment is safe.

**BR-084 (Should):** A Dockerfile and docker-compose configuration MUST be provided to enable one-command deployment for teams without Node.js server expertise.

### v4 — Planned P1 UX Improvements (BR-085–BR-090)

**BR-085 (Must — P1.1):** The Calculation Reference in `/developer` MUST be clearly visible as its own labelled item in the blue side menu. Each calculation must document its formula, data source, why it is used, business benefit, assumptions, and limitations. This is a product transparency and trust feature.

**BR-086 (Must — P1.2):** A "Clear Local Data" action MUST appear in Admin settings and on the Upload/Landing page (when stored data is detected). It MUST clear Delivery Clarity browser data with a session-end warning and confirmation. This is a data privacy and troubleshooting feature.

**BR-087 (Must — P1.2):** The Upload/Landing page MUST detect stored Delivery Clarity browser data and show a clear option to reset it. This helps users who return to the app and see stale data from a previous upload.

**BR-088 (Must — P1.3):** The dashboard MUST provide a Section Switcher control placed after the main Overview section. It MUST support Overview mode (default — high-level only), Single Section mode, and Full View mode. This prevents dashboard overwhelm and supports focused review.

**BR-089 (Must — P1.3):** Section visibility changes MUST animate smoothly (CSS opacity + transform transitions, 180ms). Reduced-motion users MUST receive instant transitions. This is a professional UX quality requirement.

**BR-090 (Must — P1.3):** Clicking a section button MUST smooth-scroll to that section. This is a navigation clarity requirement.


---

## v4.1 — UX Design System & Navigation (2026-06-04)

**BR-091 (Must):** All interactive buttons throughout the application MUST follow the pill button design system (`rounded-full`, semantic colour classes). This is a visual consistency and brand quality requirement.

**BR-092 (Must):** Navigation dropdown items MUST display an icon and label in tab-button style. Active item MUST show a blue indicator. This improves navigation clarity and reduces user disorientation.

**BR-093 (Must):** The `/glossary` and `/help` pages MUST each include a sticky section navigation bar that tracks the active section and supports keyboard-accessible smooth scrolling. A "Back to Top" button MUST appear at the page footer. This reduces scrolling friction on long reference pages.

**BR-094 (Must):** Dashboard filter row and flow panel entry points MUST be hidden for views that restrict flow panel access (Executive, Product Owner). C-level and product users MUST NOT see the technical issue-level table. This is a role-based information access requirement.

**BR-095 (Should — P2):** The Smart Recommendations section MUST maintain a history of up to 10 recommendation snapshots. Users MUST be able to see which recommendations are new since their last upload, which have been resolved, and browse the full history. This supports continuous improvement tracking over time.

**BR-111 (Must — P3 — Done):** Delivery Clarity stores critical data (user accounts, import logs, snapshots) in a local SQLite database. Self-hosted teams MUST be able to back up this data to a cloud storage provider (S3, Azure, GCP) so backups survive server failures. The backup destination MUST be configurable by admins without code changes.

**BR-110 (Should — P3 — Done):** Different users prioritise different charts — a Scrum Master needs Sprint Velocity front and centre; a Director needs the Timeline and Label Distribution. Allowing per-user chart customisation (which charts to show, how wide each one is) personalises the analytics view without requiring a separate page or configuration by an admin.

**BR-112 (Should — P3 — Done):** With ~16 collapsible sections on the dashboard, users need to gauge a section's health without opening it — scanning a long page to find the one section that needs attention is slow. Status chips on each section trigger, colour-coded by severity, let users spot what needs attention at a glance and decide which sections to expand first. This is a scanability and time-to-insight requirement.

**BR-109 (Should — P3 — Done):** Different users have different needs from the dashboard. A Scrum Master cares about Sprint and Risks; a Director cares about Readiness and Throughput. Allowing each user to reorder and hide sections puts their most important data first without requiring a separate role-based view to be configured by an admin.

**BR-108 (Should — P3 — Done):** Teams using Delivery Clarity across different departments or brands want the tool to feel like their own. Advanced theme customization — accent colour, border radius, and font size — gives each team/individual a personalised experience without requiring a code change or rebuild.

**BR-107 (Should — P3 — Done):** New users landing on the dashboard for the first time face a steep learning curve — 14 sections, complex filtering, and 28+ metrics. A guided tour reduces time-to-value by directing attention to the 5–6 most impactful features in sequence. Without a tour, new team members typically need a 30-minute walkthrough from an existing user.

**BR-106 (Should — P2 — Done):** Users who are already inside the app (logged in, data loaded) need a way to discover features they haven't used yet. A new team member should be able to navigate to a single page that shows everything the product can do, with direct links to each feature. This reduces the "I didn't know that existed" discovery gap.

**BR-105 (Should — P2 — Done):** Every user-facing surface of the product — login, register, reports, exports, browser tab, social sharing — MUST present consistent branding. Inconsistent branding (logo on some pages, plain text on others; wrong version numbers; different email addresses) undermines the product's professional credibility and trust.

**BR-104 (Should — P2 — Done):** Admins MUST have a single page that shows the system's operational health at a glance — database row counts, import success rates, env var completeness, active sessions, and recent audit activity. Without this, identifying operational issues requires querying the database manually or correlating multiple admin pages.

**BR-103 (Should — P2 — Done):** Any team that wants to run Delivery Clarity in their own environment MUST have a clear, step-by-step deployment guide for all realistic targets (Docker, VPS, Vercel). Without this, self-hosting requires trial-and-error that blocks adoption. The guide MUST be part of the product repository so it stays in sync with the code.

**BR-102 (Should — P2 — Done):** Developers navigating the Developer Portal need a way to find specific calculations, packages, or sections without knowing which subsection to open. A global search eliminates multi-click navigation for common queries like "lead time formula" or "prisma package".

**BR-101 (Should — P2 — Done):** Smart Recommendations are only actionable if someone owns the action. A recommendation without an assigned owner is advice, not a task. Action-owner assignment turns each recommendation into an accountable delivery task without requiring a separate project management tool.

**BR-100 (Should — P2 — Done):** Directors and programme leads MUST be able to produce a one-page executive summary in under 60 seconds for use in steering committees, board updates, or stakeholder emails. Manual copy-paste from multiple dashboard pages is error-prone and time-consuming. A dedicated one-page PDF export eliminates this friction.

**BR-099 (Should — P2 — Done):** The system MUST provide a cross-team portfolio view that aggregates epics, projects, sprints, and quarters into a single dashboard. Delivery managers and programme leads need to assess the entire portfolio's health at a glance without switching between multiple views or exports.

**BR-098 (Should — P2 — Done):** The system MUST enable team-level health comparison so managers can see at a glance which team members are healthy, at risk, or overloaded. Teams are often the unit of delivery retrospectives — having individual health scores makes those conversations data-driven rather than anecdotal.

**BR-097 (Should — P2 — Done):** The system MUST track release confidence as a trend over multiple uploads. Teams need to see whether their release readiness is improving or degrading sprint-over-sprint — not just a one-time snapshot. This is a continuous improvement visibility requirement.

**BR-096 (Should — P2 — Done):** The Work Item Explorer (`/explore`) MUST allow users to export the current graph as an Excel workbook or CSV. This is a reporting and stakeholder-sharing requirement — users need to take explorer findings offline or embed them in delivery reports without re-entering data manually.

**BR-113 (Must — P1 — Done 2026-06-10):** When an admin accepts a user add-member request, the system MUST deliver a welcome email to the newly created user's email address containing their temporary password and a login link. Email delivery MUST be graceful — if SMTP is not configured the acceptance still succeeds and the admin is shown a warning. The admin MUST receive a clear confirmation of whether the email was sent (✅/⚠️ status badge). This is an onboarding communication requirement; without it, new users have no automated way to receive their credentials.

**BR-114 (Should — P1 — Done 2026-06-10):** In-app notifications relating to add-member request outcomes MUST be actionable — clicking a notification MUST navigate the user to the most relevant page: accepted-request notifications take the requester to `/members` (to see the new colleague); admin notifications take the admin to the Member Requests tab in Admin Settings. Notification links to admin settings MUST use a `?tab=requests` query parameter so the correct tab opens immediately. A non-navigable notification that requires a separate manual navigation step reduces time-to-action and creates friction in the admin workflow.

---

## Revision Note — v4.2.2 Reconciliation (2026-06-07)

This BRD carried several "v1.0" baseline statements forward into the v4.0+ document body that contradicted the "In Scope (v4.0 — Current)" section and the actual shipped product. As part of the P0 reconciliation pass:

- Section 6 "In Scope (v1.0 — Current)" was relabelled **"In Scope — v1.0 Historical Baseline (superseded by v4.0 section below)"** with an explicit pointer to the v4.0 section as the authoritative current scope.
- The "Planned P1 (Queued — Not Yet Started)" list (Calculation Reference, Clear Local Data, Dashboard Section Switcher) was corrected to **"P1 — Done / Verified"**, matching SRS FR-283–FR-285 and TODO-List.md.
- Assumption 5 ("No user authentication is required for v1.0") was corrected to reflect that authentication and role-based access are implemented and required.
- Assumption 14 ("Multi-tenancy requirements are not in scope for v1.0") was corrected to distinguish implemented multi-user support (in scope, done) from out-of-scope cross-organisation multi-tenancy.
- The audit-trail constraint ("does not record which users performed uploads, as there is no user authentication in v1.0") was corrected — `userId` is now recorded on every import log entry.
- Document version bumped to 4.2.2 and status updated to reflect the Release Candidate verification (lint/test/build all passing, 469 tests / 48 suites).

No business requirement IDs (BR-xxx) were renumbered or removed; only scope-framing and assumption/constraint language that contradicted the shipped v4.x product was corrected.

---

## Revision Note — v4.6 Roadmap, Forecast, Retro Pages + Planning Navigation (2026-06-10, P1)

**BR-115 (Must — P1 — Done 2026-06-10):** The application MUST provide a delivery roadmap view (`/roadmap`) that shows the progress and estimated completion for every epic derived from uploaded Jira data. Users need a single page where they can see which epics are on track, which are critical, and roughly when each will complete — without manually calculating from raw issue counts. Roadmap visibility is a core stakeholder expectation for any team tracking multi-epic delivery work.

**BR-116 (Must — P1 — Done 2026-06-10):** The application MUST provide a delivery forecast page (`/forecast`) that computes velocity-based delivery outlook from sprint history, renders a burn-up chart (actual + forecast + target), and gives actionable recommendations. Forecasting transforms raw throughput data into a forward-looking answer to "are we on track?" — the primary question delivery managers and C-level stakeholders ask. Without it, the dashboard is entirely backward-looking.

**BR-117 (Should — P1 — Done 2026-06-10; upload path Done 2026-06-26):** The application SHOULD provide a sprint retrospective tool (`/retro`) that allows teams to record observations and action items, download a template for offline use, and receive automated improvement suggestions on submit. Retrospective data captures learning from delivery patterns; integrating it with the existing delivery metrics tool closes the Plan → Deliver → Review cycle in one workspace. Extended 2026-06-26: teams that fill the template offline across multiple sprints can now upload it directly instead of re-typing into the form, and get the same theme/ownership-gap analysis plus a new repeated-blocker signal only visible across multiple sprints.
