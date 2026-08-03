import { useState, useMemo } from 'react';
import timeline from '../data/timeline.json';
import './Timeline.css';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'ley', label: 'Leyes' },
  { id: 'decreto', label: 'Decretos' },
  { id: 'res', label: 'Resoluciones' },
  { id: 'proyecto', label: 'Proyectos' },
  { id: 'internacional', label: 'Internacional' },
];

export default function Timeline({ onOpenDoc }) {
  const [filter, setFilter] = useState('all');

  const events = useMemo(() => {
    if (filter === 'all') return timeline;
    return timeline.filter((ev) => ev.cat === filter);
  }, [filter]);

  return (
    <section id="timeline">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">Marco Legal</div>
          <h2>Marco legal y regulatorio</h2>
          <p>
            La cronología regulatoria del biodiesel argentino desde 2006. Cada hito incluye enlaces
            al documento oficial correspondiente - se abren dentro del tablero cuando el sitio
            fuente lo permite.
          </p>
        </div>

        <div className="timeline-filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={filter === f.id ? 'active' : ''}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="timeline">
          {events.map((ev, i) => (
            <TimelineEvent key={i} ev={ev} onOpenDoc={onOpenDoc} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineEvent({ ev, onOpenDoc }) {
  const cls = ['event'];
  if (ev.bio) cls.push('bio');
  if (ev.highlight) cls.push('highlight');

  const handleLinkClick = (e, url) => {
    // Permitir Ctrl/Cmd+click para abrir en pestaña nueva
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    onOpenDoc(url, ev.title);
  };

  return (
    <div className={cls.join(' ')}>
      <span className="year">
        {ev.year}
        <span className="badge">{ev.cat}</span>
      </span>
      <h4>{ev.title}</h4>
      <div className="desc">{ev.desc}</div>
      {(ev.url || ev.urlLabel) && (
        <div className="doc-links">
          {ev.url ? (
            <a
              href={ev.url}
              target="_blank"
              rel="noopener noreferrer"
              className="doc-link"
              onClick={(e) => handleLinkClick(e, ev.url)}
            >
              {ev.urlLabel || 'Documento oficial'} ⤢
            </a>
          ) : (
            <span className="doc-link-none">{ev.urlLabel}</span>
          )}
          {ev.url2 && (
            <a
              href={ev.url2}
              target="_blank"
              rel="noopener noreferrer"
              className="doc-link"
              onClick={(e) => handleLinkClick(e, ev.url2)}
            >
              {ev.url2Label || 'Segundo documento'} ⤢
            </a>
          )}
        </div>
      )}
    </div>
  );
}
