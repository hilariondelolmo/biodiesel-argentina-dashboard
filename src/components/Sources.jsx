import './Sources.css';

export default function Sources() {
  return (
    <section id="sources">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">Sección 5</div>
          <h2>Fuentes y metodología</h2>
        </div>

        <div className="sources-grid">
          <div className="source-card">
            <h4>Datos de producción y ventas</h4>
            <p>
              Los datos mensuales de producción por empresa, ventas al corte, exportaciones y
              cupo asignado provienen de los reportes mensuales que las empresas elaboradoras
              presentan a la Secretaría de Energía, consolidados en el dataset oficial de
              biocombustibles publicado en <code>datos.gob.ar</code>. Los datos se actualizan
              mensualmente con aproximadamente 60-90 días de rezago.
            </p>
            <a href="https://datos.gob.ar/dataset/energia-estadisticas-biodiesel-bioetanol"
               target="_blank" rel="noopener noreferrer">
              Dataset oficial · datos.gob.ar ↗
            </a>
          </div>

          <div className="source-card">
            <h4>Reclasificación de empresas</h4>
            <p>
              La clasificación en <em>integrada / no integrada / comercializadora</em> se basa
              en la integración vertical con la producción primaria de materia prima (aceite de
              soja). <strong>Patagonia Bioenergía</strong> se clasifica como integrada por su
              participación en el complejo agroindustrial vinculado, aunque también abastece al
              mercado interno — caso híbrido.
            </p>
          </div>

          <div className="source-card">
            <h4>Marco legal</h4>
            <p>
              Los enlaces a cada norma apuntan al texto oficial en <code>argentina.gob.ar</code>,
              InfoLEG, el Boletín Oficial, el Senado o Diputados según corresponda. Las normativas
              internacionales provienen de EUR-Lex (UE) y Federal Register (EE.UU.). Para algunas
              resoluciones secundarias se apunta a la búsqueda del buscador oficial.
            </p>
          </div>

          <div className="source-card">
            <h4>Análisis y posiciones</h4>
            <p>
              Los 25 artículos analizados fueron publicados originalmente en
              <a href="https://www.explorarg.com" target="_blank" rel="noopener noreferrer">
                {' '}explorarg.com
              </a>
              . El tablero embebe análisis sintetizados con las tesis centrales, datos cuantificados
              y tablas; el texto completo original permanece accesible mediante el enlace correspondiente
              en cada artículo.
            </p>
          </div>

          <div className="source-card full">
            <h4>Metodología de cálculo del cumplimiento</h4>
            <p>
              El <strong>cumplimiento de cupo</strong> se calcula como el cociente entre ventas al
              corte obligatorio y cupo asignado por la Secretaría de Energía. El cupo se asigna
              mensualmente por empresa según el régimen de la Ley 27.640 y la Resolución SE 689/2022.
              Un cumplimiento superior al 100% indica que la empresa vendió más que su cupo asignado
              (absorbe cupo de empresas que incumplieron); inferior al 100% indica incumplimiento
              formal. Las empresas integradas generalmente muestran cumplimiento formal 0% porque
              dirigen su producción a exportación, no a corte interno.
            </p>
          </div>
        </div>

        <div className="sources-footer">
          <p className="muted">
            Última actualización del dataset: febrero 2026 · Compilado por Explora S.A. · Las
            opiniones editoriales vertidas son del autor y no comprometen a terceros citados.
          </p>
        </div>
      </div>
    </section>
  );
}
