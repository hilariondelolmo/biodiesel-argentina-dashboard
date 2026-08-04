import { useMemo, useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  Treemap, AreaChart, Area, LineChart, Line,
} from 'recharts';
import { fmt } from '../../lib/format.js';
import { useChartColors, useTheme } from '../../lib/theme.jsx';
import ChartTooltip from '../charts/ChartTooltip.jsx';
import '../charts/Chart.css';
import '../gestion/Ranking.css';

/**
 * Tab "Gráficos" de la Matriz histórica (puntos 3-5 del libro Tableau
 * "MERCADO INTERNO Info Explorarg"): participación de mercado y evolución
 * del año elegido, con la métrica y la taxonomía de la matriz, a tres
 * niveles de agregación (categoría / grupo económico / empresa).
 *
 * Menú de tipos de gráfico en revisión con HDO: se muestran todos los
 * candidatos y él decide cuáles quedan.
 */

const ETIQUETA_CAT = {
  INTEGRADA: 'Integradas',
  'NO INTEGRADA': 'No integradas',
  COMERCIALIZADORA: 'Comercializadoras',
};
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                      'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Series por entidad: rampa de un solo tono (navy) escalonada por claridad.
// Los tonos semánticos del sitio (verde/ámbar) no son separables entre sí
// para daltonismo como pares de identidad; la rampa sí, por construcción.
// Validada con el chequeo ordinal en ambos temas. El gris queda para "Resto".
const RAMPA = {
  light: ['#16295e', '#1e3a8a', '#3d5cab', '#6f88c8', '#a5b5dd'],
  dark: ['#a8cddc', '#7cb2c8', '#4A8FA8', '#356e85', '#245264'],
};

// Convención del sitio para categorías (GruposChart): siempre con etiqueta.
const colorCategoria = (C, cat) => {
  if (cat === 'INTEGRADA') return C.oil;
  if (cat === 'NO INTEGRADA') return C.bio;
  return C.neutral;
};

const NIVELES = [
  ['categoria', 'Categoría'],
  ['grupo', 'Grupo económico'],
  ['empresa', 'Empresa'],
];

// Compatibilidad de cada tipo con la clase de métrica activa
const TIPOS = [
  { id: 'ranking', label: 'Ranking', apto: () => true },
  { id: 'treemap', label: 'Mapa de áreas', apto: (t) => t === 'flujo' || t === 'stock' },
  { id: 'columnas', label: 'Columnas por mes', apto: (t) => t === 'flujo' },
  { id: 'share', label: 'Share por mes', apto: (t) => t === 'flujo' },
  { id: 'lineas', label: 'Líneas por mes', apto: (t) => t !== 'stock' },
];

const TOP_SERIES = 5; // entidades con color propio; el resto se consolida

export default function MatrizGraficos({ filas, meses, metrica, anio }) {
  const C = useChartColors();
  const { theme } = useTheme();
  const rampa = RAMPA[theme];
  const [nivel, setNivel] = useState('grupo');
  const [tipo, setTipo] = useState('ranking');

  const esRatio = metrica.tipo.startsWith('ratio');
  const tipoEfectivo = TIPOS.find((t) => t.id === tipo)?.apto(metrica.tipo)
    ? tipo : 'ranking';

  // Entidades del nivel elegido: pares {n, d} sumados miembro a miembro
  const entidades = useMemo(() => {
    const clave = (f) =>
      nivel === 'empresa' ? f.empresa : nivel === 'grupo' ? f.grupo : f.categoria;
    const m = new Map();
    for (const f of filas) {
      const k = clave(f);
      if (!m.has(k)) {
        m.set(k, {
          nombre: nivel === 'categoria' ? ETIQUETA_CAT[k] || k : k,
          categoria: f.categoria,
          meses: meses.map(() => ({ n: 0, d: 0 })),
          anual: { n: 0, d: 0 },
        });
      }
      const e = m.get(k);
      if (e.categoria !== f.categoria) e.categoria = 'MIXTA';
      f.meses.forEach((p, i) => { e.meses[i].n += p.n; e.meses[i].d += p.d; });
      e.anual.n += f.anual.n;
      e.anual.d += f.anual.d;
    }
    const valor = esRatio
      ? (e) => (e.anual.d > 0.5 ? e.anual.n / e.anual.d : -Infinity)
      : (e) => e.anual.n;
    return [...m.values()]
      .filter((e) => Math.abs(e.anual.n) > 0.5 || (esRatio && e.anual.d > 0.5))
      .sort((a, b) => valor(b) - valor(a));
  }, [filas, meses, nivel, esRatio]);

  const totalAnual = entidades.reduce((s, e) => s + Math.max(0, e.anual.n), 0);

  // Top N con identidad propia + "Resto" consolidado, para las series
  const { top, resto } = useMemo(() => {
    const positivas = entidades.filter((e) => e.anual.n > 0.5 || esRatio);
    const t = positivas.slice(0, TOP_SERIES);
    const r = positivas.slice(TOP_SERIES);
    if (!r.length) return { top: t, resto: null };
    const consolidado = {
      nombre: `Resto (${r.length})`,
      meses: meses.map((_, i) => r.reduce(
        (s, e) => ({ n: s.n + e.meses[i].n, d: s.d + e.meses[i].d }), { n: 0, d: 0 }
      )),
      anual: r.reduce((s, e) => ({ n: s.n + e.anual.n, d: s.d + e.anual.d }), { n: 0, d: 0 }),
    };
    return { top: t, resto: consolidado };
  }, [entidades, meses, esRatio]);

  // Color de una serie con identidad propia: semántico al nivel categoría
  // (convención del sitio), rampa navy por posición en los demás niveles
  const colorSerie = (e, i) =>
    nivel === 'categoria' ? colorCategoria(C, e.categoria) : rampa[i];

  const nivelLabel = NIVELES.find(([id]) => id === nivel)[1].toLowerCase();
  const unidad = esRatio ? '%' : 'toneladas';

  return (
    <div className="chart-card mzg">
      <div className="chart-card-header">
        <div>
          <span className="chart-card-title">{metrica.label} · {anio}</span>
          <span className="chart-card-subtitle">
            por {nivelLabel} · {unidad}{esRatio ? '' : ' y share'}
          </span>
        </div>
        <div className="chart-range-selector">
          {NIVELES.map(([id, label]) => (
            <button
              key={id}
              className={nivel === id ? 'active' : ''}
              onClick={() => setNivel(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-card-body">
        <div className="chart-range-selector mzg-tipos">
          {TIPOS.map((t) => {
            const apto = t.apto(metrica.tipo);
            return (
              <button
                key={t.id}
                className={tipoEfectivo === t.id ? 'active' : ''}
                disabled={!apto}
                title={apto ? undefined : 'No aplica a esta métrica'}
                onClick={() => setTipo(t.id)}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {tipoEfectivo === 'ranking' && (
          <GraficoRanking entidades={entidades} esRatio={esRatio} total={totalAnual} C={C} />
        )}
        {tipoEfectivo === 'treemap' && (
          <GraficoTreemap entidades={entidades} total={totalAnual} C={C} />
        )}
        {(tipoEfectivo === 'columnas' || tipoEfectivo === 'share') && (
          <GraficoMensualApilado
            top={top} resto={resto} meses={meses} en100={tipoEfectivo === 'share'}
            colorSerie={colorSerie} C={C}
          />
        )}
        {tipoEfectivo === 'lineas' && (
          <GraficoLineas
            top={top} meses={meses} esRatio={esRatio} colorSerie={colorSerie} C={C}
          />
        )}
        <div className="note">
          {esRatio
            ? 'Cada porcentaje surge de los volúmenes agregados del conjunto, nunca de promediar porcentajes.'
            : `El share es sobre el total de ${metrica.label.toLowerCase()} del año ${anio}.`}
          {nivel === 'grupo' && ' Los grupos económicos consolidan sus empresas (holding completo).'}
        </div>
      </div>
    </div>
  );
}

/* ── Ranking: barras horizontales con share/valor ─────────────────────── */

const MAX_RANKING = 25;

function GraficoRanking({ entidades, esRatio, total, C }) {
  const filas = entidades.slice(0, MAX_RANKING);
  const restantes = entidades.slice(MAX_RANKING);
  const maxValor = esRatio
    ? Math.max(...filas.map((e) => (e.anual.d > 0.5 ? e.anual.n / e.anual.d : 0)), 0.01)
    : filas[0]?.anual.n || 1;

  return (
    <div className="ranking">
      {filas.map((e) => {
        const ratio = e.anual.d > 0.5 ? (e.anual.n / e.anual.d) * 100 : null;
        const ancho = esRatio
          ? (ratio !== null ? Math.min((ratio / (maxValor * 100)) * 100, 100) : 0)
          : Math.max((e.anual.n / maxValor) * 100, 0);
        return (
          <div key={e.nombre} className="ranking-row">
            <div className="ranking-nombre">{fmt.truncate(e.nombre, 38)}</div>
            <div className="ranking-barra">
              <div
                className="ranking-barra-fill"
                style={{ width: `${ancho}%`, background: colorCategoria(C, e.categoria) }}
              />
            </div>
            <div className="ranking-valor" style={{ color: 'var(--ink)' }}>
              {esRatio
                ? (ratio !== null ? fmt.pct(ratio) : '-')
                : fmt.pct((Math.max(0, e.anual.n) / total) * 100)}
            </div>
            <div className="ranking-detalle">
              {esRatio
                ? `${fmt.int(e.anual.n)} / ${fmt.int(e.anual.d)} ton`
                : `${fmt.int(e.anual.n)} ton`}
            </div>
          </div>
        );
      })}
      {restantes.length > 0 && !esRatio && (
        <div className="ranking-row">
          <div className="ranking-nombre">Resto ({restantes.length})</div>
          <div className="ranking-barra">
            <div
              className="ranking-barra-fill"
              style={{
                width: `${(restantes.reduce((s, e) => s + Math.max(0, e.anual.n), 0) / maxValor) * 100}%`,
                background: 'var(--bg-4)',
              }}
            />
          </div>
          <div className="ranking-valor" style={{ color: 'var(--ink-muted)' }}>
            {fmt.pct((restantes.reduce((s, e) => s + Math.max(0, e.anual.n), 0) / total) * 100)}
          </div>
          <div className="ranking-detalle">
            {fmt.int(restantes.reduce((s, e) => s + e.anual.n, 0))} ton
          </div>
        </div>
      )}
      <LeyendaCategorias C={C} />
    </div>
  );
}

function LeyendaCategorias({ C }) {
  return (
    <div className="chart-legend">
      {Object.entries(ETIQUETA_CAT).map(([cat, label]) => (
        <div key={cat} className="chart-legend-item">
          <span className="chart-legend-swatch" style={{ background: colorCategoria(C, cat) }} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Treemap: superficie proporcional, color por categoría ────────────── */

const MAX_TREEMAP = 20;

function GraficoTreemap({ entidades, total, C }) {
  const positivas = entidades.filter((e) => e.anual.n > 0.5);
  const visibles = positivas.slice(0, MAX_TREEMAP);
  const resto = positivas.slice(MAX_TREEMAP);
  const datos = [
    ...visibles.map((e) => ({
      name: e.nombre,
      value: Math.round(e.anual.n),
      fill: colorCategoria(C, e.categoria),
    })),
    ...(resto.length
      ? [{
          name: `Resto (${resto.length})`,
          value: Math.round(resto.reduce((s, e) => s + e.anual.n, 0)),
          fill: C.neutralFill,
        }]
      : []),
  ];
  return (
    <>
      <ResponsiveContainer width="100%" height={380}>
        <Treemap
          data={datos} dataKey="value" nameKey="name"
          isAnimationActive={false}
          content={<CeldaTreemap total={total} />}
        >
          <Tooltip content={<ChartTooltip />} />
        </Treemap>
      </ResponsiveContainer>
      <LeyendaCategorias C={C} />
    </>
  );
}

function CeldaTreemap({ x, y, width, height, name, value, fill, total }) {
  if (width <= 0 || height <= 0) return null;
  const conTexto = width > 78 && height > 34;
  return (
    <g>
      <rect
        x={x} y={y} width={width} height={height}
        fill={fill} stroke="var(--bg-2)" strokeWidth={2} rx={2}
      />
      {conTexto && (
        <>
          <text x={x + 7} y={y + 17} fill="#fff" fontSize={11} fontWeight={600}>
            {fmt.truncate(name, Math.floor(width / 7))}
          </text>
          <text x={x + 7} y={y + 31} fill="rgba(255,255,255,0.85)" fontSize={10}>
            {fmt.pct((value / total) * 100)}
          </text>
        </>
      )}
    </g>
  );
}

/* ── Columnas mensuales apiladas (volumen o share 100%) ───────────────── */

function GraficoMensualApilado({ top, resto, meses, en100, colorSerie, C }) {
  const series = [...top, ...(resto ? [resto] : [])];
  const datos = meses.map((key, i) => {
    const fila = { mes: MESES_CORTOS[Number(key.slice(5, 7)) - 1] };
    const totalMes = series.reduce((s, e) => s + Math.max(0, e.meses[i].n), 0);
    for (const e of series) {
      const v = Math.max(0, e.meses[i].n);
      fila[e.nombre] = en100
        ? (totalMes > 0.5 ? (v / totalMes) * 100 : 0)
        : Math.round(v);
    }
    return fila;
  });
  return (
    <>
      <ResponsiveContainer width="100%" height={380}>
        {en100 ? (
          <AreaChart data={datos} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="mes" tick={{ fill: C.tick, fontSize: 11 }} stroke={C.axis} />
            <YAxis
              // La suma de shares puede dar 100,0000…3 por punto flotante:
              // ticks fijos y redondeo para que el eje no lo muestre
              domain={[0, 100]} ticks={[0, 25, 50, 75, 100]}
              allowDataOverflow
              tick={{ fill: C.tick, fontSize: 11 }}
              tickFormatter={(v) => `${Math.round(v)}%`} stroke={C.axis}
            />
            <Tooltip content={<ChartTooltip unit="%" />} />
            {series.map((e, i) => (
              <Area
                key={e.nombre} dataKey={e.nombre} stackId="1"
                stroke={i < top.length ? colorSerie(e, i) : C.neutral}
                strokeWidth={1}
                fill={i < top.length ? colorSerie(e, i) : C.neutralFill}
                fillOpacity={i < top.length ? 0.75 : 1}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        ) : (
          <BarChart data={datos} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <XAxis dataKey="mes" tick={{ fill: C.tick, fontSize: 11 }} stroke={C.axis} />
            <YAxis
              tick={{ fill: C.tick, fontSize: 11 }}
              tickFormatter={(v) => fmt.compact(v)} stroke={C.axis}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: C.cursor }} />
            {series.map((e, i) => (
              <Bar
                key={e.nombre} dataKey={e.nombre} stackId="1"
                fill={i < top.length ? colorSerie(e, i) : C.neutralFill}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
      <LeyendaSeries series={series} top={top} colorSerie={colorSerie} C={C} />
    </>
  );
}

/* ── Líneas mensuales (volumen o ratio %) ─────────────────────────────── */

function GraficoLineas({ top, meses, esRatio, colorSerie, C }) {
  const datos = meses.map((key, i) => {
    const fila = { mes: MESES_CORTOS[Number(key.slice(5, 7)) - 1] };
    for (const e of top) {
      const p = e.meses[i];
      fila[e.nombre] = esRatio
        ? (p.d > 0.5 ? (p.n / p.d) * 100 : null)
        : Math.round(p.n);
    }
    return fila;
  });
  return (
    <>
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={datos} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="mes" tick={{ fill: C.tick, fontSize: 11 }} stroke={C.axis} />
          <YAxis
            tick={{ fill: C.tick, fontSize: 11 }}
            tickFormatter={(v) => (esRatio ? `${v}%` : fmt.compact(v))}
            stroke={C.axis}
          />
          <Tooltip
            content={<ChartTooltip unit={esRatio ? '%' : 'ton'} />}
            cursor={{ stroke: C.cursorLinea }}
          />
          {top.map((e, i) => (
            <Line
              key={e.nombre} dataKey={e.nombre}
              stroke={colorSerie(e, i)} strokeWidth={2}
              dot={false} connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <LeyendaSeries series={top} top={top} colorSerie={colorSerie} C={C} />
    </>
  );
}

function LeyendaSeries({ series, top, colorSerie, C }) {
  return (
    <div className="chart-legend">
      {series.map((e, i) => (
        <div key={e.nombre} className="chart-legend-item">
          <span
            className="chart-legend-swatch"
            style={{ background: i < top.length ? colorSerie(e, i) : C.neutralFill }}
          />
          <span>{fmt.truncate(e.nombre, 30)}</span>
        </div>
      ))}
    </div>
  );
}
