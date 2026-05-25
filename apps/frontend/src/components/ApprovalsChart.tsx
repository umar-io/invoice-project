import { useId, useMemo } from 'react';
import { formatNaira } from '../lib/format';
import type { Invoice } from '../types';

type Props = {
  invoices: Invoice[];
  days?: number;
  height?: number;
};

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const ApprovalsChart = ({ invoices, days = 14, height = 180 }: Props) => {
  const id = useId().replace(/:/g, '');
  const fillId = `fill-${id}`;

  const series = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      buckets.set(dayKey(d), 0);
    }
    for (const inv of invoices) {
      if (inv.status === 'rejected' || inv.status === 'paid') continue;
      const k = dayKey(new Date(inv.created_at));
      if (buckets.has(k)) buckets.set(k, (buckets.get(k) || 0) + inv.amount);
    }
    let running = 0;
    const points: Array<{ key: string; date: Date; value: number }> = [];
    for (const [key, value] of buckets) {
      running += value;
      points.push({ key, date: new Date(key), value: running });
    }
    return points;
  }, [invoices, days]);

  const w = 720;
  const h = height;
  const padX = 0;
  const padTop = 14;
  const padBottom = 28;
  const innerW = w - padX * 2;
  const innerH = h - padTop - padBottom;

  const max = Math.max(...series.map((p) => p.value), 1);
  const min = 0;
  const range = max - min || 1;

  const xAt = (i: number) =>
    series.length > 1 ? padX + (i * innerW) / (series.length - 1) : padX + innerW / 2;
  const yAt = (v: number) => padTop + innerH - ((v - min) / range) * innerH;

  const pointsAttr = series.map((p, i) => `${xAt(i).toFixed(1)},${yAt(p.value).toFixed(1)}`).join(' ');
  const areaPath = `M ${xAt(0)},${h - padBottom} L ${pointsAttr.replace(/ /g, ' L ')} L ${xAt(series.length - 1)},${h - padBottom} Z`;

  const approxLen = Math.round(innerW + innerH);

  const tickIndices = series.length >= 4 ? [0, Math.floor(series.length / 3), Math.floor((series.length / 3) * 2), series.length - 1] : series.map((_, i) => i);
  const last = series[series.length - 1];

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        width="100%"
        height={h}
        className="block overflow-visible"
        aria-label="14-day outstanding value"
      >
        <defs>
          <linearGradient id={fillId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* horizontal grid */}
        {[0, 0.5, 1].map((p) => (
          <line
            key={p}
            x1={padX}
            x2={w - padX}
            y1={padTop + innerH * p}
            y2={padTop + innerH * p}
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity="0.1"
          />
        ))}

        {/* area */}
        <path d={areaPath} fill={`url(#${fillId})`} className="fade-in-slow text-ink" />

        {/* line */}
        <polyline
          points={pointsAttr}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
          className="draw-line text-ink"
          style={{ ['--len' as string]: approxLen } as React.CSSProperties}
        />

        {/* last point */}
        {last && (
          <g className="fade-in-slow text-ink">
            <rect
              x={xAt(series.length - 1) - 3}
              y={yAt(last.value) - 3}
              width="6"
              height="6"
              fill="currentColor"
              className="rotate-45 origin-center"
            />
          </g>
        )}

        {/* x-axis labels */}
        {tickIndices.map((i) => {
          const p = series[i];
          if (!p) return null;
          return (
            <text
              key={i}
              x={xAt(i)}
              y={h - 8}
              textAnchor={i === 0 ? 'start' : i === series.length - 1 ? 'end' : 'middle'}
              fill="currentColor"
              fillOpacity="0.4"
              fontSize="9"
              fontFamily="var(--font-mono)"
              fontWeight="400"
              className="uppercase tracking-tighter"
            >
              {p.date.toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}
            </text>
          );
        })}
      </svg>

      <span className="sr-only">
        Total outstanding (last {days} days): {formatNaira(last?.value || 0)}
      </span>
    </div>
  );
};
