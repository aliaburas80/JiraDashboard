import styles from './DCStatusChip.module.scss';

type Tone = 'critical' | 'warning' | 'success' | 'info' | 'neutral' | 'purple';

interface Props {
  label: string;
  tone?: Tone;
  size?: 'sm' | 'md';
}

export default function DCStatusChip({ label, tone = 'neutral', size = 'sm' }: Props) {
  return (
    <span className={styles.chip} data-tone={tone} data-size={size}>
      <span className={styles.dot} aria-hidden="true" />
      {label}
    </span>
  );
}
