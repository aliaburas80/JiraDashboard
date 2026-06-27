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

- The dashboard can load from bucket-backed latest metrics if Sarah is signed in to the same deployment; otherwise she can upload directly from the phone or rely on the same browser's localStorage fallback.
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

*Document prepared by Ali Abu Ras · Delivery Clarity v4.0 · 2026-06-03*

---

## v3.0 Scenarios (2026-05-31)

---

### SCN-012 — Scrum Master Reviews Sprint Throughput Before Retrospective

**Persona:** Sarah, Scrum Master, 5 years experience  
**Context:** Sprint 14 just ended. Sarah needs to present delivery performance in the retrospective.

**Scenario:**
1. Sarah uploads the Jira CSV export from Sprint 14
2. She navigates to /dashboard and expands "Throughput & Delivery Analytics"
3. SprintThroughputPanel shows Sprint 14: 10 committed, 7 completed, 70%, "Partially Met", mid-sprint 20%
4. The pattern badge reads "End-Loaded Sprint" — Sarah notes this for the retro
5. She sees the trend: "Declining" — last 3 sprints averaging 7.3 vs previous 3 averaging 9.1
6. She exports the Excel report and shares Sheet 04 Sprint Throughput with the team

**Outcome:** Sarah runs a data-backed retrospective focused on the end-loading pattern and velocity decline.

**Related:** UC-043, UJ-010, FR-207–FR-215, TC-T-01–TC-T-11

---

### SCN-013 — Product Owner Explores Epic Structure Before Sprint Planning

**Persona:** James, Product Owner, preparing for next sprint planning  
**Context:** EPIC-42 has 18 child stories. James wants to understand which are blocked and how far along they are.

**Scenario:**
1. James navigates to /explore
2. He types "EPIC-42" and clicks "Explore Issue"
3. The graph renders: EPIC-42 as root, 3 direct story children visible
4. He clicks STORY-105 in the graph → the graph re-renders with STORY-105 as focus, showing its 4 tasks
5. He sees one task with a red "Blocked" badge
6. The insights panel reads: "1 blocked item is holding remaining work in this story"
7. He reads the charts: 25% completion donut, assignee workload showing 3 tasks on one developer
8. James decides to reassign the blocked task in sprint planning

**Outcome:** Sprint planning is informed by live delivery structure, not stale status meetings.

---

### SCN-014 — Engineering Manager Spots Kanban Bottleneck

**Persona:** Amir, Engineering Manager, running a Kanban team  
**Context:** The team does not use sprints. Amir wants to understand flow health.

**Scenario:**
1. Amir uploads the Jira export — all issues have no Sprint field
2. Dashboard shows KanbanThroughputPanel with 3 monthly periods
3. March 2025 shows: flowEfficiency = 22%, bottleneckStatus = "Moderate", agingWipCount = 8
4. April 2025 shows flowHealth = "Degraded"
5. Amir exports Excel → Sheet 06 Kanban Flow shows the trend clearly
6. He shares the report with the team to discuss WIP limits

**Outcome:** Amir implements a WIP limit of 4 and monitors the next period for improvement.

---

### SCN-015 — First Login After Admin Setup

**Persona:** Ali, administrator setting up Delivery Clarity for the team  
**Context:** Ali has just run `npx ts-node prisma/seed.ts` and the admin account is created.

**Scenario:**
1. Ali navigates to /login
2. Enters `admin@deliveryclarity.com` and `Admin@DC2025`
3. Middleware was previously blocking /dashboard — now session is set and access granted
4. Ali visits /profile — sees name "Administrator", role badge "Admin"
5. Ali navigates to /admin/logs — sees all import logs across all users
6. Ali changes the admin password via the profile page

**Outcome:** Ali confirms auth is working and the team can begin uploading their Jira exports.

---

### SCN-016 — Manager Downloads Excel Report for Board Meeting

**Persona:** Rachel, Delivery Director, preparing a board update  
**Context:** Rachel needs to present project health to the board. She cannot share the web app in the meeting.

**Scenario:**
1. Rachel uploads the latest Jira export
2. She clicks Export → "Excel (all data)"
3. She opens Sheet 01 Executive Summary: health score 68, "Moderate", 3 critical recommendations
4. Sheet 13 Recommendations shows: "Escalate 3 blocked items — evidence: 3 items have Blocked Flag = true"
5. Sheet 11 Cycle & Lead Time shows P85 lead time of 18 days — she uses this as the team's delivery SLA
6. Rachel pastes the executive narrative into her board slide

**Outcome:** Rachel presents a data-backed delivery status without needing the app open.

---

## v4.0 Scenarios (2026-06-03)

---

### SCN-017 — Scrum Master Reviews Data Quality Score Before Trusting Metrics

**Persona:** Marcus, Scrum Master  
**Context:** Marcus notices that some KPI cards show "Low Confidence" badges. He wants to understand why before presenting the dashboard to leadership.

**Scenario:**
1. Marcus uploads the latest sprint export
2. On the column-mapping preview, he sees the Data Quality Score: 61% — Fair
3. The preview shows: "Missing fields: In Progress Date (impacts Cycle Time), Done Date (impacts Lead Time)"
4. He opens the dashboard and notices Cycle Time card has a yellow "Low" confidence badge
5. He hovers the badge: "Cycle Time requires In Progress Date. Only 12% of issues have this field."
6. Marcus shares the dashboard with a note: "Cycle Time data is unreliable this sprint — Jira In Progress Date not being set consistently."
7. He creates a team action item to update the Jira workflow to capture transition dates

**Outcome:** Marcus avoids presenting misleading metrics and creates a corrective action to improve data quality.

---

### SCN-018 — Admin Clears Local Browser Data Before Support Session

**Persona:** Admin user troubleshooting a stale dashboard for a team member  
**Context:** A team member reports seeing last week's data in their dashboard despite uploading a new file.

**Scenario (Planned — P1.2):**
1. The admin navigates to `/admin/settings`
2. In the "Local Data & Browser Session" section, they see a "Clear Local Data" button
3. Admin clicks "Clear Local Data"
4. A modal appears: "Warning: This will remove Delivery Clarity local data stored in this browser, including cached dashboard/session data and local preferences. It may also end your current session. You may need to log in again."
5. Admin reads: "Are you sure you want to clear local data and reset this browser session?"
6. Admin clicks "Yes, Clear Local Data"
7. All dc_ localStorage and sessionStorage keys are removed
8. The session cookie is cleared; the user is redirected to /login
9. On re-login and re-upload, the dashboard shows fresh data

**Outcome:** Stale data issue resolved without touching server-side records.

---

### SCN-019 — Returning User Sees Stored-Data Notice on Upload Page

**Persona:** Sarah, Engineering Manager  
**Context:** Sarah returns to the app two weeks after her last upload. She wants to upload a fresh Jira export.

**Scenario (Planned — P1.2):**
1. Sarah opens the app at `/`
2. The upload page detects stored data: `hasMetrics()` returns true
3. A notice appears: "Stored Delivery Clarity data was found in this browser."
4. Below the upload area, a secondary button reads "Clear stored data"
5. Sarah clicks "Clear stored data"
6. Confirmation modal: "This will remove cached dashboard data. Are you sure?"
7. Sarah confirms; data is cleared
8. She proceeds to upload her new Jira export
9. Dashboard loads with only the new data

**Outcome:** Sarah avoids confusion between old and new data without manual browser clearing.

---

### SCN-020 — Engineering Manager Uses Dashboard Section Switcher

**Persona:** Sarah, Engineering Manager  
**Context:** Sarah opens the Full Report dashboard. She finds the page overwhelming with all sections open and wants to focus just on sprint metrics.

**Scenario (Planned — P1.3):**
1. Sarah opens `/dashboard` after uploading
2. She sees the Overview section at the top, then a row of section buttons: Overview | Sprints | Kanban | Flow | Risks | Data Quality | ...
3. Default view shows only the top Overview (health score, KPIs, top risks, data quality summary)
4. Sarah clicks "Sprints"
5. The page smooth-scrolls to the Sprint section
6. The sprint panel fades in with a 180ms animation
7. All other heavy sections are hidden
8. The "Sprints" button has a highlighted active state
9. Sarah reviews sprint throughput, mid-sprint pattern, and sprint comparison
10. She clicks "Full Dashboard" to restore the full view

**Outcome:** Sarah gets a focused, clean view of sprint health without scrolling past irrelevant sections.

---

### SCN-021 — Engineering Manager Compares Two Snapshots Across Quarters

**Persona:** Sarah, Engineering Manager  
**Context:** Sarah saved a snapshot after the Q1 sprint and wants to compare it against the end-of-Q2 state.

**Scenario:**
1. Sarah navigates to `/snapshots`
2. She sees two saved snapshots: "Q1 End — Mar 2026" and "Q2 End — Jun 2026"
3. She selects both and clicks "Compare"
4. The comparison page shows a 12-metric delta table: Health Score ↑ +12, Completion Rate ↑ +8%, Blocked ↓ -3, Critical ↓ -5, Avg Cycle Time ↓ -1.4d
5. Positive deltas are green, negative risk deltas are green, worsened risk metrics are red
6. An insights paragraph reads: "Significant improvement in Q2: health score up 12 points, critical items reduced by 5, and cycle time shortened by 1.4 days."
7. Sarah copies the insights text into her quarterly business review presentation

**Outcome:** Sarah demonstrates measurable delivery improvement to leadership with data evidence.

---

### SCN-022 — Developer Checks Calculation Reference for Cycle Time Formula

**Persona:** Developer integrating Delivery Clarity into a CI pipeline  
**Context:** The developer wants to verify exactly how Cycle Time is calculated before building a downstream alerting system.

**Scenario (Planned — P1.1 — Calculation Reference in /developer):**
1. Developer navigates to `/developer`
2. In the blue side menu, they see a clear item: "Calculation Reference"
3. They click it; the page smooth-scrolls to the Calculation Reference section
4. They find "Cycle Time" with the following documented:
   - **What it is:** Elapsed days from when work started to when it was completed
   - **Formula:** `(doneDate - startedDate) / 86400000` in days, rounded to 1 decimal
   - **Data source:** `In Progress Date` field (or `Sprint Start` as fallback), `Done Date` (or `Resolution Date`)
   - **Why used:** Measures execution speed rather than total wait time (which Lead Time captures)
   - **Assumptions:** Issue must have both startedDate and doneDate; values > 3,650 days are discarded as data errors
   - **Limitations:** Does not account for time paused in waiting states (that's Flow Efficiency)
   - **Related code:** `src/services/metrics/metrics.service.ts — getHealthFromIssue(), daysBetween()`
5. Developer uses the formula in their alerting system

**Outcome:** Developer builds a correct integration without guessing at calculation details.


---

### SCN-023 — User Clears Stale Browser Data Before New Upload

**Persona:** Jordan, Scrum Master  
**Context:** Jordan uploaded a sprint file last week. Today they return to upload a new file but the dashboard is showing old data.

**Scenario:**
1. Jordan navigates to the Upload page (`/`)
2. An amber banner appears: **"Stored Delivery Clarity data was found in this browser."**
3. Jordan clicks "Clear Local Data" — a confirmation modal opens:
   - Title: "Clear Local Data?"
   - Warning: "This will remove local data and may end your current session. You may need to log in again."
4. Jordan clicks "Yes, clear it"
5. All `dc_*` localStorage/sessionStorage keys are removed
6. A green banner appears: "Local data cleared. Upload a new file to start fresh."
7. Jordan uploads the new sprint file; the dashboard shows current data

**Outcome:** Jordan eliminates stale cached data without needing DevTools or IT support.

---

### SCN-024 — C-Level Executive Reviews Dashboard Without Technical Noise

**Persona:** Emma, VP of Engineering  
**Context:** Emma needs to present delivery health at a board meeting. She does not need to see the issue-level flow table or sprint filters.

**Scenario:**
1. Emma opens `/dashboard` — full view loads with all technical sections
2. She selects "Executive" from the view selector
3. The sticky bar filter row (All / High Risk / Blocked / Needs Review / Clear / Show filters) disappears
4. The Story / Task Flow Health section disappears
5. Only visible: health score, key KPIs, Smart Recommendations, Priority Attention, Delivery Mix, Epic Readiness
6. Emma selects "Readiness" in the section switcher — page smooth-scrolls to Epic Health & Release Readiness
7. She exports the Excel report for the board

**Outcome:** Emma gets a clean executive view with no technical clutter, appropriate for board-level communication.

---

### SCN-025 — Engineering Manager Uses Section Switcher for Focused Review

**Persona:** Carlos, Engineering Manager  
**Context:** Carlos wants to review only sprint performance without scrolling through the entire dashboard.

**Scenario:**
1. Carlos opens `/dashboard` in Full mode
2. He clicks "Sprints" in the sticky section tab bar
3. The page smooth-scrolls to the Sprint Status section; all other sections are hidden
4. The active "Sprints" tab shows a blue underline indicator
5. Carlos reviews SprintThroughputPanel and MidSprintDeliveryPanel
6. He clicks "Full" to restore the complete dashboard view

**Outcome:** Carlos focuses on exactly what he needs in seconds, without manual scrolling or collapsing unrelated sections.

---

*© 2026 Ali Abu Ras — aburasali80@gmail.com — Delivery Clarity v4.1*
### SCN-026 — Scrum Master Exports Explorer Graph for Offline Review

**Persona:** Marcus, Scrum Master
**Context:** Marcus has traced a blocked epic in Work Item Explorer and wants to share the risk analysis with a stakeholder who doesn't have app access.

**Scenario:**
1. Marcus navigates to `/explore` and enters `EPIC-14`
2. The graph loads: 12 connected items, 3 on the risk path, 1 orphan
3. Marcus clicks "↓ Export" → "Export to Excel (.xlsx)"
4. A 5-sheet workbook downloads: Summary (delivery confidence 62%), All Issues (12 rows), Risk Items (3 rows), Orphans (1 row), Insights
5. Marcus emails the workbook to the product owner before the sprint review

**Outcome:** Stakeholder has a complete offline snapshot of the delivery structure without needing app access.

**Related:** UC-064, TC-EX-01–08

---

### SCN-027 — Release Manager Watches Confidence Score Improve Sprint-Over-Sprint

**Persona:** Rachel, Director of Engineering
**Context:** After blocking issues were resolved over two sprints, Rachel wants to confirm release confidence is trending up.

**Scenario:**
1. Rachel navigates to `/trends`
2. The Release Confidence chart shows: Sprint 3 → 48%, Sprint 4 → 67%, Sprint 5 → 84%
3. The stat card shows "+36% vs first upload" in green
4. The upload log table shows the Rel. Confidence column improving row by row

**Outcome:** Rachel can objectively demonstrate to the steering committee that release confidence improved, backed by trend data rather than anecdote.

**Related:** UC-065, TC-RC-01–10

---

### SCN-028 — Engineering Manager Identifies Overloaded Team Member Before Retro

**Persona:** Carlos, Engineering Manager
**Context:** Sprint 6 retrospective is tomorrow. Carlos wants data to support the conversation about uneven workload distribution.

**Scenario:**
1. Carlos opens `/teams` from the Analytics nav
2. He sees 6 team member scorecards; "David: 34/100 Critical" stands out
3. The Workload Share chart shows David at 42% load share (red bar, > 35%)
4. The Blocked + Critical chart confirms David has 3 blocked items
5. Carlos notes David's avgOpenAgeDays is 18d (red)
6. He uses this data to open the retro discussion on workload balancing

**Outcome:** Retro conversation is data-driven. Team agrees to redistribute 2 issues from David to Alice (Healthy, 68/100, 18% load).

**Related:** UC-066, TC-TH-01–10

---

### SCN-029 — Programme Lead Prepares Steering Committee Deck from Portfolio Page

**Persona:** Rachel, Director of Engineering
**Context:** Weekly steering committee in 30 minutes. Rachel needs a portfolio health summary.

**Scenario:**
1. Rachel navigates to `/portfolio`
2. Portfolio Score is 71 (Good) — score banner confirms "Portfolio is in a strong position"
3. Epic Progress panel shows 4 epics: 3 healthy (green), 1 critical (red — "Payments v2, 30% complete, 2 critical")
4. Project cards: PROJ-A healthy, PROJ-B at risk (50%)
5. Quarter throughput bars: Q1 80% → Q2 65% — slight dip noted
6. Rachel screenshots the score banner and epic panel for her deck

**Outcome:** Steering committee gets a coherent portfolio view in under 5 minutes, no manual aggregation needed.

**Related:** UC-067, TC-PF-01–10

### SCN-030 — Director Prepares One-Page Executive PDF Before Steering Committee

**Persona:** Rachel, Director of Engineering
**Context:** 15 minutes before a steering committee, Rachel needs a one-page printed summary.

**Scenario:**
1. Rachel navigates to `/summary`
2. She clicks "Executive PDF" (purple button)
3. A file `executive-summary-2026-06-04.html` downloads instantly
4. She opens it in Chrome → Ctrl+P → "Save as PDF" → one A4 landscape page renders
5. She prints it and walks into the meeting

**Outcome:** In 60 seconds, Rachel has a professional one-page delivery summary — no manual copy-paste from multiple pages, no formatting work.

**Related:** UC-068, TC-EP-01–08

### SCN-031 — Developer Finds Lead Time Formula via Portal Search

**Persona:** New backend engineer joining the team
**Context:** Engineer needs to understand how Lead Time is calculated before writing a test.

**Scenario:**
1. Engineer opens `/developer`
2. Types "lead time" in the sidebar search box
3. Results appear: Calculations (Lead Time, Cycle Time) + Section (Calculation Reference)
4. Clicks "Lead Time" result → Calculation Reference opens with the Lead Time card expanded
5. Engineer reads the formula, inputs, assumptions, and implementation file reference

**Outcome:** Engineer finds the formula in 10 seconds without scrolling through 28 calculation entries or navigating manually.

**Related:** UC-069, TC-AO (search is in-memory — no dedicated test needed)

---

### SCN-032 — Scrum Master Assigns Recommendation Owners Before Retro

**Persona:** Marcus, Scrum Master
**Context:** Sprint retro prep — Marcus wants each recommendation to have a named owner before the meeting.

**Scenario:**
1. Marcus opens the dashboard — Smart Recommendations section shows 4 cards
2. Card 1: "Unblock 3 critical items" — Marcus clicks "+ Assign (Scrum Master / Delivery Manager)"
3. Input opens; Marcus types "Ali" → presses Enter → "Ali" badge appears
4. Card 2: "Team capacity imbalance" — Marcus types "Rachel" → saved
5. In the retro, each recommendation card shows its owner — accountability is clear from the start

**Outcome:** Retro action items are immediately owner-assigned in the tool, removing the need for a separate action tracker.

**Related:** UC-070, TC-AO-01–08

### SCN-033 — DevOps Engineer Self-Hosts via Docker in 10 Minutes

**Persona:** Alex, DevOps Engineer
**Context:** The team wants Delivery Clarity running on their internal server before the sprint review tomorrow.

**Scenario:**
1. Alex clones the repo to `/opt/delivery-clarity` on an Ubuntu 22.04 VPS
2. Copies `.env.example` to `.env`, sets `SESSION_SECRET` and a strong `ADMIN_PASSWORD`
3. Runs `docker compose up -d --build` — Docker pulls Node 20 alpine, builds two stages, starts the container
4. `docker compose ps` shows "healthy" after ~60 seconds
5. Alex visits `http://192.168.1.50:3000`, logs in, uploads a Jira CSV, confirms dashboard works
6. Follows Section 7 to configure nginx on port 80 → uploads the Jira file successfully (25M limit set)
7. Follows Section 8 to set up SSL via Certbot → site is live at `https://delivery.team.internal`

**Outcome:** The team has a production Delivery Clarity instance in under 30 minutes with persistent SQLite storage, nginx, and HTTPS.

**Related:** UC-071, DEPLOYMENT_GUIDE.md §4, §7, §8

### SCN-034 — Admin Runs Pre-Production Health Check

**Persona:** Alex, DevOps Engineer
**Context:** The team is about to announce Delivery Clarity to 50 users. Alex wants to confirm the system is production-ready.

**Scenario:**
1. Alex opens `/admin/diagnostics`
2. Ops Score: 90/100 — Healthy
3. Environment: SESSION_SECRET ✓, NODE_ENV production ✓, registration locked ✓, DB URL ✓
4. One check fails: NEXT_PUBLIC_APP_URL not set (−5 not in score, just flagged)
5. Import health: 100% success rate, 3 successful imports so far
6. 2 active sessions (Alex + test user)
7. Alex clicks "Security Report →" — score 88/100, production ready
8. Alex sets NEXT_PUBLIC_APP_URL in .env and restarts → refreshes diagnostics → all green

**Outcome:** Alex confirms the system is production-ready in under 3 minutes, using a single admin page.

**Related:** UC-073, TC-SD-01–08

### SCN-035 — Manager Shares Branded Executive PDF with Board

**Persona:** Rachel, Director of Engineering
**Context:** Rachel needs to share a professional delivery summary for a board meeting.

**Scenario:**
1. Rachel clicks "Executive PDF" on the Overview page
2. Opens the file — header shows the lightning bolt brand mark + "Delivery Clarity" + "Executive Summary"
3. The board receives a document that looks like it came from a real product, not a generic spreadsheet
4. Footer reads "Generated by Delivery Clarity v4.1 · 2026-06-04 · Ali Abu Ras · aliaburas80@gmail.com"
5. Browser tab shows the DC lightning bolt favicon

**Outcome:** Professional delivery report with consistent branding — no manual formatting needed.

**Related:** UC-076, FR-300

### SCN-036 — New Team Member Discovers Work Item Explorer via Landing Page

**Persona:** David, new Scrum Master joining the team
**Context:** The team uses Delivery Clarity. David has been given an account but doesn't know what features exist.

**Scenario:**
1. David logs in → sees the upload page → clicks "See all 12 features →"
2. /landing opens — branded hero, "From messy boards to measurable delivery confidence"
3. David reads "How it works" (3 steps) — understands the zero-credential approach
4. He scans the feature grid — "Work Item Explorer" catches his eye (dependency graph)
5. He clicks the card → /explore opens → he enters an epic key → graph loads
6. He returns to /landing and clicks "Release Readiness" → /readiness opens

**Outcome:** David discovers two features he wouldn't have found from the dashboard alone, in under 5 minutes.

**Related:** UC-077, FR-301

### SCN-037 — New Team Member Discovers Smart Recommendations via Tour

**Persona:** Marcus, new Scrum Master joining the team
**Context:** Marcus has just uploaded his first Jira export and landed on the Overview page.

**Scenario:**
1. Overview page loads — after 800ms, a dark tour popover appears: "Welcome to Delivery Clarity 👋"
2. Marcus clicks "Start tour" → dashboard loads
3. Tour Step 2: pulsing ring around the section switcher tabs. Marcus sees he can click "Sprints" to focus only on sprint data
4. Tour Step 5: ring highlights Smart Recommendations section. Popover explains he can assign owners and give feedback
5. Tour Step 7: "Open Explorer →" — Marcus clicks, navigates to /explore
6. Tour marks complete; Marcus opens the explorer and traces EPIC-42

**Outcome:** Marcus discovers both the section switcher and the explorer in 3 minutes — features he wouldn't have found independently.

**Related:** UC-079, TC-PT-01–08

### SCN-038 — Returning User Loads Dashboard from Bucket

**Persona:** Sarah, Engineering Manager
**Context:** Sarah uploaded a Jira export yesterday and the configured S3 bucket received the automatic backup.

**Scenario:**
1. Sarah opens Delivery Clarity and signs in.
2. The app attempts cloud sync before validating the current session's analytics data.
3. `/api/metrics/latest` returns the restored `data/latest-metrics.json` payload.
4. The dashboard opens with yesterday's latest metrics and the data source badge shows the cloud/cache provider.
5. If the bucket is unavailable, the badge switches to `localStorage fallback` and uses the browser copy instead.

**Outcome:** Sarah can resume analysis without re-uploading unless she wants a fresher Jira export.

**Related:** UC-083, TC-CS-09–12

---

## v4.2.2 — Admin & Member Management Scenarios (2026-06-07)

*(Added to close TRACE-01 traceability gaps for F3-14, F3-15, F3-16 — see TODO-List.md Section 12.)*

### SCN-039 — Admin Onboards a New Scrum Master

**Persona:** Ali, administrator  
**Context:** A new Scrum Master, Dana, is joining the team and needs an account before Monday's sprint planning.

**Scenario:**
1. Ali opens `/admin/settings` → Users and clicks "Add User"
2. Ali enters Dana's name and work email, sets a temporary password, and selects role "Scrum Master"
3. The system rejects a duplicate email on the first try (Dana's personal email was already registered by mistake) — Ali switches to her work email and the user is created
4. The new account is created with `mustChangePassword = true`; an `admin_user_create` audit event is written
5. Ali messages Dana the temporary password and login URL outside the app

**Outcome:** Dana has a role-scoped account ready for first login; Ali's action is fully audited and the change is pushed to cloud backup.

**Related:** UC-084, TC-AU-01–05

---

### SCN-040 — Admin Tries to Lock Themselves Out

**Persona:** Ali, the only active administrator  
**Context:** While cleaning up the user list, Ali accidentally selects their own row.

**Scenario:**
1. Ali toggles their own account to "Disabled" in the user table
2. `PATCH /api/admin/users` rejects the change with HTTP 400 — the row stays Active
3. Ali then clicks "Delete" on their own row
4. `DELETE /api/admin/users` rejects the request with "You cannot delete your own account." — no audit event for deletion is written
5. Ali realizes the self-protection is intentional and moves on to the correct row

**Outcome:** The team never loses its only administrator account, even from an accidental click.

**Related:** UC-084 (Alternate Flows B & C), TC-AU-04

---

### SCN-041 — New Hire Looks Up a Teammate's Contact Details

**Persona:** Marcus, newly added Product Owner  
**Context:** Marcus needs to reach the Engineering Manager about a blocked sprint item but doesn't have her phone number.

**Scenario:**
1. Marcus signs in and opens `/members` from the navigation
2. He types "Sarah" into the search box — the grid filters to one matching card in real time
3. He clicks Sarah's card — a detail popup shows her contact email, telephone, address, and certificates
4. Sarah hasn't set a dedicated contact email, so the popup shows her account email instead
5. Marcus copies the phone number and calls her directly

**Outcome:** Marcus resolves the blocker within minutes without pinging an admin for contact info.

**Related:** UC-085

---

### SCN-042 — Newly Created User Completes Forced Password Setup

**Persona:** Dana, newly onboarded Scrum Master (continuing from SCN-039)  
**Context:** Dana has just received her temporary password and login URL from Ali.

**Scenario:**
1. Dana signs in with the temporary password — `session.mustChangePassword` is `true`
2. She tries to open `/dashboard` directly but middleware redirects her to `/change-password` every time
3. On her first attempt she types the new password and a confirmation that don't match — the form blocks submission with "Passwords do not match"
4. On her second attempt she reuses the temporary password as her "new" password — the API returns 400 because the new password must differ from the temporary one
5. She enters a new password meeting the strength rules (8+ chars, 1 uppercase, 1 number) and a matching confirmation
6. `POST /api/auth/change-password` succeeds, `mustChangePassword` is cleared, a `password_change` audit event is recorded, and Dana is redirected to `/dashboard` with full access

**Outcome:** Dana is now using a private password of her own choosing, and the forced-change flow has produced an auditable record without ever exposing the temporary password to anyone but Ali.

**Related:** UC-086

---

### SCN-043 — Admin Reviews the Flat Admin Console

**Persona:** Ali, administrator  
**Context:** Ali needs to audit system health and manage settings from a single unified admin console.

**Scenario:**
1. Ali signs in and opens `/admin/settings`; the flat admin console loads with a sticky sidebar and top context bar.
2. He verifies the current tab name, page status badge, and contextual summary cards for the selected settings area.
3. He selects the Users tab from the sidebar and reviews the table-first workflow with inline-edit controls.
4. He clicks the Security tab; the page updates the main panel in place while the sidebar remains visible.
5. He switches to Diagnostics and confirms the top context bar updates to reflect the selected area.

**Outcome:** Ali completes his review and trusts the new admin console layout because related controls and status information are clearly grouped and easy to navigate.

**Related:** UC-087

---

## v4.2.2 — Work Item Explorer Risk & Branch Insights Scenarios (2026-06-08)

### SCN-044 — Delivery Manager Reads the Visual Graph and Filters to Risk

**Persona:** Priya, Delivery Manager, preparing a stakeholder risk briefing  
**Context:** Priya needs to show exactly where delivery risk concentrates inside `EPIC-30` before a release-readiness review.

**Scenario:**
1. Priya opens `/explore` and searches `EPIC-30`; the graph renders with distinctly colored, type-coded node cards — purple Epic, blue Stories, slate Tasks, red Bugs — each showing its type icon, status, assignee, and health dot.
2. She spots `PROJ-77` with a dashed orange border and an "ORPHAN" badge because it has neither an Epic Link nor a Parent Key, and opens the legend overlay to confirm what the dashed border, badges, and edge styles mean.
3. The insight panel reads "2 items are on the risk path toward EPIC-30" and "STORY-31 is the largest unfinished branch with 4 open items."
4. She scans the seven KPI stat cards (Total Items, Done, Open, Blocked, Bugs, Story Points, Orphans) plus the new "Largest Unfinished Branch" card naming `STORY-31`, its open count, total count, and completion percentage.
5. In the graph, `STORY-31` and its risky descendants glow with a solid red "⚠ RISK PATH" border and animated red edges, while `STORY-31`'s branch carries a purple "📊 MOST WORK" badge.
6. Priya clicks "Show blocked branches (3)"; the graph and details table dim every node that isn't blocked or on the risk path to near-invisible, leaving only the at-risk subset in full color.
7. She filters the details table by Health = Critical and screenshots the narrowed view for the stakeholder briefing, then clicks "Show all" to restore the full graph.

**Outcome:** Priya identifies exactly where delivery risk concentrates and which branch needs the most attention — all from one screen, without a manual Jira query.

**Related:** UC-046, UC-088, TC-E-01–TC-E-08, TC-RP-01–TC-RP-08, TC-LB-01–TC-LB-08, TC-BF-01–TC-BF-08

---

## v4.2.2 — Smart Excel Export Sheet & Trigger Scenarios (2026-06-08)

### SCN-045 — Product Owner Exports the Smart Workbook for an Offline Release Review

**Persona:** Marcus, Product Owner, preparing for an offline release-readiness sync with stakeholders who don't have dashboard access  
**Context:** Marcus needs a single file that captures risk, data-quality, cycle-time, and release-readiness analysis without anyone needing to open Delivery Clarity.

**Scenario:**
1. From the dashboard sticky bar, Marcus opens the green "Export" dropdown and clicks "Excel (all data)"; the workbook downloads instantly as `delivery-clarity-report.xlsx` and the app quietly records his "downloaded a report" onboarding milestone.
2. He opens "07 Risks and Blockers" first and sees `PROJ-118` at the very top in red with risk level `CRITICAL`, blocked = `YES`, and the action "Escalate immediately — assign owner and resolution date" — followed by the warning-tier items each carrying "Review in next standup — prevent further aging."
3. On "08 Orphan & Data Quality" he reads the summary block: 6 orphan items (12%), 9 missing story points (18%), 4 unassigned (8%), 3 with no sprint (6%) — each row naming the dashboard impact and the Jira-side fix — then scrolls to the itemized orphan list to see exactly which issues need an Epic Link.
4. On "11 Cycle & Lead Time" he reads that the team's P85 lead time is 18 days — "use this as your delivery SLA" — and scans the 20 slowest items, spotting that three of them belong to the release he's reviewing.
5. On "14 Release Readiness" he finds `v2.4.0` at 80% complete with 1 blocked item and 1 open bug marked "Conditional Go," while `v2.5.0` sits at 50% and "No-Go" — exactly the evidence he needs to push the v2.5.0 date.
6. He forwards the single `.xlsx` attachment to the stakeholder distribution list; everyone can filter and sort the same data in Excel without ever logging into Delivery Clarity.

**Outcome:** Marcus produces one offline-readable artifact that reproduces the dashboard's risk, data-quality, cycle-time, and readiness analysis — turning a live-dashboard walkthrough into a forwardable file.

**Related:** UC-049, UC-089, FR-236, FR-310, FR-311, TC-X-09–TC-X-13b *(FR-310/FR-311 renumbered 2026-06-08 from colliding `FR-242`/`FR-243` — see TODO-List.md Section 12 Gaps Summary item 6)*

---

## v4.2.2 — Dashboard Status Chips Scenario (2026-06-08)

### SCN-046 — Scrum Master Triages a Long Dashboard by Chip Colour Alone

**Persona:** Dana, Scrum Master, opening the dashboard at the start of standup with five minutes before the meeting  
**Context:** Dana's dashboard has 16 collapsible sections, most of them collapsed from her last visit; she needs to know which ones changed overnight without expanding each one.

**Scenario:**
1. Dana scrolls down the page slowly, reading only the trigger bars — each shows a title plus a row of small rounded chips like "2 critical", "5 actions", "Updated 3h ago".
2. She immediately spots a red `critical` chip on the "Smart Recommendations" trigger and a red chip reading "3 blocked" on the "Flow & Risk" trigger — both jump out against the otherwise green and slate chips on the other 14 sections.
3. She clicks the "Flow & Risk" trigger first; it expands in place, the chevron rotates, and she confirms the three blocked items are the ones she needs to raise in standup.
4. She collapses it again, opens "Smart Recommendations" next, and leaves the remaining sections — all showing only green `good` or slate `neutral` chips — collapsed, trusting the colour signal that nothing there needs her attention this morning.

**Outcome:** Dana triages a 16-section dashboard in under a minute by scanning chip colour alone, opening only the two sections that actually need her attention before standup.

**Related:** UC-090, FR-308, BR-112, TC-CH-01–TC-CH-03

---

---

## v4.1 — Advanced Theme Customization Scenario (2026-06-08)

### SCN-047 — Engineering Manager Personalises the App to Match Her Team's Brand Colour

**Persona:** Sofia, Engineering Manager, whose team uses purple as their internal brand accent across Slack, Confluence, and dashboards  
**Context:** Sofia spends hours a day in Delivery Clarity and wants the interface to feel like "her" workspace, with her team's colour and a font size comfortable for her external monitor.

**Scenario:**
1. Sofia clicks the 🎨 palette icon beside the dark-mode toggle in the app header; the Theme Customizer panel opens showing 7 accent-colour swatches, 3 corner-radius options, and 3 text-size options.
2. She clicks the "Purple" swatch; every primary button, active nav indicator, and accent highlight across the app switches to purple instantly — no page reload.
3. She selects the "Rounded" radius preset; cards and buttons throughout the dashboard pick up softer corners in the same instant.
4. She picks "Large" text size for her external monitor; body and label text scale up app-wide.
5. She clicks outside the panel to close it, refreshes the page, and confirms her purple/rounded/large combination is still applied — the settings persisted to local storage and survived the reload.
6. The next day she opens the panel again and clicks "Reset"; the app instantly returns to the blue/default/medium baseline.

**Outcome:** Sofia makes Delivery Clarity feel like her team's own tool — in under a minute, with zero admin involvement, and the choice sticks across sessions until she decides to change it again.

**Related:** UC-081, FR-304, BR-108, TC-TC-01–TC-TC-08

---

---

## v4.1 — Advanced Chart Customization Scenario (2026-06-08)

### SCN-048 — Director Reshapes the Charts Page Around the Two Metrics That Matter to the Board

**Persona:** Raj, Director of Engineering, who presents the `/charts` page live in monthly board reviews and only ever references two of the eleven charts  
**Context:** The default `/charts` layout shows all 11 charts at their registry spans — useful for a generalist, but cluttered for a board presentation that should spotlight Sprint Velocity and the Release Timeline.

**Scenario:**
1. Raj opens `/charts` ahead of the board meeting and clicks the Chart Customizer control; the panel lists all 11 charts with visibility toggles, span controls (1/3, 2/3, Full width), and ▲▼ reorder arrows.
2. He toggles off the eight charts he never references — Label Distribution, Capacity, Quarters, and the rest vanish from the page instantly.
3. He sets "Sprint Velocity" to "Full width" and moves it to position 1 with the ▲ control; he sets "Release Timeline" to "2/3" and leaves it second.
4. He closes the panel — `/charts` now shows exactly two charts, full-width-then-two-thirds, in presentation order.
5. He refreshes the page right before walking into the meeting room; the layout is exactly as he left it, persisted from `dc_chart_prefs` in local storage.
6. After the board meeting, he opens the panel and clicks "Reset" to restore the full 11-chart view for his own day-to-day analysis.

**Outcome:** Raj walks into the board meeting with a `/charts` page that shows only the two metrics he's presenting, in the order and emphasis he wants — and switches back to his full working view with one click afterward.

**Related:** UC-091, FR-306, BR-110, TC-CC-01–TC-CC-08

---

---

## v4.5 — USERREQ UI: Member Add Request and Notification Scenarios (2026-06-09, P1)

### SCN-049 — Scrum Master Spots the Notification Banner, Reviews the Temp Password, and Onboards the New Developer

**Persona:** Priya (Scrum Master) submitted an add-member request for a new hire yesterday. Today she logs in and the admin (Omar) has already acted on it.

**Scenario:**
1. Priya logs in; the `NotificationBell` polls `/api/notifications` within 30 seconds and finds one unread notification from when Omar accepted the request. The bell badge shows "1" with a pulsing red ring; the bell emoji wiggles once.
2. Priya clicks the bell. The dropdown opens showing "✅ User request approved" with Alex Chen's email, role (Scrum Master), and the temporary password `OmarP4ss7` embedded in the message body (`whitespace-pre-line` preserves the multi-line layout).
3. Priya copies the password, marks the notification read (badge clears), then sends the password to Alex via a secure internal channel.
4. Alex logs in with the temporary password. The login page detects `mustChangePassword: true` and redirects to `/change-password`. Alex sets a new password and completes onboarding.

Meanwhile, Omar's flow (earlier, on the same day):
1. Omar logs in; the amber strip banner fixed below the nav header reads "1 pending member request — click to review". The pulsing white dot on the banner is hard to miss.
2. Omar clicks the banner; navigates directly to Admin Settings → Member Requests tab. `UserAddRequestsPanel` loads the pending card for Alex Chen.
3. Omar expands the card; reviews the business reason and requester details. The Accept button is disabled — the amber password field shows "Temporary password * — required before accepting".
4. Omar types `OmarP4ss7` into the field; the field validates client-side (length ✓, uppercase ✓, digit ✓); Accept button activates.
5. Omar clicks Accept. The panel calls `PATCH /api/admin/user-add-requests/[id]/accept` with `{ tempPassword: "OmarP4ss7" }`. Server creates Alex's account, marks request accepted, sends Priya a notification.
6. The card flips to accepted state; a green "Temporary password — share with user" box appears with the password and a Copy button. The amber notification banner disappears (no more pending requests).

**Outcome:** The whole workflow — request, review, mandatory password entry, accept, notification — ran through the app with zero back-channel ambiguity and a full audit trail.

**Related:** UC-097, UC-098, UC-099, UJ-034, FR-319, FR-320, FR-321, FR-322, FR-323

---

### SCN-050 — Admin Accepts Request, Welcome Email Sent, New User Logs In and Changes Password

**Persona:** Omar (Admin) accepts Alex Chen's add-member request; Alex receives the welcome email and onboards.

**Scenario:**

Omar's flow (Admin Panel):
1. Omar expands Alex's pending request card in Admin Settings → Member Requests. The Accept button is disabled — the password field shows the amber "required" state.
2. Omar clicks "Generate" next to the temp password field. The field auto-fills with a 14-character password (e.g., `K9!mRqZ#nTpL2w`) meeting all complexity rules; the Accept button activates.
3. Omar clicks Accept. The panel calls `PATCH /api/admin/user-add-requests/[id]/accept` with the temp password. The API:
   - Creates Alex's user record (bcrypt-hashed password, `mustChangePassword: true`)
   - Sends an in-app notification to the requester (Priya)
   - Calls `sendEmail()` → dispatches the welcome HTML email to Alex's inbox
   - Returns `{ ok: true, emailSent: true }` — password is NOT in the response
4. The panel shows a green ✅ "Welcome email sent to alex.chen@company.com" badge confirming delivery.
5. The card flips to accepted state. The amber banner disappears (no more pending requests).

Alex's flow (New User — First Login):
1. Alex receives the welcome email in their inbox within seconds. Subject: "Welcome to JiraDashboard — Your Account is Ready". The HTML email shows their name, login email, temporary password, and a "Log In Now" button.
2. Alex clicks "Log In Now". The app opens at the login page.
3. Alex enters their email and the temporary password. The server authenticates and detects `mustChangePassword: true`.
4. Alex is redirected to `/change-password`. They set a new password and submit.
5. Alex lands on the dashboard — fully onboarded, no admin back-channel required.

**Alternate — SMTP not configured:**
- Step 4 (Omar's flow) instead shows ⚠️ "Email not sent — SMTP not configured"
- Omar must share the temp password via in-app notification message (which Priya already received) or a secure external channel

**Outcome:** Password generation, welcome email delivery, and forced first-login password change all ran end-to-end with zero manual handoffs and a full audit trail in the database.

**Related:** UC-097, UC-098, UC-099, UC-100, UJ-034, UJ-035, FR-319, FR-320, FR-321, FR-322, FR-323, FR-325, TC-EMAIL-01–TC-EMAIL-03, TC-REQ-17

---

## v4.6 Scenarios — Roadmap, Forecast, Retro (2026-06-10)

---

### SCN-051 — Delivery Manager Uses Roadmap to Identify At-Risk Epics

**Context:** Ali is a delivery manager. The team has just finished upload week and he wants to know which epics are behind and when they'll realistically complete.

**Flow:**
1. Ali clicks Planning → Roadmap in the header
2. The roadmap loads and shows 8 epics. 2 are marked critical (red dot), 4 are in progress (amber/green)
3. Ali sets the filter to "Critical" — 2 epics shown
4. Epic "Checkout Flow Redesign" shows: 12 remaining issues, ~4 months, low confidence
5. Ali clicks the card → detail panel: 12 remaining, 8 sprints est., 3 critical issues
6. He switches filter to "All" and sort to "Forecast" — epics ordered by weeks remaining
7. He screenshots the sorted list and brings it to the stakeholder meeting

**Outcome:** Ali identified the two critical epics in under 90 seconds and has concrete remaining-issue counts to discuss.

**Related:** UC-101, UJ-036, FR-326, FR-327, BR-115

---

### SCN-052 — Scrum Master Checks Forecast Before Quarterly Planning

**Context:** Sara is a Scrum Master. The quarter is ending and leadership wants to know if the team will hit the release target.

**Flow:**
1. Sara navigates to Planning → Forecast
2. Status banner shows "⚠️ At Risk" in amber — `sprintsRemaining = 9`
3. KPI row: 120 total, 74 done, 46 remaining, 5.1 items/sprint average throughput
4. Burn-up chart shows actual line diverging slightly below the target line from sprint 6 onwards
5. Next Quarter Plan: "At 6 sprints × 5 items you can complete 30 items; you have 46 remaining" → not achievable this quarter
6. Recommendations: "Consider reducing scope by ~16 items to hit the target within the next 6 sprints." "Address 3 blocked items — each blocker typically delays multiple dependent stories."
7. Sara copies the recommendations into her planning doc and presents the options to the team

**Outcome:** Leadership sees a data-backed forecast, not a gut feeling. Scope trade-off is clearly quantified.

**Related:** UC-102, UJ-037, FR-328, FR-329, BR-116

---

### SCN-053 — Team Runs Post-Sprint Retrospective and Gets Improvement Suggestions

**Context:** The Backend Team has just completed Sprint 42. Goal was to ship the login redesign. Goal was partially met — one story carried over.

**Flow:**
1. Ana (Scrum Master) opens Planning → Retro
2. Clicks "Fill in App → Start"
3. Fills: Sprint Name "Sprint 42", Team "Backend Team", Goal Met "Partially", Goal "Ship login redesign"
4. Adds What Went Well: "Good team collaboration", "Automated tests caught regressions"
5. Adds What Did Not Go Well: "Sprint planning was too long", "Story points underestimated"
6. Adds Blocker: "Dependency on infra team blocked 3 stories"
7. Adds Action Items: "Schedule shorter planning sessions" (owner: Ana, due: next sprint, High), "Add complexity review to refinement" (owner: Tech Lead, Medium)
8. Clicks "Submit & Get Suggestions"
9. Insights view: ⚠️ goal-partially-achieved banner; "Do This Next" includes "Re-plan the sprint goal with a smaller, more achievable scope..." and "Address the 1 recorded blocker during refinement, before they recur next sprint."
10. Action summary: 2 items listed — 1 red (high), 1 amber (medium) — both have owners and due dates

**Outcome:** Retrospective completed in 5 minutes; team leaves with 2 owned action items and data-backed improvement advice.

**Related:** UC-103, UC-104, UJ-038, FR-330, FR-331, FR-356, BR-117

---

### SCN-056 — Team Member Downloads the Retrospective Template for Offline Use

**Context:** David (Product Owner) wants to run a retro with a remote team over a shared spreadsheet. He needs the official template to share in Slack before the meeting.

**Flow:**
1. David logs in and navigates to `/retro` via Planning menu
2. The three-card menu is shown: "Download Template", "Fill in App", "Upload Retro File"
3. David clicks "Download .xlsx →" on the Download Template card
4. `downloadRetroExcelTemplate()` executes client-side: builds a 2-sheet workbook ("Retrospective" with 4 example rows, "Instructions"), triggers browser download via `XLSX.writeFile()`
5. File `Retrospective_Template.xlsx` saves with header row, 4 example rows, and an Instructions sheet explaining how to fill it in
6. David opens the file in Excel and shares it with his team

**Outcome:** David has the template in under 10 seconds with no server round-trip; the workbook is ready to share immediately, with the original CSV still one click away if preferred.

**Related:** UC-104, FR-333, FR-357

---

### SCN-059 — Multi-Sprint Retro File Upload Surfaces a Repeated Blocker

**Context:** A team has been filling in the offline `.xlsx` template for the last 3 sprints and finally uploads it instead of re-typing everything into the in-app form.

**Flow:**
1. A team lead navigates to `/retro`, clicks "Upload →"
2. Selects `Q2_Retros.xlsx` containing 3 sprints' worth of rows (one "Sprint Name" group per sprint)
3. `POST /api/retro/parse` groups the rows into 3 `RetroRecord`s and generates one `RetrospectiveInsight` per sprint
4. The same blocker text — "Waiting on infra team for staging environment" — appears in Sprint 1 and Sprint 3's blocker rows
5. `detectRepeatedBlockers()` flags it; both Sprint 1's and Sprint 3's `InsightPanel` show "⚠ Repeated across sprints: waiting on infra team for staging environment"
6. The team lead immediately recognises this as a standing, unaddressed dependency rather than three unrelated one-off blockers

**Outcome:** A pattern invisible across three separate single-sprint retros becomes visible the moment they're uploaded together — with no manual cross-referencing.

**Related:** UC-115, FR-355, FR-356

---

### SCN-057 — Scrum Master Sees Evidence-Cited Blocker Coaching

**Context:** Priya (Scrum Master) suspects the team's flow has degraded but wants concrete evidence before raising it, not a vague feeling.

**Flow:**
1. Priya logs in and clicks "Coaching Insights" in the dashboard sidebar
2. `/dashboard/coaching` resolves her role as `scrum_master`, so exactly one category renders — no tabs
3. The card's Evidence panel cites real numbers: "5 item(s) are explicitly blocked, e.g. AJ-12 blocked by AJ-9" and "Average flow efficiency is 32% — most lead time is spent waiting, not in active work"
4. The Ceremony Advice section recommends a blocker-focused daily standup, citing the same 5 blocked items
5. The confidence chip shows "High (88%)" — Priya trusts the recommendation because the underlying data is complete

**Outcome:** Priya has concrete, citable evidence to raise at the next standup instead of an unsupported impression.

**Related:** UC-114, FR-346, FR-347, FR-349

---

### SCN-058 — Coaching Confidence Falls Back Safely on Thin Data

**Context:** A newly onboarded team has only just started uploading Jira data; most optional fields (Sprint dates, Story Points) are still empty.

**Flow:**
1. A team member opens `/dashboard/coaching`
2. Data Quality is `Critical` and most `MetricConfidenceMap` entries have `sampleSize: 0`
3. `aggregateCategoryConfidence()` finds no relevant metric with a non-zero sample size for the visible category
4. The confidence chip shows "Not available" instead of a fabricated percentage, with the reason: "not enough underlying data has been uploaded yet for this category"

**Outcome:** The user is told honestly that the system cannot yet vouch for this category's recommendations, rather than being shown a misleadingly precise number.

**Related:** UC-114, FR-350, TC-RBC-09

---

### SCN-060 — Admin Lands on the Most Urgent Category and Sees It Improving

*(Renumbered from `SCN-059` 2026-06-28 — both this scenario (RBC-26) and "Multi-Sprint Retro File Upload Surfaces a Repeated Blocker" above (RETRO-39) were independently assigned `SCN-059` on the same day, 2026-06-26. The retro scenario keeps `SCN-059` since it was committed first; this one moves to the next free ID. No other content changed.)*

**Context:** An admin oversees all 7 coaching categories and wants to immediately see what needs attention rather than clicking through every tab — and wants to know if last sprint's fix actually helped.

**Flow:**
1. The admin opens `/dashboard/coaching` having previously saved two snapshots (a "Sprint 14" and a "Sprint 15" snapshot via the Snapshots feature)
2. The 7 category tabs are sorted by severity; "Team Lead" is `critical` and is shown first, already active — the admin doesn't need to find it
3. "Product Owner" shows a small amber nudge dot because its severity is `high`, visible without switching tabs
4. The admin switches to "Product Owner" and its hero banner shows a small green "improved" badge — `computeSeverityTrend()` compared today's `high` severity against the Sprint 14 snapshot's `critical` severity and confirmed it dropped in urgency
5. Back on "Team Lead", the hero headline reads "Early signal: ..." because this category's confidence band is `Low` — the admin understands not to over-trust the verdict yet
6. The admin clicks the "Average Cycle Time" evidence chip and is taken directly to `/dashboard/flow-health` to investigate further

**Outcome:** The admin immediately sees what's most urgent, confirms an earlier fix on another category is trending in the right direction, is warned the most urgent category's data is still thin, and drills into the source dashboard in one click — instead of reading 7 fully-expanded text walls in a fixed order.

**Related:** UC-114, FR-353, FR-354, TC-RBC-10–13

---

### SCN-061 — Forecast Confidence Drops and the Diagnosis Names Why

*(Added 2026-06-28, closing a gap found during a documentation audit: FCAST-19–23's data-quality-aware confidence and weakest-factor diagnosis had algorithm/test/UC coverage but no scenario. Complements SCN-052, which covers the original forecast page before this addition.)*

**Context:** Marcus is a Scrum Master checking `/forecast` the week after a rough sprint. Last time he checked, confidence was "High"; today it isn't, and he wants to know why before he repeats Sara's quarterly-planning conversation (SCN-052) with a number he can't explain.

**Flow:**
1. Marcus navigates to Planning → Forecast
2. The confidence chip now reads "Low" instead of last week's "High" — `computeForecast()`'s `dqMultiplier` dropped because Data Quality fell into the `Weak` band since last sprint
3. A "Forecast Diagnosis" card directly under the status banner names the weakest factor: `kind: 'data_quality'`, with detail text citing the current band and score
4. Marcus opens Data Quality (`/data-quality`) via the same evidence-chip-style link pattern already used on the Coaching page, finds three sprints with unrecorded story points, and flags it to the team before planning
5. The new "Throughput Required vs. Current" bars show the gap is still closeable once data is fixed; the Risk & Scope Trend chart shows blockers are not the driver this time

**Outcome:** Marcus gets a specific, fixable reason for the confidence drop instead of an unexplained label, and the diagnosis correctly points him at data hygiene rather than a real delivery risk — preventing a false escalation.

**Related:** UC-102 (extended by FR-359–FR-364), FR-359–FR-364, TC-FCAST-06–13
