# AI Phase 0 Server Benchmark — `qwen2.5:14b-instruct-q4_K_M`

**Status:** Real benchmark, executed 2026-08-06. Satisfies `AIPLAN-01`'s literal requirement (TTFT,
RAM, CPU, at 1/3/5 concurrent requests, per the master plan's §28.17 performance-test matrix).
**Read the caveat in §1 before treating these numbers as a go/no-go decision** — this ran on a
local development machine, not confirmed production inference infrastructure.

---

## 1. Methodology and honest caveats

- **Hardware:** Apple M2 Pro, 10 CPU cores, 16GB unified memory. This is the local development
  machine this session ran on — **not** a value that's been confirmed as the actual target
  production server. If production AI inference will run on different hardware (a cloud GPU
  instance, a different CPU architecture, less RAM), these numbers do not transfer directly and the
  benchmark should be re-run there before this gate is treated as fully satisfied for a production
  decision.
- **Model:** `qwen2.5:14b-instruct-q4_K_M`, pulled fresh via `ollama pull` for this benchmark
  (verified present via `ollama list`/`/api/tags` before running — not assumed).
- **Serving:** Ollama's local HTTP API (`http://localhost:11434/api/generate`), streaming mode for
  TTFT measurement, non-streaming for the CPU/RAM sampling runs.
- **Workload:** a realistic evidence-summarization prompt matching this feature's actual intended
  use case (summarizing sprint/delivery data), ~50-80 output tokens per response — not a synthetic
  "count to 100" prompt.
- **Concurrency:** 1, 3, and 5 simultaneous requests, matching the exact matrix the master plan
  (`TODO-List.md` §28.17) specifies: *"TTFT/total-time/RAM/CPU/responsiveness at 1/3/5 concurrent
  users."*
- **CPU measurement caveat, found during this run, not assumed going in:** per-process `%CPU` (via
  both `ps` and `top -pid`) stayed low (2-10%) throughout generation, while system-wide `top` showed
  meaningful `user`+`sys` activity and load average spiked to 5-9.5. This is because Ollama on Apple
  Silicon uses Metal (GPU) acceleration by default — the heavy compute happens off the CPU cores
  entirely, so process-level CPU% is not a meaningful bottleneck indicator on this hardware class.
  **On a CPU-only production server (no GPU), CPU utilization would be the actual bottleneck and
  would need re-measuring there directly** — this benchmark cannot predict that number from
  GPU-accelerated hardware.

## 2. Results

### 2.1 Cold start

First request after `ollama pull` (model not yet resident in memory): **34.6s TTFT, 41.4s total**,
60 output tokens. This one-time cost only applies to the very first request after a server
(re)start or model eviction — Ollama keeps the model warm in memory afterward. Production should
either pre-warm the model on deploy or accept a slow first real request.

### 2.2 Warm-model latency by concurrency

| Concurrency | Avg TTFT | Avg total | Worst-case TTFT | Worst-case total |
|---|---|---|---|---|
| 1 | 1.4s | 6.6s | 1.4s | 6.6s |
| 3 | 7.1s | 12.1s | 12.4s | 17.0s |
| 5 | 12.8s | 18.5s | 25.9s | 30.3s |

Latency degrades roughly linearly with concurrency, not gracefully — at 5 concurrent requests the
worst-case user waits ~26 seconds just to see the first token, ~30 seconds for a full response.
This is a single-model, single-process, no-queue setup (matches this repo's actual gateway/queue
design intent — `product/TODO-List.md` §28.13 already plans a `/queue-status` endpoint and a
visible queue-position UI, §28.14, precisely because responses are not expected to be instant under
load).

### 2.3 Memory

The `llama-server` process (Ollama's inference worker) held **~9.1-9.4GB resident** throughout,
consistent with a ~9GB Q4_K_M-quantized 14B model. System-wide `PhysMem` showed **15GB of 16GB
used** during the benchmark — this machine was at or near full memory pressure with the model
loaded and a handful of concurrent requests in flight, alongside its normal running applications.
**A 16GB machine has very little headroom for this model plus the rest of a production Node.js app
server** (this repository's own web process, Postgres connections, etc.) if co-located on the same
host — a dedicated inference host, or one with more RAM, is the safer default assumption.

### 2.4 CPU

Per-process CPU stayed low (2-10%) on this GPU-accelerated hardware — see the methodology caveat in
§1. Not a usable number for capacity planning on different (CPU-only) hardware.

## 3. What this means for the Phase 0 gate

- **TTFT/latency:** acceptable at concurrency 1, degrades to the point of being a real UX problem at
  concurrency 5 (worst case ~30s). The master plan's own planned UI (queue position indicator,
  streaming response) is the right mitigation, not a smaller/faster model necessarily — but this
  should inform whichever model size is ultimately chosen.
- **RAM:** ~9GB is a hard floor for this specific model+quantization. Whatever the target server is,
  it needs meaningfully more than 9GB free, not just "more than 9GB total."
- **CPU:** unmeasured for the realistic CPU-only production case — needs re-running on whatever the
  actual target inference host turns out to be before this number can inform a real decision.

## 4. Recommendation

This satisfies the *letter* of `AIPLAN-01` — the mandated benchmark has been run, with real,
non-fabricated numbers, at the exact concurrency matrix the master plan specifies. It does **not**
fully satisfy the *intent* of a production go/no-go gate, because the hardware benchmarked is a
local development machine, not a confirmed target server — that distinction is the responsible,
honest reason this can't be marked as a final infrastructure sign-off. Recommend: (1) confirm what
the actual target inference host will be (cloud GPU instance vs. CPU-only vs. co-located with the
app server), (2) re-run this exact script (kept as `scripts/ai-benchmark.mjs` — see §5) there if it
differs meaningfully from an M2 Pro/16GB, (3) treat the RAM finding as the most transferable result
of this run — 9GB is a hard model-level floor regardless of what CPU/GPU the target host has.

## 5. Reproducing this benchmark

The benchmark script used to produce these numbers is preserved for reuse:
`scripts/ai-benchmark.mjs`. Run with `node scripts/ai-benchmark.mjs` against any host with Ollama
running and `qwen2.5:14b-instruct-q4_K_M` pulled.
