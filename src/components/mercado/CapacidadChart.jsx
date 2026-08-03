import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import capacidad from '../../data/capacidad.json';
import mercado from '../../data/mercado.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import '../charts/Chart.css';
import { useChartColors } from '../../lib/theme.jsx';

/** Capacidad instalada activa por año vs producción efectiva → utilización. */
export default function CapacidadChart() {
  const C = useChartColors();
  const capPorAnio = new Map();
  for (const r of capacidad.serie) {
    if (r.condicion !== 'ON') continue;
    const y = r.fecha.slice(0, 4);
    capPorAnio.set(y, (capPorAnio.get(y) || 0) + r.capacidad);
  }
  const prodPorAnio = new Map(mercado.anual.map((a) => [String(a.anio), a.prod]));

  const serie = [...capPorAnio.entries()]
    .filter(([y]) => y >= '2008')
    .sort()
    .map(([anio, cap]) => {
      const prod = prodPorAnio.get(anio);
      return {
        anio,
        Capacidad: Math.round(cap),
        Produccion: prod ? Math.round(prod) : null,
        utilizacion: prod ? (prod / cap) * 100 : null,
      };
    });

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Capacidad instalada vs. producción</span>
          <span className="chart-card-subtitle">
            plantas activas · línea: % de utilización
          </span>
        </div>
      </div>
      <div className="chart-card-body">
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={serie} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="anio" tick={{ fill: C.tick, fontSize: 11 }} stroke={C.axis} />
            <YAxis
              yAxisId="ton" tick={{ fill: C.tick, fontSize: 11 }}
              tickFormatter={(v) => fmt.compact(v)} stroke={C.axis}
            />
            <YAxis
              yAxisId="pct" orientation="right" tick={{ fill: C.tick, fontSize: 11 }}
              tickFormatter={(v) => fmt.pct(v, 0)} stroke={C.axis} domain={[0, 100]}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: C.cursor }} />
            <Bar yAxisId="ton" dataKey="Capacidad" name="Capacidad instalada" fill={C.expDim} />
            <Bar yAxisId="ton" dataKey="Produccion" name="Producción" fill={C.bio} />
            <Line yAxisId="pct" dataKey="utilizacion" name="Utilización" unit="%"
              stroke={C.ink} strokeWidth={1.5} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.expDim }} />
            <span>Capacidad instalada (ton/año)</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.bio }} />
            <span>Producción efectiva</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.ink }} />
            <span>Utilización (eje derecho)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
