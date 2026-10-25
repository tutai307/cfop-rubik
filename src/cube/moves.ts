import { STICKERS, stickerIndex, type Facelets, type Vec3 } from './facelets'

// Each move is a quarter turn of some layers about an axis. `sign` is the
// rotation direction about the positive axis: -1 for clockwise as seen from
// the positive side (R, U, F), +1 for faces looking down the negative axis.
interface TurnSpec {
  axis: 0 | 1 | 2
  layers: readonly number[]
  sign: 1 | -1
}

const TURNS = {
  U: { axis: 1, layers: [1], sign: -1 },
  D: { axis: 1, layers: [-1], sign: 1 },
  R: { axis: 0, layers: [1], sign: -1 },
  L: { axis: 0, layers: [-1], sign: 1 },
  F: { axis: 2, layers: [1], sign: -1 },
  B: { axis: 2, layers: [-1], sign: 1 },
  u: { axis: 1, layers: [0, 1], sign: -1 },
  d: { axis: 1, layers: [-1, 0], sign: 1 },
  r: { axis: 0, layers: [0, 1], sign: -1 },
  l: { axis: 0, layers: [-1, 0], sign: 1 },
  f: { axis: 2, layers: [0, 1], sign: -1 },
  b: { axis: 2, layers: [-1, 0], sign: 1 },
  M: { axis: 0, layers: [0], sign: 1 },
  E: { axis: 1, layers: [0], sign: 1 },
  S: { axis: 2, layers: [0], sign: -1 },
  x: { axis: 0, layers: [-1, 0, 1], sign: -1 },
  y: { axis: 1, layers: [-1, 0, 1], sign: -1 },
  z: { axis: 2, layers: [-1, 0, 1], sign: -1 },
} satisfies Record<string, TurnSpec>

export type MoveFamily = keyof typeof TURNS
export const MOVE_FAMILIES = Object.keys(TURNS) as MoveFamily[]

/** Quarter rotation of a vector about `axis` (0 x, 1 y, 2 z) in direction `s`. */
export function rotate(v: Vec3, axis: number, s: number): Vec3 {
  const [x, y, z] = v
  if (axis === 0) return [x, -s * z, s * y]
  if (axis === 1) return [s * z, y, -s * x]
  return [-s * y, s * x, z]
}

/** `src[j]` is the sticker whose color lands on position `j`. */
type Permutation = Uint8Array

function quarterTurn({ axis, layers, sign }: TurnSpec): Permutation {
  const src = Uint8Array.from({ length: 54 }, (_, i) => i)
  STICKERS.forEach((s, i) => {
    if (!layers.includes(s.pos[axis])) return
    src[stickerIndex(rotate(s.pos, axis, sign), rotate(s.normal, axis, sign))] = i
  })
  return src
}

function compose(first: Permutation, second: Permutation): Permutation {
  return second.map((i) => first[i])
}

// PERMS[family][amount - 1] for amount 1, 2, 3 (3 = prime).
const PERMS = new Map<MoveFamily, Permutation[]>(
  MOVE_FAMILIES.map((family) => {
    const p1 = quarterTurn(TURNS[family])
    const p2 = compose(p1, p1)
    return [family, [p1, p2, compose(p2, p1)]]
  }),
)

export function isMoveFamily(token: string): token is MoveFamily {
  return Object.hasOwn(TURNS, token)
}

/**
 * `dest[i]` is where the sticker at `i` ends up after the move. Used by the
 * solver to track single pieces without copying whole states.
 */
export function moveDestinations(family: MoveFamily, amount: 1 | 2 | 3): Uint8Array {
  const src = PERMS.get(family)![amount - 1]
  const dest = new Uint8Array(54)
  for (let j = 0; j < 54; j++) dest[src[j]] = j
  return dest
}

/** Applies a move to `state` and returns the new state. */
export function applyMove(state: Facelets, family: MoveFamily, amount: number): Facelets {
  const turns = ((amount % 4) + 4) % 4
  if (turns === 0) return state.slice()
  const src = PERMS.get(family)![turns - 1]
  const next = new Uint8Array(54)
  for (let j = 0; j < 54; j++) next[j] = state[src[j]]
  return next
}
