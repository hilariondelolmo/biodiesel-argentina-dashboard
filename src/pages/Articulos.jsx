import { useState, useCallback } from 'react';
import Articles from '../components/Articles.jsx';
import DocModal from '../components/DocModal.jsx';

export default function Articulos() {
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'article',
    url: null,
    title: null,
    articleId: null,
  });

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
      <Articles onOpenArticle={openArticle} />
      <DocModal state={modalState} onClose={closeModal} />
    </>
  );
}
