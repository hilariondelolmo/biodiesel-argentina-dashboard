import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import data from '../../data/dashboard.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from './ChartTooltip.jsx';
import './Chart.css';

export default function AnualChart() {
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
            <CartesianGrid stroke="#1E2832" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="AÑO" tick={{ fill: '#6B7680', fontSize: 11 }} stroke="#2A3340" />
            <YAxis
              tick={{ fill: '#6B7680', fontSize: 11 }}
              tickFormatter={(v) => fmt.compact(v)}
              stroke="#2A3340"
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="Ventas_corte" name="Ventas corte" fill="#7FB069" />
            <Bar dataKey="Exportaciones" name="Exportaciones" fill="#D4A574" />
            <Bar dataKey="Cupo_asignado" name="Cupo asignado" fill="#4A8FA8" />
          </BarChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#7FB069' }} />
            <span>Ventas al corte obligatorio</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#D4A574' }} />
            <span>Exportaciones</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#4A8FA8' }} />
            <span>Cupo asignado por Secretaría de Energía</span>
          </div>
        </div>
      </div>
    </div>
  );
}
