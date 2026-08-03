import { fmt } from '../../lib/format.js';
import './Ranking.css';

/**
 * Ranking horizontal de cumplimiento con umbrales de color.
 * items: [{ nombre, valor (%), detalle? }]
 * Umbrales: verde ≥95 · ámbar 80–95 · rojo <80.
 */
export default function RankingCumplimiento({ items, max = 130 }) {
  return (
    <div className="ranking">
      {items.map((it) => {
        const tone = it.valor >= 95 ? 'ok' : it.valor >= 80 ? 'medio' : 'bajo';
        return (
          <div key={it.nombre} className="ranking-row">
            <div className="ranking-nombre">
              {fmt.truncate(it.nombre, 38)}
            </div>
            <div className="ranking-barra">
              <div
                className={`ranking-barra-fill ${tone}`}
                style={{ width: `${Math.min(100, (it.valor / max) * 100)}%` }}
              />
              <span className="ranking-umbral" style={{ left: `${(100 / max) * 100}%` }} />
            </div>
            <div className={`ranking-valor ${tone}`}>{fmt.pct(it.valor)}</div>
            {it.detalle && <div className="ranking-detalle">{it.detalle}</div>}
          </div>
        );
      })}
    </div>
  );
}
