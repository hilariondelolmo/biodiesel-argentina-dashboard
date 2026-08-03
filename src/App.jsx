import { useState, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import Indicadores from './components/Indicadores.jsx';
import Ventas from './components/Ventas.jsx';
import Timeline from './components/Timeline.jsx';
import Articles from './components/Articles.jsx';
import Sources from './components/Sources.jsx';
import DocModal from './components/DocModal.jsx';

export default function App() {
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'doc', // 'doc' | 'article'
    url: null,
    title: null,
    articleId: null,
  });

  const openDoc = useCallback((url, title) => {
    setModalState({ open: true, mode: 'doc', url, title, articleId: null });
  }, []);

  const openArticle = useCallback((articleId, title, originalUrl) => {
    setModalState({
      open: true,
      mode: 'article',
      url: originalUrl,
      title,
      articleId,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState((s) => ({ ...s, open: false }));
  }, []);

  return (
    <>
      <Nav />
      <Hero />
      <Indicadores />
      <Ventas />
      <Timeline onOpenDoc={openDoc} />
      <Articles onOpenArticle={openArticle} />
      <Sources />
      <DocModal state={modalState} onClose={closeModal} />
      <footer className="site-footer">
        <div className="container">
          <p>
            Tablero desarrollado por <strong>Explora S.A.</strong> · Datos propios agregados de
            reportes mensuales de la Secretaría de Energía · Actualizado con datos hasta febrero 2026.
          </p>
          <p className="muted">
            El dashboard refleja la posición editorial de Hilarión Del Olmo (CEO) sobre el mercado
            de biodiesel en Argentina. Las opiniones son del autor; los datos están verificados
            contra fuentes oficiales.
          </p>
        </div>
      </footer>
      <Analytics />
    </>
  );
}
