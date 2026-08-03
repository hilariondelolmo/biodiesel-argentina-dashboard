import { useState } from 'react';
import mapa from '../../data/mapa_argentina.json';
import capacidad from '../../data/capacidad.json';
import { fmt } from '../../lib/format.js';
import './Mercado.css';

const { lon_min, lat_max, lat_media_deg, kx, ky } = mapa.proyeccion;
const RAD = Math.cos((lat_media_deg * Math.PI) / 180);

function proyectar(lng, lat) {
  return [(lng - lon_min) * RAD * kx, (lat_max - lat) * ky];
}

/** Mapa SVG de plantas de biodiesel (sin dependencias externas). */
export default function MapaPlantas() {
  const plantas = capacidad.plantas
    .filter((p) => p.lat !== null && p.lng !== null)
    .sort((a, b) => (b.capacidad || 0) - (a.capacidad || 0));
  const [activa, setActiva] = useState(null);

  const capMax = plantas[0]?.capacidad || 1;
  const sel = plantas.find((p) => p.empresa === activa);

  return (
    <div className="mapa-plantas-wrap">
      <svg className="mapa-svg" viewBox={mapa.viewBox} role="img"
        aria-label="Mapa de plantas de biodiesel en Argentina">
        {mapa.provincias.map((p) => (
          <path key={p.nombre} className="provincia" d={p.path}>
            <title>{p.nombre}</title>
          </path>
        ))}
        {plantas.map((p) => {
          const [x, y] = proyectar(p.lng, p.lat);
          const r = 3 + Math.sqrt((p.capacidad || 0) / capMax) * 9;
          return (
            <circle
              key={p.empresa}
              className={`planta ${activa === p.empresa ? 'activa' : ''}`}
              cx={x} cy={y} r={r}
              onClick={() => setActiva(p.empresa)}
            >
              <title>{`${p.empresa} · ${fmt.int(p.capacidad)} ton/año`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="mapa-detalle">
        {sel ? (
          <>
            <div className="mapa-detalle-titulo">{sel.empresa}</div>
            <div className="mapa-detalle-sub">
              {sel.holding && sel.holding !== sel.empresa ? `Grupo ${sel.holding} · ` : ''}
              {sel.segmento || ''}{sel.capacidad ? ` · ${fmt.int(sel.capacidad)} ton/año` : ''}
            </div>
          </>
        ) : (
          <>
            <div className="mapa-detalle-titulo">{plantas.length} plantas geolocalizadas</div>
            <div className="mapa-detalle-sub">
              El tamaño del punto es proporcional a la capacidad · tocá una planta
              o la lista para el detalle
            </div>
          </>
        )}
        <div className="mapa-lista">
          {plantas.map((p) => (
            <div
              key={p.empresa}
              className={`mapa-lista-row ${activa === p.empresa ? 'activa' : ''}`}
              onClick={() => setActiva(p.empresa)}
            >
              <span>{fmt.truncate(p.empresa, 34)}</span>
              <span className="mapa-lista-cap">{fmt.int(p.capacidad)} t/a</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
