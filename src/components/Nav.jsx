import { NavLink } from 'react-router-dom';
import './Nav.css';

const ROUTES = [
  { to: '/', label: 'Portada', end: true },
  { to: '/mercado', label: 'Mercado Interno' },
  { to: '/gestion', label: 'Gestión y Cupo' },
];

export default function Nav() {
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
        </ul>
      </div>
    </nav>
  );
}
