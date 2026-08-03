import corte from '../../data/corte.json';
import mercado from '../../data/mercado.json';
import { fmt } from '../../lib/format.js';
import './Mercado.css';

/**
 * Conclusiones calculadas en vivo sobre los dos análisis de la sección:
 * corte obligatorio y asignación de cupos. Todo sale de los mismos JSON que
 * alimentan los cuadros — sin cifras redactadas a mano que puedan envejecer.
 *
 * Descomposición del incumplimiento en cada ventana:
 *   mandato (GO × %oblig, en ton) − entregado
 *     = (mandato − asignado)   → brecha de asignación (SE)
 *     + (asignado − entregado) → brecha de entrega (elaboradoras)
 */

const DENSIDAD = corte.densidad_bio;
const CM = corte.mensual.filter((r) => r.obligatorio !== null);
const MM = new Map(mercado.mensual.map((r) => [r.fecha, r]));

function stats(rows) {
  const go = rows.reduce((s, r) => s + r.go_m3, 0);
  const bio = rows.reduce((s, r) => s + r.bio_m3, 0);
  const oblig = rows.reduce((s, r) => s + r.obligatorio * r.go_m3, 0) / go;
  const mandato = go * oblig * DENSIDAD;
  const asig = rows.reduce((s, r) => s + (MM.get(r.fecha)?.cupo || 0), 0);
  const vc = rows.reduce((s, r) => s + (MM.get(r.fecha)?.vc || 0), 0);
  return {
    real: (bio / go) * 100,
    oblig: oblig * 100,
    mandato,
    asig,
    vc,
    brechaAsig: mandato - asig,
    brechaEntrega: asig - vc,
    total: mandato - vc,
    coberturaAsig: (asig / mandato) * 100,
    cumplEntrega: (vc / asig) * 100,
  };
}

export default function ConclusionesIndicadores() {
  const ult = CM.at(-1).fecha;
  const anio = ult.slice(0, 4);
  const ytd = stats(CM.filter((r) => r.fecha >= `${anio}-01`));
  const u12 = stats(CM.slice(-12));

  const pAsigYtd = (ytd.brechaAsig / ytd.total) * 100;
  const pAsig12 = (u12.brechaAsig / u12.total) * 100;

  return (
    <div className="mh-conclusiones">
      <div className="mh-conclusiones-titulo">Conclusiones</div>
      <ul>
        <li>
          <strong>El corte no se cumple.</strong> En lo que va de {anio} el corte real promedió{' '}
          {fmt.pct(ytd.real)} contra un obligatorio de {fmt.pct(ytd.oblig)}; en los últimos doce
          meses, {fmt.pct(u12.real)} contra {fmt.pct(u12.oblig)}. El mandato requería{' '}
          {fmt.int(u12.mandato)} ton de biodiesel en el año móvil y se entregaron{' '}
          {fmt.int(u12.vc)}: faltaron {fmt.int(u12.total)} ton.
        </li>
        <li>
          <strong>La asignación nace corta.</strong> La Secretaría de Energía asignó{' '}
          {fmt.int(ytd.asig)} ton en {anio} cuando el mandato requería {fmt.int(ytd.mandato)}: la
          asignación cubre el {fmt.pct(ytd.coberturaAsig, 0)} del corte obligatorio. Aun con
          entrega perfecta del cupo, el corte real no puede alcanzar el obligatorio.
        </li>
        <li>
          <strong>Las elaboradoras entregan lo que se les asigna.</strong> En {anio} el
          cumplimiento de la asignación es del {fmt.pct(ytd.cumplEntrega)}: de la brecha total
          de {fmt.int(ytd.total)} ton del año, {fmt.int(ytd.brechaAsig)} ton (
          {fmt.pct(pAsigYtd, 0)}) corresponden a cupo no asignado por la autoridad y{' '}
          {fmt.int(ytd.brechaEntrega)} ton a asignaciones no entregadas.
        </li>
        <li>
          <strong>La ventana de doce meses aún carga la sub-entrega de {Number(anio) - 1}.</strong>{' '}
          En el año móvil el cumplimiento de la asignación baja al {fmt.pct(u12.cumplEntrega)}:
          la brecha de entrega ({fmt.int(u12.brechaEntrega)} ton) supera allí a la de
          asignación ({fmt.int(u12.brechaAsig)} ton, {fmt.pct(pAsig12, 0)} del total). La
          normalización de las entregas en {anio} todavía no se refleja completa en la ventana
          móvil.
        </li>
      </ul>
      <p className="mh-conclusiones-sintesis">
        El incumplimiento del corte tiene origen administrativo antes que industrial: la
        asignación de cupos de la Secretaría de Energía cubre el {fmt.pct(ytd.coberturaAsig, 0)}{' '}
        de lo que la propia norma exige, y las elaboradoras entregan el{' '}
        {fmt.pct(ytd.cumplEntrega, 0)} de lo que se les asigna.
      </p>
    </div>
  );
}
