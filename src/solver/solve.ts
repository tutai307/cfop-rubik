import { SOLVING_ORIENTATION, recognizeF2L } from '../algorithms'
import { applyAlg, countMoves, formatAlg, isSolved, parseAlg, simplify, stateOf, type Move } from '../cube'
import { solveCross } from './cross'
import { solveF2L } from './f2l'
import { ollStep, pllStep } from './last-layer'
import type { SolveResult, SolveStep } from './types'

export interface SolveOptions {
  /** Time allowed for the F2L order search before returning the best so far. */
  timeBudgetMs?: number
  now?: () => number
}

const ROTATION_NAMES = ['', 'y', 'y2', "y'"]
const SLOT_LABELS: Record<string, string> = {
  FR: 'trước-phải',
  FL: 'trước-trái',
  BL: 'sau-trái',
  BR: 'sau-phải',
}

function makeStep(draft: Omit<SolveStep, 'moveCount'>): SolveStep {
  const moves = formatAlg(simplify(parseAlg(draft.moves)))
  return { ...draft, moves, moveCount: countMoves(moves) }
}

/** CFOP solution of a WCA-oriented scramble: Cross → F2L (4 pairs) → OLL → PLL. */
export function solve(scramble: string, { timeBudgetMs = 4000, now = () => performance.now() }: SolveOptions = {}): SolveResult {
  const started = now()
  const steps: SolveStep[] = [
    makeStep({ stage: 'Xoay', label: 'Xoay khối: trắng xuống đáy', moves: SOLVING_ORIENTATION }),
  ]
  let state = applyAlg(stateOf(scramble), SOLVING_ORIENTATION)

  const cross = solveCross(state)
  steps.push(makeStep({ stage: 'Cross', label: 'Cross trắng', moves: formatAlg(cross) }))
  state = applyAlg(state, cross)

  const f2l = solveF2L(state, started + timeBudgetMs, now)
  f2l.pairs.forEach((pair, i) => {
    if (pair.rotation) {
      steps.push(makeStep({ stage: 'Xoay', label: 'Xoay khối', moves: ROTATION_NAMES[pair.rotation] }))
    }
    const caseId = pair.moves.length > 0 ? recognizeF2L(pair.before) : null
    const where = `khe ${SLOT_LABELS[pair.slot]}`
    const label =
      pair.moves.length === 0
        ? `F2L ${i + 1}: ${where} (đã xong sẵn)`
        : `F2L ${i + 1}: ${where}${caseId ? ` · ${caseId}` : ' · cặp không ở dạng chuẩn'}`
    steps.push(makeStep({
      stage: 'F2L',
      label,
      moves: formatAlg(pair.moves),
      ...(caseId ? { caseId, caseSet: 'F2L' as const } : {}),
    }))
  })

  // Trailing U turns of the last pair merge into the last-layer pre-AUF.
  const lastF2L = steps[steps.length - 1]
  const lastMoves = parseAlg(lastF2L.moves)
  const trailing: Move[] = []
  while (lastMoves.length > 0 && lastMoves[lastMoves.length - 1].family === 'U') trailing.unshift(lastMoves.pop()!)
  if (trailing.length > 0) steps[steps.length - 1] = makeStep({ ...lastF2L, moves: formatAlg(lastMoves) })

  state = applyAlg(stateOf(scramble), steps.map((s) => s.moves).join(' '))
  const oll = ollStep(state)
  steps.push(makeStep(oll))
  state = applyAlg(state, oll.moves)
  const pll = pllStep(state)
  steps.push(makeStep(pll))
  state = applyAlg(state, pll.moves)

  if (!isSolved(state)) throw new Error('Lời giải không đưa khối về trạng thái đã giải')
  return {
    steps,
    totalMoves: steps.reduce((sum, s) => sum + s.moveCount, 0),
    approximate: f2l.approximate,
    elapsedMs: now() - started,
  }
}
