import { useState } from 'react';
import empresasData from '../../data/empresas.json';
import petroleras from '../../data/petroleras.json';
import RankingParticipacion from './RankingParticipacion.jsx';
import '../charts/Chart.css';

/**
 * Participación de mercado en los últimos 12 meses, con tres cortes:
 * provincias (producción), petroleras (compras al corte) y elaboradoras
 * (producción).
 */
export default function ParticipacionChart() {
  const [corte, setCorte] = useState('elaboradoras');

  const ultimo = empresasData.ultimo_mes;
  const [uy, um] = ultimo.split('-').map(Number);
  const desde = `${um === 12 ? uy : uy - 1}-${String((um % 12) + 1).padStart(2, '0')}`;
  const enVentana = (f) => f >= desde && f <= ultimo;

  let items = [];
  if (corte === 'provincias' || corte === 'elaboradoras') {
    const acum = new Map();
    for (const e of empresasData.empresas) {
      const clave = corte === 'provincias' ? e.provincia || 'Sin dato' : e.empresa;
      let v = 0;
      for (const [f, prod] of e.serie) if (enVentana(f)) v += prod || 0;
      if (v > 0) {
        acum.set(clave, (acum.get(clave) || 0) + v);
      }
    }
    items = [...acum.entries()].map(([nombre, valor]) => ({ nombre, valor }));
  } else {
    const acum = new Map();
    for (const row of petroleras.mensual) {
      if (!enVentana(row.fecha)) continue;
      for (const [pet, ton] of Object.entries(row)) {
        if (pet === 'fecha' || !ton) continue;
        acum.set(pet, (acum.get(pet) || 0) + ton);
      }
    }
    items = [...acum.entries()].map(([nombre, valor]) => ({ nombre, valor }));
  }

  const unidad = corte === 'petroleras' ? 'compras al corte' : 'producción';

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Participación de mercado · últimos 12 meses</span>
          <span className="chart-card-subtitle">{unidad} · toneladas y share</span>
        </div>
        <div className="chart-range-selector">
          <button className={corte === 'elaboradoras' ? 'active' : ''} onClick={() => setCorte('elaboradoras')}>
            Elaboradoras
          </button>
          <button className={corte === 'petroleras' ? 'active' : ''} onClick={() => setCorte('petroleras')}>
            Petroleras
          </button>
          <button className={corte === 'provincias' ? 'active' : ''} onClick={() => setCorte('provincias')}>
            Provincias
          </button>
        </div>
      </div>
      <div className="chart-card-body">
        <RankingParticipacion items={items} max={20} />
      </div>
    </div>
  );
}
