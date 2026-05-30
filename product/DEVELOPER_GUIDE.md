# Delivery Clarity — Developer Guide

## Document Control
Version 1.0 | 2026-05-30 | Author: Ali Abu Ras

---

## 1. Project Setup

### Prerequisites
- Node.js 18 or later
- npm 9 or later

### Clone and install

```bash
git clone <repo-url>
cd JiraDashboard

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### Environment files

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

`backend/.env.example` contains:
```
PORT=4000
ALLOWED_ORIGIN=http://localhost:3000
```

`frontend/.env.example` contains:
```
REACT_APP_API_BASE=http://localhost:4000/api
```

In production, set `ALLOWED_ORIGIN` to your deployed frontend URL (comma-separated for multiple). Set `REACT_APP_API_BASE` to your deployed backend URL. All frontend env vars must start with `REACT_APP_` to be visible in the browser bundle.

### Running the backend

```bash
cd backend
npm run dev          # nodemon — restarts on file changes, port 4000
npm start            # production — plain node
```

The server logs: `Delivery Clarity backend → http://localhost:4000`

### Running the frontend

```bash
cd frontend
npm start            # CRA dev server, port 3000, hot reload
npm run build        # production build into frontend/build/
```

### Running tests

```bash
cd backend
npm test             # runs backend/tests/metrics.test.js via Node's built-in test runner
```

The frontend has no automated tests beyond CRA's default Jest setup. Run `npm test` in `frontend/` to execute the standard CRA test harness.

---

## 2. Codebase Map

```
JiraDashboard/
├── backend/
│   ├── src/
│   │   ├── index.js                   # Express app entry — CORS, routes, health endpoint
│   │   ├── routes/
│   │   │   └── upload.js              # POST /api/upload, GET /api/upload/logs*
│   │   ├── services/
│   │   │   ├── parser.js              # Parses xlsx/csv Jira exports into normalised issue rows
│   │   │   ├── metrics.js             # All metric builders; calculateDashboardMetrics()
│   │   │   ├── importLogs.js          # Append/read import logs; render HTML and Excel log views
│   │   │   └── backendView.js         # renderShell() HTML template for backend admin pages
│   │   └── utils/
│   │       └── validation.js          # validateIssueData() — checks for ESSENTIAL_FIELDS
│   ├── data/
│   │   └── import-logs.json           # Persistent append-only log of all uploads (up to 200)
│   ├── tests/
│   │   └── metrics.test.js            # Node assert-based smoke test for calculateDashboardMetrics
│   ├── package.json                   # Dependencies: express, cors, multer, xlsx, express-rate-limit, dotenv
│   └── .env.example                   # PORT and ALLOWED_ORIGIN documentation
│
├── frontend/
│   ├── src/
│   │   ├── index.js                   # ReactDOM.render entry point
│   │   ├── App.js                     # Root component — theme, help state, routing between Upload/Dashboard
│   │   ├── styles.css                 # All styles — single flat file, ~3300 lines
│   │   ├── services/
│   │   │   └── api.js                 # uploadJiraFile() — the only API client function
│   │   └── components/
│   │       ├── UploadPage.js          # File input, calls uploadJiraFile, hands result to App
│   │       ├── DashboardPage.js       # The entire dashboard — all sections, charts, filters, tables
│   │       ├── KpiCard.js             # Reusable KPI tile with accent colours and threshold track
│   │       └── HelpGuide.js          # Help modal — SECTION_STEPS, Journey component, TAB_LABELS
│   ├── public/index.html              # CRA HTML shell
│   └── package.json                  # Dependencies: react 18, react-dom, react-scripts 5
│
├── data/                              # Sample Jira exports for local testing
├── product/                          # Product requirements docs (BRD, SRS, use cases, test cases)
├── .env.example                      # Root-level env example (mirrors backend/.env.example)
└── README.md
```

---

## 3. How the Data Flows (End-to-End)

### Step 1 — Browser file selection

The user selects a file via `<input type="file" accept=".xlsx,.xls,.csv">` in `UploadPage.js`. The `handleFileChange` async handler fires immediately and calls:

```javascript
const result = await uploadJiraFile(selectedFile);
```

### Step 2 — API call (frontend/src/services/api.js)

`uploadJiraFile(file)` in `frontend/src/services/api.js` builds a `FormData`, appends the file under the key `"file"`, and POSTs to `${API_BASE}/upload` (resolved from `process.env.REACT_APP_API_BASE`, default `http://localhost:4000/api`). It returns the raw JSON from `response.json()`.

### Step 3 — Multer (backend/src/routes/upload.js)

`multer` is configured with `memoryStorage()`, 20 MB size limit, and a file filter that allows only `.csv`, `.xlsx`, `.xls`. If multer rejects the file, the handler returns a 413 or 400 before the route handler fires.

The rate limiter (`uploadLimiter`) allows 20 uploads per 15 minutes per IP.

### Step 4 — Parser (backend/src/services/parser.js)

`parseJiraFile(req.file)` receives the multer file object. It calls `XLSX.read(buffer, { type: 'buffer' })`, reads the first sheet, and calls `XLSX.utils.sheet_to_json(worksheet, { defval: '' })` to get raw row objects.

Each row is passed through `normalizeRow(row)`, which calls `canonicalizeHeader(key)` on every column name. `canonicalizeHeader` strips the BOM character, lowercases, collapses whitespace, looks up `FIELD_ALIASES`, and falls back to the original normalised string. The result is an array of plain objects with consistent field names.

The function returns `{ issues, warnings, headers, sheetName }`.

### Step 5 — Validation (backend/src/utils/validation.js)

`validateIssueData(issues)` checks that the issues array is non-empty and that all four `ESSENTIAL_FIELDS` — `'Issue Key'`, `'Issue Type'`, `'Summary'`, `'Status'` — are present as keys in `issues[0]`. If validation fails, a 422 is returned with `{ error, details, importLog }`.

### Step 6 — Metrics (backend/src/services/metrics.js)

`calculateDashboardMetrics(issues)` is called with the normalised issues array. It calls every builder function in sequence (see section 6.1) and returns a single large metrics object.

### Step 7 — Import log (backend/src/services/importLogs.js)

`buildImportLog()` assembles a structured log entry from the file, parse result, validation, and metrics. `appendImportLog()` prepends it to `backend/data/import-logs.json` and trims the file to the last 200 entries.

### Step 8 — JSON response

The route handler returns `res.json({ issues, warnings, metrics, importLog })`.

### Step 9 — React state update (UploadPage.js → App.js)

Back in `UploadPage.js`, `handleFileChange` checks `result.error`. If absent, it calls `onDataLoaded(result.metrics)`. This prop is `setDashboardData` from `App.js`. Setting `dashboardData` causes `App` to switch from rendering `<UploadPage>` to rendering `<DashboardPage data={dashboardData} ...>`.

### Step 10 — Dashboard render (DashboardPage.js)

`DashboardPage` receives the metrics object as `data`. It immediately destructures all top-level keys:

```javascript
const flow = data.flow || {};
const sprint = data.sprint || {};
const kanban = data.kanban || {};
const storyPoints = data.storyPoints || {};
const risk = data.risk || {};
const quarters = data.quarters || [];
const flowItems = flow.items || [];
```

There is no `useEffect` data fetch. The data arrives synchronously as props. Every section renders from these destructured values.

---

## 4. How to Read the Jira Sheet

### 4.1 Field Aliases (parser.js)

The full `FIELD_ALIASES` object in `backend/src/services/parser.js`:

```javascript
const FIELD_ALIASES = {
  'issue key': 'Issue Key',
  'issue type': 'Issue Type',
  summary: 'Summary',
  status: 'Status',
  'project name': 'Project',
  'project key': 'Project',
  'custom field (team)': 'Team',
  assignee: 'Assignee',
  reporter: 'Reporter',
  'status category': 'High Level Status',
  priority: 'Priority',
  labels: 'Labels',
  resolution: 'Resolution',
  'original estimate': 'Original Estimate',
  'remaining estimate': 'Remaining Estimate',
  'time spent': 'Time Spent',
  created: 'Created Date',
  updated: 'Updated Date',
  resolved: 'Resolution Date',
  'due date': 'Due Date',
  parent: 'Parent Key',
  'parent key': 'Parent Key',
  comment: 'Last Comment',
  'custom field (epic link)': 'Epic Link',
  'custom field (epic name)': 'Epic Link',
  'custom field (story points)': 'Story Points',
  'custom field (story point estimate)': 'Story Points',
  'custom field (start date)': 'Sprint Start',
  'custom field (target start)': 'Sprint Start',
  'custom field (target end)': 'Sprint End',
  'custom field (actual start)': 'In Progress Date',
  'custom field (actual end)': 'Done Date',
};
```

**How `canonicalizeHeader()` works:**

```javascript
const canonicalizeHeader = (key) => {
  const normalizedKey = normalizeHeader(key);                          // strip BOM, trim
  const aliasKey = normalizedKey.toLowerCase().replace(/\s+/g, ' ');  // lowercase + collapse spaces
  return FIELD_ALIASES[aliasKey] || normalizedKey;                     // alias or original
};
```

Example: Jira exports a column named `"created"`. `normalizeHeader` strips the BOM and trims it to `"created"`. `aliasKey` becomes `"created"`. `FIELD_ALIASES["created"]` returns `"Created Date"`. The row will now have the key `"Created Date"` instead of `"created"`.

**How to add a new alias:**

Add one line to `FIELD_ALIASES` in `backend/src/services/parser.js`:

```javascript
'custom field (release tag)': 'Fix Version/s',
```

The key must be the alias in lowercase with single spaces between words. The value must be an existing or new canonical field name.

### 4.2 OPTIONAL_FIELDS and ESSENTIAL_FIELDS

`ESSENTIAL_FIELDS` are the four fields the app absolutely requires to function:

```javascript
const ESSENTIAL_FIELDS = ['Issue Key', 'Issue Type', 'Summary', 'Status'];
```

If any of these is missing, `validateIssueData()` returns `{ isValid: false }` and the upload returns HTTP 422.

`OPTIONAL_FIELDS` is the full 55-field list of everything the metrics engine can use. The complete list from `backend/src/services/parser.js`:

```
Issue Key, Issue Type, Summary, Epic Link, Parent Key, Project,
Component, Team, Assignee, Reporter, Status, High Level Status,
Priority, Risk Level, Risk Description, Labels, Fix Version/s,
Sprint, Sprint Goal, Story Points, Original Estimate, Time Spent,
Remaining Estimate, Created Date, Updated Date, Sprint Start, Sprint End,
In Progress Date, Code Review Date, QA Start Date, Done Date, Due Date,
Resolution, Resolution Date, Reopened Count, Blocked Flag, Blocker Reason,
Commitment Type, Added After Sprint Start, Scope Change Type, QA Pass,
UAT Status, Defects Count, Customer Visible, Release Ready,
Acceptance Criteria Ready, Definition of Ready Met, Definition of Done Met,
Business Value, Effort Confidence, Planned Sprint, Actual Sprint,
Dependencies, Stakeholder Owner, Requirement Stability, Risk Score,
Last Comment, Issue URL
```

When `parseJiraFile` runs, it generates a warning listing any optional fields absent from the uploaded file. The warning is returned in `parseResult.warnings` and included in the import log. It is surfaced in the frontend as `result.warnings` — currently logged but not displayed to the user.

### 4.3 `parseJiraFile()` Walkthrough

```javascript
function parseJiraFile(file) {
  const buffer = file.buffer;                                          // 1. Get raw buffer from multer
  const workbook = XLSX.read(buffer, { type: 'buffer' });             // 2. Parse xlsx/csv/xls
  const sheetName = workbook.SheetNames[0];                           // 3. Always use first sheet
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }); // 4. Empty cells → ''
  const issues = rawRows.map(normalizeRow);                            // 5. Canonicalise all headers
  const headers = Object.keys(issues[0] || {});                       // 6. Extract canonical headers

  const missingOptionalFields = OPTIONAL_FIELDS.filter(
    (field) => !ESSENTIAL_FIELDS.includes(field) && !headers.includes(field)
  );
  if (missingOptionalFields.length) {
    warnings.push(`Missing optional fields: ${missingOptionalFields.join(', ')}`);
  }

  return { issues, warnings, headers, sheetName };
}
```

Key points:
- Only the **first sheet** is read. If a user exports multiple sheets, only the first is processed.
- `defval: ''` ensures every cell is at least an empty string, preventing `undefined` from breaking downstream number parsing.
- `normalizeRow` uses `reduce` to merge alias collisions: the first occurrence wins (`acc[normalizedKey] === undefined || acc[normalizedKey] === ''`).

### 4.4 Date Parsing (`parseDate`)

`parseDate(value)` in `backend/src/services/metrics.js` handles four formats:

**1. Excel serial number**
Numeric value between 20000 and 80000. Excel stores dates as days since 30 Dec 1899. The function adds the serial number in milliseconds to the epoch date:

```javascript
const excelEpoch = new Date(Date.UTC(1899, 11, 30));
const millis = excelEpoch.getTime() + numericValue * 86400000;
```

Example: `44927` → 2023-01-01.

**2. Jira date format: `DD/Mon/YY` or `DD/Mon/YYYY`**
Regex: `/^(\d{1,2})\/([A-Za-z]{3})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i`

Example: `"15/Jan/24 09:30"` → 2024-01-15 09:30.

Two-digit years: `normalizeTwoDigitYear` adds 1900 for years ≥ 70, adds 2000 for years < 70.

**3. Numeric date: `DD/MM/YY`, `MM/DD/YY`, `DD-MM-YYYY`, etc.**
Regex: `/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:...)?$/i`

Disambiguates month/day: if the second number is > 12, it must be the day. Otherwise the first number is treated as day (the European/Jira convention).

**4. ISO 8601: `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM`**
Regex: `/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2}))?/`

Example: `"2024-03-22T14:30"` → 2024-03-22 14:30.

**Fallback:** `new Date(text)` — the browser/Node native parser, used only if none of the above match. Returns `null` if the result is `NaN`.

### 4.5 How to Add Support for a New Jira Field

Example: adding `"Ticket Category"`, exported as `"custom field (ticket category)"`.

**Step 1** — Add an alias in `backend/src/services/parser.js`:
```javascript
'custom field (ticket category)': 'Ticket Category',
```

**Step 2** — Add to `OPTIONAL_FIELDS` in the same file:
```javascript
const OPTIONAL_FIELDS = [
  ...,
  'Ticket Category',
];
```

**Step 3** — Use it in `backend/src/services/metrics.js`. For example, to group issues by this field, add a builder function:
```javascript
function buildCategoryMetrics(issues) {
  return Object.entries(groupBy(issues, (i) => i['Ticket Category'] || 'Unknown'))
    .map(([category, items]) => ({
      category,
      count: items.length,
      done: countIssues(items, isDone),
    }))
    .sort((a, b) => b.count - a.count);
}
```

**Step 4** — Add to the `calculateDashboardMetrics` return object:
```javascript
const categories = buildCategoryMetrics(issues);
// ...
return { ...metrics, categories };
```

**Step 5** — Use `data.categories` in `DashboardPage.js` to render a new section.

---

## 5. Health Classification — How it Works

### 5.1 `getHealthFromIssue()` Full Walkthrough

This is the heart of the health engine in `backend/src/services/metrics.js`. Every issue passes through it before any metric is computed.

```javascript
function getHealthFromIssue(issue, today = new Date()) {
  const created    = parseDate(issue['Created Date']);
  const started    = getStartedDate(issue);   // In Progress Date || Sprint Start
  const done       = getDoneDate(issue);       // Done Date || Resolution Date || Updated Date if done
  const dueDate    = parseDate(issue['Due Date']);
  const leadTimeDays  = daysBetween(created, done);
  const cycleTimeDays = daysBetween(started, done);
  const ageDays       = !done && created ? daysBetween(created, today) : null;
  const activeAgeDays = started && !done ? daysBetween(started, today) : null;
```

The function computes all time metrics first, then evaluates six signals in order, accumulating reasons:

**Signal 1 — Cycle time (completed items)**
If `isDone(issue)`:
- `cycleTimeDays > 14` → health = `'critical'`, reason: `'Cycle time is over 14 days.'`
- `cycleTimeDays > 7` → health = `'warning'`, reason: `'Cycle time is over 7 days.'`
- Otherwise → health = `'good'`, reason: `'Completed within expected cycle time.'`

**Signal 2 — Active age (in-progress items)**
If `isActive(issue)` and not done:
- `activeAgeDays > 14` → health = `'critical'`, reason: `'Active work has been in progress over 14 days.'`
- `activeAgeDays > 7` → health = `'warning'`, reason: `'Active work has been in progress over 7 days.'`
- Otherwise → reason: `'Active work is within expected age.'`

**Signal 3 — Open age (backlog/other items)**
If none of the above and `ageDays > 30`:
- health = `'warning'`, reason: `'Item has waited over 30 days.'`

**Signal 4 — Blocked flag**
```javascript
const isBlocked = issue['Blocked Flag'] === true || String(issue['Blocked Flag']).toLowerCase() === 'true';
if (isBlocked) { health = 'critical'; reasons.push('Blocked flag is set.'); }
```
Overrides any prior health classification. Accepts boolean `true` or string `"true"`.

**Signal 5 — Overdue**
```javascript
const isOverdue = dueDate && dueDate < today && !isDone(issue);
if (isOverdue) { health = 'critical'; reasons.push('Due date has passed.'); }
```
Overrides any prior health classification.

**Signal 6 — High priority open**
```javascript
const isHighPriority = ['High', 'Highest', 'Critical'].includes(issue['Priority']);
if (isHighPriority && !isDone(issue) && health === 'good') {
  health = 'warning';
  reasons.push('High-priority item is still open.');
}
```
Only fires if the item is still `'good'` after signals 1–5.

The final `reason` field is `reasons.join(' ')` — all matching reason strings concatenated with a space.

The returned object also includes `isOrphan: !(issue['Epic Link'] || issue['Parent Key'])`, which feeds the orphan highlight card and the delivery composition ring.

### 5.2 Changing Health Thresholds

To change the critical active-age threshold from 14 to 21 days, find this block in `backend/src/services/metrics.js`:

```javascript
// BEFORE
if (activeAgeDays !== null && activeAgeDays > 14) {
  health = 'critical';
  reasons.push('Active work has been in progress over 14 days.');
} else if (activeAgeDays !== null && activeAgeDays > 7) {
  health = 'warning';
  reasons.push('Active work has been in progress over 7 days.');
```

```javascript
// AFTER
if (activeAgeDays !== null && activeAgeDays > 21) {
  health = 'critical';
  reasons.push('Active work has been in progress over 21 days.');
} else if (activeAgeDays !== null && activeAgeDays > 10) {
  health = 'warning';
  reasons.push('Active work has been in progress over 10 days.');
```

Also update the corresponding KPI threshold track in `DashboardPage.js` and the help guide text in `HelpGuide.js` (the `delivery` section step for `'Critical signals'`).

### 5.3 Adding a New Health Signal: "Reopened Too Many Times"

**Step 1** — Add the check inside `getHealthFromIssue` in `backend/src/services/metrics.js`, after the `isHighPriority` block:

```javascript
const reopenedCount = parseNumber(issue['Reopened Count']);
if (reopenedCount >= 3 && health === 'good') {
  health = 'warning';
  reasons.push(`Reopened ${reopenedCount} times.`);
}
if (reopenedCount >= 5) {
  health = 'critical';
  reasons.push(`Reopened ${reopenedCount} times — chronic instability.`);
}
```

`parseNumber` is already in scope; it handles empty strings and non-numeric values safely.

**Step 2** — Verify `'Reopened Count'` is in `OPTIONAL_FIELDS` in `parser.js`. It is. If it were not, add it.

**Step 3** — The `reason` text will now include the reopen language when it fires. The "Blocked" quick filter searches `reasonFilter` for `'block'`; you can add a new quick filter for `'reopened'` using the same `applyQuickFilter` pattern in `DashboardPage.js`.

---

## 6. How Metrics are Computed

### 6.1 `calculateDashboardMetrics()` — The Master Function

Located at line 684 of `backend/src/services/metrics.js`. All work flows through it:

```javascript
function calculateDashboardMetrics(issues) {
  // 1. Basic counts
  const totalIssues  = issues.length;
  const doneIssues   = countIssues(issues, isDone);      // Status in ['Done','Closed','Resolved']
  const activeIssues = countIssues(issues, isActive);    // Status in ['In Progress','Code Review','QA','Testing','UAT']
  const completionRate = totalIssues ? Math.round((doneIssues / totalIssues) * 100) : 0;

  // 2. Health per issue — the engine that powers everything else
  const flowItems = issues.map((issue) => getHealthFromIssue(issue));

  // 3. Risk tallies (Blocked Flag, Due Date, Priority, Defects)
  const risk = buildRiskMetrics(issues);

  // 4. Flow summary — avg lead/cycle, health counts, sorted item list
  const flow = buildFlowMetrics(flowItems);

  // 5. Sprint groups — by Sprint || Actual Sprint || Planned Sprint field
  const sprint = buildSprintMetrics(issues, flowItems);

  // 6. Kanban — byStatus and byHighLevelStatus breakdowns
  const kanban = {
    byStatus:         buildStatusBreakdown(issues, 'Status', flowItems),
    byHighLevelStatus: buildStatusBreakdown(issues, 'High Level Status', flowItems),
  };

  // 7. Quarter groups — by done/created/updated date
  const quarters = buildQuarterMetrics(issues, flowItems);

  // 8. Capacity — by Assignee
  const capacity = buildCapacityMetrics(issues);

  // 9. Epics — by Epic Link || Parent Key
  const epics = buildEpicMetrics(issues, flowItems);

  // 10. Labels
  const labels = buildLabelMetrics(issues, flowItems);

  // 11. Issue types
  const types = buildTypeMetrics(issues, flowItems);

  // 12. Projects
  const projects = buildProjectMetrics(issues, flowItems);

  // 13. Parent keys
  const parents = buildParentMetrics(issues, flowItems);

  // 14. Issue link relations — parses "Issue Link (Blocks)" columns
  const relations = buildLinksMetrics(issues);

  // 15. Attach linked-to text to flow items (then delete the private _issueLinksText)
  if (relations._issueLinksText) {
    flow.items = flow.items.map((item) => ({
      ...item,
      linkedTo: relations._issueLinksText[item.key] || '',
    }));
    delete relations._issueLinksText;
  }

  // 16. Story points
  const totalStoryPoints = sum(issues.map(getStoryPoints));
  const completedStoryPoints = sum(issues.filter(isDone).map(getStoryPoints));

  // 17. Customer-visible and delivery confidence
  const totalCustomerVisible = countIssues(issues, (i) => String(i['Customer Visible']).toLowerCase() === 'true');
  const doneCustomerVisible = countIssues(issues, (i) => String(i['Customer Visible']).toLowerCase() === 'true' && isDone(i));
  const issuesWithConfidence = issues.filter((i) => i['Effort Confidence'] !== undefined && i['Effort Confidence'] !== '');
  const overallDeliveryConfidence = issuesWithConfidence.length
    ? round(safeAverage(issuesWithConfidence.map((i) => parseNumber(i['Effort Confidence']))), 2)
    : 0;

  const metrics = { totalIssues, doneIssues, activeIssues, ... };

  // 18. Composite health score
  const healthScore = calculateHealthScore(metrics);

  // 19. Predictive completion date
  const prediction = calculatePrediction(issues, doneIssues, totalIssues);

  // 20. Human-readable insights
  return { ...metrics, healthScore, prediction, insights: buildInsights(metrics) };
}
```

Each builder function takes `(issues, flowItems)` and returns a domain-specific object or array. `flow.items` is the array of health-enriched issue objects that drives the flow table.

### 6.2 How to Add a New Metric: `blockedRatio`

**Step 1** — Add the builder in `backend/src/services/metrics.js`:

```javascript
function buildBlockedRatio(issues) {
  const total = issues.length;
  if (!total) return { blockedRatio: 0, blockedCount: 0 };
  const blockedCount = countIssues(
    issues,
    (issue) => issue['Blocked Flag'] === true || String(issue['Blocked Flag']).toLowerCase() === 'true'
  );
  return {
    blockedRatio: round((blockedCount / total) * 100, 1),
    blockedCount,
  };
}
```

**Step 2** — Call it inside `calculateDashboardMetrics`, after `const risk = buildRiskMetrics(issues)`:

```javascript
const blockedRatioData = buildBlockedRatio(issues);
```

**Step 3** — Add it to the returned metrics object:

```javascript
const metrics = {
  ...
  blockedRatio: blockedRatioData.blockedRatio,
  blockedCount: blockedRatioData.blockedCount,
  ...
};
```

**Step 4** — Consume `data.blockedRatio` and `data.blockedCount` in `DashboardPage.js`.

### 6.3 Delivery Health Score Formula

`calculateHealthScore` in `backend/src/services/metrics.js` (line 602):

```javascript
function calculateHealthScore({ totalIssues, completionRate, flow, sprint, storyPoints }) {
  const total = Math.max(totalIssues, 1);
  const criticalRatio     = (flow.critical || 0) / total;
  const warningRatio      = (flow.warning || 0) / total;
  const orphanRatio       = orphanCount / total;
  const latestSprintRate  = sprint.sprints?.[0]?.completionRate ?? completionRate;
  const avgCycle          = flow.averageCycleTimeDays || 0;
  const cycleScore        = avgCycle === 0 ? 100 : Math.max(0, 100 - (avgCycle - 3) * 8);

  const raw =
    completionRate          * 0.28   +   // Completion rate contributes 28%
    (1 - criticalRatio) * 100 * 0.24 +   // Absence of critical items: 24%
    (1 - warningRatio)  * 100 * 0.12 +   // Absence of warning items: 12%
    latestSprintRate        * 0.14   +   // Latest sprint completion: 14%
    (1 - orphanRatio)   * 100 * 0.12 +   // Absence of orphans: 12%
    Math.min(cycleScore, 100) * 0.10;    // Cycle time efficiency: 10%

  return Math.round(Math.max(0, Math.min(100, raw)));
}
```

**Cycle score formula:** The cycle score penalises 8 points for every day beyond 3. A 3-day cycle = 100. A 10-day cycle = 100 − (7 × 8) = 44. A 16-day cycle = 0.

**To change a weight:** Adjust the multiplier after the `*`. All weights must sum to 1.00 (i.e., 0.28 + 0.24 + 0.12 + 0.14 + 0.12 + 0.10 = 1.00). If you add a new signal, reduce an existing weight proportionally.

### 6.4 Predictive Completion Formula

`calculatePrediction` in `backend/src/services/metrics.js` (line 623):

```javascript
function calculatePrediction(issues, doneIssues, totalIssues) {
  if (doneIssues >= totalIssues) return { complete: true, daysRemaining: 0 };
  const remaining = totalIssues - doneIssues;

  // Find the earliest created date to determine elapsed project time
  const timestamps = issues
    .map((i) => parseDate(i['Created Date']))
    .filter(Boolean)
    .map((d) => d.getTime());

  if (!timestamps.length) return { complete: false, daysRemaining: null };

  const elapsed = Math.max((Date.now() - Math.min(...timestamps)) / 86400000, 1);
  const velocity = doneIssues / elapsed;   // issues completed per day

  if (velocity < 0.01) return { complete: false, daysRemaining: null };

  const daysRemaining = Math.round(remaining / velocity);
  const predicted = new Date(Date.now() + daysRemaining * 86400000);

  return {
    complete: false,
    daysRemaining,
    predictedDate: predicted.toLocaleDateString('en-GB', { ... }),
    velocityPerDay: round(velocity, 2),
  };
}
```

Edge cases: returns `null` daysRemaining if no `Created Date` fields exist (no basis for elapsed time), or if `velocity < 0.01` (less than 1% of an issue per day — project appears stalled).

---

## 7. Frontend Architecture

### 7.1 State Management (all `useState` in `DashboardPage`)

| Variable | Type | Default | Purpose |
|---|---|---|---|
| `keyFilter` | string | `''` | Filter flow table by issue key text |
| `summaryFilter` | string | `''` | Filter flow table by summary text |
| `statusFilter` | string | `'all'` | Filter flow table by exact status |
| `sprintFilter` | string | `'all'` | Filter flow table by sprint name |
| `assigneeFilter` | string | `'all'` | Filter flow table by assignee |
| `leadMaxFilter` | string | `''` | Filter: max lead time days |
| `cycleMaxFilter` | string | `''` | Filter: max cycle time days |
| `openAgeMaxFilter` | string | `''` | Filter: max open age days |
| `healthFilter` | string | `'all'` | Filter by health classification |
| `reasonFilter` | string | `''` | Filter by reason text substring |
| `labelFilter` | string | `''` | Filter by label text substring |
| `isFlowPanelOpen` | boolean | `false` | Expand/collapse the flow health collapsible |
| `detailPanel` | object\|null | `null` | Content for the detail modal (`{ title, description, items }`) |
| `layoutSaved` | boolean | `false` | Transient UI confirmation — "Layout saved" message |
| `reportMessage` | string | `''` | Transient status messages (copy, export, clear) |
| `activeQuickFilter` | string | `'all'` | Which quick filter button is active |
| `hideStickyFilter` | boolean | `false` | Hides sticky filter bar when flow panel filters are visible |
| `stickyTop` | number | `0` | Calculated `top` offset for sticky filter bar (below app header) |
| `showManagerReport` | boolean | `false` | Open/close the Manager Report modal |
| `flowItemVisibleCount` | number | `100` | Progressive rendering limit for flow table |

### 7.2 Component Hierarchy

```
App
├── UploadPage                         (when dashboardData is null)
│   └── <input type="file">
│
├── DashboardPage                      (when dashboardData is set)
│   ├── HealthScoreGauge
│   ├── ManagerReport                  (modal, conditional)
│   ├── SmartActions
│   │   └── smart-action-card × N
│   ├── SectionHeader × N
│   │   └── HelpButton
│   ├── PanelTitle × N
│   │   └── HelpButton
│   ├── KpiCard × 6                    (section-overview)
│   ├── HealthDonut                    (section-visuals)
│   ├── QuarterChart                   (section-visuals)
│   ├── WorkStateChart                 (section-visuals → CompactBarChart)
│   ├── CompactBarChart × N            (kanban, sprint, labels, orphans, etc.)
│   ├── SprintCompareChart             (section-visuals → CompactBarChart)
│   ├── DistributionDonut × N          (kanban, sprint, labels, types)
│   ├── DeliveryCircle                 (section-ratios)
│   ├── CircleMetric × N               (customer visible, confidence)
│   ├── MetricTable × N                (quarters, kanban, sprint, capacity, epics, labels, etc.)
│   ├── ProgressBar                    (inside MetricTable cells and point delivery)
│   ├── HealthBadge                    (flow table health column)
│   ├── StatusGraph                    (flow table status summary)
│   ├── SectionNav                     (floating side navigation)
│   └── ScrollToTopFab
│
└── HelpGuide                          (fixed overlay modal, conditional)
    └── Journey
        └── journey-step × N
```

### 7.3 How Data Flows from API to Render

There is no `useEffect` or data fetching hook inside `DashboardPage`. The complete metrics object is passed as `data` prop directly from `App`'s state, which was set by `setDashboardData(result.metrics)` in `UploadPage.handleFileChange`. From that point, all rendering is a pure function of props.

---

## 8. How to Add a New Dashboard Section

Concrete example: adding a **Defects section** showing open bug count by assignee.

### Step 1 — Add the backend builder in `metrics.js`

```javascript
function buildDefectMetrics(issues) {
  const defects = issues.filter((i) => ['Bug', 'Defect'].includes(i['Issue Type']));
  return {
    total: defects.length,
    open: countIssues(defects, (i) => !isDone(i)),
    byAssignee: Object.entries(groupBy(defects, (i) => i['Assignee'] || 'Unassigned'))
      .map(([assignee, items]) => ({
        assignee,
        total: items.length,
        open: countIssues(items, (i) => !isDone(i)),
      }))
      .sort((a, b) => b.open - a.open)
      .slice(0, 10),
  };
}
```

### Step 2 — Wire it into `calculateDashboardMetrics` return

```javascript
const defects = buildDefectMetrics(issues);
// ...
return { ...metrics, defects };
```

### Step 3 — Add the section JSX in `DashboardPage.js`

Insert after the `section-labels` section (around line 1635):

```jsx
<section id="section-defects" className="dashboard-section section-defects">
  <SectionHeader
    icon="🐛"
    kicker="Quality"
    title="Defect distribution"
    detail="Open bugs and defects by assignee."
    helpTopic="defects"
    onOpenHelp={onOpenHelp}
  />
  <section className="dashboard-panel panel-defects">
    <PanelTitle helpTopic="defects" onOpenHelp={onOpenHelp}>Open Defects by Assignee</PanelTitle>
    <MetricTable
      columns={[
        { key: 'assignee', label: 'Assignee' },
        { key: 'total', label: 'Total' },
        { key: 'open', label: 'Open' },
      ]}
      rows={data.defects?.byAssignee}
      emptyMessage="No defect data found."
    />
  </section>
</section>
```

### Step 4 — Add section CSS in `styles.css`

```css
.section-defects {
  --section-color: #dc2626;
  --section-color-2: #f59e0b;
  --section-tint: rgba(220, 38, 38, 0.18);
}

.panel-defects {
  --panel-color: #dc2626;
  --panel-color-2: #f59e0b;
}
```

Add `.panel-defects` to the existing list of panels that get the `::before` accent stripe (lines 1408–1457 in `styles.css`).

### Step 5 — Already done by Step 3

`SectionHeader` renders the icon and kicker automatically. You passed `icon="🐛"` and `kicker="Quality"`.

### Step 6 — Add the section ID to `DASHBOARD_SECTIONS` in `DashboardPage.js`

```javascript
const DASHBOARD_SECTIONS = [
  ...
  { id: 'section-defects', label: 'Defects', color: '#dc2626' },
];
```

This registers the section with the floating `SectionNav` component and its `IntersectionObserver`.

### Step 7 — Add a Help Guide journey in `HelpGuide.js`

In `SECTION_STEPS`, add:

```javascript
defects: steps('#dc2626', 'linear-gradient(135deg,rgba(220,38,38,.12),rgba(245,158,11,.07))', [
  { icon: '🐛', eyebrow: 'What it shows', title: 'Open defects by assignee',
    body: 'The Defect Distribution section shows all Jira issues of type Bug or Defect, grouped by assignee. ...', tip: '...' },
]),
```

In `TAB_LABELS`:
```javascript
defects: 'Defects',
```

### Step 8 — Add a row to the Manager Report

In `ManagerReport` in `DashboardPage.js`, inside the `.report-rows` div:

```jsx
{data.defects?.open > 0 && (
  <div className="report-row">
    <div className="report-row-body">
      <div className="report-row-header">
        <span className="report-row-icon" aria-hidden="true">🐛</span>
        <span className="report-row-title">Open Defects</span>
        <span className={`report-row-badge ${data.defects.open > 5 ? 'critical' : 'warning'}`}>
          {data.defects.open} open
        </span>
      </div>
      <p className="report-row-content">
        Top: <strong>{data.defects.byAssignee[0]?.assignee}</strong> — {data.defects.byAssignee[0]?.open} open defects
      </p>
    </div>
    <button type="button" className="report-details-btn" onClick={() => onNavigate('section-defects')}>Details →</button>
  </div>
)}
```

---

## 9. How to Add a New KPI Card

### Step 1 — Compute the value in `metrics.js`

Add your calculation to `calculateDashboardMetrics` and include it in the return object. Example:

```javascript
const blockedRatio = totalIssues ? round((risk.blockedIssues / totalIssues) * 100, 1) : 0;
// in return:
return { ...metrics, blockedRatio };
```

### Step 2 — Add to the `kpi-grid` in `DashboardPage.js`

Inside `<div className="kpi-grid">` in `section-overview`:

```jsx
<KpiCard
  label="Blocked Ratio"
  value={`${data.blockedRatio || 0}%`}
  detail={`${risk.blockedIssues || 0} explicitly blocked`}
  accent="red"
  onClick={() => handleKpiNavigation('flow-health-panel')}
  tooltip="Percentage of all issues that have Blocked Flag set to true."
  thresholds={{ good: 5, warning: 15, critical: 30, max: 50, unit: '%' }}
/>
```

### Step 3 — KpiCard props reference

| Prop | Type | Required | Description |
|---|---|---|---|
| `label` | string | yes | Uppercase label below the value |
| `value` | string\|number | yes | The large displayed value |
| `detail` | string | no | Small muted line below the label |
| `accent` | string | no | Accent colour class name (see below) |
| `onClick` | function | no | Makes the card a `<button>` that navigates |
| `tooltip` | string | no | Dark tooltip shown on hover |
| `thresholds` | object | no | Enables the threshold track |

### Step 4 — Accent colour classes

Each class sets `--kpi-color` and `--kpi-color-2` CSS variables. Defined in `styles.css` lines 1316–1350:

| Class | Primary | Secondary |
|---|---|---|
| `accent-green` | `#16a34a` | `#4ade80` |
| `accent-blue` | `#2563eb` | `#60a5fa` |
| `accent-teal` | `#0f766e` | `#2dd4bf` |
| `accent-violet` | `#7c3aed` | `#c084fc` |
| `accent-amber` | `#f59e0b` | `#fbbf24` |
| `accent-red` | `#dc2626` | `#fb7185` |

### Step 5 — How threshold tracks work

`thresholds` accepts: `{ good: number, warning: number, critical: number, max: number, unit: string }`.

In `KpiCard.js`, the track renders three segments:
```javascript
['critical','warning','good'].map((k) => {
  const v = thresholds[k];
  const width = Math.max(0, Math.min(100, ((v ?? 0) / (thresholds.max || 100)) * 100));
  return <div key={k} className={`kpi-threshold-segment ${k}`} style={{ width: `${width}%` }} />;
})
```

The `kpi-threshold-marker` is positioned at the numeric value of the KPI relative to `thresholds.max`. The hover tooltip shows `Good ≤ {thresholds.good}{unit}`, etc.

---

## 10. How to Add a New Chart

### `CompactBarChart`

Props: `rows` (array), `labelKey` (default `'name'`), `valueKey` (default `'count'`), `emptyMessage` (string).

```jsx
<CompactBarChart
  rows={data.defects?.byAssignee}
  labelKey="assignee"
  valueKey="open"
  emptyMessage="No defect data."
/>
```

Each row needs `{ [labelKey]: string, [valueKey]: number }`. Bar width is `(value / maxValue) * 100%`. The chart renders inside `.status-graph` with `.status-bar-row` items. Bars animate via the `@keyframes growBar` animation.

### `DistributionDonut`

Props: `title` (string), `rows` (array), `labelKey` (default `'name'`), `valueKey` (default `'count'`), `emptyMessage` (string).

```jsx
<DistributionDonut
  title="Defect Share"
  rows={data.defects?.byAssignee}
  labelKey="assignee"
  valueKey="total"
  emptyMessage="No defect data."
/>
```

Uses a fixed `palette` of six colours: `['#1d4ed8', '#14b8a6', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2']`. Slices beyond six wrap using `index % palette.length`. Limited to 6 items (`slice(0, 6)`). Renders inside `.distribution-donut-card` with a `.donut-chart.small` (118×118 px) and a `.legend-list.compact`.

### `MetricTable`

Props: `columns` (array of column definitions), `rows` (array of data), `emptyMessage` (string), `rowClassName` (function, optional).

Column definition shape:
```javascript
{
  key: 'fieldName',      // used as the column key and default cell value accessor
  label: 'Display Name', // shown in <th>
  render: (row) => ...,  // optional — returns JSX or string
}
```

Example with all features:
```jsx
<MetricTable
  columns={[
    { key: 'assignee', label: 'Assignee' },
    { key: 'open', label: 'Open' },
    { key: 'total', label: 'Total' },
    { key: 'open', label: 'Status', render: (row) => (
      <HealthBadge value={row.open > 3 ? 'critical' : 'good'} />
    )},
  ]}
  rows={data.defects?.byAssignee}
  emptyMessage="No defect data."
  rowClassName={(row) => row.open > 3 ? 'critical-row' : undefined}
/>
```

Row key preference order: `row.id || row.key || row.name || row.assignee || row.epic || index`.

### `CircleMetric`

Props: `title` (string), `value` (number), `total` (number), `label` (string), `color` (hex, default `'#1d4ed8'`).

```jsx
<CircleMetric
  title="Customer Visible"
  value={data.doneCustomerVisible || 0}
  total={data.totalCustomerVisible || 0}
  label="completed"
  color="#16a34a"
/>
```

Renders an 86×86 px `.mini-circle` inside `.mini-circle-panel`. The ring fill is a `conic-gradient` from 0 to `(value/total)*100%`.

---

## 11. How to Modify the Layout

### 11.1 The Grid System

All layout grids are declared at lines 1376–1396 of `styles.css`:

```css
.analysis-grid,
.visual-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));  /* 3 equal columns */
}

.split-panels {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));  /* 2 equal columns */
}

.circle-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(5, minmax(0, 1fr));  /* 5 equal columns */
}

.kpi-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: 1fr;  /* 1 col mobile → 3 cols at 1181px via media query */
}
```

`hero-visual-grid` (used in section-visuals) overrides the `visual-grid` to `1.5fr 1fr` — the health donut takes more space:
```css
.visual-grid.hero-visual-grid {
  grid-template-columns: 1.5fr 1fr;
}
```

**To change column count:** Override the `grid-template-columns` in your section's custom CSS. For a 4-column analysis grid:
```css
.section-defects .analysis-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
```

### 11.2 Section Background Colours

Every `dashboard-section` uses three CSS custom properties:

- `--section-color`: The left accent stripe gradient start and the eyebrow pill colour
- `--section-color-2`: The left accent stripe gradient end
- `--section-tint`: Subtle radial background bleed

Example from the existing `.section-overview`:
```css
.section-overview {
  --section-color: #16a34a;
  --section-color-2: #2563eb;
  --section-tint: rgba(22, 163, 74, 0.24);
}
```

To add a new section colour, add a new class block with these three properties. See lines 746–786 of `styles.css` for all existing section colour blocks.

### 11.3 Panel Accent Stripes

Panels use `--panel-color` and `--panel-color-2`. These power the 4px top stripe (`::before` pseudo-element on `.dashboard-panel`).

To add a new panel class:

1. Add it to the `::before` selector list (lines 1432–1457 in `styles.css`)
2. Define its colour variables:
```css
.panel-defects {
  --panel-color: #dc2626;
  --panel-color-2: #f59e0b;
}
```

### 11.4 Responsive Breakpoints

From `styles.css`:

| Breakpoint | What changes |
|---|---|
| `min-width: 1181px` | `.kpi-grid` → 3 columns |
| `max-width: 1180px` | `.kpi-grid` → 3 columns; `.circle-grid` → 2 columns |
| `max-width: 980px` | `.dashboard-splash` collapses to 1 column |
| `min-width: 881px` | `.dashboard-summary-bar` → 2-column layout; `.sticky-filter-bar top: 110px` |
| `max-width: 880px` | `.kpi-grid` → 2 columns; `.visual-grid.hero-visual-grid` → 1 column; `.issue-highlight-strip` → 1 column; sticky filter top: 108px |
| `min-width: 821px` | `.dashboard-top` → row layout |
| `max-width: 820px` | `.app-header` → static position; `.delivery-circle-layout` → stacked |
| `max-width: 520px` | `.kpi-grid` → 1 column; `.circle-grid` → 1 column; `.delivery-circle` → 196px |

---

## 12. How to Modify the Navigation

### 12.1 Floating Section Nav — `DASHBOARD_SECTIONS` Array

Defined at line 673 of `DashboardPage.js`:

```javascript
const DASHBOARD_SECTIONS = [
  { id: 'dashboard-summary',          label: 'Summary',     color: '#2563eb' },
  { id: 'section-attention',          label: 'Alerts',      color: '#f59e0b' },
  { id: 'section-overview',           label: 'KPIs',        color: '#16a34a' },
  { id: 'section-visuals',            label: 'Charts',      color: '#0891b2' },
  { id: 'section-ratios',             label: 'Composition', color: '#7c3aed' },
  { id: 'section-delivery-controls',  label: 'Delivery',    color: '#f97316' },
  { id: 'section-quarters',           label: 'Quarters',    color: '#f97316' },
  { id: 'section-kanban',             label: 'Kanban',      color: '#0f766e' },
  { id: 'section-sprint',             label: 'Sprint',      color: '#7c3aed' },
  { id: 'section-ownership',          label: 'Ownership',   color: '#0f766e' },
  { id: 'section-labels',             label: 'Labels',      color: '#7c3aed' },
  { id: 'section-relations',          label: 'Relations',   color: '#dc2626' },
  { id: 'section-readiness',          label: 'Readiness',   color: '#dc2626' },
  { id: 'flow-health-panel',          label: 'Flow Table',  color: '#2563eb' },
];
```

To add a new section, append:
```javascript
{ id: 'section-defects', label: 'Defects', color: '#dc2626' },
```

The `id` must match the `id` attribute on the JSX `<section>` element.

**IntersectionObserver logic:** `SectionNav` creates an observer with `rootMargin: '-20% 0px -70% 0px'`. This means a section is "active" only when it occupies the top 10–30% of the viewport. The observer fires on every element in `DASHBOARD_SECTIONS` and tracks which one is nearest the top via `boundingClientRect.top`. Setting the active section triggers the dot glow and label colour using `style={{ background: color, boxShadow: ... }}`.

### 12.2 Quick Filter Bar

`applyQuickFilter(type)` in `DashboardPage.js` (line 977) resets all filters then sets specific ones:

```javascript
const applyQuickFilter = (type) => {
  // ...reset all filters to default...
  if (type === 'high-risk')      setHealthFilter('critical');
  if (type === 'needs-review')   setStatusFilter('in progress');
  if (type === 'blocked')        setReasonFilter('block');
  if (type === 'sprint-today')   setReasonFilter('today');
  openFlowFilters();  // expands the flow panel and scrolls to it
};
```

To add a new quick filter type, for example `'no-points'`:

1. Add a button in the `sticky-filter-bar` JSX:
```jsx
<button
  type="button"
  className={`quick-filter-button ${activeQuickFilter === 'no-points' ? 'active' : ''}`}
  onClick={() => applyQuickFilter('no-points')}
>
  No Points
</button>
```

2. Add the filter logic in `applyQuickFilter`:
```javascript
if (type === 'no-points') {
  setReasonFilter('');          // or use a dedicated state variable
  // You would need a new state variable and filter predicate for this
}
```

For filters not expressible through the existing string filter states, you will need to add a new `useState` variable and add its check to the `filteredFlowItems` `useMemo`.

### 12.3 Section IDs

All 14 section IDs registered in `DASHBOARD_SECTIONS`:

| ID | Section |
|---|---|
| `dashboard-summary` | Summary bar |
| `section-attention` | Blockers/overdue/orphans highlight strip |
| `section-overview` | KPI cards |
| `section-visuals` | Health donut, quarter chart, work state |
| `section-ratios` | Delivery composition ring |
| `section-delivery-controls` | Flow efficiency, story points, risk readout |
| `section-quarters` | Quarter statistics table |
| `section-kanban` | Kanban status health |
| `section-sprint` | Sprint status table |
| `section-ownership` | Capacity by assignee, epic performance |
| `section-labels` | Labels, types, projects |
| `section-relations` | Issue link relations |
| `section-readiness` | Epic readiness (inside DashboardPage, rendered later) |
| `flow-health-panel` | Story/task flow health collapsible |

Naming convention: all IDs use `section-` prefix except `dashboard-summary` (the page-level summary bar) and `flow-health-panel` (a standalone panel, not a full section).

---

## 13. How to Modify the Help Guide

### 13.1 `SECTION_STEPS` Structure

Each key in `SECTION_STEPS` is a tab name. Its value is an array of step objects created by `steps(color, bg, arr)`:

```javascript
function steps(color, bg, arr) {
  return arr.map((s) => ({ ...s, color, bg }));
}
```

`color` is the hex colour for progress bars, dots, and eyebrow pills for this section. `bg` is a `linear-gradient` string used as the step icon container background.

Each step object:
```javascript
{
  icon: '🐛',            // emoji shown in journey-icon-wrap
  eyebrow: 'Overview',   // small pill above the title
  title: 'My section',   // <h3> journey-title
  body: 'Explanation...', // <p> journey-text
  tip: 'Tip text...',    // optional — shown in a journey-tip div with 💡 icon, pass null to omit
  // injected by steps():
  color: '#dc2626',
  bg: 'linear-gradient(...)',
}
```

**To add a new section:**

```javascript
defects: steps('#dc2626', 'linear-gradient(135deg,rgba(220,38,38,.12),rgba(245,158,11,.07))', [
  {
    icon: '🐛',
    eyebrow: 'Open defects',
    title: 'Bugs and defects by assignee',
    body: 'The Defects section shows all Bug and Defect issue types grouped by who owns them...',
    tip: 'A high open defect count for one assignee alongside low completion may indicate they are stuck in bug-fixing mode.',
  },
]),
```

### 13.2 `TAB_LABELS`

Defined inside `HelpGuide`'s default export function:

```javascript
const TAB_LABELS = {
  welcome: 'Welcome', summary: 'Summary', quickFilters: 'Filters',
  attention: 'Attention', kpis: 'KPIs', visuals: 'Visuals',
  ratios: 'Ratios', delivery: 'Delivery', quarters: 'Quarters',
  kanban: 'Kanban', sprint: 'Sprint', ownership: 'Ownership',
  readiness: 'Readiness', justification: 'Justify', flow: 'Flow Table',
  labels: 'Labels', relations: 'Relations',
};
```

To add a new tab:
```javascript
defects: 'Defects',
```

The tab renders as a `<button>` in the `.help-tabs` grid. There are currently 17 tabs; the grid uses `grid-template-columns: repeat(auto-fit, minmax(132px, 1fr))` so a new tab will auto-reflow.

The `Journey` component navigates steps with left/right arrow keys, dot clicks, and Next/Back buttons. The `finishLabel` prop defaults to `'Done ✓'`. If `isLast` is true, the Next button is replaced by the finish button which calls `onFinish` (which closes the guide).

---

## 14. How to Modify the Manager Report

### 14.1 `ManagerReport` Component

The report is a full-screen modal (`report-backdrop` → `report-panel`) rendered when `showManagerReport` is true. It receives `{ data, flowItems, epicReadiness, healthStatus, riskItems, onClose, onNavigate }`.

The report has seven data rows inside `.report-rows`:

1. **Risk Indicators** — top 3 critical flow items, navigates to `'flow-health-panel'` with `filterAction: 'openFlow'`
2. **Sprint Status** — latest sprint (sorted by issue count), navigates to `'section-sprint'`
3. **Epic Readiness** — at-risk epics, navigates to `'section-readiness'`
4. **Capacity** — top 2 assignees by load share, navigates to `'capacity-section'`
5. **Labels & Classification** — top 3 labels, navigates to `'section-labels'`
6. **Issue Relations** — link count and blocked items, navigates to `'section-relations'`
7. **Key Insights** — first 3 strings from `data.insights`, navigates to `'section-overview'`

**To add a new row:** Copy the pattern of an existing `report-row` div and add your row inside `.report-rows`. The `onNavigate` function signature is `(targetId, action?)`. For the standard case:

```jsx
<div className="report-row">
  <div className="report-row-body">
    <div className="report-row-header">
      <span className="report-row-icon" aria-hidden="true">🐛</span>
      <span className="report-row-title">Open Defects</span>
      <span className={`report-row-badge ${data.defects?.open > 0 ? 'critical' : 'good'}`}>
        {data.defects?.open || 0} open
      </span>
    </div>
    <p className="report-row-content">
      {data.defects?.open || 0} open defects across the project.
    </p>
  </div>
  <button type="button" className="report-details-btn" onClick={() => onNavigate('section-defects')}>
    Details →
  </button>
</div>
```

`onNavigate` calls:
```javascript
// DashboardPage.js, inside ManagerReport's onNavigate prop:
(targetId, action) => {
  if (action === 'openFlow') setIsFlowPanelOpen(true);
  setShowManagerReport(false);
  setTimeout(() => {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}
```

---

## 15. Smart Recommendations — How to Add a New One

`smartActions` is computed in a `useMemo` at line 1070 of `DashboardPage.js`. Each action object shape:

```javascript
{
  type: 'critical' | 'warning' | 'info',  // used for CSS class smart-action-${type}
  icon: '🐛',                              // emoji displayed
  navTarget: 'section-defects',           // scrolls here when clicked
  filterAction: 'blockers' | 'stale' | null, // special filter to apply
  title: 'Action title',
  detail: 'Specific detail about the finding',
}
```

**To add a new recommendation:**

```javascript
const openDefectCount = data.defects?.open || 0;
if (openDefectCount > 5)
  acts.push({
    type: 'warning',
    icon: '🐛',
    navTarget: 'section-defects',
    filterAction: null,
    title: `${openDefectCount} open defects require attention`,
    detail: `${data.defects?.byAssignee?.[0]?.assignee} owns ${data.defects?.byAssignee?.[0]?.open} of them`,
  });
```

Add this block inside the `useMemo` before `return acts.slice(0, 5)`. The list is capped at 5 items.

`handleSmartAction` in `DashboardPage.js` handles navigation:

```javascript
const handleSmartAction = (action) => {
  if (action.filterAction === 'blockers') {
    setIsFlowPanelOpen(true);
    setHealthFilter('critical');
    setReasonFilter('block');
    setActiveQuickFilter('blocked');
  } else if (action.filterAction === 'stale') {
    setIsFlowPanelOpen(true);
    setHealthFilter('critical');
  }
  setTimeout(() => {
    document.getElementById(action.navTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
};
```

To add handling for a new `filterAction` value, add an `else if` branch here.

---

## 16. Adding a New API Endpoint

### Step 1 — Add the handler in `backend/src/routes/upload.js`

```javascript
router.get('/stats', (req, res) => {
  const logs = readImportLogs();
  const stats = {
    totalImports: logs.length,
    successfulImports: logs.filter((l) => l.status === 'success').length,
    latestImport: logs[0]?.importedAt || null,
  };
  res.json(stats);
});
```

Alternatively, create a new router file at `backend/src/routes/stats.js` and register it in `backend/src/index.js`.

### Step 2 — Register in `index.js` (if new router file)

```javascript
const statsRouter = require('./routes/stats');
app.use('/api/stats', statsRouter);
```

The existing `uploadRouter` is registered at `/api/upload`:
```javascript
app.use('/api/upload', uploadRouter);
```

### Step 3 — Call from frontend `api.js`

```javascript
export async function fetchUploadStats() {
  const response = await fetch(`${API_BASE}/upload/stats`);
  return response.json();
}
```

### Step 4 — Handle in React state

In `App.js` or a component:

```javascript
const [uploadStats, setUploadStats] = useState(null);

useEffect(() => {
  fetchUploadStats().then(setUploadStats);
}, []);
```

**Concrete example — GET `/api/upload/stats`:**

This endpoint already works as described in step 1 above using the existing `readImportLogs()` from `importLogs.js` which is already imported in `upload.js`. The `router.get('/logs', ...)` handler on line 78 of `upload.js` shows the exact pattern to follow.

---

## 17. CSS Patterns and Naming Conventions

### 17.1 Dark Mode

Dark mode is triggered by the `.dark` class on `.app.shell` (set by `setTheme` in `App.js`). All dark overrides are in `styles.css` starting at line 2345, using the pattern:

```css
.dark .my-component {
  border-color: #293548;
  background: rgba(17, 24, 39, 0.92);
  color: #f8fafc;
}
```

There is no CSS `prefers-color-scheme` media query — the theme is always driven by the `.dark` class. To add dark styles for a new component:

```css
/* Light (default) */
.my-new-panel {
  background: white;
  color: #0f172a;
  border: 1px solid #e5e7eb;
}

/* Dark */
.dark .my-new-panel {
  background: rgba(17, 24, 39, 0.92);
  color: #f8fafc;
  border-color: #293548;
}
```

### 17.2 Animation Classes

All animations are `@keyframes` defined at lines 3067–3151 of `styles.css`:

| Keyframe | Usage | Effect |
|---|---|---|
| `fadeIn` | `.help-backdrop`, `detail-modal-backdrop`, `.scroll-top-fab` | opacity 0→1 |
| `helpIn` | `.help-panel` | opacity + translateY(18px) + scale(0.98) → normal |
| `cardSlideIn` | `.help-card` | opacity + translateY(12px) → normal |
| `panelIn` | `.dashboard-panel`, `.dashboard-section`, `.issue-highlight-card`, `.kpi-card` | opacity + translateY(10px) → normal |
| `growBar` | `.status-bar-fill` | scaleX(0→1) from left |
| `driftGlow` | `.kpi-card::after` | translate + scale pulsing loop |
| `growHeight` | `.quarter-total`, `.quarter-done` | scaleY(0→1) from bottom |
| `rotateIn` | `.donut-chart`, `.mini-circle`, `.delivery-circle` | rotate(-40deg) + scale(0.94) → normal |

To apply `panelIn` to a new element:
```css
.my-new-card {
  animation: panelIn 420ms ease both;
}
```

### 17.3 Colour Tokens

**KPI card colour tokens** (set per `.accent-*` class):
- `--kpi-color` — left accent stripe gradient start; border highlight; threshold segment colours
- `--kpi-color-2` — left accent stripe gradient end
- `--kpi-panel` — composite radial+linear gradient for the card background

**Section colour tokens** (set per `.section-*` class):
- `--section-color` — left 8px stripe gradient start; eyebrow pill colour; icon background
- `--section-color-2` — left 8px stripe gradient end
- `--section-tint` — `rgba` used in the section background `linear-gradient`

**Panel colour tokens** (set per `.panel-*` class):
- `--panel-color` — 4px top stripe gradient start
- `--panel-color-2` — 4px top stripe gradient end

**Issue highlight card tokens** (set per `.card-*` class):
- `--issue-color` — eyebrow pill colour; count badge colour; li hover border; issue key background
- `--issue-color-2` — top stripe gradient end
- `--issue-glow` — radial glow background and decorative circle

---

## 18. Testing

### 18.1 Running Backend Tests

```bash
cd backend
npm test
# Runs: node --test
# Executes: backend/tests/metrics.test.js
```

The test runner is Node's built-in test runner (Node 18+). No Jest or Mocha.

### 18.2 Test File Structure (`metrics.test.js`)

```javascript
const assert = require('assert');
const { calculateDashboardMetrics } = require('../src/services/metrics');

const mockIssues = [
  { 'Status': 'Done', 'Blocked Flag': false, 'Issue Type': 'Story', 'Customer Visible': 'true', 'Effort Confidence': '4' },
  { 'Status': 'In Progress', 'Blocked Flag': true, 'Issue Type': 'Defect', 'Customer Visible': 'false', 'Effort Confidence': '3' },
  { 'Status': 'Done', 'Blocked Flag': false, 'Issue Type': 'Bug', 'Customer Visible': 'true', 'Effort Confidence': '5' },
];

const metrics = calculateDashboardMetrics(mockIssues);

assert.strictEqual(metrics.totalIssues, 3);
assert.strictEqual(metrics.doneIssues, 2);
assert.strictEqual(metrics.blockedIssues, 1);
assert.strictEqual(metrics.openDefects, 1);
assert.strictEqual(metrics.totalCustomerVisible, 2);
assert.strictEqual(metrics.customerVisibleProgress, 100);
assert.strictEqual(metrics.overallDeliveryConfidence, 4);

console.log('metrics.test.js passed');
```

**To add a new test case:**

```javascript
// Test blocked ratio
const blockedRatioMetrics = calculateDashboardMetrics([
  { 'Status': 'In Progress', 'Blocked Flag': 'true', 'Issue Type': 'Story' },
  { 'Status': 'In Progress', 'Blocked Flag': false, 'Issue Type': 'Story' },
]);
assert.strictEqual(blockedRatioMetrics.totalIssues, 2);
assert.strictEqual(blockedRatioMetrics.blockedIssues, 1);
```

Each issue object only needs the fields relevant to the assertion. `parseNumber`, `parseDate`, and `getHealthFromIssue` all handle missing fields by returning `0` or `null`.

### 18.3 Manual Testing Checklist

Before every commit:

1. Upload a `.csv` Jira export — verify the dashboard renders without console errors.
2. Upload a `.xlsx` Jira export — verify the same.
3. Upload a file with a missing essential field (`Issue Key`) — verify a 422 error message appears in the UI.
4. Upload a file larger than 20 MB — verify the 413 error message appears.
5. Click every quick filter (`High risk`, `Blocked`, `Needs review`) — verify the flow table updates and the filter count badge changes.
6. Click `Save layout view` — reload the page, upload again, verify filters are not persisted across sessions (they are only restored within the same session via `localStorage` read on mount, which is not currently implemented — `saveLayout` only writes).
7. Open the Help Guide — tab through all 17 sections, verify each journey displays its steps.
8. Click the Health Score gauge — verify the Manager Report opens.
9. Toggle Dark Mode — verify all panels and text are legible.
10. Resize the browser to 520px width — verify the KPI grid collapses to 1 column.

---

## 19. Common Patterns — Quick Reference

### Add a new `CompactBarChart` panel

```jsx
<section className="dashboard-panel panel-my-chart">
  <PanelTitle helpTopic="mySection" onOpenHelp={onOpenHelp}>My Chart Title</PanelTitle>
  <CompactBarChart
    rows={data.myData?.slice(0, 8)}
    labelKey="name"
    valueKey="count"
    emptyMessage="No data found."
  />
</section>
```

Add to `styles.css`:
```css
.panel-my-chart { --panel-color: #2563eb; --panel-color-2: #14b8a6; }
```
Add `.panel-my-chart` to the `::before` selector list in `styles.css`.

### Add a new `MetricTable` panel

```jsx
<section className="dashboard-panel panel-my-table">
  <PanelTitle helpTopic="mySection" onOpenHelp={onOpenHelp}>My Table Title</PanelTitle>
  <MetricTable
    columns={[
      { key: 'name', label: 'Name' },
      { key: 'count', label: 'Count' },
      { key: 'rate', label: 'Rate', render: (row) => `${row.rate}%` },
    ]}
    rows={data.myTableData}
    emptyMessage="No data found."
  />
</section>
```

### Add a new `split-panels` row

```jsx
<div className="split-panels">
  <section className="dashboard-panel panel-left">...</section>
  <section className="dashboard-panel panel-right">...</section>
</div>
```

### Add a new section with `SectionHeader`

```jsx
<section id="section-my-section" className="dashboard-section section-my-section">
  <SectionHeader
    icon="🔢"
    kicker="My kicker"
    title="My section title"
    detail="Subtitle text explaining this section."
    helpTopic="mySection"
    onOpenHelp={onOpenHelp}
  />
  {/* panels go here */}
</section>
```

### Add a new KPI card

```jsx
<KpiCard
  label="My Metric"
  value={data.myMetric || 0}
  detail="Explanation of the number"
  accent="blue"
  onClick={() => handleKpiNavigation('section-my-section')}
  tooltip="What this metric means."
  thresholds={{ good: 80, warning: 60, critical: 30, max: 100, unit: '%' }}
/>
```

### Add a new smart recommendation

Inside the `smartActions` `useMemo`, before `return acts.slice(0, 5)`:
```javascript
if (someCondition)
  acts.push({
    type: 'warning',
    icon: '🔢',
    navTarget: 'section-my-section',
    filterAction: null,
    title: 'My recommendation title',
    detail: 'Specific detail about what was found',
  });
```

### Add a new help guide section

In `SECTION_STEPS` in `HelpGuide.js`:
```javascript
mySection: steps('#2563eb', 'linear-gradient(135deg,rgba(37,99,235,.13),rgba(20,184,166,.08))', [
  { icon: '🔢', eyebrow: 'Overview', title: 'My section explained', body: '...', tip: '...' },
]),
```

In `TAB_LABELS`:
```javascript
mySection: 'My Section',
```

---

## 20. Troubleshooting

### "No file uploaded. Please upload a Jira Excel or CSV export."

**Cause:** The `POST /api/upload` request was sent without a file, or the `FormData` field name was not `"file"`.

**Fix:** Verify `formData.append('file', file)` uses the key `"file"` in `frontend/src/services/api.js`. Verify the request reaches the backend (check the network tab for the POST request).

### CORS errors in browser

**Cause:** The `ALLOWED_ORIGIN` env var in `backend/.env` does not match the frontend's actual origin.

**Fix:** Set `ALLOWED_ORIGIN=http://localhost:3000` in `backend/.env`. For production, set it to the deployed frontend URL (e.g., `ALLOWED_ORIGIN=https://your-domain.com`). Multiple origins: comma-separated. Restart the backend after changing `.env`. The CORS config is in `backend/src/index.js`:
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map((o) => o.trim())
  : true;   // true = allow all origins (development default)
```

### React "rendered more hooks than previous render"

**Cause:** A hook call is inside a conditional, a loop, or a function called before the hooks section. In `DashboardPage.js`, the most common cause is calling `useMemo` or `useEffect` inside a conditional render block.

**Fix:** Move all hook calls to the top of the function, unconditionally. In `DashboardPage.js`, all 21 `useState` calls and all `useEffect` and `useMemo` calls must appear before any `return` statement or conditional check.

### Metrics return `undefined` fields

**Cause:** `calculateDashboardMetrics` was called with an empty array or issues with no relevant fields.

**Debug steps:**
1. Add `console.log(issues[0])` in `calculateDashboardMetrics` to verify the first issue has the expected keys.
2. Check that `canonicalizeHeader` is resolving the field name correctly by logging `Object.keys(issues[0])`.
3. Check `FIELD_ALIASES` for the field in question.
4. Verify `parseJiraFile` did not silently drop rows — check `rawRows.length` vs `issues.length`.

### Build fails with CSS parse error

**Cause:** The most common cause is `color-mix(in srgb, ...)` syntax, which requires a modern browser target. CRA 5 (react-scripts 5) and modern PostCSS handle it, but older build pipelines may not.

**Fix:** The `frontend/package.json` already sets `browserslist` to the last 1 Chrome/Firefox/Safari version for development. If a CI/CD build targets older browsers, add the following to `frontend/package.json`:
```json
"browserslist": {
  "production": [">0.2%", "not dead", "not op_mini all"]
}
```
This matches the existing config. If the error persists, replace `color-mix(...)` expressions with hardcoded hex values as a fallback.

### Rate limit in development

**Cause:** `uploadLimiter` in `backend/src/routes/upload.js` allows 20 uploads per 15 minutes per IP. In a test loop you can hit this quickly.

**Fix:** In `backend/src/routes/upload.js`, temporarily increase the limit:
```javascript
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,   // was 20
  ...
});
```
Do not commit this change. For automated tests, consider adding a `NODE_ENV !== 'test'` guard around the rate limiter middleware.
