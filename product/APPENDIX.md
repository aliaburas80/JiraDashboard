# Delivery Clarity — Appendix: Abbreviations & Glossary

**Audience:** Anyone reading Delivery Clarity documents, using the app, or reviewing the product.  
**Purpose:** Plain-English explanation of every abbreviation, acronym, and code used across the product.

---

## A — Priority Levels

| Code | Full Name | What It Means |
|------|-----------|---------------|
| **P0** | Priority Zero — Critical | Must be done immediately. Blocks everything else. No other work starts until P0 is resolved. |
| **P1** | Priority One — High | Important. Do right after all P0s are done. |
| **P2** | Priority Two — Medium | Valuable but not urgent. Do after all P1s. |
| **P3** | Priority Three — Low | Nice to have. Do when time allows. |
| **P4** | Priority Four — Future Communication & Governance | Future features: in-app notifications, Maintenance Mode, email/Slack channels. Do NOT implement until explicitly authorised. |

---

## B — Agile & Delivery Terms

| Abbreviation | Full Form | Plain-English Meaning |
|-------------|-----------|----------------------|
| **SP** | Story Points | A unit used to estimate effort in Agile. Not hours — it's a relative measure of complexity. Higher = more effort. |
| **ST** | Sprint | A fixed-length work cycle (usually 2 weeks) in Scrum. The team commits to a set of work at the start and delivers by the end. |
| **WIP** | Work In Progress | Items that are actively being worked on right now. High WIP = team is spread too thin. |
| **WIP Limit** | Work In Progress Limit | A rule that caps how many items can be active at once. Reduces multitasking. |
| **KPI** | Key Performance Indicator | A headline metric that shows how well delivery is going. e.g. Completion %, Health Score. |
| **SLA** | Service Level Agreement | A delivery time target agreed with stakeholders. e.g. "85% of items complete within 14 days." |
| **SLA Line** | Service Level Agreement Line | The P85 cycle time — the time within which 85% of all items are delivered. Used for planning. |

---

## C — Delivery Metrics

| Term | Full Form | Formula / Meaning |
|------|-----------|-------------------|
| **Lead Time** | Lead Time | Time from when an issue was **created** to when it was **done**. Measures end-to-end process speed. |
| **Cycle Time** | Cycle Time | Time from when work **started** (In Progress) to when it was **done**. Measures execution speed. |
| **Flow Efficiency** | Flow Efficiency | `Cycle Time ÷ Lead Time × 100`. Shows what % of the total time was spent actively working vs. waiting in queues. Higher = more efficient. |
| **Throughput** | Throughput | The number of items completed in a time period (e.g. per sprint, per month). |
| **Velocity** | Sprint Velocity | Story points completed per sprint. Used to predict how much can be delivered in future sprints. |
| **Aging WIP** | Aging Work In Progress | Items that have been actively in progress for longer than 14 days. A sign of blockers or over-commitment. |
| **Carryover** | Sprint Carryover | Items that were committed to a sprint but not completed — they carry into the next sprint. |
| **P50** | 50th Percentile (Median) | Half of all items complete faster than this. More reliable than average for planning. |
| **P75** | 75th Percentile | 75% of items complete within this time. |
| **P85** | 85th Percentile | 85% of items complete within this time. **Recommended as your delivery SLA.** |
| **P95** | 95th Percentile | 95% of items complete within this time. Worst-case scenario (excluding only the top 5%). |

---

## D — Health & Status

| Term | Meaning |
|------|---------|
| **Excellent** | Health score ≥ 90. Delivery is on track with very low risk. |
| **Good** | Health score ≥ 75. Delivery is progressing well with minor risks. |
| **Moderate** | Health score ≥ 60. Some issues need attention before they become blockers. |
| **At Risk** | Health score ≥ 40. Multiple risk signals detected. Action required. |
| **Critical** | Health score < 40. Delivery is in serious trouble. Escalation needed. |
| **Orphan Issue** | An issue with no Epic Link and no Parent Key. It is invisible in roadmap and hierarchy reporting. Treated as a delivery risk. |
| **Blocker** | An issue where the Blocked Flag is set to true. It is stuck and cannot progress without external help. |
| **Healthy Early Progress** | Mid-sprint pattern: ≥ 50% of committed work done by the sprint midpoint. Team is delivering consistently. |
| **End-Loaded Sprint** | Mid-sprint pattern: < 20% done by midpoint. Most work rushes in at the end — high risk if anything goes wrong. |
| **Scope Instability** | Mid-sprint pattern: more than 20% of committed items were added after the sprint started. |
| **Blocked Sprint** | Mid-sprint pattern: 2 or more items are blocked. Sprint velocity is constrained. |
| **Late Delivery Risk** | Mid-sprint pattern: 20–30% done by midpoint. Delivery is lagging but not yet critical. |

---

## E — Issue Types

| Type | Meaning |
|------|---------|
| **Epic** | A large body of work that groups many Stories and Tasks. Usually spans multiple sprints. |
| **Story** | A user-facing requirement or feature. Delivered within one sprint. Belongs to an Epic. |
| **Task** | A technical piece of work. Does not need to be user-visible. Belongs to a Story or Epic. |
| **Sub-task** | A smaller breakdown of a Task or Story. Belongs to a parent Task or Story. |
| **Bug** | A defect or error in existing functionality. Can be linked to a Story or exist independently. |
| **Spike** | A time-boxed investigation or research task. Does not deliver working software — delivers knowledge. |
| **Technical Debt** | Work needed to clean up, refactor, or improve existing code. Often no user-visible change. |
| **Change Request** | A request to modify agreed scope or requirements. |
| **Risk** | A tracked uncertainty that could affect delivery. |

---

## F — Goal Outcomes (Sprint)

| Outcome | Meaning |
|---------|---------|
| **Met** | Sprint completion ≥ 90%. The sprint goal was fully achieved. |
| **Partially Met** | Sprint completion ≥ 60%. Most of the sprint goal was achieved. |
| **Missed** | Sprint completion < 60% and the sprint has ended. The sprint goal was not achieved. |
| **At Risk** | Sprint completion < 60% but the sprint is still active. There is time to recover. |

---

## G — Document Codes

| Code | Full Form | What It Is |
|------|-----------|-----------|
| **BRD** | Business Requirements Document | Explains what the product must do and why, in business language. |
| **SRS** | Software Requirements Specification | Detailed technical requirements (FR-xxx numbered list). |
| **FR** | Functional Requirement | A specific numbered requirement in the SRS. e.g. FR-207. |
| **UC** | Use Case | A step-by-step description of how a user achieves a goal. e.g. UC-043. |
| **SCN** | Scenario | A real-world story of how a specific persona uses the product. e.g. SCN-012. |
| **UJ** | User Journey | A step-by-step walkthrough of a user's experience with emotional state tracking. e.g. UJ-010. |
| **TC** | Test Case | A documented test that verifies a specific behaviour. |
| **TC-T** | Test Case — Throughput | Tests for sprint throughput formula calculations. e.g. TC-T-01. |
| **TC-E** | Test Case — Explorer | Tests for the Work Item Explorer / relation graph. e.g. TC-E-01. |
| **TC-A** | Test Case — Authentication | Tests for login, logout, password, session. e.g. TC-A-01. |
| **TC-X** | Test Case — Excel Export | Tests for the 17-sheet Excel workbook. e.g. TC-X-01. |
| **GDD** | Game/Product Design Document | High-level product vision document (sometimes used interchangeably with BRD). |

---

## H — Feature Codes (Internal)

| Code | Feature Name |
|------|-------------|
| **F1** | Throughput & Delivery Analytics — sprint throughput, mid-sprint patterns, Kanban flow |
| **F2** | Work Item Explorer — visual hierarchy graph, orphan detection, relation charts |
| **F3** | Authentication & Database — login, register, SQLite, session management |
| **F4** | Smart Excel Export — 17-sheet statistical workbook, recommendation engine |

---

## I — Tech Abbreviations

| Abbreviation | Full Form | Plain-English Meaning |
|-------------|-----------|----------------------|
| **API** | Application Programming Interface | A way for two software systems to talk to each other. In this product, it means the `/api/...` endpoints. |
| **CSV** | Comma-Separated Values | A plain text file format for tabular data. One of the Jira export formats this app accepts. |
| **XLSX** | Excel Open XML Spreadsheet | Microsoft Excel file format. The other Jira export format this app accepts. |
| **DB** | Database | Where data is stored persistently. Delivery Clarity uses SQLite. |
| **ORM** | Object-Relational Mapper | A library that lets you write database queries in code instead of raw SQL. This app uses Prisma. |
| **SSR** | Server-Side Rendering | Page HTML is built on the server before sending to the browser. Next.js uses this by default. |
| **TTL** | Time To Live | How long something is valid before it expires. Sessions have an 8-hour TTL by default. |
| **HTTP-only** | HTTP-only Cookie | A browser cookie that JavaScript cannot read — only the server can. Used for session security. |
| **SameSite** | SameSite Cookie Policy | A security setting that prevents the session cookie being sent from other websites. Set to `strict`. |
| **bcrypt** | bcrypt hashing algorithm | A one-way password hashing function. Passwords stored as bcrypt hashes can never be reversed. |
| **JWT** | JSON Web Token | A common auth token format. **Delivery Clarity does NOT use JWT** — it uses iron-session cookies instead. |
| **SQLite** | SQLite | A lightweight file-based database. Used in Delivery Clarity for user accounts and import logs. |
| **Prisma** | Prisma ORM | The database library used in this app. Handles schema, migrations, and queries. |
| **iron-session** | iron-session | The session library. Stores session data in a secure, encrypted, HTTP-only cookie. |

---

## J — Roles

| Role | Access |
|------|--------|
| **user** | Can upload files, view their own dashboards, see their own import logs. |
| **admin** | All user access plus: see all users' import logs, access `/admin/logs`, `/admin/settings`, `/admin/security`, manage retention, run backup/restore. |

---

## K — v4.0 Quality & Trust Terms

| Term | Meaning |
|------|---------|
| **Data Quality Score** | A 0–100% score calculated from 10 field checks after upload. Bands: Excellent (≥90), Good (≥75), Fair (≥50), Poor (≥25), Critical (<25). Tells users how reliable their Jira export data is. |
| **Metric Confidence Score** | Per-KPI badge (High / Medium / Low / Unreliable / N/A) that shows how much to trust a specific calculated metric based on data completeness. Each badge explains which fields are missing and why they matter. |
| **Missing-column Impact** | An explanation of which Jira fields are absent from the export and which dashboard metrics are degraded as a result. Shown on the column-mapping preview and in the Data Quality section. |
| **Calculation Reference** | A section in `/developer` that documents every metric formula: what it is, where the data comes from, why it is used, the formula, assumptions, limitations, related code, and related documentation. |
| **Package Reference** | A section in `/developer` that lists all npm packages used, their versions, purpose, and risk level. |
| **Snapshot** | A saved copy of the current dashboard metrics, named and timestamped by the user. Up to 20 per user. |
| **Snapshot Comparison** | Side-by-side view of two saved snapshots showing delta values for 12 key metrics with ↑↓→ indicators. |
| **Retention Policy** | Admin-configurable rule that automatically deletes import logs older than a set number of days (7/30/90/365/never). |
| **Customer View** | A clean, stakeholder-facing summary page (`/customer`) that shows only high-level delivery health without technical detail. Designed for non-technical stakeholders. |
| **Role-based View** | One of five selectable dashboard presets (Full Report / Executive / Scrum Master / Product Owner / Engineering Manager) that show or hide dashboard sections based on the user's role. |
| **Dashboard Section Switcher** | A planned UX component that lets users show/hide/navigate dashboard sections, replacing the always-expanded view with a cleaner Overview + Section + Full View pattern. |
| **Clear Local Data** | A planned action that removes Delivery Clarity's browser-stored data (localStorage, sessionStorage, cookies) without touching server-side database records. Available in Admin settings and on the Upload page when stored data is detected. |

---

## L — Browser Storage

| Term | Meaning |
|------|---------|
| **localStorage** | Browser storage that persists after the browser is closed. Delivery Clarity stores computed metrics, filter presets, view preferences, and onboarding state here. Keyed with `dc_` prefix. |
| **sessionStorage** | Browser storage that clears when the tab is closed. Used for temporary upload flow state. |
| **Cookie** | A small piece of data stored in the browser and sent with every request. Delivery Clarity uses an HTTP-only, SameSite=strict cookie for session authentication (iron-session). |
| **FLOW_ITEMS_CAP** | The maximum number of issues stored in `localStorage` (5,000). When an export exceeds this, only the top 5,000 highest-risk items are stored; all aggregate metrics still use the full dataset. |

---

## M — Planned Features (Not Yet Implemented)

| Term | Meaning |
|------|---------|
| **Notification Center** | A planned P4 feature: in-app notifications from admin to users and from the system to admin (e.g. storage warnings, large imports). |
| **Maintenance Mode** | A planned P4 feature: admin-controlled mode that shows a maintenance screen to users while the system is being updated. |
| **S3 / Azure / GCP Storage** | A planned P3 feature: cloud storage integration for database and backup files. The current model uses local file storage. |
| **Jira API Integration** | A planned P3 feature: direct read-only connection to Jira via API. The current model remains export-based (zero-credential). |

---

*© 2026 Ali Abu Ras — aburasali80@gmail.com — Delivery Clarity v4.0*
