// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';
import { useState, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { SvgIcon } from '@/components/ui/SvgIcon';
import styles from './page.module.scss';

// STYLE-05 (2026-07-19): converted from inline styles to SCSS Module — see
// page.module.scss for the token mapping notes. No behavior change.

// ── Types ──────────────────────────────────────────────────────────────────────
interface GlossaryRow { term: string; full: string; meaning: string; }
interface GlossarySection {
  id: string; title: string; icon: string; description: string;
  category: 'priority' | 'delivery' | 'reference' | 'people';
  rows: GlossaryRow[];
}

// ── Data ───────────────────────────────────────────────────────────────────────
const SECTIONS: GlossarySection[] = [
  {
    id: 'priority', title: 'A — Priority Levels', icon: 'target', category: 'priority',
    description: 'How tasks and issues are ranked by urgency.',
    rows: [
      { term: 'P0', full: 'Priority Zero — Critical', meaning: 'Must be done immediately. Blocks everything else. No other work starts until P0 is resolved.' },
      { term: 'P1', full: 'Priority One — High',     meaning: 'Important. Do right after all P0s are done.' },
      { term: 'P2', full: 'Priority Two — Medium',   meaning: 'Valuable but not urgent. Do after all P1s.' },
      { term: 'P3', full: 'Priority Three — Low',    meaning: 'Nice to have. Do when time allows.' },
    ],
  },
  {
    id: 'agile', title: 'B — Agile & Delivery Terms', icon: 'refresh', category: 'delivery',
    description: 'Common Agile and Scrum vocabulary used throughout Delivery Clarity.',
    rows: [
      { term: 'SP',        full: 'Story Points',              meaning: 'A unit used to estimate effort. Not hours — a relative measure of complexity. Higher = more effort.' },
      { term: 'ST',        full: 'Sprint',                    meaning: 'A fixed-length work cycle (usually 2 weeks). Team commits to work at the start and delivers by the end.' },
      { term: 'WIP',       full: 'Work In Progress',          meaning: 'Items actively being worked on right now. High WIP means the team is spread too thin.' },
      { term: 'WIP Limit', full: 'Work In Progress Limit',    meaning: 'A rule that caps how many items can be active at once. Reduces multitasking and improves flow.' },
      { term: 'KPI',       full: 'Key Performance Indicator', meaning: 'A headline metric that shows how well delivery is going. e.g. Completion %, Health Score.' },
      { term: 'SLA',       full: 'Service Level Agreement',   meaning: 'A delivery time target agreed with stakeholders. e.g. "85% of items complete within 14 days."' },
    ],
  },
  {
    id: 'metrics', title: 'C — Delivery Metrics', icon: 'chartBar', category: 'delivery',
    description: 'The formulas and measurements Delivery Clarity computes from your Jira export.',
    rows: [
      { term: 'Lead Time',       full: 'Lead Time',               meaning: 'Time from when an issue was created to when it was done. Measures end-to-end process speed.' },
      { term: 'Cycle Time',      full: 'Cycle Time',              meaning: 'Time from when work started (In Progress) to when it was done. Measures execution speed.' },
      { term: 'Flow Efficiency', full: 'Flow Efficiency',         meaning: 'Cycle Time ÷ Lead Time × 100. Shows what % of time was spent actively working vs. waiting in queues.' },
      { term: 'Throughput',      full: 'Throughput',              meaning: 'Number of items completed in a time period (e.g. per sprint, per month).' },
      { term: 'Velocity',        full: 'Sprint Velocity',         meaning: 'Story points completed per sprint. Used to predict how much can be delivered in future sprints.' },
      { term: 'Aging WIP',       full: 'Aging Work In Progress',  meaning: 'Items active for longer than 14 days. A sign of blockers or over-commitment.' },
      { term: 'Carryover',       full: 'Sprint Carryover',        meaning: 'Items committed to a sprint but not completed — they carry into the next sprint.' },
      { term: 'P50',             full: '50th Percentile (Median)', meaning: 'Half of all items complete faster than this. More reliable than average for planning.' },
      { term: 'P75',             full: '75th Percentile',         meaning: '75% of items complete within this time.' },
      { term: 'P85',             full: '85th Percentile',         meaning: '85% of items complete within this time. Recommended as your delivery SLA.' },
      { term: 'P95',             full: '95th Percentile',         meaning: 'Worst-case scenario. Only 5% of items take longer than this.' },
    ],
  },
  {
    id: 'health', title: 'D — Health & Status', icon: 'heart', category: 'delivery',
    description: 'How Delivery Clarity classifies the health of your delivery. These are the default cutoffs — an admin can change them in Settings → Thresholds → Health Score Bands.',
    rows: [
      { term: 'Excellent',              full: 'Health ≥ 90',    meaning: 'Delivery is on track with very low risk.' },
      { term: 'Good',                   full: 'Health ≥ 75',    meaning: 'Progressing well with minor risks.' },
      { term: 'Moderate',               full: 'Health ≥ 60',    meaning: 'Some issues need attention before they become blockers.' },
      { term: 'At Risk',                full: 'Health ≥ 40',    meaning: 'Multiple risk signals detected. Action required.' },
      { term: 'Critical',               full: 'Health < 40',    meaning: 'Delivery is in serious trouble. Escalation needed.' },
      { term: 'Orphan Issue',           full: 'Orphan Issue',   meaning: 'An issue with no Epic Link and no Parent Key. Invisible in roadmap reporting.' },
      { term: 'Blocker',                full: 'Blocker',        meaning: 'An issue stuck and unable to progress without external help. Blocked Flag = true.' },
      { term: 'Healthy Early Progress', full: 'Sprint Pattern', meaning: '≥ 50% of committed work done by the sprint midpoint.' },
      { term: 'End-Loaded Sprint',      full: 'Sprint Pattern', meaning: '< 20% done by midpoint. Work rushes in at the end — high risk.' },
      { term: 'Scope Instability',      full: 'Sprint Pattern', meaning: 'More than 20% of committed items were added after the sprint started.' },
      { term: 'Blocked Sprint',         full: 'Sprint Pattern', meaning: '2 or more items are blocked. Sprint velocity is constrained.' },
      { term: 'Late Delivery Risk',     full: 'Sprint Pattern', meaning: '20–30% done by midpoint. Delivery is lagging but not yet critical.' },
    ],
  },
  {
    id: 'issue-types', title: 'E — Issue Types', icon: 'folder', category: 'reference',
    description: 'The types of work items Delivery Clarity recognises from your Jira export.',
    rows: [
      { term: 'Epic',           full: 'Epic',           meaning: 'A large body of work grouping many Stories and Tasks. Usually spans multiple sprints.' },
      { term: 'Story',          full: 'User Story',     meaning: 'A user-facing requirement or feature. Delivered within one sprint. Belongs to an Epic.' },
      { term: 'Task',           full: 'Task',           meaning: 'A technical piece of work. Does not need to be user-visible.' },
      { term: 'Sub-task',       full: 'Sub-task',       meaning: 'A smaller breakdown of a Task or Story. Belongs to a parent Task or Story.' },
      { term: 'Bug',            full: 'Bug / Defect',   meaning: 'A defect in existing functionality. Can be linked to a Story or exist independently.' },
      { term: 'Spike',          full: 'Spike',          meaning: 'A time-boxed investigation. Delivers knowledge, not working software.' },
      { term: 'Technical Debt', full: 'Technical Debt', meaning: 'Work to clean up or refactor existing code. Often no user-visible change.' },
      { term: 'Change Request', full: 'Change Request', meaning: 'A request to modify agreed scope or requirements.' },
      { term: 'Risk',           full: 'Risk',           meaning: 'A tracked uncertainty that could affect delivery.' },
    ],
  },
  {
    id: 'goal-outcomes', title: 'F — Sprint Goal Outcomes', icon: 'flag', category: 'delivery',
    description: 'How Delivery Clarity classifies whether a sprint achieved its goal.',
    rows: [
      { term: 'Met',           full: 'Goal Met',      meaning: 'Sprint completion ≥ 90%. The sprint goal was fully achieved.' },
      { term: 'Partially Met', full: 'Partially Met', meaning: 'Sprint completion ≥ 60%. Most of the sprint goal was achieved.' },
      { term: 'Missed',        full: 'Goal Missed',   meaning: 'Sprint completion < 60% and the sprint has ended. Goal was not achieved.' },
      { term: 'Behind Pace',   full: 'Sprint Behind Pace', meaning: 'Sprint completion < 60% but sprint is still active. Time to recover.' },
    ],
  },
  {
    id: 'doc-codes', title: 'G — Document Codes', icon: 'file', category: 'reference',
    description: 'Reference codes used in Delivery Clarity product documentation.',
    rows: [
      { term: 'BRD',  full: 'Business Requirements Document',     meaning: 'Explains what the product must do and why, in business language.' },
      { term: 'SRS',  full: 'Software Requirements Specification', meaning: 'Detailed technical requirements numbered as FR-xxx.' },
      { term: 'FR',   full: 'Functional Requirement',             meaning: 'A specific numbered requirement. e.g. FR-207.' },
      { term: 'UC',   full: 'Use Case',                           meaning: 'A step-by-step description of how a user achieves a goal. e.g. UC-043.' },
      { term: 'SCN',  full: 'Scenario',                           meaning: 'A real-world story of how a specific persona uses the product. e.g. SCN-012.' },
      { term: 'UJ',   full: 'User Journey',                       meaning: 'A step-by-step walkthrough of a user\'s experience. e.g. UJ-010.' },
      { term: 'TC',   full: 'Test Case',                          meaning: 'A documented test that verifies a specific behaviour.' },
      { term: 'TC-T', full: 'Test Case — Throughput',             meaning: 'Tests for sprint throughput formula calculations. e.g. TC-T-01.' },
      { term: 'TC-E', full: 'Test Case — Explorer',               meaning: 'Tests for the Work Item Explorer / relation graph. e.g. TC-E-01.' },
      { term: 'TC-A', full: 'Test Case — Auth',                   meaning: 'Tests for login, logout, password, session. e.g. TC-A-01.' },
      { term: 'TC-X', full: 'Test Case — Excel',                  meaning: 'Tests for the 17-sheet Excel workbook. e.g. TC-X-01.' },
    ],
  },
  {
    id: 'features', title: 'H — Feature Codes', icon: 'priorityHigh', category: 'reference',
    description: 'Internal codes used to identify the four main features of Delivery Clarity v3.0.',
    rows: [
      { term: 'F1', full: 'Throughput & Delivery Analytics', meaning: 'Sprint throughput, mid-sprint patterns, Kanban flow analytics.' },
      { term: 'F2', full: 'Work Item Explorer',              meaning: 'Visual hierarchy graph, orphan detection, relation charts at /explore.' },
      { term: 'F3', full: 'Authentication & Database',       meaning: 'Login, register, SQLite database, session management.' },
      { term: 'F4', full: 'Smart Excel Export',              meaning: '17-sheet statistical workbook with recommendation engine.' },
    ],
  },
  {
    id: 'tech', title: 'I — Technology Abbreviations', icon: 'terminal', category: 'reference',
    description: 'Technical terms used in developer documentation and the app itself.',
    rows: [
      { term: 'API',            full: 'Application Programming Interface', meaning: 'A way for two software systems to communicate. In this app, it means the /api/... endpoints.' },
      { term: 'CSV',            full: 'Comma-Separated Values',            meaning: 'A plain text file format for tabular data. One of the Jira export formats this app accepts.' },
      { term: 'XLSX',           full: 'Excel Open XML Spreadsheet',        meaning: 'Microsoft Excel file format. The other Jira export format this app accepts.' },
      { term: 'DB',             full: 'Database',                          meaning: 'Where data is stored persistently. Delivery Clarity uses SQLite.' },
      { term: 'ORM',            full: 'Object-Relational Mapper',          meaning: 'A library that lets you write database queries in code. This app uses Prisma.' },
      { term: 'SSR',            full: 'Server-Side Rendering',             meaning: 'Page HTML is built on the server before sending to the browser.' },
      { term: 'TTL',            full: 'Time To Live',                      meaning: 'How long something is valid before it expires. Sessions have an 8-hour TTL by default.' },
      { term: 'bcrypt',         full: 'bcrypt hashing algorithm',          meaning: 'A one-way password hashing function. Stored passwords can never be reversed.' },
      { term: 'SQLite',         full: 'SQLite',                            meaning: 'A lightweight file-based database used for user accounts and import logs.' },
      { term: 'Prisma',         full: 'Prisma ORM',                        meaning: 'The database library. Handles schema, migrations, and queries.' },
      { term: 'SESSION_SECRET', full: '—',                                 meaning: 'A ≥ 32-character random string used to sign iron-session cookies. Required for production.' },
      { term: 'nginx',          full: '—',                                 meaning: 'Web server used as a reverse proxy. Terminates SSL and forwards requests to the Next.js app on port 3000.' },
      { term: 'App Storage Mode', full: 'Data Storage Mode: App Storage', meaning: 'Uploaded Jira data and computed metrics are stored in Delivery Clarity\'s own server database — not a third-party cloud service. Works across devices; admins can see and help with your data. Set per-user in Settings → Storage.' },
      { term: 'Local Storage Mode', full: 'Data Storage Mode: This Device Only (default for new self-registered accounts)', meaning: 'Uploaded Jira data is parsed and metrics are calculated entirely in your browser and never sent to the server. No cross-device sync, no admin visibility, lost if you clear your browser storage. Set per-user in Settings → Storage.' },
    ],
  },
  {
    id: 'roles', title: 'J — User Roles', icon: 'people', category: 'people',
    description: 'What each role can access in Delivery Clarity.',
    rows: [
      { term: 'admin',         full: 'Administrator',    meaning: 'Full system access: manage users, see all import logs, access admin pages, retention, backup, restore, and security.' },
      { term: 'scrum_master',  full: 'Scrum Master',     meaning: 'Defaults to the Scrum Master dashboard view and sees own uploads/import logs.' },
      { term: 'product_owner', full: 'Product Owner',    meaning: 'Defaults to the Product Owner dashboard view and sees own uploads/import logs.' },
      { term: 'manager',       full: 'Manager',          meaning: 'Defaults to the Engineering Manager dashboard view and can request all import logs.' },
      { term: 'c_level',       full: 'C-level',          meaning: 'Defaults to the Executive dashboard view and can request all import logs.' },
      { term: 'user',          full: 'Regular User',     meaning: 'Legacy/open-registration role. Can upload files, view dashboards, and see own import logs.' },
      { term: 'Route Scope',   full: 'Role Route Access', meaning: 'Routes outside the assigned role are hidden from navigation and blocked by middleware if opened directly.' },
    ],
  },
  {
    id: 'p2-scores', title: 'K — Analytics Scores & UI Terms', icon: 'chartTrendUp', category: 'delivery',
    description: 'Composite scores, bands, and UI components introduced in v4.1+.',
    rows: [
      { term: 'Release Confidence', full: 'Release Confidence Score (0–100)', meaning: 'Per-upload score tracking release readiness: completion (55 pts) + no-blockers (25 pts) + no-critical (12 pts) + no-defects (8 pts).' },
      { term: 'RC Band',           full: 'Release Confidence Band',          meaning: 'High ≥ 80 / Medium ≥ 60 / Low ≥ 40 / Critical < 40.' },
      { term: 'Team Health',       full: 'Team Health Score (0–100)',        meaning: 'Per-assignee score: completion (50 pts) + no-critical (30 pts) + no-blocked (20 pts). Shown on /teams.' },
      { term: 'Team Band',         full: 'Team Health Band',                 meaning: 'Healthy ≥ 70 / Team At Risk ≥ 40 / Critical < 40.' },
      { term: 'Portfolio Score',   full: 'Portfolio Score (0–100)',          meaning: 'Cross-team aggregate: epic completion (40%) + project completion (30%) + sprint performance (20%) + data quality (10%).' },
      { term: 'Portfolio Band',    full: '—',                                meaning: 'Excellent ≥ 85 / Good ≥ 70 / Moderate ≥ 55 / Portfolio At Risk ≥ 35 / Critical < 35.' },
      { term: 'Executive PDF',     full: 'Executive One-Page PDF',           meaning: 'Print-optimised single-page HTML (A4 landscape) from /summary. Contains health score, KPIs, epics, team capacity, insights, top 3 recommendations.' },
      { term: 'StorageProvider',   full: 'Cloud Storage Provider Interface', meaning: 'Abstract interface with upload/download/list/delete/test methods. Implemented by Local, S3, Azure, and GCP providers.' },
      { term: 'Product Tour',          full: 'Guided Product Tour',                meaning: '8-step walkthrough of the dashboard. Pulsing ring highlights each section with a popover. State in dc_tour_dismissed + dc_tour_completed (localStorage).' },
      { term: 'DashboardTopbar',       full: 'Dashboard Fixed Topbar',             meaning: 'Fixed 52px topbar on /dashboard (v4.8). Logo + product name + v4.1 tag, 6 nav group buttons with chevrons, SVG ring health pill (r=6.5, CIRC=40.84), New Upload CTA, user avatar.' },
      { term: 'DashboardNavSidebar',   full: 'Dashboard Fixed Sidebar',            meaning: 'Fixed 228px sidebar on /dashboard. Contains a health block (score, band, 4px progress bar, 2×2 vitals grid) and 9 nav items in 3 groups: Overview (3), Delivery (1), Deep Dive (5). Active item: #EFF6FF bg + 3px #2563EB left accent.' },
      { term: 'activeSection',         full: 'Dashboard Active Section State',     meaning: 'React state in dashboard/page.tsx controlling which section is shown. Default: \'summary\' (Delivery Summary). Maps to setSectionMode for 12 existing sections; \'flow\' opens the flow panel; \'summary\' renders the summary KPI+alert+actions view.' },
      { term: 'Delivery Summary',      full: 'Dashboard Default Section',          meaning: 'New section shown when activeSection===\'summary\'. Displays: title + Broadcast chip, 4 KPI mini-cards (Completion, Critical, Avg Cycle, Est. Completion), alert strip (blocked/overdue/orphans), top 3 smart actions.' },
      { term: 'Ops Score',         full: 'Operational Health Score',         meaning: '0-100 admin metric on /admin/diagnostics. Penalties: missing SESSION_SECRET (-30), non-production NODE_ENV (-10), open registration (-10), failed imports (-1 each).' },
      { term: 'Carry-over Threshold',       full: 'Team Role View — Scrum Master', meaning: '20% of committed sprint items carried over triggers the "Carry-over must remain below the agreed threshold" rule\'s At risk status on /dashboard/coaching. Placeholder default, not yet a team-configurable setting.' },
      { term: 'Capacity Overload Threshold', full: 'Team Role View — Manager',     meaning: '35% load share for one assignee (only counted once the team has more than 2 members) triggers the "Capacity overload must be corrected" rule\'s Risk status on /dashboard/coaching. Same threshold the coaching insight generators use elsewhere.' },
      { term: 'Low Delivery Confidence Threshold', full: 'Team Role View — Manager', meaning: 'Below 60% overall delivery confidence triggers the "Delivery forecasts must be credible" rule\'s Critical status on /dashboard/coaching.' },
    ],
  },
  {
    id: 'email', title: 'L — Email & Member-Request Terms', icon: 'email', category: 'people',
    description: 'Terms related to the v4.5 user-add-request workflow, welcome email, and SMTP configuration.',
    rows: [
      { term: 'SMTP',               full: 'Simple Mail Transfer Protocol', meaning: 'The standard internet protocol for sending email. Configured via SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.' },
      { term: 'App Password',       full: 'Google App Password',           meaning: 'A 16-character single-purpose password generated by Google for use with Gmail SMTP when 2FA is enabled. Stored in SMTP_PASS.' },
      { term: 'nodemailer',         full: '—',                             meaning: 'Open-source Node.js email library. Used in src/lib/email.ts to dispatch welcome emails via Gmail SMTP.' },
      { term: 'Welcome Email',      full: '—',                             meaning: 'HTML email sent automatically to a new user when their add-member request is accepted. Contains login email, temp password, and a "Log In Now" link.' },
      { term: 'Temp Password',      full: 'Temporary Password',            meaning: 'A 14-character cryptographically generated password assigned to a new user on creation. Must be changed on first login.' },
      { term: 'Generate',           full: 'Generate Password Button',      meaning: 'Button in the Member Requests accept panel that auto-fills the temp password field. Uses Web Crypto API (crypto.getRandomValues).' },
      { term: 'emailSent',          full: '—',                             meaning: 'Boolean in the accept API response. true = welcome email delivered; false = SMTP not configured or send failed.' },
      { term: 'mustChangePassword', full: '—',                             meaning: 'Boolean on the User model. When true, the user is redirected to /change-password on login.' },
      { term: 'UserAddRequest',     full: 'User Add-Member Request',       meaning: 'A Prisma model representing a pending request to create a new platform user. Accepted or rejected by an admin.' },
    ],
  },
  {
    id: 'planning', title: 'M — Planning & Forecasting Terms', icon: 'roadmap', category: 'delivery',
    description: 'Terms related to the v4.6 Roadmap, Forecast, and Retro pages and the Planning nav group.',
    rows: [
      { term: 'Roadmap Page',       full: '/roadmap',               meaning: 'Delivery Clarity page showing every epic as a card with progress bar, health indicator, forecast label, and Epic Timeline Confidence badge.' },
      { term: 'Epic Forecast',      full: '—',                      meaning: 'Velocity-based delivery estimate per epic: remaining ÷ avgThroughput = sprintsRemaining; ceil(sprints × 2) = weeksRemaining (2-week sprints).' },
      { term: 'Epic Timeline Confidence', full: '—',                meaning: 'Reliability of an epic forecast: High = < 2 sprints; Medium = 2–5 sprints; Low = ≥ 5 sprints or no data. Per-epic, distinct from the project-wide Forecast Reliability shown on /forecast.' },
      { term: 'Avg Throughput',     full: 'Average Throughput',     meaning: 'Mean issues completed per sprint, from sprint history. Used as the velocity baseline for all delivery forecasts.' },
      { term: 'Forecast Page',      full: '/forecast',              meaning: 'Delivery Clarity page showing overall delivery status, burn-up chart, KPI row, next-quarter plan, risk signals, and recommendations.' },
      { term: 'Forecast Reliability', full: '—',                    meaning: 'Project-wide blended reliability of the delivery forecast: High/Medium/Low, based on sprint count, trend, blocked count, and data quality.' },
      { term: 'Burn-Up Chart',      full: '—',                      meaning: 'Inline SVG chart on the Forecast page. Shows actual cumulative done (solid blue), forecast extension (dashed blue), and target (grey dashed).' },
      { term: 'Forecast Status',    full: '—',                      meaning: 'Delivery health classification: Complete, On Track (≤ 6 sprints), Timeline At Risk (7–12), Off Track (> 12), Insufficient Data.' },
      { term: 'Retro Page',         full: '/retro',                 meaning: 'Sprint retrospective tool. Three-card landing: Fill in App (form + insights), Download Template (CSV), Upload Retro File (coming soon).' },
      { term: 'Retro Insights',     full: 'Retrospective Insights', meaning: 'Suggestions generated on retro submit by generateInsights(). Evaluates goal outcome, blockers, missing owners/due-dates.' },
      { term: 'Planning Nav Group', full: '—',                      meaning: 'Top-level "Planning" dropdown in the AppShell header containing Roadmap, Forecast, and Retro. Visible to all authenticated roles.' },
    ],
  },
  {
    id: 'system-errors',
    title: 'L — System Errors & Reliability',
    icon: 'shield',
    category: 'reference',
    description: 'Terms related to the system error observability layer and database reliability helpers (v4.3.0).',
    rows: [
      { term: 'SystemErrorLog', full: 'System Error Log (Prisma model)', meaning: 'Database table that records every Prisma / DB failure captured by the app. Each row stores error code, message, model, operation, context, a JSON payload for replay, resolution state, retry count, and timestamps.' },
      { term: 'Ghost Session', full: 'Ghost Session / Stale Cookie', meaning: 'An iron-session cookie that remains valid after the user account it belongs to has been deleted. Any write that references the deleted userId causes a P2003 FK violation. The fix: validate session.userId exists before writes, return 401 if not.' },
      { term: 'P2003', full: 'Prisma Error P2003 — Foreign Key Constraint', meaning: 'Database error thrown when a row references a parent record that does not exist. In this app, most commonly caused by ghost sessions referencing a deleted user.' },
      { term: 'P2025', full: 'Prisma Error P2025 — Record Not Found', meaning: 'Thrown when update/delete targets a record that no longer exists. Not retriable.' },
      { term: 'P2002', full: 'Prisma Error P2002 — Unique Constraint', meaning: 'Thrown when a write would create a duplicate in a unique column. Not retriable.' },
      { term: 'safeAuditEvent', full: 'safeAuditEvent(data)', meaning: 'Helper in src/lib/system-error-logger.ts. Drop-in for prisma.auditEvent.create(). On P2003 retries with userId: null and logs the error as auto-fixed.' },
      { term: 'safeNotifications', full: 'safeNotifications(data, context)', meaning: 'Helper that wraps prisma.notification.createMany() with exponential back-off retry and SystemErrorLog capture.' },
      { term: 'withDbRetry', full: 'withDbRetry(fn, opts)', meaning: 'Utility that wraps any async Prisma call with up to 3 retries (400 ms base, doubling). Skips non-retriable error codes.' },
      { term: 'auto-fixed', full: 'Resolution: auto-fixed', meaning: 'SystemErrorLog resolution state meaning the system automatically recovered from the error without admin intervention (e.g. safeAuditEvent retry with null userId).' },
      { term: 'logged', full: 'Resolution: logged', meaning: 'SystemErrorLog resolution state meaning the error was recorded but has not yet been resolved. Admin action (Retry or Dismiss) is needed.' },
      { term: 'Bulk User Ops', full: 'Bulk Admin User Operations', meaning: 'Admin feature at /admin/settings → Users. Checkbox multi-select enables bulk delete (with confirmation) and bulk role change for selected users, excluding the signed-in admin.' },
      { term: 'UserAddRequest', full: 'User Add Request (Prisma model)', meaning: 'A pending invitation to add a new user to the system. When a user account is deleted, all pending UserAddRequests for that email are automatically cancelled to prevent FK violations.' },
    ],
  },
];

// ── Category config ────────────────────────────────────────────────────────────
const CATS = [
  { id: 'all',       label: 'All terms',       icon: 'book' },
  { id: 'priority',  label: 'Priority levels', icon: 'target' },
  { id: 'delivery',  label: 'Delivery terms',  icon: 'release' },
  { id: 'reference', label: 'Reference codes', icon: 'file' },
  { id: 'people',    label: 'People & roles',  icon: 'people' },
];

// ── Tag badge classifier ────────────────────────────────────────────────────────
// Colors are resolved in SCSS from data-badge (CLAUDE.md §28); this only
// classifies which fixed badge variant a term belongs to.
type BadgeVariant = 'p0' | 'p1' | 'p2' | 'p3' | 'delivery' | 'default';

function termBadgeVariant(term: string, category: string): { chip: boolean; badge: BadgeVariant } {
  if (term === 'P0') return { chip: false, badge: 'p0' };
  if (term === 'P1') return { chip: false, badge: 'p1' };
  if (term === 'P2') return { chip: false, badge: 'p2' };
  if (term === 'P3') return { chip: false, badge: 'p3' };
  if (category === 'delivery') return { chip: false, badge: 'delivery' };
  if (category === 'people')   return { chip: true, badge: 'default' };
  return { chip: false, badge: 'default' };
}

// ── FlatTerm type ──────────────────────────────────────────────────────────────
interface FlatTerm extends GlossaryRow { category: string; sectionId: string; }

// ── TermCard ──────────────────────────────────────────────────────────────────
function TermCard({ term, expanded, onToggle }: { term: FlatTerm; expanded: boolean; onToggle: () => void }) {
  const badge = termBadgeVariant(term.term, term.category);
  const badgeEl = badge.chip
    ? <span className={`chip c-nt ${styles.termBadgeChip}`}>{term.term}</span>
    : <span className={styles.termBadge} data-badge={badge.badge}>{term.term}</span>;
  return (
    <div
      onClick={onToggle}
      className={styles.termCard}
      data-expanded={expanded || undefined}
    >
      {badgeEl}
      <div className={styles.termName}>
        {term.full !== '—' && term.full !== term.term ? term.full : term.term}
      </div>
      {!expanded && (
        <div className={styles.termExpandHint}>
          <SvgIcon name="priorityHigh" size={10} /> Click to expand
        </div>
      )}
      {expanded && (
        <div className={styles.termMeaning}>
          {term.meaning}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GlossaryPage() {
  const [activeCat,  setActiveCat]  = useState('all');
  const [search,     setSearch]     = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalTerms = useMemo(() => SECTIONS.reduce((n, s) => n + s.rows.length, 0), []);

  const flatTerms: FlatTerm[] = useMemo(() =>
    SECTIONS.flatMap(s => s.rows.map(r => ({ ...r, category: s.category, sectionId: s.id }))),
    [],
  );

  const filtered = useMemo(() => {
    let base = activeCat === 'all' ? flatTerms : flatTerms.filter(t => t.category === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      base = flatTerms.filter(t =>
        t.term.toLowerCase().includes(q) ||
        t.full.toLowerCase().includes(q) ||
        t.meaning.toLowerCase().includes(q),
      );
    }
    return base;
  }, [activeCat, search, flatTerms]);

  function toggle(key: string) {
    setExpandedId(prev => prev === key ? null : key);
  }

  return (
    <AppShell showNav>
      <div className={`max-w-4xl mx-auto ${styles.page}`}>

        {/* ── Hero ── */}
        <div className="pt-10 pb-8 flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1">
            <div className={`chip c-acc mb-3 ${styles.eyebrow}`}>
              REFERENCE
            </div>
            <h1 id="tour-header-glossary" className={styles.title}>
              Glossary & Appendix
            </h1>
            <p className={styles.subtitle}>
              Every term, code, and abbreviation in Delivery Clarity — explained in plain English.
            </p>
          </div>
          <div className="flex gap-3 shrink-0 pt-1">
            <div className={styles.statCard}>
              <div className={styles.statValue}>{SECTIONS.length}</div>
              <div className={styles.statLabel}>Sections</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{totalTerms}+</div>
              <div className={styles.statLabel}>Terms</div>
            </div>
          </div>
        </div>

        {/* ── Search ── */}
        <div id="tour-section-glossary-1" className="relative mb-6">
          <SvgIcon
            name="search"
            size={16}
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${styles.searchIcon}`}
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search terms, e.g. P0, sprint, velocity, SLA…"
            className={`pl-10 pr-4 ${styles.searchInput}`}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg ${styles.searchClear}`}
            >×</button>
          )}
        </div>

        {/* ── Category filter ── */}
        {!search && (
          <div id="tour-section-glossary-2" className="flex flex-wrap gap-2 mb-8">
            {CATS.map(cat => {
              const isActive = activeCat === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCat(cat.id); setExpandedId(null); }}
                  className={`inline-flex items-center gap-2 ${styles.catBtn}`}
                  data-active={isActive || undefined}
                >
                  <SvgIcon name={cat.icon} size={14} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}
        {search && (
          <p className={`mb-6 ${styles.searchResultCount}`}>
            <span className={styles.searchResultNum}>{filtered.length}</span> result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
          </p>
        )}

        {/* ── Term grid ── */}
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <SvgIcon name="search" size={40} className="mx-auto mb-3" />
            <p className={styles.emptyTitle}>No terms found</p>
            <p className={styles.emptyHint}>Try a different search term or browse a category.</p>
          </div>
        ) : (
          <div className={styles.termGrid}>
            {filtered.map((t, i) => {
              const key = `${t.sectionId}-${i}`;
              return (
                <TermCard
                  key={key}
                  term={t}
                  expanded={expandedId === key}
                  onToggle={() => toggle(key)}
                />
              );
            })}
          </div>
        )}

        {/* ── Footer ── */}
        <div className={styles.footer}>
          © 2026 Ali Abu Ras · ali.aburas@deliveryclarity.app · Delivery Clarity v4.6
          <span className="mx-2">·</span>
          Also in <code className="font-mono">product/APPENDIX.md</code>
        </div>

      </div>
    </AppShell>
  );
}
