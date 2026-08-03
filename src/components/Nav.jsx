import { NavLink } from 'react-router-dom';
import { useTheme } from '../lib/theme.jsx';
import './Nav.css';

const ROUTES = [
  { to: '/', label: 'Home', end: true },
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
          <img src="/brand/explorarg-icon.png" alt="explorarg" className="brand-icon" />
          <span className="brand-lockup">
            <span className="brand-name">EXPLORARG</span>
            <span className="brand-tag">Marketscan</span>
          </span>
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
