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
| **user** | Legacy/open-registration role. Can upload files, view dashboards, and see own import logs. |
| **admin** | Full system access: manage users, see all import logs, access `/admin/logs`, `/admin/settings`, `/admin/security`, manage retention, run backup/restore. |
| **scrum_master** | Scrum Master role. Defaults to the Scrum Master dashboard view; sees own uploads/import logs. |
| **product_owner** | Product Owner role. Defaults to the Product Owner dashboard view; sees own uploads/import logs. |
| **manager** | Manager role. Defaults to the Engineering Manager dashboard view; can request all import logs. |
| **c_level** | C-level/executive role. Defaults to the Executive dashboard view; can request all import logs. |
| **Role Scope** | The data visibility rule attached to a role. Admin, Manager, and C-level can request all import logs; Scrum Master/Product Owner/user are scoped to their own uploads. |
| **Route Scope** | The page visibility rule attached to a role. AppShell hides routes outside the user's role, and middleware blocks direct URL access to disallowed protected pages. |
| **Member Profile** | The team-facing profile each logged-in user edits on `/profile`: name, position, profile image, contact details, certificates, and shared notes. Profile images uploaded from the app are stored in S3 under `images/profile/`. |
| **Member Directory** | The `/members` route for logged-in users. It lists active users and opens a detail popup with role, position, contact info, certificates, and shared team info. |

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

## L — P2 Analytics Scores (v4.1)

| Term | Full Form | Meaning |
|------|-----------|---------|
| **Release Confidence Score** | — | A 0–100 score computed per upload representing readiness to release. Weighted formula: completion (55 pts) + no-blockers (25 pts) + no-critical (12 pts) + no-defects (8 pts). Shown on /trends as a trend line. |
| **RC Band** | Release Confidence Band | High ≥ 80 / Medium ≥ 60 / Low ≥ 40 / Critical < 40 |
| **Team Health Score** | — | A 0–100 score per assignee: completion (50 pts) + no-critical (30 pts) + no-blocked (20 pts). Shown on /teams. |
| **Team Band** | Team Health Band | Healthy ≥ 70 / At Risk ≥ 40 / Critical < 40 |
| **Portfolio Score** | — | A 0–100 score aggregating epics (40%), projects (30%), sprint performance (20%), data quality (10%). Shown on /portfolio. |
| **Portfolio Band** | — | Excellent ≥ 85 / Good ≥ 70 / Moderate ≥ 55 / At Risk ≥ 35 / Critical < 35 |
| **Explorer Export** | Work Item Explorer Export | Excel (.xlsx, 5 sheets) or CSV (.csv) download of the current Work Item Explorer graph from /explore. |
| **avgOpenAgeDays** | Average Open Age (days) | Mean number of days open items have been open per assignee. Computed from `ageDays` of non-done FlowItems. Red when > 14 days. |
| **Executive PDF** | Executive One-Page PDF Export | A print-optimised single-page HTML file (A4 landscape) downloaded from /summary. Contains health score, KPIs, epic progress, team capacity, insights, top 3 recommendations. Printed via browser print dialog — no external library. |
| **Action Owner** | Recommendation Action Owner | A team member name assigned to a Smart Recommendation card on the dashboard. Stored in `dc_rec_owners` (localStorage). Displayed as a blue badge on the card. |
| **suggestedOwner** | Suggested Owner | The default role suggested for each recommendation type (e.g., "Scrum Master / Delivery Manager" for blockers). Shown as a placeholder in the owner assignment input. |
| **dc_rec_owners** | — | localStorage key storing the map of `recKey → ownerName` for action-owner assignments on recommendation cards. |
| **Developer Portal Search** | — | Global search in the `/developer` sidebar that searches across calculations, packages, and section labels simultaneously. |

---

## O — Deployment Terms

| Term | Full Form | Meaning |
|------|-----------|---------|
| **Docker** | — | Container platform. The recommended deployment target for Delivery Clarity. Uses a multi-stage Dockerfile and docker-compose.yml. |
| **docker-compose** | Docker Compose | Tool for defining and running multi-container Docker apps. Used to start Delivery Clarity with one command (`docker compose up -d`). |
| **VPS** | Virtual Private Server | A cloud server (e.g. DigitalOcean Droplet, Hetzner VPS, AWS EC2) where the app runs directly on the OS without Docker. |
| **PM2** | Process Manager 2 | Node.js process manager used in VPS deployments. Keeps the app running after crashes and enables autostart on boot. |
| **nginx** | — | High-performance web server used as a reverse proxy in front of the Next.js app. Terminates SSL and forwards requests to port 3000. |
| **reverse proxy** | — | A server that sits in front of the app, forwarding requests and handling SSL, compression, and rate limiting. nginx is used for this role. |
| **Let's Encrypt** | — | Free SSL certificate authority. Used with Certbot to issue and auto-renew HTTPS certificates. |
| **Certbot** | — | CLI tool that automates SSL certificate issuance and renewal with Let's Encrypt. |
| **SESSION_SECRET** | — | A secret string (≥ 32 chars) used to sign iron-session cookies. Must be set before production deployment. Generate with: `openssl rand -hex 32`. |
| **prisma migrate deploy** | — | Prisma CLI command that applies pending schema migrations to the database. Run after every deploy that includes schema changes. |
| **standalone output** | Next.js standalone | `output: 'standalone'` in next.config.js tells Next.js to bundle all dependencies into `.next/standalone/` for minimal Docker images. |
| **client_max_body_size** | — | nginx directive controlling the maximum upload size. Must be set to `25M` to allow Jira CSV/XLSX exports to upload successfully. |

---

## M — Roadmap and Platform Features

| Term | Meaning |
|------|---------|
| **Notification Center** | A planned P4 feature: in-app notifications from admin to users and from the system to admin (e.g. storage warnings, large imports). |
| **Maintenance Mode** | A planned P4 feature: admin-controlled mode that shows a maintenance screen to users while the system is being updated. |
| **S3 / Azure / GCP Storage** | Implemented P3 cloud storage integration for backup files and bucket-first latest metrics. Supports AWS S3/S3-compatible providers, Azure Blob Storage, and Google Cloud Storage. |
| **Jira API Integration** | A planned P3 feature: direct read-only connection to Jira via API. The current model remains export-based (zero-credential). |

---

*© 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app — Delivery Clarity v4.0*

## N — v4.1 UX Design System Terms

| Term | Meaning |
|------|---------|
| **Pill Button** | A button with fully rounded corners (`border-radius: 9999px`). The app-wide button standard from v4.1. Variants: `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-danger`, `btn-outline-danger`, `btn-green`, `btn-dark`, `btn-warning`. |
| **Tab Button** | A borderless, backgroundless button with icon + label. Active state shown by a coloured 3px bottom underline pill. Used in the section switcher and (from v4.1) the dashboard filter bar. |
| **Underline Indicator** | The 3px pill at the bottom of an active tab button (`position: absolute; bottom: -4px; height: 3px; border-radius: 999px`). Colour matches the button's semantic role. |
| **Ops Score** | Operational Health Score | A 0–100 admin metric shown on /admin/diagnostics. Penalties: missing SESSION_SECRET (−30), non-production NODE_ENV (−10), open registration (−10), failed imports (−1 each, capped at −10), zero active sessions (−5). |
| **Admin Diagnostics** | — | The /admin/diagnostics page: live system health snapshot including ops score, DB row counts, import stats, env checks, recent audit events, and system info. Admin-only. |
| **Section Switcher** | The sticky tab bar on the dashboard that lets users focus on one section (single-section mode), see a summary (Overview mode), or view everything (Full Dashboard mode). |
| **SectionMode** | The state that controls which dashboard sections are visible: `full` \| `overview` \| `<sectionKey>`. |
| **OVERVIEW_KEYS** | The three section keys shown in Overview mode: `overview`, `attention`, `recommendations`. |
| **DashboardSectionSwitcher** | The React component rendering the 14-tab sticky nav bar on the dashboard with brand mark icon and active underline indicator. |
| **SectionNav** | The right-side dot navigation sidebar on the dashboard. Each dot represents a section and is tracked by IntersectionObserver. |
| **hideFlowPanel** | A `DashboardView` property (`boolean`). When `true`, the Story/Task Flow Health section, filter row, and all entry points to it are hidden. Set to `true` for Executive and Product Owner views. |
| **Clear Local Data** | A user-initiated action that removes all `dc_*` localStorage and sessionStorage keys. Does not affect server-side import logs. Available in Admin Settings (Browser Data tab) and on the Upload page. |
| **dc_* keys** | The set of localStorage/sessionStorage keys owned by Delivery Clarity: `dc_metrics_v2`, `dc_onboarding_completed`, `dc_onboarding_dismissed`, `dc_filter_presets`, `dc_dashboard_view`, `dc-theme`, `dc_muted_recs`, `dc_downloaded_report`, `dc_visited_explore`, `dc_viewed_sprints`, `dc_explore_recent`, `dc_col_order_*` (dynamic). |
| **Sticky Section Nav** | The `sticky top-14 z-30` tab bar on `/glossary` and `/help` that tracks the active section via IntersectionObserver and allows direct navigation to any section. |
| **Dynamic Import** | A JavaScript `import()` call inside a function body, so the module only loads when the function is first called. Used for `xlsx` and `excelInsightExport.service` to keep the dashboard bundle small. || **Landing Page** | In-App Landing Page | The /landing page — product showcase with hero, stats strip, "How it works", 12 feature cards (each linking to the feature), and CTA footer. Accessible via Reference → About in the nav. |
| **Product Tour** | Guided Product Tour | An 8-step walkthrough of the dashboard. No external library. Pulsing ring highlights each section; dark popover shows navigation. State stored in dc_tour_dismissed and dc_tour_completed (localStorage). |
| **dc_tour_dismissed** | — | localStorage flag set when user skips or completes the product tour. Prevents auto-start on subsequent visits. |
| **dc_tour_completed** | — | localStorage flag set when user reaches the final "Done" step of the product tour. |
| **Theme Customizer** | Advanced Theme Customization | Panel accessed via 🎨 icon in AppShell. Allows per-user customisation of accent colour (7 presets), corner radius (3 presets), and font size (3 presets) without code changes. Settings in dc_theme_custom (localStorage). |
| **--dc-accent** | Accent CSS Variable | CSS custom property on <html>: controls btn-primary and other accent-coloured elements. Set by the theme customizer. Default: #2563eb (blue). |
| **dc_theme_custom** | — | localStorage key storing the user's theme customisation (accent, radius, fontSize). Loaded and applied on every page mount via initThemeCustom(). |
| **Layout Builder** | Dashboard Layout Builder | Panel accessed via the "Layout" button (☰) in the dashboard sticky bar. Lets users reorder (▲▼) and toggle visibility of the 14 dashboard sections. Changes reflected in section switcher tabs. Saved to dc_section_layout (localStorage). |
| **dc_section_layout** | — | localStorage key storing the user's custom dashboard layout: an ordered array of { key, visible } pairs. Applied on every dashboard load. |
| **latest-metrics.json** | Latest Metrics Snapshot | Server-side JSON file in `data/latest-metrics.json` containing the latest computed `DashboardMetrics` payload. Included in cloud backups and served by `/api/metrics/latest`. |
| **Bucket-first metrics loading** | — | Startup/load strategy where analytics pages try `/api/metrics/latest` first, then fall back to browser `localStorage` when bucket/server metrics are unavailable. |
| **dc_metrics_source_v1** | Data Source Metadata | localStorage key storing whether current metrics came from bucket, server cache, fresh upload, snapshot, or localStorage fallback. Used by the data source badge. |
| **localStorage fallback** | — | Degraded-but-usable mode where the dashboard uses the browser's saved `dc_metrics_v2` copy because bucket/server metrics are unavailable. |

---

## O — v4.5 User-Request & Email Terms (2026-06-09)

| Term | Meaning |
|------|---------|
| **SMTP** | Simple Mail Transfer Protocol — the standard internet protocol for sending email. Configured in `.env` via `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`. |
| **App Password** | A 16-character single-purpose password generated by Google for use with Gmail SMTP when two-factor authentication (2FA) is enabled on the account. Stored in `SMTP_PASS`. Never the same as the Gmail login password. |
| **nodemailer** | Open-source Node.js library (`npm i nodemailer`) used to send email programmatically. Delivery Clarity uses it in `src/lib/email.ts` to dispatch welcome emails. When `SMTP_HOST` is `smtp.gmail.com`, uses the `service: 'gmail'` preset to avoid connection timeouts. |
| **Welcome Email** | An HTML email sent automatically to a new user's inbox when an admin accepts their `UserAddRequest`. Contains their login email, temporary password, and a "Log In Now" link. Sent by `sendEmail()` in `src/lib/email.ts`. |
| **Temporary Password** | A cryptographically generated 14-character password (2 uppercase + 2 digits + 2 special + 8 mixed, Fisher-Yates shuffled) assigned to a new user on account creation. The user must change it on first login (`mustChangePassword: true`). Generated client-side via the "Generate" button in `UserAddRequestsPanel` or server-side via `generateTempPassword()` in `src/lib/auth.ts`. |
| **mustChangePassword** | A boolean flag on the `User` model. When `true`, the login API redirects the user to `/change-password` before granting dashboard access. Cleared to `false` after the user sets their own password. |
| **emailSent** | Boolean returned by the accept API (`PATCH /api/admin/user-add-requests/[id]/accept`). `true` = welcome email delivered successfully; `false` = SMTP not configured or send failed. Displayed in the admin panel as ✅ or ⚠️. |
| **Generate Button** | The "Generate" button in the Member Requests accept panel that auto-fills the temp password field with a valid complex password. Uses `crypto.getRandomValues` (Web Crypto API) in the browser. |

---

## P — v4.6 Planning Pages Terms (2026-06-10)

| Term | Definition |
|---|---|
| **Roadmap Page** | The `/roadmap` page in Delivery Clarity. Shows every epic from the uploaded Jira data as a card with a progress bar, health indicator, delivery forecast, and confidence badge. Accessible via the Planning header group. |
| **Epic Forecast** | A velocity-based estimate of when an epic will complete. Computed by `forecastEpic(epic, avgThroughput)`: `remaining / avgThroughput = sprintsRemaining`; `ceil(sprintsRemaining × 2) = weeksRemaining` (2-week sprint assumption). Labels: Complete / Within 2 weeks / ~N weeks / ~N months / Insufficient data. |
| **Forecast Confidence** | A qualitative rating (high / medium / low) attached to each epic forecast. High = < 2 sprints remaining; medium = 2–5 sprints; low = ≥ 5 sprints or insufficient data. Displayed as a coloured badge on each epic card. |
| **Average Throughput** | The mean number of issues completed per sprint, calculated from `metrics.sprint.sprints[].completedCount` across all sprints with `completedCount > 0`. Used as the velocity baseline for all delivery forecasts. |
| **Forecast Page** | The `/forecast` page. Shows overall delivery status (on_track / at_risk / off_track / complete / insufficient_data), a burn-up chart, KPI row, next-quarter plan, risk signals, and actionable recommendations. |
| **Burn-Up Chart** | An inline SVG chart on the `/forecast` page showing cumulative completed issues over sprints (solid blue actual line), forecast extension (dashed blue), and target horizontal line (grey dashed). Built without any external charting library. |
| **Forecast Status** | The delivery health classification computed by `computeForecast()`: `complete` (done ≥ total), `insufficient_data` (no throughput), `on_track` (≤ 6 sprints remaining), `at_risk` (≤ 12), `off_track` (> 12, or severe blockers/critical items regardless of sprint count). |
| **Forecast Diagnosis** | The card on `/forecast` directly under the status banner, answering "are we on track, and why?" Shows the single weakest factor dragging on the forecast (blockers, scope growth, data quality, or declining throughput) and the confidence reason, both citing real numbers. |
| **Weakest Factor** | The one signal `computeForecast()` identifies as the biggest drag on the delivery forecast, checked in priority order: severe blockers, critical items, mid-sprint scope growth, poor Data Quality, declining throughput, or none. Never more than one is surfaced, to keep the diagnosis actionable rather than overwhelming. |
| **Risk & Scope Trend** | The `/forecast` chart showing per-sprint mid-sprint-added-scope and blocked-item counts as grouped bars. Consolidates what were three separate planned charts (risk trend, scope-change trend, blocker-impact chart) into one, since all three are time-series views of the same underlying per-sprint signals. Only available with rich sprint throughput data. |
| **Retrospective Page** | The `/retro` page. Provides a three-card landing: Fill in App (in-app form), Download Template (`.xlsx`, with a `.csv` fallback link), Upload Retro File (parses an uploaded file into a preview). Accessible to all roles via the Planning header group. |
| **Retrospective Insights** | The structured `RetrospectiveInsight` produced by `generateRetrospectiveInsight()` — shared by the in-app form and uploaded files. Includes themes, ownership gaps, duplicate action items, next-sprint suggestions, suggested backlog items, ceremony recommendations, and a confidence rating. Replaces the original flat-string `generateInsights(form)`. |
| **Retrospective Theme** | One of 7 keyword-detected categories (process, communication, requirements, qa-release, dependency, technical, planning) found in a retrospective's pain points and blockers — never its positive ("What Went Well") text, to avoid flagging praise as a problem. Shown as a count-labelled chip on each insight panel. |
| **Repeated Blocker** | A blocker whose text (trimmed, case-insensitive) appears in more than one sprint within the same uploaded retrospective file. Detected by `detectRepeatedBlockers()` and shown on every affected sprint's panel. |
| **Suggested Backlog Item** | A concrete, copy-pasteable `story`/`task`/`spike` suggestion for next sprint, shown in the "Suggested Stories & Tasks for Next Sprint" section of each insight panel. Distinct from the free-text next-sprint suggestions — each item has a title, a rationale citing the real triggering evidence, a priority, and a Copy button. No Jira ticket is created. |
| **Planning Nav Group** | The "Planning" dropdown in the AppShell header. Contains: Roadmap (🗺️), Forecast (🔮), Retro (🔄). Visible to all authenticated roles. Sits between the Delivery and Data groups. |
| **Grouped Help Nav** | The two-level navigation redesign on the `/help` page. Row 1: 9 category group pills. Row 2: sub-section pills for the active group (hidden when group has only 1 section). Replaces the previous 34-tab flat grid. |
| **Letter-Jump Nav** | The compact navigation redesign on the `/glossary` page. Single row of letter chips (A–L), each showing the section icon and letter. Clicking scrolls to the section; hovering shows the full section title. Replaces the previous 12-tab pill grid. |
| **Dashboard Sub-Pages** | The 10 independently routed pages under `/dashboard/*` (introduced in v4.9.0, consolidated 2026-07-11 in two same-day passes). Each page is a full Next.js App Router route sharing the `app/dashboard/layout.tsx` (DashboardTopbar + DashboardNavSidebar). Pages: priority-attention (incl. Smart Actions), key-metrics, data-quality, delivery-composition, trends (sprint + quarter, toggle), ownership, labels, epic-readiness, flow-health, coaching. `kanban-health`, `visual-analytics`, and `delivery-controls` were removed (100% duplicate content elsewhere); `actions` was merged into `priority-attention`; `sprint-status` and `quarter-statistics` were merged into `trends`. All five merged-away routes redirect to their replacement. |
| **Standalone Analytics Pages** | 6 full-page analytics routes using AppShell that are not nested under `/dashboard/`: `/data-quality`, `/delivery-mix`, `/flow-health`, `/release-readiness`, `/sprint-kanban`, `/work-explorer`. These are accessible from the Delivery nav group and offer the same analytics as their dashboard counterparts in a full-page standalone context. |
| **Smart Actions** | A `/dashboard/priority-attention` section (its own page until the 2026-07-11 merge). Generates AI-style actionable suggestions from the loaded metrics: critical blockers, stalled active items, capacity imbalance. Each action has a type (critical/warning/info), title, detail, and suggested owner. |
| **Delivery Composition Page** | The `/dashboard/delivery-composition` page. Shows work breakdown by issue type (donut), by status (bar), by health band (distribution), and by epic contribution (table). Helps identify over-concentration of work in at-risk categories. |
| **DC Shell** | The Delivery Clarity shell component library at `src/components/dc-shell/`. Contains: `DCTopbar`, `DCPageSidebar`, `DCKpiCard`, `DCStatusChip`, `DCActionBoard`, `DeliveryClarityShell`, and `navigation.ts` (`DC_NAV_GROUPS`). Provides reusable chrome for non-dashboard pages. |
| **DC_NAV_GROUPS** | The single source of truth for all navigation items, exported from `src/components/dc-shell/navigation.ts`. Consumed by both `AppShell` (non-dashboard pages) and `DashboardTopbar` (/dashboard/* pages). Eliminates duplicated nav item lists across components. |
| **App Config** | The encrypted SMTP and application-level configuration managed by `src/lib/app-config.ts`. Stored as an encrypted envelope in cloud storage. Exposed via `GET/PUT/POST /api/admin/app-config`. The `/admin/settings` Config tab (added v4.9.0) provides the admin UI. |
| **Admin Layout Injection** | The pattern where `app/admin/layout.tsx` provides `DashboardTopbar` + `AdminNavSidebar` to all `/admin/*` routes via Next.js layout inheritance. Individual admin page files render content only, with no shell logic. |
| **Wiki Theme** | The light-mode styling applied to `/developer` via the `.wiki` CSS class in `app/developer/page.module.scss`. The `.wiki` root class remaps all `--dc-*` dark palette tokens to semantic light equivalents so every `var(--dc-xxx)` reference in the page resolves to a light value without per-line edits. |

## Q — v4.10.0 Role-Based Coaching Terms (2026-06-23)

| Term | Definition |
|---|---|
| **Role-Based Coaching Insights** | The `/dashboard/coaching` feature that turns the already-computed `DashboardMetrics` into role-specific, evidence-cited advice. No new metric calculations — a pure interpretation layer over existing flow/throughput/data-quality signals. |
| **Coaching Category** | One of 7 content groupings (Scrum Master, Product Owner, Engineering Manager, Delivery Manager, Team Lead, C-level, Admin). Distinct from `AppRole` — the `manager` role sees 3 categories as tabs (Engineering Manager, Delivery Manager, Team Lead). |
| **Ceremony Advice** | Team-wide cadence recommendations (daily standup, refinement, sprint planning, sprint review, retrospective) computed once per page load and embedded identically into every visible coaching category. Each line only appears when its trigger condition is met in the real data — never a generic placeholder. |
| **Coaching Confidence Score** | A 0–100 score per coaching category, averaged from the relevant `MetricConfidenceMap` entries and downgraded ×0.75 (Weak) or ×0.5 (Critical) when Data Quality is poor. Shows "Not available" instead of a number when there isn't enough data yet. |

## R — v4.10.1 Coaching Redesign Terms (2026-06-26)

| Term | Definition |
|---|---|
| **Severity Trend** | An improved/worsened/unchanged comparison of a coaching category's current severity against its severity in the user's second-most-recent saved snapshot, computed by `computeSeverityTrend()`. Silently omitted when fewer than 2 snapshots exist — never fabricated. |
| **Quick-Win Celebration** | When a coaching category's severity is `low`, its hero headline cites a specific evidence number (e.g. "92% completion rate") instead of a generic "Looking good" message. |
| **Cross-Category Nudge** | A small colored dot shown on any non-active coaching tab whose severity is `high` or `critical`, surfacing urgency without requiring the user to click through every tab. |
| **Evidence Routing** | The static `metricKey`-prefix lookup (`resolveEvidenceRoute()`) that maps a coaching evidence item to its source `/dashboard/*` page, making the evidence chip clickable when a mapping exists. |
