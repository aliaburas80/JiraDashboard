# Delivery Clarity — Business Requirements Document

---

## Document Control

| Field | Detail |
|---|---|
| **Document Title** | Delivery Clarity — Business Requirements Document |
| **Version** | 1.0 |
| **Date** | 2026-05-30 |
| **Author** | Ali Abu Ras |
| **Status** | Approved |
| **Classification** | Internal |

### Revision History

| Version | Date | Author | Description |
|---|---|---|---|
| 0.1 | 2026-04-10 | Ali Abu Ras | Initial draft — scope and objectives |
| 0.2 | 2026-04-28 | Ali Abu Ras | Added business requirements BR-001–BR-020, personas |
| 0.3 | 2026-05-12 | Ali Abu Ras | Expanded dashboard sections, business rules, risk register |
| 0.4 | 2026-05-22 | Ali Abu Ras | Incorporated roadmap items into Future Scope; added glossary |
| 1.0 | 2026-05-30 | Ali Abu Ras | Final review, all sections complete — approved for development baseline |

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

### In Scope (v1.0 — Current)

The following capabilities are in scope for the current v1.0 release of Delivery Clarity:

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

### Out of Scope (Current)

The following capabilities are explicitly not included in v1.0:

- Real-time Jira API integration or OAuth authentication with Jira Cloud or Server
- User authentication, login, or session management within the application itself
- Multi-user workspaces, team separation, or role-based access control
- Persistent storage of dashboard state between sessions (browser refresh clears state)
- Historical comparison across multiple uploads (sprint-over-sprint trending)
- Scheduled or automated report delivery via email or messaging platforms
- Native mobile application (iOS or Android)
- Custom health threshold configuration per project or team
- AI-generated delivery narrative (planned for future roadmap)
- SQLite or relational database persistence of import logs
- Multi-file or multi-project comparative analysis within a single session

### Future Scope (Roadmap Items)

The following items are identified in the product roadmap for consideration in post-v1.0 releases:

- **Jira OAuth / API token direct connection** — eliminate the manual export step; auto-refresh dashboard from live Jira data
- **Historical comparison** — sprint-over-sprint and period-over-period health trending with visualised delta charts
- **User authentication and project workspaces** — support for team-level workspaces with separated import history and saved configurations
- **Scheduled email / Slack reports** — automated delivery of Manager Quick Overview to nominated recipients on a defined schedule
- **Custom health thresholds per project** — allow teams to configure their own warning/critical thresholds for cycle time, age, and load
- **SQLite persistence** — replace the flat JSON import log with a proper SQLite store to support concurrent uploads and historical querying
- **Component refactor** — split `DashboardPage.js` into focused, independently testable sub-components
- **AI-generated delivery narrative** — integrate with the Claude API to produce a plain-language delivery narrative from all health signals

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
5. No user authentication is required for v1.0 — all users who can reach the URL are treated as authorised. Teams requiring access control will implement an authentication proxy at the network or web server layer.
6. Browser state is ephemeral — users accept that refreshing the browser clears the current dashboard and requires re-upload.
7. Jira Sprint field values in exports are assumed to be text strings (sprint names) from which sprint grouping and comparison can be derived.
8. The "Blocked Flag" signal is available only in Jira exports that include a custom "Blocked Flag" field. Teams without this custom field will only have blocking links (not the flag) as a blocking signal.
9. Story points are assumed to be numeric. Exports using T-shirt sizing (S/M/L/XL) will not yield meaningful story point metrics unless the values have been converted to numbers in Jira.
10. The import audit log file (`backend/data/import-logs.json`) is writable by the Node.js process. File system permissions are the responsibility of the deployment administrator.
11. All date fields in Jira exports are in one of the supported formats: ISO 8601, Jira short date (DD/MMM/YY), Excel serial number, or native JavaScript Date-parseable strings.
12. Users with mobile devices will primarily use the tool in a read/review capacity rather than as the primary upload path.
13. The existing React and Node.js technology stack is approved for use and no technology substitution will be required during v1.0 delivery.
14. The initial deployment is for internal use within a single organisation. Multi-tenancy requirements are not in scope for v1.0.

---

## 13. Constraints

### Technical Constraints

- **No persistent session state:** The architecture uses in-memory processing with no server-side session storage. Each upload is a stateless request. Maintaining dashboard state across browser refreshes is not technically feasible in v1.0 without a significant architectural change.
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
- **Audit trail:** The import log provides a basic audit trail of file uploads (file name, timestamp, column statistics, row count). It does not record which users performed uploads, as there is no user authentication in v1.0.

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
| RISK-05 | Browser state loss on refresh causes frustration and repeated upload work | High | Low | Clear UX messaging at upload that state is session-scoped. Roadmap item: optional localStorage persistence of the last metrics payload. |
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
