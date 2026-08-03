import SectionNav from '../components/SectionNav.jsx';
import MercadoHoy from '../components/mercado/MercadoHoy.jsx';
import AsignacionHoy from '../components/mercado/AsignacionHoy.jsx';
import ConclusionesIndicadores from '../components/mercado/ConclusionesIndicadores.jsx';
import EvolucionVentas from '../components/mercado/EvolucionVentas.jsx';
import CategoriasComparadas from '../components/mercado/CategoriasComparadas.jsx';
import CapacidadChart from '../components/mercado/CapacidadChart.jsx';
import CupoUso from '../components/mercado/CupoUso.jsx';
import EmpresaFicha from '../components/mercado/EmpresaFicha.jsx';
import ParticipacionChart from '../components/mercado/ParticipacionChart.jsx';
import GruposAceiteras from '../components/mercado/GruposAceiteras.jsx';
import MapaPlantas from '../components/mercado/MapaPlantas.jsx';
import CorteRealGO from '../components/mercado/CorteRealGO.jsx';
import './Page.css';

// Blueprint §3 — Eje 02: Mercado Interno Biodiesel (2.1–2.10; 2.11 y 2.12 en Fase 2).
// Títulos editoriales propuestos; se revisan con HDO antes de publicar.
const SECTIONS = [
  {
    id: 'kpis', label: 'KPIs', title: 'Principales Indicadores',
    intro: 'Los indicadores centrales del corte y de la asignación de cupos — en el mes elegido, el acumulado del año y los últimos doce meses.',
    Comp: function PrincipalesIndicadores() {
      return (
        <>
          <h3 className="mh-subtitulo">Análisis Corte Obligatorio</h3>
          <MercadoHoy />
          <h3 className="mh-subtitulo">Análisis Asignación Cupos</h3>
          <AsignacionHoy />
          <ConclusionesIndicadores />
        </>
      );
    },
  },
  {
    id: 'evolucion', label: 'Evolución', title: 'Evolución de ventas',
    intro: 'Producción vendida por destino desde 2008: corte obligatorio, mercado voluntario y exportación.',
    Comp: EvolucionVentas,
  },
  {
    id: 'integradas', label: 'Categorías', title: 'Dos industrias en una',
    intro: 'Integradas (aceiteras con biodiesel), no integradas (biodiesel como negocio principal) y comercializadoras. El mercado interno de cupo está reservado por ley a las no integradas; la exportación es territorio de las integradas.',
    Comp: CategoriasComparadas,
  },
  {
    id: 'capacidad', label: 'Capacidad', title: 'Capacidad instalada',
    intro: 'Cuánta capacidad de producción tiene el país y cuánta se usa.',
    Comp: CapacidadChart,
  },
  {
    id: 'cupo', label: 'Cupo', title: 'Cumplimiento y uso del cupo',
    intro: 'El cupo que la Secretaría de Energía asigna y lo que efectivamente se vende contra él.',
    Comp: CupoUso,
  },
  {
    id: 'empresa', label: 'Por empresa', title: 'Ficha por elaboradora',
    intro: 'Elegí cualquier empresa del registro para ver su cupo, sus ventas y su cumplimiento, año por año o mes a mes.',
    Comp: EmpresaFicha,
  },
  {
    id: 'participacion', label: 'Participación', title: 'Quién es quién en el mercado',
    intro: 'Participación de los últimos doce meses por elaboradora, por petrolera compradora y por provincia.',
    Comp: ParticipacionChart,
  },
  {
    id: 'aceiteras', label: 'Grupos', title: 'Los grupos económicos',
    intro: 'La producción agrupada por holding. Los grupos integrados son la industria aceitera operando dentro del biodiesel.',
    Comp: GruposAceiteras,
  },
  {
    id: 'plantas', label: 'Plantas', title: 'Mapa de plantas',
    intro: 'Las plantas de biodiesel del país, con su capacidad instalada.',
    Comp: MapaPlantas,
  },
  {
    id: 'corte-real', label: 'Corte real', title: 'Gas oil y corte real',
    intro: 'El mercado de gas oil que el biodiesel debe cortar, y el porcentaje efectivamente alcanzado.',
    Comp: CorteRealGO,
  },
];

export default function Mercado() {
  return (
    <>
      <SectionNav sections={SECTIONS} />
      <header className="page-hero">
        <div className="container">
          <p className="kicker">Eje · Mercado Interno</p>
          <h1>Mercado interno de biodiesel</h1>
          <p className="lede">
            Producción, ventas al corte, cupos y estructura de la industria desde 2008,
            elaborados a partir de los reportes mensuales de la Secretaría de Energía.
          </p>
        </div>
      </header>
      {SECTIONS.map(({ id, title, intro, Comp }) => (
        <section key={id} id={id} className="page-section">
          <div className="container">
            <p className="section-kicker">Mercado Interno</p>
            <h2>{title}</h2>
            <p className="section-intro">{intro}</p>
            <Comp />
          </div>
        </section>
      ))}
    </>
  );
}
