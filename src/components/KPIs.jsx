import './KPIs.css';

/**
 * Grilla de KPIs.
 *
 * @param {Array} items - [{ label, value, sub?, tone? }]
 *   tone opcional: 'pos' | 'neg' | 'warn' | 'info'
 */
export default function KPIs({ items }) {
  return (
    <div className="kpi-grid">
      {items.map((kpi, i) => (
        <div key={i} className={`kpi-card ${kpi.tone ? 'tone-' + kpi.tone : ''}`}>
          <div className="kpi-label">{kpi.label}</div>
          <div className="kpi-val">{kpi.value}</div>
          {kpi.sub && <div className="kpi-sub">{kpi.sub}</div>}
        </div>
      ))}
    </div>
  );
}
