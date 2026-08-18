import corte from '../../data/corte.json';
import { fmt } from '../../lib/format.js';
import { PRESIDENCIAS, presidenciaDe } from '../../lib/gestiones.js';
import './Gestion.css';

/**
 * Eficacia por gestión presidencial: promedio de cumplimiento del corte
 * (real / obligatorio) y déficit físico acumulado en cada mandato.
 */
export default function EficaciaGestiones() {
  const mensual = corte.mensual.filter((m) => m.fecha >= '2010-01' && m.obligatorio !== null);

  const porGestion = PRESIDENCIAS.map((p) => {
    const meses = mensual.filter((m) => presidenciaDe(m.fecha)?.presidente === p.presidente);
    if (!meses.length) return null;
    const bio = meses.reduce((s, m) => s + m.bio_m3, 0);
    const goOblig = meses.reduce((s, m) => s + m.go_m3 * m.obligatorio, 0);
    const deficit = meses.reduce((s, m) => s + (m.deficit_ton || 0), 0);
    return {
      ...p,
      cumplimiento: (bio / goOblig) * 100,
      deficit,
      meses: meses.length,
    };
  }).filter(Boolean);

  return (
    <div className="gestion-cards">
      {porGestion.map((g) => (
        <div key={g.presidente} className="gestion-card">
          <div className="gestion-card-nombre">{g.corto}</div>
          <div className="gestion-card-periodo">
            {g.desde.slice(0, 7) < '2010-01' ? '2010-01' : g.desde.slice(0, 7)} →{' '}
            {g.hasta ? g.hasta.slice(0, 7) : 'hoy'} · {g.coalicion || '-'}
          </div>
          <div
            className={`gestion-card-valor ${
              g.cumplimiento >= 90 ? 'ok' : g.cumplimiento >= 80 ? 'medio' : 'bajo'
            }`}
          >
            {fmt.pct(g.cumplimiento)}
          </div>
          <div className="gestion-card-detalle">del corte obligatorio cumplido</div>
          <div className="gestion-card-deficit">
            Déficit: <strong>{fmt.int(g.deficit)}</strong> ton en {g.meses} meses
          </div>
          <div className="gestion-barra">
            <div
              className={`gestion-barra-fill ${
                g.cumplimiento >= 90 ? 'ok' : g.cumplimiento >= 80 ? 'medio' : 'bajo'
              }`}
              style={{ width: `${Math.min(100, g.cumplimiento)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
