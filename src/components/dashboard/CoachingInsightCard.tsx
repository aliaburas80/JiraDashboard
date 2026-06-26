'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { SvgIcon } from '@/components/ui/SvgIcon';
import type { RoleBasedCoachingInsight, CeremonyAdvice } from '@/types/roleBasedCoaching';
import type { CheckSeverity } from '@/types/dataQuality';
import type { SeverityTrend } from '@/services/coaching/coachingTrend.service';
import { resolveEvidenceRoute } from '@/lib/coachingEvidenceLink';
import styles from './CoachingInsightCard.module.scss';

interface Props {
  insight: RoleBasedCoachingInsight;
  trend?: SeverityTrend;
}

const TREND_META: Record<SeverityTrend, { icon: string; label: string }> = {
  improved: { icon: 'arrowUp', label: 'Improved since last snapshot' },
  worsened: { icon: 'arrowDown', label: 'Worsened since last snapshot' },
  same: { icon: 'minus', label: 'Unchanged since last snapshot' },
};

// ── Severity → mood (encouraging framing, not just a status color) ────────────
// EXCEPTION (CLAUDE.md Rule 1): mood color/bg/border are data-driven (severity);
// passed as CSS custom properties, consumed by .heroBanner in the SCSS module.
const MOOD: Record<CheckSeverity, { icon: string; label: string; color: string; soft: string; border: string }> = {
  low:      { icon: 'party',           label: 'Looking good',     color: 'var(--color-success)', soft: 'var(--color-success-soft)', border: 'var(--color-success-border)' },
  medium:   { icon: 'target',          label: 'On track',         color: 'var(--color-info)',     soft: 'var(--color-info-soft)',     border: 'var(--color-primary-border)' },
  high:     { icon: 'warning',         label: 'Needs focus',      color: 'var(--color-warning)',  soft: 'var(--color-warning-soft)',  border: 'var(--color-warning-border)' },
  critical: { icon: 'priorityBlocker', label: 'Needs attention',  color: 'var(--color-danger-strong)', soft: 'var(--color-danger-soft)', border: 'var(--color-danger-border)' },
};

const CEREMONY_META: { key: keyof CeremonyAdvice; label: string; icon: string }[] = [
  { key: 'dailyStandup',   label: 'Daily Standup',   icon: 'refresh' },
  { key: 'refinement',     label: 'Refinement',      icon: 'magicWand' },
  { key: 'sprintPlanning', label: 'Sprint Planning',  icon: 'flag' },
  { key: 'sprintReview',   label: 'Sprint Review',   icon: 'star' },
  { key: 'retrospective',  label: 'Retrospective',   icon: 'comment' },
];

// ── Compact icon-row list (shared by "What to Watch" and "Do This Next") ──────
function IconRow({ icon, text, accent }: { icon: string; text: string; accent: string }) {
  return (
    // --row-accent is data-driven (which lookup the row belongs to).
    <div className={styles.iconRow} style={{ '--row-accent': accent } as CSSProperties}>
      <span className={styles.iconRowIcon}><SvgIcon name={icon} size={15} /></span>
      <span className={styles.iconRowText}>{text}</span>
    </div>
  );
}

// Shown in place of a list when there's genuinely nothing to flag — a silent gap
// reads as missing data, an explicit message reads as a deliberate "all clear".
function EmptyRow({ text }: { text: string }) {
  return (
    <div className={styles.emptyRow}>
      <SvgIcon name="checkCircle" size={15} />
      <span>{text}</span>
    </div>
  );
}

function CeremonyAccordion({ ceremonyAdvice }: { ceremonyAdvice: CeremonyAdvice }) {
  const populated = CEREMONY_META.filter(({ key }) => ceremonyAdvice[key].length > 0);
  const [open, setOpen] = useState<Set<string>>(new Set());
  if (populated.length === 0) {
    return (
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}><SvgIcon name="calendar" size={14} /> Ceremony Advice</h3>
        <EmptyRow text="No ceremony advice needed right now — current practices are working." />
      </section>
    );
  }

  function toggle(key: string) {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}><SvgIcon name="calendar" size={14} /> Ceremony Advice</h3>
      <div className={styles.ceremonyChipRow}>
        {populated.map(({ key, label, icon }) => {
          const isOpen = open.has(key);
          return (
            <button
              key={key}
              type="button"
              className={clsx(styles.ceremonyChip, { [styles.ceremonyChipOpen]: isOpen })}
              aria-expanded={isOpen}
              onClick={() => toggle(key)}
            >
              <SvgIcon name={icon} size={13} />
              {label}
              <span className={styles.ceremonyChipCount}>{ceremonyAdvice[key].length}</span>
              <SvgIcon name="chevronDown" size={12} className={styles.ceremonyChevron} />
            </button>
          );
        })}
      </div>
      {populated.filter(({ key }) => open.has(key)).map(({ key, label }) => (
        <div key={key} className={styles.ceremonyPanel}>
          <p className={styles.ceremonyPanelLabel}>{label}</p>
          <ul className={styles.plainList}>
            {ceremonyAdvice[key].map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      ))}
    </section>
  );
}

// Low severity gets a celebratory headline citing real evidence instead of a generic line.
function heroHeadline(insight: RoleBasedCoachingInsight): string {
  const base = insight.severity === 'low' && insight.evidence.length > 0
    ? `${insight.evidence[0].value} ${insight.evidence[0].label.toLowerCase()} — keep it up.`
    : insight.healthSummary;

  // Thin data shouldn't be framed with the same certainty as a well-evidenced verdict.
  const isThinData = insight.confidence.band === 'Low' || insight.confidence.band === 'Unreliable' || insight.confidence.band === 'N/A';
  return isThinData ? `Early signal: ${base}` : base;
}

export default function CoachingInsightCard({ insight, trend }: Props) {
  const { confidence } = insight;
  const mood = MOOD[insight.severity];
  const trendMeta = trend ? TREND_META[trend] : null;

  const watchList = [
    ...insight.weakPoints.map(text => ({ text, icon: 'warning', accent: 'var(--color-warning)' })),
    ...insight.focusAreas.map(text => ({ text, icon: 'target', accent: 'var(--color-info)' })),
  ];
  const doNext = [
    ...insight.recommendedActions.map(text => ({ text, icon: 'checkCircle', accent: 'var(--color-success)' })),
    ...insight.preventionAdvice.map(text => ({ text, icon: 'shield', accent: 'var(--color-primary)' })),
  ];

  return (
    <div className={styles.card}>

      {/* ── Hero banner ── */}
      <div
        className={styles.heroBanner}
        style={{ '--mood-color': mood.color, '--mood-soft': mood.soft, '--mood-border': mood.border } as CSSProperties}
      >
        <div className={styles.heroIcon}><SvgIcon name={mood.icon} size={26} /></div>
        <div className={styles.heroBody}>
          <p className={styles.heroMood}>
            {mood.label}
            {trendMeta && (
              <span className={clsx(styles.trendBadge, styles[`trendBadge--${trend}`])} title={trendMeta.label}>
                <SvgIcon name={trendMeta.icon} size={11} />
              </span>
            )}
          </p>
          <p className={styles.heroSummary}>{heroHeadline(insight)}</p>
        </div>
        <span
          className={styles.confidencePill}
          title={confidence.reason}
        >
          {confidence.band === 'N/A' ? 'Confidence: not enough data yet' : `${confidence.band} confidence · ${confidence.score}%`}
        </span>
      </div>

      {/* ── Evidence stat chips ── */}
      {insight.evidence.length > 0 && (
        <div className={styles.evidenceRow}>
          {insight.evidence.map((e, i) => {
            const route = resolveEvidenceRoute(e.metricKey);
            const content = (
              <>
                <p className={styles.evidenceChipValue}>{e.value}</p>
                <p className={styles.evidenceChipLabel}>
                  {e.label}
                  {route && <SvgIcon name="arrowRight" size={10} className={styles.evidenceChipLinkIcon} />}
                </p>
              </>
            );
            return route ? (
              <Link key={i} href={route} className={clsx(styles.evidenceChip, styles.evidenceChipLinked)} title={e.detail}>
                {content}
              </Link>
            ) : (
              <div key={i} className={styles.evidenceChip} title={e.detail}>
                {content}
              </div>
            );
          })}
        </div>
      )}

      {/* ── What to Watch (weak points + focus areas) ── */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}><SvgIcon name="eye" size={14} /> What to Watch</h3>
        {watchList.length > 0 ? (
          <div className={styles.iconRowList}>
            {watchList.map((w, i) => <IconRow key={i} icon={w.icon} text={w.text} accent={w.accent} />)}
          </div>
        ) : (
          <EmptyRow text="Nothing to flag here — keep doing what you're doing." />
        )}
      </section>

      {/* ── Do This Next (recommended actions + prevention advice) ── */}
      {doNext.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}><SvgIcon name="checkCircle" size={14} /> Do This Next</h3>
          <div className={styles.iconRowList}>
            {doNext.map((d, i) => <IconRow key={i} icon={d.icon} text={d.text} accent={d.accent} />)}
          </div>
        </section>
      )}

      <CeremonyAccordion ceremonyAdvice={insight.ceremonyAdvice} />

      {/* ── Next Sprint Suggestions — celebratory highlight strip ── */}
      {insight.nextSprintSuggestions.length > 0 && (
        <section className={clsx(styles.section, styles.suggestionsStrip)}>
          <h3 className={styles.sectionTitle}><SvgIcon name="lightbulb" size={14} /> Try This Next Sprint</h3>
          <ul className={styles.plainList}>
            {insight.nextSprintSuggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
