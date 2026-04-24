import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import data from '../../data/dashboard.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from './ChartTooltip.jsx';
import './Chart.css';

export default function ProvinciaChart() {
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
              width={130}
              stroke="#2A3340"
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="Producción" name="Producción" fill="#4A8FA8" />
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
