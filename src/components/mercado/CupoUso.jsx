import { useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import mercado from '../../data/mercado.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import '../charts/Chart.css';
import { useChartColors } from '../../lib/theme.jsx';

/** Cupo asignado vs. ventas al corte del sistema completo. */
export default function CupoUso() {
  const C = useChartColors();
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
            <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="x" tick={{ fill: C.tick, fontSize: 11 }} stroke={C.axis}
              tickFormatter={anual ? undefined : (v) => fmt.monthShort(v)} minTickGap={30}
            />
            <YAxis
              yAxisId="ton" tick={{ fill: C.tick, fontSize: 11 }}
              tickFormatter={(v) => fmt.compact(v)} stroke={C.axis}
            />
            <YAxis
              yAxisId="pct" orientation="right" tick={{ fill: C.tick, fontSize: 11 }}
              tickFormatter={(v) => fmt.pct(v, 0)} stroke={C.axis}
            />
            <Tooltip
              content={<ChartTooltip />} cursor={{ fill: C.cursor }}
              labelFormatter={anual ? undefined : (l) => fmt.monthShort(l)}
            />
            <Bar yAxisId="ton" dataKey="Cupo" name="Cupo asignado" fill={C.exp} />
            <Bar yAxisId="ton" dataKey="Ventas_corte" name="Ventas al corte" fill={C.bio} />
            <Line yAxisId="pct" dataKey="cumplimiento" name="Cumplimiento" unit="%"
              stroke={C.ink} strokeWidth={1.5} dot={anual ? { r: 2 } : false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.exp }} />
            <span>Cupo asignado por la Secretaría de Energía</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.bio }} />
            <span>Ventas al corte efectivas</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.ink }} />
            <span>Cumplimiento (eje derecho)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
