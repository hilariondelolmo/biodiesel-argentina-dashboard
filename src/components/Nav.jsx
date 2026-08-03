import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../lib/theme.jsx';
import './Nav.css';

const DASHBOARDS = [
  { to: '/mercado', label: 'Biodiesel - Principales Indicadores' },
  { to: '/mercado/integradas', label: 'Biodiesel - Detalle de ventas' },
  { to: '/gestion', label: 'Biodiesel - Cumplimiento Corte' },
  { label: 'Biodiesel - Primas y Precios Relativos', disabled: true },
];

export default function Nav() {
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const enDashboards = pathname.startsWith('/mercado') || pathname.startsWith('/gestion');

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
          <li className="nav-dropdown">
            <button
              type="button"
              className={`nav-dropdown-trigger ${enDashboards ? 'active' : ''}`}
              aria-haspopup="true"
            >
              Dashboards <span className="nav-dropdown-caret">▾</span>
            </button>
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
                      className={({ isActive }) =>
                        `nav-dropdown-item ${isActive ? 'active' : ''}`
                      }
                    >
                      {d.label}
                    </NavLink>
                  </li>
                )
              )}
            </ul>
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
