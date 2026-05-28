export default function KpiCard({ label, value, detail, accent = 'blue' }) {
  return (
    <div className={`kpi-card accent-${accent}`}>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {detail && <div className="kpi-detail">{detail}</div>}
    </div>
  );
}
