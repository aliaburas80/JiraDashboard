// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';

// ── Data ──────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'priority',
    title: 'A — Priority Levels',
    icon: '🎯',
    description: 'How tasks and issues are ranked by urgency.',
    rows: [
      { term: 'P0', full: 'Priority Zero — Critical', meaning: 'Must be done immediately. Blocks everything else. No other work starts until P0 is resolved.' },
      { term: 'P1', full: 'Priority One — High',     meaning: 'Important. Do right after all P0s are done.' },
      { term: 'P2', full: 'Priority Two — Medium',   meaning: 'Valuable but not urgent. Do after all P1s.' },
      { term: 'P3', full: 'Priority Three — Low',    meaning: 'Nice to have. Do when time allows.' },
    ],
  },
  {
    id: 'agile',
    title: 'B — Agile & Delivery Terms',
    icon: '🔄',
    description: 'Common Agile and Scrum vocabulary used throughout Delivery Clarity.',
    rows: [
      { term: 'SP',        full: 'Story Points',                meaning: 'A unit used to estimate effort. Not hours — a relative measure of complexity. Higher = more effort.' },
      { term: 'ST',        full: 'Sprint',                      meaning: 'A fixed-length work cycle (usually 2 weeks). Team commits to work at the start and delivers by the end.' },
      { term: 'WIP',       full: 'Work In Progress',            meaning: 'Items actively being worked on right now. High WIP means the team is spread too thin.' },
      { term: 'WIP Limit', full: 'Work In Progress Limit',      meaning: 'A rule that caps how many items can be active at once. Reduces multitasking and improves flow.' },
      { term: 'KPI',       full: 'Key Performance Indicator',   meaning: 'A headline metric that shows how well delivery is going. e.g. Completion %, Health Score.' },
      { term: 'SLA',       full: 'Service Level Agreement',     meaning: 'A delivery time target agreed with stakeholders. e.g. "85% of items complete within 14 days."' },
    ],
  },
  {
    id: 'metrics',
    title: 'C — Delivery Metrics',
    icon: '📊',
    description: 'The formulas and measurements Delivery Clarity computes from your Jira export.',
    rows: [
      { term: 'Lead Time',       full: 'Lead Time',          meaning: 'Time from when an issue was created to when it was done. Measures end-to-end process speed.' },
      { term: 'Cycle Time',      full: 'Cycle Time',         meaning: 'Time from when work started (In Progress) to when it was done. Measures execution speed.' },
      { term: 'Flow Efficiency', full: 'Flow Efficiency',    meaning: 'Cycle Time ÷ Lead Time × 100. Shows what % of time was spent actively working vs. waiting in queues. Higher = better.' },
      { term: 'Throughput',      full: 'Throughput',         meaning: 'Number of items completed in a time period (e.g. per sprint, per month).' },
      { term: 'Velocity',        full: 'Sprint Velocity',    meaning: 'Story points completed per sprint. Used to predict how much can be delivered in future sprints.' },
      { term: 'Aging WIP',       full: 'Aging Work In Progress', meaning: 'Items active for longer than 14 days. A sign of blockers or over-commitment.' },
      { term: 'Carryover',       full: 'Sprint Carryover',   meaning: 'Items committed to a sprint but not completed — they carry into the next sprint.' },
      { term: 'P50',             full: '50th Percentile (Median)', meaning: 'Half of all items complete faster than this. More reliable than average for planning.' },
      { term: 'P75',             full: '75th Percentile',    meaning: '75% of items complete within this time.' },
      { term: 'P85',             full: '85th Percentile',    meaning: '85% of items complete within this time. Recommended as your delivery SLA.' },
      { term: 'P95',             full: '95th Percentile',    meaning: 'Worst-case scenario. Only 5% of items take longer than this.' },
    ],
  },
  {
    id: 'health',
    title: 'D — Health & Status',
    icon: '❤️',
    description: 'How Delivery Clarity classifies the health of your delivery.',
    rows: [
      { term: 'Excellent',              full: 'Health ≥ 90',    meaning: 'Delivery is on track with very low risk.' },
      { term: 'Good',                   full: 'Health ≥ 75',    meaning: 'Progressing well with minor risks.' },
      { term: 'Moderate',               full: 'Health ≥ 60',    meaning: 'Some issues need attention before they become blockers.' },
      { term: 'At Risk',                full: 'Health ≥ 40',    meaning: 'Multiple risk signals detected. Action required.' },
      { term: 'Critical',               full: 'Health < 40',    meaning: 'Delivery is in serious trouble. Escalation needed.' },
      { term: 'Orphan Issue',           full: 'Orphan Issue',   meaning: 'An issue with no Epic Link and no Parent Key. Invisible in roadmap reporting. Treated as a delivery risk.' },
      { term: 'Blocker',                full: 'Blocker',        meaning: 'An issue stuck and unable to progress without external help. Blocked Flag = true.' },
      { term: 'Healthy Early Progress', full: 'Sprint Pattern', meaning: '≥ 50% of committed work done by the sprint midpoint. Team delivers consistently throughout.' },
      { term: 'End-Loaded Sprint',      full: 'Sprint Pattern', meaning: '< 20% done by midpoint. Work rushes in at the end — high risk if anything goes wrong.' },
      { term: 'Scope Instability',      full: 'Sprint Pattern', meaning: 'More than 20% of committed items were added after the sprint started.' },
      { term: 'Blocked Sprint',         full: 'Sprint Pattern', meaning: '2 or more items are blocked. Sprint velocity is constrained.' },
      { term: 'Late Delivery Risk',     full: 'Sprint Pattern', meaning: '20–30% done by midpoint. Delivery is lagging but not yet critical.' },
    ],
  },
  {
    id: 'issue-types',
    title: 'E — Issue Types',
    icon: '🗂️',
    description: 'The types of work items Delivery Clarity recognises from your Jira export.',
    rows: [
      { term: 'Epic',             full: 'Epic',            meaning: 'A large body of work grouping many Stories and Tasks. Usually spans multiple sprints.' },
      { term: 'Story',            full: 'User Story',      meaning: 'A user-facing requirement or feature. Delivered within one sprint. Belongs to an Epic.' },
      { term: 'Task',             full: 'Task',            meaning: 'A technical piece of work. Does not need to be user-visible. Belongs to a Story or Epic.' },
      { term: 'Sub-task',         full: 'Sub-task',        meaning: 'A smaller breakdown of a Task or Story. Belongs to a parent Task or Story.' },
      { term: 'Bug',              full: 'Bug / Defect',    meaning: 'A defect in existing functionality. Can be linked to a Story or exist independently.' },
      { term: 'Spike',            full: 'Spike',           meaning: 'A time-boxed investigation. Does not deliver working software — delivers knowledge.' },
      { term: 'Technical Debt',   full: 'Technical Debt',  meaning: 'Work to clean up or refactor existing code. Often no user-visible change.' },
      { term: 'Change Request',   full: 'Change Request',  meaning: 'A request to modify agreed scope or requirements.' },
      { term: 'Risk',             full: 'Risk',            meaning: 'A tracked uncertainty that could affect delivery.' },
    ],
  },
  {
    id: 'goal-outcomes',
    title: 'F — Sprint Goal Outcomes',
    icon: '🏁',
    description: 'How Delivery Clarity classifies whether a sprint achieved its goal.',
    rows: [
      { term: 'Met',          full: 'Goal Met',          meaning: 'Sprint completion ≥ 90%. The sprint goal was fully achieved.' },
      { term: 'Partially Met', full: 'Partially Met',    meaning: 'Sprint completion ≥ 60%. Most of the sprint goal was achieved.' },
      { term: 'Missed',       full: 'Goal Missed',       meaning: 'Sprint completion < 60% and the sprint has ended. Goal was not achieved.' },
      { term: 'At Risk',      full: 'Goal At Risk',      meaning: 'Sprint completion < 60% but sprint is still active. Time to recover.' },
    ],
  },
  {
    id: 'doc-codes',
    title: 'G — Document Codes',
    icon: '📄',
    description: 'Reference codes used in Delivery Clarity product documentation.',
    rows: [
      { term: 'BRD',   full: 'Business Requirements Document', meaning: 'Explains what the product must do and why, in business language.' },
      { term: 'SRS',   full: 'Software Requirements Specification', meaning: 'Detailed technical requirements numbered as FR-xxx.' },
      { term: 'FR',    full: 'Functional Requirement', meaning: 'A specific numbered requirement. e.g. FR-207.' },
      { term: 'UC',    full: 'Use Case',              meaning: 'A step-by-step description of how a user achieves a goal. e.g. UC-043.' },
      { term: 'SCN',   full: 'Scenario',              meaning: 'A real-world story of how a specific persona uses the product. e.g. SCN-012.' },
      { term: 'UJ',    full: 'User Journey',          meaning: 'A step-by-step walkthrough of a user\'s experience. e.g. UJ-010.' },
      { term: 'TC',    full: 'Test Case',             meaning: 'A documented test that verifies a specific behaviour.' },
      { term: 'TC-T',  full: 'Test Case — Throughput', meaning: 'Tests for sprint throughput formula calculations. e.g. TC-T-01.' },
      { term: 'TC-E',  full: 'Test Case — Explorer',  meaning: 'Tests for the Work Item Explorer / relation graph. e.g. TC-E-01.' },
      { term: 'TC-A',  full: 'Test Case — Auth',      meaning: 'Tests for login, logout, password, session. e.g. TC-A-01.' },
      { term: 'TC-X',  full: 'Test Case — Excel',     meaning: 'Tests for the 17-sheet Excel workbook. e.g. TC-X-01.' },
    ],
  },
  {
    id: 'features',
    title: 'H — Feature Codes',
    icon: '⚡',
    description: 'Internal codes used to identify the four main features of Delivery Clarity v3.0.',
    rows: [
      { term: 'F1', full: 'Throughput & Delivery Analytics', meaning: 'Sprint throughput, mid-sprint patterns, Kanban flow analytics.' },
      { term: 'F2', full: 'Work Item Explorer',              meaning: 'Visual hierarchy graph, orphan detection, relation charts at /explore.' },
      { term: 'F3', full: 'Authentication & Database',       meaning: 'Login, register, SQLite database, session management.' },
      { term: 'F4', full: 'Smart Excel Export',              meaning: '17-sheet statistical workbook with recommendation engine.' },
    ],
  },
  {
    id: 'tech',
    title: 'I — Technology Abbreviations',
    icon: '💻',
    description: 'Technical terms used in developer documentation and the app itself.',
    rows: [
      { term: 'API',        full: 'Application Programming Interface', meaning: 'A way for two software systems to communicate. In this app, it means the /api/... endpoints.' },
      { term: 'CSV',        full: 'Comma-Separated Values',   meaning: 'A plain text file format for tabular data. One of the Jira export formats this app accepts.' },
      { term: 'XLSX',       full: 'Excel Open XML Spreadsheet', meaning: 'Microsoft Excel file format. The other Jira export format this app accepts.' },
      { term: 'DB',         full: 'Database',                 meaning: 'Where data is stored persistently. Delivery Clarity uses SQLite.' },
      { term: 'ORM',        full: 'Object-Relational Mapper', meaning: 'A library that lets you write database queries in code. This app uses Prisma.' },
      { term: 'SSR',        full: 'Server-Side Rendering',    meaning: 'Page HTML is built on the server before sending to the browser.' },
      { term: 'TTL',        full: 'Time To Live',             meaning: 'How long something is valid before it expires. Sessions have an 8-hour TTL by default.' },
      { term: 'HTTP-only',  full: 'HTTP-only Cookie',         meaning: 'A browser cookie that JavaScript cannot read — only the server can. Used for session security.' },
      { term: 'bcrypt',     full: 'bcrypt hashing algorithm', meaning: 'A one-way password hashing function. Stored passwords can never be reversed.' },
      { term: 'JWT',        full: 'JSON Web Token',           meaning: 'A common auth token format. Delivery Clarity does NOT use JWT — it uses iron-session cookies.' },
      { term: 'SQLite',     full: 'SQLite',                   meaning: 'A lightweight file-based database used for user accounts and import logs.' },
      { term: 'Prisma',     full: 'Prisma ORM',               meaning: 'The database library. Handles schema, migrations, and queries.' },
    ],
  },
  {
    id: 'roles',
    title: 'J — User Roles',
    icon: '👥',
    description: 'What each role can access in Delivery Clarity.',
    rows: [
      { term: 'user',  full: 'Regular User', meaning: 'Can upload files, view dashboards, see their own import logs in Backend.' },
      { term: 'admin', full: 'Administrator', meaning: 'All user access plus: see all users\' import logs, access /admin/logs, see "Uploaded By" column.' },
    ],
  },
  {
    id: 'p2-scores',
    title: 'K — P2 Analytics Scores',
    icon: '📊',
    description: 'Composite scores and bands introduced in v4.1 P2 features.',
    rows: [
      { term: 'Release Confidence Score', full: '0–100', meaning: 'Per-upload score tracking release readiness: completion (55 pts) + no-blockers (25 pts) + no-critical (12 pts) + no-defects (8 pts). Shown as a trend on /trends.' },
      { term: 'RC Band', full: 'Release Confidence Band', meaning: 'High ≥ 80 / Medium ≥ 60 / Low ≥ 40 / Critical < 40.' },
      { term: 'Team Health Score', full: '0–100', meaning: 'Per-assignee score: completion (50 pts) + no-critical (30 pts) + no-blocked (20 pts). Shown on /teams.' },
      { term: 'Team Band', full: 'Team Health Band', meaning: 'Healthy ≥ 70 / At Risk ≥ 40 / Critical < 40.' },
      { term: 'Portfolio Score', full: '0–100', meaning: 'Cross-team aggregate: epic completion (40%) + project completion (30%) + sprint performance (20%) + data quality (10%). Shown on /portfolio.' },
      { term: 'Portfolio Band', full: '—', meaning: 'Excellent ≥ 85 / Good ≥ 70 / Moderate ≥ 55 / At Risk ≥ 35 / Critical < 35.' },
      { term: 'Explorer Export', full: 'Work Item Explorer Export', meaning: 'Excel (5-sheet workbook) or CSV download of the current /explore graph. Includes: Summary, All Issues, Risk Items, Orphans, Insights.' },
      { term: 'avgOpenAgeDays', full: 'Average Open Age (days)', meaning: 'Mean age in days of all non-done items per assignee. Red when > 14 days on the /teams page.' },
      { term: 'Executive PDF', full: 'Executive One-Page PDF Export', meaning: 'A print-optimised single-page HTML (A4 landscape) generated from /summary. Contains health score, KPIs, epics, team capacity, insights, top 3 recommendations. Downloaded as .html, printed as PDF via browser.' },
      { term: 'Action Owner', full: 'Recommendation Action Owner', meaning: 'A team member name assigned to a Smart Recommendation card. Stored in dc_rec_owners (localStorage). Displayed as a blue badge on the card with edit/clear controls.' },
      { term: 'suggestedOwner', full: 'Suggested Owner', meaning: 'Default role shown as a hint on the owner assignment input for each recommendation (e.g., "Scrum Master / Delivery Manager" for blocker recommendations).' },
      { term: 'Portal Search', full: 'Developer Portal Global Search', meaning: 'A search box in the /developer sidebar that searches across all calculations, packages, and section labels simultaneously. Results grouped by type.' },
      { term: 'Docker', full: '—', meaning: 'Container platform. The recommended deployment target for Delivery Clarity. Uses a multi-stage Dockerfile + docker-compose.yml. Run: docker compose up -d --build.' },
      { term: 'VPS', full: 'Virtual Private Server', meaning: 'A cloud server running the app directly on the OS (not Docker). Delivery Clarity uses Node 20 + PM2 + nginx for VPS deployments.' },
      { term: 'PM2', full: 'Process Manager 2', meaning: 'Node.js process manager for VPS deployments. Keeps the app running after crashes and enables autostart on server reboot.' },
      { term: 'nginx', full: '—', meaning: 'High-performance web server used as a reverse proxy. Terminates SSL and forwards requests to the Next.js app on port 3000. Requires client_max_body_size 25M for Jira uploads.' },
      { term: 'SESSION_SECRET', full: '—', meaning: 'A ≥ 32-character random string used to sign iron-session cookies. Required for production. Generate with: openssl rand -hex 32.' },
      { term: 'Certbot', full: '—', meaning: 'CLI tool that automates SSL certificate issuance and renewal via Let\'s Encrypt. Used for HTTPS setup on VPS/Docker deployments.' },
      { term: 'prisma migrate deploy', full: '—', meaning: 'Prisma CLI command that applies pending schema migrations. Runs automatically in the Docker container start command. Must be run manually on VPS after updates.' },
    ],
  },
];

// ── Components ────────────────────────────────────────────────────────────────

function Section({ section }: { section: typeof SECTIONS[0] }) {
  return (
    <section id={section.id} className="mb-10 scroll-mt-32">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{section.icon}</span>
        <div>
          <h2 className="text-base font-black text-slate-900">{section.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 w-32 whitespace-nowrap">Term / Code</th>
              <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500 w-48 hidden sm:table-cell">Full Name</th>
              <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Plain-English Meaning</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {section.rows.map((row, i) => (
              <tr key={i} className={i % 2 === 1 ? 'bg-slate-50/50' : ''}>
                <td className="px-4 py-3 align-top">
                  <code className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 whitespace-nowrap">
                    {row.term}
                  </code>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 font-semibold align-top hidden sm:table-cell whitespace-nowrap">
                  {row.full}
                </td>
                <td className="px-4 py-3 text-xs text-slate-700 align-top leading-relaxed">
                  {row.meaning}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GlossaryPage() {
  const [activeId, setActiveId] = useState<string>(SECTIONS[0].id);

  // Track which section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) { setActiveId(entry.target.id); break; }
        }
      },
      { rootMargin: '-20% 0px -65% 0px' },
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Smooth scroll accounting for app header + sticky nav
  function goTo(id: string) {
    const el        = document.getElementById(id);
    if (!el) return;
    const header    = document.querySelector('header') as HTMLElement | null;
    const nav       = document.getElementById('glossary-nav') as HTMLElement | null;
    const offset    = (header?.offsetHeight ?? 56) + (nav?.offsetHeight ?? 48) + 12;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  }

  return (
    <AppShell showNav>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs font-bold text-blue-700 mb-3">
            📖 Reference
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Glossary & Appendix</h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
            Plain-English explanations of every abbreviation, acronym, metric, and code used in Delivery Clarity — for anyone reading the app, reports, or product documents.
          </p>
        </div>

        {/* ── Sticky section nav ── */}
        <div
          id="glossary-nav"
          className="sticky top-14 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 mb-8 print:hidden"
          style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(14px)',
            borderBottom: '1px solid rgba(198,210,226,0.7)',
            boxShadow: '0 4px 16px rgba(24,43,77,0.07)',
          }}
        >
          <div className="flex flex-wrap items-end gap-0.5 py-1">
            {SECTIONS.map(s => {
              const active = activeId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(s.id)}
                  style={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 10px 10px',
                    borderRadius: 12,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                    background: active
                      ? 'linear-gradient(180deg, rgba(239,246,255,0.95), rgba(241,245,249,0.72))'
                      : 'transparent',
                    color: active ? '#2563eb' : '#64748b',
                    transition: 'background 150ms, color 150ms',
                  }}
                >
                  <span style={{ fontSize: 13, lineHeight: 1 }}>{s.icon}</span>
                  {s.title.split(' — ')[1]}
                  {active && (
                    <span style={{
                      position: 'absolute',
                      left: 10, right: 10, bottom: 2,
                      height: 3, borderRadius: 999,
                      background: '#2563eb',
                      boxShadow: '0 0 0 4px rgba(37,99,235,0.10)',
                    }} aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map(s => <Section key={s.id} section={s} />)}

        {/* Footer */}
        <div className="text-center py-8 border-t border-slate-200 mt-4 space-y-4">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="btn-primary px-6 py-2.5"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden="true">
              <path d="M12 4 4 12h5v8h6v-8h5L12 4Z" />
            </svg>
            Back to Top
          </button>
          <p className="text-xs text-slate-400">© 2025 Ali Abu Ras · aburasali80@gmail.com · Delivery Clarity v3.0</p>
          <p className="text-xs text-slate-300">
            Also available as <code className="font-mono">product/APPENDIX.md</code> in the repository.
          </p>
        </div>

      </div>
    </AppShell>
  );
}
