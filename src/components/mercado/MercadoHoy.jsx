import { useEffect, useMemo, useRef, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import corte from '../../data/corte.json';
import petroleras from '../../data/petroleras.json';
import goSectores from '../../data/go_sectores.json';
import { fmt } from '../../lib/format.js';
import { mesOffset, Delta } from './kpiHelpers.jsx';
import './Mercado.css';
import { useChartColors } from '../../lib/theme.jsx';

/**
 * KPIs del mercado interno replicando el tablero de referencia de explorarg:
 * 4 indicadores × 4 horizontes, con mes de análisis y petrolera seleccionables.
 *
 * Series base: ventas GO G2+G3 (m3, sin destinos exentos) y bio al corte (m3).
 * Con una petrolera elegida, el GO son sus ventas y el bio sus compras a
 * elaboradoras. Derivados: % corte real = bio/GO · % cumplimiento =
 * real/obligatorio. La lógica es idéntica en todos los horizontes; solo
 * cambia la ventana temporal.
 */

const DENSIDAD = corte.densidad_bio;
const OBLIG = new Map(corte.mensual.map((m) => [m.fecha, m.obligatorio]));
const TODAS = 'Todas las petroleras';

const PETROLERAS = [...new Set(
  petroleras.go_mensual.flatMap((r) => Object.keys(r).filter((k) => k !== 'fecha'))
)].sort();

const SECTORES = goSectores.sectores;
const SECTORES_DEFAULT = new Set(
  SECTORES.filter((s) => !goSectores.sectores_sin_corte.includes(s))
);

// GO por petrolera-mes precalculado: fecha → petrolera → {sector: m3}
const GO_PET = new Map();
for (const r of goSectores.mensual_petrolera) {
  if (!GO_PET.has(r.fecha)) GO_PET.set(r.fecha, new Map());
  GO_PET.get(r.fecha).set(r.petrolera, r);
}

function sumaSectores(row, seleccion) {
  let t = 0;
  for (const s of seleccion) t += row?.[s] || 0;
  return t;
}

function serieBase(petrolera, seleccion) {
  const bioSistema = new Map(corte.mensual.map((m) => [m.fecha, m.bio_m3]));
  const bioPet = new Map(petroleras.mensual.map((r) => [r.fecha, (r[petrolera] || 0) / DENSIDAD]));
  const out = [];
  for (const row of goSectores.mensual_total) {
    const { fecha } = row;
    if (fecha < '2010-01' || OBLIG.get(fecha) == null) continue;
    const goRow = petrolera === TODAS ? row : GO_PET.get(fecha)?.get(petrolera);
    const go = sumaSectores(goRow, seleccion);
    if (go <= 0) continue;
    const bio = petrolera === TODAS ? bioSistema.get(fecha) || 0 : bioPet.get(fecha) || 0;
    out.push({ fecha, go, bio, oblig: OBLIG.get(fecha) });
  }
  return out;
}

function ventana(serie, desde, hasta) {
  const rows = serie.filter((m) => m.fecha >= desde && m.fecha <= hasta);
  if (!rows.length) return null;
  const go = rows.reduce((s, m) => s + m.go, 0);
  const bio = rows.reduce((s, m) => s + m.bio, 0);
  if (go <= 0) return null;
  const oblig = rows.reduce((s, m) => s + m.oblig * m.go, 0) / go;
  const real = bio / go;
  return { go, bio, real, cumplimiento: real / oblig };
}

/** Dropdown multi-selección de sectores, con el estilo de los otros selectores. */
function SectoresDropdown({ seleccion, onToggle }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [abierto]);

  const resumen =
    seleccion.size === SECTORES.length
      ? 'Todos los sectores'
      : `${seleccion.size} de ${SECTORES.length} sectores`;

  return (
    <div className="mh-dropdown" ref={ref}>
      <button
        type="button"
        className={`empresa-select mh-dropdown-boton ${abierto ? 'abierto' : ''}`}
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
      >
        {resumen} <span className="mh-dropdown-caret">▾</span>
      </button>
      {abierto && (
        <div className="mh-dropdown-panel">
          {SECTORES.map((s) => (
            <label key={s} className="mh-dropdown-item">
              <input
                type="checkbox"
                checked={seleccion.has(s)}
                onChange={() => onToggle(s)}
              />
              <span>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MercadoHoy({ mes: mesProp }) {
  const C = useChartColors();
  const [petrolera, setPetrolera] = useState(TODAS);
  const [sectores, setSectores] = useState(SECTORES_DEFAULT);

  const toggleSector = (s) => {
    setSectores((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next.size ? next : prev; // al menos un sector seleccionado
    });
  };

  const serie = useMemo(() => serieBase(petrolera, sectores), [petrolera, sectores]);
  const fechas = serie.map((m) => m.fecha);
  // Mes efectivo: el seleccionado, o el último disponible de esta serie
  const mes = fechas.filter((f) => f <= mesProp).at(-1) || fechas.at(-1);

  const d = useMemo(() => {
    const anio = mes.slice(0, 4);
    const mesPY = mesOffset(mes, -12);
    const w = {
      mes: ventana(serie, mes, mes),
      pm: ventana(serie, mesOffset(mes, -1), mesOffset(mes, -1)),
      mesPY: ventana(serie, mesPY, mesPY),
      ytd: ventana(serie, `${anio}-01`, mes),
      ytdPY: ventana(serie, `${Number(anio) - 1}-01`, mesPY),
      u12: ventana(serie, mesOffset(mes, -11), mes),
      u12PY: ventana(serie, mesOffset(mes, -23), mesPY),
    };
    const spark = serie
      .filter((m) => m.fecha >= `${anio}-01` && m.fecha <= mes)
      .map((m) => ({
        fecha: m.fecha,
        go: m.go,
        bio: m.bio,
        real: (m.bio / m.go) * 100,
        cumplimiento: (m.bio / m.go / m.oblig) * 100,
      }));
    return { ...w, spark };
  }, [serie, mes]);

  const INDICADORES = [
    {
      clave: 'go',
      titulo: petrolera === TODAS ? 'Ventas de gas oil Nº2 y Nº3' : 'Ventas de gas oil de la petrolera',
      color: C.oil,
      valor: (v) => v && `${fmt.int(v.go)} m³`, corto: (v) => v && fmt.int(v.go),
      crudo: (v) => v?.go,
    },
    {
      clave: 'bio',
      titulo: petrolera === TODAS ? 'Venta biodiesel corte obligatorio' : 'Biodiesel comprado al corte',
      color: C.bio,
      valor: (v) => v && `${fmt.int(v.bio)} m³`, corto: (v) => v && fmt.int(v.bio),
      crudo: (v) => v?.bio,
    },
    {
      clave: 'real', titulo: '% corte real', color: C.exp,
      valor: (v) => v && fmt.pct(v.real * 100), corto: (v) => v && fmt.pct(v.real * 100),
      crudo: (v) => v?.real,
    },
    {
      clave: 'cumplimiento', titulo: '% cumplimiento corte', color: C.ink,
      valor: (v) => v && fmt.pct(v.cumplimiento * 100, 0),
      corto: (v) => v && fmt.pct(v.cumplimiento * 100, 0),
      crudo: (v) => v?.cumplimiento,
    },
  ];

  const etiquetaMes = fmt.monthShort(mes);
  const anio = mes.slice(0, 4);

  return (
    <>
      <div className="empresa-selector-row mh-selectores">
        <label htmlFor="petrolera-select">Petrolera</label>
        <select
          id="petrolera-select" className="empresa-select" style={{ minWidth: 220 }}
          value={petrolera} onChange={(e) => setPetrolera(e.target.value)}
        >
          <option value={TODAS}>{TODAS}</option>
          {PETROLERAS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <label>Sectores del gas oil</label>
        <SectoresDropdown seleccion={sectores} onToggle={toggleSector} />
      </div>

      <div className="mh-grid">
        {INDICADORES.map((ind) => (
          <div key={ind.clave} className="mh-col" style={{ borderColor: ind.color }}>
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
                <LineChart data={d.spark} margin={{ top: 8, right: 4, left: 4, bottom: 4 }}>
                  <YAxis hide domain={['dataMin', 'dataMax']} />
                  <Line
                    dataKey={ind.clave} stroke={ind.color} strokeWidth={1.8}
                    dot={false} isAnimationActive={false}
                  />
                </LineChart>
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
        % corte real = venta de biodiesel al corte / venta de gas oil grados 2 y 3 (m³) en los
        sectores seleccionados · % cumplimiento = corte real / corte obligatorio vigente ·
        Bunker cabotaje, bunker internacional y usinas eléctricas arrancan deseleccionados por
        no llevar corte obligatorio · Con una petrolera elegida, el gas oil son sus ventas y el
        biodiesel sus compras a elaboradoras · La lógica de cálculo es idéntica en todos los
        horizontes; solo cambia la ventana temporal.
      </p>
    </>
  );
}
