import corte from '../data/corte.json';
import petroleras from '../data/petroleras.json';

/**
 * Demanda de biodiesel por vendedora de gas oil, últimos 12 meses con dato:
 * para cada empresa que vendió GO G2+G3 (sin destinos exentos), cuánto bio
 * requería su volumen según el corte obligatorio vigente y cuánto compró
 * efectivamente a las elaboradoras. Las que no aparecen en la matriz de
 * compras no compraron biodiesel.
 */

const DENSIDAD = corte.densidad_bio;
const OBLIG = new Map(corte.mensual.map((m) => [m.fecha, m.obligatorio]));

export function demandaPetroleras12m(mesHasta = null) {
  const meses = petroleras.go_empresas_mensual.filter(
    (r) => OBLIG.get(r.fecha) != null && (!mesHasta || r.fecha <= mesHasta)
  );
  const ult12 = meses.slice(-12);
  const fechas = new Set(ult12.map((r) => r.fecha));

  const go = new Map();
  const requerido = new Map();
  for (const row of ult12) {
    const oblig = OBLIG.get(row.fecha);
    for (const [emp, v] of Object.entries(row)) {
      if (emp === 'fecha' || !v) continue;
      go.set(emp, (go.get(emp) || 0) + v);
      requerido.set(emp, (requerido.get(emp) || 0) + v * oblig);
    }
  }

  const comprado = new Map();
  for (const row of petroleras.mensual) {
    if (!fechas.has(row.fecha)) continue;
    for (const [emp, ton] of Object.entries(row)) {
      if (emp === 'fecha' || !ton) continue;
      comprado.set(emp, (comprado.get(emp) || 0) + ton / DENSIDAD);
    }
  }

  const filas = [...go.entries()]
    .filter(([, v]) => v > 100) // vendedoras marginales fuera del cuadro
    .map(([empresa, goM3]) => {
      const req = requerido.get(empresa) || 0;
      const comp = comprado.get(empresa) || 0;
      return {
        empresa,
        go: goM3,
        requerido: req,
        comprado: comp,
        cumplimiento: req > 0 ? (comp / req) * 100 : null,
        faltanteTon: Math.max(0, (req - comp) * DENSIDAD),
      };
    })
    .sort((a, b) => b.go - a.go);

  return {
    filas,
    desde: ult12[0]?.fecha,
    hasta: ult12.at(-1)?.fecha,
  };
}

/** Vendedoras que compran ínfimamente o nada (< umbral % de lo requerido). */
export function sinDemanda(filas, umbral = 20) {
  return filas.filter((f) => f.cumplimiento !== null && f.cumplimiento < umbral);
}
