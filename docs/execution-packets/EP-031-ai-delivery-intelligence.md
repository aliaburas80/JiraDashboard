# EP-031 — AI Delivery Intelligence

**Status:** Merged to `main` — live Hostinger deployment verification pending  
**Started from:** `main` commit `c6734244e99bed98a7bf15dc916329d5ce68bfa3`  
**Merged:** PR #53 on 2026-08-21, merge commit `cf9f3a95ce3948a1cc534322b8929f83e2942905`  
**Verified PR head:** `d5908d7f948403ff5e66053be2eafd8309521b29` — Security Audit, Quality, and E2E all green  
**Independent of:** EP-028 staging infrastructure (still externally blocked on Hostinger hPanel provisioning)

## Goal

Turn Delivery Clarity from a collection of dashboards into an interactive delivery-decision workspace. Users should be able to see the strongest signals immediately, explore the evidence behind them, and ask specialist delivery agents focused questions without requiring an AI provider for the core experience.

## User experience

A new `/intelligence` workspace presents:

- delivery confidence, completion, critical/blocker pressure, and forecast at a glance;
- ranked priority-attention items with status, owner, age, and blocking state;
- capacity concentration as an interactive visual distribution;
- direct links from recommended actions into Work Explorer, Flow Health, Teams, Roadmap, Data Quality, Trends, and Snapshots;
- four selectable specialist agents:
  - Executive Briefing Agent;
  - Flow & Bottleneck Agent;
  - Risk & Quality Agent;
  - Forecast Agent;
- suggested prompts plus free-text questions;
- structured findings and recommended actions rather than an ungrounded generic chat response.

## Evidence mode

Evidence mode is the default and requires no external AI service. It deterministically derives findings and actions from the current authenticated user's `DashboardMetrics` snapshot.

This means the product remains useful when:

- `OPENAI_API_KEY` is not configured;
- the AI provider is temporarily unavailable;
- a provider request times out or returns malformed output.

## Optional AI mode

When `OPENAI_API_KEY` is configured, `/api/intelligence/ask` sends a compact decision-evidence snapshot to the OpenAI Responses API. It does **not** send the original Jira CSV/XLS/XLSX export.

The snapshot is deliberately bounded and contains only current delivery evidence needed by the agents: headline metrics, top ranked risk items, capacity hotspots, selected epic signals, forecast data, and existing product insights.

### Provider quality and privacy contract

The provider layer is hardened so AI mode remains grounded and predictable:

- default model is `gpt-5.6-terra`, with `OPENAI_AGENT_MODEL` available for an explicit override such as `gpt-5.6-sol` when maximum reasoning quality is preferred;
- specialist policy is sent as higher-priority Responses API instructions, while the user question and Jira-derived text remain untrusted input data;
- OpenAI Structured Outputs use a strict JSON schema for title, summary, findings, severity, actions, priority, and optional safe product links;
- the compact provider response is explicitly created with `store: false`;
- output is still defensively normalized before rendering even after schema-constrained generation;
- action links are allow-listed to known Delivery Clarity routes and arbitrary/external model-generated URLs are discarded;
- provider failure, refusal, timeout, malformed output, or missing API key falls back to deterministic Evidence mode rather than leaving the workspace unusable.

### Input and operational controls

- authenticated endpoint only;
- maximum 600-character user question;
- maximum 48 KB compact snapshot;
- simple per-user request limiter;
- 30-second provider timeout;
- no provider error body exposed to the user.

Optional environment variables:

```text
OPENAI_API_KEY=
OPENAI_AGENT_MODEL=gpt-5.6-terra
```

## AI coverage — what each specialist actually knows

All four agents operate on the same bounded evidence snapshot, but apply a different decision lens.

| Specialist | Primary coverage | Evidence used |
|---|---|---|
| Executive Briefing | leadership attention, delivery confidence, overall exposure, immediate decisions | completion, delivery confidence, health score, blockers, critical items, open defects, top risk, capacity concentration, data-quality score |
| Flow & Bottleneck | work getting stuck, aging/WIP pressure, bottlenecks, capacity concentration | blocked/critical counts, lead time, cycle time, top ranked flow-risk items, assignee load concentration |
| Risk & Quality | delivery risk, defect/blocker exposure, whether the dataset is trustworthy enough for a decision | critical items, blocked items, open defects, top ranked risks, data-quality score |
| Forecast | likely finish outlook and signals that could move it | predicted completion/date, estimated days remaining, model velocity when available, completion, delivery confidence, blockers/critical items, leading risk |

### Shared bounded evidence

The AI snapshot currently includes:

- total/done/active issues and completion rate;
- delivery confidence and health score;
- blocked, critical, and open-defect counts;
- data-quality score;
- average lead time and cycle time;
- forecast completion state, predicted date, days remaining, and velocity when available;
- up to 12 ranked risk items with key, summary, status, assignee, reason, age, blocked state, and severity;
- up to 6 capacity hotspots;
- up to 8 selected epic signals;
- up to 8 existing Delivery Clarity source insights.

### Deliberately not covered in this first increment

The AI does not currently receive or operate on:

- the complete raw Jira CSV/XLS/XLSX dataset;
- every sprint's full detailed metrics;
- complete Kanban status-distribution records;
- full quarter-by-quarter history;
- complete label, issue-type, project, parent, or relation-map datasets;
- retrospective content or team sentiment;
- full release-readiness internals beyond evidence already represented in the compact snapshot;
- external web/company/market information;
- Jira write-back or any autonomous change to Jira/project data;
- conversation history across questions or saved long-running agent memory.

Those areas should be added only when the product need is explicit and the additional data boundary, privacy impact, grounding rules, tests, and user experience are designed first.

## Acceptance criteria

- [x] `/intelligence` interactive user workspace exists.
- [x] Intelligence is available in Analytics navigation and role routing.
- [x] Live evidence presentation includes risk, flow, capacity, confidence, and forecast signals.
- [x] Executive, Flow, Risk, and Forecast specialist agents exist.
- [x] Provider-free Evidence mode works without an API key.
- [x] Optional authenticated AI endpoint uses a compact evidence snapshot rather than the full Jira export.
- [x] AI endpoint has input bounds, timeout, rate limit, output normalization, and Evidence fallback.
- [x] Unit coverage exists for evidence snapshot construction and specialist outputs.
- [x] Browser E2E covers navigation, evidence rendering, agent switching, and provider-free asking.
- [x] Security Audit green on exact final PR head.
- [x] Quality green on exact final PR head.
- [x] E2E green on exact final PR head.
- [x] No unresolved review threads.
- [ ] Live Hostinger deployment and `/intelligence` production route verified after merge.

## Closeout note

The repository-side implementation is complete and merged. Production verification remains deliberately open because the available Hostinger integration does not expose the existing hPanel deployment/runtime status for this application. Do not mark EP-031 fully shipped until the live Hostinger deployment has been checked after merge.

## Follow-on enhancements

Once the first workspace is stable, later iterations can add conversation history, snapshot-to-snapshot agent comparisons, saved executive briefs, proactive signal cards, and provider-side tool calling. Those are deliberately outside this first increment so the user-facing value ships without creating a new infrastructure dependency.
