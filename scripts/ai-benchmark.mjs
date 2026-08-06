// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// AIPLAN-01 Phase 0 server benchmark — qwen2.5:14b-instruct-q4_K_M.
// Measures TTFT (time to first token) and total latency via Ollama's streaming
// API, at 1/3/5 concurrent requests per product/TODO-List.md §28.17's stated
// performance-test matrix. See product/AI_BENCHMARK_REPORT.md for a real run's
// results and methodology caveats (this is not a substitute for reading those).
// Usage: node scripts/ai-benchmark.mjs (requires Ollama running locally with
// qwen2.5:14b-instruct-q4_K_M already pulled).
import { execSync } from 'node:child_process';

const MODEL = 'qwen2.5:14b-instruct-q4_K_M';
const PROMPT = 'Summarize in two sentences: a software team completed 22 of 35 planned issues this sprint, with 3 items blocked and 9 marked critical. What should the team focus on next?';

function samplePs() {
  try {
    const out = execSync('ps -eo pid,pcpu,rss,comm | grep -i ollama | grep -v grep', { encoding: 'utf-8' });
    return out.trim();
  } catch {
    return '(no ollama process sample)';
  }
}

async function singleRequest(label) {
  const start = performance.now();
  let firstTokenAt = null;
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({ model: MODEL, prompt: PROMPT, stream: true }),
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (firstTokenAt === null) firstTokenAt = performance.now();
    full += decoder.decode(value, { stream: true });
  }
  const end = performance.now();
  let totalDuration = null, evalCount = null;
  try {
    const lastLine = full.trim().split('\n').filter(Boolean).pop();
    const parsed = JSON.parse(lastLine);
    totalDuration = parsed.total_duration ? parsed.total_duration / 1e6 : null; // ns -> ms
    evalCount = parsed.eval_count ?? null;
  } catch {
    // Ollama's final streamed line wasn't valid JSON — leave duration/tokens null,
    // ttftMs/totalMs (measured independently, above) still reported.
  }
  return {
    label,
    ttftMs: firstTokenAt ? Math.round(firstTokenAt - start) : null,
    totalMs: Math.round(end - start),
    ollamaTotalMs: totalDuration ? Math.round(totalDuration) : null,
    tokens: evalCount,
  };
}

async function runConcurrency(n) {
  console.log(`\n=== Concurrency: ${n} ===`);
  console.log('ps before:', samplePs());
  const results = await Promise.all(Array.from({ length: n }, (_, i) => singleRequest(`req-${i + 1}`)));
  console.log('ps after: ', samplePs());
  for (const r of results) console.log(JSON.stringify(r));
  const ttfts = results.map(r => r.ttftMs).filter(Boolean);
  const totals = results.map(r => r.totalMs).filter(Boolean);
  console.log(`avg TTFT: ${Math.round(ttfts.reduce((a, b) => a + b, 0) / ttfts.length)}ms`);
  console.log(`avg total: ${Math.round(totals.reduce((a, b) => a + b, 0) / totals.length)}ms`);
  return results;
}

console.log('Warming up model (first load into memory)...');
const warmup = await singleRequest('warmup');
console.log('warmup:', JSON.stringify(warmup));

await runConcurrency(1);
await runConcurrency(3);
await runConcurrency(5);
