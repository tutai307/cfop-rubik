import { describe, expect, it } from 'vitest'
import { findCase } from '../algorithms'
import { applyAlg, countMoves, stateOf } from '../cube'
import { solveCross } from './cross'
import { crossReasons, pairName } from './explain'
import { ROTATION_COST, solveF2L } from './f2l'
import scrambles from './fixtures/scrambles-100.json'
import { solve } from './solve'

const solvingState = (alg: string) => applyAlg(stateOf('z2'), alg)

describe('giải thích', () => {
  it('đặt tên cặp theo màu tâm khi trắng dưới, xanh lá trước', () => {
    const state = solvingState('')
    expect(pairName(state, 'FR')).toBe('xanh lá-cam')
    expect(pairName(state, 'BL')).toBe('xanh dương-đỏ')
  })

  it('mô tả vị trí từng cạnh cross', () => {
    const reasons = crossReasons(solvingState('F2'), 2)
    expect(reasons).toContain('Cạnh trắng-xanh lá: ở tầng trên, trắng hướng lên.')
    expect(reasons).toContain('Cạnh trắng-cam: đã đúng chỗ.')
  })

  it.each(scrambles.slice(0, 20))('chọn cặp dễ nhất, giải bằng công thức thư viện: %s', (scramble) => {
    const start = applyAlg(stateOf(scramble), 'z2')
    const f2l = solveF2L(applyAlg(start, solveCross(start)))
    const cost = (o: { moves: number; rotation: number }) => o.moves + ROTATION_COST[o.rotation]
    f2l.pairs.forEach((pair, i) => {
      if (pair.moves.length === 0) return
      expect(pair.options.length).toBe(4 - i)
      const chosen = pair.options.find((o) => o.slot === pair.slot)!
      expect(chosen.moves).toBe(pair.moves.length)
      const standard = pair.options.filter((o) => o.caseId)
      if (standard.length > 0) {
        expect(pair.caseId).not.toBeNull()
        expect(cost(chosen)).toBe(Math.min(...standard.map(cost)))
        // Library alg with at most one AUF turn merged in front.
        const alg = findCase(pair.caseId!)!.alg
        expect(Math.abs(countMoves(alg) - pair.moves.length)).toBeLessThanOrEqual(1)
      }
    })
    for (const step of solve(scramble).steps) {
      if (step.stage !== 'Xoay' && step.moves) expect(step.reasons?.length).toBeGreaterThan(0)
    }
  })
})
