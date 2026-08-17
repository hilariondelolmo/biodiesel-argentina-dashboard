import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SectionNav from '../components/SectionNav.jsx';
import { SECCIONES_REFORMA } from '../lib/reforma.js';
import { HECHOS_CHARTS } from '../components/propuesta/HechosCharts.jsx';
import DescargaDocs from '../components/propuesta/DescargaDocs.jsx';
import contenido from '../content/propuesta-s80926pl.html?raw';
import './PropuestaLey.css';

/**
 * Propuesta de Ley S80926PL (rev. cc HDO del 11/08 sobre la versión
 * SE 260729 del Proyecto S-0809/2026): texto completo con las
 * modificaciones incorporadas en rojo subrayado. En los 21 artículos
 * fundamentados por el informe (rev3 del 17/08), tres obleas abren un
 * popup: "Normas que viola el proyecto oficial", "Justificación de la
 * modificación" y "Respaldo en datos" (evidencia fáctica con gráficos).
 *
 * El blob (src/content/propuesta-s80926pl.html) se genera desde los docx
 * con generar_propuesta_html.py; los popups viajan ocultos dentro del
 * blob y el diálogo los muestra por data-art/data-tipo. Los gráficos de
 * evidencia se montan por portal sobre los placeholders .pl-chart del
 * popup abierto (el HTML estático no puede traer componentes).
 */
export default function PropuestaLey() {
  const raizRef = useRef(null);
  const dialogRef = useRef(null);
  const [pop, setPop] = useState(null); // {titulo, sub, tipo, html}
  const [nodosChart, setNodosChart] = useState([]);

  // El contenido del diálogo entra por innerHTML: recién después del
  // render existen los placeholders donde van los gráficos
  useEffect(() => {
    if (!pop) {
      setNodosChart([]);
      return;
    }
    setNodosChart([
      ...(dialogRef.current?.querySelectorAll('.pl-chart[data-chart]') ?? []),
    ]);
  }, [pop]);

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

  // El cuadro de correspondencia y los chips de las confrontaciones viven
  // dentro del popup: al clickearlos se cierra el diálogo y salta al artículo
  const alClickearDialogo = (e) => {
    const destino = e.target.closest('.pl-cuadro-fila, .pl-salto');
    if (destino) {
      cerrar();
      irAlArticulo(destino.dataset.art);
    }
  };

  return (
    <div className="propuesta-ley">
      <SectionNav sections={SECCIONES_REFORMA} />
      <div className="pl-sticky" ref={stickyRef}>
        <div className="marco pl-encabezado">
          <DescargaDocs />
          <div className="kicker">Análisis · Proyecto de Ley S-0809/2026</div>
          <h1>La propuesta, artículo por artículo</h1>
          <p className="bajada">
            Texto completo del proyecto de ley de biocombustibles con las
            modificaciones propuestas incorporadas:{' '}
            <ins className="pl-leyenda">lo subrayado en rojo es texto propuesto</ins>. En
            cada artículo modificado, tres obleas abren los fundamentos: qué normas
            compromete el texto oficial, qué corrige la modificación y su
            respaldo en los datos del mercado.
          </p>
          <div className="pl-obleas pl-obleas-intro">
            {[
              ['objeto', 'Objeto y método'],
              ['marco', 'Marco normativo de referencia'],
              ['cuadro', 'Cuadro de correspondencia'],
              ['cierre', 'Criterio para modificaciones'],
              ['confronta', 'Sus fundamentos vs. su proyecto'],
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
        className={`pl-dialog pl-dialog-${
          pop?.tipo === 'normas' ? 'normas'
            : pop?.tipo === 'hechos' ? 'hechos'
              : pop?.tipo === 'confronta' ? 'confronta'
                : 'just'
        }${['cuadro', 'hechos', 'confronta'].includes(pop?.tipo) ? ' pl-dialog-ancho' : ''}`}
        onClick={(e) => {
          if (e.target === dialogRef.current) {
            cerrar();
            return;
          }
          alClickearDialogo(e);
        }}
        onClose={() => {
          // El evento close es asíncrono: si ya se abrió otro popup (cerrar
          // y abrir en el mismo tick), no hay que pisarlo
          if (!dialogRef.current?.open) setPop(null);
        }}
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
        {nodosChart.map((nodo) => {
          const Chart = HECHOS_CHARTS[nodo.dataset.chart];
          return Chart ? createPortal(<Chart />, nodo, nodo.dataset.chart) : null;
        })}
      </dialog>
    </div>
  );
}
