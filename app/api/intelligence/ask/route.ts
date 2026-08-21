// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Delivery Intelligence — authenticated specialist-agent endpoint.

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';
import { buildEvidenceAnswer, isIntelligenceAgentId } from '@/lib/intelligence/evidence';
import {
  buildOllamaModelSequence,
  buildOllamaRequestBody,
  DEFAULT_OLLAMA_DEEP_MODEL,
  DEFAULT_OLLAMA_FAST_MODEL,
  extractOllamaMessageContent,
  normaliseOllamaBaseUrl,
  parseAgentJson,
} from '@/lib/intelligence/ollamaProvider';
import type {
  IntelligenceAgentId,
  IntelligenceAnswer,
  IntelligenceSnapshot,
} from '@/lib/intelligence/types';

export const dynamic = 'force-dynamic';

const MAX_QUESTION_CHARS = 600;
const MAX_SNAPSHOT_BYTES = 48_000;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 12;
const OLLAMA_TIMEOUT_MS = 35_000;
const requestsByUser = new Map<string, number[]>();

function allowRequest(userId: string): boolean {
  const now = Date.now();
  const recent = (requestsByUser.get(userId) ?? []).filter(ts => now - ts < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    requestsByUser.set(userId, recent);
    return false;
  }
  recent.push(now);
  requestsByUser.set(userId, recent);
  return true;
}

function isSnapshot(value: unknown): value is IntelligenceSnapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<IntelligenceSnapshot>;
  return Number.isFinite(candidate.totalIssues)
    && Number.isFinite(candidate.completionRate)
    && Number.isFinite(candidate.deliveryConfidence)
    && Array.isArray(candidate.riskItems)
    && Array.isArray(candidate.capacityHotspots)
    && Array.isArray(candidate.epicSignals);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

async function askOllama(
  agent: IntelligenceAgentId,
  question: string,
  snapshot: IntelligenceSnapshot,
): Promise<IntelligenceAnswer | null> {
  const baseUrl = normaliseOllamaBaseUrl(process.env.OLLAMA_BASE_URL);
  const fastModel = process.env.OLLAMA_FAST_MODEL?.trim() || DEFAULT_OLLAMA_FAST_MODEL;
  const deepModel = process.env.OLLAMA_DEEP_MODEL?.trim() || DEFAULT_OLLAMA_DEEP_MODEL;
  const models = buildOllamaModelSequence(agent, fastModel, deepModel);

  for (const model of models) {
    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(buildOllamaRequestBody(agent, question, snapshot, model)),
        signal: AbortSignal.timeout(OLLAMA_TIMEOUT_MS),
        cache: 'no-store',
      });

      if (!response.ok) continue;
      const payload: unknown = await response.json();
      const text = extractOllamaMessageContent(payload);
      const answer = text ? parseAgentJson(agent, text, model) : null;
      if (answer) return answer;
    } catch {
      // Try the next configured local model when available. Executive and
      // Forecast prefer the 9b model and fall back to the 4b model; the focused
      // Flow/Risk paths use only the 4b model before Evidence mode takes over.
    }
  }

  return null;
}

export async function POST(request: Request) {
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  if (!allowRequest(session.userId)) {
    return NextResponse.json({ error: 'Too many intelligence requests. Try again in a minute.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const row = asRecord(body);
  if (!row || !isIntelligenceAgentId(row.agent)) {
    return NextResponse.json({ error: 'Unknown intelligence agent.' }, { status: 400 });
  }
  if (typeof row.question !== 'string' || !row.question.trim()) {
    return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
  }

  const question = row.question.trim().slice(0, MAX_QUESTION_CHARS);
  if (!isSnapshot(row.snapshot)) {
    return NextResponse.json({ error: 'A valid intelligence snapshot is required.' }, { status: 400 });
  }

  const snapshotJson = JSON.stringify(row.snapshot);
  if (Buffer.byteLength(snapshotJson, 'utf8') > MAX_SNAPSHOT_BYTES) {
    return NextResponse.json({ error: 'Intelligence snapshot is too large.' }, { status: 413 });
  }

  const fallback = buildEvidenceAnswer(row.agent, row.snapshot, question);
  const ai = await askOllama(row.agent, question, row.snapshot);
  if (ai) return NextResponse.json({ answer: ai });

  return NextResponse.json({
    answer: {
      ...fallback,
      note: 'Self-hosted AI runtime unavailable — showing grounded Evidence mode. Start Ollama and pull the configured Qwen models to activate AI analysis.',
    },
  });
}
