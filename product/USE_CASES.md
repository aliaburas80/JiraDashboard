# Delivery Clarity — Use Cases

## Document Control

| Field | Detail |
|---|---|
| **Document Title** | Delivery Clarity — Use Cases |
| **Version** | 1.0 |
| **Date** | 2026-05-30 |
| **Author** | Ali Abu Ras |
| **Status** | Approved |
| **Classification** | Internal |
| **Derived From** | BRD v1.0, SRS v1.0.0 |

### Revision History

| Version | Date | Author | Description |
|---|---|---|---|
| 0.1 | 2026-05-30 | Ali Abu Ras | Initial draft — all 40 use cases, actors, diagrams |
| 1.0 | 2026-05-30 | Ali Abu Ras | Final review — approved as baseline |

---

## 1. Introduction

### 1.1 Purpose

This Use Cases document specifies the complete behavioural requirements for Delivery Clarity v1.0 from the perspective of every actor who interacts with the system. It translates the business requirements captured in the BRD and the technical requirements specified in the SRS into concrete, scenario-based descriptions of how users and external systems interact with Delivery Clarity to achieve their goals.

Each use case describes a discrete unit of observable system behaviour that produces a result of value to at least one actor. Together, the 40 use cases in this document constitute the full interaction surface of Delivery Clarity v1.0.

### 1.2 Scope

This document covers every interaction available to users of the Delivery Clarity v1.0 system, including:

- File upload, parsing, and validation flows (including all error paths)
- All 14 dashboard sections and their interactive behaviours
- The Manager Quick Overview Report
- Smart Recommendations navigation
- The Flow Health table and its 11 filter dimensions
- Help Guide navigation
- Theme toggling and accessibility features
- Backend control centre and import log interactions
- All known error, rate-limit, and degraded-state scenarios

Out of scope for this document (consistent with BRD Section 6):

- Jira OAuth / API integration
- User authentication and multi-user workspaces
- Scheduled email or Slack report delivery
- Historical sprint-over-sprint comparison across separate uploads

### 1.3 How to Read Use Cases

Each use case is structured as follows:

**Header fields** — the use case identifier (UC-NNN), a concise name, acting roles, the triggering event, pre- and postconditions, and metadata (priority, frequency).

**Main Success Scenario (MSS)** — the numbered sequence of steps describing the optimal path through the interaction when everything proceeds as expected. Steps alternate between actor actions (prefixed "Actor:") and system responses (prefixed "System:").

**Alternative Flows (AF)** — labelled deviations from the MSS that still result in a successful or acceptable outcome. Referenced by step number using the notation `AF-NNN-n` where `n` is the step number at which the flow diverges.

**Exception Flows (EF)** — labelled deviations that result in an error, degraded state, or user-correctable failure. Referenced using the notation `EF-NNN-n`.

**Business Rules** — references to BRD business rules (BIZ-001 through BIZ-016) that govern system behaviour within this use case.

**Related FR IDs** — references to Functional Requirements from the SRS (FR-001 through FR-080) that implement the system steps in this use case.

### 1.4 Notation Guide

| Notation | Meaning |
|---|---|
| `«include»` | The base use case always incorporates the included use case |
| `«extend»` | The extending use case adds optional behaviour to the base use case |
| UC-NNN | Use case identifier |
| AF-NNN-n | Alternative Flow diverging at step n of use case NNN |
| EF-NNN-n | Exception Flow triggered at step n of use case NNN |
| FR-NNN | Functional Requirement from SRS |
| BIZ-NNN | Business Rule from BRD |
| BR-NNN | Business Requirement from BRD |

---

## 2. Actors

### 2.1 Primary Actors

Primary actors initiate interactions with the system to achieve a goal.

**Engineering Manager**
The principal user of Delivery Clarity. Exports Jira data, uploads files, interprets the delivery health dashboard, generates stakeholder reports, and monitors team capacity. Representative persona: Sarah Chen (BRD Section 9, Persona 1). Technically comfortable with dashboards and data terminology. Uses the tool several times per week before standups and stakeholder meetings.

**Scrum Master / Agile Coach**
Facilitates sprint ceremonies and monitors flow health for one or more squads. Primarily interested in blocked items, stale work, cycle time, and throughput. Uses quick filters, the Flow Health table, and Smart Recommendations before daily standups. Representative persona: Marcus Obinna (BRD Section 9, Persona 2). Uses the tool three or more times per week.

**Product Owner**
Reviews epic readiness, label distribution, quarterly throughput, and predictive completion to manage stakeholder expectations and release planning decisions. Uses the Readiness section, Quarter Statistics, Labels, and Manager Quick Overview. Moderate use frequency — typically once or twice per sprint.

**Director of Engineering / CTO**
Consumes the Manager Quick Overview Report produced by engineering managers. Does not typically operate the tool directly but sets the expectation that all delivery status updates are produced from Delivery Clarity outputs. Representative persona: Rachel Okonkwo (BRD Section 9, Persona 3). Low technical depth required; relies on the health score, narrative, and snapshot grid.

**Team Lead / Senior Engineer**
Uses the Ownership section to understand capacity distribution and identify overloaded peers. May inspect the Flow Health table to review individual issue health and cycle times. Occasional use — typically during sprint planning or retrospective preparation.

**Platform / DevOps Engineer**
Responsible for deploying and maintaining the self-hosted service. Primarily interacts with the backend control centre, import logs, and environment configuration. Infrequent use after initial deployment.

### 2.2 Secondary Actors

Secondary actors interact with the system but do not initiate the primary scenarios.

**Jira (External System)**
Acts as the source data provider. Produces the CSV or XLSX export files that are the sole input to Delivery Clarity. Jira is not contacted at runtime; the interaction is asynchronous — a human manually exports from Jira and then uploads to Delivery Clarity.

**Browser Print API (External System)**
Invoked by the system when the user activates print mode. Produces the print layout for PDF generation or physical printing.

**Browser Clipboard API (External System)**
Invoked by the system when the user copies an issue key or summary from the Detail Panel. Writes to the operating system clipboard.

**Browser localStorage API (External System)**
Invoked by the system when the user saves or restores a layout. Persists filter state between sessions.

**File System (External System)**
The server-side file system where `backend/data/import-logs.json` is persisted. Invoked on every upload to record audit log entries.

---

## 3. Use Case Diagram

The following ASCII art diagram illustrates the actors and their primary use cases. `«include»` relationships show mandatory sub-use-case composition; `«extend»` relationships show optional extensions.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              DELIVERY CLARITY — USE CASE DIAGRAM                           │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐                                           ┌──────────────────────────┐
│  Engineering Manager │                                           │  Scrum Master            │
│  (Sarah Chen)        │                                           │  (Marcus Obinna)         │
└──────────┬───────────┘                                           └────────────┬─────────────┘
           │                                                                    │
           │  ┌───────────────────────────────────────────────────────────────────────────┐
           │  │                         DELIVERY CLARITY SYSTEM                           │
           │  │                                                                           │
           ├──┼──► UC-001 Upload Jira Export File ─────«include»──► UC-032 Handle >20 MB│
           │  │                           │                         UC-033 Unsupported   │
           │  │                           │                         UC-034 Missing Fields│
           │  │                           │                         UC-035 Rate Limit    │
           │  │                           └──«include»──────────────► UC-036/037 Links   │
           │  │                                                                           │
           ├──┼──► UC-002 View Delivery Health Score                                     │
           ├──┼──► UC-003 Read Smart Recommendations                                     │
           ├──┼──► UC-004 View Predictive Completion                                     │
           ├──┼──► UC-005 Open Manager Quick Overview ──«include»──► UC-027 Print        │
           │  │                           │────────«extend»────────► UC-026 Copy Issue   │
           ├──┼──► UC-008 Export Risk CSV                                                │
           ├──┼──► UC-009 Save Layout View ─────«include»────────────► localStorage API │
           ├──┼──► UC-012 Toggle Dark Mode                                               │
           ├──┼──► UC-014 Drill into KPI Card ──«extend»────────────► UC-007 Flow Table │
           ├──┼──► UC-017 View Quarter Statistics                                        │
           ├──┼──► UC-020 View Capacity by Assignee                                      │
           ├──┼──► UC-039 Reset to Upload Page                                           │
           │  │                                                                           │
           │──┼──► UC-006 Apply Quick Filter ──────────«include»────► UC-007 Flow Table │
      ────────┼──► UC-007 Open Flow Health Table                                         │
           │  │              │                                                            │
           │  │              ├──«include»──────────────────────────► UC-028 Load More   │
           │  │              ├──«extend»───────────────────────────► UC-024 Filter Label│
           │  │              └──«include»──────────────────────────► UC-029 Clear Filter│
           │  │                                                                           │
      ────────┼──► UC-010 Open Help Guide                                                │
      ────────┼──► UC-011 Navigate Help Guide                                            │
      ────────┼──► UC-013 Use Section Navigator                                          │
      ────────┼──► UC-015 View Health Mix Donut                                          │
      ────────┼──► UC-016 View Delivery Composition Ring                                 │
      ────────┼──► UC-018 View Kanban Status Health                                      │
      ────────┼──► UC-019 View Sprint Status                                             │
      ────────┼──► UC-021 View Epic Readiness ────────«extend»──────► UC-025 Detail     │
      ────────┼──► UC-022 View Dependency Callouts                                       │
      ────────┼──► UC-023 View Relations / Linked Issues                                 │
      ────────┼──► UC-025 Open Detail Panel ───────«include»────────► UC-026 Copy Issue │
      ────────┼──► UC-038 View Justification                                             │
      ────────┼──► UC-040 View Attention Cards                                           │
           │  │                                                                           │
           │  └───────────────────────────────────────────────────────────────────────────┘
           │
┌──────────┴─────────────────────────────────────────────────────────────────────────────────┐
│  Product Owner  ──────────────────────────► UC-021, UC-017, UC-004, UC-005                 │
│  Director / CTO ──────────────────────────► UC-005, UC-002, UC-004 (via report)            │
│  Team Lead      ──────────────────────────► UC-020, UC-007, UC-016                         │
│  Platform / DevOps ───────────────────────► UC-030, UC-031                                 │
└────────────────────────────────────────────────────────────────────────────────────────────┘

External Systems:
  Jira ────────────────────────────────────────────────────────────► UC-001 (source)
  Browser Print API ──────────────────────────────────────────────► UC-027
  Browser Clipboard API ──────────────────────────────────────────► UC-026
  Browser localStorage API ──────────────────────────────────────► UC-009
  File System ────────────────────────────────────────────────────► UC-030, UC-031
```

---

## 4. Use Case Catalogue

---

### UC-001: Upload Jira Export File

| Field | Value |
|---|---|
| **Use Case ID** | UC-001 |
| **Name** | Upload Jira Export File |
| **Actor(s)** | Engineering Manager, Scrum Master, Product Owner, Team Lead |
| **Trigger** | The actor opens the Delivery Clarity URL and is presented with the Upload Page. The actor has previously exported a Jira backlog as a `.csv`, `.xlsx`, or `.xls` file. |
| **Preconditions** | 1. Delivery Clarity backend is running and reachable at the configured URL. 2. The actor has a valid Jira export file in `.csv`, `.xlsx`, or `.xls` format. 3. The file is 20 MB or smaller. 4. The actor has not exceeded the rate limit of 20 uploads in the past 15 minutes from their IP. |
| **Postconditions — Success** | 1. The full metrics payload has been computed and stored in React state (`dashboardData`). 2. The Dashboard Page is rendered with all 14 sections populated. 3. An import log entry with `status: 'success'` has been appended to `backend/data/import-logs.json`. 4. The actor can interact with all dashboard sections. |
| **Postconditions — Failure** | 1. The Upload Page remains displayed. 2. An error message describing the specific failure is shown. 3. An import log entry with `status: 'error'` has been appended (for validation failures; not for multer-rejected files). |
| **Priority** | High |
| **Frequency** | Multiple times per day across all users; estimated 3–10 uploads per team per week. |

**Main Success Scenario:**

1. Actor: The actor opens the Delivery Clarity URL in a browser. The Upload Page (`UploadPage.js`) is displayed.
2. System: The system presents a drag-and-drop upload zone, accepted format guidance (CSV, XLSX, XLS), and the 20 MB size limit notice.
3. Actor: The actor either drags the Jira export file onto the drop zone or clicks the zone to open a file picker and selects the file.
4. System: The browser's File API captures the selected file and `api.js` posts it as `multipart/form-data` to `POST /api/upload` with the field name `file`.
5. System: The `uploadLimiter` middleware checks the source IP against the rate-limit window. The request is within the 20-request-per-15-minute limit. Execution continues.
6. System: The `multer.single('file')` middleware inspects the file extension. The extension is `.csv`, `.xlsx`, or `.xls`. Execution continues.
7. System: The multer middleware checks the file size. The file is 20 MB or smaller. Execution continues.
8. System: `parser.js` reads the file buffer with the `xlsx` library, converts the first worksheet to an array of row objects, and runs `canonicalizeHeader()` on every column name to normalise aliases (e.g., `"Created"` → `"Created Date"`, `"Custom Field (Epic Link)"` → `"Epic Link"`). Any leading BOM character is stripped. The parser returns `{ issues, warnings, headers, sheetName }`.
9. System: `validateIssueData(issues)` confirms the presence of all four ESSENTIAL_FIELDS (`Issue Key`, `Issue Type`, `Summary`, `Status`) in at least one row. Validation passes.
10. System: `calculateDashboardMetrics(issues)` executes synchronously, computing the full metrics payload in under 200 ms for datasets up to 1,000 issues. All builder functions run in sequence.
11. System: `importLogs.js` appends an entry to `backend/data/import-logs.json` with `status: 'success'`, file metadata, detected headers, row count, and summary statistics.
12. System: The backend returns HTTP 200 with `{ metrics, issues, warnings, importLog }`.
13. System: The React frontend receives the response and calls `setDashboardData(response)`, switching from `UploadPage` to `DashboardPage`.
14. System: `DashboardPage` applies `getHealthFromIssue()` client-side to every issue to produce the `flowItems` array. All `useMemo` derivations compute synchronously.
15. System: All 14 dashboard sections render. The browser scrolls to the top of the page. The `SectionNav` component attaches `IntersectionObserver` instances to all 14 section anchor elements.
16. Actor: The actor can see the Delivery Health Score gauge, Smart Recommendations, KPI cards, and all dashboard sections.

**Alternative Flows:**

AF-001-3a — Actor uploads via direct API call (no browser UI): The actor or an automated tool posts directly to `POST /api/upload` with the file in the `file` field of a `multipart/form-data` request. The system processes the request identically from step 5 onward. The response JSON is returned directly without any browser-based rendering.

AF-001-8a — File contains unrecognised column headers: Some column headers do not match any entry in `FIELD_ALIASES`. `canonicalizeHeader()` returns those headers unchanged (as their trimmed original values). The `warnings` array in the response includes the list of OPTIONAL_FIELDS absent from the file. The dashboard renders with reduced richness in sections dependent on those fields; sections without data show "no data available" placeholders.

AF-001-8b — File is an `.xls` (legacy Excel) format: The `xlsx` library reads the BIFF8 workbook. Processing continues identically from step 8. No actor-visible difference.

AF-001-8c — File uses two-digit year values in date columns: `parseDate()` applies the year normalisation rule: years >= 70 are interpreted as 1900s; years < 70 as 2000s (BIZ-013).

AF-001-8d — File contains Excel serial number dates: `parseDate()` applies the serial range check (20,000–80,000) to identify numeric values as dates (BIZ-014).

AF-001-9a — Optional fields are missing: Validation of ESSENTIAL_FIELDS passes. The `warnings` array lists all absent OPTIONAL_FIELDS. Dashboard sections dependent on absent fields degrade gracefully. A warning notice is displayed on the Upload Page confirmation before the dashboard renders (or inline in the dashboard for affected sections).

**Exception Flows:**

EF-001-6a — Unsupported file type: The multer `fileFilter` rejects the file because its extension is not `.csv`, `.xlsx`, or `.xls`. The system returns HTTP 400: `"Unsupported file type '<ext>'. Upload a .csv, .xlsx, or .xls Jira export."` The Upload Page remains displayed with the error message. No import log entry is written. Actor must re-select a valid file. (See also UC-033.)

EF-001-7a — File exceeds 20 MB: Multer rejects the file before parsing. The system returns HTTP 413: `"File exceeds the 20 MB size limit. Export a smaller date range or reduce the number of columns."` The Upload Page remains displayed. No import log entry is written. (See also UC-032.)

EF-001-9a — Missing required fields: `validateIssueData()` identifies that one or more ESSENTIAL_FIELDS are absent. The system returns HTTP 422 with `{ error: 'Validation failed', details: ['<field>'], importLog: {...} }`. The import log entry is written with `status: 'error'`. The Upload Page is displayed with a specific error message identifying the missing field(s). (See also UC-034.)

EF-001-10a — Unhandled parse or metrics exception: An unexpected runtime error occurs during parsing or metric computation. The system returns HTTP 500: `"Unable to process Jira export file."` The error is logged to stderr. The Upload Page is displayed with a generic error message.

EF-001-5a — Rate limit exceeded: The source IP has made 20 or more upload requests within the past 15 minutes. The system returns HTTP 429 before file processing begins. (See also UC-035.)

| **Business Rules** | BIZ-010 (file format/size), BIZ-011 (rate limit), BIZ-013 (two-digit years), BIZ-014 (Excel serial dates) |
|---|---|
| **Related FR IDs** | FR-001, FR-002, FR-003, FR-004, FR-005 |

---

### UC-002: View Delivery Health Score

| Field | Value |
|---|---|
| **Use Case ID** | UC-002 |
| **Name** | View Delivery Health Score |
| **Actor(s)** | Engineering Manager, Scrum Master, Director of Engineering, Product Owner |
| **Trigger** | A successful file upload completes and the dashboard is rendered (postcondition of UC-001). |
| **Preconditions** | 1. A Jira export has been successfully uploaded. 2. The Dashboard Page is displayed (`dashboardData` is not null). |
| **Postconditions** | The actor has read and understood the composite delivery health score and its band classification for the uploaded dataset. |
| **Priority** | High |
| **Frequency** | Every dashboard session — the first element reviewed on every upload. |

**Main Success Scenario:**

1. System: The `#dashboard-summary` section is rendered at the top of the Dashboard Page. The `HealthScoreGauge` circular SVG gauge is displayed prominently, showing the integer `healthScore` (0–100) computed by `calculateHealthScore()`.
2. System: The gauge is colour-coded: green for Excellent (90–100), blue-green for Good (75–89), amber for Moderate (60–74), orange for At Risk (40–59), red for Critical (0–39). The score band label (e.g., "Moderate") is displayed adjacent to the numeral.
3. System: A health status badge in the summary bar combines the score band and the overall issue completion rate (e.g., "Moderate — 54% complete").
4. Actor: The actor reads the score, the band label, and the completion rate to form an immediate assessment of delivery health without scrolling.
5. Actor: The actor notes the colour of the gauge to assess severity at a glance before reading individual sections.

**Alternative Flows:**

AF-002-2a — Score is in the Excellent band (90–100): The gauge renders in solid green. No critical or warning Smart Recommendations may be present in the standard case (though they can still be triggered by other signals such as orphan items).

AF-002-2b — Score is in the Critical band (0–39): The gauge renders in red. The sticky filter bar is likely populated with active quick filters. Smart Recommendations typically include one or more critical-severity cards.

AF-002-5a — Actor clicks the HealthScoreGauge: Clicking the gauge triggers the same action as the "Quick Overview" button — the Manager Quick Overview modal opens. See UC-005.

**Exception Flows:**

EF-002-1a — All issues in the dataset are in Done status: `completionRate` equals 100, `criticalRatio` and `warningRatio` are both 0, `orphanRatio` may still be non-zero, and cycle time score is computed normally. The health score will typically be in the Excellent or Good band.

EF-002-1b — No sprint data is present: `latestSprintRate` falls back to the overall `completionRate`. The score is still computed and displayed; the sprint component of the formula uses the overall completion rate in place of the sprint completion rate.

| **Business Rules** | BIZ-001 (health score formula and bands) |
|---|---|
| **Related FR IDs** | FR-011, FR-031 |

---

### UC-003: Read Smart Recommendations

| Field | Value |
|---|---|
| **Use Case ID** | UC-003 |
| **Name** | Read Smart Recommendations |
| **Actor(s)** | Engineering Manager, Scrum Master |
| **Trigger** | The Dashboard Page renders after a successful upload and the `smartActions` useMemo has computed at least one recommendation. |
| **Preconditions** | 1. Dashboard Page is displayed. 2. `flowItems`, `data.capacity`, `data.relations`, and `epicReadiness` have been computed. |
| **Postconditions** | The actor has reviewed the generated action cards and taken note of the highest-priority delivery concerns. |
| **Priority** | High |
| **Frequency** | Every dashboard session — reviewed immediately after the Health Score. |

**Main Success Scenario:**

1. System: The `SmartActions` sub-component renders up to 5 (maximum 6 evaluated, capped at 5 displayed) prioritised recommendation cards below the Summary bar in priority order.
2. System: Each card displays: a severity icon, a title describing the concern, a short description with specific counts (e.g., "2 items blocked for more than 14 days"), a coloured severity badge (critical / warning / info), and a navigation button labelled with the target section.
3. Actor: The actor reads the topmost card, which represents the highest-priority delivery concern in the current dataset.
4. Actor: The actor reads subsequent cards to build a complete picture of delivery concerns ranked by severity.
5. Actor: The actor clicks the navigation button on a card to be taken directly to the relevant dashboard section and/or to have the relevant filters pre-applied.
6. System: The system executes the navigation action associated with the card. For example, clicking the "Unblock N critical items" card sets `healthFilter` to `'critical'`, sets `reasonFilter` to `'block'`, opens the Flow Health panel, and smooth-scrolls to `#flow-health-panel`.

**Alternative Flows:**

AF-003-1a — No recommendations generated: All six trigger conditions evaluate to false (no blocked critical items, no stale work, no capacity imbalance, no orphans, no critical epics, no blocked-by-link items). The SmartActions section is not rendered, or a "No current recommendations — delivery health looks good" placeholder is shown.

AF-003-1b — Fewer than 5 recommendations: Only the conditions that evaluate to true produce cards. Between 1 and 4 cards are displayed. The priority order (blocked critical → stale active → capacity imbalance → orphans → critical epics → blocked by link) is preserved.

AF-003-5a — Actor clicks the capacity imbalance card: The system scrolls to `#capacity-section` without modifying any filter state. No flow panel is opened. The actor visually reviews the bar chart showing the overloaded assignee.

AF-003-5b — Actor clicks the orphan items card: The system opens the Flow Health panel and applies a filter to show only orphan items (no Epic Link and no Parent Key).

AF-003-5c — Actor clicks the critical epics card: The system scrolls to `#section-readiness`. No flow panel filter is applied.

AF-003-5d — Actor clicks the blocked by link card: The system scrolls to `#section-relations`. The actor reviews the blocked items table.

**Exception Flows:**

EF-003-1a — `data.relations` is undefined or `hasLinks === false`: The "explicitly blocked by link" recommendation type is not evaluated. The maximum number of applicable recommendations is reduced to 5 from a possible 6.

| **Business Rules** | BIZ-008 (capacity imbalance threshold), BIZ-015 (recommendation priority order) |
|---|---|
| **Related FR IDs** | FR-007, FR-033, FR-060, FR-061, FR-062, FR-063, FR-064, FR-065 |

---

### UC-004: View Predictive Completion

| Field | Value |
|---|---|
| **Use Case ID** | UC-004 |
| **Name** | View Predictive Completion |
| **Actor(s)** | Engineering Manager, Product Owner, Director of Engineering |
| **Trigger** | The Dashboard Page renders after a successful upload. The actor locates the fourth delta card in the Summary bar. |
| **Preconditions** | 1. Dashboard Page is displayed. 2. `calculatePrediction()` has been executed and returned a non-null `daysRemaining` value. 3. At least one issue in the dataset has a non-null `Created Date`. 4. Computed daily velocity is >= 0.01 issues per day. |
| **Postconditions** | The actor has read the estimated days remaining and projected completion date and has noted the velocity per day figure used to compute it. |
| **Priority** | High |
| **Frequency** | Every dashboard session; especially reviewed before release planning or executive updates. |

**Main Success Scenario:**

1. System: The fourth delta card in `#dashboard-summary` is rendered with label "ETA", the projected completion date in "D Mon YYYY" format (e.g., "14 Aug 2026"), and the number of days remaining (e.g., "77 days").
2. System: A sub-label on the card shows the computed velocity (e.g., "1.3 issues/day") so the actor can assess prediction reliability.
3. Actor: The actor reads the projected date and compares it mentally against the committed release date or sprint target.
4. Actor: If the predicted date exceeds the committed date, the actor uses this signal to initiate risk conversations with stakeholders or team members.
5. Actor: The actor optionally opens the Help Guide to understand the velocity formula if unfamiliar with the metric.

**Alternative Flows:**

AF-004-1a — All issues are already done (`complete: true`): The prediction card shows "Complete" or "All done" rather than a future date.

AF-004-1b — Actor sees the prediction in the Manager Quick Overview: The Director or Engineering Manager views the prediction card within the Manager Quick Overview modal (UC-005). The same values are presented in the snapshot grid.

**Exception Flows:**

EF-004-0a — Prediction is suppressed (hidden card): `calculatePrediction()` returns `daysRemaining: null` because either no `Created Date` fields were present in the export, or the computed velocity was below 0.01 issues per day. The fourth delta card is not rendered. No error is shown; the card simply does not appear. The actor must interpret delivery health from other signals.

EF-004-0b — Velocity is very low but above threshold: The prediction returns a `daysRemaining` value that is very large (e.g., 900 days), which may be misleading. The velocity figure is displayed alongside the prediction so the actor can judge reliability. The Help Guide explains the formula limitations (BIZ-012).

| **Business Rules** | BIZ-012 (prediction velocity floor) |
|---|---|
| **Related FR IDs** | FR-008, FR-012, FR-031 |

---

### UC-005: Open Manager Quick Overview Report

| Field | Value |
|---|---|
| **Use Case ID** | UC-005 |
| **Name** | Open Manager Quick Overview Report |
| **Actor(s)** | Engineering Manager, Director of Engineering, Product Owner |
| **Trigger** | The actor clicks the "Quick Overview" button in the Summary bar, or clicks the HealthScoreGauge circle directly. |
| **Preconditions** | 1. Dashboard Page is displayed. 2. `showManagerReport` is `false`. |
| **Postconditions** | The Manager Quick Overview modal is displayed with all content rendered. The actor has access to a print-ready executive summary. |
| **Priority** | High |
| **Frequency** | Once per dashboard session for report-generation workflows; several times per week for regular reporting users. |

**Main Success Scenario:**

1. Actor: The actor clicks "Quick Overview" in the summary bar or clicks the HealthScoreGauge.
2. System: `setShowManagerReport(true)` is called. The `ManagerReport` modal renders over the dashboard.
3. System: The modal displays a header band with "Delivery Clarity — Executive Summary", the document title, and today's date.
4. System: The health banner is rendered with a colour-coded strip (healthy / at-risk / urgent-attention CSS class), the health status string (e.g., "At Risk"), the count of items requiring attention, and the overall completion rate percentage on the right.
5. System: The 8-cell snapshot grid is rendered: Total Issues, Done Issues (green), Active Issues (blue), Critical Items (red), Warning Items (amber), Average Lead Time (days), Average Cycle Time (days), and Story Point Completion Rate (shown only if `totalStoryPoints > 0`).
6. System: Up to 7 report rows are rendered, each showing a metric label, computed value, and a "Details →" deep-link button. The rows shown are determined by data availability (see FR-053).
7. Actor: The actor reads the health banner and snapshot grid to form an executive-level view of delivery health.
8. Actor: The actor optionally clicks "Details →" on any row to navigate to the relevant dashboard section.
9. Actor: The actor optionally clicks "Print report" to produce a print-ready layout (see UC-027).
10. Actor: The actor clicks "Back to dashboard" or the modal close button to close the report.
11. System: `setShowManagerReport(false)` is called. The modal is dismissed. The dashboard is visible again.

**Alternative Flows:**

AF-005-8a — Actor navigates to Risk Indicators detail: The modal closes. `healthFilter` is set to `'critical'`. The Flow Health panel opens. The view scrolls to `#flow-health-panel`.

AF-005-8b — Actor navigates to Sprint Status detail: The modal closes. The view scrolls to `#section-sprint`.

AF-005-8c — Actor navigates to Epic Readiness detail: The modal closes. The view scrolls to `#section-readiness`.

AF-005-8d — Actor navigates to Capacity detail: The modal closes. The view scrolls to `#capacity-section`.

AF-005-8e — Actor navigates to Labels detail: The modal closes. The view scrolls to `#section-labels`.

AF-005-8f — Actor navigates to Issue Relations detail: The modal closes. The view scrolls to `#section-relations`.

AF-005-8g — Actor navigates to Key Insights detail: The modal closes. The view scrolls to `#section-overview`.

AF-005-10a — Actor presses Escape key: The modal closes. Equivalent to clicking the close button.

AF-005-10b — Actor clicks the modal backdrop: The modal closes.

**Exception Flows:**

EF-005-6a — Certain report rows are not shown: The Capacity row is hidden when `data.capacity` has no entries. The Labels row is hidden when `topLabels.length === 0`. The Relations row is hidden when `data.relations.hasLinks === false`. The Insights row is hidden when `insights.length === 0`. These are graceful degradations, not errors.

| **Business Rules** | BIZ-001 (health score for banner) |
|---|---|
| **Related FR IDs** | FR-009, FR-010, FR-031, FR-052, FR-053, FR-054, FR-055 |

---

### UC-006: Apply Quick Filter

| Field | Value |
|---|---|
| **Use Case ID** | UC-006 |
| **Name** | Apply Quick Filter |
| **Actor(s)** | Engineering Manager, Scrum Master |
| **Trigger** | The actor clicks one of the five quick filter preset buttons in the sticky filter bar: All, High Risk, Blocked, Needs Review, or Sprint Today. |
| **Preconditions** | 1. Dashboard Page is displayed. 2. The sticky filter bar is visible (not hidden by `hideStickyFilter`). |
| **Postconditions** | The selected filter is active (`activeQuickFilter` is set to the chosen mode). The `filteredFlowItems` useMemo has recomputed. The Flow Health panel is open (except for "All"). The view has scrolled to `#flow-health-panel`. |
| **Priority** | High |
| **Frequency** | Multiple times per session; especially before standups for Scrum Masters. |

**Main Success Scenario (illustrated with "Blocked"):**

1. Actor: The actor clicks the "Blocked" quick filter button in the sticky bar.
2. System: `setActiveQuickFilter('blocked')` is called. `setReasonFilter('block')` is called. `setIsFlowPanelOpen(true)` is called.
3. System: The `filteredFlowItems` useMemo recomputes, retaining only flow items whose `reason` array contains a string matching `'block'` (case-insensitive substring).
4. System: The view smooth-scrolls to `#flow-health-panel`.
5. System: The Flow Health table renders with only the blocked items visible. The row count and a "Show N more" button (if applicable) reflect the filtered count.
6. Actor: The actor reviews blocked items, noting assignee, days active, and reason strings.

**Alternative Flows:**

AF-006-1a — Actor clicks "All": `setActiveQuickFilter('all')` is called. All 11 filter state variables are reset to their defaults. `setIsFlowPanelOpen(false)` is called (or it remains in its current state). The full unfiltered `flowItems` array is displayed.

AF-006-1b — Actor clicks "High risk": `setHealthFilter('critical')` is called. `setIsFlowPanelOpen(true)`. View scrolls to `#flow-health-panel`. Only issues with `health === 'critical'` are shown.

AF-006-1c — Actor clicks "Needs review": `setStatusFilter('in progress')` is called. `setIsFlowPanelOpen(true)`. View scrolls to `#flow-health-panel`. Only issues with `Status` containing `'in progress'` (case-insensitive) are shown.

AF-006-1d — Actor clicks "Sprint today": `setReasonFilter('today')` is called. `setIsFlowPanelOpen(true)`. View scrolls to `#flow-health-panel`. Only issues whose reason array contains the string `'today'` are shown.

AF-006-1e — Actor clicks "Clear": All 11 filter variables are reset to defaults. `setActiveQuickFilter('all')`. A transient "Filters cleared" message is shown in `reportMessage`. The `filteredFlowItems` returns the full unfiltered list.

**Exception Flows:**

EF-006-1a — No items match the selected filter: The Flow Health table renders with zero rows and a "No items match the current filters" message. The actor must broaden the filter or apply a different quick filter preset.

| **Business Rules** | None specific to this use case (filter logic is defined in FR-069). |
|---|---|
| **Related FR IDs** | FR-032, FR-048, FR-069 |

---

### UC-007: Open and Use Flow Health Table Filters

| Field | Value |
|---|---|
| **Use Case ID** | UC-007 |
| **Name** | Open and Use Flow Health Table Filters (11 filters) |
| **Actor(s)** | Engineering Manager, Scrum Master, Team Lead |
| **Trigger** | The actor opens the Flow Health panel by clicking the panel toggle, or is directed to it by a quick filter or Smart Recommendation navigation. The actor then applies one or more of the 11 filter controls to narrow the issue list. |
| **Preconditions** | 1. Dashboard Page is displayed. 2. `flowItems` array has been computed. |
| **Postconditions** | The `filteredFlowItems` array contains only the issues that satisfy all simultaneously active filter predicates. The flow table renders the filtered result set. |
| **Priority** | High |
| **Frequency** | Multiple times per session; every session for Scrum Masters using the tool for standup preparation. |

**Main Success Scenario:**

1. Actor: The actor scrolls to `#flow-health-panel` or is directed there by a navigation action.
2. System: The Flow Health panel renders. If `isFlowPanelOpen` is `false`, only the panel header is visible. If the actor has arrived via a navigation action that set `isFlowPanelOpen(true)`, the full panel including filters and table is shown.
3. Actor: The actor clicks the panel header to toggle `isFlowPanelOpen(true)` if not already open.
4. System: The filter form renders with all 11 filter inputs: Issue Key (text), Summary (text), Status (select), Sprint (select), Assignee (select), Lead Time max (number), Cycle Time max (number), Open Age max (number), Health (select), Reason (text), Labels (text).
5. Actor: The actor types "PROJ-" into the Issue Key text input.
6. System: `setKeyFilter('PROJ-')` is called. The `filteredFlowItems` useMemo recomputes immediately, retaining only issues whose `Issue Key` contains the substring `'PROJ-'` (case-insensitive).
7. System: The flow table re-renders with the filtered results. The row count updates.
8. Actor: The actor additionally selects "critical" from the Health dropdown.
9. System: `setHealthFilter('critical')` is called. `filteredFlowItems` recomputes again, now applying both the key filter and the health filter simultaneously. Only critical issues with keys containing `'PROJ-'` are shown.
10. Actor: The actor reviews the resulting filtered list.
11. Actor: The actor clicks "Reset" to clear all filters.
12. System: All 11 filter variables are reset. `setActiveQuickFilter('all')`. The full `flowItems` array is shown.

**Alternative Flows:**

AF-007-5a — Actor uses the Lead Time max filter: The actor enters `14` into the Lead Time max input. `setLeadMaxFilter('14')`. `filteredFlowItems` retains only issues where `leadTimeDays <= 14` OR `leadTimeDays` is null/zero (uncomputed, typically because required date fields were absent). A null lead time is treated as passing the filter to avoid hiding items with incomplete data.

AF-007-5b — Actor uses the Reason text filter: The actor types `'overdue'` into the Reason input. `setReasonFilter('overdue')`. `filteredFlowItems` retains only issues where any string in the `reason` array contains `'overdue'` (case-insensitive substring match).

AF-007-5c — Actor uses the Assignee select filter: The actor selects a specific assignee from the dropdown. `setAssigneeFilter('<name>')`. `filteredFlowItems` retains only issues assigned to that person.

AF-007-5d — Actor uses the Sprint select filter: The actor selects a specific sprint. `filteredFlowItems` retains only issues in that sprint (exact match against `getSprintName(issue)`).

AF-007-4a — Select option lists include only values present in the data: The Status, Sprint, Assignee, and Health select inputs are populated from `statusOptions`, `sprintOptions`, `assigneeOptions`, and `healthOptions` useMemos respectively, each computed from the full `flowItems` array. No option is listed that would yield zero results in isolation.

**Exception Flows:**

EF-007-8a — All 11 filters simultaneously return zero results: The table renders with a "No items match the current filters" empty state. The actor must click "Reset" (UC-029) to restore the full list.

| **Business Rules** | None specific; filter logic specified in FR-069. |
|---|---|
| **Related FR IDs** | FR-026, FR-048, FR-069, FR-070, FR-071 |

---

### UC-008: Export Risk Report as CSV

| Field | Value |
|---|---|
| **Use Case ID** | UC-008 |
| **Name** | Export Risk Report as CSV |
| **Actor(s)** | Engineering Manager, Scrum Master |
| **Trigger** | The actor clicks the "Export risk report" button in the Summary bar. |
| **Preconditions** | 1. Dashboard Page is displayed. 2. At least one flow item has `health === 'critical'` or `health === 'warning'`. |
| **Postconditions** | A CSV file named `jira-risk-report.csv` has been downloaded to the actor's machine containing all critical and warning health items with their key fields. |
| **Priority** | High |
| **Frequency** | Once per session when preparing retrospective input, escalation artefacts, or team discussion materials. |

**Main Success Scenario:**

1. Actor: The actor clicks "Export risk report" in the Summary bar.
2. System: The system iterates over `flowItems` and filters for items where `health === 'critical'` or `health === 'warning'`.
3. System: The system constructs a CSV string with column headers: Issue Key, Summary, Status, Health, Reason, Assignee, Sprint, Lead Time (days), Cycle Time (days), Age (days).
4. System: The system creates a `Blob` with `type: 'text/csv'`, generates a temporary object URL, creates an anchor element, sets the `download` attribute to `jira-risk-report.csv`, and triggers a programmatic click to initiate the browser download.
5. System: The temporary object URL is revoked.
6. Actor: The browser's download manager saves `jira-risk-report.csv` to the actor's default downloads directory.
7. Actor: The actor opens the CSV in Excel or a text editor for team discussion, retrospective preparation, or stakeholder escalation.

**Alternative Flows:**

AF-008-1a — Actor downloads the CSV during the Manager Quick Overview: There is no direct button within the Manager Quick Overview modal. The actor closes the modal and then clicks "Export risk report" from the Summary bar.

**Exception Flows:**

EF-008-2a — No critical or warning items exist: The filtered list is empty. The CSV file is downloaded but contains only the header row. The actor can verify this by opening the file. A "no risk items" message could be shown, but in the current implementation a zero-row CSV is the expected outcome.

| **Business Rules** | BIZ-002 (per-issue health classification thresholds — determines which items appear in the CSV) |
|---|---|
| **Related FR IDs** | FR-036 |

---

### UC-009: Save Layout View

| Field | Value |
|---|---|
| **Use Case ID** | UC-009 |
| **Name** | Save Layout View |
| **Actor(s)** | Engineering Manager, Scrum Master |
| **Trigger** | The actor has configured one or more filters and clicks "Save layout view" in the Summary bar to persist the current filter state for future sessions. |
| **Preconditions** | 1. Dashboard Page is displayed. 2. The browser's `localStorage` API is available and not restricted. 3. One or more filter state variables are set to non-default values. |
| **Postconditions** | The current filter state has been serialised and written to `localStorage` under the key `"dashboardLayout"`. On the next session, after a file upload, the saved filter state is restored. |
| **Priority** | Low |
| **Frequency** | Infrequent — typically once when setting up a preferred working view. |

**Main Success Scenario:**

1. Actor: The actor applies a set of filters (e.g., Sprint = "Sprint 22", Health = "critical") using the Flow Health table filter controls (UC-007) or quick filters (UC-006).
2. Actor: The actor clicks "Save layout view" in the Summary bar.
3. System: The current values of all 11 filter state variables and `activeQuickFilter` are serialised to a JSON object.
4. System: `localStorage.setItem('dashboardLayout', JSON.stringify(filterState))` is called.
5. System: `setLayoutSaved(true)` triggers a transient "Layout saved" feedback message in `reportMessage`.
6. Actor: The actor sees the "Layout saved" confirmation.
7. Actor: On a future session, the actor uploads a new file. The saved layout is restored from `localStorage`.
8. System: On dashboard mount, `localStorage.getItem('dashboardLayout')` is read. If a valid JSON value is found, the filter state variables are initialised to the saved values instead of their defaults.

**Alternative Flows:**

AF-009-8a — Saved layout references a sprint or assignee not present in the new file: The select filters will be set to a value not in the options list. The select renders with the saved value in the input but no matching option is highlighted. The `filteredFlowItems` useMemo returns an empty list because no item matches the stale filter value. The actor must manually reset the stale filter or click "Reset".

**Exception Flows:**

EF-009-4a — `localStorage` is not available (restricted environment): The `setItem` call throws or is silently blocked. The "Layout saved" feedback may not appear. The core dashboard functionality is unaffected. The actor cannot use the save layout feature in this environment.

| **Business Rules** | None. |
|---|---|
| **Related FR IDs** | FR-038 |

---

### UC-010: Open Help Guide

| Field | Value |
|---|---|
| **Use Case ID** | UC-010 |
| **Name** | Open Help Guide |
| **Actor(s)** | All users |
| **Trigger** | The actor clicks any Help button ("?") adjacent to a section header, or clicks the Help button in the application header. |
| **Preconditions** | Dashboard Page (or Upload Page) is displayed. |
| **Postconditions** | The Help Guide modal is open, showing the section corresponding to the triggered topic. |
| **Priority** | Medium |
| **Frequency** | Frequent for new users; occasional for experienced users encountering an unfamiliar metric. |

**Main Success Scenario:**

1. Actor: The actor clicks the "?" (HelpButton) adjacent to a section they do not understand (e.g., the "Delivery Controls" section).
2. System: `onOpenHelp('delivery')` is called. `setHelpOpen(true)` and `setHelpSection('delivery')` are called in `App.js`.
3. System: The `HelpGuide` component renders as a modal overlay. The active section is `'delivery'`. The first step of the "Delivery" journey is displayed.
4. System: The step content explains what flow efficiency, story point delivery, and the risk readout panel measure and how to interpret them.
5. Actor: The actor reads the step.

**Alternative Flows:**

AF-010-1a — Actor opens Help from the application header: `onOpenHelp('welcome')` is called. The Help Guide opens at the "Welcome" section, providing an overview of all guide topics.

AF-010-1b — Actor opens Help with no file uploaded (Upload Page): A Help button in the Upload Page header calls `onOpenHelp('welcome')`. The guide explains what the tool does and what columns to include in a Jira export.

**Exception Flows:**

None — the Help Guide is always available and has no dependencies on upload state.

| **Business Rules** | None. |
|---|---|
| **Related FR IDs** | FR-029, FR-066, FR-068 |

---

### UC-011: Navigate Help Guide Sections

| Field | Value |
|---|---|
| **Use Case ID** | UC-011 |
| **Name** | Navigate Help Guide Sections (Keyboard and Click) |
| **Actor(s)** | All users |
| **Trigger** | The Help Guide modal is open. The actor presses arrow keys or clicks section tabs to navigate between steps and sections. |
| **Preconditions** | UC-010 has been completed. The Help Guide modal is open. |
| **Postconditions** | The actor has navigated through the desired steps and sections. |
| **Priority** | Medium |
| **Frequency** | Every Help Guide session. |

**Main Success Scenario:**

1. Actor: With the Help Guide modal open on step 1 of a section, the actor presses the right arrow key.
2. System: The guide advances to step 2 of the current section. The step content and animation update.
3. Actor: The actor presses the right arrow key again to advance to step 3.
4. System: The guide advances to step 3.
5. Actor: The actor presses the left arrow key.
6. System: The guide returns to step 2.
7. Actor: The actor clicks a different section tab (e.g., "Sprint").
8. System: `setHelpSection('sprint')` is called. The guide jumps to step 1 of the Sprint section.
9. Actor: The actor clicks the close button ("×") in the guide.
10. System: `onClose()` is called. `setHelpOpen(false)`. The modal is dismissed.

**Alternative Flows:**

AF-011-1a — Actor presses right arrow on the last step of a section: The guide either stops at the last step or wraps to step 1 of the same section (implementation-defined wrap behaviour).

AF-011-1b — Actor presses left arrow on step 1: The guide stops at step 1 (no wrap to the previous section).

AF-011-10a — Actor presses Escape key: The modal closes. Equivalent to clicking the close button.

**Exception Flows:**

None.

| **Business Rules** | None. |
|---|---|
| **Related FR IDs** | FR-066, FR-067, FR-080 |

---

### UC-012: Toggle Dark Mode

| Field | Value |
|---|---|
| **Use Case ID** | UC-012 |
| **Name** | Toggle Dark Mode |
| **Actor(s)** | All users |
| **Trigger** | The actor clicks the dark/light mode toggle button in the application header. |
| **Preconditions** | Application is displayed (Upload Page or Dashboard Page). |
| **Postconditions** | The theme has toggled. The CSS class on `.app.shell` has changed between `'light'` and `'dark'`. All colours have updated to reflect the new theme. |
| **Priority** | Medium |
| **Frequency** | Once per user per environment setup; may be toggled situationally (e.g., when presenting in a dark room). |

**Main Success Scenario:**

1. System: On initial load, `App.js` checks `window.matchMedia('(prefers-color-scheme: dark)')`. If the OS is in dark mode, `theme` is initialised to `'dark'`; otherwise to `'light'`. The appropriate CSS class is applied to `.app.shell`.
2. Actor: The actor clicks the theme toggle button.
3. System: `setTheme(t => t === 'dark' ? 'light' : 'dark')` is called. The CSS class on `.app.shell` switches.
4. System: All CSS custom property overrides in `.dark` take effect. The entire UI re-renders with dark background colours, light text, and adjusted accent colours.
5. Actor: The actor can now read the dashboard comfortably in the new theme.

**Alternative Flows:**

AF-012-1a — OS theme changes while the app is open: The `mq.addEventListener('change', handler)` listener fires. `setTheme(mq.matches ? 'dark' : 'light')` is called automatically. The UI updates without any actor action.

AF-012-1b — The app has no system preference on load (e.g., browser does not support `prefers-color-scheme`): The default theme of `'light'` is applied.

**Exception Flows:**

None.

| **Business Rules** | None. |
|---|---|
| **Related FR IDs** | FR-077 |

---

### UC-013: Use Section Navigator (Floating Dots)

| Field | Value |
|---|---|
| **Use Case ID** | UC-013 |
| **Name** | Use Section Navigator (Floating Dots) |
| **Actor(s)** | All users |
| **Trigger** | The Dashboard Page is displayed. The actor either scrolls the page naturally (triggering dot highlighting) or clicks a dot to jump to a specific section. |
| **Preconditions** | Dashboard Page is displayed. The `SectionNav` component has mounted and attached `IntersectionObserver` instances to all 14 section elements. |
| **Postconditions** | The actor has navigated to the desired section. The dot corresponding to the visible section is highlighted. |
| **Priority** | Medium |
| **Frequency** | Continuous passive use during every dashboard session (dots highlight automatically as the user scrolls). |

**Main Success Scenario:**

1. System: The `SectionNav` component renders 14 coloured dots on the right edge of the viewport. Each dot is colour-coded by section category (e.g., blue for Summary, amber for Alerts, green for KPIs, teal for Kanban).
2. System: As the actor scrolls, the `IntersectionObserver` for each section fires when the section enters or leaves the viewport. The dot for the currently visible section is highlighted (larger, with a label tooltip visible on hover).
3. Actor: The actor notes that the current section is "Sprint" (indicated by the highlighted dot).
4. Actor: The actor clicks the "Readiness" dot (dot 13).
5. System: `element.scrollIntoView({ behavior: 'smooth' })` is called for `#section-readiness`. The page smooth-scrolls to that section. The Readiness dot becomes highlighted.

**Alternative Flows:**

AF-013-2a — Multiple sections are simultaneously visible (short viewport): The `IntersectionObserver` highlights the topmost visible section's dot.

**Exception Flows:**

EF-013-1a — `IntersectionObserver` is not supported by the browser: The dots render correctly but none are highlighted as the user scrolls. Clicking dots still navigates correctly. Section tracking is a progressive enhancement.

| **Business Rules** | None. |
|---|---|
| **Related FR IDs** | FR-028, FR-050 |

---

### UC-014: Drill into KPI Card

| Field | Value |
|---|---|
| **Use Case ID** | UC-014 |
| **Name** | Drill into KPI Card (Click-to-Scroll) |
| **Actor(s)** | Engineering Manager, Scrum Master, Product Owner |
| **Trigger** | The actor clicks one of the six KPI cards in `#section-overview`. |
| **Preconditions** | Dashboard Page is displayed. `#section-overview` is visible. |
| **Postconditions** | The view has scrolled to the dashboard section relevant to the clicked KPI card. |
| **Priority** | Medium |
| **Frequency** | Several times per session when exploring a metric in depth. |

**Main Success Scenario:**

1. System: The six `KpiCard` components are rendered in `#section-overview`: Completion %, Health Alerts, Active Work, Lead Time, Cycle Time, and Story Points. Each card shows the metric value, label, a threshold track bar, and a visual cue indicating it is clickable (pointer cursor, hover effect).
2. Actor: The actor clicks the "Health Alerts" KPI card, which shows a count of 7 (critical + warning items).
3. System: The `onClick` handler smooth-scrolls to `#flow-health-panel`. `setIsFlowPanelOpen(true)` may be called to ensure the panel is open.
4. Actor: The actor is taken to the Flow Health table where they can investigate the 7 health alert items in detail.

**Alternative Flows:**

AF-014-2a — Actor clicks "Completion %": Scrolls to `#flow-health-panel`.

AF-014-2b — Actor clicks "Active Work": Scrolls to `#capacity-section`.

AF-014-2c — Actor clicks "Lead Time": Scrolls to `#flow-health-panel`.

AF-014-2d — Actor clicks "Cycle Time": Scrolls to `#flow-health-panel`.

AF-014-2e — Actor clicks "Story Points": Scrolls to `#capacity-section`.

**Exception Flows:**

None — the click action is always available once the Dashboard Page is rendered.

| **Business Rules** | None. |
|---|---|
| **Related FR IDs** | FR-014, FR-035 |

---

### UC-015: View Health Mix Donut

| Field | Value |
|---|---|
| **Use Case ID** | UC-015 |
| **Name** | View Health Mix Donut |
| **Actor(s)** | Engineering Manager, Scrum Master |
| **Trigger** | The actor scrolls to `#section-visuals` or is navigated there via a Section Nav click. |
| **Preconditions** | Dashboard Page is displayed. `flowItems` has been computed with health classifications. |
| **Postconditions** | The actor has reviewed the proportional breakdown of good, warning, and critical issues. |
| **Priority** | Medium |
| **Frequency** | Once per dashboard session, during initial health assessment. |

**Main Success Scenario:**

1. System: The `HealthDonut` component renders a donut chart within `#section-visuals`. The three segments represent: good health (count), warning health (count), critical health (count). Segments are colour-coded (green / amber / red).
2. System: Each segment label shows the count and percentage.
3. Actor: The actor reads the donut to understand what proportion of the backlog is healthy versus at risk.
4. Actor: The actor hovers over a segment to see the exact count in a tooltip.

**Alternative Flows:**

AF-015-2a — All items are good health: The donut shows a single green segment at 100%. The warning and critical segments are absent or shown as zero-width arcs.

**Exception Flows:**

EF-015-1a — No issues have computable health (e.g., dataset is empty after filtering): The donut renders with an empty state placeholder.

| **Business Rules** | BIZ-002 (per-issue health thresholds). |
|---|---|
| **Related FR IDs** | FR-015, FR-036 |

---

### UC-016: View Delivery Composition Ring

| Field | Value |
|---|---|
| **Use Case ID** | UC-016 |
| **Name** | View Delivery Composition Ring |
| **Actor(s)** | Engineering Manager, Product Owner, Director of Engineering |
| **Trigger** | The actor scrolls to `#section-ratios` or navigates there via the Section Nav. |
| **Preconditions** | Dashboard Page is displayed. `flowItems` has been computed. |
| **Postconditions** | The actor has reviewed the five-segment Delivery Composition ring and understands the mutually exclusive classification of all issues. |
| **Priority** | High |
| **Frequency** | Once per session; also used when presenting to stakeholders. |

**Main Success Scenario:**

1. System: The `DeliveryCircle` sub-component renders a single SVG ring at `#section-ratios`. The ring is divided into exactly five segments: Done (green), In Progress (blue), At Risk (amber), Critical (red), Backlog (grey).
2. System: Each issue in `flowItems` has been assigned to exactly one segment using the priority order from BIZ-004: Done → Critical → At Risk → In Progress → Backlog. No issue appears in more than one segment.
3. System: Each segment displays its label, count, and percentage inside or adjacent to the arc.
4. Actor: The actor hovers over a segment to highlight it and see the exact count.
5. Actor: The actor compares the relative sizes of the Critical (red) and At Risk (amber) segments to the Done (green) segment to assess delivery confidence.

**Alternative Flows:**

AF-016-4a — Actor sees the Critical and At Risk segments together represent more than 30% of the ring: This is a strong signal of delivery risk. The actor uses the Smart Recommendations and Flow Health table to investigate.

**Exception Flows:**

EF-016-2a — All issues are in the Done segment: The ring is a solid green circle. The other segments have zero count and zero arc width.

| **Business Rules** | BIZ-004 (Delivery Composition priority order), BIZ-005 (active status definition), BIZ-006 (done status definition) |
|---|---|
| **Related FR IDs** | FR-016, FR-037 |

---

### UC-017: View Quarter Statistics

| Field | Value |
|---|---|
| **Use Case ID** | UC-017 |
| **Name** | View Quarter Statistics |
| **Actor(s)** | Engineering Manager, Product Owner, Director of Engineering |
| **Trigger** | The actor scrolls to `#section-quarters` or navigates there via the Section Nav. |
| **Preconditions** | Dashboard Page is displayed. `metrics.quarters` has been computed by `buildQuarterMetrics()`. At least one issue has a computable quarter date. |
| **Postconditions** | The actor has reviewed per-quarter throughput, completion rates, average lead and cycle times, and the top statuses for each quarter. |
| **Priority** | Medium |
| **Frequency** | Weekly for programme-level reviews; every session for Product Owners tracking quarterly delivery. |

**Main Success Scenario:**

1. System: The `#section-quarters` section renders a table with one row per quarter. Quarters are labelled `"YYYY QN"` (e.g., "2026 Q2") and sorted descending (most recent first). A `'No date'` row appears last if applicable.
2. System: Each row displays: Quarter label, Total Issues, Done Issues, Completion Rate (%), Active Issues, Average Lead Time (days), Average Cycle Time (days), Total Story Points, and the top 6 statuses by issue count for that quarter.
3. Actor: The actor reads the completion rates across quarters to identify trends (improving, deteriorating, or stable delivery cadence).
4. Actor: The actor notes if Average Cycle Time is increasing quarter-over-quarter, which may indicate process degradation.

**Alternative Flows:**

AF-017-2a — No issues have any date fields: All issues fall into the `'No date'` bucket. The quarter table shows a single row labelled `'No date'` with the full issue count. The actor is informed they need to include date columns in their export.

**Exception Flows:**

EF-017-1a — Only one quarter's data is present: The table shows a single row. No trend analysis is possible. The actor may be using a filtered export covering fewer than three months.

| **Business Rules** | None specific; quarter assignment logic defined in FR-016. |
|---|---|
| **Related FR IDs** | FR-018, FR-039 |

---

### UC-018: View Kanban Status Health

| Field | Value |
|---|---|
| **Use Case ID** | UC-018 |
| **Name** | View Kanban Status Health |
| **Actor(s)** | Scrum Master, Engineering Manager |
| **Trigger** | The actor scrolls to `#section-kanban` or navigates there. |
| **Preconditions** | Dashboard Page is displayed. `metrics.kanban.byStatus` has been computed. |
| **Postconditions** | The actor has reviewed the volume, health distribution, and timing data per workflow status. |
| **Priority** | Medium |
| **Frequency** | Weekly; before and after sprint retrospectives. |

**Main Success Scenario:**

1. System: The `#section-kanban` section renders three sub-components: a `DistributionDonut` showing volume by workflow status, a `CompactBarChart` showing the good/warning/critical breakdown per status, and a `MetricTable` showing per-status: Status name, total count, done count, warning count, critical count, average lead time, and average cycle time.
2. System: Status data is sourced from `kanban.byStatus` (grouped by the `Status` field), sorted descending by count.
3. Actor: The actor reviews the `MetricTable` to identify statuses with high critical counts (e.g., many items stuck in "Code Review" with critical health).
4. Actor: The actor notes which statuses have the highest average cycle time, indicating workflow bottlenecks.

**Alternative Flows:**

AF-018-2a — `kanban.byHighLevelStatus` is also available: A second view is offered grouped by the `High Level Status` field (status category), allowing for a higher-level view of in-flight, done, and not-started work.

**Exception Flows:**

EF-018-1a — No `Status` field present: This cannot occur because `Status` is an ESSENTIAL_FIELD. The kanban section always renders with at least one status bucket.

| **Business Rules** | BIZ-005 (active status definition), BIZ-006 (done status definition). |
|---|---|
| **Related FR IDs** | FR-015, FR-019, FR-040 |

---

### UC-019: View Sprint Status

| Field | Value |
|---|---|
| **Use Case ID** | UC-019 |
| **Name** | View Sprint Status |
| **Actor(s)** | Engineering Manager, Scrum Master |
| **Trigger** | The actor scrolls to `#section-sprint` or navigates there. |
| **Preconditions** | Dashboard Page is displayed. `metrics.sprint.hasSprintData === true`. At least one issue has a Sprint field value. |
| **Postconditions** | The actor has reviewed velocity, completion rate, and story points delivered per sprint for the top 8 sprints by completed points. |
| **Priority** | High |
| **Frequency** | Every session; specifically consulted before sprint ceremonies. |

**Main Success Scenario:**

1. System: The `#section-sprint` section renders: a `DistributionDonut` showing story points per sprint, and a `MetricTable` showing per sprint: Sprint name, Total Issues, Completed Issues, Completion Rate (%), Committed Points, Completed Points, and Point Completion Rate (%).
2. System: Data is sourced from `sprint.sprints` — the top 8 sprints sorted by `completedPoints` descending (BIZ-016).
3. Actor: The actor reviews the completion rates across sprints to understand velocity trends.
4. Actor: The actor notes if the most recent sprint has a significantly lower completion rate than the historical average, indicating a risk for the current sprint.

**Alternative Flows:**

AF-019-1a — No sprint data: `sprint.hasSprintData === false`. The section displays a "No sprint data available — include a Sprint column in your export" placeholder.

AF-019-1b — Fewer than 8 sprints in the export: All available sprints are shown. The table has fewer than 8 rows.

**Exception Flows:**

EF-019-2a — Sprint names are malformed or empty: Issues without a valid sprint name are grouped under `'No sprint'`. This bucket appears in the sprint metrics if it has the highest completed points, which would be unusual but technically possible.

| **Business Rules** | BIZ-016 (sprint metrics cap at 8). |
|---|---|
| **Related FR IDs** | FR-014, FR-041 |

---

### UC-020: View Capacity by Assignee

| Field | Value |
|---|---|
| **Use Case ID** | UC-020 |
| **Name** | View Capacity by Assignee |
| **Actor(s)** | Engineering Manager, Team Lead |
| **Trigger** | The actor scrolls to `#section-ownership` (specifically `#capacity-section`) or navigates there. |
| **Preconditions** | Dashboard Page is displayed. `metrics.capacity` has been computed. At least one issue has a non-empty `Assignee` value. |
| **Postconditions** | The actor has reviewed the top 10 assignees by issue count, their load share percentages, and their active/done breakdown. |
| **Priority** | High |
| **Frequency** | Weekly; specifically before sprint planning to check for imbalanced load. |

**Main Success Scenario:**

1. System: The Capacity by Assignee sub-section renders a `MetricTable` showing the top 10 assignees sorted by total issue count. Columns: Assignee name, Total Issues, Active Issues, Done Issues, Story Points, Done Story Points, Load Share (%).
2. System: An assignee with `loadShare > 35%` has their row visually highlighted to draw attention to the imbalance (and a Smart Recommendation card will also have been generated per UC-003).
3. Actor: The actor reviews the table to identify the most heavily loaded team member.
4. Actor: The actor compares the active issue counts across assignees to identify who has the most concurrent in-progress work.
5. Actor: The actor uses this data to make rebalancing decisions in sprint planning (e.g., reassigning newly incoming issues away from the overloaded assignee).

**Alternative Flows:**

AF-020-2a — No assignee holds more than 35%: No row is highlighted. No Smart Recommendation is generated for capacity imbalance.

AF-020-2b — Some issues have no assignee: These are grouped under `'(unassigned)'` or excluded from the capacity table, depending on implementation. The actor is informed how many issues are unassigned.

**Exception Flows:**

EF-020-1a — No `Assignee` field in the export: `metrics.capacity` is an empty array. The Capacity sub-section renders a "No assignee data available" placeholder.

| **Business Rules** | BIZ-008 (capacity imbalance threshold). |
|---|---|
| **Related FR IDs** | FR-017, FR-042 |

---

### UC-021: View Epic Readiness

| Field | Value |
|---|---|
| **Use Case ID** | UC-021 |
| **Name** | View Epic Readiness |
| **Actor(s)** | Product Owner, Engineering Manager |
| **Trigger** | The actor scrolls to `#section-readiness` or navigates there. |
| **Preconditions** | Dashboard Page is displayed. `epicReadiness` useMemo has been computed from `data.epics` and `flowItems`. At least one issue has a non-empty `Epic Link` or `Parent Key`. |
| **Postconditions** | The actor has reviewed the at-risk epics with their progress percentages and health breakdown. Optionally, the actor has opened the Detail Panel for a specific epic. |
| **Priority** | High |
| **Frequency** | Weekly before sprint planning; every session for Product Owners managing release commitments. |

**Main Success Scenario:**

1. System: The `#section-readiness` section renders a list of epics from `epicReadiness` where `risk === 'critical'` or `risk === 'warning'`, sorted by risk severity then by completion percentage ascending (least complete first).
2. System: Each epic entry shows: Epic key, progress percentage (% issues done), a health breakdown badge (N critical, N warning, N good), and a "View items" button.
3. Actor: The actor identifies the most at-risk epic (lowest progress, critical risk classification).
4. Actor: The actor clicks "View items" on that epic.
5. System: `setDetailPanel({ items: <epic's flow items>, title: '<epic key>' })` is called. The Detail Panel modal opens (UC-025).
6. Actor: The actor reviews the individual issues within the epic to understand why it is critical.

**Alternative Flows:**

AF-021-1a — All epics are healthy (good risk): The readiness section shows a "All epics on track" message. No at-risk list is rendered.

AF-021-1b — No epic data in the export: `data.epics` is an empty array. `epicReadiness` is empty. The section shows a "No epic data available — include Epic Link or Parent Key columns" message.

**Exception Flows:**

None.

| **Business Rules** | BIZ-007 (orphan item definition — epics with no children will not appear in epic metrics). |
|---|---|
| **Related FR IDs** | FR-018, FR-024, FR-046 |

---

### UC-022: View Dependency Callouts

| Field | Value |
|---|---|
| **Use Case ID** | UC-022 |
| **Name** | View Dependency Callouts |
| **Actor(s)** | Product Owner, Engineering Manager, Scrum Master |
| **Trigger** | The actor scrolls to `#section-readiness` and views the Dependency Callouts sub-section. |
| **Preconditions** | Dashboard Page is displayed. `data.relations.blockedItems` contains at least one item. `data.relations.hasLinks === true`. |
| **Postconditions** | The actor has reviewed the items explicitly blocked by inward link dependencies. |
| **Priority** | Medium |
| **Frequency** | Weekly; specifically before sprint planning and release readiness reviews. |

**Main Success Scenario:**

1. System: Within `#section-readiness`, below the at-risk epics list, a "Dependency Callouts" sub-section renders items from `data.relations.blockedItems` with callout styling. Each item shows: Issue Key, Summary, the blocking relationship type, and the health badge.
2. Actor: The actor reviews the blocked items to understand which deliverables are blocked by outstanding dependencies.
3. Actor: The actor uses this information to initiate dependency resolution conversations with other teams or external parties.

**Alternative Flows:**

AF-022-1a — No blocked items in relations: The dependency callouts sub-section renders a "No blocking dependencies detected" message or is hidden.

**Exception Flows:**

EF-022-0a — `relations.hasLinks === false`: The entire Relations and Dependency Callouts sections are hidden. The actor receives no dependency information. This occurs when the Jira export does not include issue link columns. (See UC-037.)

| **Business Rules** | BIZ-009 (link column detection). |
|---|---|
| **Related FR IDs** | FR-023, FR-044, FR-046 |

---

### UC-023: View Relations and Linked Issues

| Field | Value |
|---|---|
| **Use Case ID** | UC-023 |
| **Name** | View Relations / Linked Issues |
| **Actor(s)** | Engineering Manager, Scrum Master, Product Owner |
| **Trigger** | The actor scrolls to `#section-relations` or navigates there. |
| **Preconditions** | Dashboard Page is displayed. `data.relations.hasLinks === true`. |
| **Postconditions** | The actor has reviewed the link type distribution, the most-connected items, and the items explicitly blocked by inward blocking links. |
| **Priority** | Medium |
| **Frequency** | Weekly; specifically relevant for complex projects with significant inter-issue dependencies. |

**Main Success Scenario:**

1. System: The `#section-relations` section renders three panels. It is only rendered when `data.relations.hasLinks === true`.
2. System: Panel 1 — Link Type Distribution: A chart showing the count per link column type (e.g., "Outward issue link (Blocks): 12 links", "Inward issue link (Relates): 23 links").
3. System: Panel 2 — Most Connected Items: A table showing the top 10 issues by total link count, with Issue Key, Summary, and total link count per item.
4. System: Panel 3 — Items Explicitly Blocked: A table of up to 10 items from `data.relations.blockedItems`, showing each item blocked by an inward "Blocks" link.
5. Actor: The actor reviews the most-connected items to identify hub issues (high-centrality items that, if blocked, would cause cascading delays).
6. Actor: The actor reviews the explicitly blocked items to identify items requiring immediate unblocking attention.

**Alternative Flows:**

AF-023-2a — Only one link type is present in the export: The Link Type Distribution chart shows a single bar or segment.

**Exception Flows:**

EF-023-0a — `data.relations.hasLinks === false` (no link columns in the export): The entire `#section-relations` section is not rendered. No error is shown. (See UC-037.)

| **Business Rules** | BIZ-009 (link column detection). |
|---|---|
| **Related FR IDs** | FR-023, FR-044 |

---

### UC-024: Filter by Label in Flow Table

| Field | Value |
|---|---|
| **Use Case ID** | UC-024 |
| **Name** | Filter by Label in Flow Table |
| **Actor(s)** | Scrum Master, Engineering Manager, Product Owner |
| **Trigger** | The actor opens the Flow Health table filter form and types a label string into the Labels filter input. |
| **Preconditions** | Dashboard Page is displayed. `isFlowPanelOpen === true`. The export contains a `Labels` field on at least some issues. |
| **Postconditions** | The `filteredFlowItems` array contains only issues whose parsed label list contains a string matching the entered text. |
| **Priority** | Medium |
| **Frequency** | Occasional — used by Product Owners filtering by product area or team label. |

**Main Success Scenario:**

1. Actor: The actor opens the Flow Health panel and locates the Labels filter text input.
2. Actor: The actor types `"frontend"` into the Labels input.
3. System: `setLabelFilter('frontend')` is called. The `filteredFlowItems` useMemo recomputes. For each flow item, `parseLabels(issue)` is called to split the raw `Labels` field on `,`, `;`, or `|` delimiters. Items are retained if any parsed label contains `'frontend'` (case-insensitive substring match).
4. System: The flow table renders with only the matching items. Items with labels `"frontend, backend"` are included because one label matches. Items with only `"backend"` are excluded.
5. Actor: The actor reviews the filtered label-specific view.

**Alternative Flows:**

AF-024-2a — Actor enters a label that does not exist in the dataset: Zero rows are returned. The actor sees the empty-state message and must amend the label text or click Reset.

AF-024-2b — Actor combines label filter with health filter: Multiple filters are active simultaneously. Only items with the matching label AND the matching health value are shown.

**Exception Flows:**

EF-024-1a — `Labels` field absent from the export: All `parseLabels()` calls return empty arrays. The label filter effectively matches nothing (zero items). The actor should use a Jira export that includes the Labels column.

| **Business Rules** | None specific; label parsing logic defined in FR-019. |
|---|---|
| **Related FR IDs** | FR-019, FR-069 |

---

### UC-025: Open Detail Panel (View Items in Epic)

| Field | Value |
|---|---|
| **Use Case ID** | UC-025 |
| **Name** | Open Detail Panel (View Items in Epic) |
| **Actor(s)** | Scrum Master, Engineering Manager, Product Owner |
| **Trigger** | The actor clicks a "View items" button adjacent to an at-risk epic in `#section-readiness`, or clicks "Review high-risk items" in the Summary bar. |
| **Preconditions** | Dashboard Page is displayed. `detailPanel` is `null`. |
| **Postconditions** | The Detail Panel modal is open, displaying the list of issues in the selected scope with per-issue health data. |
| **Priority** | High |
| **Frequency** | Several times per session when investigating specific risk areas. |

**Main Success Scenario:**

1. Actor: The actor clicks "View items" next to the highest-risk epic in `#section-readiness`.
2. System: `setDetailPanel({ items: <epic's flow items filtered from flowItems>, title: '<epic key>' })` is called.
3. System: The Detail Panel modal renders over the dashboard. The modal title shows the epic key. A list of flow items is displayed with per-item fields: Issue Key, Summary, Status, Health badge, Assignee, and Reason.
4. System: For each item, if `item.url` or `item.jiraUrl` is non-null, an "Open" anchor link is rendered pointing to the Jira issue in a new browser tab.
5. System: A "Copy" button is rendered adjacent to each item.
6. Actor: The actor reviews the critical and warning items within the epic.
7. Actor: The actor clicks an "Open" link on a critical item to review it in Jira.
8. System: The Jira issue URL opens in a new browser tab.
9. Actor: The actor clicks the close button or presses Escape to close the Detail Panel.
10. System: `setDetailPanel(null)`. The modal closes.

**Alternative Flows:**

AF-025-1a — Actor opens detail from "Review high-risk items" button: The Detail Panel opens with `title: 'High-risk review'` and `items` set to the top blocked flow items (items whose `reason` array includes `'block'`).

AF-025-4a — Issue URL not present in the export: The "Open" link is not rendered for items without a `url` or `jiraUrl` field. The "Copy" button is still rendered.

AF-025-10a — Actor clicks the modal backdrop: `setDetailPanel(null)`. Modal closes.

**Exception Flows:**

EF-025-2a — The selected epic has no flow items (empty epic): `setDetailPanel({ items: [], title: '<epic key>' })`. The modal renders with an empty list and a "No items found" message.

EF-025-7a — Actor's browser blocks popups: The `target="_blank"` link opens in a new tab under normal browser settings. If the browser blocks new tabs, the actor can right-click and "Open in new tab" manually.

| **Business Rules** | None. |
|---|---|
| **Related FR IDs** | FR-035, FR-047 |

---

### UC-026: Copy Issue Key to Clipboard

| Field | Value |
|---|---|
| **Use Case ID** | UC-026 |
| **Name** | Copy Issue Key to Clipboard |
| **Actor(s)** | Scrum Master, Engineering Manager |
| **Trigger** | The actor clicks the "Copy" button on a specific issue row within the Detail Panel modal. |
| **Preconditions** | The Detail Panel modal is open (UC-025 has been completed). The browser's `navigator.clipboard` API is available. |
| **Postconditions** | The issue key (or key/summary combination) has been written to the operating system clipboard. |
| **Priority** | Low |
| **Frequency** | Occasional — used when the actor needs to reference an issue key in a Slack message, email, or Jira comment without manually typing it. |

**Main Success Scenario:**

1. Actor: The actor sees a blocked item in the Detail Panel and wants to reference it in a Slack message.
2. Actor: The actor clicks the "Copy" button on that item's row.
3. System: `navigator.clipboard.writeText('<issue key> <summary>')` is called asynchronously.
4. System: The "Copy" button briefly changes to a "Copied!" state to confirm the action.
5. Actor: The actor pastes the copied text into their Slack message.

**Alternative Flows:**

AF-026-4a — The copied text is only the issue key (not the summary): Implementation-defined; the exact text written to the clipboard may be just the issue key, or a formatted string combining key and summary.

**Exception Flows:**

EF-026-3a — `navigator.clipboard` is not available or the page is not served over HTTPS: The `writeText` call fails silently or throws. The "Copied!" feedback does not appear. The actor must manually select and copy the text from the modal.

| **Business Rules** | None. |
|---|---|
| **Related FR IDs** | FR-047 |

---

### UC-027: Print Dashboard (Manager Report)

| Field | Value |
|---|---|
| **Use Case ID** | UC-027 |
| **Name** | Print Dashboard (Manager Report) |
| **Actor(s)** | Engineering Manager, Director of Engineering |
| **Trigger** | The actor clicks "Print report" within the Manager Quick Overview modal. |
| **Preconditions** | The Manager Quick Overview modal is open (UC-005 has been completed). |
| **Postconditions** | The browser's print dialogue has been triggered. The print layout hides all interactive elements and renders the Manager Report content cleanly for PDF or paper output. |
| **Priority** | Medium |
| **Frequency** | Weekly for managers who share printed or PDF reports with stakeholders. |

**Main Success Scenario:**

1. Actor: The actor has the Manager Quick Overview modal open and has reviewed its content.
2. Actor: The actor clicks "Print report".
3. System: `window.print()` is called.
4. System: The browser's `@media print` CSS rules activate. Interactive elements are hidden: the sticky filter bar, SectionNav, ScrollToTopFab, HelpButton elements, all action buttons. The Manager Report modal content is rendered as the primary printable artefact in a clean single-column layout.
5. Actor: The browser's print dialogue opens. The actor selects "Save as PDF" or their printer.
6. Actor: The PDF or printout is shared with executive stakeholders.

**Alternative Flows:**

AF-027-1a — Actor uses the browser's native print shortcut (Ctrl+P or Cmd+P) while the modal is open: The same `@media print` rules apply. The modal content is printed cleanly.

**Exception Flows:**

EF-027-3a — `window.print()` is blocked by the browser (kiosk mode or restricted environment): The print dialogue does not open. The actor can take a screenshot as an alternative.

| **Business Rules** | None. |
|---|---|
| **Related FR IDs** | FR-010, FR-054, FR-078 |

---

### UC-028: Load More Rows in Flow Table

| Field | Value |
|---|---|
| **Use Case ID** | UC-028 |
| **Name** | Load More Rows in Flow Table |
| **Actor(s)** | Scrum Master, Engineering Manager |
| **Trigger** | The actor scrolls to the bottom of the Flow Health table and sees that `filteredFlowItems.length > flowItemVisibleCount`. The actor clicks the "Show N more" button. |
| **Preconditions** | Dashboard Page is displayed. `isFlowPanelOpen === true`. `filteredFlowItems.length > 100`. |
| **Postconditions** | `flowItemVisibleCount` has increased by 100. Up to 100 additional rows are now visible in the table. |
| **Priority** | Medium |
| **Frequency** | Occasional — occurs on large exports (> 100 issues in the filtered view). |

**Main Success Scenario:**

1. System: The Flow Health table renders 100 rows initially. The "Show N more" button displays below the table, where N = `filteredFlowItems.length - flowItemVisibleCount`.
2. Actor: The actor scrolls to the bottom of the table and clicks "Show N more".
3. System: `setFlowItemVisibleCount(c => c + 100)` is called. The table re-renders with up to 200 rows visible.
4. System: If `filteredFlowItems.length > 200`, the "Show N more" button remains visible with an updated count. If `filteredFlowItems.length <= 200`, the button is hidden.
5. Actor: The actor continues reviewing the expanded list.

**Alternative Flows:**

AF-028-3a — Clicking "Show N more" reveals all remaining rows in one step: If the remaining count is <= 100, clicking once shows all rows and hides the button permanently.

**Exception Flows:**

EF-028-1a — A filter change resets `flowItemVisibleCount`: Any change to a filter variable causes `filteredFlowItems` to recompute. `flowItemVisibleCount` resets to 100 to avoid displaying a partial page of an outdated filtered list. The actor may need to click "Show N more" again after changing filters.

| **Business Rules** | None. |
|---|---|
| **Related FR IDs** | FR-027, FR-070 |

---

### UC-029: Clear All Filters

| Field | Value |
|---|---|
| **Use Case ID** | UC-029 |
| **Name** | Clear All Filters |
| **Actor(s)** | Engineering Manager, Scrum Master |
| **Trigger** | The actor clicks the "Clear" button in the sticky filter bar, or clicks the "Reset" button in the Flow Health table filter form. |
| **Preconditions** | Dashboard Page is displayed. One or more filter state variables are set to non-default values. |
| **Postconditions** | All 11 filter state variables have been reset to their defaults. `activeQuickFilter` is `'all'`. `filteredFlowItems` returns the full unfiltered `flowItems` array. |
| **Priority** | Medium |
| **Frequency** | Every session — used whenever the actor wants to return to a full view after applying filters. |

**Main Success Scenario:**

1. Actor: The actor has applied multiple filters (e.g., health = critical, assignee = Jordan Lee, sprint = Sprint 22). The flow table shows a small number of results.
2. Actor: The actor clicks "Reset" in the flow filter form.
3. System: All filter setter functions are called with their default values: `setKeyFilter('')`, `setSummaryFilter('')`, `setStatusFilter('all')`, `setSprintFilter('all')`, `setAssigneeFilter('all')`, `setLeadMaxFilter('')`, `setCycleMaxFilter('')`, `setOpenAgeMaxFilter('')`, `setHealthFilter('all')`, `setReasonFilter('')`, `setLabelFilter('')`.
4. System: `setActiveQuickFilter('all')` is called.
5. System: `filteredFlowItems` recomputes and returns the full `flowItems` array.
6. System: The flow table re-renders with all rows visible (paginated to 100 initially).
7. Actor: The actor sees the full unfiltered issue list.

**Alternative Flows:**

AF-029-2a — Actor clicks "Clear" in the sticky bar: The same reset logic applies. Additionally, a transient "Filters cleared" confirmation message is shown in `reportMessage`.

**Exception Flows:**

None.

| **Business Rules** | None. |
|---|---|
| **Related FR IDs** | FR-032, FR-071 |

---

### UC-030: View Import History (Backend Control Centre)

| Field | Value |
|---|---|
| **Use Case ID** | UC-030 |
| **Name** | View Import History (Backend Control Centre) |
| **Actor(s)** | Platform / DevOps Engineer, Engineering Manager |
| **Trigger** | The actor opens the backend URL (default `http://localhost:4000`) in a browser, or navigates to `GET /api/upload/logs/view`. |
| **Preconditions** | The backend Node.js server is running. `backend/data/import-logs.json` is readable. |
| **Postconditions** | The actor has reviewed past import entries including file names, timestamps, status (success/error), row counts, and detected column statistics. |
| **Priority** | Low |
| **Frequency** | Infrequent — used during troubleshooting, auditing, or when verifying that uploads are being processed correctly. |

**Main Success Scenario:**

1. Actor: The actor opens `http://localhost:4000` in a browser.
2. System: The Express server handles `GET /` and calls `renderBackendHome()` from `backendView.js`.
3. System: The HTML page renders a table of all past imports from `import-logs.json`, sorted most recent first. Each row shows: import ID, timestamp, status (success / error), file name, file size, row count, column count, and a list of detected column headers.
4. System: The page includes links to: `GET /api/health`, `GET /api/upload/logs`, `GET /api/upload/logs/export`, and the frontend URL.
5. Actor: The actor reviews the import history to verify that expected uploads were processed and to identify any error patterns (e.g., a team consistently uploading files missing certain columns).

**Alternative Flows:**

AF-030-1a — Actor opens `GET /api/upload/logs` directly: The raw JSON array of import log entries is returned. The actor or an automated tool can process this programmatically.

**Exception Flows:**

EF-030-3a — `import-logs.json` is empty or does not exist: The table renders with zero rows and a "No imports yet" message.

EF-030-3b — `import-logs.json` is corrupted: The `importLogs.js` reader catches the JSON parse error and returns an empty array. The table shows zero rows. The file should be manually inspected and corrected.

| **Business Rules** | None. |
|---|---|
| **Related FR IDs** | FR-033, FR-034, FR-074, FR-075 |

---

### UC-031: Export Import Logs as Excel

| Field | Value |
|---|---|
| **Use Case ID** | UC-031 |
| **Name** | Export Import Logs as Excel |
| **Actor(s)** | Platform / DevOps Engineer |
| **Trigger** | The actor navigates to `GET /api/upload/logs/export` in a browser or via an HTTP client. |
| **Preconditions** | The backend Node.js server is running. `backend/data/import-logs.json` is readable with at least one entry. |
| **Postconditions** | An XLSX file named `import-logs.xlsx` has been downloaded containing the full import history as a spreadsheet. |
| **Priority** | Low |
| **Frequency** | Infrequent — used for governance reviews, capacity planning, or long-term audit trail analysis. |

**Main Success Scenario:**

1. Actor: The actor navigates to `http://localhost:4000/api/upload/logs/export`.
2. System: The `xlsx` library serialises the import log array to an XLSX workbook.
3. System: The backend responds with HTTP 200, `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, and `Content-Disposition: attachment; filename="import-logs.xlsx"`.
4. Actor: The browser downloads `import-logs.xlsx` to the actor's machine.
5. Actor: The actor opens the spreadsheet in Excel or Google Sheets for analysis or archiving.

**Alternative Flows:**

None.

**Exception Flows:**

EF-031-2a — `import-logs.json` is empty: An XLSX file is generated with only the header row. The download succeeds but the spreadsheet contains no data rows.

| **Business Rules** | None. |
|---|---|
| **Related FR IDs** | FR-076 |

---

### UC-032: Handle File Size Exceeded (> 20 MB)

| Field | Value |
|---|---|
| **Use Case ID** | UC-032 |
| **Name** | Handle File Size Exceeded (> 20 MB) |
| **Actor(s)** | Engineering Manager, Scrum Master |
| **Trigger** | The actor attempts to upload a Jira export file that exceeds 20 MB. |
| **Preconditions** | The actor has selected or dragged a file larger than 20 MB onto the upload zone. |
| **Postconditions** | The file is rejected before parsing. An HTTP 413 error response is returned. The Upload Page is displayed with a specific error message. No import log entry is written. |
| **Priority** | High |
| **Frequency** | Infrequent — occurs for organisations with very large backlogs (typically > 5,000 issues). |

**Main Success Scenario:**

1. Actor: The actor drags a 25 MB Jira export file onto the upload zone.
2. System: The multer middleware checks the file size: `25 MB > 20 MB`. The file is rejected.
3. System: The backend returns HTTP 413 with body: `"File exceeds the 20 MB size limit. Export a smaller date range or reduce the number of columns."`.
4. System: The Upload Page displays the error message prominently.
5. Actor: The actor reads the guidance and decides to: (a) filter their Jira export to the current quarter only, (b) remove non-essential columns from the export, or (c) split the export into multiple smaller files and upload each separately.

**Alternative Flows:**

None.

**Exception Flows:**

EF-032-5a — The actor's only available export exceeds 20 MB and cannot be reduced: The actor must wait for a future version of Delivery Clarity that supports larger files (a known roadmap item: streaming parse for large files).

| **Business Rules** | BIZ-010 (file format and size limits). |
|---|---|
| **Related FR IDs** | FR-001, FR-002 |

---

### UC-033: Handle Unsupported File Type

| Field | Value |
|---|---|
| **Use Case ID** | UC-033 |
| **Name** | Handle Unsupported File Type |
| **Actor(s)** | Engineering Manager, Scrum Master |
| **Trigger** | The actor attempts to upload a file in a format other than `.csv`, `.xlsx`, or `.xls`. |
| **Preconditions** | The actor has selected or dragged a file with an unsupported extension (e.g., `.pdf`, `.json`, `.ods`, `.zip`). |
| **Postconditions** | The file is rejected. HTTP 400 is returned. The Upload Page displays a specific error message naming the unsupported extension. No import log entry is written. |
| **Priority** | High |
| **Frequency** | Infrequent — typically occurs when a new user is unfamiliar with the accepted formats. |

**Main Success Scenario:**

1. Actor: The actor uploads a file named `jira-export.pdf`.
2. System: The multer `fileFilter` function checks the extension: `'.pdf'` is not in `['.csv', '.xlsx', '.xls']`. The file is rejected.
3. System: The backend returns HTTP 400: `"Unsupported file type '.pdf'. Upload a .csv, .xlsx, or .xls Jira export."`.
4. System: The Upload Page displays the error message.
5. Actor: The actor understands they need to export from Jira in CSV or Excel format and re-exports accordingly.

**Alternative Flows:**

AF-033-2a — Actor uploads an `.ods` (OpenDocument Spreadsheet) file: The same HTTP 400 response is returned. The actor should save their spreadsheet as `.xlsx` before uploading.

AF-033-2b — Actor uploads an `.xlsm` (macro-enabled Excel) file: HTTP 400 is returned. The actor should save as `.xlsx`.

**Exception Flows:**

None.

| **Business Rules** | BIZ-010 (accepted file extensions). |
|---|---|
| **Related FR IDs** | FR-001, FR-002 |

---

### UC-034: Handle Missing Required Fields (422 Error)

| Field | Value |
|---|---|
| **Use Case ID** | UC-034 |
| **Name** | Handle Missing Required Fields (422 Validation Error) |
| **Actor(s)** | Engineering Manager, Scrum Master |
| **Trigger** | The actor uploads a valid file format but the file does not contain one or more of the four ESSENTIAL_FIELDS: Issue Key, Issue Type, Summary, Status. |
| **Preconditions** | The actor has uploaded a `.csv`, `.xlsx`, or `.xls` file that passes format and size checks but fails ESSENTIAL_FIELD validation. |
| **Postconditions** | HTTP 422 is returned. The Upload Page displays a field-specific error message. An import log entry with `status: 'error'` is written. |
| **Priority** | High |
| **Frequency** | Occasional — occurs when the actor exports only selected columns and forgets to include a required field. |

**Main Success Scenario:**

1. Actor: The actor uploads a Jira export that was exported with only "Summary" and "Status" columns — they forgot to include "Issue Key" and "Issue Type".
2. System: The file passes format and size checks. `parser.js` parses the file successfully.
3. System: `validateIssueData(issues)` checks for the four ESSENTIAL_FIELDS. It finds that `Issue Key` and `Issue Type` are absent from all rows.
4. System: The backend returns HTTP 422: `{ "error": "Validation failed", "details": ["Issue Key", "Issue Type"], "importLog": { "status": "error", "extraction": { "validationErrors": ["Issue Key", "Issue Type"] }, ... } }`.
5. System: `importLogs.js` appends the error log entry.
6. System: The Upload Page displays: "Validation failed. The following required columns are missing from your export: Issue Key, Issue Type. Please include these columns and re-export from Jira."
7. Actor: The actor returns to Jira, selects the missing columns in the export configuration, re-exports, and re-uploads.

**Alternative Flows:**

AF-034-4a — Only one required field is missing: The `details` array contains a single field name. The error message identifies the single missing field.

**Exception Flows:**

EF-034-1a — The file is entirely empty (no rows after the header): `validateIssueData([])` returns validation failure because no row contains the required fields. HTTP 422 is returned with a message indicating zero data rows were found.

| **Business Rules** | None specific; ESSENTIAL_FIELDS list defined in FR-004. |
|---|---|
| **Related FR IDs** | FR-004 |

---

### UC-035: Handle Rate Limit Exceeded (429 Error)

| Field | Value |
|---|---|
| **Use Case ID** | UC-035 |
| **Name** | Handle Rate Limit Exceeded (429 Error) |
| **Actor(s)** | Engineering Manager, Scrum Master, Automated tools |
| **Trigger** | The actor or an automated process makes more than 20 upload requests from the same IP address within a 15-minute rolling window. |
| **Preconditions** | 20 upload requests have already been made from the actor's IP within the past 15 minutes. |
| **Postconditions** | HTTP 429 is returned. The actor cannot upload until the rate limit window resets. The Upload Page displays a wait message. |
| **Priority** | High |
| **Frequency** | Rare for human users (20 uploads in 15 minutes is atypical); possible for automated tools or CI/CD pipelines. |

**Main Success Scenario:**

1. Actor: The actor attempts a 21st upload request within a 15-minute window.
2. System: The `uploadLimiter` middleware checks the rate limit. The threshold of 20 requests per 15 minutes from this IP has been exceeded.
3. System: The backend returns HTTP 429 before any file processing: `"Too many uploads from this IP. Please wait 15 minutes before trying again."` Standard `RateLimit-*` headers are included in the response.
4. System: The Upload Page displays: "Upload limit reached. Please wait 15 minutes before uploading again."
5. Actor: The actor waits for the rate limit window to reset before attempting another upload.

**Alternative Flows:**

AF-035-5a — Actor uses a different network (different IP): The rate limit is per IP. An actor who switches from their office network to a mobile hotspot would have a fresh rate limit window for that IP.

**Exception Flows:**

EF-035-2a — CI/CD pipeline exhausts the rate limit: The pipeline's calls are rejected. A developer must update the pipeline to reduce upload frequency or implement a configurable rate-limit override. This is a known future roadmap item: configurable rate limit per IP range.

| **Business Rules** | BIZ-011 (rate limiting). |
|---|---|
| **Related FR IDs** | FR-001, FR-032 |

---

### UC-036: Upload File with Linked Issue Columns (Relations Populated)

| Field | Value |
|---|---|
| **Use Case ID** | UC-036 |
| **Name** | Upload File with Linked Issue Columns (Relations Populated) |
| **Actor(s)** | Engineering Manager, Scrum Master |
| **Trigger** | The actor uploads a Jira export that includes one or more issue link columns (e.g., `Inward issue link (Blocks)`, `Outward issue link (Blocks)`). |
| **Preconditions** | 1. The actor has exported from Jira with issue link columns included. 2. At least one cell in the link columns is non-empty. 3. `buildLinksMetrics()` detects columns matching `/issue\s*link/i` and finds `totalLinks > 0`. |
| **Postconditions** | `data.relations.hasLinks === true`. The `#section-relations` section is rendered. The `#section-readiness` dependency callouts are populated. Smart Recommendations may include the "explicitly blocked" card. |
| **Priority** | Medium |
| **Frequency** | Whenever the Jira export is configured to include link columns — recommended as standard practice. |

**Main Success Scenario:**

1. Actor: The actor exports from Jira using "Export → Excel (all fields)" which automatically includes all issue link columns.
2. Actor: The actor uploads the file.
3. System: `buildLinksMetrics(issues)` detects columns matching the link pattern. It finds non-empty link values. `hasLinks` is set to `true`. `totalLinks`, `itemsWithLinks`, `linkTypes`, `mostLinked`, and `blockedItems` are all computed.
4. System: The `#section-relations` section renders with all three panels (link type distribution, most connected items, explicitly blocked items).
5. System: If `blockedItems` has entries, the "Dependency callouts" sub-section in `#section-readiness` is populated.
6. System: If `blockedItems.length > 0`, a Smart Recommendation card "N items explicitly blocked" is generated (UC-003, FR-065).
7. Actor: The actor reviews the relations section to understand inter-issue dependencies.

**Alternative Flows:**

AF-036-3a — Export includes link columns but all cells are empty: `buildLinksMetrics()` finds the matching columns but `totalLinks === 0`. `hasLinks` is set to `false`. The Relations section is not rendered. This is equivalent to UC-037.

**Exception Flows:**

None.

| **Business Rules** | BIZ-009 (link column detection). |
|---|---|
| **Related FR IDs** | FR-023, FR-044, FR-065 |

---

### UC-037: Upload File Without Linked Issue Columns (Empty State)

| Field | Value |
|---|---|
| **Use Case ID** | UC-037 |
| **Name** | Upload File Without Linked Issue Columns (Empty State Shown) |
| **Actor(s)** | Engineering Manager, Scrum Master |
| **Trigger** | The actor uploads a Jira export that does not include any issue link columns (e.g., a minimal export with only the four required fields and a few optional fields). |
| **Preconditions** | The uploaded file contains no columns whose name matches `/issue\s*link/i`, OR all link columns are present but contain only empty cells. |
| **Postconditions** | `data.relations.hasLinks === false`. The `#section-relations` section is not rendered. No dependency callouts appear in `#section-readiness`. No "explicitly blocked by link" Smart Recommendation is generated. |
| **Priority** | Medium |
| **Frequency** | Common — many users export a reduced set of columns and do not include link columns. |

**Main Success Scenario:**

1. Actor: The actor uploads a minimal Jira CSV with only the four required fields and a few standard fields, none of which are link columns.
2. System: `buildLinksMetrics(issues)` finds no columns matching `/issue\s*link/i`. `hasLinks` is set to `false`. All other relation fields are empty defaults.
3. System: `metrics.relations.hasLinks === false`. The dashboard renders without the `#section-relations` section. No error is shown.
4. System: `#section-readiness` renders without the dependency callouts sub-section.
5. Actor: The actor notes the absence of the Relations section and, if relations are important for their analysis, re-exports from Jira with link columns included.

**Alternative Flows:**

None.

**Exception Flows:**

None — this is a graceful degradation, not an error state.

| **Business Rules** | BIZ-009 (link column detection). |
|---|---|
| **Related FR IDs** | FR-020, FR-023, FR-044 |

---

### UC-038: View Justification / Plain-Language Summary

| Field | Value |
|---|---|
| **Use Case ID** | UC-038 |
| **Name** | View Justification / Plain-Language Delivery Narrative |
| **Actor(s)** | Engineering Manager, Director of Engineering, Product Owner |
| **Trigger** | The actor scrolls past the Relations section to the Justification panel, or navigates to it via a Manager Report "Key Insights → Details" link. |
| **Preconditions** | Dashboard Page is displayed. `metrics.insights` contains at least one string. |
| **Postconditions** | The actor has read the plain-language narrative summarising the key delivery signals from the upload. |
| **Priority** | Medium |
| **Frequency** | Once per session; primarily reviewed before writing stakeholder updates or preparing for ceremonies. |

**Main Success Scenario:**

1. System: The Justification panel (`class: panel-justification`) renders between the Relations section and the Readiness section. It contains the `insights` array rendered as styled paragraph text (up to 5 insight strings).
2. System: Insight strings are generated by `buildInsights(metrics)` covering: lead time observations (e.g., "Average lead time is 18 days, which is above the recommended 14-day threshold."), cycle time observations, sprint data presence, critical item count, warning item count, and story point completion rate.
3. Actor: The actor reads the plain-language summary to understand which signals are most significant in the current dataset.
4. Actor: The actor uses specific sentences from the insights as input to their own stakeholder narrative.

**Alternative Flows:**

AF-038-2a — No noteworthy conditions exist (all signals are within healthy ranges): `buildInsights()` may return an empty array or a single positive insight (e.g., "Delivery health looks good — all key metrics are within healthy thresholds."). The panel renders with only the positive insight.

**Exception Flows:**

EF-038-1a — `insights` is an empty array: The Justification panel either renders with an empty state message or is hidden. The actor can use the Manager Quick Overview "Key Insights" row, which also draws from the `insights` array.

| **Business Rules** | None specific; insight generation logic defined in FR-025. |
|---|---|
| **Related FR IDs** | FR-025, FR-045 |

---

### UC-039: Reset to Upload Page

| Field | Value |
|---|---|
| **Use Case ID** | UC-039 |
| **Name** | Reset to Upload Page |
| **Actor(s)** | Engineering Manager, Scrum Master |
| **Trigger** | The actor clicks "Upload new file" or an equivalent reset button on the Dashboard Page to return to the Upload Page and start a new analysis session. |
| **Preconditions** | Dashboard Page is displayed (`dashboardData` is not null). |
| **Postconditions** | `dashboardData` has been reset to `null`. The Upload Page is displayed. All React filter state is cleared. |
| **Priority** | Medium |
| **Frequency** | Once per new upload session — each time the actor wants to analyse a different Jira export. |

**Main Success Scenario:**

1. Actor: The actor has reviewed the dashboard for the current export and wants to upload a newer export.
2. Actor: The actor clicks "Upload new file" (or equivalent) in the dashboard header or summary bar.
3. System: `onReset()` is called in `App.js`. `setDashboardData(null)` is called.
4. System: React re-renders the application. Since `dashboardData` is `null`, `App.js` renders `UploadPage` instead of `DashboardPage`.
5. System: All filter state variables in `DashboardPage` are implicitly cleared because the component unmounts.
6. Actor: The Upload Page is displayed. The actor can upload a new file.

**Alternative Flows:**

AF-039-2a — Actor refreshes the browser: The browser discards all React state (including `dashboardData`). The Upload Page is displayed on reload. This is equivalent to clicking "Upload new file" but also discards any `localStorage` session data if the save-layout feature was not used.

**Exception Flows:**

None.

| **Business Rules** | None. |
|---|---|
| **Related FR IDs** | FR-031 |

---

### UC-040: View Attention Cards (Blockers, Overdue, Orphans)

| Field | Value |
|---|---|
| **Use Case ID** | UC-040 |
| **Name** | View Attention Cards (Blockers, Overdue, Orphans) |
| **Actor(s)** | Scrum Master, Engineering Manager |
| **Trigger** | The Dashboard Page renders after a successful upload. The actor scrolls to `#section-attention` or views the section near the top of the dashboard. |
| **Preconditions** | Dashboard Page is displayed. `flowItems` has been computed. At least one issue is blocked, overdue, or orphaned. |
| **Postconditions** | The actor has reviewed the top three items in each of the three attention categories (blockers, overdue, orphans) and identified the most urgent items requiring action. |
| **Priority** | High |
| **Frequency** | Every dashboard session — one of the first sections reviewed after the Health Score and Smart Recommendations. |

**Main Success Scenario:**

1. System: The `#section-attention` section renders three highlight cards:

   **Card 1 — Top Blockers:** Displays the top 3 flow items where `isBlocked === true` (i.e., `Blocked Flag === true`). Each item shows: Issue Key, Summary, health badge (always critical for blocked items), and Assignee.

   **Card 2 — Overdue Items:** Displays the top 3 flow items where `isOverdue === true` (Due Date in the past and not done). Each item shows: Issue Key, Summary, Due Date, and days overdue.

   **Card 3 — Orphan Items:** Displays the top 3 flow items where `isOrphan === true` (no `Epic Link` and no `Parent Key`). Each item shows: Issue Key, Summary, Status, and health badge.

2. System: Each card includes a HelpButton calling `onOpenHelp('attention')` for that card.
3. Actor: The actor reads Card 1 (blockers) to identify the most critical blocked items before standup.
4. Actor: The actor notes the assignees for blocked items to raise them in the standup.
5. Actor: The actor reads Card 2 (overdue items) to identify any commitments that have passed their due date.
6. Actor: The actor reads Card 3 (orphan items) to identify issues not linked to any epic or parent — work that will not appear in roadmap or programme-level reporting.
7. Actor: The actor clicks the Issue Key deep-link on an orphan item (if Jira URL is present) to navigate to the issue in Jira and add the correct Epic Link.

**Alternative Flows:**

AF-040-1a — No blocked items: Card 1 renders with an "All clear — no blocked items" state or is visually muted.

AF-040-1b — No overdue items: Card 2 renders with an "All clear — no overdue items" state.

AF-040-1c — No orphan items: Card 3 renders with an "All clear — no orphan items" state.

AF-040-1d — Fewer than 3 items in a category: Only the available items are shown. The card does not pad to 3 items.

**Exception Flows:**

EF-040-1a — `Blocked Flag` field absent from the export: All `isBlocked` values are `false`. Card 1 shows an "All clear" state. Blocking detection relies only on inward blocking links (if present). The actor should include the `Blocked Flag` custom field in their Jira export to get accurate blocking data.

EF-040-1b — `Due Date` field absent from the export: All `isOverdue` values are `false`. Card 2 shows an "All clear" state. Due date analysis requires the `Due Date` column in the export.

| **Business Rules** | BIZ-002 (health classification — blocked flag sets critical), BIZ-006 (done status for overdue calculation), BIZ-007 (orphan definition). |
|---|---|
| **Related FR IDs** | FR-013, FR-024, FR-034 |

---

## 5. Use Case Relationships

### 5.1 Include Relationships

An `«include»` relationship indicates that the base use case always and unconditionally executes the included use case as part of its normal flow. The included use case is a mandatory sub-behaviour.

| Base Use Case | Included Use Case | Inclusion Point | Rationale |
|---|---|---|---|
| UC-001 (Upload Jira Export) | UC-032 (Handle > 20 MB) | Step 7 — multer size check | Every upload must pass the size check; failure leads to the EF-001-7a exception flow |
| UC-001 (Upload Jira Export) | UC-033 (Unsupported File Type) | Step 6 — multer fileFilter | Every upload must pass the format check; failure leads to EF-001-6a |
| UC-001 (Upload Jira Export) | UC-034 (Missing Required Fields) | Step 9 — `validateIssueData()` | Every upload is validated for ESSENTIAL_FIELDS; failure leads to EF-001-9a |
| UC-001 (Upload Jira Export) | UC-035 (Rate Limit Exceeded) | Step 5 — `uploadLimiter` middleware | Every upload checks the rate limit; failure leads to EF-001-5a |
| UC-001 (Upload Jira Export) | UC-036 or UC-037 (Links present/absent) | Step 10 — `buildLinksMetrics()` | Every upload executes link detection; outcome determines whether relations section renders |
| UC-005 (Manager Quick Overview) | UC-027 (Print Dashboard) | Step 9 — "Print report" button | Print is only accessible from within the Manager Report modal |
| UC-007 (Flow Health Table) | UC-028 (Load More Rows) | Flow table render — "Show N more" | Pagination is an intrinsic behaviour of the flow table whenever > 100 filtered rows exist |
| UC-007 (Flow Health Table) | UC-029 (Clear All Filters) | Flow table filter form — "Reset" button | Reset is a mandatory function of the filter form |
| UC-009 (Save Layout View) | Browser localStorage API | Step 4 — `localStorage.setItem()` | Layout saving is implemented exclusively via the localStorage API |
| UC-025 (Open Detail Panel) | UC-026 (Copy Issue Key) | Detail Panel — "Copy" button per row | The copy action is available on every row within the Detail Panel |

### 5.2 Extend Relationships

An `«extend»` relationship indicates that the extending use case adds optional behaviour to the base use case at a specific extension point. The extension only occurs under specific conditions.

| Base Use Case | Extending Use Case | Extension Point | Condition |
|---|---|---|---|
| UC-002 (View Health Score) | UC-005 (Open Manager Report) | Actor clicks the HealthScoreGauge | The actor must click the gauge element; clicking is optional |
| UC-006 (Apply Quick Filter) | UC-007 (Flow Health Table) | Any quick filter except "All" | Filter presets "High Risk", "Blocked", "Needs Review", "Sprint Today" open the flow panel; "All" does not |
| UC-014 (Drill into KPI Card) | UC-007 (Flow Health Table) | Actor clicks Completion %, Health Alerts, Lead Time, or Cycle Time KPI | Only cards that navigate to the flow panel extend this way; Active Work and Story Points navigate to Capacity section instead |
| UC-021 (View Epic Readiness) | UC-025 (Open Detail Panel) | Actor clicks "View items" button | The Detail Panel opens only when the actor explicitly clicks the button; viewing the readiness section does not automatically open the panel |
| UC-005 (Manager Quick Overview) | UC-026 (Copy Issue Key) | Actor opens a deep-link from the report, arrives at Detail Panel | The copy action is only available within Detail Panel context |
| UC-003 (Read Smart Recommendations) | UC-006 (Apply Quick Filter) | Actor clicks a Smart Recommendation navigation button | Navigation action is optional; the actor may read cards without clicking |
| UC-040 (View Attention Cards) | UC-025 (Open Detail Panel) | Actor clicks a detail link on an attention card item | Navigating to the detail for a specific blocked/overdue/orphan item is optional |

### 5.3 Generalisation Relationships

All use cases in this document that involve a navigation action within the dashboard (UC-013, UC-014, UC-052, and the navigation steps within UC-003, UC-005, UC-006) share a common generalised behaviour: **Navigate to Dashboard Section**. This common behaviour consists of:
1. Identifying the target section anchor ID.
2. Calling `element.scrollIntoView({ behavior: 'smooth' })`.
3. Optionally setting one or more filter state variables before scrolling.
4. Optionally opening the Flow Health panel (`setIsFlowPanelOpen(true)`).

This shared behaviour is implemented inline at each navigation call site in `DashboardPage.js` rather than as a separately extracted component, but its consistent pattern is recognised here for traceability purposes.

### 5.4 Dependency Chain: Upload to Full Dashboard

The following dependency chain shows how the upload event (UC-001) is the root trigger for the majority of use cases in this document:

```
UC-001 (Upload Jira Export File)
│
├── «creates» dashboardData (metrics + issues + warnings)
│
├── enables ──► UC-002 View Delivery Health Score
├── enables ──► UC-003 Read Smart Recommendations
├── enables ──► UC-004 View Predictive Completion
├── enables ──► UC-005 Open Manager Quick Overview ──► UC-027 Print
├── enables ──► UC-006 Apply Quick Filter ──────────► UC-007 Flow Table
├── enables ──► UC-008 Export Risk CSV
├── enables ──► UC-009 Save Layout View
├── enables ──► UC-012 Toggle Dark Mode (also available pre-upload)
├── enables ──► UC-013 Use Section Navigator
├── enables ──► UC-014 Drill into KPI Card
├── enables ──► UC-015 View Health Mix Donut
├── enables ──► UC-016 View Delivery Composition Ring
├── enables ──► UC-017 View Quarter Statistics
├── enables ──► UC-018 View Kanban Status Health
├── enables ──► UC-019 View Sprint Status
├── enables ──► UC-020 View Capacity by Assignee
├── enables ──► UC-021 View Epic Readiness ──────────► UC-025 Detail Panel ──► UC-026 Copy
├── enables ──► UC-022 View Dependency Callouts
├── enables ──► UC-023 View Relations
├── enables ──► UC-024 Filter by Label
├── enables ──► UC-038 View Justification
├── enables ──► UC-039 Reset to Upload Page
└── enables ──► UC-040 View Attention Cards
```

Use cases UC-010 (Open Help Guide), UC-011 (Navigate Help Guide), and UC-012 (Toggle Dark Mode) are available on both the Upload Page and the Dashboard Page and therefore are not strictly dependent on UC-001.

Use cases UC-030 (View Import History) and UC-031 (Export Import Logs) are available independently of any upload session and depend only on the backend server being running.

---

*Document prepared by Ali Abu Ras — Delivery Clarity v1.0 — 2026-05-30*

---

## New Use Cases — v1.1 (2026-05-30)

### UC-041: View Summary Page After Upload

- **ID:** UC-041
- **Name:** View Summary Page After Upload
- **Actor(s):** All authenticated users
- **Trigger:** File upload completes successfully (POST /api/upload returns 200)
- **Preconditions:** A valid Jira CSV or XLSX file has been uploaded and processed
- **Postconditions:** User is viewing /summary with current data metrics
- **Priority:** High
- **Frequency:** Every upload

**Main Success Scenario:**
1. System processes uploaded file and calls navigate('/summary')
2. Browser URL changes to /summary
3. SummaryPage renders with health banner (score, band, status label)
4. Six KPI cards render with correct values
5. Attention section renders if blockers/overdue/orphans > 0
6. Prediction chip shows estimated completion if velocity available
7. Top 4 insights render
8. CTA buttons render: "Upload new file" and "View Full Report →"

**Alternative Flow A — All items complete:**
- Health score is 95+, prediction chip shows "100% · All issues complete ✅"
- No attention section visible

**Alternative Flow B — No date data for prediction:**
- Prediction chip is not rendered

**Exception Flow X — dashboardData is null:**
- User navigates directly to /summary URL
- System redirects to / (upload page)

---

### UC-042: Navigate to Help Page

- **ID:** UC-042
- **Name:** Navigate to Help Page
- **Actor(s):** Any user
- **Trigger:** Clicks Help button in header OR clicks a ? context button in the dashboard
- **Preconditions:** None — /help is unprotected
- **Postconditions:** User is reading the help page at /help or /help?section=xxx
- **Priority:** High
- **Frequency:** Multiple times per session for new users

**Main Success Scenario (Help button):**
1. User clicks Help button in AppHeader
2. App calls navigate('/help?section=welcome')
3. Browser navigates to /help?section=welcome
4. HelpPage reads section param via useSearchParams()
5. HelpGuide renders in pageMode=true (no backdrop, no overlay)
6. Welcome journey is shown as first section

**Main Success Scenario (? context button):**
1. User clicks ? button next to "KPIs" section heading
2. App calls openHelp('kpis') → navigate('/help?section=kpis')
3. Browser navigates to /help?section=kpis
4. HelpGuide opens with KPIs tab selected and step 1 visible

**Return flow:**
1. User clicks "← Back"
2. navigate(-1) returns to previous page
3. Previous page context (scroll position may be lost)

---

### UC-043: Return from Full Report to Summary

- **ID:** UC-043
- **Name:** Return from Full Report to Summary
- **Actor(s):** Engineering Manager, Scrum Master
- **Trigger:** Clicks "← Back to Overview" breadcrumb in DashboardPage
- **Preconditions:** User is on /dashboard with dashboardData loaded
- **Postconditions:** User is on /summary; all data unchanged
- **Priority:** Medium
- **Frequency:** Several times per session

**Main Success Scenario:**
1. User is on /dashboard viewing the full report
2. User clicks "← Back to Overview" button
3. navigate('/summary') is called
4. Browser navigates to /summary
5. SummaryPage renders with the same data (no re-fetch needed)
6. User can click "View Full Report →" to return to /dashboard

---

### UC-044: Direct URL Access to Protected Route Without Data

- **ID:** UC-044
- **Name:** Redirect When No Data Loaded
- **Actor(s):** Any user
- **Trigger:** User types /summary or /dashboard directly in browser address bar
- **Preconditions:** dashboardData is null (no file has been uploaded in this session)
- **Postconditions:** User is on / (upload page) with no error shown
- **Priority:** High
- **Frequency:** Occasional (bookmarked URLs, shared links)

**Main Success Scenario:**
1. User navigates to /summary or /dashboard directly
2. React Router evaluates the route
3. dashboardData is null → <Navigate to="/" replace /> executes
4. Browser URL changes to /
5. UploadPage renders with normal state
6. No error message shown — just the upload UI
