import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import data from '../../data/dashboard.json';
import { fmt } from '../../lib/format.js';
import './Chart.css';
import { useChartColors } from '../../lib/theme.jsx';

const paleta = (C) => [
  C.exp, C.oil, C.bio, C.alert, C.neutral,
  '#6B9BAB', '#BE9770', '#729E5E', '#B07058', '#7A8995',
  '#5C8A98', '#A88960', '#66945A', '#9A6450', '#6B7A86',
  '#4E7A8A', '#9C7C5C', '#5F8451',
];

function DoughnutTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const total = item.payload.total;
  const pct = (item.value / total * 100).toFixed(1);
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-row">
        <div className="chart-tooltip-row-label">
          <span className="chart-tooltip-swatch" style={{ background: item.payload.fill }} />
          <span>{item.name}</span>
        </div>
        <span className="chart-tooltip-row-val">
          {fmt.int(item.value)} ton ({pct}%)
        </span>
      </div>
    </div>
  );
}

export default function PetrolerasChart() {
  const C = useChartColors();
  const ventas = data.ventas_petroleras_12m;
  const total = ventas.reduce((acc, v) => acc + v.TONELADAS, 0);

  const series = ventas.map((v, i) => ({
    name: v.PETROLERA.replace(/ S\.A\.$| C\.A\.P\.S\.A\.$/, ''),
    value: v.TONELADAS,
    total,
    fill: paleta(C)[i % paleta(C).length],
  }));

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">Ventas por petrolera mezcladora</span>
          <span className="chart-card-subtitle">últimos 12 meses · mercado interno</span>
        </div>
      </div>
      <div className="chart-card-body">
        <ResponsiveContainer width="100%" height={360}>
          <PieChart>
            <Pie
              data={series}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={130}
              paddingAngle={1}
              stroke="var(--bg-2)"
              strokeWidth={2}
            >
              {series.map((e, i) => (
                <Cell key={i} fill={e.fill} />
              ))}
            </Pie>
            <Tooltip content={<DoughnutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-legend" style={{ columnCount: 2 }}>
          {series.map((s, i) => (
            <div key={i} className="chart-legend-item">
              <span className="chart-legend-swatch" style={{ background: s.fill }} />
              <span>{s.name} · {fmt.pct((s.value / total) * 100)}</span>
            </div>
          ))}
        </div>
        <div className="note">
          YPF concentra la mayor proporción de compras de biodiesel al mercado interno, coherente
          con su posición dominante en refinación y comercialización de combustibles.
        </div>
      </div>
    </div>
  );
}
