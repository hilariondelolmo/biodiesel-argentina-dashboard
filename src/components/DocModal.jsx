import { useEffect, useRef, useState } from 'react';
import articleContent from '../data/article-content.json';
import './DocModal.css';

export default function DocModal({ state, onClose }) {
  const { open, mode, url, title, articleId } = state;
  const iframeRef = useRef(null);
  const [iframeStatus, setIframeStatus] = useState('loading'); // 'loading' | 'loaded' | 'blocked'

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (open) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Detección de bloqueo del iframe
  useEffect(() => {
    if (!open || mode !== 'doc' || !url) return;

    setIframeStatus('loading');
    let loaded = false;

    // Timeout de 3.5s para fallback
    const timer = setTimeout(() => {
      if (!loaded) {
        setIframeStatus('blocked');
      } else {
        try {
          const doc = iframeRef.current?.contentDocument;
          if (doc && doc.body && doc.body.children.length === 0) {
            setIframeStatus('blocked');
          }
        } catch {
          // SecurityError → cargó cross-origin correctamente
        }
      }
    }, 3500);

    // Handler del evento load
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => {
      loaded = true;
      if (iframe.src === 'about:blank' || iframe.src === window.location.href) return;
      setTimeout(() => {
        try {
          const doc = iframe.contentDocument;
          if (doc && doc.body && doc.body.children.length === 0 &&
              doc.body.textContent.trim() === '') {
            setIframeStatus('blocked');
          } else {
            setIframeStatus('loaded');
          }
        } catch {
          setIframeStatus('loaded');
        }
      }, 250);
    };
    iframe.addEventListener('load', onLoad);

    return () => {
      clearTimeout(timer);
      iframe.removeEventListener('load', onLoad);
    };
  }, [open, mode, url]);

  if (!open) return null;

  const articleHtml = mode === 'article' && articleId ? articleContent[articleId] : null;

  return (
    <div className="doc-modal" aria-hidden={!open}>
      <div className="doc-modal-backdrop" onClick={onClose} />
      <div className="doc-modal-panel" role="dialog" aria-modal="true" aria-labelledby="doc-modal-title">
        <header className="doc-modal-header">
          <div className="doc-modal-title-block">
            <div className="doc-modal-eyebrow">
              {mode === 'article' ? 'Análisis embebido' : 'Documento oficial'}
            </div>
            <div className="doc-modal-title" id="doc-modal-title">{title}</div>
            {url && <div className="doc-modal-url">{url}</div>}
          </div>
          <div className="doc-modal-actions">
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="doc-modal-btn">
                {mode === 'article' ? 'Ver original en ExplorArg ↗' : 'Abrir en pestaña nueva ↗'}
              </a>
            )}
            <button className="doc-modal-close" onClick={onClose} aria-label="Cerrar">×</button>
          </div>
        </header>

        <div className="doc-modal-body">
          {mode === 'article' && articleHtml && (
            <ArticlePanel html={articleHtml} url={url} />
          )}

          {mode === 'doc' && iframeStatus === 'loading' && (
            <div className="doc-modal-state">
              <div className="doc-modal-spinner" />
              <div>Solicitando el documento al servidor oficial…</div>
              <div className="doc-modal-state-sub">
                Si el sitio bloquea el embebido por seguridad, mostraremos un acceso directo
                en unos segundos.
              </div>
            </div>
          )}

          {mode === 'doc' && iframeStatus === 'blocked' && (
            <div className="doc-modal-state">
              <div className="doc-modal-block-icon">⚠</div>
              <div className="doc-modal-state-title">El servidor oficial no permite el embebido</div>
              <div className="doc-modal-state-sub">
                Este es un comportamiento estándar de los sitios del Estado argentino
                (encabezado <code>X-Frame-Options</code>) para prevenir el secuestro de clics.
                El documento está disponible directamente en el sitio oficial:
              </div>
              <a href={url} target="_blank" rel="noopener noreferrer" className="doc-modal-cta">
                Abrir en el sitio oficial ↗
              </a>
            </div>
          )}

          {mode === 'doc' && (
            <iframe
              ref={iframeRef}
              src={url}
              title={title || 'Documento'}
              style={{ opacity: iframeStatus === 'loaded' ? 1 : 0 }}
              className="doc-modal-iframe"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ArticlePanel({ html, url }) {
  return (
    <div className="doc-modal-article">
      <div className="doc-modal-article-inner">
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <div className="doc-modal-article-footer">
          <div className="doc-modal-article-footer-note">
            Este es el análisis sintetizado del artículo, embebido para lectura rápida dentro
            del tablero. El texto original completo (con comentarios, reacciones y formato de
            ExplorArg) está disponible en el sitio.
          </div>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="doc-modal-cta">
              Ver artículo original en ExplorArg ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
