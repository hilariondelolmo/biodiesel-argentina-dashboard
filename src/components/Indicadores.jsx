import data from '../data/dashboard.json';
import KPIs from './KPIs.jsx';
import MonthlyChart from './charts/MonthlyChart.jsx';
import AnualChart from './charts/AnualChart.jsx';
import CategoriaChart from './charts/CategoriaChart.jsx';
import { fmt } from '../lib/format.js';

export default function Indicadores() {
  const last12 = data.mensual.slice(-12);
  const prev12 = data.mensual.slice(-24, -12);
  const sum = (arr, k) => arr.reduce((a, m) => a + (m[k] || 0), 0);

  const prod12 = sum(last12, 'PRODUCTION [ton]');
  const prodPrev = sum(prev12, 'PRODUCTION [ton]');
  const prodDelta = ((prod12 - prodPrev) / prodPrev) * 100;

  const ventasCorte12 = sum(last12, 'BIODIESEL QUOTA SALES [ton]');
  const cupo12 = sum(last12, 'BIODIESEL QUOTA [ton]');
  const cumplimiento = (ventasCorte12 / cupo12) * 100;

  const exp12 = sum(last12, 'BIODIESEL EXPORTS [ton]');
  const fuera12 = sum(last12, 'BIODIESEL XQUOTA SALES [ton]');

  const lastAnio = data.anual[data.anual.length - 1];
  const peakAnio = data.anual.reduce((max, a) =>
    a['PRODUCTION [ton]'] > (max['PRODUCTION [ton]'] || 0) ? a : max
  , {});

  const kpis = [
    { label: 'Producción 12m', value: fmt.int(prod12), sub: `ton · ${fmt.pct(prodDelta, 1)} vs 12m previos`, tone: prodDelta >= 0 ? 'pos' : 'neg' },
    { label: 'Ventas corte 12m', value: fmt.int(ventasCorte12), sub: 'toneladas · mercado interno mandatorio' },
    { label: 'Exportaciones 12m', value: fmt.int(exp12), sub: 'toneladas' },
    { label: 'Fuera de corte 12m', value: fmt.int(fuera12), sub: 'toneladas · mercado interno voluntario' },
    { label: 'Cumplimiento cupo', value: fmt.pct(cumplimiento), sub: 'ventas / cupo asignado · 12m', tone: 'info' },
    { label: 'Pico histórico', value: fmt.int(peakAnio['PRODUCTION [ton]']), sub: `toneladas · año ${peakAnio.AÑO}`, tone: 'warn' },
    { label: 'Último año completo', value: fmt.int(lastAnio['PRODUCTION [ton]']), sub: `toneladas · ${lastAnio.AÑO}` },
  ];

  return (
    <section id="indicadores">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">Sección 1</div>
          <h2>Principales indicadores</h2>
          <p>
            La producción total del país, desagregada por destino. La distancia entre el cupo
            asignado y las ventas efectivas al corte es el indicador más relevante del nivel
            de cumplimiento del mandato legal.
          </p>
        </div>
        <KPIs items={kpis} />
        <MonthlyChart />
        <AnualChart />
        <CategoriaChart />
      </div>
    </section>
  );
}
