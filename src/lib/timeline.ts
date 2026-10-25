import type { SolveStep } from '../solver/types'

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
