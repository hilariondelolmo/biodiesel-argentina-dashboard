import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import data from '../../data/dashboard.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from './ChartTooltip.jsx';
import './Chart.css';

export default function CategoriaChart() {
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
          <span className="chart-card-subtitle">integradas vs no integradas — participación anual</span>
        </div>
      </div>
      <div className="chart-card-body">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1E2832" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="AÑO" tick={{ fill: '#6B7680', fontSize: 11 }} stroke="#2A3340" />
            <YAxis
              tick={{ fill: '#6B7680', fontSize: 11 }}
              tickFormatter={(v) => fmt.compact(v)}
              stroke="#2A3340"
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="Integradas" stackId="a" name="Integradas" fill="#D4A574" />
            <Bar dataKey="No_integradas" stackId="a" name="No integradas" fill="#7FB069" />
            <Bar dataKey="Comercializadoras" stackId="a" name="Comercializadoras" fill="#8B9AAB" />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#D4A574' }} />
            <span>Integradas (10 empresas, incluye Patagonia Bioenergía)</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#7FB069' }} />
            <span>No integradas (36 empresas · cupo interno)</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#8B9AAB' }} />
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
