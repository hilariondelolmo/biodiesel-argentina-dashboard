import { fmt } from '../../lib/format.js';
import { demandaPetroleras12m } from '../../lib/demandaPetroleras.js';
import './Mercado.css';

/**
 * Cuadro: quién vende gas oil y cuánto biodiesel compra contra lo que su
 * volumen requiere. Las filas con compra ínfima o nula quedan resaltadas.
 */
export default function DemandaPetroleras({ mes }) {
  const { filas, desde, hasta } = demandaPetroleras12m(mes);

  return (
    <div className="mh-cuadro">
      <h3 className="mh-subtitulo">
        Ventas de gas oil y compras de biodiesel por petrolera
      </h3>
      <p className="section-intro">
        Últimos 12 meses ({fmt.monthShort(desde)} → {fmt.monthShort(hasta)}) · el requerido
        surge del gas oil grados 2 y 3 vendido (sin destinos exentos) por el corte obligatorio
        vigente cada mes. Resaltadas: compras por debajo del 20% de lo requerido.
      </p>
      <div className="mh-tabla-scroll">
        <table className="mh-tabla">
          <thead>
            <tr>
              <th>Petrolera</th>
              <th className="num">GO vendido (m³)</th>
              <th className="num">Bio requerido (m³)</th>
              <th className="num">Bio comprado (m³)</th>
              <th className="num">Cumplimiento</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const critica = f.cumplimiento !== null && f.cumplimiento < 20;
              const tone =
                f.cumplimiento === null ? '' :
                f.cumplimiento >= 95 ? 'ok' : f.cumplimiento >= 80 ? 'medio' : 'bajo';
              return (
                <tr key={f.empresa} className={critica ? 'critica' : ''}>
                  <td>{f.empresa}</td>
                  <td className="num">{fmt.int(f.go)}</td>
                  <td className="num">{fmt.int(f.requerido)}</td>
                  <td className="num">{f.comprado > 0 ? fmt.int(f.comprado) : '0'}</td>
                  <td className={`num cumplimiento ${tone}`}>
                    {f.cumplimiento === null ? '-' : fmt.pct(f.cumplimiento)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="note">
        Fuente: Secretaría de Energía - ventas de derivados por empresa y matriz de compras de
        biodiesel a elaboradoras. Las vendedoras que no figuran en la matriz de compras no
        registran compras de biodiesel; parte de ellas revende gas oil ya mezclado.
      </p>
    </div>
  );
}
