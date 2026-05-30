triggers `setShowManagerReport(false)` via `onKeyDown` handler on the modal overlay.
- At step 9: Right arrow key event advances `currentStep` state within the Help Guide component.
- At step 10: Escape key event triggers `onClose()` from the Help Guide's `onKeyDown` handler.
- At step 12: Escape key event triggers `setDetailPanel(null)`.

#### Expected Outcome

All dashboard sections, modals, and interactive controls are reachable and operable via keyboard alone. No mouse interaction is required for any core workflow.

#### Business Value Delivered

- NFR-012, NFR-013: Minimum touch targets and keyboard operability support WCAG 2.1 compliance goals.
- Broadens the accessible user base of the product.

#### Alternate Paths

- **Alternate 1:** A specific interactive element has no visible focus indicator (a CSS gap). The element is still Tab-reachable but the user cannot see which element is focused. This would be a bug requiring a `focus-visible` CSS fix.
- **Alternate 2:** The SectionNav dots are not Tab-reachable (positioned absolutely on the right edge). This is a known gap; smooth-scroll navigation is supplemented by Tab-accessible section links elsewhere.

#### Related Scenarios and Test Cases

- Related: SC-007 (first-time user), SC-030 (help guide)
- Test Case: AC-026 (Escape closes Detail modal), AC-039 (arrow key navigation)

---

### SC-026 — Mobile Field Review During Commute

**Category:** F — Onboarding and Adoption
**Actors:** Sarah Chen (Engineering Manager)

#### Business Context

You are Sarah Chen. You are on a train commute and have 20 minutes before a phone call with your VP. Your colleague has already uploaded Monday's export from the office. You open Delivery Clarity on your phone browser to get a quick health check before the call.

#### Trigger Event

Sarah opens the dashboard on a 375 px-wide mobile viewport (iPhone SE).

#### Pre-conditions

- The dashboard is already loaded in a browser session (the upload was performed from a desktop earlier; Sarah is opening the URL on her phone, which requires re-uploading since state is session-scoped — or alternatively, the session URL is shared with the same browser on the same device).
- Note: for a fully realistic mobile scenario, Sarah uploads from her phone directly.
- Viewport width is 375 px.

#### Narrative Description

You are Sarah Chen. On the train, you open the Delivery Clarity URL on your iPhone SE. The upload page appears in a clean single-column layout. You had emailed yourself the squad export earlier. You open the email, download the attachment, and use the "Share → Upload to Delivery Clarity" approach — you tap the file input button on the upload page (drag-and-drop is not available on iOS Safari; the file input tap works instead). You select the file from the Files app.

Four seconds later the dashboard loads. The layout has reflowed to a single column. The health score gauge is centred and full-width. The SmartAction cards stack vertically. The KPI cards — which are a 3×2 grid on desktop — are a 2×3 grid on mobile. The sticky filter bar is present but shows abbreviated button labels on narrow viewports.

You scroll through the dashboard using your thumb. The SectionNav dots on the right edge are correctly positioned and sized (44 × 44 px tap targets). You tap the SectionNav dot for "Summary" and the page scrolls to the top. You tap the dot for "Sprint" and the page scrolls to the Sprint section.

You tap "Quick Overview." The Manager Quick Overview modal opens in a full-screen overlay with iOS safe-area insets applied — the content does not bleed under the iPhone notch. You read the snapshot grid (2-column layout in the modal on mobile). The health score and the key numbers are readable. You tap "Back to dashboard."

Before your call begins, you have the health score (74), the count of blocked items (3), and the sprint completion rate (68%). That is enough for the VP call.

#### Step-by-Step Walkthrough

1. Sarah opens Delivery Clarity URL on iPhone SE (375 px viewport).
2. Upload page renders in single-column mobile layout.
3. Sarah taps the file input; selects the squad export from Files app.
4. Upload proceeds; dashboard loads in under 5 seconds.
5. Dashboard reflowed to single column; KPI grid is 2×3; SmartActions stack vertically.
6. Sarah scrolls vertically; all sections readable; no horizontal scroll.
7. Sarah taps SectionNav dot for "Sprint"; page smooth-scrolls to Sprint section.
8. Sarah reads Sprint section: 68% completion rate.
9. Sarah taps "Quick Overview"; modal opens full-screen with safe-area insets.
10. Sarah reads: health score 74, 3 blocked, 68% sprint completion.
11. Sarah taps "Back to dashboard"; modal closes.
12. Sarah joins VP call with the three key numbers ready.

#### System Behaviour

- At step 3: Mobile browsers support `<input type="file">` tap interaction; `onChange` fires with the selected file; `api.js` constructs the `FormData` and calls `POST /api/upload`.
- At step 6: CSS media queries reflow the grid layouts at breakpoints; no horizontal overflow is generated.
- At step 9: Modal CSS includes `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)` to handle the iOS notch/home indicator areas.

#### Expected Outcome

Sarah completes a mobile health check in under 8 minutes on a 375 px viewport with no layout issues, and enters the VP call with three specific numbers.

#### Business Value Delivered

- NFR-013: 375 px minimum viewport support enables meaningful mobile use for read/review workflows.
- BO-01: Preparation time for an ad hoc VP call is under 8 minutes even from a mobile device on a commute.

#### Alternate Paths

- **Alternate 1:** The dashboard's Flow Health table, with 11 columns, is difficult to read on a 375 px screen. Marcus accepts that the Flow Health table is a power-user feature best used on a desktop; the summary sections (health score, SmartActions, KPI cards, Manager Report) are the primary mobile use case.
- **Alternate 2:** The file is too large to upload on a mobile data connection (slow upload). Sarah waits until she reaches a WiFi connection.

#### Related Scenarios and Test Cases

- Related: SC-015 (dark mode / print), SC-007 (first-time user)
- Test Case: AC-033 (375 px no horizontal scroll)

---

### SC-027 — Justification Insights Copy-Paste Into Status Email

**Category:** C — Executive Reporting
**Actors:** Product Manager / Business Analyst

#### Business Context

You are a business analyst responsible for the weekly delivery status email sent to 12 stakeholders including the COO and two VPs. The email has a "Delivery Health Summary" section that currently takes you 25 minutes to write by hand, synthesising notes from three engineering managers. You want to use Delivery Clarity's Justification panel to generate this narrative automatically.

#### Trigger Event

Business analyst opens the Justification panel on the dashboard after a successful upload and reads the generated insights.

#### Pre-conditions

- A valid Jira export has been uploaded.
- `insights` array in the metrics payload contains at least 3 non-empty strings.
- The Justification panel is rendered between the Relations and Readiness sections.

#### Narrative Description

You are a business analyst. You upload the combined quarterly export — all three engineering teams' backlogs merged into a single file. The dashboard loads; health score 68 (Moderate). You scroll through the sections until you reach the Justification panel.

The panel displays five insight strings, formatted as styled paragraph text:

1. "Average lead time is 8.3 days — above the healthy threshold of 7 days. Consider reviewing backlog prioritisation to reduce items waiting more than 30 days before being started."
2. "Average cycle time is 4.1 days — within acceptable range. Active work is progressing efficiently once started."
3. "3 sprint datasets detected. Latest sprint completion rate is 71% — a positive signal."
4. "12 critical items currently open. Immediate attention recommended for items blocked by external dependencies."
5. "24% of completed story points were delivered in the last sprint — strong point delivery velocity maintained."

You select all five strings and copy them. You paste them directly into the "Delivery Health Summary" section of your weekly email, adjusting one word in the first sentence ("Consider reviewing" → "The team is reviewing"). The email reads naturally. You send it.

Total time to produce the delivery health narrative section: 3 minutes, down from 25 minutes.

#### Step-by-Step Walkthrough

1. Business analyst uploads the combined three-team export.
2. Dashboard loads; health score 68.
3. Analyst scrolls to the Justification panel (between Relations and Readiness sections).
4. Analyst reads 5 insight strings.
5. Analyst selects and copies the insight text.
6. Analyst pastes into the weekly status email draft.
7. Analyst makes minor wording adjustment.
8. Email is sent.

#### System Behaviour

- At step 4: `buildInsights(metrics)` has computed up to 5 insight strings based on `averageLeadTimeDays`, `averageCycleTimeDays`, `sprint.sprintCount`, `flow.critical`, and `storyPoints.pointCompletionRate`.
- The Justification panel (`panel-justification` class) renders the `insights` array as styled paragraph elements.

#### Expected Outcome

The delivery health narrative section of the weekly status email is produced in under 3 minutes using copy-pasted insight strings from the Justification panel.

#### Business Value Delivered

- BO-01: Narrative writing time reduced from 25 minutes to 3 minutes for this workflow.
- BO-02: Standardised insight language is consistent across weeks and teams.

#### Alternate Paths

- **Alternate 1:** The insights array contains fewer than 3 strings because insufficient data was available (e.g., no sprint data, no completed items). The analyst supplements with manual observation.
- **Alternate 2:** The insight language is too technical for the COO audience. The analyst rewrites the insights in simpler language; Delivery Clarity provides the raw data points, the analyst provides the appropriate register.

#### Related Scenarios and Test Cases

- Related: SC-003 (executive reporting), SC-021 (predicted delay)
- Test Case: AC-023 (dashboard renders summary), AC-041 (health endpoint)

---

### SC-028 — Rate Limit Hit by Automated Script

**Category:** G — Edge Cases and Error Recovery
**Actors:** Platform Engineer (automated test author)

#### Business Context

You are a platform engineer who has written an automated integration test that calls `POST /api/upload` 25 times in rapid succession to verify that the backend processes each request correctly. You run the test and the first 20 calls succeed; the next 5 return HTTP 429.

#### Trigger Event

An automated test script sends 25 upload requests to `/api/upload` within a 5-minute window from the same IP address.

#### Pre-conditions

- Rate limit is configured at 20 requests per 15-minute window (BIZ-011).
- The test script sends requests from a single IP address without delay between requests.
- Requests 1–20 are valid file uploads; requests 21–25 are identical to request 20.

#### Narrative Description

You are the platform engineer. Your integration test runs at 10:03 AM. The first 20 requests complete successfully, each returning HTTP 200 with a metrics payload. The test logs show: requests 1–20, status 200, elapsed time 1.2–2.8 seconds each. Then: request 21, status 429, body `{ "error": "Too many uploads from this IP. Please wait 15 minutes before trying again." }`. Requests 22–25 also return 429.

You check the response headers on request 21: `RateLimit-Limit: 20`, `RateLimit-Remaining: 0`, `RateLimit-Reset: [timestamp]`. The timestamp is 15 minutes after request 1 was sent. You confirm the rate limiter is working correctly. You update your integration test to add a 45-second delay between request groups, or to mock the upload endpoint for volume testing rather than hitting the live server.

You document the rate limit in the team wiki: "The `/api/upload` endpoint is rate-limited to 20 requests per 15-minute window per IP. Automated tests must account for this. Use mock/stub for volume testing."

#### Step-by-Step Walkthrough

1. Platform engineer runs integration test: 25 upload requests in rapid succession.
2. Requests 1–20: HTTP 200 with valid metrics payloads.
3. Request 21: HTTP 429, body `{ "error": "Too many uploads from this IP..." }`.
4. Requests 22–25: HTTP 429.
5. Engineer reads response headers: `RateLimit-Limit: 20`, `RateLimit-Remaining: 0`, `RateLimit-Reset: [timestamp]`.
6. Engineer confirms rate limiter is functioning as specified (BIZ-011).
7. Engineer updates test to delay between request groups or use mock.
8. Engineer documents the rate limit in the team wiki.

#### System Behaviour

- `express-rate-limit` middleware applied to `POST /api/upload` tracks request count per IP in a 15-minute rolling window.
- After 20 requests: counter reaches limit; subsequent requests return HTTP 429 with the configured error message.
- Standard `RateLimit-*` headers are sent (legacy `X-RateLimit-*` headers disabled as specified in FR-001).
- The rate limit applies only to `POST /api/upload`; `GET` endpoints are not rate-limited.

#### Expected Outcome

The automated test correctly identifies the rate limit boundary (20 requests per 15 minutes) and the engineer updates the test strategy accordingly.

#### Business Value Delivered

- NFR-005: Rate limiting is verified to protect the backend from abuse or accidental overload.
- The clear error message (`"wait 15 minutes"`) enables self-service diagnosis by the engineer.

#### Alternate Paths

- **Alternate 1:** The engineer needs to run more than 20 uploads in a test cycle. They set up the test server with a higher rate limit configured via environment variable (a future roadmap item; in v1.0, the limit is hardcoded at 20/15min).
- **Alternate 2:** Multiple engineers on the same VPN share a single egress IP. Their combined uploads could hit the rate limit unexpectedly. This is documented as a known constraint (RISK-09 in the BRD).

#### Related Scenarios and Test Cases

- Related: SC-014 (file size error), SC-023 (import log audit)
- Test Case: AC-004 (rate limit 429)

---

### SC-029 — Year Rollover — Copyright Date

**Category:** G — Edge Cases and Error Recovery
**Actors:** All users (passive)

#### Business Context

This scenario documents the expected system behaviour at the calendar year boundary. The footer of the application displays a copyright year. The organisation wants to confirm that the copyright year updates automatically on 1 January 2027 without a code change or redeployment.

#### Trigger Event

A user opens Delivery Clarity on 1 January 2027.

#### Pre-conditions

- The server clock advances past midnight on 31 December 2026 / 1 January 2027.
- The copyright year in `App.js` is rendered dynamically using `new Date().getFullYear()`.
- No code changes or redeployment are required.

#### Narrative Description

You are a developer at the organisation. On 2 January 2027, a colleague mentions they noticed the footer on the Delivery Clarity dashboard says "2027" — "did someone update that?" You check the codebase. The `App.js` footer renders `© {new Date().getFullYear()} Ali Abu Ras · Delivery Clarity`. No hardcoded year. The year is evaluated at render time — specifically, each time the React component renders, `new Date().getFullYear()` returns the current year from the system clock.

On 1 January 2027, when any user loaded the dashboard, the footer displayed "2027" automatically. No deployment was required. The same pattern applies on 1 January 2028.

There is one nuance: the year displayed is the client's local system time year, not the server's year. For users in UTC-12 (Baker Island), the year would have rolled over on 1 January 2027 at 12:00 UTC — meaning a user loading the page between midnight UTC and noon UTC on 1 January would see "2027" in some time zones and "2026" in others. This is a cosmetic edge case with no functional impact.

#### Step-by-Step Walkthrough

1. Server clock advances to 1 January 2027.
2. User opens Delivery Clarity in their browser.
3. React renders `App.js`; `new Date().getFullYear()` returns `2027`.
4. Footer displays: "© 2027 Ali Abu Ras · Delivery Clarity."
5. No code change or redeployment required.

#### System Behaviour

- `new Date().getFullYear()` is evaluated in the browser at render time.
- The value is derived from the user's local system clock.

#### Expected Outcome

The copyright year updates automatically without any manual intervention on 1 January 2027.

#### Business Value Delivered

- Reduces operational maintenance burden (no annual "update the copyright year" task).
- Eliminates the risk of incorrect copyright year in stakeholder-facing reports.

#### Alternate Paths

- **Alternate 1:** The React component is server-side rendered (not the case in v1.0, which is a client-side SPA). In an SSR setup, `new Date().getFullYear()` would be evaluated at the server's system time.

#### Related Scenarios and Test Cases

- This scenario is primarily a design verification rather than a functional test scenario.
- Test Case: Verify that `App.js` footer does not contain a hardcoded year string.

---

### SC-030 — Help Guide First Use — Welcome Journey Completion

**Category:** F — Onboarding and Adoption
**Actors:** New team member (any role)

#### Business Context

You are a new scrum master who has just joined the Growth Tribe. Your engineering manager Sarah has told you to start using Delivery Clarity for sprint ceremonies. You have no prior experience with the tool. Before touching any of the filters or sections, you want to understand what the dashboard is showing you and what the health score means.

#### Trigger Event

New team member opens the Help Guide from the "Help" button in the dashboard header after seeing the dashboard for the first time.

#### Pre-conditions

- A valid Jira export has been uploaded (by Sarah or another team member).
- The dashboard is rendered and visible.
- The new team member has not previously used Delivery Clarity.

#### Narrative Description

You are a new scrum master joining the Growth Tribe. Sarah has just shown you the dashboard — health score 71, several amber cards. You want to understand what you are looking at before taking any action. You click the "?" Help button in the application header. A modal overlay appears — the Help Guide.

The guide opens to the "welcome" section. The title reads "Welcome to Delivery Clarity." Step 1 of 4 explains what the tool does: "Delivery Clarity transforms your Jira export into a real-time delivery health dashboard. Upload a file — get immediate insights." Step 1 has a brief animated illustration (a file icon transforming into a dashboard).

You press the right arrow key. Step 2: "Your Delivery Health Score (0–100) is a composite of six signals: completion rate, critical items, warning items, sprint completion, orphan items, and cycle time." A diagram shows the six components with their weights.

You press right arrow again. Step 3: "The five score bands — Excellent, Good, Moderate, At Risk, Critical — tell you at a glance how your delivery is trending. Green means things are working well. Red means immediate action is needed."

You press right arrow. Step 4: "Start by reading the Smart Recommendations — they tell you the most important things to act on right now." A "Start exploring →" button appears. You click it. The Help Guide closes and focus returns to the dashboard.

You now understand the health score (71 = Moderate, not an emergency but not comfortable), the five band labels, and where to look first (SmartActions). You read the two SmartAction cards present on the dashboard — one about stale work, one about an orphan ratio — and understand what they mean. Your first Delivery Clarity session is productive within 12 minutes of opening the tool.

#### Step-by-Step Walkthrough

1. New team member clicks the Help button in the application header.
2. `onOpenHelp('welcome')` is called; Help Guide opens with `activeSection = 'welcome'`.
3. Help Guide displays Step 1 of 4: welcome and tool overview.
4. Team member presses right arrow key; Step 2 displays: health score formula overview.
5. Team member presses right arrow key; Step 3 displays: score band explanations.
6. Team member presses right arrow key; Step 4 displays: SmartActions orientation + "Start exploring →" button.
7. Team member clicks "Start exploring →"; Help Guide closes (`onClose()` called).
8. Focus returns to dashboard; team member reads SmartAction cards.
9. Team member understands the dashboard context within 12 minutes.

#### System Behaviour

- At step 2: `setHelpOpen(true)` and `setHelpSection('welcome')` are called in `App.js`; `HelpGuide` component renders with `activeSection = 'welcome'`.
- At step 4: Right arrow key event fires; `currentStep` increments from 0 to 1; Step 2 content renders.
- At step 7: "Start exploring →" button calls `onClose()`; `setHelpOpen(false)` in `App.js`; Help Guide unmounts.

#### Expected Outcome

A brand-new user understands the core concepts of the Delivery Health Score, score bands, and Smart Recommendations in under 5 minutes, entirely through self-guided navigation of the Welcome journey.

#### Business Value Delivered

- BO-06: Reduces onboarding friction for new team members; they do not need a demo or training session to understand the core product model.
- BO-07: Positive first-use experience drives NPS — users who understand the tool quickly are more likely to recommend it.

#### Alternate Paths

- **Alternate 1:** The new team member closes the Help Guide after Step 2 (Escape key). They can reopen it at any time from any HelpButton on any section header — each HelpButton opens the guide to the relevant section.
- **Alternate 2:** The new team member wants to read all 17 help sections. They can navigate between sections using the section tabs or links within the guide, reading each journey in order.

#### Related Scenarios and Test Cases

- Related: SC-007 (first-time user), SC-025 (keyboard navigation)
- Test Case: AC-038 (17 Help Guide sections), AC-039 (arrow key navigation)

---

## 4. Scenario Coverage Map

| Scenario ID | Name (Abbreviated) | Category | Primary Actor | Risk Level | Business Value |
|---|---|---|---|---|---|
| SC-001 | Sprint Velocity Drop | A — Sprint Review | Scrum Master | High | High |
| SC-002 | Blocker Escalation | B — Blocker/Risk | Engineering Manager | High | High |
| SC-003 | Executive Weekly Briefing | C — Executive Reporting | Director | High | High |
| SC-004 | Overloaded Assignee | D — Capacity | Engineering Manager | High | High |
| SC-005 | Release Gate Decision | E — Release Readiness | Product Owner | High | High |
| SC-006 | Orphan Items Audit | B — Blocker/Risk | Eng. Manager + Team Lead | Medium | High |
| SC-007 | First-Time User Onboarding | F — Onboarding | Developer | Medium | High |
| SC-008 | Multi-Project Export | A — Sprint Review | Scrum Master | Low | Medium |
| SC-009 | Dependency Chain Blocked | B — Blocker/Risk | Engineering Manager | High | High |
| SC-010 | Stale Work Triage | B — Blocker/Risk | Scrum Master | High | High |
| SC-011 | Sprint Planning Capacity Check | D — Capacity | Scrum Master + Eng. Manager | Medium | High |
| SC-012 | Cycle Time Regression | A — Sprint Review | Engineering Manager | Medium | High |
| SC-013 | Missing Sprint Fields | G — Edge Cases | Scrum Master | Low | Medium |
| SC-014 | File Too Large — 413 | G — Edge Cases | Engineering Manager | Low | Low |
| SC-015 | Dark Mode Late-Night Report | C — Executive Reporting | Engineering Manager | Low | Medium |
| SC-016 | Filter and Share | A — Sprint Review | Scrum Master | Low | Medium |
| SC-017 | High Orphan Ratio Warning | B — Blocker/Risk | Eng. Manager + Team Lead | Medium | High |
| SC-018 | Low Health Score Panic | B — Blocker/Risk | Engineering Manager | High | High |
| SC-019 | Perfect Sprint Celebration | A — Sprint Review | Scrum Master | Low | Medium |
| SC-020 | Label-Based Team Reporting | A — Sprint Review | Product Owner | Low | Medium |
| SC-021 | Predicted Delay | E — Release Readiness | Eng. Manager + Director | High | High |
| SC-022 | Kanban Bottleneck Discovery | B — Blocker/Risk | Scrum Master | High | High |
| SC-023 | Backend Import Log Audit | F — Onboarding | Platform Engineer | Low | Medium |
| SC-024 | Competitive Evaluation Demo | F — Onboarding | Prospective User | Medium | High |
| SC-025 | Keyboard-Only Navigation | G — Edge Cases | Accessibility User | Medium | Medium |
| SC-026 | Mobile Field Review | F — Onboarding | Engineering Manager | Low | Medium |
| SC-027 | Justification Copy-Paste | C — Executive Reporting | Business Analyst | Low | Medium |
| SC-028 | Rate Limit Hit | G — Edge Cases | Platform Engineer | Low | Low |
| SC-029 | Year Rollover | G — Edge Cases | All Users (passive) | Low | Low |
| SC-030 | Help Guide First Use | F — Onboarding | New Team Member | Low | High |

---

## 5. Acceptance Scenarios — Go-Live Gate

The following 10 scenarios must pass in full before Delivery Clarity v1.0 is approved for production deployment. Each scenario must be walked through end-to-end by a tester using a representative Jira export, and all Expected Outcome criteria must be met.

| Priority | Scenario ID | Name | Rationale for Go-Live Inclusion |
|---|---|---|---|
| 1 | SC-001 | Sprint Velocity Drop Detected | Core scrum master use case; validates upload pipeline, Sprint Status section, flow filter, and risk export. Failure here means the primary weekly workflow is broken. |
| 2 | SC-003 | Executive Weekly Briefing | Core executive reporting use case; validates Manager Quick Overview modal, health score display, print mode, and snapshot grid accuracy. Failure here means the director-facing output is not trustworthy. |
| 3 | SC-002 | Blocker Escalation | Core risk escalation use case; validates Blocked quick filter, Attention strip, Relations section (blockedItems), and risk CSV export. Failure here means the most urgent delivery signal is not surfaced. |
| 4 | SC-005 | Release Gate Decision | Core product owner use case; validates Epic Readiness section, Detail modal, Relations dependency chain, and prediction card. Failure here means the release decision support capability does not work. |
| 5 | SC-018 | Low Health Score Drill-Down | Validates the health score formula under adverse conditions (all components poor), SmartAction card generation (all 5 present), and the Manager Report under Critical band. |
| 6 | SC-007 | First-Time User Onboarding | Validates the zero-configuration first-use experience: upload, immediate dashboard render, health classification accuracy, cycle time display, Help Guide accessibility. |
| 7 | SC-014 | File Too Large — 413 Error Recovery | Validates the error boundary and self-service recovery path. The system must reject oversized files with a clear, actionable message; if this is broken, users have no path forward. |
| 8 | SC-025 | Keyboard-Only Navigation | Validates accessibility baseline: all modals closable with Escape, Help Guide navigable with arrow keys, all interactive controls reachable via Tab. Required for the accessibility commitment in NFR-012 to NFR-015. |
| 9 | SC-004 | Overloaded Assignee | Validates the SmartAction for capacity imbalance (the BIZ-008 threshold), the Ownership section Capacity by Assignee table, and the Detail modal for assignee items. |
| 10 | SC-021 | Predicted Delay — Risk Conversation | Validates the predictive completion card (non-null path), the Manager Report prediction row, and the integration of velocity calculation into a realistic stakeholder risk conversation. |

### Go-Live Acceptance Criteria (Summary)

All 10 acceptance scenarios pass when:

1. A valid Jira XLSX or CSV file uploads in under 5 seconds and the dashboard renders with a visible health score.
2. The Manager Quick Overview modal opens, displays an 8-cell snapshot grid with correct values, and prints cleanly via the browser print dialog.
3. The "Blocked" quick filter correctly isolates blocked items; the risk CSV download contains the expected rows.
4. The Epic Readiness section correctly classifies at least one epic as critical risk when its completion is below 40%.
5. A health score of 38 or lower triggers the Critical band label and the deep-red health banner in the Manager Report.
6. A first-time user can upload a file and read a meaningful health score, SmartAction cards, and cycle time data without any prior training.
7. Uploading a file larger than 20 MB returns HTTP 413 with the specified error message text.
8. All modals close on Escape key press; Help Guide advances on right arrow key press; all interactive controls are reachable via Tab.
9. An export where one assignee holds >35% of open issues generates the capacity imbalance SmartAction card.
10. When `prediction.daysRemaining` is a positive integer, the prediction delta card is visible in the Summary bar; when it is null, the card is hidden.

---

---

## New Scenarios — v1.1 (2026-05-30)

### SC-031: First Impression — Summary Page as the Landing Experience

- **ID:** SC-031
- **Category:** F — Onboarding and Adoption
- **Actor(s):** New team member (developer, unfamiliar with the tool)
- **Business Context:** A developer was told by their engineering manager to check the team's delivery health before tomorrow's sprint review. They've never used Delivery Clarity before.

**Trigger:** Developer exports Jira CSV and navigates to the app for the first time.

**Pre-conditions:**
- Delivery Clarity is running locally on http://localhost:3000
- Developer has a valid Jira CSV export
- No previous session data in the browser

**Narrative:**
You are Jamie, a backend developer who has been asked to pull up the sprint health before tomorrow's review meeting. Your manager sent you a link to Delivery Clarity. You've never used it before. You open the URL and see the upload screen. You drag your Jira export onto it and hit Upload.

A moment later — you're not on a wall of charts. You're on a clean summary page. A large circle in the top left shows "74" with the word "Moderate" beneath it. You understand immediately: the project isn't great, but it's not in crisis. The banner beside it says "8 items need attention — 67% complete." That's the conversation you need to have tomorrow.

Below the banner, six compact KPI cards show you the key numbers. Cycle time is 3.1 days — that's fast. But there are 5 critical items. The attention cards below show 2 blockers, 3 overdue items, and 12 orphans. You didn't know any of this five minutes ago.

You read the four insights. One says: "3 critical and 5 warning items need attention based on age, overdue, blocked, priority, or cycle-time signals." That's your talking point for tomorrow. You click "View Full Report →" and explore the full dashboard.

**Step-by-Step Walkthrough:**
1. Opens http://localhost:3000 → UploadPage
2. Uploads Jira CSV
3. Lands on /summary (not the full 16-section dashboard)
4. Reads health score: 74, Moderate
5. Reads 6 KPI cards
6. Notes 2 blockers in attention section
7. Reads 4 insights
8. Clicks "View Full Report →"
9. Navigates to /dashboard

**Expected Outcome:** Developer arrives at sprint review prepared with specific numbers and evidence.

**Business Value:** Reduces time-to-value for new users from 15+ minutes to under 3 minutes.

**Related Use Cases:** UC-041, UC-042 | **Related Test Cases:** TC-101, TC-102, TC-106

---

### SC-032: Mobile Executive Check — Summary as the 20-Second View

- **ID:** SC-032
- **Category:** C — Executive Reporting
- **Actor(s):** Director of Engineering
- **Business Context:** Director is in back-to-back meetings and receives a Slack message asking "what's the current delivery status?" She has 30 seconds before the next meeting starts.

**Trigger:** Director opens Delivery Clarity on her phone mid-meeting.

**Pre-conditions:**
- Delivery Clarity is accessible on mobile (375px layout)
- A recent upload was done by a scrum master earlier that morning
- Director navigates to /summary on her phone

**Narrative:**
You are Diana, Director of Engineering. It's 10:58 AM, your next meeting is at 11:00, and someone just asked in Slack: "Do we know if the platform release is still on track?" You pull out your phone and open the team's Delivery Clarity dashboard.

The Summary page loads. There's no scrolling past charts to find the number — the health score is right there, a large "82 — Good" in green. The banner says "3 items need attention — 84% complete." You read the prediction chip: "~6d · Jun 5." That's before the release date. You're on track.

You type back in Slack: "84% complete, 3 items need attention, on track for Jun 5." You close the phone and walk into your meeting. Total time: 18 seconds.

**Step-by-Step Walkthrough:**
1. Opens /summary on mobile (375px)
2. Summary page layout renders in single column (mobile CSS active)
3. Health score circle and banner visible without scrolling
4. Prediction chip visible
5. Takes the information and communicates it verbally

**Expected Outcome:** Director can give an accurate status update in under 30 seconds.

**Business Value:** Reduces executive reporting friction to near-zero; increases leadership confidence.

**Related Use Cases:** UC-041 | **Related Test Cases:** TC-101, TC-103

---

### SC-033: Quick Status Before Standup — Help Deep-Link for Team Education

- **ID:** SC-033
- **Category:** A — Sprint Review Preparation
- **Actor(s):** Scrum Master, New Team Member
- **Business Context:** Scrum master is running the daily standup. A new team member asks "what does 'blocked' mean in the attention card?" The scrum master uses the help deep-link to explain.

**Trigger:** Scrum master clicks ? button on the Attention section heading.

**Pre-conditions:**
- Scrum master is viewing /dashboard
- Attention cards show blockers
- New team member is watching

**Narrative:**
You are Marcus, scrum master, running the daily standup over screen share. You're on the Delivery Clarity dashboard showing the team the 3 blockers in the Attention strip. A new team member asks: "What exactly counts as a blocker here? Does it have to be the Blocked Flag field or can it be anything?"

You click the ? button next to the Attention heading. Instead of an overlay interrupting your screen share, the page navigates to /help?section=attention. The attention section of the help guide opens immediately, step 1 of 4. It shows the "Three spotlight cards" explanation.

You click Next → "Top Blockers" step loads. It explains exactly: "An item appears as a blocker when its flow health reason contains block-related language — from Blocked Flag, priority signals, or dependency callouts." You read this aloud to the team. The new team member says "got it."

You click "← Back" and you're back on the dashboard, right where you were.

**Step-by-Step Walkthrough:**
1. Marcus is on /dashboard with attention cards visible
2. New team member asks about blocker classification
3. Marcus clicks ? button next to Attention cards section
4. Browser navigates to /help?section=attention
5. Help guide opens in page mode, attention section active, step 1 visible
6. Marcus clicks Next to reach "Top Blockers" step
7. Reads explanation aloud
8. Clicks "← Back"
9. Returns to /dashboard

**Expected Outcome:** Question answered with zero disruption to the dashboard view.

**Business Value:** The help system actively reduces onboarding friction during team ceremonies.

**Related Use Cases:** UC-042 | **Related Test Cases:** TC-108, TC-109

*Document prepared by Ali Abu Ras · Delivery Clarity v1.0 · 2026-05-30*
