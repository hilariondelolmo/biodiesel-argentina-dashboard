import { useState } from 'react';
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceArea, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import corte from '../../data/corte.json';
import { fmt } from '../../lib/format.js';
import { bandas } from '../../lib/gestiones.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import '../charts/Chart.css';

/**
 * Corte obligatorio vs. corte real, con área de déficit sombreada y
 * bandas por gestión presidencial. Vista anual o mensual.
 */
export default function CorteRealChart() {
  const [vista, setVista] = useState('anual');
  const [conGestiones, setConGestiones] = useState(true);

  const anual = vista === 'anual';
  const serie = (anual ? corte.anual : corte.mensual)
    .filter((r) => (anual ? r.anio >= 2010 : r.fecha >= '2010-01'))
    .map((r) => {
      const real = r.real * 100;
      const oblig = r.obligatorio === null ? null : r.obligatorio * 100;
      return {
        x: anual ? String(r.anio) : r.fecha,
        real,
        oblig,
        deficit: oblig !== null && oblig > real ? oblig - real : 0,
      };
    });

  const fechas = serie.map((r) => r.x);
  const zonas = anual
    ? bandas(fechas.map((y) => `${y}-06`)).map((b) => ({
        ...b, x1: b.x1.slice(0, 4), x2: b.x2.slice(0, 4),
      }))
    : bandas(fechas);

  const tickFmt = anual ? undefined : (v) => fmt.monthShort(v);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Corte obligatorio vs. corte real</span>
          <span className="chart-card-subtitle">
            % de biodiesel en el gas oil · el área sombreada es el déficit
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <div className="chart-range-selector">
            <button className={anual ? 'active' : ''} onClick={() => setVista('anual')}>
              Anual
            </button>
            <button className={!anual ? 'active' : ''} onClick={() => setVista('mensual')}>
              Mensual
            </button>
          </div>
          <div className="chart-range-selector">
            <button
              className={conGestiones ? 'active' : ''}
              onClick={() => setConGestiones((v) => !v)}
            >
              Gestiones
            </button>
          </div>
        </div>
      </div>
      <div className="chart-card-body">
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={serie} margin={{ top: 24, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1E2832" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="x"
              tick={{ fill: '#6B7680', fontSize: 11 }}
              stroke="#2A3340"
              tickFormatter={tickFmt}
              minTickGap={30}
            />
            <YAxis
              tick={{ fill: '#6B7680', fontSize: 11 }}
              tickFormatter={(v) => fmt.pct(v, 0)}
              stroke="#2A3340"
              domain={[0, 12]}
            />
            <Tooltip
              content={<ChartTooltip unit="%" />}
              labelFormatter={anual ? undefined : (l) => fmt.monthShort(l)}
              cursor={{ stroke: '#2A3340' }}
            />
            {conGestiones &&
              zonas.map((z, i) => (
                <ReferenceArea
                  key={z.presidente}
                  x1={z.x1}
                  x2={z.x2}
                  fill={i % 2 ? 'rgba(139,154,171,0.07)' : 'rgba(139,154,171,0.015)'}
                  stroke="none"
                  label={{
                    value: z.corto,
                    position: 'insideTop',
                    fill: '#6B7680',
                    fontSize: 10,
                  }}
                />
              ))}
            {conGestiones &&
              zonas.slice(1).map((z) => (
                <ReferenceLine
                  key={`l-${z.presidente}`}
                  x={z.x1}
                  stroke="#2A3340"
                  strokeDasharray="2 4"
                />
              ))}
            <Area
              dataKey="real"
              stackId="corte"
              name="Corte real"
              stroke="#7FB069"
              strokeWidth={2}
              fill="rgba(127,176,105,0.14)"
            />
            <Area
              dataKey="deficit"
              stackId="corte"
              name="Déficit"
              stroke="none"
              fill="rgba(198,123,92,0.30)"
            />
            <Line
              dataKey="oblig"
              name="Corte obligatorio"
              stroke="#4A8FA8"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#4A8FA8' }} />
            <span>Corte obligatorio (normativa vigente)</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#7FB069' }} />
            <span>Corte real (bio vendido al corte / ventas de gas oil)</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: 'rgba(198,123,92,0.5)' }} />
            <span>Déficit (obligatorio no cumplido)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
