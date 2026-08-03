import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import mercado from '../../data/mercado.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import '../charts/Chart.css';

const COLORES = {
  'NO INTEGRADA': '#7FB069',
  INTEGRADA: '#D4A574',
  COMERCIALIZADORA: '#8B9AAB',
};

/** Ventas al corte por categoría de empresa: absoluto o participación %. */
export default function CategoriasComparadas() {
  const [vista, setVista] = useState('anual');
  const [modo, setModo] = useState('abs');
  const anual = vista === 'anual';

  const fuente = anual ? mercado.anual_categoria : mercado.mensual_categoria.slice(-72 * 3);
  const porX = new Map();
  for (const r of fuente) {
    const x = anual ? String(r.anio) : r.fecha;
    const cur = porX.get(x) || { x };
    cur[r.categoria] = r.vc;
    porX.set(x, cur);
  }
  let serie = [...porX.values()];
  if (modo === 'pct') {
    serie = serie.map((r) => {
      const tot = (r['NO INTEGRADA'] || 0) + (r.INTEGRADA || 0) + (r.COMERCIALIZADORA || 0);
      return tot > 0
        ? {
            x: r.x,
            'NO INTEGRADA': ((r['NO INTEGRADA'] || 0) / tot) * 100,
            INTEGRADA: ((r.INTEGRADA || 0) / tot) * 100,
            COMERCIALIZADORA: ((r.COMERCIALIZADORA || 0) / tot) * 100,
          }
        : { x: r.x };
    });
  }

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Ventas al corte por categoría</span>
          <span className="chart-card-subtitle">
            {modo === 'abs' ? 'toneladas' : 'participación %'} · la clasificación es histórica: una
            empresa puede cambiar de categoría
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <div className="chart-range-selector">
            <button className={anual ? 'active' : ''} onClick={() => setVista('anual')}>Anual</button>
            <button className={!anual ? 'active' : ''} onClick={() => setVista('mensual')}>Mensual</button>
          </div>
          <div className="chart-range-selector">
            <button className={modo === 'abs' ? 'active' : ''} onClick={() => setModo('abs')}>ton</button>
            <button className={modo === 'pct' ? 'active' : ''} onClick={() => setModo('pct')}>%</button>
          </div>
        </div>
      </div>
      <div className="chart-card-body">
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={serie} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1E2832" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="x" tick={{ fill: '#6B7680', fontSize: 11 }} stroke="#2A3340"
              tickFormatter={anual ? undefined : (v) => fmt.monthShort(v)} minTickGap={30}
            />
            <YAxis
              tick={{ fill: '#6B7680', fontSize: 11 }} stroke="#2A3340"
              tickFormatter={modo === 'pct' ? (v) => fmt.pct(v, 0) : (v) => fmt.compact(v)}
              domain={modo === 'pct' ? [0, 100] : undefined}
            />
            <Tooltip
              content={<ChartTooltip unit={modo === 'pct' ? '%' : 'ton'} />}
              labelFormatter={anual ? undefined : (l) => fmt.monthShort(l)}
              cursor={{ stroke: '#2A3340' }}
            />
            {Object.entries(COLORES).map(([cat, color]) => (
              <Area key={cat} dataKey={cat} stackId="c" name={cat.toLowerCase()}
                stroke={color} fill={color} fillOpacity={0.5} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          {Object.entries(COLORES).map(([cat, color]) => (
            <div key={cat} className="chart-legend-item">
              <span className="chart-legend-swatch" style={{ background: color }} />
              <span>{cat.charAt(0) + cat.slice(1).toLowerCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
