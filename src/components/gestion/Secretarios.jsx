import { useState } from 'react';
import gestion from '../../data/gestion.json';
import { fmt } from '../../lib/format.js';
import './Gestion.css';
import '../charts/Chart.css';

const DESDE_BIODIESEL = '2006-01-01'; // sanción de la Ley 26.093

function duracionMeses(desde, hasta) {
  const a = new Date(desde);
  const b = hasta ? new Date(hasta) : new Date();
  return Math.max(1, Math.round((b - a) / (30.44 * 24 * 3600 * 1000)));
}

// El hyper llena el egreso del funcionario en funciones con el último mes de
// datos: el egreso más alto de cada lista se trata como "en funciones".
function normalizarActual(lista, campo = 'hasta') {
  const max = lista.reduce((m, s) => (s[campo] && s[campo] > m ? s[campo] : m), '');
  return lista.map((s) => (s[campo] === max ? { ...s, [campo]: null } : s));
}

export default function Secretarios() {
  const [nivel, setNivel] = useState('secretarios');
  const [todos, setTodos] = useState(false);

  const secretarios = normalizarActual(gestion.secretarios)
    .filter((s) => todos || !s.hasta || s.hasta >= DESDE_BIODIESEL)
    .slice()
    .reverse();
  const subsecretarios = normalizarActual(gestion.subsecretarios).slice().reverse();

  const esSec = nivel === 'secretarios';
  const lista = esSec ? secretarios : subsecretarios;

  return (
    <>
      <div className="chart-range-selector" style={{ marginBottom: '1.2rem' }}>
        <button className={esSec ? 'active' : ''} onClick={() => setNivel('secretarios')}>
          Secretarios/as de Energía
        </button>
        <button className={!esSec ? 'active' : ''} onClick={() => setNivel('subsecretarios')}>
          Subsecretarios · área hidrocarburos
        </button>
      </div>
      <div className="secretarios-lista">
        {lista.map((s) => {
          const meses = duracionMeses(s.desde, s.hasta);
          return (
            <div
              key={`${s.nombre}-${s.desde}`}
              className={`secretario-item ${s.hasta ? '' : 'actual'}`}
            >
              <div className="secretario-nombre">
                {s.nombre}
                {!s.hasta && ' · en funciones'}
              </div>
              <div className="secretario-meta">
                {fmt.monthShort(s.desde.slice(0, 7))} →{' '}
                {s.hasta ? fmt.monthShort(s.hasta.slice(0, 7)) : 'hoy'}
                {' · '}{meses} meses · Presidencia {s.presidente}
                {esSec && s.coalicion ? ` · ${s.coalicion}` : ''}
              </div>
              {!esSec && (
                <div className="secretario-meta">
                  {s.cargo}
                  {s.nombramiento ? ` · ${s.nombramiento}` : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {esSec && (
        <button className="secretarios-toggle" onClick={() => setTodos((v) => !v)}>
          {todos
            ? 'Ver solo era biodiesel (2006→)'
            : `Ver historia completa (${gestion.secretarios.length} desde 1958)`}
        </button>
      )}
    </>
  );
}
