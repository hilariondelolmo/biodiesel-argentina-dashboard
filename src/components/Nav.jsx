import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../lib/theme.jsx';
import './Nav.css';

const DASHBOARDS = [
  { to: '/mercado', label: 'Biodiesel - Principales Indicadores' },
  { to: '/mercado/integradas', label: 'Biodiesel - Detalle de ventas' },
  { to: '/gestion', label: 'Biodiesel - Cumplimiento Corte' },
  { label: 'Biodiesel - Primas y Precios Relativos', disabled: true },
];

const MQ_ANGOSTO = '(max-width: 560px)';

export default function Nav() {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const enDashboards = pathname.startsWith('/mercado') || pathname.startsWith('/gestion');

  // En móvil no hay hover (y iOS no enfoca botones al tocar): el desplegable
  // se abre/cierra por estado. Se cierra al navegar o al tocar afuera.
  const [abierto, setAbierto] = useState(false);
  const dropdownRef = useRef(null);

  // En pantallas angostas el menú se monta en un portal sobre <body>:
  // dentro de la barra, Safari ancla los position:fixed al backdrop-filter
  // de .top-nav (y la franja de links scrollea), y el menú queda roto.
  const [angosto, setAngosto] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MQ_ANGOSTO).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(MQ_ANGOSTO);
    const fn = (e) => setAngosto(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  useEffect(() => setAbierto(false), [pathname]);

  useEffect(() => {
    if (!abierto) return undefined;
    const cerrar = (e) => {
      if (!e.target.closest('.nav-dropdown') && !e.target.closest('.nav-dropdown-menu')) {
        setAbierto(false);
      }
    };
    document.addEventListener('pointerdown', cerrar);
    return () => document.removeEventListener('pointerdown', cerrar);
  }, [abierto]);

  const menu = (
    <ul className="nav-dropdown-menu">
      {DASHBOARDS.map((d) =>
        d.disabled ? (
          <li key={d.label}>
            <span className="nav-dropdown-item deshabilitado" aria-disabled="true">
              {d.label}
            </span>
          </li>
        ) : (
          <li key={d.label}>
            <NavLink
              to={d.to}
              className={({ isActive }) => `nav-dropdown-item ${isActive ? 'active' : ''}`}
            >
              {d.label}
            </NavLink>
          </li>
        )
      )}
    </ul>
  );

  return (
    <nav className="top-nav">
      <div className="top-nav-inner container">
        <div className="top-nav-brand">
          <img src="/brand/explorarg-icon.png" alt="explorarg" className="brand-icon" />
          <span className="brand-lockup">
            <span className="brand-name">EXPLORARG</span>
            <span className="brand-tag">Marketscan</span>
          </span>
        </div>
        <ul className="top-nav-links">
          <li>
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Home
            </NavLink>
          </li>
          <li className={`nav-dropdown ${abierto ? 'abierto' : ''}`} ref={dropdownRef}>
            <button
              type="button"
              className={`nav-dropdown-trigger ${enDashboards ? 'active' : ''}`}
              aria-haspopup="true"
              aria-expanded={abierto}
              onClick={() => setAbierto((o) => !o)}
            >
              Dashboards <span className="nav-dropdown-caret">▾</span>
            </button>
            {angosto ? abierto && createPortal(menu, document.body) : menu}
          </li>
          <li>
            <NavLink
              to="/marco-legal"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Marco Legal
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/articulos"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Artículos
            </NavLink>
          </li>
          <li>
            <button
              type="button"
              className="theme-toggle"
              onClick={toggle}
              title={theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
              aria-label="Cambiar tema"
            >
              {theme === 'light' ? '◑' : '◐'}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
