import { useEffect, useRef } from 'react'
import { caseHref } from '../lib/library-routes'
import { stepStarts } from '../lib/timeline'
import type { SolveStep } from '../solver/types'

interface StepTimelineProps {
  steps: readonly SolveStep[]
  /** Number of moves already applied. */
  current: number
  /** While playing, the move being animated is highlighted instead of the last applied one. */
  playing?: boolean
  onSeek: (moveIndex: number) => void
}

export function StepTimeline({ steps, current, playing = false, onSeek }: StepTimelineProps) {
  const starts = stepStarts(steps)
  const activeRef = useRef<HTMLButtonElement>(null)
  const highlighted = playing ? current : current - 1

  // Keep the highlighted move visible inside a scrollable panel only; scrolling
  // the window would push the cube off-screen on narrow layouts.
  useEffect(() => {
    const token = activeRef.current
    const panel = token?.closest<HTMLElement>('[data-scroll-container]')
    if (!token || !panel || panel.scrollHeight <= panel.clientHeight) return
    const tokenBox = token.getBoundingClientRect()
    const panelBox = panel.getBoundingClientRect()
    if (tokenBox.top < panelBox.top) panel.scrollTop -= panelBox.top - tokenBox.top + 8
    else if (tokenBox.bottom > panelBox.bottom) panel.scrollTop += tokenBox.bottom - panelBox.bottom + 8
  }, [highlighted])

  return (
    <ol className="timeline">
      {steps.map((step, i) => {
        const tokens = step.moves ? step.moves.split(' ') : []
        const start = starts[i]
        const active = current > start && current <= start + tokens.length
        return (
          <li key={i} className={`timeline-step stage-${step.stage === 'Xoay' ? 'rotate' : step.stage.toLowerCase()}`} data-active={active || undefined}>
            <div className="timeline-head">
              <button type="button" className="timeline-label" onClick={() => onSeek(start)}>
                {step.label}
              </button>
              <span className="timeline-count">
                {step.stage === 'Xoay' ? 'xoay' : `${step.moveCount} nước`}
              </span>
            </div>
            {tokens.length > 0 && (
              <div className="timeline-moves">
                {tokens.map((token, k) => {
                  const moveIndex = start + k
                  const isCurrent = moveIndex === highlighted
                  return (
                    <button
                      key={k}
                      type="button"
                      ref={isCurrent ? activeRef : undefined}
                      className="move-token"
                      aria-current={isCurrent ? 'step' : undefined}
                      data-done={moveIndex < current || undefined}
                      onClick={() => onSeek(moveIndex + 1)}
                      title={step.stage === 'Xoay' ? 'Xoay khối' : undefined}
                    >
                      {token}
                    </button>
                  )
                })}
              </div>
            )}
            {step.caseId && step.caseSet && (
              <a className="timeline-case" href={caseHref(step.caseSet, step.caseId)}>
                Xem {step.caseId} trong thư viện
              </a>
            )}
          </li>
        )
      })}
    </ol>
  )
}
