import { recognizeOll, recognizePll } from '../algorithms'
import type { Facelets } from '../cube'
import type { SolveStep } from './types'

type StepDraft = Omit<SolveStep, 'moveCount'>

export function ollStep(state: Facelets): StepDraft {
  const match = recognizeOll(state)
  if (!match) return { stage: 'OLL', label: 'OLL: đã định hướng sẵn (skip)', moves: '' }
  return {
    stage: 'OLL',
    label: match.caseId!,
    moves: `${match.preAuf} ${match.alg}`,
    caseId: match.caseId!,
    caseSet: 'OLL',
  }
}

export function pllStep(state: Facelets): StepDraft {
  const match = recognizePll(state)
  if (!match) return { stage: 'PLL', label: 'PLL: khối đã giải (skip)', moves: '' }
  if (!match.caseId) return { stage: 'PLL', label: 'PLL: skip, chỉ cần AUF', moves: match.postAuf }
  return {
    stage: 'PLL',
    label: match.caseId,
    moves: `${match.preAuf} ${match.alg} ${match.postAuf}`,
    caseId: match.caseId,
    caseSet: 'PLL',
  }
}
