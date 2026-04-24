import data from '../data/dashboard.json';
import KPIs from './KPIs.jsx';
import EmpresasChart from './charts/EmpresasChart.jsx';
import PetrolerasChart from './charts/PetrolerasChart.jsx';
import GruposChart from './charts/GruposChart.jsx';
import ProvinciaChart from './charts/ProvinciaChart.jsx';
import { fmt } from '../lib/format.js';
import './Ventas.css';

export default function Ventas() {
  const top = data.top_empresas_12m;
  const explora = top.find((e) => e['EMPRESA ELABORADORA'] === 'EXPLORA S.A.');

  const integradas = top.filter((e) => e.CATEGORIA === 'INTEGRADA');
  const noIntegradas = top.filter((e) => e.CATEGORIA === 'NO INTEGRADA');
  const prodInt = integradas.reduce((a, e) => a + e['PRODUCTION [ton]'], 0);
  const prodNoInt = noIntegradas.reduce((a, e) => a + e['PRODUCTION [ton]'], 0);

  const totalPetroleras = data.ventas_petroleras_12m.reduce((a, p) => a + p.TONELADAS, 0);
  const ypf = data.ventas_petroleras_12m.find((p) => p.PETROLERA.includes('YPF'));
  const ypfShare = ypf ? (ypf.TONELADAS / totalPetroleras) * 100 : 0;

  const santaFe = data.provincia_12m.find((p) => p.PROVINCIA.toUpperCase().includes('SANTA FE'));
  const totalProv = data.provincia_12m.reduce((a, p) => a + p['PRODUCTION [ton]'], 0);
  const sfShare = santaFe ? (santaFe['PRODUCTION [ton]'] / totalProv) * 100 : 0;

  const kpis = [
    { label: 'Top empresa', value: fmt.truncate(top[0]['EMPRESA ELABORADORA'], 18), sub: fmt.int(top[0]['PRODUCTION [ton]']) + ' ton · 12m' },
    { label: 'Explora S.A.', value: explora ? fmt.int(explora['PRODUCTION [ton]']) : '—', sub: explora ? `cumplimiento ${fmt.pct(explora['CUMPLIMIENTO %'])}` : '', tone: 'info' },
    { label: 'YPF · share', value: fmt.pct(ypfShare), sub: 'de las compras totales al corte' },
    { label: 'Santa Fe · share', value: fmt.pct(sfShare), sub: 'de la producción nacional', tone: 'warn' },
    { label: 'Integradas · top', value: fmt.int(prodInt), sub: `ton · ${integradas.length} empresas en top 20` },
    { label: 'No integradas · top', value: fmt.int(prodNoInt), sub: `ton · ${noIntegradas.length} empresas en top 20` },
  ];

  return (
    <section id="ventas">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">Sección 2</div>
          <h2>Detalle de ventas y estructura del mercado</h2>
          <p>
            Quién produce cuánto, quién compra cuánto, y dónde está la capacidad instalada. La
            estructura revela la concentración real del mercado aguas arriba (producción) y aguas
            abajo (mezcla por las refinerías).
          </p>
        </div>
        <KPIs items={kpis} />
        <EmpresasChart />
        <PetrolerasChart />
        <GruposChart />
        <ProvinciaChart />

        <div className="tabla-detalle-wrap">
          <div className="chart-card-header">
            <div>
              <span className="chart-card-title">Tabla detallada · empresas elaboradoras</span>
              <span className="chart-card-subtitle">últimos 12 meses · ordenado por producción · Explora marcada con ◆</span>
            </div>
          </div>
          <div className="tabla-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Categoría</th>
                  <th style={{textAlign:'right'}}>Producción (ton)</th>
                  <th style={{textAlign:'right'}}>Ventas corte (ton)</th>
                  <th style={{textAlign:'right'}}>Exportaciones (ton)</th>
                  <th style={{textAlign:'right'}}>Cupo (ton)</th>
                  <th style={{textAlign:'right'}}>Cumplimiento</th>
                </tr>
              </thead>
              <tbody>
                {top.map((e, i) => {
                  const isExplora = e['EMPRESA ELABORADORA'] === 'EXPLORA S.A.';
                  return (
                    <tr key={i} className={isExplora ? 'row-explora' : ''}>
                      <td>
                        {isExplora && <span className="marker">◆</span>}
                        {e['EMPRESA ELABORADORA']}
                      </td>
                      <td>
                        <span className={`cat-badge cat-${e.CATEGORIA.replace(' ', '-').toLowerCase()}`}>
                          {e.CATEGORIA}
                        </span>
                      </td>
                      <td style={{textAlign:'right'}}>{fmt.int(e['PRODUCTION [ton]'])}</td>
                      <td style={{textAlign:'right'}}>{fmt.int(e['BIODIESEL QUOTA SALES [ton]'])}</td>
                      <td style={{textAlign:'right'}}>{fmt.int(e['BIODIESEL EXPORTS [ton]'])}</td>
                      <td style={{textAlign:'right'}}>{fmt.int(e['BIODIESEL QUOTA [ton]'])}</td>
                      <td style={{textAlign:'right'}}>{fmt.pct(e['CUMPLIMIENTO %'])}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="note">
            Últimos 12 meses · ordenado por producción · la mayoría de integradas exporta sin
            abastecer al corte; las no integradas venden al mercado interno mandatorio. Patagonia
            Bioenergía es el caso mixto.
          </div>
        </div>
      </div>
    </section>
  );
}
