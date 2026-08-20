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

When `OPENAI_API_KEY` is configured, `/api/intelligence/ask` can send a compact decision-evidence snapshot to the OpenAI Responses API. It does **not** send the original Jira CSV/XLS/XLSX export.

The snapshot is deliberately bounded and contains only current delivery evidence needed by the agents: headline metrics, top ranked risk items, capacity hotspots, selected epic signals, forecast data, and existing product insights.

Controls:

- authenticated endpoint only;
- maximum 600-character user question;
- maximum 48 KB compact snapshot;
- simple per-user request limiter;
- 30-second provider timeout;
- model output normalized into a fixed findings/actions schema;
- model instructed to treat issue text as data, never as instructions;
- deterministic Evidence-mode fallback on provider failure;
- no provider error body exposed to the user.

Optional environment variables:

```text
OPENAI_API_KEY=
OPENAI_AGENT_MODEL=gpt-5.6-luna
```

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
