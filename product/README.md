# Product Documentation — Delivery Clarity

This folder contains all living product documentation for Delivery Clarity.

| Document | Description | Version |
|---|---|---|
| [BRD.md](./BRD.md) | Business Requirements Document — objectives, stakeholders, 30+ BRs, personas, risk register | 1.0 |
| [SRS.md](./SRS.md) | Software Requirements Specification — 100+ FRs, API spec, data model, acceptance criteria | 1.0 |
| [USER_JOURNEYS.md](./USER_JOURNEYS.md) | User Journey Maps — 4 persona journeys, emotional arcs, touchpoints, moments of truth | 1.0 |
| [USE_CASES.md](./USE_CASES.md) | Use Cases — 40+ use cases (UC-001–UC-040+) with full flows, actors, exceptions | 1.0 |
| [TEST_CASES.md](./TEST_CASES.md) | Test Cases — 100 test cases (TC-001–TC-100) covering all FRs | 1.0 |
| [SCENARIOS.md](./SCENARIOS.md) | Business Scenarios — 30 real-world scenarios with walkthroughs | 1.0 |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Developer Guide — code-level how-tos for every modification, recipe cookbook | 1.0 |

## Live Developer Wiki

The backend serves a live, interactive developer wiki at:

**http://localhost:4000/developer**

The wiki covers: quick start, data flow, adding metrics/sections/KPIs/charts, field aliases, health thresholds, layout grid, dark mode patterns, API reference, and copy-paste recipes — all with syntax-highlighted code blocks.

## How to keep these updated

All documents are **living documents**. Update them when:
- A new feature is requested or built → add BRs, FRs, test cases, use cases, scenarios, and developer recipes
- A requirement changes → update the affected document and bump the version
- A bug is found and fixed → add a regression test case
- A new pattern is established → add a recipe to DEVELOPER_GUIDE.md

Bump the version number in each document's Document Control section when making significant changes.

---

© 2026 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
