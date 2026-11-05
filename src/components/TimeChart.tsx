import { useMemo, useRef, useState } from 'react'
import { averageSeries, effectiveTime, formatTime, type Solve } from '../timer/stats'

// Sized for the stats column (~330 px) so labels render at their real size.
const WIDTH = 330
const HEIGHT = 190
const MARGIN = { top: 10, right: 10, bottom: 24, left: 46 }
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom
const Y_TICKS = 4

const finite = (t: number | null) => (t === null || t === Infinity ? null : t)

/** SVG path through the points, broken wherever a value is missing (DNF or not enough solves). */
function linePath(values: readonly (number | null)[], x: (i: number) => number, y: (v: number) => number): string {
  let path = ''
  let drawing = false
  values.forEach((v, i) => {
    if (v === null) {
      drawing = false
      return
    }
    path += `${drawing ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`
    drawing = true
  })
  return path
}

interface TimeChartProps {
  solves: readonly Solve[]
}

/** Every single as a dot with rolling ao5 and ao12 lines, oldest solve on the left. */
export function TimeChart({ solves }: TimeChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const data = useMemo(() => {
    const singles = solves.map((s) => finite(effectiveTime(s)))
    const ao5 = averageSeries(solves, 5).map(finite)
    const ao12 = averageSeries(solves, 12).map(finite)
    const values = [...singles, ...ao5, ...ao12].filter((v): v is number => v !== null)
    if (values.length === 0) return null
    const pad = Math.max((Math.max(...values) - Math.min(...values)) * 0.08, 500)
    const lo = Math.max(0, Math.min(...values) - pad)
    const hi = Math.max(...values) + pad
    return { singles, ao5, ao12, lo, hi }
  }, [solves])

  if (solves.length < 2 || !data) {
    return <p className="muted">Biểu đồ hiện khi có từ 2 lần giải.</p>
  }

  const n = solves.length
  const x = (i: number) => MARGIN.left + (n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W)
  const y = (v: number) => MARGIN.top + (1 - (v - data.lo) / (data.hi - data.lo)) * PLOT_H
  const ticks = Array.from({ length: Y_TICKS }, (_, k) => data.lo + ((k + 0.5) / Y_TICKS) * (data.hi - data.lo))

  const onMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const box = svgRef.current?.getBoundingClientRect()
    if (!box) return
    const px = ((event.clientX - box.left) / box.width) * WIDTH
    const i = Math.round(((px - MARGIN.left) / PLOT_W) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }

  const hovered = hover === null ? null : solves[hover]
  const tooltipLeft = hover === null ? 0 : (x(hover) / WIDTH) * 100

  return (
    <figure className="time-chart">
      <figcaption className="chart-legend">
        <span className="legend-item">
          <span className="legend-dot" /> Single
        </span>
        <span className="legend-item">
          <span className="legend-line series-1" /> ao5
        </span>
        <span className="legend-item">
          <span className="legend-line series-2" /> ao12
        </span>
      </figcaption>
      <div className="chart-frame">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Biểu đồ thời gian ${n} lần giải, kèm ao5 và ao12`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line className="chart-grid" x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={y(t)} y2={y(t)} />
              <text className="chart-tick" x={MARGIN.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">
                {formatTime(t)}
              </text>
            </g>
          ))}
          <text className="chart-tick" x={x(0)} y={HEIGHT - 8} textAnchor="start">
            #1
          </text>
          <text className="chart-tick" x={x(n - 1)} y={HEIGHT - 8} textAnchor="end">
            #{n}
          </text>
          {data.singles.map((v, i) =>
            v === null ? null : <circle key={i} className="chart-single" cx={x(i)} cy={y(v)} r={n > 150 ? 2 : 3} />,
          )}
          <path className="chart-line series-1" d={linePath(data.ao5, x, y)} />
          <path className="chart-line series-2" d={linePath(data.ao12, x, y)} />
          {hover !== null && (
            <line className="chart-crosshair" x1={x(hover)} x2={x(hover)} y1={MARGIN.top} y2={HEIGHT - MARGIN.bottom} />
          )}
          {/* Transparent hit area so hovering between points still picks the nearest solve. */}
          <rect x={MARGIN.left} y={MARGIN.top} width={PLOT_W} height={PLOT_H} fill="transparent" />
        </svg>
        {hovered && hover !== null && (
          <div
            className="chart-tooltip"
            style={{ left: `${tooltipLeft}%`, transform: `translateX(${tooltipLeft > 60 ? '-105%' : '5%'})` }}
          >
            <strong>Lần {hover + 1}</strong>
            <span>Single: {formatTime(effectiveTime(hovered))}</span>
            <span>ao5: {formatTime(data.ao5[hover])}</span>
            <span>ao12: {formatTime(data.ao12[hover])}</span>
          </div>
        )}
      </div>
    </figure>
  )
}
