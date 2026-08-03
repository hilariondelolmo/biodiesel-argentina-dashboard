import Hero from '../components/Hero.jsx';
import Indicadores from '../components/Indicadores.jsx';
import Ventas from '../components/Ventas.jsx';
import Sources from '../components/Sources.jsx';
import SectionNav from '../components/SectionNav.jsx';

const SECTIONS = [
  { id: 'hero', label: 'Inicio' },
  { id: 'indicadores', label: 'Indicadores' },
  { id: 'ventas', label: 'Ventas' },
  { id: 'sources', label: 'Fuentes' },
];

export default function Home() {
  return (
    <>
      <SectionNav sections={SECTIONS} />
      <Hero />
      <Indicadores />
      <Ventas />
      <Sources />
    </>
  );
}
