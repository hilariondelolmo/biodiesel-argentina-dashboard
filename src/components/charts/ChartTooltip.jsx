import { fmt } from '../../lib/format.js';

/**
 * Tooltip custom para todos los charts del tablero.
 * Recharts le pasa { active, payload, label, labelFormatter? }
 */
export default function ChartTooltip({ active, payload, label, labelFormatter, unit = 'ton' }) {
  if (!active || !payload || !payload.length) return null;

  const displayLabel = labelFormatter ? labelFormatter(label) : label;

  return (
    <div className="chart-tooltip">
      {displayLabel && <div className="chart-tooltip-label">{displayLabel}</div>}
      {payload
        .filter((p) => p.value !== null && p.value !== undefined && p.value !== 0)
        .map((p, i) => (
          <div key={i} className="chart-tooltip-row">
            <div className="chart-tooltip-row-label">
              <span className="chart-tooltip-swatch" style={{ background: p.color || p.fill }} />
              <span>{p.name}</span>
            </div>
            <span className="chart-tooltip-row-val">
              {fmt.int(p.value)} {unit}
            </span>
          </div>
        ))}
    </div>
  );
}
