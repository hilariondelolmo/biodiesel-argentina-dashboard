import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import data from '../../data/dashboard.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from './ChartTooltip.jsx';
import './Chart.css';
import { useChartColors } from '../../lib/theme.jsx';

const colorByCategoria = (C, cat) => {
  if (cat === 'INTEGRADA') return C.oil;
  if (cat === 'NO INTEGRADA') return C.bio;
  return C.neutral;
};

export default function GruposChart() {
  const C = useChartColors();
  const grupos = data.grupos_12m.slice(0, 12).map((g) => ({
    nombre: fmt.truncate(g['GRUPO ECONÓMICO'], 30),
    Producción: Math.round(g['PRODUCTION [ton]']),
    CATEGORIA: g.CATEGORIA,
  })).reverse();

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Grupos económicos</span>
          <span className="chart-card-subtitle">producción consolidada · últimos 12 meses</span>
        </div>
      </div>
      <div className="chart-card-body">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={grupos}
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
              width={200}
              stroke={C.axis}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: C.cursor }} />
            <Bar dataKey="Producción" name="Producción">
              {grupos.map((entry, i) => (
                <Cell key={i} fill={colorByCategoria(C, entry.CATEGORIA)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
