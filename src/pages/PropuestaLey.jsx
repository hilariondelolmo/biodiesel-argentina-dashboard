import { useRef, useState } from 'react';
import SectionNav from '../components/SectionNav.jsx';
import { SECCIONES_REFORMA } from '../lib/reforma.js';
import contenido from '../content/propuesta-s80926pl.html?raw';
import './PropuestaLey.css';

/**
 * Propuesta de Ley S80926PL (rev. cc HDO del 11/08 sobre la versión
 * SE 260729 del Proyecto S-0809/2026): texto completo con las
 * modificaciones incorporadas en rojo subrayado. En los 21 artículos
 * fundamentados por el informe del 11/08, dos obleas abren un popup con
 * "Normas que viola el proyecto oficial" y "Justificación de la
 * modificación".
 *
 * El blob (src/content/propuesta-s80926pl.html) se genera desde los dos
 * docx con generar_propuesta_html.py; los popups viajan ocultos dentro
 * del blob y el diálogo los muestra por data-art/data-tipo.
 */
export default function PropuestaLey() {
  const raizRef = useRef(null);
  const dialogRef = useRef(null);
  const [pop, setPop] = useState(null); // {titulo, sub, tipo, html}

  const abrirPop = (art, tipo) => {
    const fuente = raizRef.current?.querySelector(
      `.pl-pop[data-art="${art}"][data-tipo="${tipo}"]`
    );
    if (!fuente) return;
    setPop({
      titulo: fuente.dataset.titulo,
      sub: fuente.dataset.sub,
      tipo,
      html: fuente.innerHTML,
    });
    requestAnimationFrame(() => dialogRef.current?.showModal());
  };

  const cerrar = () => {
    dialogRef.current?.close();
    setPop(null);
  };

  const stickyRef = useRef(null);

  // El encabezado fijo tapa el inicio del artículo si se usa scrollIntoView:
  // se compensa nav + bloque fijo a mano (patrón de ReformaLey)
  const irAlArticulo = (nro) => {
    const destino = document.getElementById(`art-${nro}`);
    if (!destino) return;
    const nav = document.querySelector('.top-nav');
    const subnav = document.querySelector('.section-nav');
    const sticky = stickyRef.current;
    let tope = (nav?.offsetHeight || 56) + (subnav?.offsetHeight || 0) + 16;
    if (sticky && getComputedStyle(sticky).position === 'sticky') {
      tope += sticky.offsetHeight;
    }
    window.scrollTo({
      top: Math.max(window.scrollY + destino.getBoundingClientRect().top - tope, 0),
      behavior: 'smooth',
    });
  };

  const alClickear = (e) => {
    const oblea = e.target.closest('.pl-oblea');
    if (oblea) {
      abrirPop(oblea.dataset.art, oblea.dataset.tipo);
      return;
    }
    const fila = e.target.closest('.pl-cuadro-fila');
    if (fila) irAlArticulo(fila.dataset.art);
  };

  // El cuadro de correspondencia vive dentro del popup: al clickear una
  // fila se cierra el diálogo y se salta al artículo
  const alClickearDialogo = (e) => {
    const fila = e.target.closest('.pl-cuadro-fila');
    if (fila) {
      cerrar();
      irAlArticulo(fila.dataset.art);
    }
  };

  return (
    <div className="propuesta-ley">
      <SectionNav sections={SECCIONES_REFORMA} />
      <div className="pl-sticky" ref={stickyRef}>
        <div className="marco pl-encabezado">
          <div className="kicker">Análisis · Proyecto de Ley S-0809/2026</div>
          <h1>La propuesta, artículo por artículo</h1>
          <p className="bajada">
            Texto completo del proyecto de ley de biocombustibles con las
            modificaciones propuestas incorporadas:{' '}
            <ins className="pl-leyenda">lo subrayado en rojo es texto propuesto</ins>. En
            cada artículo modificado, dos obleas abren los fundamentos: qué normas
            compromete el texto oficial y qué corrige la modificación.
          </p>
          <div className="pl-obleas pl-obleas-intro">
            {[
              ['objeto', 'Objeto y método'],
              ['marco', 'Marco normativo de referencia'],
              ['cuadro', 'Cuadro de correspondencia'],
              ['cierre', 'Criterio para modificaciones'],
            ].map(([clave, rotulo]) => (
              <button
                key={clave}
                type="button"
                className="pl-oblea pl-oblea-intro"
                onClick={() => abrirPop('intro', clave)}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="marco pl-marco">
        <div
          className="pl-cuerpo"
          ref={raizRef}
          onClick={alClickear}
          dangerouslySetInnerHTML={{ __html: contenido }}
        />
      </div>

      <dialog
        ref={dialogRef}
        className={`pl-dialog ${pop?.tipo === 'normas' ? 'pl-dialog-normas' : 'pl-dialog-just'}${pop?.tipo === 'cuadro' ? ' pl-dialog-ancho' : ''}`}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            cerrar();
            return;
          }
          alClickearDialogo(e);
        }}
        onClose={() => setPop(null)}
      >
        {pop && (
          <div className="pl-dialog-marco">
            <header>
              <div>
                <div className="pl-dialog-sub">{pop.sub}</div>
                <h2>{pop.titulo}</h2>
              </div>
              <button type="button" className="pl-dialog-cerrar" onClick={cerrar} aria-label="Cerrar">
                ×
              </button>
            </header>
            <div
              className="pl-dialog-texto"
              dangerouslySetInnerHTML={{ __html: pop.html }}
            />
          </div>
        )}
      </dialog>
    </div>
  );
}
