import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import data from '../../data/dashboard.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from './ChartTooltip.jsx';
import './Chart.css';
import { useChartColors } from '../../lib/theme.jsx';

export default function ProvinciaChart() {
  const C = useChartColors();
  const prov = data.provincia_12m.map((p) => ({
    nombre: p.PROVINCIA,
    Producción: Math.round(p['PRODUCTION [ton]']),
  })).reverse();

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Distribución provincial</span>
          <span className="chart-card-subtitle">dónde está la capacidad instalada</span>
        </div>
      </div>
      <div className="chart-card-body">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={prov}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid stroke={C.grid} strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: C.tick, fontSize: 11 }}
              tickFormatter={(v) => fmt.compact(v)}
              stroke={C.axis}
            />
            <YAxis
              dataKey="nombre"
              type="category"
              tick={{ fill: C.tick, fontSize: 11 }}
              width={130}
              stroke={C.axis}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: C.cursor }} />
            <Bar dataKey="Producción" name="Producción" fill={C.exp} />
          </BarChart>
        </ResponsiveContainer>
        <div className="note">
          Santa Fe concentra aproximadamente el 60% de la producción nacional por su posición
          estratégica sobre la hidrovía Paraná y cercanía a la producción primaria de soja.
        </div>
      </div>
    </div>
  );
}
