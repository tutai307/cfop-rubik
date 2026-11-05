import { describe, expect, it } from 'vitest'
import { applyAlg, stateOf } from '../cube'
import { solveCross } from './cross'
import { crossReasons, pairName } from './explain'
import { solveF2L } from './f2l'
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

  it.each(scrambles.slice(0, 20))('so sánh đúng các cặp F2L: %s', (scramble) => {
    const start = applyAlg(stateOf(scramble), 'z2')
    const f2l = solveF2L(applyAlg(start, solveCross(start)), Infinity)
    const total = f2l.pairs.reduce((sum, p) => sum + p.moves.length, 0)
    expect(total).toBeLessThanOrEqual(f2l.greedyMoves)
    f2l.pairs.forEach((pair, i) => {
      if (pair.moves.length === 0) return
      expect(pair.options.length).toBe(4 - i)
      expect(pair.options.find((o) => o.slot === pair.slot)?.moves).toBe(pair.moves.length)
    })
    for (const step of solve(scramble).steps) {
      if (step.stage !== 'Xoay' && step.moves) expect(step.reasons?.length).toBeGreaterThan(0)
    }
  })
})
