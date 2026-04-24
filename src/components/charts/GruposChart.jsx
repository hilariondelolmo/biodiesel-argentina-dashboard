import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import data from '../../data/dashboard.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from './ChartTooltip.jsx';
import './Chart.css';

const colorByCategoria = (cat) => {
  if (cat === 'INTEGRADA') return '#D4A574';
  if (cat === 'NO INTEGRADA') return '#7FB069';
  return '#8B9AAB';
};

export default function GruposChart() {
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
            <CartesianGrid stroke="#1E2832" strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#6B7680', fontSize: 11 }}
              tickFormatter={(v) => fmt.compact(v)}
              stroke="#2A3340"
            />
            <YAxis
              dataKey="nombre"
              type="category"
              tick={{ fill: '#B8C2CC', fontSize: 11 }}
              width={200}
              stroke="#2A3340"
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="Producción" name="Producción">
              {grupos.map((entry, i) => (
                <Cell key={i} fill={colorByCategoria(entry.CATEGORIA)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
