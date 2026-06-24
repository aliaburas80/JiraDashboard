'use client';

import Badge from '@/components/ui/Badge';
import { severityToBadgeVariant } from '@/lib/coachingBadge';
import type { RoleBasedCoachingInsight, CeremonyAdvice } from '@/types/roleBasedCoaching';
import styles from './CoachingInsightCard.module.scss';

interface Props {
  insight: RoleBasedCoachingInsight;
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className={styles.listSection}>
      <h3 className={styles.listSectionTitle}>{title}</h3>
      <ul className={styles.list}>
        {items.map((item, i) => (
          <li key={i} className={styles.listItem}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

const CEREMONY_LABELS: { key: keyof CeremonyAdvice; label: string }[] = [
  { key: 'dailyStandup', label: 'Daily Standup' },
  { key: 'refinement', label: 'Refinement' },
  { key: 'sprintPlanning', label: 'Sprint Planning' },
  { key: 'sprintReview', label: 'Sprint Review' },
  { key: 'retrospective', label: 'Retrospective' },
];

function CeremonyAdviceSection({ ceremonyAdvice }: { ceremonyAdvice: CeremonyAdvice }) {
  const populated = CEREMONY_LABELS.filter(({ key }) => ceremonyAdvice[key].length > 0);
  if (populated.length === 0) return null;

  return (
    <div className={styles.listSection}>
      <h3 className={styles.listSectionTitle}>Ceremony Advice</h3>
      {populated.map(({ key, label }) => (
        <div key={key} className={styles.ceremonyGroup}>
          <p className={styles.ceremonyGroupLabel}>{label}</p>
          <ul className={styles.list}>
            {ceremonyAdvice[key].map((item, i) => (
              <li key={i} className={styles.listItem}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function CoachingInsightCard({ insight }: Props) {
  const { confidence } = insight;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Badge label={insight.severity.toUpperCase()} variant={severityToBadgeVariant(insight.severity)} />
        <span className={styles.confidenceChip} title={confidence.reason}>
          Confidence: {confidence.band === 'N/A' ? 'Not available' : `${confidence.band} (${confidence.score}%)`}
        </span>
      </div>

      <p className={styles.healthSummary}>{insight.healthSummary}</p>

      {confidence.band === 'N/A' && (
        <p className={styles.confidenceFallback}>{confidence.reason}</p>
      )}

      <ListSection title="Weak Points" items={insight.weakPoints} />
      <ListSection title="Focus Areas" items={insight.focusAreas} />

      {insight.evidence.length > 0 && (
        <div className={styles.listSection}>
          <h3 className={styles.listSectionTitle}>Evidence</h3>
          <div className={styles.evidenceList}>
            {insight.evidence.map((e, i) => (
              <div key={i} className={styles.evidenceRow}>
                <span className={styles.evidenceLabel}>{e.label}</span>
                <span className={styles.evidenceValue}>{e.value}</span>
                <span className={styles.evidenceDetail}>{e.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ListSection title="Recommended Actions" items={insight.recommendedActions} />
      <ListSection title="Prevention Advice" items={insight.preventionAdvice} />
      <CeremonyAdviceSection ceremonyAdvice={insight.ceremonyAdvice} />
      <ListSection title="Next Sprint Suggestions" items={insight.nextSprintSuggestions} />
    </div>
  );
}
