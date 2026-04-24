import { useActiveSection } from '../hooks/useActiveSection.js';
import './Nav.css';

const SECTIONS = [
  { id: 'hero', label: 'Inicio' },
  { id: 'indicadores', label: 'Indicadores' },
  { id: 'ventas', label: 'Ventas' },
  { id: 'timeline', label: 'Marco Legal' },
  { id: 'articles', label: 'Análisis' },
  { id: 'sources', label: 'Fuentes' },
];

export default function Nav() {
  const active = useActiveSection(SECTIONS.map((s) => s.id));

  return (
    <nav className="top-nav">
      <div className="top-nav-inner container">
        <div className="top-nav-brand">
          <span className="brand-mark">◆</span>
          <span className="brand-text">Biodiesel Argentina</span>
          <span className="brand-sub">· Tablero</span>
        </div>
        <ul className="top-nav-links">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={active === s.id ? 'active' : ''}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
