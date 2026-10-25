import type { AlgSet } from '../algorithms'

export type Stage = 'Xoay' | 'Cross' | 'F2L' | 'OLL' | 'PLL'

export interface SolveStep {
  stage: Stage
  label: string
  /** Singmaster moves of this step, may be empty (skip). */
  moves: string
  /** Half-turn metric, rotations excluded. */
  moveCount: number
  caseId?: string
  caseSet?: AlgSet
}

export interface SolveResult {
  steps: SolveStep[]
  totalMoves: number
  /** True when the F2L order search hit the time budget before finishing. */
  approximate: boolean
  elapsedMs: number
}
