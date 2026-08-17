import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { HECHOS_CHARTS } from '../components/propuesta/HechosCharts.jsx';
import './PropuestaLey.css';

/**
 * Ruta utilitaria /export-grafico/:id — renderiza UN gráfico de la oblea
 * "Respaldo en datos" solo, sobre fondo blanco, para capturarlo con Chrome
 * headless (export a Word/PDF). No está linkeada desde la navegación.
 * El overlay fijo tapa nav y footer para que el screenshot salga limpio.
 */
export default function ExportGrafico() {
  const { id } = useParams();
  const Chart = HECHOS_CHARTS[id];

  // La captura se hace siempre en tema claro
  useEffect(() => {
    const previo = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = 'light';
    return () => {
      document.documentElement.dataset.theme = previo;
    };
  }, []);

  return (
    <div
      className="propuesta-ley"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#fff',
        padding: 16,
        overflow: 'hidden',
      }}
    >
      <div className="pl-dialog-texto" style={{ padding: 0, width: 868 }}>
        {Chart ? <Chart /> : <p>Gráfico desconocido: {id}</p>}
      </div>
    </div>
  );
}
