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

export default function EmpresasChart() {
  const top15 = data.top_empresas_12m.slice(0, 15).map((e) => ({
    nombre: fmt.truncate(e['EMPRESA ELABORADORA'], 30),
    Producción: Math.round(e['PRODUCTION [ton]']),
    CATEGORIA: e.CATEGORIA,
  })).reverse(); // reverse para que el más grande quede arriba

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Top 15 empresas elaboradoras</span>
          <span className="chart-card-subtitle">producción últimos 12 meses · ordenadas</span>
        </div>
      </div>
      <div className="chart-card-body">
        <ResponsiveContainer width="100%" height={480}>
          <BarChart
            data={top15}
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
              {top15.map((entry, i) => (
                <Cell key={i} fill={colorByCategoria(entry.CATEGORIA)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#D4A574' }} />
            <span>Integrada</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#7FB069' }} />
            <span>No integrada</span>
          </div>
        </div>
        <div className="note">
          La mayoría de las integradas (LDC, Cargill, Renova, COFCO) dirige su producción a
          exportación — por eso cumplimiento formal 0% sobre cupo interno. Patagonia Bioenergía
          es la excepción: integrada que también abastece el corte obligatorio.
        </div>
      </div>
    </div>
  );
}
