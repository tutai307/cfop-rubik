import { findCase, recognizeOll, recognizePll } from '../algorithms'
import type { Facelets } from '../cube'
import type { SolveStep } from './types'

type StepDraft = Omit<SolveStep, 'moveCount'>

function recognition(caseId: string): string[] {
  const found = findCase(caseId)
  return found ? [`Nhận diện: nhóm “${found.group}”, ca ${found.name}.`] : []
}

const preAufReason = (preAuf: string) =>
  preAuf ? [`${preAuf} trước để xoay tầng trên về đúng góc nhìn của công thức (như hình trong thư viện).`] : []

export function ollStep(state: Facelets): StepDraft {
  const match = recognizeOll(state)
  if (!match) return { stage: 'OLL', label: 'OLL: đã định hướng sẵn (skip)', moves: '' }
  return {
    stage: 'OLL',
    label: match.caseId!,
    moves: `${match.preAuf} ${match.alg}`,
    caseId: match.caseId!,
    caseSet: 'OLL',
    reasons: [
      ...recognition(match.caseId!),
      ...preAufReason(match.preAuf),
      'Lời giải dùng OLL đầy đủ 57 ca; người mới có thể dùng 2-look OLL (cross vàng rồi định hướng góc) để học ít công thức hơn.',
    ],
  }
}

export function pllStep(state: Facelets): StepDraft {
  const match = recognizePll(state)
  if (!match) return { stage: 'PLL', label: 'PLL: khối đã giải (skip)', moves: '' }
  if (!match.caseId) {
    return { stage: 'PLL', label: 'PLL: skip, chỉ cần AUF', moves: match.postAuf, reasons: ['Tầng cuối đã đúng thứ tự, chỉ cần xoay U cho khớp tầng giữa.'] }
  }
  return {
    stage: 'PLL',
    label: match.caseId,
    moves: `${match.preAuf} ${match.alg} ${match.postAuf}`,
    caseId: match.caseId,
    caseSet: 'PLL',
    reasons: [
      ...recognition(match.caseId),
      ...preAufReason(match.preAuf),
      ...(match.postAuf ? [`${match.postAuf} cuối để căn tầng trên khớp với tầng giữa.`] : []),
    ],
  }
}
