import {
  centerOf,
  faceOf,
  formatAlg,
  invert,
  moveDestinations,
  solvedFacelets,
  type Facelets,
  type Move,
  type MoveFamily,
} from '../cube'
import { LETTERS, letterOf, pieceStickers, stickerOf, type PieceKind } from './speffz'

// Old Pochmann. Swap algorithms and parity were checked against the cube
// model (see bld.test.ts): each swaps exactly the pieces listed.

/** Edge buffer B (UR), swapped with D (UL) by the T-perm, which also swaps corners UFR/UBR. */
export const EDGE_BUFFER = 'B'
export const EDGE_HELPER = 'D'
export const EDGE_SWAP = "R U R' U' R' F R2 U' R' U' R U R' F'"

/** Corner buffer A (ULB), swapped with P (RDF); the alg also swaps edges UL/UB. */
export const CORNER_BUFFER = 'A'
export const CORNER_HELPER = 'P'
export const CORNER_SWAP = "R U' R' U' R U R' F' R U R' U' R' F R"

/** After an odd number of edge swaps: Ra-perm + U' swaps UFR/UBR back and UL/UB. */
export const PARITY_ALG = "R U' R' U' R U R D R' U' R D' R' U2 R' U'"

/** Setup moves never touch the buffer or the pieces the swap algorithm uses. */
const SETUP_MOVES: Record<PieceKind, MoveFamily[]> = {
  edge: ['L', 'D', 'l', 'd', 'M', 'E'],
  corner: ['R', 'D', 'F'],
}

const BUFFER: Record<PieceKind, string> = { edge: EDGE_BUFFER, corner: CORNER_BUFFER }
const HELPER: Record<PieceKind, string> = { edge: EDGE_HELPER, corner: CORNER_HELPER }
const SWAP: Record<PieceKind, string> = { edge: EDGE_SWAP, corner: CORNER_SWAP }

const pieceOf = (kind: PieceKind, letter: string) => {
  const sticker = stickerOf(kind, letter)
  return [sticker, ...pieceStickers(sticker)]
}

/** Letters of the buffer piece (they can never be targets). */
export function bufferLetters(kind: PieceKind): string[] {
  return pieceOf(kind, BUFFER[kind]).map((s) => letterOf(s)!.letter)
}

/** Shortest setup (by BFS over sticker positions) moving `letter` onto the helper sticker. */
function findSetup(kind: PieceKind, letter: string): Move[] {
  const from = stickerOf(kind, letter)
  const to = stickerOf(kind, HELPER[kind])
  const moves: Move[] = SETUP_MOVES[kind].flatMap((family) =>
    ([1, 3, 2] as const).map((amount) => ({ family, amount })),
  )
  const dests = moves.map((m) => moveDestinations(m.family, m.amount))
  const parent = new Map<number, { prev: number; move: number }>([[from, { prev: -1, move: -1 }]])
  const queue = [from]
  for (let head = 0; head < queue.length && !parent.has(to); head++) {
    const at = queue[head]
    dests.forEach((dest, m) => {
      const next = dest[at]
      if (!parent.has(next)) {
        parent.set(next, { prev: at, move: m })
        queue.push(next)
      }
    })
  }
  const path: Move[] = []
  for (let at = to; at !== from; ) {
    const step = parent.get(at)
    if (!step) throw new Error(`Không có setup cho ${letter}`)
    path.unshift(moves[step.move])
    at = step.prev
  }
  return path
}

export interface SetupEntry {
  letter: string
  setup: string
  undo: string
}

function buildSetups(kind: PieceKind): Map<string, SetupEntry> {
  const excluded = bufferLetters(kind)
  return new Map(
    [...LETTERS]
      .filter((letter) => !excluded.includes(letter))
      .map((letter) => {
        const setup = findSetup(kind, letter)
        return [letter, { letter, setup: formatAlg(setup), undo: formatAlg(invert(setup)) }]
      }),
  )
}

export const SETUPS: Record<PieceKind, Map<string, SetupEntry>> = {
  edge: buildSetups('edge'),
  corner: buildSetups('corner'),
}

// --- Memo -------------------------------------------------------------------

const homeColor = (state: Facelets, sticker: number) => state[centerOf(faceOf(sticker))]
const isPieceSolved = (state: Facelets, stickers: number[]) => stickers.every((s) => state[s] === homeColor(state, s))

/** Sticker whose home is the color at `sticker`, on the piece with the same colors. */
function homeOf(state: Facelets, sticker: number): number {
  const colors = [sticker, ...pieceStickers(sticker)].map((s) => state[s])
  for (const letter of LETTERS) {
    for (const kind of ['edge', 'corner'] as const) {
      const piece = pieceOf(kind, letter)
      if (piece.length !== colors.length) continue
      if (homeColor(state, piece[0]) === colors[0] && piece.every((s) => colors.includes(homeColor(state, s)))) {
        return piece[0]
      }
    }
  }
  throw new Error('Không xác định được vị trí gốc của mảnh')
}

/** Swaps buffer and target pieces, sticker for sticker (what setup + swap alg + undo does). */
function swapPieces(state: Facelets, kind: PieceKind, letter: string): void {
  const buffer = pieceOf(kind, BUFFER[kind])
  const target = pieceOf(kind, letter)
  buffer.forEach((b, i) => {
    const t = target[i]
    const color = state[b]
    state[b] = state[t]
    state[t] = color
  })
}

/**
 * Memo letters for one piece type. On a cycle break, `pickBreak` chooses among
 * the letters of unsolved pieces (default: the first, as the guide teaches).
 */
export function traceMemo(
  scrambled: Facelets,
  kind: PieceKind,
  pickBreak: (candidates: string[]) => string = (candidates) => candidates[0],
): string[] {
  const state = scrambled.slice()
  const excluded = bufferLetters(kind)
  const buffer = stickerOf(kind, BUFFER[kind])
  const letters: string[] = []
  for (let guard = 0; guard < 40; guard++) {
    let target = letterOf(homeOf(state, buffer))!.letter
    if (excluded.includes(target)) {
      const candidates = [...LETTERS].filter((l) => !excluded.includes(l) && !isPieceSolved(state, pieceOf(kind, l)))
      if (candidates.length === 0) return letters
      target = pickBreak(candidates)
    }
    letters.push(target)
    swapPieces(state, kind, target)
  }
  throw new Error('Memo không kết thúc')
}

/**
 * Whether `letters` solve this piece type when shot from the buffer in order.
 * Any valid memo passes, not only the one `traceMemo` picks.
 */
export function memoSolves(scrambled: Facelets, kind: PieceKind, letters: readonly string[]): boolean {
  const excluded = bufferLetters(kind)
  if (letters.some((l) => !LETTERS.includes(l) || excluded.includes(l))) return false
  const state = scrambled.slice()
  letters.forEach((l) => swapPieces(state, kind, l))
  const solved = solvedFacelets()
  return [...LETTERS].every((l) => pieceOf(kind, l).every((s) => state[s] === solved[s]))
}

/** OP parity: the edge memo has an odd number of letters (the corner memo then does too). */
export function hasParity(scrambled: Facelets): boolean {
  return traceMemo(scrambled, 'edge').length % 2 === 1
}

/** Groups letters in pairs for reading: `AB CD E`. */
export const pairUp = (letters: readonly string[]) =>
  letters.reduce<string[]>((pairs, l, i) => (i % 2 ? [...pairs.slice(0, -1), pairs[pairs.length - 1] + l] : [...pairs, l]), []).join(' ')

// --- Execution ----------------------------------------------------------------

export type OpStep =
  | { kind: PieceKind; letter: string; setup: string; alg: string; undo: string }
  | { kind: 'parity'; alg: string }

export interface OpSolution {
  edges: string[]
  corners: string[]
  parity: boolean
  steps: OpStep[]
}

export const stepMoves = (step: OpStep) =>
  step.kind === 'parity' ? step.alg : [step.setup, step.alg, step.undo].filter(Boolean).join(' ')

export function solveOp(scrambled: Facelets): OpSolution {
  const edges = traceMemo(scrambled, 'edge')
  const corners = traceMemo(scrambled, 'corner')
  const parity = edges.length % 2 === 1
  const swap = (kind: PieceKind) => (letter: string): OpStep => {
    const { setup, undo } = SETUPS[kind].get(letter)!
    return { kind, letter, setup, alg: SWAP[kind], undo }
  }
  return {
    edges,
    corners,
    parity,
    steps: [...edges.map(swap('edge')), ...(parity ? [{ kind: 'parity' as const, alg: PARITY_ALG }] : []), ...corners.map(swap('corner'))],
  }
}
