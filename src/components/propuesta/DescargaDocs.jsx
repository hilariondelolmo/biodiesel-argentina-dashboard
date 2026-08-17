import { useRef, useState } from 'react';

/**
 * Descarga de los documentos de la Propuesta con registro de email
 * (gate real: los archivos solo se entregan vía POST /api/descarga,
 * que valida y registra la dirección antes de responder el archivo).
 */
const DOCS = [
  {
    clave: 'propuesta',
    titulo: 'Propuesta de ley con las modificaciones',
    detalle: 'Word · texto completo con control de cambios',
  },
  {
    clave: 'fundamentos',
    titulo: 'Fundamentos jurídicos y respaldo en datos',
    detalle: 'PDF · informe completo, artículo por artículo',
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function DescargaDocs() {
  const dialogRef = useRef(null);
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState({}); // clave -> 'bajando' | 'ok' | mensaje de error
  const emailValido = EMAIL_RE.test(email.trim());

  const abrir = () => dialogRef.current?.showModal();
  const cerrar = () => dialogRef.current?.close();

  const descargar = async (doc) => {
    setEstado((e) => ({ ...e, [doc.clave]: 'bajando' }));
    try {
      const r = await fetch('/api/descarga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), doc: doc.clave }),
      });
      if (!r.ok) {
        const cuerpo = await r.json().catch(() => ({}));
        throw new Error(cuerpo.error || `Error ${r.status}`);
      }
      const blob = await r.blob();
      const nombre = /filename="([^"]+)"/.exec(
        r.headers.get('Content-Disposition') || ''
      )?.[1] || doc.clave;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombre;
      a.click();
      URL.revokeObjectURL(url);
      setEstado((e) => ({ ...e, [doc.clave]: 'ok' }));
    } catch (err) {
      setEstado((e) => ({ ...e, [doc.clave]: err.message || 'No se pudo descargar' }));
    }
  };

  return (
    <>
      <button type="button" className="pl-oblea pl-oblea-descarga" onClick={abrir}>
        Descargar los documentos
      </button>

      <dialog
        ref={dialogRef}
        className="pl-dialog pl-dialog-just"
        onClick={(e) => {
          if (e.target === dialogRef.current) cerrar();
        }}
      >
        <div className="pl-dialog-marco">
          <header>
            <div>
              <div className="pl-dialog-sub">Documentos de la propuesta</div>
              <h2>Descargar</h2>
            </div>
            <button type="button" className="pl-dialog-cerrar" onClick={cerrar} aria-label="Cerrar">
              ×
            </button>
          </header>
          <div className="pl-dialog-texto">
            <p className="pl-desc-ayuda">
              Ingresá tu dirección de email para habilitar la descarga.
            </p>
            <input
              type="email"
              className="pl-desc-email"
              placeholder="tu@email.com"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="pl-desc-docs">
              {DOCS.map((doc) => {
                const st = estado[doc.clave];
                return (
                  <div key={doc.clave} className="pl-desc-doc">
                    <div>
                      <strong>{doc.titulo}</strong>
                      <span>{doc.detalle}</span>
                      {st && st !== 'bajando' && st !== 'ok' && (
                        <span className="pl-desc-error">{st}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="pl-desc-boton"
                      disabled={!emailValido || st === 'bajando'}
                      onClick={() => descargar(doc)}
                    >
                      {st === 'bajando' ? 'Descargando…' : st === 'ok' ? 'Descargado ✓' : 'Descargar'}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="pl-desc-nota">
              Usamos tu email únicamente para saber quién consulta estos documentos.
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}
