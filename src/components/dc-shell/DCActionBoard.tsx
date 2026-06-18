type Priority = 'P0' | 'P1' | 'P2' | 'P3';

const P_COLORS: Record<Priority, string> = {
  P0: 'var(--dc-critical)',
  P1: 'var(--dc-warning)',
  P2: 'var(--dc-brand)',
  P3: 'var(--dc-text-3)',
};

const P_BG: Record<Priority, string> = {
  P0: 'var(--dc-critical-soft)',
  P1: 'var(--dc-warning-soft)',
  P2: 'var(--dc-brand-soft)',
  P3: 'var(--dc-surface-blue)',
};

interface Action {
  priority: Priority;
  title: string;
  detail?: string;
  count?: number;
}

interface Props {
  actions: Action[];
  onAction?: (idx: number) => void;
}

export default function DCActionBoard({ actions, onAction }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {actions.map((a, i) => (
        <div
          key={i}
          className="dc-action-row"
          style={{ background: P_BG[a.priority] }}
          onClick={() => onAction?.(i)}
          role={onAction ? 'button' : undefined}
          tabIndex={onAction ? 0 : undefined}
          onKeyDown={onAction ? e => e.key === 'Enter' && onAction(i) : undefined}
        >
          <div
            className="dc-action-priority"
            style={{ background: P_COLORS[a.priority], minWidth: 44 }}
          >
            {a.priority}
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--dc-text)', margin: 0 }}>{a.title}</p>
            {a.detail && <p style={{ fontSize: 11, color: 'var(--dc-text-2)', margin: '2px 0 0' }}>{a.detail}</p>}
          </div>
          {a.count !== undefined && (
            <span style={{
              fontSize: 12, fontWeight: 900, color: P_COLORS[a.priority],
              background: 'white', borderRadius: 8, padding: '2px 7px',
              border: `1px solid ${P_COLORS[a.priority]}33`,
            }}>
              {a.count}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
