import { NavLink } from 'react-router-dom';
import { useTheme } from '../lib/theme.jsx';
import './Nav.css';

const ROUTES = [
  { to: '/', label: 'Portada', end: true },
  { to: '/mercado', label: 'Mercado Interno' },
  { to: '/gestion', label: 'Gestión y Cupo' },
  { to: '/marco-legal', label: 'Marco Legal' },
  { to: '/articulos', label: 'Artículos' },
];

export default function Nav() {
  const { theme, toggle } = useTheme();
  return (
    <nav className="top-nav">
      <div className="top-nav-inner container">
        <div className="top-nav-brand">
          <span className="brand-mark">◆</span>
          <span className="brand-text">Biodiesel Argentina</span>
          <span className="brand-sub">· Tablero</span>
        </div>
        <ul className="top-nav-links">
          {ROUTES.map((r) => (
            <li key={r.to}>
              <NavLink
                to={r.to}
                end={r.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {r.label}
              </NavLink>
            </li>
          ))}
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
