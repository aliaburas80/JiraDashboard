# EP-031 — AI Delivery Intelligence

**Status:** Provider alignment in PR #56 — live Ollama/Hostinger verification pending  
**Original workspace merge:** PR #53 on 2026-08-21, merge commit `cf9f3a95ce3948a1cc534322b8929f83e2942905`  
**Provider hardening experiment:** PR #55, superseded by the canonical self-hosted AI plan  
**Canonical AI source:** `product/Delivery_Clarity_Soft_Launch_AI_Master_Plan_v1.1.docx`  
**Independent of:** EP-028 staging infrastructure, except for final environment verification

## Goal

Turn Delivery Clarity from a collection of dashboards into an interactive delivery-decision workspace. Users should be able to see the strongest signals immediately, explore the evidence behind them, and ask specialist delivery agents focused questions without making AI a dependency for the core analytics experience.

## Canonical AI architecture correction

The product master plan defines a private/self-hosted AI stack and explicitly avoids paid cloud AI APIs by default. Delivery Intelligence therefore uses **Ollama** as the model runtime with two Qwen models:

- **Qwen3.5:4b** — the fast/light model for focused analysis, classification-style reasoning, summaries, evidence-based suggestions, and bilingual-friendly output;
- **Qwen3.5:9b** — the stronger optional model for deeper synthesis when infrastructure permits.

PR #56 removes the paid OpenAI provider path introduced during the earlier EP-031 experiment and aligns the live endpoint with this canonical product direction.

### Specialist-to-model routing

| Specialist | Primary model | Why |
|---|---|---|
| Flow & Bottleneck | `qwen3.5:4b` | focused bottleneck/aging/capacity analysis benefits from the lower-latency model |
| Risk & Quality | `qwen3.5:4b` | focused risk classification and evidence review fit the lightweight model |
| Executive Briefing | `qwen3.5:9b` | cross-signal leadership synthesis benefits from the stronger model |
| Forecast | `qwen3.5:9b` | completion outlook and interacting risk signals require deeper synthesis |

Executive and Forecast automatically retry with `qwen3.5:4b` if the deep model is unavailable. Flow and Risk go directly to Evidence mode if the fast model is unavailable.

This routing is an implementation bridge for the interactive Delivery Intelligence workspace. The broader master-plan AI worker use cases — weekly product review, feedback clustering, error correlation, feature recommendations, and post-release measurement — remain separate follow-on product-intelligence work and are not falsely claimed as implemented here.

## User experience

The `/intelligence` workspace presents:

- delivery confidence, completion, critical/blocker pressure, and forecast at a glance;
- ranked priority-attention items with status, owner, age, and blocking state;
- capacity concentration as an interactive visual distribution;
- direct links from recommended actions into Work Explorer, Flow Health, Teams, Roadmap, Data Quality, Trends, and Snapshots;
- four selectable specialist lenses: Executive, Flow, Risk, and Forecast;
- suggested prompts plus free-text questions;
- structured findings and recommended actions rather than generic chat output.

## Evidence mode — authoritative fallback

Evidence mode requires no model runtime. It deterministically derives findings and actions from the authenticated user's `DashboardMetrics` snapshot.

Deterministic Delivery Clarity calculations remain authoritative. AI explains and prioritizes supplied evidence; it does not recalculate or replace the product's metrics. If Ollama is unreachable, a model is missing, a request times out, or output is malformed, the workspace falls back to Evidence mode rather than failing.

## Self-hosted AI mode

`/api/intelligence/ask` sends only a compact decision-evidence snapshot to the privately configured Ollama runtime. It does **not** send the original Jira CSV/XLS/XLSX export.

The endpoint uses Ollama `/api/chat` with structured JSON-schema output and deterministic temperature settings. The user question and Jira-derived text are isolated as untrusted user/data content rather than merged into the higher-priority system instruction.

### Environment variables

```text
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_FAST_MODEL=qwen3.5:4b
OLLAMA_DEEP_MODEL=qwen3.5:9b
```

The Ollama endpoint must remain private/internal and must never be publicly exposed. No OpenAI API key is required.

### Provider controls

- authenticated endpoint only;
- maximum 600-character user question;
- maximum 48 KB compact snapshot;
- per-user request limiter;
- per-model timeout;
- schema-constrained JSON output;
- output normalization after generation;
- allow-listed Delivery Clarity action links only;
- arbitrary/external model-generated URLs discarded;
- prompt-injection defense: issue summaries, reasons, assignee names, epic names, source insights, and user questions are treated as untrusted data;
- no provider error body exposed to the user;
- deterministic Evidence fallback.

### Master-plan guardrails carried into Delivery Intelligence

The model is instructed to:

- use only supplied evidence;
- never invent Jira items, dates, metrics, quotes, causes, trends, benchmarks, or commitments;
- distinguish confirmed facts from correlation, hypothesis, and recommendation;
- state insufficient evidence rather than guess;
- avoid revealing or inferring personal information beyond supplied operational evidence;
- never make autonomous production changes, change permissions, delete data, contact users, or write back to Jira;
- return a small prioritized set of findings/actions rather than an unbounded list.

## AI coverage — what each specialist actually knows

All four specialist lenses operate on the same bounded evidence snapshot but apply a different decision lens.

| Specialist | Primary coverage | Evidence used |
|---|---|---|
| Executive Briefing | leadership attention, delivery confidence, overall exposure, immediate decisions | completion, delivery confidence, health score, blockers, critical items, open defects, top risk, capacity concentration, data-quality score |
| Flow & Bottleneck | work getting stuck, aging/WIP pressure, bottlenecks, capacity concentration | blocked/critical counts, lead time, cycle time, top ranked flow-risk items, assignee load concentration |
| Risk & Quality | delivery risk, defect/blocker exposure, whether the dataset is trustworthy enough for a decision | critical items, blocked items, open defects, top ranked risks, data-quality score |
| Forecast | likely finish outlook and signals that could move it | predicted completion/date, estimated days remaining, velocity when available, completion, delivery confidence, blockers/critical items, leading risk |

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

### Deliberately not covered in this interactive increment

The model does not currently receive or operate on:

- the complete raw Jira CSV/XLS/XLSX dataset;
- every sprint's full detailed metrics;
- complete Kanban status-distribution records;
- full quarter-by-quarter history;
- complete label, issue-type, project, parent, or relation-map datasets;
- retrospective content or team sentiment;
- full release-readiness internals beyond evidence already represented in the compact snapshot;
- external web/company/market information;
- Jira write-back or autonomous changes;
- conversation history or long-running agent memory;
- the master-plan product-intelligence admin datasets for feedback clustering/error correlation/weekly reports unless separately implemented.

## Acceptance criteria

- [x] `/intelligence` interactive user workspace exists.
- [x] Intelligence is available in Analytics navigation and role routing.
- [x] Live evidence presentation includes risk, flow, capacity, confidence, and forecast signals.
- [x] Executive, Flow, Risk, and Forecast specialist lenses exist.
- [x] Provider-free Evidence mode works when the AI runtime is unavailable.
- [x] AI endpoint uses a compact evidence snapshot rather than the full Jira export.
- [x] Paid OpenAI API dependency removed from Delivery Intelligence.
- [x] Ollama provider adapter implemented with `qwen3.5:4b` and `qwen3.5:9b` routing.
- [x] Qwen structured-output contract, prompt separation, safe links, URL validation, and response normalization have unit coverage.
- [x] Browser E2E distinguishes self-hosted AI mode from Evidence mode.
- [ ] Security Audit green on exact final PR #56 head.
- [ ] Quality green on exact final PR #56 head.
- [ ] E2E green on exact final PR #56 head.
- [ ] No unresolved review threads on final PR #56 head.
- [ ] Both Qwen models pulled and reachable in the real private Ollama runtime.
- [ ] Live production `/intelligence` confirms both model routes after deployment.

## Deployment boundary

Repository implementation alone cannot make self-hosted AI live. The target environment must provide an Ollama service reachable by the Node application and must have both configured models pulled. The existing Hostinger integration available to this workspace does not expose hPanel runtime/package/service provisioning, so Ollama installation/reachability must be verified separately rather than assumed.

Do not mark this provider alignment fully shipped until those live-runtime checks are complete.
