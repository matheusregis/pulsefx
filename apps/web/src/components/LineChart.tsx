import type { SeriesPoint } from '../types';

interface Props {
  points: SeriesPoint[];
  width?: number;
  height?: number;
}

/**
 * Minimal dependency-free SVG line chart. Deliberately not a charting
 * library — the series here is small (tens to low hundreds of points) and
 * a hand-rolled polyline keeps the bundle light and the behavior trivial to
 * test (see README § Decisões técnicas for the trade-off).
 */
export function LineChart({ points, width = 640, height = 200 }: Props) {
  if (points.length === 0) {
    return <p className="chart-empty">Sem observações para exibir.</p>;
  }

  const padding = 24;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // avoid /0 when the series is flat

  const toX = (i: number) => padding + (i / Math.max(points.length - 1, 1)) * (width - padding * 2);
  const toY = (v: number) => height - padding - ((v - min) / range) * (height - padding * 2);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.value)}`).join(' ');
  const last = points[points.length - 1];

  return (
    <svg
      className="line-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Série temporal com ${points.length} observações, de ${points[0].date} a ${last.date}`}
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2} />
      <circle cx={toX(points.length - 1)} cy={toY(last.value)} r={3.5} fill="currentColor" />
    </svg>
  );
}
