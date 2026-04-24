import data from '../data/dashboard.json';
import { fmt } from '../lib/format.js';
import './Hero.css';

export default function Hero() {
  const lastMonth = data.mensual[data.mensual.length - 1];
  const last12 = data.mensual.slice(-12);
  const sum12 = (key) => last12.reduce((acc, m) => acc + (m[key] || 0), 0);
  const producedLast12 = sum12('PRODUCTION [ton]');
  const quotaSalesLast12 = sum12('BIODIESEL QUOTA SALES [ton]');
  const exportsLast12 = sum12('BIODIESEL EXPORTS [ton]');
  const complianceLast12 = (quotaSalesLast12 / sum12('BIODIESEL QUOTA [ton]')) * 100;

  return (
    <header id="hero" className="hero">
      <div className="container">
        <div className="hero-eyebrow">Mercado argentino de biodiesel · 2008–2026</div>
        <h1 className="hero-title">
          Un tablero público sobre <em>la estructura real</em> del mercado de biodiesel en Argentina.
        </h1>
        <p className="hero-lede">
          Datos mensuales de producción, ventas y cumplimiento de cupo, empresa por empresa, basados
          en reportes oficiales de la Secretaría de Energía. Cruzados con el marco regulatorio
          vigente y con análisis de posición propios. Compilado y mantenido por Explora S.A.
        </p>

        <div className="hero-kpis">
          <div className="hero-kpi">
            <div className="hero-kpi-label">Producción últimos 12 meses</div>
            <div className="hero-kpi-val">{fmt.int(producedLast12)}</div>
            <div className="hero-kpi-sub">toneladas</div>
          </div>
          <div className="hero-kpi">
            <div className="hero-kpi-label">Ventas al corte obligatorio</div>
            <div className="hero-kpi-val">{fmt.int(quotaSalesLast12)}</div>
            <div className="hero-kpi-sub">toneladas · mercado interno</div>
          </div>
          <div className="hero-kpi">
            <div className="hero-kpi-label">Exportaciones</div>
            <div className="hero-kpi-val">{fmt.int(exportsLast12)}</div>
            <div className="hero-kpi-sub">toneladas · 12 meses</div>
          </div>
          <div className="hero-kpi">
            <div className="hero-kpi-label">Cumplimiento agregado</div>
            <div className="hero-kpi-val">{fmt.pct(complianceLast12)}</div>
            <div className="hero-kpi-sub">ventas / cupo asignado</div>
          </div>
        </div>

        <div className="hero-meta">
          <span><strong>52 empresas elaboradoras únicas</strong> (10 integradas + 36 no integradas + 6 comercializadoras)</span>
          <span>·</span>
          <span>Último dato disponible: <strong>{fmt.monthShort(lastMonth.FECHA)}</strong></span>
        </div>
      </div>
    </header>
  );
}
