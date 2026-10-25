import { describe, expect, it } from 'vitest'
import type { SolveStep } from '../solver/types'
import { appliedMoves, stepStarts, timelineMoves, type MoveIndexer } from './timeline'

/** Mimics cubing's SimultaneousMoveIndexer: moves of 100 ms back to back. */
function fakeIndexer(count: number): MoveIndexer {
  return {
    numAnimatedLeaves: () => count,
    indexToMoveStartTimestamp: (i: never) => (i as number) * 100,
    // First leaf starting at or after the timestamp, minus one (cubing's behaviour).
    timestampToIndex: (t: never) => {
      for (let i = 0; i < count; i++) if (i * 100 >= (t as number)) return i - 1
      return count - 1
    },
  }
}

describe('appliedMoves', () => {
  const indexer = fakeIndexer(5)

  it('counts a move as applied from the start of the next one', () => {
    expect(appliedMoves(indexer, 0, false)).toBe(0)
    expect(appliedMoves(indexer, 100, false)).toBe(1)
    expect(appliedMoves(indexer, 300, false)).toBe(3)
    expect(appliedMoves(indexer, 9999, true)).toBe(5)
  })

  it('reports the move in progress as not yet applied', () => {
    expect(appliedMoves(indexer, 150, false)).toBe(1)
    expect(appliedMoves(indexer, 450, false)).toBe(4)
  })
})

describe('timeline steps', () => {
  const step = (moves: string): SolveStep => ({ stage: 'F2L', label: '', moves, moveCount: 0 })
  const steps = [step('z2'), step(''), step("R U R'"), step('U2')]

  it('flattens moves and finds step starts', () => {
    expect(timelineMoves(steps).map((m) => `${m.token}@${m.step}`)).toEqual(['z2@0', 'R@2', 'U@2', "R'@2", 'U2@3'])
    expect(stepStarts(steps)).toEqual([0, 1, 1, 4])
  })
})
