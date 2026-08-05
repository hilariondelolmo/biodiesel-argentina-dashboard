import { useEffect, useMemo, useRef, useState } from 'react';
import empresasData from '../../data/empresas.json';
import capacidadData from '../../data/capacidad.json';
import { fmt } from '../../lib/format.js';
import MatrizGraficos from './MatrizGraficos.jsx';
import './Mercado.css';

/**
 * Matriz histórica empresa × período - réplica de los puntos 1 y 2 del libro
 * Tableau "MERCADO INTERNO Info Explorarg" adaptada al diseño del sitio.
 * Modos: serie anual, apertura mensual de un año y comparación de períodos.
 *
 * Tres clases de métrica:
 *  - flujo (ventas, producción...): las celdas suman;
 *  - ratio (% cumplimiento, % utilización): cada celda guarda numerador y
 *    denominador y TODA agregación suma ambos por separado - el % de un
 *    grupo es Σnum/Σden, nunca promedio de porcentajes;
 *  - stock (capacidad anual): la celda es la foto del año, no se suma en el
 *    tiempo (sí entre empresas), y no lleva columna Total.
 * Serie de cada empresa: [fecha, prod, cupo, vc, xq, exp, cotab].
 * COTAB (Res. 638/2022): corte obligatorio transitorio adicional, jun→nov
 * 2022 - va segregado de las demás ventas por decisión HDO.
 */

// Ventas EXTRACUPO (decisión HDO): el XQUOTA de las INTEGRADAS desde 2026
// (las "otras ventas" a petroleras), segregado como métrica propia. El resto
// del XQUOTA - no integradas, comercializadoras y el histórico de integradas
// pre-2026 - es FUERA DE CUPO. Ventas al corte = cupo + COTAB; totales =
// corte + extracupo + fuera de cupo.
const extracupo = (f, e) =>
  (e.categoria === 'INTEGRADA' && f[0] >= '2026' ? f[4] || 0 : 0);
const fueraDeCupo = (f, e) => (f[4] || 0) - extracupo(f, e);

const METRICAS = [
  // OJO: la columna QUOTA SALES de la SE ya incluye las ventas COTAB
  // (verificado: en 2022 las quota sales de cada integrada son idénticas a
  // su COTAB). Por eso: cupo = QUOTA SALES − COTAB; corte = QUOTA SALES.
  { id: 'vc', label: 'Ventas cupo', tipo: 'flujo', val: (f) => (f[3] || 0) - (f[6] || 0) },
  { id: 'cotab', label: 'Ventas COTAB (Res. 638/2022)', tipo: 'flujo', val: (f) => f[6] || 0 },
  { id: 'corte', label: 'Ventas al corte (cupo + COTAB)', tipo: 'flujo', val: (f) => f[3] || 0 },
  { id: 'extracupo', label: 'Ventas extracupo', tipo: 'flujo', val: extracupo },
  { id: 'xq', label: 'Ventas fuera de cupo', tipo: 'flujo', val: fueraDeCupo },
  // Totales = corte + extracupo + fuera de cupo = QUOTA SALES + XQUOTA
  { id: 'total', label: 'Ventas totales', tipo: 'flujo', val: (f) => (f[3] || 0) + (f[4] || 0) },
  { id: 'prod', label: 'Producción', tipo: 'flujo', val: (f) => f[1] || 0 },
  { id: 'exp', label: 'Exportaciones', tipo: 'flujo', val: (f) => f[5] || 0 },
  { id: 'cupo', label: 'Cupo asignado', tipo: 'flujo', val: (f) => f[2] || 0 },
  { id: 'cumplimiento', label: '% Cumplimiento entrega (venta / asignación)', tipo: 'ratio', num: (f) => (f[3] || 0) - (f[6] || 0), den: (f) => f[2] || 0 },
  { id: 'capacidad', label: 'Capacidad de producción anual', tipo: 'stock' },
  { id: 'utilizacion', label: '% Utilización (producción / capacidad)', tipo: 'ratio-capacidad', num: (f) => f[1] || 0 },
];

const CATEGORIAS = ['INTEGRADA', 'NO INTEGRADA', 'COMERCIALIZADORA'];
const ETIQUETA_CAT = {
  INTEGRADA: 'Integradas',
  'NO INTEGRADA': 'No integradas',
  COMERCIALIZADORA: 'Comercializadoras',
};
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                      'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// Capacidad instalada: foto anual por empresa (ton/año)
const CAPACIDAD = (() => {
  const m = new Map();
  for (const r of capacidadData.serie) {
    if (!m.has(r.empresa)) m.set(r.empresa, {});
    const porAnio = m.get(r.empresa);
    const anio = r.fecha.slice(0, 4);
    porAnio[anio] = (porAnio[anio] || 0) + r.capacidad;
  }
  return m;
})();

const cap = (empresa, anio) => CAPACIDAD.get(empresa)?.[anio] || 0;

export default function MatrizHistorica({ seccion }) {
  const [metricaId, setMetricaId] = useState('vc');
  const [catFiltro, setCatFiltro] = useState('TODAS');
  const [modo, setModo] = useState('anual'); // 'anual' | 'mensual' | 'comparar' | 'graficos'
  const [expandidos, setExpandidos] = useState(() => new Set());

  const metrica = METRICAS.find((m) => m.id === metricaId);
  const esRatio = metrica.tipo.startsWith('ratio');
  const ultimoMes = empresasData.ultimo_mes; // p.ej. '2026-06'
  const mesCorte = ultimoMes.slice(5, 7);
  const anioActual = Number(ultimoMes.slice(0, 4));
  const [anioSel, setAnioSel] = useState(String(anioActual));

  const toggleGrupo = (g) =>
    setExpandidos((prev) => {
      const s = new Set(prev);
      if (s.has(g)) s.delete(g);
      else s.add(g);
      return s;
    });

  const datos = useMemo(() => {
    const empresas = empresasData.empresas.filter(
      (e) => catFiltro === 'TODAS' || e.categoria === catFiltro
    );

    // Inicio de la ventana móvil de 12 meses (para separar operando / no)
    const [uy, um] = [Number(ultimoMes.slice(0, 4)), Number(ultimoMes.slice(5, 7))];
    const desde12 = `${um === 12 ? uy : uy - 1}-${String((um % 12) + 1).padStart(2, '0')}`;

    // Precalcular por empresa. Cada celda es un par {n, d}: numerador y
    // denominador (d=1 implícito en flujos). vc12/vcHist ordenan la lista.
    const porEmpresa = empresas.map((e) => {
      const porAnio = {};
      const porMes = {};
      const acumulado = {};
      let vc12 = 0;
      let vcHist = 0;
      const add = (obj, clave, n, d) => {
        const c = obj[clave] || (obj[clave] = { n: 0, d: 0 });
        c.n += n;
        c.d += d;
      };
      for (const fila of e.serie) {
        const anio = fila[0].slice(0, 4);
        let n = 0;
        let d = 0;
        if (metrica.tipo === 'flujo') n = metrica.val(fila, e);
        else if (metrica.tipo === 'ratio') { n = metrica.num(fila); d = metrica.den(fila); }
        else if (metrica.tipo === 'ratio-capacidad') n = metrica.num(fila);
        // stock y el denominador de utilización no salen de la serie: se
        // resuelven por columna contra el registro de capacidad, para que
        // las empresas sin actividad igual aporten su capacidad al agregado
        add(porAnio, anio, n, d);
        add(porMes, fila[0], n, d);
        if (fila[0].slice(5, 7) <= mesCorte) add(acumulado, anio, n, d);
        vcHist += fila[3] || 0;
        if (fila[0] >= desde12) vc12 += fila[3] || 0;
      }
      return { ...e, porAnio, porMes, acumulado, vc12, vcHist };
    });

    // Años con datos (según la métrica)
    const conDatos = new Set();
    if (metrica.tipo === 'stock') {
      for (const e of porEmpresa) {
        for (const [anio, v] of Object.entries(CAPACIDAD.get(e.empresa) || {})) {
          if (v > 0.5) conDatos.add(anio);
        }
      }
    } else {
      for (const e of porEmpresa) {
        for (const [anio, c] of Object.entries(e.porAnio)) {
          if (Math.abs(c.n) > 0.5) conDatos.add(anio);
        }
      }
    }
    const anios = [...conDatos].sort();

    // Meses transcurridos de un año (el corriente corre hasta el último dato)
    const mesesDe = (a) => (a === String(anioActual) ? Number(mesCorte) : 12);

    // Cada columna devuelve el par {n, d} de una empresa
    const parAnio = (e, a) => {
      if (metrica.tipo === 'stock') return { n: cap(e.empresa, a), d: 0 };
      const c = e.porAnio[a] || { n: 0, d: 0 };
      if (metrica.tipo === 'ratio-capacidad') {
        return { n: c.n, d: (cap(e.empresa, a) * mesesDe(a)) / 12 };
      }
      return { ...c };
    };
    const parMes = (e, key, anio) => {
      if (metrica.tipo === 'stock') return { n: cap(e.empresa, anio), d: 0 };
      const c = e.porMes[key] || { n: 0, d: 0 };
      if (metrica.tipo === 'ratio-capacidad') {
        return { n: c.n, d: cap(e.empresa, anio) / 12 };
      }
      return { ...c };
    };
    const parAcum = (e, a) => {
      if (metrica.tipo === 'stock') return { n: cap(e.empresa, a), d: 0 };
      const c = e.acumulado[a] || { n: 0, d: 0 };
      if (metrica.tipo === 'ratio-capacidad') {
        return { n: c.n, d: (cap(e.empresa, a) * Number(mesCorte)) / 12 };
      }
      return { ...c };
    };

    // El tab Ver en Tableau no consume datos: solo el iframe del libro original
    if (modo === 'tableau') {
      return { cols: [], conDelta: false, gruposCat: [], total: [], anios: [] };
    }

    // Tab Gráficos (puntos 3-5 del libro): serie mensual del año elegido por
    // empresa, con categoría y grupo para agregar por nivel en los charts
    if (modo === 'graficos') {
      const tope = anioSel === String(anioActual) ? Number(mesCorte) : 12;
      const mesesChart = Array.from({ length: tope }, (_, i) =>
        `${anioSel}-${String(i + 1).padStart(2, '0')}`);
      const filasChart = porEmpresa
        .map((e) => ({
          empresa: e.empresa,
          categoria: e.categoria,
          grupo: e.supergrupo || e.grupo || e.empresa,
          meses: mesesChart.map((k) => parMes(e, k, anioSel)),
          anual: parAnio(e, anioSel),
        }))
        .filter((f) => Math.abs(f.anual.n) > 0.5 || f.anual.d > 0.5);
      return { cols: [], conDelta: false, gruposCat: [], total: [], anios, filasChart, mesesChart };
    }

    let cols;
    let conDelta = false;
    if (modo === 'anual') {
      cols = anios.map((a) => ({ key: a, label: a, par: (e) => parAnio(e, a) }));
      if (metrica.tipo !== 'stock') {
        cols.push({
          key: 'total-fila',
          label: 'Total',
          par: (e) => sumaPares(anios.map((a) => parAnio(e, a))),
        });
      }
    } else if (modo === 'mensual') {
      const tope = anioSel === String(anioActual) ? Number(mesCorte) : 12;
      const meses = Array.from({ length: tope }, (_, i) => {
        const mm = String(i + 1).padStart(2, '0');
        return { key: `${anioSel}-${mm}`, label: MESES_CORTOS[i] };
      });
      cols = meses.map((m) => ({ ...m, par: (e) => parMes(e, m.key, anioSel) }));
      if (metrica.tipo !== 'stock') {
        cols.push({
          key: 'total-anio',
          label: `Total ${anioSel}`,
          par: (e) => sumaPares(meses.map((m) => parMes(e, m.key, anioSel))),
        });
      }
    } else {
      const aniosComp = [anioActual - 2, anioActual - 1, anioActual].map(String);
      cols = aniosComp.map((a) => ({
        key: a,
        label: metrica.tipo === 'stock'
          ? a
          : `ene→${MESES_CORTOS[Number(mesCorte) - 1]} ${a}`,
        par: (e) => parAcum(e, a),
      }));
      conDelta = true;
    }

    // Agrupar: categoría → clusters por grupo económico
    const gruposCat = CATEGORIAS.filter(
      (c) => catFiltro === 'TODAS' || c === catFiltro
    )
      .map((cat) => {
        const filas = porEmpresa.filter((e) => e.categoria === cat);
        const porGrupo = new Map();
        for (const e of filas) {
          const clave = e.grupo || e.empresa;
          if (!porGrupo.has(clave)) porGrupo.set(clave, []);
          porGrupo.get(clave).push(e);
        }

        // Orden en No Integradas (pedido HDO): primero las que operan
        // (ventas al cupo en los últimos 12 meses), después las inactivas;
        // cada bloque en orden decreciente del acumulado de ventas al cupo.
        const ordenCupo = (a, b) =>
          (b.vc12 > 0.5) - (a.vc12 > 0.5) || b.vcHist - a.vcHist;

        const clusters = [...porGrupo.entries()]
          .map(([grupo, miembros]) => {
            const filasM = miembros
              .map((e) => ({
                empresa: e.empresa,
                valores: cols.map((c) => c.par(e)),
                vc12: e.vc12,
                vcHist: e.vcHist,
              }))
              .filter((f) =>
                f.valores.some((p) => Math.abs(p.n) > 0.5 ||
                  (metrica.tipo === 'ratio-capacidad' && p.d > 0.5))
              )
              .sort(
                cat === 'NO INTEGRADA'
                  ? ordenCupo
                  : (a, b) => sumaN(b.valores) - sumaN(a.valores)
              );
            return {
              grupo,
              supergrupo: miembros[0].supergrupo || null,
              miembros: filasM,
              valores: agregarColumnas(filasM, cols.length),
              vc12: filasM.reduce((s, f) => s + f.vc12, 0),
              vcHist: filasM.reduce((s, f) => s + f.vcHist, 0),
            };
          })
          .filter((c) => c.miembros.length > 0);

        // Nivel superior: los grupos con supergrupo se envuelven en un
        // cluster que los contiene (holdings de holdings)
        const porSuper = new Map();
        const nivel1 = [];
        for (const c of clusters) {
          if (c.supergrupo) {
            if (!porSuper.has(c.supergrupo)) porSuper.set(c.supergrupo, []);
            porSuper.get(c.supergrupo).push(c);
          } else {
            nivel1.push(c);
          }
        }
        for (const [nombre, subs] of porSuper) {
          nivel1.push({
            grupo: nombre,
            subgrupos: subs,
            miembros: subs.flatMap((s) => s.miembros),
            valores: agregarColumnas(subs, cols.length),
            vc12: subs.reduce((s, c) => s + c.vc12, 0),
            vcHist: subs.reduce((s, c) => s + c.vcHist, 0),
          });
        }
        const orden = cat === 'NO INTEGRADA'
          ? ordenCupo
          : (a, b) => sumaN(b.valores) - sumaN(a.valores);
        nivel1.sort(orden);
        for (const sc of nivel1) {
          if (sc.subgrupos) sc.subgrupos.sort(orden);
        }
        const clustersFinal = nivel1;

        // Las no integradas sin ventas al cupo en los últimos 12 meses se
        // agrupan bajo "Cesaron operaciones" (decisión HDO), desplegable
        if (cat === 'NO INTEGRADA') {
          const inactivos = clustersFinal.filter((c) => c.vc12 <= 0.5);
          if (inactivos.length > 1) {
            const miembros = inactivos
              .flatMap((c) => c.miembros)
              .sort((a, b) => b.vcHist - a.vcHist);
            const cesadas = {
              grupo: 'CESARON OPERACIONES',
              cesadas: true,
              miembros,
              valores: agregarColumnas(miembros, cols.length),
              vc12: 0,
              vcHist: miembros.reduce((s, f) => s + f.vcHist, 0),
            };
            clustersFinal.splice(
              clustersFinal.indexOf(inactivos[0]), clustersFinal.length, cesadas
            );
          }
        }

        return {
          cat,
          clusters: clustersFinal,
          subtotal: agregarColumnas(clustersFinal, cols.length),
        };
      })
      .filter((g) => g.clusters.length > 0);

    const total = agregarColumnas(gruposCat.map((g) => ({ valores: g.subtotal })), cols.length);

    return { cols, conDelta, gruposCat, total, anios };
  }, [metrica, catFiltro, modo, anioSel, mesCorte, anioActual, ultimoMes]);

  const { cols, conDelta, gruposCat, total, anios } = datos;
  const nCols = cols.length + (conDelta ? 1 : 0);

  // Encabezado congelado con scroll de página. El wrapper con overflow-x
  // anula el position:sticky vertical y Safari ignora transforms sobre
  // celdas de tabla, así que se usa la técnica universal: un clon del
  // encabezado en un contenedor fijo bajo la sub-nav, con anchos de
  // columna y scroll horizontal sincronizados con la tabla real.
  const wrapRef = useRef(null);
  const headerRef = useRef(null);
  useEffect(() => {
    const wrap = wrapRef.current;
    const head = headerRef.current;
    if (!wrap || !head) return undefined;
    const sincronizar = () => {
      const rect = wrap.getBoundingClientRect();
      const controles = document.querySelector('.mz-controles-sticky');
      const nav = document.querySelector('.section-nav');
      const topeNav = nav ? nav.getBoundingClientRect().bottom : 96;
      // En escritorio los controles son sticky y su base marca el tope; en
      // celular scrollean fuera de pantalla y el encabezado de columnas se
      // congela directo bajo la sub-nav (los bloques fijos se desactivan
      // por media query en pantallas chicas)
      const tope = controles
        ? Math.max(controles.getBoundingClientRect().bottom, topeNav)
        : topeNav;
      const visible = rect.top < tope && rect.bottom > tope + 80;
      head.style.display = visible ? 'block' : 'none';
      if (!visible) return;
      head.style.top = `${tope}px`;
      head.style.left = `${rect.left}px`;
      head.style.width = `${rect.width}px`;
      const reales = wrap.querySelectorAll('thead th');
      const clones = head.querySelectorAll('th');
      reales.forEach((th, i) => {
        if (clones[i]) {
          const w = th.getBoundingClientRect().width;
          clones[i].style.width = `${w}px`;
          clones[i].style.minWidth = `${w}px`;
          clones[i].style.maxWidth = `${w}px`;
        }
      });
      head.scrollLeft = wrap.scrollLeft;
    };
    window.addEventListener('scroll', sincronizar, { passive: true });
    window.addEventListener('resize', sincronizar, { passive: true });
    wrap.addEventListener('scroll', sincronizar, { passive: true });
    sincronizar();
    return () => {
      window.removeEventListener('scroll', sincronizar);
      window.removeEventListener('resize', sincronizar);
      wrap.removeEventListener('scroll', sincronizar);
    };
  }, [datos]);

  const filaEncabezado = (
    <tr>
      <th className="mz-fija">Empresa / Grupo</th>
      {cols.map((c) => (
        <th key={c.key} className="num">{c.label}</th>
      ))}
      {conDelta && <th className="num">Δ vs {anioActual - 1}</th>}
    </tr>
  );

  // Valor de exhibición de un par {n, d} según la clase de métrica
  const mostrar = (p) => {
    if (esRatio) {
      if (!p.d || p.d < 0.5) return '';
      return fmt.pct((p.n / p.d) * 100);
    }
    return Math.abs(p.n) > 0.5 ? fmt.int(p.n) : '';
  };

  // Variación para el modo comparación: pp en ratios, % en volúmenes
  const variacion = (valores) => {
    const [prev, act] = [valores[1], valores[2]];
    if (esRatio) {
      if (!prev.d || !act.d || prev.d < 0.5 || act.d < 0.5) return null;
      return { pp: (act.n / act.d - prev.n / prev.d) * 100 };
    }
    if (!prev.n || Math.abs(prev.n) < 0.5) return null;
    return { pct: ((act.n - prev.n) / Math.abs(prev.n)) * 100 };
  };

  const intro = {
    anual: metrica.tipo === 'stock'
      ? 'Capacidad instalada por empresa, foto de cada año, en toneladas/año.'
      : esRatio
        ? `${metrica.label}, año por año. Los agregados se calculan sobre los volúmenes, no como promedio de porcentajes.`
        : `${metrica.label} en toneladas, año por año. ${anioActual} corre hasta ${fmt.monthShort(ultimoMes)}.`,
    mensual: metrica.tipo === 'stock'
      ? `Capacidad instalada vigente en ${anioSel} (la foto es anual: no varía mes a mes).`
      : `${metrica.label}${esRatio ? '' : ' en toneladas'}, mes a mes de ${anioSel}.`,
    comparar: metrica.tipo === 'stock'
      ? 'Capacidad instalada de los últimos tres años, con su variación.'
      : `${metrica.label} acumulad${esRatio ? 'o' : 'as'} de enero a ${MESES_CORTOS[Number(mesCorte) - 1]} en cada año, con la variación contra el año anterior.`,
    graficos: `${metrica.label} de ${anioSel} en gráficos: participación de mercado y evolución mensual, por categoría, grupo económico o empresa.`,
  }[modo];

  return (
    <div className="mh-cuadro mz">
      <div className="mz-controles-sticky">
      <p className="section-kicker">Mercado Biodiesel</p>
      <h2>{seccion?.title ?? 'Detalle de ventas'}</h2>
      {seccion?.intro && <p className="section-intro">{seccion.intro}</p>}
      <div className="mh-tabs" role="tablist">
        {[['anual', 'Serie anual'], ['mensual', 'Apertura mensual'], ['comparar', 'Comparar períodos'], ['graficos', 'Gráficos']].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={modo === id}
            className={modo === id ? 'active' : ''}
            onClick={() => setModo(id)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'tableau'}
          className={`mh-tab-derecha ${modo === 'tableau' ? 'active' : ''}`}
          onClick={() => setModo('tableau')}
        >
          Ver en Tableau
        </button>
      </div>
      {modo !== 'tableau' && (
      <div className="empresa-selector-row mh-selectores">
        <label htmlFor="mz-metrica">Métrica</label>
        <select
          id="mz-metrica" className="empresa-select"
          value={metricaId} onChange={(e) => setMetricaId(e.target.value)}
        >
          {METRICAS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
        <label htmlFor="mz-cat">Categoría</label>
        <select
          id="mz-cat" className="empresa-select"
          value={catFiltro} onChange={(e) => setCatFiltro(e.target.value)}
        >
          <option value="TODAS">Todas</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{ETIQUETA_CAT[c]}</option>
          ))}
        </select>
        {(modo === 'mensual' || modo === 'graficos') && (
          <>
            <label htmlFor="mz-anio">Año</label>
            <select
              id="mz-anio" className="empresa-select"
              value={anioSel} onChange={(e) => setAnioSel(e.target.value)}
            >
              {[...anios].reverse().map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </>
        )}
      </div>
      )}
      </div>

      {modo === 'tableau' && (
        <iframe
          title="Tablero Tableau - MERCADO INTERNO Info Explorarg"
          width="100%"
          height="1200"
          frameBorder="0"
          style={{ margin: 0, padding: 0 }}
          src="https://sd-3088058-w.ferozo.com/tableau/02MARKETINDUSTRY-MERCADOINTERNOBIODIESEL/MERCADOINTERNOInfoExplorarg"
        />
      )}
      {modo === 'graficos' && (
        <MatrizGraficos
          filas={datos.filasChart}
          meses={datos.mesesChart}
          metrica={metrica}
          anio={anioSel}
        />
      )}
      {modo !== 'graficos' && modo !== 'tableau' && (
      <>
      <div className="mz-header-flotante" ref={headerRef} aria-hidden="true">
        <table className="mh-tabla mz-tabla">
          <thead>{filaEncabezado}</thead>
        </table>
      </div>
      <div className="mh-tabla-scroll" ref={wrapRef}>
        <table className="mh-tabla mz-tabla">
          <thead>{filaEncabezado}</thead>
          <tbody>
            {gruposCat.map((g) => (
              <FilasCategoria
                key={g.cat}
                grupo={g}
                nCols={nCols}
                conDelta={conDelta}
                mostrar={mostrar}
                variacion={variacion}
                expandidos={expandidos}
                toggleGrupo={toggleGrupo}
              />
            ))}
            <tr className="mz-total">
              <td className="mz-fija">Total</td>
              {total.map((p, i) => (
                <td key={i} className="num">{mostrar(p)}</td>
              ))}
              {conDelta && <VarCelda v={variacion(total)} />}
            </tr>
          </tbody>
        </table>
      </div>
      </>
      )}
      {modo !== 'tableau' && (
      <>
      <p className="mz-leyenda">
        {intro}{modo !== 'graficos' && (
          ' Los grupos económicos muestran el total del holding: desplegalos para ver sus empresas.'
        )}
      </p>
      <p className="note">
        Fuente: Secretaría de Energía, reportes mensuales de biocombustibles; capacidad
        instalada según el registro de plantas de explorarg. Ventas fuera de cupo:
        operaciones al mercado interno no imputadas al cupo asignado. En las métricas
        porcentuales, los agregados surgen de los volúmenes de cada conjunto.
      </p>
      </>
      )}
    </div>
  );
}

const sumaN = (pares) => pares.reduce((s, p) => s + p.n, 0);

const sumaPares = (pares) =>
  pares.reduce((s, p) => ({ n: s.n + p.n, d: s.d + p.d }), { n: 0, d: 0 });

// Suma columna a columna los pares de un conjunto de filas
const agregarColumnas = (filas, nCols) =>
  Array.from({ length: nCols }, (_, i) =>
    sumaPares(filas.map((f) => f.valores[i] || { n: 0, d: 0 }))
  );

function FilasCategoria({ grupo, nCols, conDelta, mostrar, variacion, expandidos, toggleGrupo }) {
  return (
    <>
      <tr className="mz-cat">
        <td className="mz-fija">{ETIQUETA_CAT[grupo.cat]}</td>
        <td colSpan={nCols} />
      </tr>
      {grupo.clusters.map((c) => {
        if (c.miembros.length === 1 && !c.subgrupos) {
          const f = c.miembros[0];
          return (
            <tr key={c.grupo}>
              <td className="mz-fija mz-sangria">{f.empresa}</td>
              {f.valores.map((p, i) => (
                <td key={i} className="num">{mostrar(p)}</td>
              ))}
              {conDelta && <VarCelda v={variacion(f.valores)} />}
            </tr>
          );
        }
        return (
          <FilasGrupoEconomico
            key={c.grupo}
            cluster={c}
            conDelta={conDelta}
            mostrar={mostrar}
            variacion={variacion}
            expandidos={expandidos}
            toggleGrupo={toggleGrupo}
          />
        );
      })}
      <tr className="mz-subtotal">
        <td className="mz-fija">Subtotal {ETIQUETA_CAT[grupo.cat].toLowerCase()}</td>
        {grupo.subtotal.map((p, i) => (
          <td key={i} className="num">{mostrar(p)}</td>
        ))}
        {conDelta && <VarCelda v={variacion(grupo.subtotal)} />}
      </tr>
    </>
  );
}

function FilasGrupoEconomico({ cluster, conDelta, mostrar, variacion, expandidos, toggleGrupo, nivel = 0 }) {
  const abierto = expandidos.has(cluster.grupo);
  const sangriaGrupo = nivel === 0 ? 'mz-sangria' : 'mz-miembro';
  const sangriaHijo = nivel === 0 ? 'mz-miembro' : 'mz-miembro-2';
  return (
    <>
      <tr className={`mz-grupo${cluster.cesadas ? ' mz-cesadas' : ''}`}>
        <td className={`mz-fija ${sangriaGrupo}`}>
          <button
            type="button"
            className="mz-desplegar"
            aria-expanded={abierto}
            onClick={() => toggleGrupo(cluster.grupo)}
          >
            {cluster.grupo}
            <span className="mz-cant">
              ({cluster.subgrupos ? `${cluster.subgrupos.length} grupos` : cluster.miembros.length})
            </span>
            <span className="mz-flecha">{abierto ? '▾' : '▸'}</span>
          </button>
        </td>
        {cluster.valores.map((p, i) => (
          <td key={i} className="num">{mostrar(p)}</td>
        ))}
        {conDelta && <VarCelda v={variacion(cluster.valores)} />}
      </tr>
      {abierto && cluster.subgrupos &&
        cluster.subgrupos.map((sg) => (
          <FilasGrupoEconomico
            key={sg.grupo}
            cluster={sg}
            conDelta={conDelta}
            mostrar={mostrar}
            variacion={variacion}
            expandidos={expandidos}
            toggleGrupo={toggleGrupo}
            nivel={nivel + 1}
          />
        ))}
      {abierto && !cluster.subgrupos &&
        cluster.miembros.map((f) => (
          <tr key={f.empresa} className={`mz-fila-miembro${cluster.cesadas ? ' mz-cesadas' : ''}`}>
            <td className={`mz-fija ${sangriaHijo}`}>{f.empresa}</td>
            {f.valores.map((p, i) => (
              <td key={i} className="num">{mostrar(p)}</td>
            ))}
            {conDelta && <VarCelda v={variacion(f.valores)} />}
          </tr>
        ))}
    </>
  );
}

function VarCelda({ v }) {
  if (v === null) return <td className="num">-</td>;
  const mag = v.pp !== undefined ? v.pp : v.pct;
  const tone = mag > 0.05 ? 'ok' : mag < -0.05 ? 'bajo' : '';
  const texto = v.pp !== undefined
    ? `${fmt.pct(Math.abs(v.pp)).replace('%', '')} pp`
    : fmt.pct(Math.abs(v.pct));
  return (
    <td className={`num cumplimiento ${tone}`}>
      {mag > 0 ? '▲' : mag < 0 ? '▼' : ''}{texto}
    </td>
  );
}
