import type { SolveStep } from '../solver/types'
import type { TimerSession } from '../timer/useSolves'

export interface TimelineMove {
  token: string
  step: number
}

/** Flattens steps into individual moves, remembering the step of each. */
export function timelineMoves(steps: readonly SolveStep[]): TimelineMove[] {
  return steps.flatMap((s, step) => (s.moves ? s.moves.split(' ').map((token) => ({ token, step })) : []))
}

/** Index of the first move of every step (steps without moves start where the next one does). */
export function stepStarts(steps: readonly SolveStep[]): number[] {
  let index = 0
  return steps.map((s) => {
    const start = index
    if (s.moves) index += s.moves.split(' ').length
    return start
  })
}

/** The parts of a cubing.js AlgIndexer used to map time to moves. */
export interface MoveIndexer {
  numAnimatedLeaves(): number
  timestampToIndex(timestamp: never): number
  indexToMoveStartTimestamp(index: never): number
}

/**
 * Moves fully applied at `timestamp`. cubing's indexer returns the previous
 * move when the timestamp sits exactly on a move start, so take the last move
 * that has started instead (a move in progress is not yet applied).
 */
export function appliedMoves(indexer: MoveIndexer, timestamp: number, atEnd: boolean): number {
  const count = indexer.numAnimatedLeaves()
  if (atEnd) return count
  let index = Math.max(0, indexer.timestampToIndex(timestamp as never))
  while (index + 1 <= count - 1 && indexer.indexToMoveStartTimestamp((index + 1) as never) <= timestamp) index++
  return index
}

const SESSION_STAGES: Record<TimerSession, readonly SolveStep['stage'][]> = {
  '333': ['Cross', 'F2L', 'OLL', 'PLL'],
  cross: ['Cross'],
  f2l: ['F2L'],
  oll: ['OLL'],
  pll: ['PLL'],
}

/**
 * Splits a CFOP solution into the moves that reach the trained stage (applied as setup,
 * so the cube starts there) and the stage's own steps with the rotations between them.
 */
export function stagePlan(steps: readonly SolveStep[], session: TimerSession): { setup: string; steps: SolveStep[] } {
  const wanted = SESSION_STAGES[session]
  let first = steps.findIndex((s) => wanted.includes(s.stage))
  // A rotation right before the stage (e.g. `y` to the first pair) belongs to it, so it is shown;
  // the opening z2 (index 0) stays in the setup.
  while (first > 1 && steps[first - 1].stage === 'Xoay') first--
  const last = steps.findLastIndex((s) => wanted.includes(s.stage))
  return {
    setup: steps.slice(0, first).map((s) => s.moves).filter(Boolean).join(' '),
    steps: steps.slice(first, last + 1).filter((s) => s.stage === 'Xoay' || (wanted.includes(s.stage) && s.moves)),
  }
}
