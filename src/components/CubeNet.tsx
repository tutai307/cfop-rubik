import { useMemo } from 'react'
import { MASKED_COLOR, renderNet, type Facelets } from '../cube'

interface CubeNetProps {
  state: Facelets
  /** Sticker to highlight; the others are dimmed. */
  highlight?: number
  /** Text drawn on stickers, e.g. Speffz letters. */
  labels?: ReadonlyMap<number, string>
  /** Only these stickers keep their color (others grey). */
  visible?: ReadonlySet<number>
  label: string
  className?: string
}

const GAP = 0.06

export function CubeNet({ state, highlight, labels, visible, label, className }: CubeNetProps) {
  const net = useMemo(() => renderNet(state), [state])
  return (
    <svg className={`cube-net ${className ?? ''}`} viewBox={`-0.1 -0.1 ${net.width + 0.2} ${net.height + 0.2}`} role="img" aria-label={label}>
      {net.stickers.map((s) => {
        const dim = highlight !== undefined && s.index !== highlight
        const fill = visible && !visible.has(s.index) ? MASKED_COLOR : s.fill
        return (
          <rect
            key={s.index}
            x={s.x + GAP}
            y={s.y + GAP}
            width={1 - 2 * GAP}
            height={1 - 2 * GAP}
            rx={0.12}
            fill={fill}
            opacity={dim ? 0.35 : 1}
            stroke={s.index === highlight ? 'var(--accent)' : '#1b1b1f'}
            strokeWidth={s.index === highlight ? 0.16 : 0.04}
          />
        )
      })}
      {labels &&
        net.stickers.map((s) =>
          labels.has(s.index) ? (
            <text key={`t${s.index}`} x={s.x + 0.5} y={s.y + 0.56} textAnchor="middle" dominantBaseline="middle" fontSize={0.48} fontWeight={700}
              // White with a dark outline stays legible on every sticker color.
              fill="#fff" stroke="#111" strokeWidth={0.1} paintOrder="stroke">
              {labels.get(s.index)}
            </text>
          ) : null,
        )}
    </svg>
  )
}
