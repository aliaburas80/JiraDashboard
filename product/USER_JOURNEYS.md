# Delivery Clarity — User Journey Maps

**Version:** 1.0
**Date:** 2026-05-30
**Author:** Ali Abu Ras
**Status:** Approved
**Classification:** Internal

---

## 1. Overview

### What This Document Is

This document maps the lived experience of every primary user of Delivery Clarity — from the moment they decide to use the tool through to the downstream outcomes they care about. Each journey traces a specific, realistic scenario drawn from the product's business requirements and technical capabilities.

### How to Read These Maps

Each journey is structured around **phases** — the broad chapters of a user's session. Within each phase, individual **steps** are described with four lenses:

- **User Action** — what the person physically does
- **System Response** — what Delivery Clarity does in response
- **Emotion** — the user's internal state at that moment
- **Pain Point or Delight** — whether friction or satisfaction dominates

The emotion column uses a five-point scale throughout:

| Symbol | Meaning |
|---|---|
| ++ | Delighted — exceeded expectations |
| + | Satisfied — met expectations |
| ~ | Neutral — neither friction nor delight |
| - | Mild frustration — minor friction |
| -- | Frustrated — blocking friction |

After the per-persona journeys, the document covers cross-journey patterns, emotional arc summaries, key touchpoints, pain points, and moments of truth.

### Scope

These journeys cover four scenarios:

1. Sarah Chen — Engineering Manager — Weekly Sprint Health Check
2. Marcus Obinna — Scrum Master — Daily Standup Preparation
3. Rachel Okonkwo — Director of Engineering — Programme Health Review
4. A First-Time User — Onboarding and Value Realisation

---

## 2. Persona Profiles

### Persona 1 — Sarah Chen, Engineering Manager

**Role:** Engineering Manager, Platform Squad
**Company Context:** Mid-sized SaaS product organisation, eight engineering teams, two-week sprints. Sarah manages nine engineers. She reports to a VP of Engineering who expects a written delivery status update every Monday morning by 09:30.

**Goals and Success Criteria**
- Know by 08:00 Monday whether the sprint is healthy, at risk, or in trouble — without opening Jira
- Produce a VP-ready status update in under ten minutes
- Identify capacity imbalance before it becomes a retention or delivery risk
- Enter sprint planning knowing which epics are ready and which are blocked

**Pain Points Before Delivery Clarity**
- Spent 45–60 minutes every Monday morning exporting from Jira, running formulas in an Excel template she built two years ago, and writing a narrative from scratch
- Discovered blockers at sprint review rather than mid-sprint, when it was too late to act
- VP asked "what is the status?" via Slack with no notice, forcing her to estimate from memory
- Her Excel template did not account for cycle time, orphan items, or capacity distribution

**Technical Comfort:** High. Comfortable with dashboards, filters, CSV exports, data terminology. Expects precise numbers, not approximations.

**Typical Usage Frequency:** Once per week on Monday morning as the primary ritual; ad hoc uploads mid-week when a risk is escalated to her.

---

### Persona 2 — Marcus Obinna, Scrum Master

**Role:** Scrum Master, Growth Tribe
**Company Context:** Facilitates ceremonies for two squads totalling sixteen engineers across a B2C product organisation. He is accountable for flow efficiency, impediment removal, and retrospective quality.

**Goals and Success Criteria**
- See exactly which items are blocked, overdue, or stale before the 09:15 standup, without scanning individual Jira boards
- Produce retrospective data with quantitative cycle time evidence rather than team memory
- Demonstrate flow efficiency trends to the squads to motivate process change
- Identify items that have been in a status too long without writing a single formula

**Pain Points Before Delivery Clarity**
- Scanning two squads' Jira boards individually before standup consumed 20–30 minutes every morning
- Sprint retrospectives were based on qualitative recollection; he had no quick way to pull "average cycle time last sprint" without a spreadsheet
- Could not easily show the team a visual breakdown of where work was stuck

**Technical Comfort:** Medium-high. Prefers visual representations over raw number tables. Comfortable operating filters and reading health badges but does not write formulas or build reports from scratch.

**Typical Usage Frequency:** Three times per week — before Monday standup, Wednesday check-in, and Friday retrospective or planning prep.

---

### Persona 3 — Rachel Okonkwo, Director of Engineering

**Role:** Director of Engineering
**Company Context:** Responsible for delivery outcomes across six engineering squads totalling forty-five engineers. Has weekly reviews with the CPO and quarterly business reviews with the board. Does not use Jira directly.

**Goals and Success Criteria**
- Understand aggregate delivery health across all six teams in under five minutes
- Identify which team is at risk before it escalates to her as a crisis
- Communicate credibly to the CPO with a consistent, reproducible health signal — not a one-off slide deck
- Reduce time her engineering managers spend on reporting so they can focus on engineering

**Pain Points Before Delivery Clarity**
- Received six different status update formats every week — some as slide decks, some as Slack messages, some as spreadsheet screenshots
- Had no reliable predictive completion signal; estimates from teams were narrative and inconsistent
- Preparing for board QBRs meant gathering and reconciling six separate documents over two hours

**Technical Comfort:** Low-medium. Reads dashboards and summary cards confidently but does not interpret raw filter tables. Relies on the Health Score, health band label, and the narrative summary. Does not operate Delivery Clarity herself — she receives outputs from her managers.

**Typical Usage Frequency:** Does not upload files. Reviews Manager Quick Overview outputs shared by her six engineering managers in the weekly leadership sync.

---

### Persona 4 — First-Time User (Composite)

**Role:** Any of the above, encountering Delivery Clarity for the first time
**Company Context:** Has been told about the tool by a colleague or manager. Has a Jira export sitting on their desktop. Has thirty minutes to evaluate whether the tool is worth adopting.

**Goals and Success Criteria**
- Upload a real file successfully within five minutes
- Understand what the numbers mean without reading a manual
- See at least one actionable insight from their own data
- Leave the session confident that the tool is worth using again

**Pain Points at Entry**
- Uncertainty about whether their Jira export format will work
- Worry that the dashboard will require configuration before it is useful
- Time pressure — they have a meeting in thirty minutes and want to see value quickly

**Technical Comfort:** Variable. The journey is designed to work for both a first-time user with low data literacy and an experienced manager who wants to skip to the detail.

**Typical Usage Frequency:** This is a single onboarding session. Success here determines whether they become a recurring user.

---

## 3. Journey Maps

---

### Journey 1 — Sarah Chen: Weekly Sprint Health Check (Monday Morning)

**Scenario:** It is Monday 07:50. Sarah has a VP status sync at 09:30. She needs to know the sprint health and have a share-ready summary by 09:00. She has not looked at Jira since Thursday.

---

#### Phase 1 — Pre-Meeting Preparation (07:50–08:00)

**Step 1.1 — Export from Jira**

| Dimension | Detail |
|---|---|
| User Action | Sarah opens Jira, navigates to her squad's backlog view, selects All Issues, applies no additional filter (she wants the full picture), and clicks Export → Excel (all fields). The file downloads in about eight seconds. |
| System Response | Jira produces a `.xlsx` file. It contains the columns Sarah's team uses: Issue Key, Summary, Status, Assignee, Sprint, Priority, Story Points, Created Date, In Progress Date, Done Date, Due Date, Epic Link, Blocked Flag, Labels. The file is 2.1 MB and 214 rows. |
| Emotion | ~ (Neutral) |
| Note | This step is outside Delivery Clarity. The pain point here is habit — Sarah has been doing this manual export for two years. The only difference today is that what happens next takes seconds instead of an hour. |

**Step 1.2 — Open Delivery Clarity**

| Dimension | Detail |
|---|---|
| User Action | Sarah navigates to `http://localhost:3000` in Chrome. She has bookmarked it. The upload page loads immediately. |
| System Response | The upload page renders with a drag-and-drop zone, the accepted format list (CSV, XLSX, XLS), the 20 MB limit notice, and a link to the column guide. The page is clean — no login form, no configuration wizard, no project setup. |
| Emotion | + (Satisfied) |
| Delight | Zero friction at entry. No credentials, no project selection. The tool is ready before she is. |

---

#### Phase 2 — Upload and First Look (08:00–08:03)

**Step 2.1 — Drag the file onto the upload zone**

| Dimension | Detail |
|---|---|
| User Action | Sarah drags the `.xlsx` file from her Downloads folder onto the upload zone. The zone highlights on drag-over. She releases. |
| System Response | A progress indicator appears. The backend receives the multipart POST, runs `parseJiraFile`, detects 214 rows and 16 column headers, normalises aliases (`In Progress Date` matched via `custom field (actual start)` alias — though in this case the header is already canonical), runs `validateIssueData` (all four essential fields present), and executes `calculateDashboardMetrics`. The full response returns in 1.9 seconds. The dashboard replaces the upload page. |
| Emotion | ++ (Delighted) |
| Delight | Under two seconds. Sarah spent forty-five minutes on this last week. The contrast is visceral and immediately sets the tone for the session. |

**Step 2.2 — Read the Health Score**

| Dimension | Detail |
|---|---|
| User Action | Sarah's eyes go to the circular `HealthScoreGauge` in the summary bar. The gauge shows 68 in amber. The label below reads "Moderate". |
| System Response | The gauge renders with the score coloured according to the Moderate band (60–74). The health status badge beside it reads "Moderate — 72% completion". The target vs. actual row shows "Target: 85% Done · Actual: 72% Done" with an amber delta indicator. |
| Emotion | - (Mild frustration — the score is not good) |
| Note | The emotion is not frustration with the tool. It is the appropriate emotional response to accurate data. The tool has done its job: it has told her something real. |

**Step 2.3 — Read the four delta cards**

| Dimension | Detail |
|---|---|
| User Action | Sarah scans the four delta cards in the summary bar. |
| System Response | Card 1: Completion 72% (amber). Card 2: Health Alerts — 11 items (red, critical + warning combined). Card 3: Active Work — 18 items (blue). Card 4: Predicted completion — 6 days over target, projected date 14 Jun (red). |
| Emotion | - (Mild concern — the prediction card confirms the risk she suspected) |
| Delight | The prediction card converts abstract risk into a concrete date. Sarah knows exactly what to say to the VP: "We are tracking six days late. Here is what we are doing about it." |

---

#### Phase 3 — Deep Analysis (08:03–08:20)

**Step 3.1 — Read the Smart Recommendations**

| Dimension | Detail |
|---|---|
| User Action | Sarah reads the SmartActions panel below the summary bar. Three cards are visible. |
| System Response | Card 1 (red, critical): "Unblock 3 critical items" — three items with health='critical' and reason containing 'block'. Deep-link button labelled "View blocked items". Card 2 (amber, warning): "2 items stalled in progress" — issues active for more than fourteen days. Card 3 (amber, warning): "Team capacity imbalance detected" — Jordan Lee at 41% load share. |
| Emotion | -- (Frustrated — Jordan at 41% is a problem she did not know about) |
| Delight | The capacity imbalance card is the insight that spreadsheets never surfaced. She always knew Jordan was busy. She did not know Jordan held 41% of all open work. |

**Step 3.2 — Click "View blocked items" on the first Smart Recommendation**

| Dimension | Detail |
|---|---|
| User Action | Sarah clicks the deep-link button on the blocked critical items card. |
| System Response | The flow panel opens. `healthFilter` is set to `'critical'`, `reasonFilter` is set to `'block'`. The Flow Health table shows three rows: PLAT-89 (blocked flag, active 19 days), PLAT-102 (inward block link from INFRA-44, active 8 days), PLAT-117 (blocked flag, overdue by 3 days). Each row shows the Issue Key, Summary, Assignee, health badge (all red), and reason string. |
| Emotion | ~ (Neutral — the data is clear, now she needs to act) |
| Delight | PLAT-117 being overdue as well as blocked is new information. She had not caught that on Thursday. |

**Step 3.3 — Click the Jira deep-link on PLAT-117**

| Dimension | Detail |
|---|---|
| User Action | Sarah clicks the external link icon on PLAT-117's row. |
| System Response | A new browser tab opens to the Jira issue. (The `Issue URL` field was present in the export.) |
| Emotion | + (Satisfied) |
| Note | She does not need to search Jira for the issue key. The link is already there. She reads the comments, sees the blocker is waiting on the security team, and makes a note to escalate in standup. |

**Step 3.4 — Navigate to the Ownership section via SectionNav**

| Dimension | Detail |
|---|---|
| User Action | Sarah glances at the SectionNav on the right edge of the viewport. She clicks the dot labelled "Ownership" (dot 10). |
| System Response | The page smooth-scrolls to `#section-ownership`. The Capacity by Assignee table renders. Jordan Lee: 41% load share, 88 total issues, 12 active, 34 done. The next-highest is Priya Mehta at 21%. The bar chart makes the imbalance visual immediately. |
| Emotion | -- (Frustrated — the imbalance is worse than she thought) |
| Delight | The bar chart does not require her to do arithmetic. The visual gap between Jordan's bar and everyone else's is the insight. |

**Step 3.5 — Navigate to the Readiness section**

| Dimension | Detail |
|---|---|
| User Action | Sarah clicks the SectionNav dot for "Readiness" (dot 13). |
| System Response | The `#section-readiness` section renders. Two epics are listed as critical risk: "Platform API Refresh" (38% complete, 4 critical items) and "Data Export v2" (61% complete, 2 critical items). Each epic has a "View items" button. |
| Emotion | - (Concerned — Platform API Refresh is in a bad state for sprint planning this week) |
| Note | Sarah clicks "View items" on Platform API Refresh. The Detail Modal opens with the nine constituent issues. She reviews the assignees, notes three are assigned to Jordan Lee, and closes the modal. |

**Step 3.6 — Review the Quarter Statistics section**

| Dimension | Detail |
|---|---|
| User Action | Sarah clicks the SectionNav dot for "Quarters" (dot 7). |
| System Response | The `#section-quarters` table shows Q2 2026 as the most recent row: 214 total issues, 154 done, 72% completion rate, 8.3 days average lead time, 4.1 days average cycle time. Q1 2026 shows 198 total, 171 done, 86% completion rate. |
| Emotion | - (Concerned — Q2 is tracking below Q1's completion rate) |
| Delight | The quarter comparison takes five seconds to read. Without this tool, this comparison would have required a pivot table and twenty minutes. |

---

#### Phase 4 — Action and Reporting (08:20–08:30)

**Step 4.1 — Open the Manager Quick Overview**

| Dimension | Detail |
|---|---|
| User Action | Sarah clicks "Quick Overview" in the summary bar. |
| System Response | The Manager Report modal opens. Health banner shows "At Risk" in amber (score 68). Snapshot grid: Total 214 · Done 154 · Active 18 · Critical 8 · Warning 3 · Lead 8.3d · Cycle 4.1d · Points 67% completed. Seven report rows with detail links. |
| Emotion | ++ (Delighted) |
| Delight | The snapshot grid is exactly what she would have spent twenty minutes writing manually. She can see the entire health picture in one screen without scrolling. |

**Step 4.2 — Review the Risk Indicators row in the Manager Report**

| Dimension | Detail |
|---|---|
| User Action | Sarah reads the Risk Indicators row. It shows the top three critical items: PLAT-89, PLAT-102, PLAT-117. |
| System Response | Each item shows its key and summary. A red badge shows "8 critical". A "Details →" button is present. |
| Emotion | + (Satisfied — the report reflects exactly what she found in the flow table) |

**Step 4.3 — Print the report for the VP sync**

| Dimension | Detail |
|---|---|
| User Action | Sarah clicks "Print report". |
| System Response | `window.print()` is called. The print stylesheet hides all navigation, sticky bars, and interactive elements. The modal content renders cleanly on a single page — health banner at the top, snapshot grid below, seven report rows. |
| Emotion | + (Satisfied) |
| Note | Sarah saves as PDF rather than printing physically. She attaches the PDF to her Monday Slack update message. |

**Step 4.4 — Export the risk report CSV**

| Dimension | Detail |
|---|---|
| User Action | Sarah clicks "Export risk report" in the summary bar. |
| System Response | The browser downloads `jira-risk-report.csv`. It contains all 11 items classified as critical or warning, with columns: Issue Key, Summary, Status, Assignee, Health, Reason, Sprint, Labels. |
| Emotion | + (Satisfied) |
| Note | She attaches the CSV to the team's shared Google Drive folder so the engineering lead can review it before standup. |

**Step 4.5 — Save the layout for the week**

| Dimension | Detail |
|---|---|
| User Action | Sarah clicks "Save layout view". |
| System Response | The current filter state (all at defaults — no active filters) is persisted to `localStorage` key `"dashboardLayout"`. A brief "Layout saved" feedback message appears in the summary bar and fades. |
| Emotion | ~ (Neutral) |
| Note | This is a minor convenience rather than a major moment. Sarah notes it mostly in case she needs to refresh the browser later. |

---

#### Phase 5 — Post-Meeting Follow-Up (09:30–10:00, after the VP sync)

**Step 5.1 — Re-upload after mid-sprint re-prioritisation**

| Dimension | Detail |
|---|---|
| User Action | After the VP sync (where the VP asked for PLAT-117 to be escalated urgently), Sarah exports again from Jira at 10:00 to capture the updated state after she has reassigned two issues from Jordan Lee. |
| System Response | Dashboard re-renders in 1.7 seconds with the updated metrics. Jordan's load share has dropped to 34% (below the 35% threshold). The capacity imbalance Smart Recommendation no longer appears. The health score has moved from 68 to 71. |
| Emotion | ++ (Delighted) |
| Delight | The feedback loop is immediate. Sarah can see the effect of the reassignment numerically within minutes of making the change in Jira. |

**Total session time: approximately 35 minutes from export to VP meeting ready — down from 90+ minutes.**

---

### Journey 2 — Marcus Obinna: Daily Standup Preparation (Wednesday Morning)

**Scenario:** It is Wednesday 08:45. The standup is at 09:15. Marcus has thirty minutes to prepare. He needs to know: what is blocked, what has not moved since Monday, and whether either squad is at risk of missing the sprint goal. He uploaded on Monday morning and needs a fresh view.

---

#### Phase 1 — Morning Upload (08:45–08:49)

**Step 1.1 — Create a combined export**

| Dimension | Detail |
|---|---|
| User Action | Marcus exports from Jira using a saved filter that captures all issues across both squads ("Growth Squad A OR Growth Squad B") for the current sprint and backlog. He has saved this filter in Jira's Issue Navigator specifically for this purpose. The export produces a 4.8 MB file with 187 rows and 22 columns. |
| System Response | (Jira-side — outside Delivery Clarity.) |
| Emotion | ~ (Neutral — this is a practised ritual, not a pain point) |

**Step 1.2 — Upload the combined file**

| Dimension | Detail |
|---|---|
| User Action | Marcus opens `http://localhost:3000`, drags the file onto the upload zone. |
| System Response | Dashboard renders in 2.3 seconds. The health score reads 74 (upper Moderate, close to Good). The prediction card shows 2 days under target. |
| Emotion | + (Satisfied — overall the sprint looks manageable) |

---

#### Phase 2 — Health Triage (08:49–08:55)

**Step 2.1 — Activate the Blocked quick filter**

| Dimension | Detail |
|---|---|
| User Action | Marcus does not read the full dashboard. He goes directly to the sticky filter bar and clicks "Blocked". |
| System Response | `reasonFilter` is set to `'block'`. The flow panel opens automatically. The Flow Health table shows six rows: three items with Blocked Flag set to true, and three items with inward blocking links. The table header shows "6 of 187 items". |
| Emotion | ++ (Delighted) |
| Delight | This is the centrepiece of Marcus's daily ritual. Six blocked items across 187 issues and two squads — surfaced in one click and four seconds. Before Delivery Clarity this took him twenty minutes of board scanning. |

**Step 2.2 — Review each blocked item**

| Dimension | Detail |
|---|---|
| User Action | Marcus reads each of the six rows in the flow table. He notes: Issue key, summary, assignee, days active (from the Age column), and the reason string. |
| System Response | Row 1: GROW-44, "Email campaign A/B test setup", Assignee: Amara D., Active 6d, health: critical, reason: "Blocked flag · High priority". Row 2: GROW-67, "User segment API endpoint", Assignee: Theo L., Active 22d, health: critical, reason: "Active over 14d · Blocked by INFRA-12". Row 3: GROW-71, "Analytics event schema", Assignee: Fatima O., Active 3d, health: critical, reason: "Blocked flag". Row 4–6: lower-severity items. |
| Emotion | - (Concerned — GROW-67 at 22 days active and blocked by an infrastructure item is a serious impediment) |
| Note | Marcus makes a note of GROW-67. He will raise INFRA-12 in the standup and needs the infrastructure team's Scrum Master's number. |

**Step 2.3 — Click the Jira link on GROW-67**

| Dimension | Detail |
|---|---|
| User Action | Marcus clicks the external link icon on GROW-67's row to open the Jira issue. |
| System Response | New tab opens to the Jira issue. Comments show INFRA-12 has been unresolved for nine days. |
| Emotion | -- (Frustrated — the infrastructure blocker has been sitting for nine days with no visible escalation) |
| Delight | Marcus has the full context — issue age, blocker key, comment history — in one click. He can make an informed escalation decision in ninety seconds. |

---

#### Phase 3 — Sprint and Flow Analysis (08:55–09:05)

**Step 3.1 — Switch to "High risk" quick filter**

| Dimension | Detail |
|---|---|
| User Action | Marcus clicks "High risk" in the sticky filter bar. |
| System Response | `healthFilter` is set to `'critical'`. `reasonFilter` resets (the "High risk" preset is a standalone action). The flow table now shows 14 rows — all critical health items. |
| Emotion | ~ (Neutral — 14 critical items is expected for two squads mid-sprint) |

**Step 3.2 — Set the Open Age filter to surface stale items**

| Dimension | Detail |
|---|---|
| User Action | Marcus manually sets the `openAgeMaxFilter` field to `21` — he wants to see items older than 21 days. He then sets `healthFilter` to `'warning'` to focus on warning-level stale work. He types "active" in the `reasonFilter` to narrow to items whose reason string includes the word "active". |
| System Response | The `filteredFlowItems` useMemo recomputes. Table shows four items: all in a warning health state, all active for between 8 and 21 days, all with a reason string referencing active status age. |
| Emotion | ~ (Neutral — these are expected items; none are surprises) |
| Note | The three-filter combination is more sophisticated than most quick-filter use, but Marcus is a power user. He has learned this pattern over three weeks of daily use. |

**Step 3.3 — Navigate to the Sprint Status section**

| Dimension | Detail |
|---|---|
| User Action | Marcus clicks the SectionNav dot for "Sprint" (dot 9). |
| System Response | The Sprint Status section renders. The current sprint (Sprint 22) shows: 94 issues committed, 52 completed (55% completion rate), 187 story points committed, 104 delivered (56% point completion rate), 4 days remaining in sprint. Velocity chart shows the last four sprints at 67%, 71%, 69%, 55% — a clear downward trend in the current sprint. |
| Emotion | - (Concerned — 55% with four days left is tighter than Marcus would like) |
| Note | Marcus screenshots the sprint table for his retrospective prep folder. He will use this to illustrate the velocity dip in Friday's retro. |

**Step 3.4 — Navigate to the Kanban Status Health section**

| Dimension | Detail |
|---|---|
| User Action | Marcus clicks the SectionNav dot for "Kanban" (dot 8). |
| System Response | The Kanban section renders. The donut chart shows the largest segments: "Code Review" (23 items) and "QA" (18 items). The MetricTable shows Code Review with an average cycle time of 3.2 days and 6 critical items. QA shows average cycle time 5.1 days and 4 warning items. |
| Emotion | - (Concerned — the QA queue is backing up) |
| Delight | The visualisation makes the bottleneck immediately visible. Work is piling up in Code Review and QA — both have above-average health alert counts. This is the "where is work stuck" view Marcus has always wanted but could never produce from Jira's built-in board. |

---

#### Phase 4 — Team Communication Preparation (09:05–09:12)

**Step 4.1 — Export the risk CSV for standup reference**

| Dimension | Detail |
|---|---|
| User Action | Marcus clicks "Export risk report" in the summary bar. |
| System Response | `jira-risk-report.csv` downloads with 14 critical items. Marcus opens it in Google Sheets on a second monitor. He will use it as his live reference document during standup. |
| Emotion | + (Satisfied) |

**Step 4.2 — Open the Flow Health table in full-screen context**

| Dimension | Detail |
|---|---|
| User Action | Marcus clicks the SectionNav dot for "Flow Table" (dot 14) and then clicks "Show filters" in the sticky bar to scroll directly to the filter inputs within the flow panel. |
| System Response | The flow panel is open. The full filter form is visible. Marcus resets all filters, then sets `sprintFilter` to "Sprint 22" to focus only on current sprint items. The table shows 94 rows. |
| Emotion | ~ (Neutral — this is preparation, not discovery) |

**Step 4.3 — Prepare the standup agenda mentally**

| Dimension | Detail |
|---|---|
| User Action | Marcus reviews the prioritised list: GROW-67 (infrastructure blocker, day 22, needs escalation), GROW-44 (Amara's item, needs unblocking confirmation), QA bottleneck (needs conversation about the 18-item queue). He closes the browser tab and opens his standup facilitation notes. |
| System Response | N/A |
| Emotion | + (Satisfied) |
| Delight | Marcus's standup preparation is done in twenty-two minutes. It used to take thirty minutes just to scan the boards and another fifteen to organise his notes. He has five minutes to spare before the meeting. |

---

#### Phase 5 — Follow-Up After Standup (10:00–10:15)

**Step 5.1 — Record that GROW-67's blocker was resolved**

| Dimension | Detail |
|---|---|
| User Action | After standup, Marcus learns that INFRA-12 was actually resolved yesterday afternoon but Jira was not updated. He asks Theo to update the Jira status. Marcus does not re-upload immediately — he will do so at noon. |
| System Response | N/A — this is a process note, not a Delivery Clarity interaction. |
| Emotion | - (Mild frustration — the tool can only reflect what is in the export, not live Jira state) |
| Pain Point | This is the most common friction in Marcus's use of the tool: the export is a snapshot, not a live view. He has accepted this as a limitation but it means he must re-upload to see corrections. The Jira API integration roadmap item would eliminate this friction entirely. |

**Step 5.2 — Noon re-upload**

| Dimension | Detail |
|---|---|
| User Action | At noon, Marcus exports again and re-uploads. |
| System Response | The dashboard re-renders. GROW-67 no longer appears in the blocked list. The blocked count has dropped from 6 to 5. The health score has moved from 74 to 76, crossing into the Good band. |
| Emotion | ++ (Delighted) |
| Delight | The score crossing a band boundary is a small but motivating moment. Marcus shares the "Good" health badge screenshot in the team Slack channel: "We crossed into Good. Keep it up." |

**Total standup preparation time: 22 minutes (down from 45 minutes).**

---

### Journey 3 — Rachel Okonkwo: Programme-Level Health Review (Friday Morning Leadership Sync)

**Scenario:** It is Friday 09:00. Rachel has her weekly leadership sync with six engineering managers at 10:00. She expects each manager to share their Delivery Clarity Manager Quick Overview before the call. She reviews them at 09:00 to prepare her questions and identify risks to raise with the CPO at 11:00.

---

#### Phase 1 — Pre-Sync Review (09:00–09:25)

**Step 1.1 — Receive Manager Quick Overview PDFs from six managers**

| Dimension | Detail |
|---|---|
| User Action | Rachel opens her email. Six PDF attachments arrive between 08:30 and 08:55. Each is the printed Manager Quick Overview from Delivery Clarity. She opens all six in browser tabs. |
| System Response | Each PDF shows the same structure: health banner, 8-cell snapshot grid, seven report rows. The format is identical across all six teams because all are produced by the same Manager Report component. |
| Emotion | ++ (Delighted) |
| Delight | Before Delivery Clarity, Rachel received six documents in six different formats — two PowerPoint files, one Notion page, two Slack messages, and one hand-typed email. She could not compare them. Today all six are identical in structure. She can scan across them in parallel. |

**Step 1.2 — Compare health scores across teams**

| Dimension | Detail |
|---|---|
| User Action | Rachel reads the health banners across the six PDFs in sequence. |
| System Response | Scores visible on the banners: Platform — 68 (Moderate/amber), Growth — 76 (Good/green), Payments — 81 (Good/green), Infrastructure — 42 (At Risk/red), Data — 73 (Moderate/amber), Mobile — 79 (Good/green). |
| Emotion | -- (Concerned — Infrastructure at 42 is a significant outlier) |
| Delight | The colour-coded health bands make the outlier immediately visible without reading any detail. Rachel can identify the problem team in under thirty seconds. |

**Step 1.3 — Read the Infrastructure team's snapshot grid**

| Dimension | Detail |
|---|---|
| User Action | Rachel reads the 8-cell grid on the Infrastructure PDF more carefully. |
| System Response | Grid shows: Total 312 · Done 142 · Active 38 · Critical 22 · Warning 16 · Lead 14.2d · Cycle 9.8d · Points 41% completed. |
| Emotion | -- (Seriously concerned — 22 critical items and a 14-day average lead time indicates systemic flow problems) |
| Note | The average cycle time of 9.8 days and lead time of 14.2 days stands out because it is roughly double the other teams (Growth cycle: 4.1d, Payments cycle: 3.8d). Rachel notes this before the call. |

**Step 1.4 — Read the Infrastructure team's Risk Indicators row**

| Dimension | Detail |
|---|---|
| User Action | Rachel reads the Risk Indicators report row on the Infrastructure PDF. |
| System Response | The row shows the top three critical items by summary, with a red badge showing "22 critical". The three listed items all reference integration dependencies on the legacy authentication service. |
| Emotion | -- (Alarmed — the pattern is clear: a systemic dependency on the legacy auth service is causing cascade blocking) |
| Delight | Rachel has a specific, evidenced talking point for the sync without having to ask the Infrastructure manager for a pre-call briefing. She enters the meeting informed. |

**Step 1.5 — Review the prediction card on the Infrastructure report**

| Dimension | Detail |
|---|---|
| User Action | Rachel looks at the prediction visible in the Infrastructure summary (the prediction card value is also referenced in the Epic Readiness row). |
| System Response | Prediction: 47 days remaining to completion, projected completion 16 July. The sprint end is 6 June. The committed release date for the Infrastructure team's major deliverable is 15 June. |
| Emotion | -- (The 16 July projection against a 15 June commitment is a board-level escalation risk) |
| Note | Rachel adds "Infrastructure delivery risk — 31-day slip predicted" to her CPO briefing notes. |

---

#### Phase 2 — Leadership Sync Facilitation (10:00–11:00)

**Step 2.1 — Run through each team's health score in order**

| Dimension | Detail |
|---|---|
| User Action | Rachel opens the sync by displaying each team's health score and asking the manager to confirm whether the score reflects their own assessment. |
| System Response | N/A — the sync is facilitated by Rachel; Delivery Clarity outputs are the reference material, not a live tool in this context. |
| Emotion | + (Satisfied) |
| Delight | The common format means the conversation moves at speed. Rachel does not need to ask "what does this chart mean?" — every manager has produced the same chart. |

**Step 2.2 — Deep-dive on Infrastructure team's live dashboard**

| Dimension | Detail |
|---|---|
| User Action | Rachel asks the Infrastructure manager to share their screen and walk through the Justification section and the Readiness section live. |
| System Response | The Infrastructure manager opens the Delivery Clarity dashboard (they uploaded this morning) and navigates to the Justification panel. The narrative reads: "Average lead time is 14.2 days, significantly above the healthy threshold of 7 days. 22 critical items are present, driven primarily by active age and inward blocking links. Sprint completion rate for the most recent sprint was 44%. Orphan ratio is 28%, suggesting a high proportion of issues with no epic alignment." |
| Emotion | ~ (Neutral — the narrative is factual and clear) |
| Delight | Rachel does not need to interpret raw numbers. The plain-language narrative does the translation. The Infrastructure manager did not write it — the tool generated it from the metrics. |

**Step 2.3 — Request corrective plan from Infrastructure manager**

| Dimension | Detail |
|---|---|
| User Action | Rachel asks the Infrastructure manager to click through to the Readiness section. They navigate to `#section-readiness`. |
| System Response | The Readiness section shows two critical epics: "Auth Service Migration" (31% complete, 14 critical items) and "API Gateway Upgrade" (58% complete, 8 critical items). Each has a "View items" button. |
| Emotion | ~ (Neutral — the data confirms what Rachel already suspected from the PDF) |
| Note | The Infrastructure manager clicks "View items" on Auth Service Migration. The Detail Modal opens with 14 issues. Rachel asks three specific questions about three specific items by key. The detail view gives the Infrastructure manager immediate answers without needing to switch to Jira. |

---

#### Phase 3 — CPO Briefing Preparation (11:00–11:20)

**Step 3.1 — Assemble the cross-team summary**

| Dimension | Detail |
|---|---|
| User Action | Rachel takes the six snapshot grid values from the six PDFs and assembles them into a single summary table in Google Slides. She uses copy-paste from each PDF's grid. |
| System Response | N/A — this step is manual and outside Delivery Clarity. |
| Emotion | - (Mild frustration — this cross-team aggregation is still manual) |
| Pain Point | Delivery Clarity has no multi-file or cross-team comparison view in v1.0. Rachel must manually assemble the six grids into a single slide. This is a known gap in the roadmap (multi-file comparative analysis). |

**Step 3.2 — Present Infrastructure risk to the CPO**

| Dimension | Detail |
|---|---|
| User Action | Rachel presents to the CPO at 11:00. She uses the Infrastructure health score (42 — At Risk), the 16 July predicted date vs. 15 June commitment, and the specific Auth Service Migration epic details as evidence. |
| System Response | N/A — this is a downstream outcome. |
| Emotion | ++ (Confident) |
| Delight | Rachel is presenting with specific, reproducible, timestamped data rather than a qualitative assessment. The CPO asks "how do you know?" and Rachel can say "the tool computed this from 312 issues exported this morning — here is the prediction formula." The credibility of the delivery health signal is no longer dependent on Rachel's opinion. |

**Total Rachel prep time: 25 minutes. Previous equivalent (manually gathering six documents and forming a view): 2.5 hours.**

---

### Journey 4 — First-Time User: Onboarding and Value Realisation

**Scenario:** A first-time user — let us call them Jamie — is an engineering manager who has heard about the tool from Sarah Chen in a shared Slack channel. Jamie has a Jira export sitting on their desktop from last week's sprint review. They have thirty minutes before a meeting. They decide to try the tool now.

---

#### Phase 1 — Discovery (00:00–00:03)

**Step 1.1 — Arrive at the upload page**

| Dimension | Detail |
|---|---|
| User Action | Jamie navigates to the Delivery Clarity URL shared by Sarah. The upload page loads. |
| System Response | The upload page renders. The central zone shows a drag-and-drop area with the text "Drop your Jira export here" and a "Browse files" button. Below it: accepted formats (CSV, XLSX, XLS), maximum file size (20 MB), and a "What columns should I include?" guidance link. |
| Emotion | + (Reassured — the page is minimal and directive; there is nothing confusing to read first) |

**Step 1.2 — Read the column guidance**

| Dimension | Detail |
|---|---|
| User Action | Jamie clicks the "What columns should I include?" link. |
| System Response | A guidance panel or page opens listing the four essential columns (Issue Key, Issue Type, Summary, Status) and the recommended optional columns for richer analysis. |
| Emotion | ~ (Neutral — Jamie skims it; their export already has most of these columns because they used "Export all fields") |
| Note | The guidance page is reassuring rather than alarming. Jamie's export is already good enough. |

---

#### Phase 2 — First Upload (00:03–00:06)

**Step 2.1 — Upload the file**

| Dimension | Detail |
|---|---|
| User Action | Jamie drags the `.xlsx` file (3.1 MB, 142 rows from last week's sprint review) onto the upload zone. |
| System Response | Progress indicator. Dashboard renders in 2.1 seconds. |
| Emotion | ++ (Delighted — the first emotional high of the session) |
| Delight | "It just worked." Jamie had expected a configuration step, a column mapping wizard, or an error message about the column names being wrong. There was none. The dashboard is simply there. |

**Step 2.2 — Read the health score**

| Dimension | Detail |
|---|---|
| User Action | Jamie reads the circular gauge. Score: 61 (Moderate). |
| System Response | Score renders amber, label "Moderate". Completion rate badge: 68%. Four delta cards visible. |
| Emotion | - (Mild surprise — Jamie thought the sprint was in better shape) |
| Note | The honest response to an accurate health score is often mild discomfort. The tool has surfaced a reality that the manual process obscured. |

**Step 2.3 — Notice the warnings banner**

| Dimension | Detail |
|---|---|
| User Action | Jamie sees a yellow warnings notice under the health score. They click to expand it. |
| System Response | The warnings list reads: "The following optional fields were not found in your export: In Progress Date, Done Date, Sprint, Epic Link. Some sections will have limited data." The list is informational, not blocking. |
| Emotion | - (Mild frustration — some sections will be incomplete) |
| Note | The critical sections (flow health, health score, capacity) still function. The prediction card is hidden because no `Created Date` data is available for velocity calculation. Jamie makes a note to include these columns in next week's export. |
| Pain Point | The warnings message lists absent columns but does not tell Jamie how to add them to their Jira export. A link to a column export guide would eliminate this friction. |

---

#### Phase 3 — Dashboard Exploration (00:06–00:20)

**Step 3.1 — Read the Smart Recommendations**

| Dimension | Detail |
|---|---|
| User Action | Jamie reads the SmartActions panel. Two cards are present: "Link 18 orphan items to epics" and "4 items stalled in progress". |
| System Response | The orphan card shows 18 items — 13% of all issues — have no Epic Link or Parent Key. The stale card shows four items with health='critical' that have been active for more than fourteen days. |
| Emotion | - (Surprised — Jamie did not know about the orphan items) |
| Delight | The orphan insight is genuinely new information. Jamie knew some issues were not linked to epics but had no sense of the scale. 13% of the backlog is invisible to roadmap reporting. |

**Step 3.2 — Click the KPI card "Completion %"**

| Dimension | Detail |
|---|---|
| User Action | Jamie clicks the Completion % KPI card. |
| System Response | The page smooth-scrolls to `#flow-health-panel`. |
| Emotion | + (Satisfied — the card behaved intuitively as a navigation element) |
| Delight | The scrolling navigation is smooth and immediate. The flow table is now open and filtered to show all items. Jamie had not expected the card to be clickable. |

**Step 3.3 — Try the "High risk" quick filter**

| Dimension | Detail |
|---|---|
| User Action | Jamie sees the sticky filter bar and clicks "High risk" out of curiosity. |
| System Response | The flow table filters to the 9 critical health items. Jamie can see the Issue Key, Summary, Assignee, Age, Health badge (all red), and reason strings. |
| Emotion | ++ (Impressed — this is exactly what Jamie needed at last sprint review and did not have) |

**Step 3.4 — Click the help button on the Flow Health section header**

| Dimension | Detail |
|---|---|
| User Action | Jamie notices a small "?" icon beside the Flow Health section header. They click it. |
| System Response | The Help Guide modal opens at the `flow` section. Step 1 of 5 is shown: "The Story/Task Flow Health table shows every issue from your export, enriched with computed health fields. Use it to identify specific items that need attention." Navigation arrows at the bottom allow stepping through the journey. |
| Emotion | + (Reassured) |
| Delight | The help system explains what the table does without requiring Jamie to leave the dashboard or read a manual. Steps 2–5 explain each column, the filter controls, and the pagination. Jamie steps through all five in about ninety seconds. |

---

#### Phase 4 — Help Guide as a Learning Tool (00:20–00:25)

**Step 4.1 — Open the Help Guide from the header**

| Dimension | Detail |
|---|---|
| User Action | Jamie clicks the Help button in the application header. The Help Guide opens at the "welcome" section. |
| System Response | The welcome section shows a five-step overview of the tool: what it does, what the health score means, how the dashboard is organised, where to find the most common insights, and a glossary of key terms. |
| Emotion | + (Comfortable — the welcome journey is direct and jargon-light) |

**Step 4.2 — Navigate to the KPIs help section**

| Dimension | Detail |
|---|---|
| User Action | Jamie uses the section tabs to jump to the "kpis" section of the Help Guide. |
| System Response | The KPIs journey explains each of the six KPI cards in sequence: what it measures, what the threshold colours mean (green/amber/red), and what action to take when a card is red. |
| Emotion | + (Informed — Jamie now understands what the "Health Alerts" card is measuring) |
| Note | The most common first-time question is "what does Health Alerts mean?" — the answer is right here without a support ticket. |

**Step 4.3 — Close the Help Guide**

| Dimension | Detail |
|---|---|
| User Action | Jamie presses Escape to close the guide. |
| System Response | The modal closes. Focus returns to the dashboard at the position before opening. |
| Emotion | + (Satisfied) |

---

#### Phase 5 — Value Realisation (00:25–00:30)

**Step 5.1 — Open the Manager Quick Overview**

| Dimension | Detail |
|---|---|
| User Action | Jamie clicks "Quick Overview" in the summary bar, curious to see the report format. |
| System Response | The Manager Report modal opens. Health banner: Moderate. Snapshot grid: 142 total · 97 done · 18 active · 5 critical · 4 warning · Lead 9.1d · Cycle — (no data, In Progress Date absent). Seven report rows visible. |
| Emotion | ++ (Impressed) |
| Delight | The single-page report format is immediately recognisable as something Jamie could send to their VP right now. The absence of cycle time data (due to missing columns) is noted but does not undermine the report. |

**Step 5.2 — Decide to adopt the tool**

| Dimension | Detail |
|---|---|
| User Action | Jamie closes the Manager Report and spends two minutes reviewing the Readiness section (two epics flagged as warning). They decide to set a calendar reminder to export and upload every Monday morning before the VP sync. |
| System Response | N/A — this is an internal decision. |
| Emotion | ++ (Committed) |
| Delight | The moment of commitment happens at approximately minute 27 of the session. The tool delivered a specific, actionable insight (18 orphan items, 4 stalled in-progress items, 2 at-risk epics) from a file Jamie already had. The effort required was zero beyond the upload. |

**Step 5.3 — Make a note to improve the export**

| Dimension | Detail |
|---|---|
| User Action | Jamie writes in their notes: "Next export: add In Progress Date, Done Date, Sprint, Epic Link columns to Jira export saved filter." |
| System Response | N/A |
| Emotion | + (Motivated — Jamie understands what richer data would unlock) |
| Note | This is the product's secondary call to action: get users to return with a better export. The warnings banner and the visible gaps in the cycle time column motivate the right behaviour without requiring any instruction from a human. |

**Total session duration: 30 minutes. Outcome: tool adopted, calendar reminder set, column improvement planned.**

---

## 4. Cross-Journey Flow Diagram

```
                         DELIVERY CLARITY — USER FLOW MAP
═══════════════════════════════════════════════════════════════════════════════

  JIRA                    UPLOAD PAGE               DASHBOARD PAGE
  ─────                   ───────────               ──────────────

  [Export CSV/XLSX] ──────► [Drop Zone]
                                │
                                │  POST /api/upload  (<5s)
                                ▼
                         ┌─────────────┐
                         │  Backend    │
                         │  Parse      │
                         │  Validate   │
                         │  Compute    │
                         └──────┬──────┘
                                │ 200 OK + metrics JSON
                                ▼
                    ┌───────────────────────────────────┐
                    │        DASHBOARD PAGE             │
                    │                                   │
   SARAH            │  [Health Score Gauge]             │
   Engineering      │  [Delta Cards × 4]                │
   Manager          │  [Smart Recommendations]          │
   ────────         │         │                         │
   Weekly upload    │         ▼                         │
   → Quick Overview │  [Sticky Quick Filters]           │
   → Risk CSV       │  All │ High Risk │ Blocked │ ... │
   → Print report   │         │                         │
                    │         ▼                         │
   MARCUS           │  [Attention Cards]                │
   Scrum Master     │  Blockers │ Overdue │ Orphans     │
   ────────         │         │                         │
   3x/week upload   │         ▼                         │
   → Blocked filter │  [KPI Grid × 6]                  │
   → Flow table     │  Completion│Alerts│Active│LT│CT│SP│
   → Sprint section │         │                         │
   → Export CSV     │         ▼                         │
                    │  [Section Navigator — 14 dots] ◄──┼── scrolls to any section
                    │         │                         │
   RACHEL           │  ┌──────┴──────────────────────┐ │
   Director         │  │   14 Named Sections          │ │
   ────────         │  │  Summary → Attention         │ │
   Does NOT upload  │  │  → Overview → Visuals        │ │
   Receives PDFs    │  │  → Ratios → Controls         │ │
   from managers    │  │  → Quarters → Kanban         │ │
                    │  │  → Sprint → Ownership        │ │
   FIRST-TIMER      │  │  → Labels → Relations        │ │
   ────────         │  │  → Readiness → Flow Table    │ │
   Single session   │  └──────────────────────────────┘ │
   → Help Guide     │         │                         │
   → Value in 30m   │         ▼                         │
                    │  [Manager Quick Overview Modal]   │
                    │  Health Banner │ 8-cell Grid      │
                    │  7 Report Rows │ Print Button     │
                    │         │                         │
                    │         ▼                         │
                    │  [Detail Modal] ← View Items      │
                    │  Issue list │ Jira deep-links     │
                    │  Copy to clipboard                │
                    │         │                         │
                    │         ▼                         │
                    │  [Flow Health Table]              │
                    │  11 filters │ 100-row pagination  │
                    │  Orphan highlight │ Reset         │
                    └───────────────────────────────────┘
                                │
                         OUTPUTS / EXITS
                         ──────────────
                         CSV risk report download
                         PDF / print Manager Report
                         Jira deep-link (new tab)
                         Clipboard copy
                         localStorage filter state
                         Return to Upload (onReset)

═══════════════════════════════════════════════════════════════════════════════

  PATH FREQUENCIES
  Sarah    ──────────── Quick Overview → Print/CSV ─────────── HIGH
  Marcus   ──────────── Blocked filter → Flow table ─────────── HIGH
  Rachel   ──────────── PDF review (external to tool) ────────── N/A
  First-timer ───────── Help Guide → KPI cards ─────────────── ONE-OFF
```

---

## 5. Emotional Arc Graphs

The following graphs represent the emotional trajectory of each persona through their primary session. The vertical axis represents emotional state on the five-point scale (++ to --). The horizontal axis represents time through the session.

---

### Sarah Chen — Monday Sprint Health Check

```
EMOTION
  ++  │         *                                              *
      │
  +   │   *           *                        *    *    *
      │
  ~   │
      │
  -   │                    *    *    *    *
      │
  --  │
      └─────────────────────────────────────────────────────────► TIME
      │Upload  │Score  │Delta│Smart  │Blocked│Jordan│QO   │Print
      │arrives │68     │cards│Recs   │items  │41%   │modal│report
      │
      NARRATIVE:
      High delight at upload speed. Disappointment at score (expected,
      not tool failure). Concern grows through analysis as real risks
      surface. Returns to high delight at the Manager Report — the
      report does the work she used to do manually. Final delight
      is the print action completing the workflow loop cleanly.
```

---

### Marcus Obinna — Wednesday Standup Prep

```
EMOTION
  ++  │   *                *                            *
      │
  +   │        *                             *
      │
  ~   │                         *    *
      │
  -   │
      │
  -- │                    *                       *
      └─────────────────────────────────────────────────────────► TIME
      │Upload  │Blocked │GROW │Sprint  │Kanban  │Export │Re-  │Score
      │2.3s    │filter  │-67  │55%     │QA      │CSV    │upload│76
      │        │6 items │day22│4d left │backlog │       │noon │Good
      │
      NARRATIVE:
      Immediate delight at upload speed (familiar ritual by week 3).
      Strong delight at one-click blocked item isolation. Sharp drop
      at discovering GROW-67 has been blocked for 22 days unnoticed.
      Recovers to neutral through systematic analysis. Low point
      at the session end: the export is stale by the time standup
      finishes (INFRA-12 resolved but not yet reflected). Full
      recovery at noon re-upload when the score crosses a band.
```

---

### Rachel Okonkwo — Friday Programme Review

```
EMOTION
  ++  │   *                                         *
      │
  +   │             *
      │
  ~   │                            *
      │
  -   │                  *
      │
  -- │        *    *                    *
      └─────────────────────────────────────────────────────────► TIME
      │PDFs    │Infra  │Infra │Request │Live   │CPO  │Cross-│Slides
      │arrive  │score  │grid  │deep    │dash   │brief│team  │manual
      │uniform │42     │14d LT│dive    │Justif │confid│aggr  │step
      │
      NARRATIVE:
      Immediate delight at uniform format across six PDFs.
      Alarm at Infrastructure's score (appropriate response to
      real data). Sustained low through reading the Infrastructure
      detail — each number confirms a serious risk. Neutral during
      the deep-dive conversation (information gathering phase).
      High confidence when presenting to the CPO — specific,
      reproducible data creates credibility. Mild frustration at
      the manual cross-team aggregation step (known gap).
```

---

### First-Time User — Onboarding Session

```
EMOTION
  ++  │        *                        *              *
      │
  +   │   *         *    *        *         *    *
      │
  ~   │
      │
  -   │                       *
      │
  -- │
      └─────────────────────────────────────────────────────────► TIME
      │Page    │Upload │Score │Warnings│Smart  │High  │Help   │QO
      │loads   │works  │61    │missing │Recs   │risk  │guide  │modal
      │clean   │instant│honest│columns │orphans│filter│KPIs   │
      │
      NARRATIVE:
      Pleasantly surprised at page simplicity. Peak delight at
      instant upload (expected friction, got none). Mild dip at
      honest-but-disappointing score. Lower point at missing column
      warnings — mild frustration but not blocking. Recovery at
      Smart Recommendations surfacing the orphan insight (genuinely
      new information). Sustained positive arc through help guide
      exploration. Final high at Manager Quick Overview — this is
      the "I would use this every week" moment.
```

---

## 6. Key Touchpoints and Interaction Moments

The following table maps every primary touchpoint in the user experience to its target emotional response. Touchpoints are listed in the order a typical session encounters them.

| # | Touchpoint | Component / Location | Target Emotion | Why It Matters |
|---|---|---|---|---|
| 1 | Upload zone drag-and-drop | `UploadPage` — central drop zone | Reassurance → Delight | First interaction sets expectations for the whole session. The absence of a login form or config wizard signals "this tool respects your time". |
| 2 | Upload processing and dashboard render | Transition from `UploadPage` to `DashboardPage` | Delight (speed) | The under-2-second render is the product's single most powerful retention moment. Users immediately calculate the time saving against their previous process. |
| 3 | Health Score Gauge | `#dashboard-summary` — circular gauge | Trust | The score must feel honest, not optimistic. An amber score on a struggling sprint builds credibility; a green score on a struggling sprint would destroy it. |
| 4 | Smart Recommendations panel | `SmartActions` sub-component | Surprise and relevance | The best Smart Recommendations surface things the user did not already know. The capacity imbalance and orphan cards consistently produce "I did not know that" moments. |
| 5 | Sticky Quick Filter bar | Sticky bar below summary | Efficiency | The Blocked and High Risk quick filters should feel instantaneous. Any lag here breaks the "one click, instant answer" promise. |
| 6 | Flow Health table filtered view | `#flow-health-panel` with filter active | Control | The table gives power users the ability to interrogate any combination of conditions. It is the escape hatch from high-level insights to ground truth. |
| 7 | Manager Quick Overview modal | `ManagerReport` sub-component | Relief and pride | For Engineering Managers, this is the moment where the hour of manual work they used to do is replaced by a modal that appeared in three seconds. The target emotion is relief, followed by the confidence to share it. |
| 8 | Print report action | `window.print()` from `ManagerReport` | Completion | The print action completes the weekly ritual loop. The clean print layout — hiding all navigation and interactive elements — must feel polished, not like an afterthought. |
| 9 | Jira deep-link from flow table row | External link icon in flow table | Efficiency | The ability to go from the Delivery Clarity insight directly to the Jira issue without copying and searching eliminates a micro-friction that would otherwise fragment the workflow. |
| 10 | Export risk report CSV | "Export risk report" button in summary bar | Empowerment | The CSV is an artefact the user can share, attach, or store. It extends the tool's reach beyond the dashboard session. |
| 11 | SectionNav — 14 colour-coded dots | Right edge of viewport | Orientation | Users who are deep in the dashboard should never feel lost. The section nav's scroll-tracking provides a persistent location signal without cluttering the content area. |
| 12 | Help Guide step-through | `HelpGuide` modal — any section | Confidence for new users | The help guide is not a fallback for confused users — it is an onboarding pathway for users who want to learn the metric definitions before trusting them. The animated journey format makes it active rather than passive. |
| 13 | Scroll-to-top FAB | `ScrollToTopFab` — bottom right, visible after 400px scroll | Convenience | A minor but appreciated convenience. Its absence would force users who scroll to the bottom of the dashboard to manually scroll back up. |
| 14 | Detail Modal — individual issue view | `detailPanel` state — triggered from Readiness or Summary | Depth | The modal bridges the gap between the aggregate dashboard and the individual issue. It is where "there are 14 critical items in this epic" becomes "here are the 14 items, with names and Jira links". |
| 15 | Save layout view | `localStorage` persistence | Habit formation | Saving filter state enables users to return to the same analytical view without reconstruction. It is the feature that signals "this is a tool I will come back to" rather than "this is a one-off report". |
| 16 | Warnings banner — missing columns | Response `warnings` array displayed on dashboard | Calibration | Missing column warnings set accurate expectations for which sections will be limited. The target emotion is calibration, not frustration. The message should guide users toward a better export, not make them feel their data is wrong. |
| 17 | Re-upload after Jira updates | Second upload in same session | Feedback loop | The ability to re-upload and see the health score change (even a 2-point movement) creates a feedback loop between Jira updates and delivery visibility. This is the behaviour the product needs to encourage. |

---

## 7. Pain Points and Improvement Opportunities

The following friction points are observed across the four journeys. Each is rated by frequency (how often users encounter it), impact (how much it disrupts the workflow), and feasibility of improvement.

---

### Pain Point 1 — The Export Is a Snapshot, Not a Live View

**Observed in:** Marcus (Step 5.1), all personas implicitly
**Frequency:** Every session, multiple times per week for power users
**Impact:** Medium — creates latency between Jira updates and dashboard reflection; requires re-upload to see corrections

**Description:** When a blocker is resolved in Jira, the dashboard does not reflect it until the user exports and re-uploads. For Marcus, this means a noon re-upload ritual after standup resolves blockers. For Sarah, this means a second upload after mid-sprint reassignments. The re-upload itself is fast (under 2 seconds), but the need to remember to do it is a cognitive overhead.

**Current mitigation:** The re-upload is low friction (drag, drop, done). The import audit log shows when the last upload occurred, giving users a temporal reference.

**Improvement opportunity (roadmap):** The Jira OAuth / API integration roadmap item directly addresses this. An "Auto-refresh every N minutes" mode would eliminate the re-upload ritual entirely. Short-term: display the upload timestamp prominently on the dashboard so users can see at a glance how stale their data is.

---

### Pain Point 2 — Missing Column Warnings Do Not Link to a Remedy

**Observed in:** First-Time User (Step 2.3), new users generally
**Frequency:** High for first-time and occasional users; low for regular users who have optimised their export
**Impact:** Low to medium — sections degrade gracefully, but users do not know how to fix the gaps

**Description:** When the warnings banner lists absent optional columns, it names the fields but does not tell the user how to add those fields to their Jira export. A first-time user sees "In Progress Date not found" but does not know whether that is a Jira configuration issue, an export setting, or a column they need to add to their saved filter.

**Current mitigation:** The column guide on the upload page documents the recommended columns. The warnings message is informational, not blocking.

**Improvement opportunity:** Attach a help link to each warning item that opens the relevant section of the column export guide. Alternatively, detect which missing fields would have the most impact on the current data and prioritise the guidance accordingly (e.g., "Adding In Progress Date would enable cycle time calculation across 142 issues").

---

### Pain Point 3 — Cross-Team Aggregation Is Manual

**Observed in:** Rachel (Step 3.1)
**Frequency:** Weekly for Rachel; any organisation with multiple teams
**Impact:** Medium to high for programme-level users — this is the primary unsolved problem for directors who receive six separate reports

**Description:** Rachel receives six Manager Quick Overview PDFs and must manually extract and assemble the key metrics into a single comparison view. This takes fifteen to twenty minutes and introduces the risk of transcription errors. The tool's single-file architecture means there is no native way to compare multiple teams' dashboards.

**Current mitigation:** The consistent format of the Manager Report (identical structure across all teams) dramatically reduces the cognitive effort of comparison compared to the pre-tool state of six different formats.

**Improvement opportunity (roadmap):** The multi-file comparative analysis roadmap item directly addresses this. A cross-team view that accepts multiple uploads and renders a comparison grid (Team A: 68, Team B: 76, Team C: 42, etc.) would collapse Rachel's fifteen-minute manual step to seconds.

---

### Pain Point 4 — Browser Refresh Clears the Dashboard

**Observed in:** All personas, implicitly
**Frequency:** Occasional — most users keep the browser tab open during their session
**Impact:** Low to medium — when it happens, re-upload is fast but the loss of context (which section you were in, which filters were active) is mildly disorienting

**Description:** React state is cleared on browser refresh. There is no server-side session; no URL captures the current dashboard state. A user who accidentally refreshes or whose browser crashes must re-upload to restore the dashboard.

**Current mitigation:** The "Save layout view" button persists filter state to `localStorage`, so filter preferences survive a refresh. However, the metrics themselves require re-upload.

**Improvement opportunity (roadmap):** Persist the last metrics payload to `localStorage` (not just the filter state). On load, if a saved payload exists, offer to restore the last session without requiring a new upload. This is particularly valuable for users who upload once and refer to the dashboard throughout the day.

---

### Pain Point 5 — Cycle Time Is Absent When In Progress Date Is Missing

**Observed in:** First-Time User (Step 2.3), new users with basic exports
**Frequency:** High for first-time users; low for experienced users who have added the field
**Impact:** Medium — the cycle time KPI card and cycle time column in the flow table are the most valuable fields for scrum masters; their absence is a significant loss for Marcus's use case

**Description:** The cycle time calculation requires `In Progress Date` (or `Sprint Start` as a fallback). Many users' default Jira export configurations do not include this custom field because it is not part of the standard Jira export defaults. The system falls back to `Sprint Start` when `In Progress Date` is absent, but `Sprint Start` is also frequently absent in basic exports.

**Current mitigation:** The system degrades gracefully — cycle time columns show "—" rather than crashing. The warnings banner lists the absent field. The lead time calculation (which uses `Created Date` to `Done Date`) still functions.

**Improvement opportunity:** Provide a more prominent, in-context prompt on the cycle time KPI card when cycle time data is absent. Rather than showing "—", show "Cycle time unavailable — add the 'In Progress Date' field to your export" with a link to the guide. This makes the absent data actionable at the point of need rather than buried in the warnings list at the top.

---

### Pain Point 6 — Rate Limiting May Surprise Power Users

**Observed in:** Marcus (high-frequency use), any user running automated exports
**Frequency:** Low under normal human use; possible for users who script their exports
**Impact:** Low under normal use; high if it blocks a legitimate workflow

**Description:** The 20 requests per 15-minute window rate limit is appropriate for human use patterns. However, a scrum master facilitating two squads who uploads three times per day across a five-day week generates fifteen uploads per week — well within the limit. The risk is for users who script or automate their Jira export and upload cycle, which the rate limit can block.

**Current mitigation:** The 20-request window is generous for human use. The 429 response message is clear and includes the wait time.

**Improvement opportunity:** Document the rate limit explicitly in the upload page UI so users who encounter it are not surprised. For future automation use cases, the roadmap item for configurable rate limiting per IP range would allow legitimate automated pipelines to operate without throttling.

---

## 8. Moment of Truth Analysis

A moment of truth is a point in the user journey where the product either wins or loses the user's trust and continued engagement. The following five moments are where Delivery Clarity's value proposition is either confirmed or refuted.

---

### Moment of Truth 1 — The Upload Speed

**When it happens:** Step 2 of every journey — the transition from the upload zone to the rendered dashboard.

**What the user expects:** Some loading time. A configuration step. Possibly an error about column names.

**What Delivery Clarity delivers:** A complete, fully populated dashboard in under two seconds.

**Why it matters:** This is the product's opening statement. Every user arrives with a mental model formed by slower tools, complex integrations, and configuration-heavy analytics platforms. The instant render is a visceral contrast to that expectation. It does not just satisfy — it surprises. Users who have experienced the upload speed become evangelists because the experience is memorable.

**What could go wrong:** Any processing time above five seconds risks breaking this moment. A 10-second render time would not feel like a fast tool; it would feel like a slow tool that happens to process files. The sub-2-second target is not a performance optimisation — it is the product's primary differentiator.

---

### Moment of Truth 2 — The Health Score Reflects Reality

**When it happens:** Immediately after the dashboard renders — the user reads the health score and compares it to their internal sense of how the sprint is going.

**What the user expects:** Either validation of their existing assessment or new information.

**What Delivery Clarity delivers:** A computed, formula-driven score that is consistent and reproducible.

**Why it matters:** If the health score disagrees with the user's instinct, one of two things happens: either the score is wrong (and the user loses trust), or the score has surfaced a genuine gap in the user's awareness (and the user gains insight). The second outcome requires the score formula and the health signal thresholds to be genuinely calibrated to delivery health, not padded toward good scores for user comfort. The score must be honest to be trusted. Once trusted, it becomes the primary delivery health communication currency between managers and executives.

**What could go wrong:** Teams with unusual workflow configurations (e.g., a team that deliberately uses flat issue structures with no epics) will see a persistent orphan ratio flag in their score that does not reflect actual delivery risk. For these teams, the score is systematically wrong in a predictable, documentable way. The risk is that the score is dismissed entirely ("our score is always at risk because of the way we use Jira") rather than engaged with. The configurable threshold roadmap item addresses this, but in v1.0 the risk is real.

---

### Moment of Truth 3 — The Smart Recommendation Is Actionable and Specific

**When it happens:** The user reads the Smart Recommendations panel and encounters a recommendation about their own data.

**What the user expects:** Generic advice ("you should reduce blockers").

**What Delivery Clarity delivers:** Specific, named issues with a one-click path to the evidence and a direct Jira deep-link for action.

**Why it matters:** The leap from "there are blockers" to "here are the three specific issues that are blocked, with their assignees, ages, and Jira keys, and one click to the flow table filtered to exactly those items" is the difference between a dashboard that informs and a dashboard that drives action. Smart Recommendations are the product's highest-value feature for converting passive awareness into active management. A recommendation that surfaces a capacity imbalance (Jordan at 41%) that the manager genuinely did not know about is the product's clearest value demonstration.

**What could go wrong:** Recommendations that fire on every upload without varying (a permanent orphan recommendation because the team never uses epics, a permanent capacity imbalance recommendation because one senior engineer always holds the most tickets by design) lose their signal value. Users learn to ignore them. The five-recommendation cap and priority ordering mitigate this, but teams with structural patterns that persistently trigger low-value recommendations need the configurable threshold roadmap item to suppress them.

---

### Moment of Truth 4 — The Manager Report Is Share-Ready Without Editing

**When it happens:** The user opens the Manager Quick Overview modal and sees the snapshot grid and report rows.

**What the user expects:** A starting point that still requires editing, formatting, or narrative writing.

**What Delivery Clarity delivers:** A complete, formatted, printable executive health summary that can be shared without modification.

**Why it matters:** The promise of the product is to replace the 45-minute manual reporting ritual. The Manager Report is the proof of that promise. If a user opens it and thinks "I can send this now," the product has delivered its core value. If they think "I need to reformat this and add context," they are still doing reporting work — they have just shifted the medium. The Manager Report must be complete enough to send as-is. This means the health banner, snapshot grid, and seven report rows must cover every question a VP or director is likely to ask in a weekly status sync.

**What could go wrong:** The Manager Report does not include a prediction card directly in the printed output — the prediction is visible in the summary bar but not in the report rows. If an executive's first question is always "when will it be done?", the absence of the prediction date in the printable report creates a gap that forces the manager to add a note manually. This is a specific, addressable improvement: add a Prediction row to the seven existing report rows.

---

### Moment of Truth 5 — The Second Upload Is Faster Than the First

**When it happens:** A user who has used the tool once returns for a second session — either later the same day (after a blocker is resolved) or the following week.

**What the user expects:** The same experience as the first time.

**What Delivery Clarity delivers:** Exactly the same experience — same speed, same format, same analytical depth — with fresh data.

**Why it matters:** Habit formation requires consistent reward. The second upload should feel identical to the first in terms of friction (near-zero) and speed (under 2 seconds). If the second upload reveals that the health score has improved because a blocker was resolved, the feedback loop is complete: Jira action → Delivery Clarity upload → score improvement. This loop is what converts a one-time evaluation into a weekly ritual. Marcus uploading at noon to confirm the blocked items are gone and seeing the score cross from Moderate to Good is a small but habit-forming reward.

**What could go wrong:** If the import log grows large over time and the `GET /api/upload/logs` endpoint becomes slow, the backend control centre may degrade. This does not affect the upload performance directly (the import log write is appended, not read, during uploads), but it affects the administrator experience. The known flat JSON file limitation under concurrent writes is relevant here for teams with multiple users uploading simultaneously.

---

*End of User Journey Maps — Delivery Clarity v1.0*
*Prepared: 2026-05-30 | Author: Ali Abu Ras*

---

## User Journey Updates — v1.1 (2026-05-30)

### Change: Two-Step Post-Upload Flow

All personas now experience a two-step flow after uploading:
1. **Landing on /summary** — executive overview page (NEW)
2. **Navigating to /dashboard** — full detailed report (existing)

### Updated Phase: Post-Upload for All Personas

**Old:** Upload → Full Dashboard (immediate overwhelm)
**New:** Upload → Summary Page → [View Full Report →] → Full Dashboard

#### Summary Page Experience
| Step | User Action | System Response | Emotion |
|---|---|---|---|
| 1 | File uploads successfully | Browser navigates to /summary | Relief — clear, focused view |
| 2 | Reads health score gauge | Coloured circle (green/amber/red) with 0–100 score visible | Confidence or concern |
| 3 | Reads health banner | Status label + risk item count + completion % | Understanding |
| 4 | Scans 6 KPI cards | Compact cards with values and threshold tracks | Quick comprehension |
| 5 | Reads attention cards | Blockers / overdue / orphan counts with first example | Urgency awareness |
| 6 | Reads insights | 4 plain-language sentences | Validation |
| 7 | Clicks "View Full Report →" | Navigates to /dashboard | Purposeful transition |

### Updated Touchpoint: Help Access

**Old:** Click Help → Modal overlay opens
**New:** Click Help → Navigates to /help full page; ? buttons navigate to /help?section=xxx

#### Help Page Experience
| Step | User Action | System Response | Emotion |
|---|---|---|---|
| 1 | Clicks Help or ? button | Browser navigates to /help or /help?section=xxx | Discovery |
| 2 | Reads journey steps | Animated journey with progress bar | Engaged learning |
| 3 | Clicks "← Back" | Returns to previous page | Seamless continuation |

### Resolved Pain Point
- **Before:** Landing directly on the 16-section full dashboard was overwhelming for first-time users and managers checking quickly
- **After:** Summary page provides a focused, executive-friendly view. Full report is one click away but not forced
