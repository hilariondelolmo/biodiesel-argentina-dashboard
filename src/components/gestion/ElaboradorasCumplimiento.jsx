import { useState } from 'react';
import empresasData from '../../data/empresas.json';
import RankingCumplimiento from './RankingCumplimiento.jsx';
import { fmt } from '../../lib/format.js';
import '../charts/Chart.css';
import { useChartColors } from '../../lib/theme.jsx';

/**
 * Cumplimiento de cupo por elaboradora / grupo económico (últimos 12 meses).
 * serie: [fecha, prod, cupo, ventas_corte, xquota, exportaciones]
 */
export default function ElaboradorasCumplimiento() {
  const C = useChartColors();
  const [agrupar, setAgrupar] = useState('empresa');

  const ultimo = empresasData.ultimo_mes;
  const [uy, um] = ultimo.split('-').map(Number);
  const desde = `${um === 12 ? uy : uy - 1}-${String((um % 12) + 1).padStart(2, '0')}`;

  const acumulado = new Map();
  for (const e of empresasData.empresas) {
    const clave = agrupar === 'empresa' ? e.empresa : e.grupo || e.empresa;
    const cur = acumulado.get(clave) || { cupo: 0, vc: 0 };
    for (const [f, , cupo, vc] of e.serie) {
      if (f >= desde && f <= ultimo) {
        cur.cupo += cupo || 0;
        cur.vc += vc || 0;
      }
    }
    acumulado.set(clave, cur);
  }

  const items = [...acumulado.entries()]
    .filter(([, v]) => v.cupo > 0)
    .map(([nombre, v]) => ({
      nombre,
      valor: (v.vc / v.cupo) * 100,
      detalle: `${fmt.int(v.vc)} / ${fmt.int(v.cupo)} ton`,
    }))
    .sort((a, b) => b.valor - a.valor);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Cumplimiento de cupo · últimos 12 meses</span>
          <span className="chart-card-subtitle">
            ventas al corte / cupo asignado · {fmt.monthShort(desde)} → {fmt.monthShort(ultimo)} ·
            línea vertical = 100%
          </span>
        </div>
        <div className="chart-range-selector">
          <button className={agrupar === 'empresa' ? 'active' : ''} onClick={() => setAgrupar('empresa')}>
            Por empresa
          </button>
          <button className={agrupar === 'grupo' ? 'active' : ''} onClick={() => setAgrupar('grupo')}>
            Por grupo económico
          </button>
        </div>
      </div>
      <div className="chart-card-body">
        <RankingCumplimiento items={items} />
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.bio }} />
            <span>≥ 95%</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.warn }} />
            <span>80–95%</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.alert }} />
            <span>&lt; 80%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
