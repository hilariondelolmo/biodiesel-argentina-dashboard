import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import data from '../../data/dashboard.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from './ChartTooltip.jsx';
import './Chart.css';
import { useChartColors } from '../../lib/theme.jsx';

export default function AnualChart() {
  const C = useChartColors();
  const series = data.anual.map((a) => ({
    AÑO: a.AÑO,
    Ventas_corte: a['BIODIESEL QUOTA SALES [ton]'] || 0,
    Exportaciones: a['BIODIESEL EXPORTS [ton]'] || 0,
    Cupo_asignado: a['BIODIESEL QUOTA [ton]'] || 0,
  }));

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Totales anuales</span>
          <span className="chart-card-subtitle">ventas al corte vs exportaciones vs cupo asignado</span>
        </div>
      </div>
      <div className="chart-card-body">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="AÑO" tick={{ fill: C.tick, fontSize: 11 }} stroke={C.axis} />
            <YAxis
              tick={{ fill: C.tick, fontSize: 11 }}
              tickFormatter={(v) => fmt.compact(v)}
              stroke={C.axis}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: C.cursor }} />
            <Bar dataKey="Ventas_corte" name="Ventas corte" fill={C.bio} />
            <Bar dataKey="Exportaciones" name="Exportaciones" fill={C.oil} />
            <Bar dataKey="Cupo_asignado" name="Cupo asignado" fill={C.exp} />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.bio }} />
            <span>Ventas al corte obligatorio</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.oil }} />
            <span>Exportaciones</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.exp }} />
            <span>Cupo asignado por Secretaría de Energía</span>
          </div>
        </div>
      </div>
    </div>
  );
}
