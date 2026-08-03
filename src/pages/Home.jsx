import { useState, useCallback } from 'react';
import Hero from '../components/Hero.jsx';
import Indicadores from '../components/Indicadores.jsx';
import Ventas from '../components/Ventas.jsx';
import Timeline from '../components/Timeline.jsx';
import Articles from '../components/Articles.jsx';
import Sources from '../components/Sources.jsx';
import DocModal from '../components/DocModal.jsx';
import SectionNav from '../components/SectionNav.jsx';

const SECTIONS = [
  { id: 'hero', label: 'Inicio' },
  { id: 'indicadores', label: 'Indicadores' },
  { id: 'ventas', label: 'Ventas' },
  { id: 'timeline', label: 'Marco Legal' },
  { id: 'articles', label: 'Análisis' },
  { id: 'sources', label: 'Fuentes' },
];

export default function Home() {
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
      <SectionNav sections={SECTIONS} />
      <Hero />
      <Indicadores />
      <Ventas />
      <Timeline onOpenDoc={openDoc} />
      <Articles onOpenArticle={openArticle} />
      <Sources />
      <DocModal state={modalState} onClose={closeModal} />
    </>
  );
}
