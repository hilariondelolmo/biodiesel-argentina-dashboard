import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useActiveSection } from '../hooks/useActiveSection.js';
import './SectionNav.css';

/**
 * Sub-navegación de secciones, pegada debajo de la nav principal.
 * Dos modos:
 *  - con `basePath`: cada sección es una página propia (links de ruta);
 *  - sin `basePath`: anclas dentro de la misma página, con scroll-spy.
 */
export default function SectionNav({ sections, basePath }) {
  const ids = useMemo(() => sections.map((s) => s.id), [sections]);
  const active = useActiveSection(basePath ? [] : ids);

  return (
    <nav className="section-nav" aria-label="Secciones de la página">
      <div className="section-nav-inner container">
        <ul>
          {sections.map((s) => (
            <li key={s.id}>
              {basePath ? (
                <NavLink
                  to={s.root ? basePath : `${basePath}/${s.id}`}
                  end
                  className={({ isActive }) => (isActive ? 'active' : '')}
                >
                  {s.label}
                </NavLink>
              ) : (
                <a href={`#${s.id}`} className={active === s.id ? 'active' : ''}>
                  {s.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
