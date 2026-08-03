import { useState } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import corte from '../../data/corte.json';
import { fmt } from '../../lib/format.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import '../charts/Chart.css';

/** Mercado de gas oil y biodiesel al corte, en volumen (m3), con % real. */
export default function CorteRealGO() {
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
            <CartesianGrid stroke="#1E2832" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="x" tick={{ fill: '#6B7680', fontSize: 11 }} stroke="#2A3340"
              tickFormatter={anual ? undefined : (v) => fmt.monthShort(v)} minTickGap={30}
            />
            <YAxis
              yAxisId="m3" tick={{ fill: '#6B7680', fontSize: 11 }}
              tickFormatter={(v) => fmt.compact(v)} stroke="#2A3340"
            />
            <YAxis
              yAxisId="pct" orientation="right" tick={{ fill: '#6B7680', fontSize: 11 }}
              tickFormatter={(v) => fmt.pct(v, 0)} stroke="#2A3340" domain={[0, 12]}
            />
            <Tooltip
              content={<ChartTooltip unit="m³" />} cursor={{ stroke: '#2A3340' }}
              labelFormatter={anual ? undefined : (l) => fmt.monthShort(l)}
            />
            <Area yAxisId="m3" dataKey="Gas_oil" name="Gas oil G2+G3"
              stroke="#D4A574" fill="rgba(212,165,116,0.25)" />
            <Area yAxisId="m3" dataKey="Biodiesel" name="Biodiesel al corte"
              stroke="#7FB069" fill="rgba(127,176,105,0.45)" />
            <Line yAxisId="pct" dataKey="real" name="Corte real" unit="%"
              stroke="#E8ECF0" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#D4A574' }} />
            <span>Ventas de gas oil (m³, sin bunker ni usinas)</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#7FB069' }} />
            <span>Biodiesel vendido al corte (m³)</span>
          </div>
          <div className="chart-legend-item">
            <span className="chart-legend-swatch" style={{ background: '#E8ECF0' }} />
            <span>% de corte real (eje derecho)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
