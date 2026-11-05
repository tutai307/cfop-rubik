import { setSearchDebug } from 'cubing/search'
import { beforeAll, describe, expect, it } from 'vitest'
import { OLL, PLL, recognizeOll, recognizePll } from '../algorithms'
import { applyAlg, isCrossSolved, isF2LSolved, isTopOriented, stateOf } from '../cube'
import { generateStageScramble, type Rng } from './stage-scramble'

/** Deterministic PRNG (mulberry32) so failures reproduce. */
function seeded(seed: number): Rng {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** State seen in the solving orientation (white D), as the solver and recognisers expect. */
const solvingState = (scramble: string) => applyAlg(stateOf(scramble), 'z2')

const ROUNDS = 5

beforeAll(() => setSearchDebug({ allowNodeStyleWorkers: true }))

describe('generateStageScramble', { timeout: 60_000 }, () => {
  it('F2L: cross solved, F2L not', async () => {
    const rng = seeded(1)
    for (let i = 0; i < ROUNDS; i++) {
      const { scramble } = await generateStageScramble('f2l', [], rng)
      const state = solvingState(scramble)
      expect(isCrossSolved(state), scramble).toBe(true)
      expect(isF2LSolved(state), scramble).toBe(false)
    }
  })

  it('OLL: F2L solved, last layer not oriented', async () => {
    const rng = seeded(2)
    for (let i = 0; i < ROUNDS; i++) {
      const { scramble } = await generateStageScramble('oll', [], rng)
      const state = solvingState(scramble)
      expect(isF2LSolved(state), scramble).toBe(true)
      expect(isTopOriented(state), scramble).toBe(false)
    }
  })

  it('PLL: last layer oriented, a real PLL case remains', async () => {
    const rng = seeded(3)
    for (let i = 0; i < ROUNDS; i++) {
      const { scramble } = await generateStageScramble('pll', [], rng)
      const state = solvingState(scramble)
      expect(isTopOriented(state), scramble).toBe(true)
      expect(recognizePll(state)?.caseId, scramble).toBeTruthy()
    }
  })

  it('OLL selection: only the chosen cases, with F2L solved', async () => {
    const rng = seeded(4)
    // Includes wide and slice-move algs, which shift centers while setting up.
    const chosen = OLL.filter((c) => ['OLL 2', 'OLL 21', 'OLL 57'].includes(c.id))
    for (let i = 0; i < ROUNDS; i++) {
      const { scramble, caseId } = await generateStageScramble('oll', chosen, rng)
      const state = solvingState(scramble)
      expect(isF2LSolved(state), scramble).toBe(true)
      expect(recognizeOll(state)?.caseId, scramble).toBe(caseId)
      expect(chosen.map((c) => c.id)).toContain(caseId)
    }
  })

  it('PLL selection: only the chosen cases', async () => {
    const rng = seeded(5)
    const chosen = PLL.filter((c) => ['PLL Aa', 'PLL H', 'PLL T'].includes(c.id))
    for (let i = 0; i < ROUNDS; i++) {
      const { scramble, caseId } = await generateStageScramble('pll', chosen, rng)
      expect(recognizePll(solvingState(scramble))?.caseId, scramble).toBe(caseId)
      expect(chosen.map((c) => c.id)).toContain(caseId)
    }
  })
})
