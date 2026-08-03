import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import data from '../../data/dashboard.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from './ChartTooltip.jsx';
import './Chart.css';
import { useChartColors } from '../../lib/theme.jsx';

const RANGES = [
  { id: '12m', label: '12m', months: 12 },
  { id: '5y', label: '5 años', months: 60 },
  { id: '10y', label: '10 años', months: 120 },
  { id: 'all', label: 'Todo', months: null },
];

export default function MonthlyChart() {
  const C = useChartColors();
  const [range, setRange] = useState('5y');

  const series = useMemo(() => {
    const rangeDef = RANGES.find((r) => r.id === range);
    const slice = rangeDef.months ? data.mensual.slice(-rangeDef.months) : data.mensual;
    return slice.map((m) => ({
      FECHA: m.FECHA,
      Ventas_corte: m['BIODIESEL QUOTA SALES [ton]'] || 0,
      Ventas_fuera_corte: m['BIODIESEL XQUOTA SALES [ton]'] || 0,
      Exportaciones: m['BIODIESEL EXPORTS [ton]'] || 0,
    }));
  }, [range]);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Serie mensual total país</span>
          <span className="chart-card-subtitle">producción desagregada por destino · 2008 → 2026</span>
        </div>
        <div className="chart-range-selector">
          {RANGES.map((r) => (
            <button
              key={r.id}
              className={range === r.id ? 'active' : ''}
              onClick={() => setRange(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-card-body">
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCorte" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.bio} stopOpacity={0.7} />
                <stop offset="100%" stopColor={C.bio} stopOpacity={0.15} />
              </linearGradient>
              <linearGradient id="gradFuera" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.exp} stopOpacity={0.7} />
                <stop offset="100%" stopColor={C.exp} stopOpacity={0.15} />
              </linearGradient>
              <linearGradient id="gradExport" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.oil} stopOpacity={0.7} />
                <stop offset="100%" stopColor={C.oil} stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="FECHA"
              tick={{ fill: C.tick, fontSize: 11 }}
              tickFormatter={(v) => (v ? v.split('-')[0] : '')}
              interval={series.length > 60 ? 23 : 11}
              stroke={C.axis}
            />
            <YAxis
              tick={{ fill: C.tick, fontSize: 11 }}
              tickFormatter={(v) => fmt.compact(v)}
              stroke={C.axis}
            />
            <Tooltip content={<ChartTooltip labelFormatter={fmt.monthShort} />} />
            <Area
              type="monotone"
              dataKey="Ventas_corte"
              stackId="1"
              stroke={C.bio}
              strokeWidth={1.5}
              fill="url(#gradCorte)"
              name="Ventas al corte"
            />
            <Area
              type="monotone"
              dataKey="Ventas_fuera_corte"
              stackId="1"
              stroke={C.exp}
              strokeWidth={1.5}
              fill="url(#gradFuera)"
              name="Ventas fuera de corte"
            />
            <Area
              type="monotone"
              dataKey="Exportaciones"
              stackId="1"
              stroke={C.oil}
              strokeWidth={1.5}
              fill="url(#gradExport)"
              name="Exportaciones"
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.bio }} />
            <span>Ventas al corte obligatorio</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.exp }} />
            <span>Ventas fuera de corte</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.oil }} />
            <span>Exportaciones</span>
          </div>
        </div>
        <div className="note">
          El gráfico muestra el destino real de la producción argentina mes a mes. El pico histórico
          de 2,87 millones de toneladas (2017) correspondía mayormente a exportaciones; desde 2018
          el segmento externo se contrae por antidumping de EE.UU. y UE, y el cupo interno queda
          como único canal estable.
        </div>
      </div>
    </div>
  );
}
