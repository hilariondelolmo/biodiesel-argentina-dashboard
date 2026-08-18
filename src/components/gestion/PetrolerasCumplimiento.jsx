import { useState } from 'react';
import petroleras from '../../data/petroleras.json';
import corte from '../../data/corte.json';
import RankingCumplimiento from './RankingCumplimiento.jsx';
import { fmt } from '../../lib/format.js';
import '../charts/Chart.css';

const DENSIDAD = corte.densidad_bio;

// Ventanas elegibles (meses hacia atrás; 0 = serie completa)
const VENTANAS = [['1m', 1], ['6m', 6], ['1a', 12], ['5a', 60], ['10a', 120], ['Todo', 0]];

/**
 * Cumplimiento del corte por petrolera en la ventana elegida (default 1 año):
 * bio recibido de elaboradoras (m3) / (GO G2+G3 vendido × % corte obligatorio).
 */
export default function PetrolerasCumplimiento() {
  const [meses, setMeses] = useState(12);
  const oblig = new Map(corte.mensual.map((m) => [m.fecha, m.obligatorio]));
  const goMeses = petroleras.go_mensual.filter((r) => oblig.get(r.fecha) != null);
  const ventana = meses ? goMeses.slice(-meses) : goMeses;
  const fechas = new Set(ventana.map((r) => r.fecha));

  const requerido = new Map(); // petrolera → bio m3 requerido
  for (const row of ventana) {
    for (const [pet, go] of Object.entries(row)) {
      if (pet === 'fecha') continue;
      requerido.set(pet, (requerido.get(pet) || 0) + go * oblig.get(row.fecha));
    }
  }

  const recibido = new Map(); // petrolera → bio m3 comprado
  for (const row of petroleras.mensual) {
    if (!fechas.has(row.fecha)) continue;
    for (const [pet, ton] of Object.entries(row)) {
      if (pet === 'fecha' || !ton) continue;
      recibido.set(pet, (recibido.get(pet) || 0) + ton / DENSIDAD);
    }
  }

  // Solo petroleras con cupo asignado en la ventana: las revendedoras compran
  // gas oil ya cortado y no tienen obligación propia de mezcla.
  const conCupo = new Set(
    petroleras.cumplimiento
      .filter((r) => fechas.has(r.fecha) && (r.cupo || 0) > 0)
      .map((r) => r.petrolera)
  );

  const goTotal = [...requerido.values()].reduce((a, b) => a + b, 0);
  const items = [...requerido.entries()]
    .filter(([pet, req]) => req > 1000 && conCupo.has(pet))
    .map(([pet, req]) => ({
      nombre: pet,
      valor: ((recibido.get(pet) || 0) / req) * 100,
      detalle: `share del GO requerido: ${fmt.pct((req / goTotal) * 100)}`,
    }))
    .sort((a, b) => b.valor - a.valor);

  const desde = ventana[0]?.fecha;
  const hasta = ventana.at(-1)?.fecha;

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Cumplimiento del corte por petrolera</span>
          <span className="chart-card-subtitle">
            bio comprado / bio requerido por sus ventas de gas oil ·{' '}
            {desde === hasta
              ? fmt.monthShort(desde)
              : `${fmt.monthShort(desde)} → ${fmt.monthShort(hasta)}`}
          </span>
        </div>
        <div className="chart-range-selector" style={{ marginLeft: 'auto' }}>
          {VENTANAS.map(([rotulo, m]) => (
            <button
              key={rotulo}
              className={meses === m ? 'active' : ''}
              onClick={() => setMeses(m)}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-card-body">
        <RankingCumplimiento items={items} />
        <p className="note">
          El requerido surge de las ventas de GO Grado 2 y 3 de cada petrolera (excluidos
          bunker y usinas) multiplicadas por el corte obligatorio vigente cada mes. Fuente:
          Secretaría de Energía, ventas de derivados y detalle de biodiesel.
        </p>
      </div>
    </div>
  );
}
