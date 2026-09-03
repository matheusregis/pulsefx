import { useId, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { SeriesPoint } from '../types';
import { formatDate, formatValue } from '../lib/format';

interface Props {
  points: SeriesPoint[];
  unit: string;
  height?: number;
}

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 220;
const PADDING_X = 8;
const PADDING_Y = 20;

/**
 * CoinMarketCap-style area/line chart: gradient fill under the line, colored
 * by whether the visible range moved up or down, plus a hover/touch
 * crosshair with a value tooltip. Hand-rolled SVG (no charting lib) — see
 * README § Decisões técnicas for the trade-off.
 */
export function PriceChart({ points, unit, height = 220 }: Props) {
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const pointerActive = useRef(false);

  if (points.length === 0) {
    return <p className="chart-empty">Sem observações para exibir.</p>;
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // avoid /0 when the series is flat

  const toX = (i: number) => PADDING_X + (i / Math.max(points.length - 1, 1)) * (VIEW_WIDTH - PADDING_X * 2);
  const toY = (v: number) => VIEW_HEIGHT - PADDING_Y - ((v - min) / range) * (VIEW_HEIGHT - PADDING_Y * 2);

  const first = points[0];
  const last = points[points.length - 1];
  const tone: 'up' | 'down' | 'flat' = last.value > first.value ? 'up' : last.value < first.value ? 'down' : 'flat';

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.value)}`).join(' ');
  const areaPath = `${linePath} L ${toX(points.length - 1)} ${VIEW_HEIGHT} L ${toX(0)} ${VIEW_HEIGHT} Z`;

  const active = hoverIndex !== null ? points[hoverIndex] : last;
  const activeIndex = hoverIndex ?? points.length - 1;

  function updateFromClientX(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    const viewX = ratio * VIEW_WIDTH;
    const step = (VIEW_WIDTH - PADDING_X * 2) / Math.max(points.length - 1, 1);
    const index = Math.round((viewX - PADDING_X) / step);
    setHoverIndex(Math.min(Math.max(index, 0), points.length - 1));
  }

  function handlePointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    // Mouse: hover-to-scrub. Touch/pen: only while actively pressed, so the
    // page can still be scrolled normally by a swipe that starts elsewhere.
    if (e.pointerType === 'mouse' || pointerActive.current) {
      updateFromClientX(e.clientX);
    }
  }

  function handlePointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    pointerActive.current = true;
    updateFromClientX(e.clientX);
  }

  function handlePointerUp() {
    pointerActive.current = false;
    setHoverIndex(null);
  }

  return (
    <div className={`price-chart price-chart--${tone}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        style={{ height }}
        role="img"
        aria-label={`Série temporal com ${points.length} observações, de ${first.date} a ${last.date}`}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {hoverIndex !== null && (
          <line
            x1={toX(activeIndex)}
            x2={toX(activeIndex)}
            y1={PADDING_Y}
            y2={VIEW_HEIGHT - PADDING_Y}
            stroke="currentColor"
            strokeOpacity={0.35}
            strokeWidth={1}
          />
        )}
        <circle cx={toX(activeIndex)} cy={toY(active.value)} r={4} fill="currentColor" />
      </svg>

      <div className="price-chart__tooltip" aria-hidden={hoverIndex === null}>
        <span className="price-chart__tooltip-date">{formatDate(active.date)}</span>
        <span className="price-chart__tooltip-value">{formatValue(active.value, unit)}</span>
      </div>
    </div>
  );
}
