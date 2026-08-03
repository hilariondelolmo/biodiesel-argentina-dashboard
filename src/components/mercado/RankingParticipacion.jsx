import { fmt } from '../../lib/format.js';
import '../gestion/Ranking.css';

/**
 * Ranking de participación: barras proporcionales al share del total.
 * items: [{ nombre, valor (ton), marcado? }]
 */
export default function RankingParticipacion({ items, max = 20 }) {
  const total = items.reduce((s, it) => s + it.valor, 0);
  const orden = [...items].sort((a, b) => b.valor - a.valor);
  const top = orden.slice(0, max);
  const resto = orden.slice(max).reduce((s, it) => s + it.valor, 0);
  const maxValor = top[0]?.valor || 1;

  return (
    <div className="ranking">
      {top.map((it) => (
        <div key={it.nombre} className="ranking-row">
          <div className="ranking-nombre">
            {fmt.truncate(it.nombre, 38)}
          </div>
          <div className="ranking-barra">
            <div
              className="ranking-barra-fill share"
              style={{ width: `${(it.valor / maxValor) * 100}%`, background: 'var(--accent-exp)' }}
            />
          </div>
          <div className="ranking-valor" style={{ color: 'var(--ink)' }}>
            {fmt.pct((it.valor / total) * 100)}
          </div>
          <div className="ranking-detalle">{fmt.int(it.valor)} ton</div>
        </div>
      ))}
      {resto > 0 && (
        <div className="ranking-row">
          <div className="ranking-nombre">Resto ({orden.length - max})</div>
          <div className="ranking-barra">
            <div
              className="ranking-barra-fill"
              style={{ width: `${(resto / maxValor) * 100}%`, background: 'var(--bg-4)' }}
            />
          </div>
          <div className="ranking-valor" style={{ color: 'var(--ink-muted)' }}>
            {fmt.pct((resto / total) * 100)}
          </div>
          <div className="ranking-detalle">{fmt.int(resto)} ton</div>
        </div>
      )}
    </div>
  );
}
