import { describe, expect, it } from 'vitest'
import {
  SLOTS,
  applyAlg,
  isCrossSolved,
  isSolved,
  isTopOriented,
  parseAlg,
  solvedSlots,
  stateOf,
} from '../cube'
import { crossDistance, solveCross } from './cross'
import { FACE_MOVES, buildMoveTables, crossLocations, CROSS_HOMES } from './cubie'
import scrambles from './fixtures/scrambles-100.json'
import { solve } from './solve'

const inSolvingOrientation = (scramble: string) => applyAlg(stateOf(scramble), 'z2')

/** Plain depth-limited search with no pruning table, as an independent check. */
function crossSolvableIn(state: ReturnType<typeof stateOf>, depth: number): boolean {
  const tables = buildMoveTables(FACE_MOVES)
  const goal = CROSS_HOMES.join()
  const dfs = (edges: number[], d: number, lastFace: number): boolean => {
    if (edges.join() === goal) return true
    if (d === 0) return false
    return FACE_MOVES.some((m, mi) => m.face !== lastFace && dfs(edges.map((e) => tables.edge[mi * 24 + e]), d - 1, m.face))
  }
  return dfs(crossLocations(state), depth, -1)
}

describe('cross', () => {
  it.each(scrambles.slice(0, 20))('ngắn nhất cho %s', (scramble) => {
    const state = inSolvingOrientation(scramble)
    const moves = solveCross(state)
    expect(isCrossSolved(applyAlg(state, moves))).toBe(true)
    expect(moves.length).toBe(crossDistance(state))
    if (moves.length <= 6 && moves.length > 0) expect(crossSolvableIn(state, moves.length - 1)).toBe(false)
  })
})

describe('solve', () => {
  const timings: number[] = []
  const stageMoves: Record<string, number[]> = {}

  it.each(scrambles)('giải đúng theo chặng: %s', (scramble) => {
    const result = solve(scramble)
    timings.push(result.elapsedMs)
    let state = stateOf(scramble)
    let pairsDone = 0
    for (const step of result.steps) {
      state = applyAlg(state, step.moves)
      ;(stageMoves[step.stage] ??= []).push(step.moveCount)
      if (step.stage === 'Xoay') expect(step.moves).toMatch(/^(z2|y|y2|y')?$/)
      if (step.stage === 'Cross') expect(isCrossSolved(state)).toBe(true)
      if (step.stage === 'F2L') {
        pairsDone++
        expect(step.moves).toMatch(/^([URFL]['2]? ?)*$/)
        expect(isCrossSolved(state)).toBe(true)
        expect(solvedSlots(state).length).toBeGreaterThanOrEqual(pairsDone)
      }
      if (step.stage === 'OLL') {
        expect(solvedSlots(state)).toEqual(SLOTS)
        expect(isTopOriented(state)).toBe(true)
      }
    }
    expect(pairsDone).toBe(4)
    expect(isSolved(state)).toBe(true)
    expect(result.totalMoves).toBe(result.steps.reduce((s, x) => s + x.moveCount, 0))
    expect(parseAlg(result.steps[0].moves)).toEqual(parseAlg('z2'))
  })

  it('thống kê thời gian', () => {
    const sorted = [...timings].sort((a, b) => a - b)
    const pct = (p: number) => Math.round(sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))])
    const avg = (xs: number[]) => (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1)
    console.log(
      `solve ms p50=${pct(50)} p95=${pct(95)} max=${Math.round(sorted[sorted.length - 1])};`,
      Object.entries(stageMoves).map(([k, v]) => `${k}=${avg(v)}`).join(' '),
    )
    expect(timings.length).toBe(scrambles.length)
  })
})
