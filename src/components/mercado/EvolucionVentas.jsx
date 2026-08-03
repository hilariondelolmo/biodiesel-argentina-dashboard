import { useState } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import mercado from '../../data/mercado.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import '../charts/Chart.css';
import { useChartColors } from '../../lib/theme.jsx';

/** Evolución de ventas por destino, apilada, con cupo como referencia. */
export default function EvolucionVentas() {
  const C = useChartColors();
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
            <XAxis
              dataKey="x" tick={{ fill: C.tick, fontSize: 11 }} stroke={C.axis}
              tickFormatter={anual ? undefined : (v) => fmt.monthShort(v)} minTickGap={30}
            />
            <YAxis
              tick={{ fill: C.tick, fontSize: 11 }}
              tickFormatter={(v) => fmt.compact(v)} stroke={C.axis}
            />
            <Tooltip
              content={<ChartTooltip />} cursor={{ stroke: C.axis }}
              labelFormatter={anual ? undefined : (l) => fmt.monthShort(l)}
            />
            <Area dataKey="Ventas_corte" name="Ventas al corte" stackId="v"
              stroke={C.bio} fill={C.bioFillFuerte} />
            <Area dataKey="Fuera_de_corte" name="Fuera de corte" stackId="v"
              stroke={C.neutral} fill={C.neutralFill} />
            <Area dataKey="Exportaciones" name="Exportaciones" stackId="v"
              stroke={C.oil} fill={C.oilFillFuerte} />
            <Line dataKey="Cupo" name="Cupo asignado" stroke={C.exp}
              strokeWidth={1.8} strokeDasharray="5 3" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.bio }} />
            <span>Ventas al corte obligatorio</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.neutral }} />
            <span>Mercado interno fuera de corte</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.oil }} />
            <span>Exportaciones</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.exp }} />
            <span>Cupo asignado (línea)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
