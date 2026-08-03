import { useState } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import mercado from '../../data/mercado.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import '../charts/Chart.css';

/** Evolución de ventas por destino, apilada, con cupo como referencia. */
export default function EvolucionVentas() {
  const [vista, setVista] = useState('anual');
  const anual = vista === 'anual';

  const serie = (anual ? mercado.anual : mercado.mensual.slice(-72)).map((r) => ({
    x: anual ? String(r.anio) : r.fecha,
    Ventas_corte: r.vc,
    Fuera_de_corte: r.xq,
    Exportaciones: r.exp,
    Cupo: r.cupo || null,
  }));

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Ventas por destino</span>
          <span className="chart-card-subtitle">
            apilado · {anual ? 'anual desde 2008' : 'mensual · últimos 6 años'} · línea: cupo asignado
          </span>
        </div>
        <div className="chart-range-selector">
          <button className={anual ? 'active' : ''} onClick={() => setVista('anual')}>Anual</button>
          <button className={!anual ? 'active' : ''} onClick={() => setVista('mensual')}>Mensual</button>
        </div>
      </div>
      <div className="chart-card-body">
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={serie} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1E2832" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="x" tick={{ fill: '#6B7680', fontSize: 11 }} stroke="#2A3340"
              tickFormatter={anual ? undefined : (v) => fmt.monthShort(v)} minTickGap={30}
            />
            <YAxis
              tick={{ fill: '#6B7680', fontSize: 11 }}
              tickFormatter={(v) => fmt.compact(v)} stroke="#2A3340"
            />
            <Tooltip
              content={<ChartTooltip />} cursor={{ stroke: '#2A3340' }}
              labelFormatter={anual ? undefined : (l) => fmt.monthShort(l)}
            />
            <Area dataKey="Ventas_corte" name="Ventas al corte" stackId="v"
              stroke="#7FB069" fill="rgba(127,176,105,0.55)" />
            <Area dataKey="Fuera_de_corte" name="Fuera de corte" stackId="v"
              stroke="#8B9AAB" fill="rgba(139,154,171,0.45)" />
            <Area dataKey="Exportaciones" name="Exportaciones" stackId="v"
              stroke="#D4A574" fill="rgba(212,165,116,0.5)" />
            <Line dataKey="Cupo" name="Cupo asignado" stroke="#4A8FA8"
              strokeWidth={1.8} strokeDasharray="5 3" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#7FB069' }} />
            <span>Ventas al corte obligatorio</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#8B9AAB' }} />
            <span>Mercado interno fuera de corte</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#D4A574' }} />
            <span>Exportaciones</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#4A8FA8' }} />
            <span>Cupo asignado (línea)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
