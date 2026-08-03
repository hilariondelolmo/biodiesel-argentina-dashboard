import { useState } from 'react';
import empresasData from '../../data/empresas.json';
import RankingParticipacion from './RankingParticipacion.jsx';
import '../charts/Chart.css';

/**
 * Grupos económicos: producción de los últimos 12 meses agrupada por holding,
 * separable por categoría (las integradas son la industria aceitera).
 */
export default function GruposAceiteras() {
  const [filtro, setFiltro] = useState('todas');

  const ultimo = empresasData.ultimo_mes;
  const [uy, um] = ultimo.split('-').map(Number);
  const desde = `${um === 12 ? uy : uy - 1}-${String((um % 12) + 1).padStart(2, '0')}`;

  const acum = new Map();
  for (const e of empresasData.empresas) {
    if (filtro === 'integradas' && e.categoria !== 'INTEGRADA') continue;
    if (filtro === 'no-integradas' && e.categoria !== 'NO INTEGRADA') continue;
    let v = 0;
    for (const [f, prod] of e.serie) if (f >= desde && f <= ultimo) v += prod || 0;
    if (v <= 0) continue;
    const clave = e.grupo || e.empresa;
    acum.set(clave, (acum.get(clave) || 0) + v);
  }
  const items = [...acum.entries()].map(([nombre, valor]) => ({ nombre, valor }));

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Producción por grupo económico · últimos 12 meses</span>
          <span className="chart-card-subtitle">
            los grupos integrados son la industria aceitera dentro del biodiesel
          </span>
        </div>
        <div className="chart-range-selector">
          <button className={filtro === 'todas' ? 'active' : ''} onClick={() => setFiltro('todas')}>
            Todos
          </button>
          <button className={filtro === 'integradas' ? 'active' : ''} onClick={() => setFiltro('integradas')}>
            Integradas
          </button>
          <button className={filtro === 'no-integradas' ? 'active' : ''} onClick={() => setFiltro('no-integradas')}>
            No integradas
          </button>
        </div>
      </div>
      <div className="chart-card-body">
        <RankingParticipacion items={items} max={15} />
      </div>
    </div>
  );
}
