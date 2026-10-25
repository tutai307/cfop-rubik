import { useMemo } from 'react'
import { caseState, type AlgCase, type AlgSet } from '../algorithms'
import { renderDiagram, type DiagramMask, type DiagramView } from '../cube'

const DISPLAY: Record<AlgSet, { view: DiagramView; mask: DiagramMask }> = {
  F2L: { view: 'iso', mask: 'f2l' },
  OLL: { view: 'top', mask: 'oll' },
  OLL2: { view: 'top', mask: 'oll' },
  PLL: { view: 'top', mask: 'full' },
  PLL2: { view: 'top', mask: 'full' },
}

interface CaseDiagramProps {
  algCase: AlgCase
  size?: number
}

export function CaseDiagram({ algCase, size = 120 }: CaseDiagramProps) {
  const diagram = useMemo(() => {
    const { view, mask } = DISPLAY[algCase.set]
    return renderDiagram(caseState(algCase), view, mask)
  }, [algCase])

  return (
    <svg
      className="case-diagram"
      viewBox={diagram.viewBox}
      width={size}
      height={size}
      role="img"
      aria-label={`Hình ca ${algCase.id}`}
    >
      {diagram.polygons.map((p, i) => (
        <polygon key={i} points={p.points} fill={p.fill} stroke="#1b1b1f" strokeWidth={0.04} strokeLinejoin="round" />
      ))}
    </svg>
  )
}
