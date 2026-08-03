import { useMemo, useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import empresasData from '../../data/empresas.json';
import KPIs from '../KPIs.jsx';
import { fmt } from '../../lib/format.js';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import '../charts/Chart.css';
import './Mercado.css';

/**
 * Ficha por elaboradora: selector de empresa, KPIs del último año completo
 * y serie cupo/ventas con vista anual o mensual.
 * serie: [fecha, prod, cupo, ventas_corte, xquota, exportaciones]
 */
export default function EmpresaFicha() {
  const empresas = empresasData.empresas;
  const [nombre, setNombre] = useState(empresas[0].empresa);
  const [vista, setVista] = useState('anual');
  const anual = vista === 'anual';

  const emp = empresas.find((e) => e.empresa === nombre);

  const { serieAnual, serieMensual, ultCompleto } = useMemo(() => {
    const porAnio = new Map();
    for (const [f, prod, cupo, vc, , exp] of emp.serie) {
      const y = f.slice(0, 4);
      const cur = porAnio.get(y) || { prod: 0, cupo: 0, vc: 0, exp: 0, meses: 0 };
      cur.prod += prod || 0;
      cur.cupo += cupo || 0;
      cur.vc += vc || 0;
      cur.exp += exp || 0;
      cur.meses += 1;
      porAnio.set(y, cur);
    }
    const sa = [...porAnio.entries()].map(([anio, v]) => ({
      x: anio,
      Cupo: Math.round(v.cupo),
      Ventas_corte: Math.round(v.vc),
      Exportaciones: Math.round(v.exp),
      prod: Math.round(v.prod),
      cumplimiento: v.cupo > 0 ? (v.vc / v.cupo) * 100 : null,
      meses: v.meses,
    }));
    // Ventana mensual: últimos 72 meses de actividad de LA EMPRESA (una
    // empresa inactiva hoy mostraría vacío si se usara el calendario).
    const activos = emp.serie.filter(([, prod, cupo, vc, xq, exp]) =>
      (prod || 0) + (cupo || 0) + (vc || 0) + (xq || 0) + (exp || 0) > 0);
    const hastaMes = activos.length ? activos.at(-1)[0] : null;
    const sm = emp.serie
      .filter(([f]) => hastaMes && f <= hastaMes)
      .slice(-72)
      .map(([f, , cupo, vc, , exp]) => ({
      x: f,
      Cupo: cupo ? Math.round(cupo) : null,
      Ventas_corte: vc ? Math.round(vc) : 0,
      Exportaciones: exp ? Math.round(exp) : 0,
      cumplimiento: cupo > 0 ? (vc / cupo) * 100 : null,
    }));
    return {
      serieAnual: sa,
      serieMensual: sm,
      ultCompleto: sa
        .filter((s) => s.meses === 12 &&
          s.Cupo + s.Ventas_corte + s.Exportaciones + s.prod > 0)
        .at(-1),
    };
  }, [emp]);

  const serie = anual ? serieAnual.filter((s) => s.Cupo > 0 || s.Ventas_corte > 0 || s.Exportaciones > 0) : serieMensual;

  const kpis = ultCompleto
    ? [
        {
          label: `Producción ${ultCompleto.x}`,
          value: fmt.int(ultCompleto.prod), sub: 'toneladas',
        },
        (ultCompleto.Cupo > 0 || ultCompleto.Ventas_corte > 0) && {
          label: `Ventas al corte ${ultCompleto.x}`,
          value: fmt.int(ultCompleto.Ventas_corte), sub: 'toneladas',
        },
        ultCompleto.cumplimiento !== null && {
          label: `Cumplimiento ${ultCompleto.x}`,
          value: fmt.pct(ultCompleto.cumplimiento, 0),
          sub: 'del cupo asignado',
          tone: ultCompleto.cumplimiento >= 95 ? 'pos' : 'neg',
        },
        ultCompleto.Exportaciones > 0 && {
          label: `Exportaciones ${ultCompleto.x}`,
          value: fmt.int(ultCompleto.Exportaciones), sub: 'toneladas',
        },
        {
          label: 'Categoría',
          value: emp.categoria.charAt(0) + emp.categoria.slice(1).toLowerCase(),
          sub: [emp.localidad, emp.provincia].filter(Boolean).join(', ') || '—',
          tone: 'info',
        },
        emp.grupo && {
          label: 'Grupo económico', value: fmt.truncate(emp.grupo, 22),
          sub: emp.camara ? `Cámara: ${emp.camara}` : null,
        },
      ].filter(Boolean)
    : [];

  return (
    <>
      <div className="empresa-selector-row">
        <label htmlFor="empresa-select">Elaboradora</label>
        <select
          id="empresa-select"
          className="empresa-select"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        >
          {empresas.map((e) => (
            <option key={e.empresa} value={e.empresa}>
              {e.empresa}
            </option>
          ))}
        </select>
      </div>
      {kpis.length > 0 && <KPIs items={kpis} />}
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <span className="chart-card-title">{fmt.truncate(emp.empresa, 42)}</span>
            <span className="chart-card-subtitle">
              cupo, ventas al corte y exportaciones · línea: % de cumplimiento
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
                yAxisId="ton" tick={{ fill: '#6B7680', fontSize: 11 }}
                tickFormatter={(v) => fmt.compact(v)} stroke="#2A3340"
              />
              <YAxis
                yAxisId="pct" orientation="right" tick={{ fill: '#6B7680', fontSize: 11 }}
                tickFormatter={(v) => fmt.pct(v, 0)} stroke="#2A3340"
              />
              <Tooltip
                content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                labelFormatter={anual ? undefined : (l) => fmt.monthShort(l)}
              />
              <Bar yAxisId="ton" dataKey="Cupo" name="Cupo asignado" fill="#4A8FA8" />
              <Bar yAxisId="ton" dataKey="Ventas_corte" name="Ventas al corte" fill="#7FB069" />
              <Bar yAxisId="ton" dataKey="Exportaciones" name="Exportaciones" fill="#D4A574" />
              <Line
                yAxisId="pct" dataKey="cumplimiento" name="Cumplimiento" unit="%"
                stroke="#E8ECF0" strokeWidth={1.5} dot={anual ? { r: 2 } : false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <div className="chart-legend-item">
              <span className="chart-legend-swatch" style={{ background: '#4A8FA8' }} />
              <span>Cupo asignado</span>
            </div>
            <div className="chart-legend-item">
              <span className="chart-legend-swatch" style={{ background: '#7FB069' }} />
              <span>Ventas al corte</span>
            </div>
            <div className="chart-legend-item">
              <span className="chart-legend-swatch" style={{ background: '#D4A574' }} />
              <span>Exportaciones</span>
            </div>
            <div className="chart-legend-item">
              <span className="chart-legend-swatch" style={{ background: '#E8ECF0' }} />
              <span>Cumplimiento (eje derecho)</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
