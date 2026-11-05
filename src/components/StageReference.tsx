import { useEffect } from 'react'
import { useSolver } from '../hooks/useSolver'
import { caseHref } from '../lib/library-routes'
import type { SolveStep } from '../solver/types'
import type { TimerSession } from '../timer/useSolves'

const SESSION_STAGES: Record<TimerSession, readonly SolveStep['stage'][]> = {
  '333': ['Cross', 'F2L', 'OLL', 'PLL'],
  cross: ['Cross'],
  f2l: ['F2L'],
  oll: ['OLL'],
  pll: ['PLL'],
}

/** Steps of the trained stages, with the rotations between them. */
function stepsFor(steps: readonly SolveStep[], session: TimerSession): SolveStep[] {
  const wanted = SESSION_STAGES[session]
  const first = steps.findIndex((s) => wanted.includes(s.stage))
  const last = steps.findLastIndex((s) => wanted.includes(s.stage))
  return steps.slice(first, last + 1).filter((s) => s.stage === 'Xoay' || (wanted.includes(s.stage) && s.moves))
}

interface StageReferenceProps {
  scramble: string
  session: TimerSession
}

/** The app's CFOP solution of a finished scramble, limited to the stage being trained. */
export function StageReference({ scramble, session }: StageReferenceProps) {
  const { state, solve } = useSolver()
  useEffect(() => solve(scramble), [scramble, solve])

  if (state.status === 'solving' || state.status === 'idle') return <p className="muted">Đang tìm lời giải…</p>
  if (state.status === 'error') return <p className="error">{state.message}</p>

  const steps = stepsFor(state.result.steps, session)
  const moves = steps.reduce((sum, s) => sum + s.moveCount, 0)
  return (
    <div className="stage-reference">
      <p className="muted">
        Cầm trắng dưới, xanh lá trước (z2 sau scramble) · {moves} nước
      </p>
      <ol>
        {steps.map((step, i) => (
          <li key={i} className={`timeline-step stage-${step.stage.toLowerCase()}`}>
            <span className="timeline-label">{step.label}</span>
            {step.moves && <p className="alg-text">{step.moves}</p>}
            {step.caseId && step.caseSet && (
              <a className="timeline-case" href={caseHref(step.caseSet, step.caseId)}>
                Xem {step.caseId} trong thư viện
              </a>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
