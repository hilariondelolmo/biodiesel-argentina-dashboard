import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

export default function EmpresasChart() {
  const C = useChartColors();
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
              {top15.map((entry, i) => (
                <Cell key={i} fill={colorByCategoria(C, entry.CATEGORIA)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.oil }} />
            <span>Integrada</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.bio }} />
            <span>No integrada</span>
          </div>
        </div>
        <div className="note">
          La mayoría de las integradas (LDC, Cargill, Renova, COFCO) dirige su producción a
          exportación - por eso cumplimiento formal 0% sobre cupo interno. Patagonia Bioenergía
          es la excepción: integrada que también abastece el corte obligatorio.
        </div>
      </div>
    </div>
  );
}
