import { useState, useCallback } from 'react';
import Timeline from '../components/Timeline.jsx';
import DocModal from '../components/DocModal.jsx';

export default function MarcoLegal() {
  const [modalState, setModalState] = useState({
    open: false,
    mode: 'doc',
    url: null,
    title: null,
    articleId: null,
  });

  const openDoc = useCallback((url, title) => {
    setModalState({ open: true, mode: 'doc', url, title, articleId: null });
  }, []);

  const closeModal = useCallback(() => {
    setModalState((s) => ({ ...s, open: false }));
  }, []);

  return (
    <>
      <Timeline onOpenDoc={openDoc} />
      <DocModal state={modalState} onClose={closeModal} />
    </>
  );
}
