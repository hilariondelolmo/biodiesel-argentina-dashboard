import { useMemo } from 'react';
import { useActiveSection } from '../hooks/useActiveSection.js';
import './SectionNav.css';

/**
 * Sub-navegación de secciones dentro de una página (scroll-spy).
 * Se ubica pegada debajo de la nav principal.
 */
export default function SectionNav({ sections }) {
  const ids = useMemo(() => sections.map((s) => s.id), [sections]);
  const active = useActiveSection(ids);

  return (
    <nav className="section-nav" aria-label="Secciones de la página">
      <div className="section-nav-inner container">
        <ul>
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className={active === s.id ? 'active' : ''}>
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
