export default function KpiCard({ label, value, detail, accent = 'blue', onClick, tooltip, thresholds }) {
  const numeric = (() => {
    if (typeof value === 'number') return value;
    if (!value) return null;
    const parsed = parseFloat(String(value).replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  })();

  const content = (
    <div className={`kpi-card accent-${accent}${onClick ? ' clickable' : ''}`}>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {detail && <div className="kpi-detail">{detail}</div>}

      {(thresholds && numeric !== null) && (
        <div className="kpi-threshold-track" aria-hidden>
          {['critical','warning','good'].map((k) => {
            const v = thresholds[k];
            const width = Math.max(0, Math.min(100, ((v ?? 0) / (thresholds.max || 100)) * 100));
            return <div key={k} className={`kpi-threshold-segment ${k}`} style={{ width: `${width}%` }} />;
          })}
          <div className="kpi-threshold-marker" style={{ left: `${Math.max(0, Math.min(100, ((numeric) / (thresholds.max || 100)) * 100))}%` }} />
        </div>
      )}

      <div className="kpi-hover" role="presentation">
        <div className="kpi-hover-inner">
          {tooltip ? <div className="kpi-tooltip">{tooltip}</div> : null}
          {thresholds ? (
            <div className="kpi-threshold-legend">
              <span className="legend good">Good ≤ {thresholds.good}{thresholds.unit || ''}</span>
              <span className="legend warning">Warn ≤ {thresholds.warning}{thresholds.unit || ''}</span>
              <span className="legend critical">Crit ≤ {thresholds.critical}{thresholds.unit || ''}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" className="kpi-card-button" onClick={onClick}>
        {content}
      </button>
    );
  }

  return content;
}
