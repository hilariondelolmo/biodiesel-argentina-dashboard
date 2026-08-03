import { useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, Cell, ResponsiveContainer, YAxis,
} from 'recharts';
import mercado from '../../data/mercado.json';
import empresasData from '../../data/empresas.json';
import { fmt } from '../../lib/format.js';
import { mesOffset, Delta } from './kpiHelpers.jsx';
import './Mercado.css';
import { useChartColors } from '../../lib/theme.jsx';

/**
 * Análisis de cumplimiento de las asignaciones de biodiesel de la SE:
 * 4 indicadores × 4 horizontes, con mes de análisis y grupo económico
 * seleccionables. Todo en toneladas salvo el % de cumplimiento.
 *
 * Diferencia = ventas efectivas − asignación · % = ventas / asignación × 100.
 * La lógica es idéntica en todos los horizontes; solo cambia la ventana.
 */

const TODOS = 'Todos los grupos';

// serie por grupo económico: grupo → Map(fecha → {cupo, vc})
const POR_GRUPO = new Map();
for (const e of empresasData.empresas) {
  const g = e.grupo || e.empresa;
  if (!POR_GRUPO.has(g)) POR_GRUPO.set(g, new Map());
  const serie = POR_GRUPO.get(g);
  for (const [f, , cupo, vc] of e.serie) {
    const cur = serie.get(f) || { cupo: 0, vc: 0 };
    cur.cupo += cupo || 0;
    cur.vc += vc || 0;
    serie.set(f, cur);
  }
}
const GRUPOS = [...POR_GRUPO.entries()]
  .filter(([, s]) => [...s.values()].some((v) => v.cupo > 0))
  .map(([g]) => g)
  .sort();

function serieBase(grupo) {
  if (grupo === TODOS) {
    return mercado.mensual
      .filter((m) => (m.cupo || 0) > 0)
      .map((m) => ({ fecha: m.fecha, cupo: m.cupo, vc: m.vc }));
  }
  return [...POR_GRUPO.get(grupo).entries()]
    .filter(([, v]) => v.cupo > 0)
    .map(([fecha, v]) => ({ fecha, ...v }))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
}

function ventana(serie, desde, hasta) {
  const rows = serie.filter((m) => m.fecha >= desde && m.fecha <= hasta);
  if (!rows.length) return null;
  const cupo = rows.reduce((s, m) => s + m.cupo, 0);
  const vc = rows.reduce((s, m) => s + m.vc, 0);
  if (cupo <= 0) return null;
  return { cupo, vc, diff: vc - cupo, pct: (vc / cupo) * 100 };
}

const conSigno = (v) => `${v >= 0 ? '+' : '−'}${fmt.int(Math.abs(v))}`;

export default function AsignacionHoy() {
  const C = useChartColors();
  const [grupo, setGrupo] = useState(TODOS);
  const [mesSel, setMesSel] = useState(null);

  const serie = useMemo(() => serieBase(grupo), [grupo]);
  const fechas = serie.map((m) => m.fecha);
  const mes = mesSel && fechas.includes(mesSel) ? mesSel : fechas.at(-1);

  const d = useMemo(() => {
    const anio = mes.slice(0, 4);
    const mesPY = mesOffset(mes, -12);
    return {
      mes: ventana(serie, mes, mes),
      pm: ventana(serie, mesOffset(mes, -1), mesOffset(mes, -1)),
      mesPY: ventana(serie, mesPY, mesPY),
      ytd: ventana(serie, `${anio}-01`, mes),
      ytdPY: ventana(serie, `${Number(anio) - 1}-01`, mesPY),
      u12: ventana(serie, mesOffset(mes, -11), mes),
      u12PY: ventana(serie, mesOffset(mes, -23), mesPY),
      spark: serie
        .filter((m) => m.fecha >= `${anio}-01` && m.fecha <= mes)
        .map((m) => ({
          fecha: m.fecha,
          cupo: m.cupo,
          vc: m.vc,
          diff: m.vc - m.cupo,
          pct: (m.vc / m.cupo) * 100,
        })),
    };
  }, [serie, mes]);

  const INDICADORES = [
    {
      clave: 'cupo', titulo: 'Asignación biodiesel corte', color: C.exp,
      valor: (v) => v && `${fmt.int(v.cupo)} ton`, corto: (v) => v && fmt.int(v.cupo),
      crudo: (v) => v?.cupo,
    },
    {
      clave: 'vc', titulo: 'Ventas biodiesel corte', color: C.bio,
      valor: (v) => v && `${fmt.int(v.vc)} ton`, corto: (v) => v && fmt.int(v.vc),
      crudo: (v) => v?.vc,
    },
    {
      clave: 'diff', titulo: 'Cumplimiento asignación (ton)', color: C.oil,
      valor: (v) => v && `${conSigno(v.diff)} ton`, corto: (v) => v && conSigno(v.diff),
      crudo: (v) => v?.diff, barras: true,
    },
    {
      clave: 'pct', titulo: '% cumplimiento asignación', color: C.ink,
      valor: (v) => v && fmt.pct(v.pct), corto: (v) => v && fmt.pct(v.pct),
      crudo: (v) => v?.pct,
    },
  ];

  const etiquetaMes = fmt.monthShort(mes);
  const anio = mes.slice(0, 4);

  return (
    <>
      <div className="empresa-selector-row mh-selectores">
        <label htmlFor="mes-asig-select">Mes de análisis</label>
        <select
          id="mes-asig-select" className="empresa-select" style={{ minWidth: 150 }}
          value={mes} onChange={(e) => setMesSel(e.target.value)}
        >
          {[...fechas].reverse().map((f) => (
            <option key={f} value={f}>{fmt.monthShort(f)}</option>
          ))}
        </select>
        <label htmlFor="grupo-select">Grupo económico</label>
        <select
          id="grupo-select" className="empresa-select" style={{ minWidth: 220 }}
          value={grupo} onChange={(e) => setGrupo(e.target.value)}
        >
          <option value={TODOS}>{TODOS}</option>
          {GRUPOS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <div className="mh-grid">
        {INDICADORES.map((ind) => (
          <div key={ind.clave} className="mh-col">
            <div className="mh-titulo" style={{ color: ind.color }}>{ind.titulo}</div>

            <div className="mh-bloque">
              <div className="mh-periodo">Mes · {etiquetaMes}</div>
              <div className="mh-valor">{ind.valor(d.mes)}</div>
              <Delta actual={ind.crudo(d.mes)} base={ind.crudo(d.pm)}
                etiqueta="mes previo" formatoBase={ind.corto(d.pm)} />
              <Delta actual={ind.crudo(d.mes)} base={ind.crudo(d.mesPY)}
                etiqueta="mismo mes año previo" formatoBase={ind.corto(d.mesPY)} />
            </div>

            <div className="mh-bloque">
              <div className="mh-periodo">Acumulado · ene → {etiquetaMes}</div>
              <div className="mh-valor">{ind.valor(d.ytd)}</div>
              <Delta actual={ind.crudo(d.ytd)} base={ind.crudo(d.ytdPY)}
                etiqueta="mismo período año previo" formatoBase={ind.corto(d.ytdPY)} />
            </div>

            <div className="mh-bloque">
              <div className="mh-periodo">Últimos 12 meses</div>
              <div className="mh-valor">{ind.valor(d.u12)}</div>
              <Delta actual={ind.crudo(d.u12)} base={ind.crudo(d.u12PY)}
                etiqueta="12 meses previos" formatoBase={ind.corto(d.u12PY)} />
            </div>

            <div className="mh-bloque mh-spark">
              <div className="mh-periodo">Evolución mensual · {anio}</div>
              <ResponsiveContainer width="100%" height={72}>
                {ind.barras ? (
                  <BarChart data={d.spark} margin={{ top: 8, right: 4, left: 4, bottom: 4 }}>
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                    <Bar dataKey="diff" isAnimationActive={false}>
                      {d.spark.map((m) => (
                        <Cell key={m.fecha} fill={m.diff >= 0 ? C.bio : C.alert} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <LineChart data={d.spark} margin={{ top: 8, right: 4, left: 4, bottom: 4 }}>
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                    <Line
                      dataKey={ind.clave} stroke={ind.color} strokeWidth={1.8}
                      dot={false} isAnimationActive={false}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
              <div className="mh-spark-labels">
                <span>{fmt.monthOnly(d.spark[0]?.fecha)}</span>
                <span>{fmt.monthOnly(d.spark.at(-1)?.fecha)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="note">
        Cumplimiento (ton) = ventas efectivas al corte − asignación de la Secretaría de Energía ·
        % cumplimiento = ventas / asignación × 100 · Con un grupo económico elegido, los valores
        corresponden a sus elaboradoras · La lógica de cálculo es idéntica en todos los
        horizontes; solo cambia la ventana temporal.
      </p>
    </>
  );
}
