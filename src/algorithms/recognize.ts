import {
  STICKERS,
  applyAlg,
  applyMove,
  centerOf,
  isSolved,
  isTopOriented,
  parseAlg,
  type Facelets,
  type Move,
} from '../cube'
import { caseState, frPairLocation } from './case-state'
import { F2L } from './f2l'
import { OLL } from './oll'
import { PLL } from './pll'
import type { AlgCase } from './types'

export const AUF = ['', 'U', 'U2', "U'"] as const
export type Auf = (typeof AUF)[number]

const applyU = (state: Facelets, turns: number) => applyMove(state, 'U', turns)

// --- Canonical keys modulo AUF ------------------------------------------------

/** Key of the FR pair placement, minimised over U turns applied first. */
export function f2lKey(state: Facelets): { key: string; preAuf: number } {
  let best = { key: '', preAuf: 0 }
  for (let t = 0; t < 4; t++) {
    const key = frPairLocation(applyU(state, t)).join(',')
    if (!best.key || key < best.key) best = { key, preAuf: t }
  }
  return best
}

const U_LAYER = STICKERS.flatMap((s, i) => (s.pos[1] === 1 ? [i] : []))

/** Which U-layer stickers show the U color, minimised over AUF. */
export function ollKey(state: Facelets): string {
  const u = state[centerOf(0)]
  let best = ''
  for (let t = 0; t < 4; t++) {
    const s = applyU(state, t)
    const key = U_LAYER.map((i) => (s[i] === u ? '1' : '0')).join('')
    if (!best || key < best) best = key
  }
  return best
}

const SIDE_FACES = [2, 4, 5, 1] // F L B R: a U turn moves each onto the next

/** U-layer colors minimised over AUF before and after (recolouring the sides). */
export function pllKey(state: Facelets): string {
  const sideColors = SIDE_FACES.map((face) => state[centerOf(face)])
  let best = ''
  for (let pre = 0; pre < 4; pre++) {
    const s = applyU(state, pre)
    for (let post = 0; post < 4; post++) {
      const key = U_LAYER.map((i) => {
        const side = sideColors.indexOf(s[i])
        return side < 0 ? 'u' : String((side + post) % 4)
      }).join('')
      if (!best || key < best) best = key
    }
  }
  return best
}

// --- Recognition --------------------------------------------------------------

interface ParsedCase {
  id: string
  moves: Move[]
}

const parsed = (cases: readonly AlgCase[]): ParsedCase[] =>
  cases.map((c) => ({ id: c.id, moves: parseAlg(c.alg) }))

let parsedOll: ParsedCase[] | undefined
let parsedPll: ParsedCase[] | undefined
let f2lByKey: Map<string, string> | undefined

export interface LastLayerMatch {
  /** `null` when only an AUF is needed. */
  caseId: string | null
  preAuf: Auf
  alg: string
  postAuf: Auf
}

/** Finds the OLL case and pre-AUF that orient the last layer. `null` if already oriented. */
export function recognizeOll(state: Facelets): LastLayerMatch | null {
  if (isTopOriented(state)) return null
  parsedOll ??= parsed(OLL)
  for (let pre = 0; pre < 4; pre++) {
    const s = applyU(state, pre)
    for (const c of parsedOll) {
      if (isTopOriented(applyAlg(s, c.moves))) {
        return { caseId: c.id, preAuf: AUF[pre], alg: OLL.find((o) => o.id === c.id)!.alg, postAuf: '' }
      }
    }
  }
  throw new Error('Không nhận diện được ca OLL')
}

/** Finds the PLL case with pre- and post-AUF that solve the cube. `null` if solved. */
export function recognizePll(state: Facelets): LastLayerMatch | null {
  for (let post = 0; post < 4; post++) {
    if (isSolved(applyU(state, post))) return post === 0 ? null : { caseId: null, preAuf: '', alg: '', postAuf: AUF[post] }
  }
  parsedPll ??= parsed(PLL)
  for (let pre = 0; pre < 4; pre++) {
    const s = applyU(state, pre)
    for (const c of parsedPll) {
      const after = applyAlg(s, c.moves)
      for (let post = 0; post < 4; post++) {
        if (isSolved(applyU(after, post))) {
          return { caseId: c.id, preAuf: AUF[pre], alg: PLL.find((p) => p.id === c.id)!.alg, postAuf: AUF[post] }
        }
      }
    }
  }
  throw new Error('Không nhận diện được ca PLL')
}

/** F2L case id of the FR pair, or `null` when the pair is outside FR/the U layer. */
export function recognizeF2L(state: Facelets): string | null {
  f2lByKey ??= new Map(F2L.map((c) => [f2lKey(caseState(c)).key, c.id]))
  return f2lByKey.get(f2lKey(state).key) ?? null
}
