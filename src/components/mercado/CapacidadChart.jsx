import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import capacidad from '../../data/capacidad.json';
import mercado from '../../data/mercado.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import '../charts/Chart.css';

/** Capacidad instalada activa por año vs producción efectiva → utilización. */
export default function CapacidadChart() {
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
            <CartesianGrid stroke="#1E2832" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="anio" tick={{ fill: '#6B7680', fontSize: 11 }} stroke="#2A3340" />
            <YAxis
              yAxisId="ton" tick={{ fill: '#6B7680', fontSize: 11 }}
              tickFormatter={(v) => fmt.compact(v)} stroke="#2A3340"
            />
            <YAxis
              yAxisId="pct" orientation="right" tick={{ fill: '#6B7680', fontSize: 11 }}
              tickFormatter={(v) => fmt.pct(v, 0)} stroke="#2A3340" domain={[0, 100]}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar yAxisId="ton" dataKey="Capacidad" name="Capacidad instalada" fill="#2F5668" />
            <Bar yAxisId="ton" dataKey="Produccion" name="Producción" fill="#7FB069" />
            <Line yAxisId="pct" dataKey="utilizacion" name="Utilización" unit="%"
              stroke="#E8ECF0" strokeWidth={1.5} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#2F5668' }} />
            <span>Capacidad instalada (ton/año)</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#7FB069' }} />
            <span>Producción efectiva</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#E8ECF0' }} />
            <span>Utilización (eje derecho)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
