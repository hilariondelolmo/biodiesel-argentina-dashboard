import { useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import mercado from '../../data/mercado.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import '../charts/Chart.css';

/** Cupo asignado vs. ventas al corte del sistema completo. */
export default function CupoUso() {
  const [vista, setVista] = useState('anual');
  const anual = vista === 'anual';

  const serie = (anual ? mercado.anual : mercado.mensual.slice(-72))
    .filter((r) => (r.cupo || 0) > 0)
    .map((r) => ({
      x: anual ? String(r.anio) : r.fecha,
      Cupo: Math.round(r.cupo),
      Ventas_corte: Math.round(r.vc),
      cumplimiento: (r.vc / r.cupo) * 100,
    }));

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Cupo asignado vs. ventas al corte</span>
          <span className="chart-card-subtitle">sistema completo · línea: % de cumplimiento</span>
        </div>
        <div className="chart-range-selector">
          <button className={anual ? 'active' : ''} onClick={() => setVista('anual')}>Anual</button>
          <button className={!anual ? 'active' : ''} onClick={() => setVista('mensual')}>Mensual</button>
        </div>
      </div>
      <div className="chart-card-body">
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={serie} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1E2832" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="x" tick={{ fill: '#6B7680', fontSize: 11 }} stroke="#2A3340"
              tickFormatter={anual ? undefined : (v) => fmt.monthShort(v)} minTickGap={30}
            />
            <YAxis
              yAxisId="ton" tick={{ fill: '#6B7680', fontSize: 11 }}
              tickFormatter={(v) => fmt.compact(v)} stroke="#2A3340"
            />
            <YAxis
              yAxisId="pct" orientation="right" tick={{ fill: '#6B7680', fontSize: 11 }}
              tickFormatter={(v) => fmt.pct(v, 0)} stroke="#2A3340"
            />
            <Tooltip
              content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              labelFormatter={anual ? undefined : (l) => fmt.monthShort(l)}
            />
            <Bar yAxisId="ton" dataKey="Cupo" name="Cupo asignado" fill="#4A8FA8" />
            <Bar yAxisId="ton" dataKey="Ventas_corte" name="Ventas al corte" fill="#7FB069" />
            <Line yAxisId="pct" dataKey="cumplimiento" name="Cumplimiento" unit="%"
              stroke="#E8ECF0" strokeWidth={1.5} dot={anual ? { r: 2 } : false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#4A8FA8' }} />
            <span>Cupo asignado por la Secretaría de Energía</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#7FB069' }} />
            <span>Ventas al corte efectivas</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#E8ECF0' }} />
            <span>Cumplimiento (eje derecho)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
