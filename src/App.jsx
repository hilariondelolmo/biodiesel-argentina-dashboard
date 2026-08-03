import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import Home from './pages/Home.jsx';
import mercadoData from './data/mercado.json';
import { fmt } from './lib/format.js';

const Mercado = lazy(() => import('./pages/Mercado.jsx'));
const Gestion = lazy(() => import('./pages/Gestion.jsx'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Nav />
      <Suspense fallback={<div className="page-loading">Cargando…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/mercado" element={<Mercado />} />
          <Route path="/gestion" element={<Gestion />} />
        </Routes>
      </Suspense>
      <footer className="site-footer">
        <div className="container">
          <p>
            Un desarrollo de{' '}
            <strong>
              <a href="https://www.explorarg.com" target="_blank" rel="noopener noreferrer">
                explorarg
              </a>
            </strong>{' '}
            · Datos agregados de reportes mensuales de la Secretaría de Energía · Actualizado
            con datos hasta {fmt.monthShort(mercadoData.ultimo_mes)}.
          </p>
          <p className="muted">
            El tablero refleja la posición editorial de explorarg sobre el mercado de biodiesel
            en Argentina. Las opiniones son del autor; los datos están verificados contra
            fuentes oficiales.
          </p>
        </div>
      </footer>
    </BrowserRouter>
  );
}
