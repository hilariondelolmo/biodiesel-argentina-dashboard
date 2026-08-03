import gestion from '../../data/gestion.json';
import { fmt } from '../../lib/format.js';
import './Gestion.css';

/**
 * Los cambios de fórmula de precio del biodiesel dictados por la Autoridad
 * de Aplicación desde 2010. SE 963/2023 destacada: es la fórmula vigente,
 * cuestionada judicialmente (art. 5, Expte. 19482/2025).
 */
export default function FormulasPrecios() {
  const periodos = gestion.formulas_periodos;

  return (
    <>
      <div className="formulas-grid">
        {periodos.map((p, i) => {
          const hasta = periodos[i + 1]?.desde;
          return (
            <div
              key={p.formula + p.desde}
              className={`formula-chip ${p.formula === 'SE 963/2023' ? 'destacada' : ''}`}
            >
              <div className="formula-chip-nombre">{p.formula}</div>
              <div className="formula-chip-desde">
                {fmt.monthShort(p.desde)} → {hasta ? fmt.monthShort(hasta) : 'vigente'}
              </div>
            </div>
          );
        })}
      </div>
      <p className="note">
        {periodos.length} fórmulas o ajustes de precio en{' '}
        {new Date().getFullYear() - 2010} años - un cambio cada ~
        {Math.round(((new Date().getFullYear() - 2010) * 12) / periodos.length)} meses.
        La SE 963/2023 (marcada) es la fórmula vigente; la aplicación de su art. 5 a las
        empresas no integradas es objeto de una demanda de nulidad en trámite
        (Expte. 19482/2025).
      </p>
    </>
  );
}
