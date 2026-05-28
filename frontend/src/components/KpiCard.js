export default function KpiCard({ label, value, detail }) {
  return (
    <div className="kpi-card">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {detail && <div className="kpi-detail">{detail}</div>}
    </div>
  );
}
