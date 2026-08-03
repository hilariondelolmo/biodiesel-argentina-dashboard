import SectionNav from '../components/SectionNav.jsx';
import ResumenGestion from '../components/gestion/ResumenGestion.jsx';
import CorteRealChart from '../components/gestion/CorteRealChart.jsx';
import DeficitChart from '../components/gestion/DeficitChart.jsx';
import EficaciaGestiones from '../components/gestion/EficaciaGestiones.jsx';
import Secretarios from '../components/gestion/Secretarios.jsx';
import ElaboradorasCumplimiento from '../components/gestion/ElaboradorasCumplimiento.jsx';
import PetrolerasCumplimiento from '../components/gestion/PetrolerasCumplimiento.jsx';
import FormulasPrecios from '../components/gestion/FormulasPrecios.jsx';
import './Page.css';

// Blueprint §4 — Eje 04: Cumplimiento de Cupo y Gestión Estatal.
// Títulos editoriales propuestos; se revisan con HDO antes de publicar.
const SECTIONS = [
  {
    id: 'resumen', label: 'Resumen', title: 'Resumen ejecutivo',
    intro: 'El mandato de corte existe desde 2010. Estos son los números gruesos de cómo se administró.',
    Comp: ResumenGestion,
  },
  {
    id: 'corte', label: 'Corte obligatorio', title: 'Corte obligatorio vs. corte real',
    intro: 'La serie central del análisis: lo que la norma exige contra lo que efectivamente se mezcló, mes a mes y gestión por gestión. El corte real surge del biodiesel vendido al corte sobre las ventas de gas oil grado 2 y 3, excluidos los destinos exentos.',
    Comp: CorteRealChart,
  },
  {
    id: 'deficit', label: 'Déficit', title: 'El costo del incumplimiento',
    intro: 'Cada punto de corte incumplido son toneladas de biodiesel que no se produjeron y gas oil —en parte importado— que ocupó su lugar.',
    Comp: DeficitChart,
  },
  {
    id: 'eficacia', label: 'Eficacia', title: 'Eficacia de la Autoridad de Aplicación',
    intro: 'El mismo mandato legal, administrado por gestiones distintas, produjo resultados distintos. El cumplimiento se mide como biodiesel efectivamente cortado sobre el requerido por la norma vigente en cada mes.',
    Comp: EficaciaGestiones,
  },
  {
    id: 'secretarios', label: 'Funcionarios', title: 'Los funcionarios del régimen',
    intro: 'Secretarios de Energía y subsecretarios del área hidrocarburos: quiénes administraron el régimen, cuánto duraron y bajo qué presidencia.',
    Comp: Secretarios,
  },
  {
    id: 'elaboradoras', label: 'Elaboradoras', title: 'Cumplimiento por elaboradora',
    intro: 'Quién entrega el cupo que se le asigna y quién no.',
    Comp: ElaboradorasCumplimiento,
  },
  {
    id: 'petroleras', label: 'Petroleras', title: 'Cumplimiento de las petroleras',
    intro: 'La otra punta de la cadena: cuánto biodiesel compró cada petrolera contra el que sus ventas de gas oil obligaban a mezclar.',
    Comp: PetrolerasCumplimiento,
  },
  {
    id: 'formulas', label: 'Fórmulas', title: 'Las fórmulas de precio',
    intro: 'El precio del biodiesel de cupo no lo fija el mercado: lo fija la Secretaría de Energía por resolución, con la fórmula que cambió una veintena de veces desde 2010.',
    Comp: FormulasPrecios,
  },
];

export default function Gestion() {
  return (
    <>
      <SectionNav sections={SECTIONS} />
      <header className="page-hero">
        <div className="container">
          <p className="kicker">Eje · Gestión y Cupo</p>
          <h1>Cumplimiento de cupo y gestión estatal</h1>
          <p className="lede">
            La brecha entre el corte obligatorio que fija la ley y el corte real que
            administra la Secretaría de Energía, medida gestión por gestión desde 2010.
          </p>
        </div>
      </header>
      {SECTIONS.map(({ id, title, intro, Comp }) => (
        <section key={id} id={id} className="page-section">
          <div className="container">
            <p className="section-kicker">Gestión y Cupo</p>
            <h2>{title}</h2>
            <p className="section-intro">{intro}</p>
            <Comp />
          </div>
        </section>
      ))}
    </>
  );
}
