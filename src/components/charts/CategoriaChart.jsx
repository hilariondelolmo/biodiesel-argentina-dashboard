import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import data from '../../data/dashboard.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from './ChartTooltip.jsx';
import './Chart.css';
import { useChartColors } from '../../lib/theme.jsx';

export default function CategoriaChart() {
  const C = useChartColors();
  const series = data.categoria_anual.map((a) => ({
    AÑO: a.AÑO,
    Integradas: a.INTEGRADA || 0,
    No_integradas: a['NO INTEGRADA'] || 0,
    Comercializadoras: a.COMERCIALIZADORA || 0,
  }));

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Producción por categoría</span>
          <span className="chart-card-subtitle">integradas vs no integradas - participación anual</span>
        </div>
      </div>
      <div className="chart-card-body">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="AÑO" tick={{ fill: C.tick, fontSize: 11 }} stroke={C.axis} />
            <YAxis
              tick={{ fill: C.tick, fontSize: 11 }}
              tickFormatter={(v) => fmt.compact(v)}
              stroke={C.axis}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: C.cursor }} />
            <Bar dataKey="Integradas" stackId="a" name="Integradas" fill={C.oil} />
            <Bar dataKey="No_integradas" stackId="a" name="No integradas" fill={C.bio} />
            <Bar dataKey="Comercializadoras" stackId="a" name="Comercializadoras" fill={C.neutral} />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.oil }} />
            <span>Integradas (10 empresas, incluye Patagonia Bioenergía)</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.bio }} />
            <span>No integradas (36 empresas · cupo interno)</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.neutral }} />
            <span>Comercializadoras (6)</span>
          </div>
        </div>
        <div className="note">
          Con Patagonia Bioenergía reclasificada como integrada, 2023 sigue siendo el primer año
          donde las no integradas superan a las integradas en producción (523.664 t vs 279.795 t).
          El desbalance refleja la menor pérdida relativa del segmento no integrado frente al
          cierre parcial de los mercados externos.
        </div>
      </div>
    </div>
  );
}
