// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { MiniKpiCard, PageHeader, PageLoading } from '@/components/dashboard/DashboardPageShell';
import { SvgIcon } from '@/components/ui/SvgIcon';
import { loadMetricsWithSource } from '@/lib/storage';
import { redirectWithLoadError } from '@/lib/loadErrorSignal';
import {
  buildEvidenceAnswer,
  buildIntelligenceSnapshot,
  getAgentDefinition,
  INTELLIGENCE_AGENTS,
} from '@/lib/intelligence/evidence';
import type { IntelligenceAgentId, IntelligenceAnswer, IntelligenceSeverity } from '@/lib/intelligence/types';
import type { DashboardMetrics } from '@/types/metrics';
import styles from './page.module.scss';

const SEVERITY_LABEL: Record<IntelligenceSeverity, string> = {
  neutral: 'Signal',
  good: 'Healthy',
  warning: 'Watch',
  critical: 'Act now',
};

const FLEXIBLE_QUESTION_EXAMPLES = [
  'How many active issues do we have?',
  'What is our average cycle time?',
  'Who has the highest workload?',
  'What is the oldest risk item?',
  'What are the biggest delivery risks?',
  'When are we expected to finish?',
  'What does the analysis say about sprint groups?',
  'What does the data say about completed story points?',
];

export default function IntelligencePage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<IntelligenceAgentId>('executive');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<IntelligenceAnswer | null>(null);
  const [asking, setAsking] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await loadMetricsWithSource();
        if (cancelled) return;
        const data = result.metrics as DashboardMetrics | null;
        if (!data) {
          router.replace('/');
          return;
        }
        setMetrics(data);
      } catch {
        if (!cancelled) redirectWithLoadError(router);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [router]);

  const snapshot = useMemo(() => metrics ? buildIntelligenceSnapshot(metrics) : null, [metrics]);
  const activeAgent = getAgentDefinition(agent);
  const activeAnswer = useMemo(() => {
    if (!snapshot) return null;
    return answer?.agent === agent ? answer : buildEvidenceAnswer(agent, snapshot);
  }, [agent, answer, snapshot]);

  async function askAgent(prompt: string) {
    if (!snapshot || asking) return;
    const clean = prompt.trim();
    if (!clean) return;
    setQuestion(clean);
    setAsking(true);
    setConversationError(null);
    try {
      const response = await fetch('/api/intelligence/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agent, question: clean, snapshot }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || 'Unable to run the intelligence agent.');
      }
      const payload = await response.json() as { answer?: IntelligenceAnswer };
      if (!payload.answer) throw new Error('The intelligence agent returned no answer.');
      setAnswer(payload.answer);
    } catch (error) {
      setConversationError(error instanceof Error ? error.message : 'Unable to run the intelligence agent.');
      setAnswer(buildEvidenceAnswer(agent, snapshot, clean));
    } finally {
      setAsking(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askAgent(question);
  }

  if (loading) return <AppShell showNav><PageLoading /></AppShell>;
  if (!metrics || !snapshot || !activeAnswer) return null;

  const topCapacity = snapshot.capacityHotspots[0];
  const forecastValue = snapshot.forecast.complete
    ? 'Done'
    : snapshot.forecast.daysRemaining != null
      ? `~${snapshot.forecast.daysRemaining}d`
      : snapshot.forecast.predictedDate ?? 'N/A';

  return (
    <AppShell showNav>
      <PageHeader
        id="tour-header-intelligence"
        title="Delivery Intelligence"
        badge="AI + Evidence"
        subtitle="Ask any question about your analyzed Jira delivery data — the assistant answers from the evidence it has"
      />

      <main className={styles.pageContent}>
        <section className={styles.kpiGrid} aria-label="Delivery intelligence pulse">
          <MiniKpiCard
            label="Delivery Confidence"
            value={`${snapshot.deliveryConfidence}%`}
            color="var(--color-primary)"
            bg="var(--color-primary-soft)"
            border="var(--color-primary-border)"
          />
          <MiniKpiCard
            label="Completion"
            value={`${snapshot.completionRate}%`}
            color="var(--color-health-excellent-text)"
            bg="var(--color-success-soft)"
            border="var(--color-success-border)"
          />
          <MiniKpiCard
            label="Critical / Blocked"
            value={`${snapshot.criticalIssues} / ${snapshot.blockedIssues}`}
            color="var(--color-danger-strong)"
            bg="var(--color-danger-soft)"
            border="var(--color-danger-border)"
          />
          <MiniKpiCard
            label="Forecast"
            value={forecastValue}
            color="var(--color-text-secondary)"
            bg="var(--color-subtle)"
            border="var(--color-border)"
          />
        </section>

        <section className={styles.agentStrip} aria-label="Specialist agents">
          {INTELLIGENCE_AGENTS.map(candidate => (
            <button
              key={candidate.id}
              type="button"
              className={`${styles.agentCard} ${agent === candidate.id ? styles.agentCardActive : ''}`}
              onClick={() => { setAgent(candidate.id); setAnswer(null); setQuestion(''); setConversationError(null); }}
              aria-pressed={agent === candidate.id}
            >
              <span className={styles.agentIcon}><SvgIcon name={candidate.icon} size={20} /></span>
              <span className={styles.agentCopy}>
                <strong>{candidate.shortName}</strong>
                <small>{candidate.description}</small>
              </span>
            </button>
          ))}
        </section>

        <div className={styles.workspaceGrid}>
          <section className={styles.evidencePanel} aria-label="Current evidence">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>LIVE EVIDENCE</p>
                <h2>What the data is saying</h2>
              </div>
              <Link href="/work-explorer" className={styles.textLink}>Explore work <SvgIcon name="arrowRight" size={14} /></Link>
            </div>

            <div className={styles.signalGrid}>
              <article className={styles.signalCard}>
                <span>Flow pressure</span>
                <strong>{snapshot.averageCycleTimeDays}d cycle</strong>
                <small>{snapshot.averageLeadTimeDays}d average lead time</small>
              </article>
              <article className={styles.signalCard}>
                <span>Open defects</span>
                <strong>{snapshot.openDefects}</strong>
                <small>{snapshot.dataQualityScore}% data-quality score</small>
              </article>
              <article className={styles.signalCard}>
                <span>Capacity concentration</span>
                <strong>{topCapacity ? `${topCapacity.loadShare}%` : 'N/A'}</strong>
                <small>{topCapacity ? topCapacity.assignee : 'No capacity signal'}</small>
              </article>
            </div>

            <div className={styles.subsectionHead}>
              <h3>Priority attention</h3>
              <span>{snapshot.riskItems.length} strongest signals</span>
            </div>
            <div className={styles.riskList}>
              {snapshot.riskItems.slice(0, 6).map(item => (
                <article key={item.key} className={styles.riskRow} data-severity={item.severity}>
                  <div className={styles.riskMain}>
                    <div className={styles.riskTitleLine}>
                      <strong>{item.key}</strong>
                      <span className={styles.severityBadge}>{SEVERITY_LABEL[item.severity]}</span>
                    </div>
                    <p>{item.summary || item.reason || item.status}</p>
                    <small>{item.assignee} · {item.status}{item.ageDays != null ? ` · ${item.ageDays}d` : ''}</small>
                  </div>
                  {item.blocked && <span className={styles.blockedMark}><SvgIcon name="priorityBlocker" size={16} /> Blocked</span>}
                </article>
              ))}
            </div>

            {snapshot.capacityHotspots.length > 0 && (
              <>
                <div className={styles.subsectionHead}>
                  <h3>Capacity distribution</h3>
                  <Link href="/teams" className={styles.mutedLink}>Open teams</Link>
                </div>
                <div className={styles.capacityList}>
                  {snapshot.capacityHotspots.slice(0, 5).map(item => (
                    <div key={item.assignee} className={styles.capacityRow}>
                      <div className={styles.capacityLabel}>
                        <span>{item.assignee}</span>
                        <strong>{item.loadShare}%</strong>
                      </div>
                      <div className={styles.capacityTrack}>
                        <div className={styles.capacityFill} style={{ '--load-share': `${item.loadShare}%` } as CSSProperties} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className={styles.agentWorkspace} aria-label="AI delivery agent workspace">
            <div className={styles.agentHeader}>
              <span className={styles.agentHeroIcon}><SvgIcon name={activeAgent.icon} size={24} /></span>
              <div>
                <p className={styles.eyebrow}>SPECIALIST AGENT</p>
                <h2>{activeAgent.name}</h2>
                <p>{activeAgent.description}</p>
              </div>
            </div>

            <div className={styles.suggestionList}>
              {activeAgent.suggestedQuestions.map(suggestion => (
                <button key={suggestion} type="button" onClick={() => void askAgent(suggestion)} disabled={asking}>
                  {suggestion}
                </button>
              ))}
            </div>

            <details className={styles.answerCard}>
              <summary className={styles.textLink}>Explore what else you can ask</summary>
              <p className={styles.answerSummary}>
                You are not limited to the suggested prompts. Ask naturally about metrics, blockers, risks, people,
                epics, forecast, flow, defects, data quality, or insights found in the analysis.
              </p>
              <div className={styles.suggestionList}>
                {FLEXIBLE_QUESTION_EXAMPLES.map(example => (
                  <button key={example} type="button" onClick={() => void askAgent(example)} disabled={asking}>
                    {example}
                  </button>
                ))}
              </div>
            </details>

            <form className={styles.askForm} onSubmit={submit}>
              <label htmlFor="intelligence-question">Ask anything about your analyzed delivery data</label>
              <p className={styles.answerNote}>
                Use natural language. AI answers from the current analysis and tells you when the evidence is insufficient.
              </p>
              <div className={styles.askRow}>
                <input
                  id="intelligence-question"
                  value={question}
                  maxLength={600}
                  onChange={event => setQuestion(event.target.value)}
                  placeholder="e.g. What should I act on before the next steering meeting?"
                />
                <button type="submit" disabled={asking || !question.trim()}>
                  <SvgIcon name="send" size={16} /> {asking ? 'Analyzing…' : 'Ask'}
                </button>
              </div>
            </form>

            {conversationError && <p className={styles.inlineError}>{conversationError} Showing evidence mode instead.</p>}

            <article className={styles.answerCard} data-testid="intelligence-answer">
              <div className={styles.answerTopline}>
                <span className={styles.modeBadge} data-mode={activeAnswer.mode}>
                  {activeAnswer.mode === 'ai' ? 'AI analysis' : 'Evidence mode'}
                </span>
                {activeAnswer.model && <span className={styles.modelLabel}>{activeAnswer.model}</span>}
              </div>
              <h3>{activeAnswer.title}</h3>
              <p className={styles.answerSummary}>{activeAnswer.summary}</p>
              {activeAnswer.note && <p className={styles.answerNote}>{activeAnswer.note}</p>}

              <div className={styles.findingList}>
                {activeAnswer.findings.map((item, index) => (
                  <div key={`${item.title}-${index}`} className={styles.finding} data-severity={item.severity}>
                    <span className={styles.findingDot} />
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                      {item.evidence && <small>{item.evidence}</small>}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.actionHead}>Recommended actions</div>
              <div className={styles.actionList}>
                {activeAnswer.actions.map((item, index) => (
                  <div key={`${item.title}-${index}`} className={styles.actionRow} data-priority={item.priority}>
                    <span className={styles.actionPriority}>{item.priority}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.rationale}</p>
                      <small>{item.owner}</small>
                    </div>
                    {item.href && <Link href={item.href} aria-label={`Open ${item.title}`}><SvgIcon name="arrowRight" size={16} /></Link>}
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
