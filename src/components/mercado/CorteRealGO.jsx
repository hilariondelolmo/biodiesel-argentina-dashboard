import { useState } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import corte from '../../data/corte.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import '../charts/Chart.css';
import { useChartColors } from '../../lib/theme.jsx';

/** Mercado de gas oil y biodiesel al corte, en volumen (m3), con % real. */
export default function CorteRealGO() {
  const C = useChartColors();
  const [vista, setVista] = useState('anual');
  const anual = vista === 'anual';

  const serie = anual
    ? corte.anual.filter((r) => r.anio >= 2010).map((r) => {
        const meses = corte.mensual.filter((m) => m.fecha.startsWith(String(r.anio)));
        return {
          x: String(r.anio),
          Gas_oil: Math.round(meses.reduce((s, m) => s + m.go_m3, 0)),
          Biodiesel: Math.round(meses.reduce((s, m) => s + m.bio_m3, 0)),
          real: r.real * 100,
        };
      })
    : corte.mensual.slice(-72).map((m) => ({
        x: m.fecha,
        Gas_oil: Math.round(m.go_m3),
        Biodiesel: Math.round(m.bio_m3),
        real: m.real * 100,
      }));

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Gas oil vs. biodiesel al corte</span>
          <span className="chart-card-subtitle">
            m³ · GO grados 2 y 3 sin destinos exentos · línea: % de corte real
          </span>
        </div>
        <div className="chart-range-selector">
          <button className={anual ? 'active' : ''} onClick={() => setVista('anual')}>Anual</button>
          <button className={!anual ? 'active' : ''} onClick={() => setVista('mensual')}>Mensual</button>
        </div>
      </div>
      <div className="chart-card-body">
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={serie} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="x" tick={{ fill: C.tick, fontSize: 11 }} stroke={C.axis}
              tickFormatter={anual ? undefined : (v) => fmt.monthShort(v)} minTickGap={30}
            />
            <YAxis
              yAxisId="m3" tick={{ fill: C.tick, fontSize: 11 }}
              tickFormatter={(v) => fmt.compact(v)} stroke={C.axis}
            />
            <YAxis
              yAxisId="pct" orientation="right" tick={{ fill: C.tick, fontSize: 11 }}
              tickFormatter={(v) => fmt.pct(v, 0)} stroke={C.axis} domain={[0, 12]}
            />
            <Tooltip
              content={<ChartTooltip unit="m³" />} cursor={{ stroke: C.axis }}
              labelFormatter={anual ? undefined : (l) => fmt.monthShort(l)}
            />
            <Area yAxisId="m3" dataKey="Gas_oil" name="Gas oil G2+G3"
              stroke={C.oil} fill={C.oilFill} />
            <Area yAxisId="m3" dataKey="Biodiesel" name="Biodiesel al corte"
              stroke={C.bio} fill={C.bioFillFuerte} />
            <Line yAxisId="pct" dataKey="real" name="Corte real" unit="%"
              stroke={C.ink} strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.oil }} />
            <span>Ventas de gas oil (m³, sin bunker ni usinas)</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.bio }} />
            <span>Biodiesel vendido al corte (m³)</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: C.ink }} />
            <span>% de corte real (eje derecho)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
