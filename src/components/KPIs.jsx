import './KPIs.css';

/**
 * Grilla de KPIs.
 *
 * @param {Array} items - [{ label, value, sub?, tone?, texto?, delta? }]
 *   tone opcional: 'pos' | 'neg' | 'warn' | 'info'
 *   texto: true para valores no numéricos (categoría, grupo...) - cuerpo
 *   menor, negrita y mayúsculas parejas en vez del cuerpo de cifras
 *   delta: nodo de variación (p.ej. <Delta/> de kpiHelpers) bajo el sub
 */
export default function KPIs({ items }) {
  return (
    <div className="kpi-grid">
      {items.map((kpi, i) => (
        <div key={i} className={`kpi-card ${kpi.tone ? 'tone-' + kpi.tone : ''}`}>
          <div className="kpi-label">{kpi.label}</div>
          <div className={`kpi-val${kpi.texto ? ' kpi-val-texto' : ''}`}>{kpi.value}</div>
          {kpi.sub && <div className="kpi-sub">{kpi.sub}</div>}
          {kpi.delta}
        </div>
      ))}
    </div>
  );
}
