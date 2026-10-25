import { locatePiece } from '../algorithms/case-state'
import {
  STICKERS,
  centerOf,
  faceOf,
  moveDestinations,
  stickerIndex,
  type Facelets,
  type MoveFamily,
  type Vec3,
} from '../cube'

// Search state: each tracked piece is the location (0..23) of its reference
// sticker among the 24 corner or 24 edge stickers. Location encodes both
// position and orientation, and a move is a lookup table on it.

export interface SearchMove {
  family: MoveFamily
  amount: 1 | 2 | 3
  /** Index of the face in U R F D L B, for pruning consecutive moves. */
  face: number
}

const FACE_LETTERS = 'URFDLB'

export function makeMoves(faces: string): SearchMove[] {
  return [...faces].flatMap((letter) =>
    ([1, 2, 3] as const).map((amount) => ({ family: letter as MoveFamily, amount, face: FACE_LETTERS.indexOf(letter) })),
  )
}

/** All 18 face turns, for the cross. */
export const FACE_MOVES = makeMoves('URFDLB')
/** F2L moves after rotating the target slot to FR. */
export const F2L_MOVES = makeMoves('URFL')

const isCorner = (pos: Vec3) => pos.every((v) => v !== 0)
const isEdge = (pos: Vec3) => pos.filter((v) => v !== 0).length === 2

const CORNER_STICKERS = STICKERS.flatMap((s, i) => (isCorner(s.pos) ? [i] : []))
const EDGE_STICKERS = STICKERS.flatMap((s, i) => (isEdge(s.pos) ? [i] : []))
const CORNER_LOCAL = new Map(CORNER_STICKERS.map((s, i) => [s, i]))
const EDGE_LOCAL = new Map(EDGE_STICKERS.map((s, i) => [s, i]))

export const cornerLocation = (sticker: number) => CORNER_LOCAL.get(sticker)!
export const edgeLocation = (sticker: number) => EDGE_LOCAL.get(sticker)!

/** `table[move * 24 + location]` = location after the move. */
export interface MoveTables {
  corner: Int8Array
  edge: Int8Array
}

export function buildMoveTables(moves: readonly SearchMove[]): MoveTables {
  const corner = new Int8Array(moves.length * 24)
  const edge = new Int8Array(moves.length * 24)
  moves.forEach((m, mi) => {
    const dest = moveDestinations(m.family, m.amount)
    CORNER_STICKERS.forEach((s, i) => (corner[mi * 24 + i] = cornerLocation(dest[s])))
    EDGE_STICKERS.forEach((s, i) => (edge[mi * 24 + i] = edgeLocation(dest[s])))
  })
  return { corner, edge }
}

// --- Pieces of the first two layers, by their home position ---------------------

const D_NORMAL: Vec3 = [0, -1, 0]

/** Home locations of the four cross edges (D sticker), order DF DR DB DL. */
export const CROSS_HOMES: readonly number[] = ([[0, -1, 1], [1, -1, 0], [0, -1, -1], [-1, -1, 0]] as Vec3[]).map((p) =>
  edgeLocation(stickerIndex(p, D_NORMAL)),
)

/** Slots in y-rotation order: a `y` turn moves the pieces of slot k into slot k + 1. */
export const SLOT_NAMES = ['FR', 'FL', 'BL', 'BR'] as const
export type SlotName = (typeof SLOT_NAMES)[number]
const SLOT_XZ: Record<SlotName, [number, number]> = { FR: [1, 1], FL: [-1, 1], BL: [-1, -1], BR: [1, -1] }

export interface SlotHome {
  corner: number
  edge: number
}

/** Home locations of a slot's corner (D sticker) and edge (F/B sticker). */
export const SLOT_HOMES: Record<SlotName, SlotHome> = Object.fromEntries(
  SLOT_NAMES.map((name) => {
    const [x, z] = SLOT_XZ[name]
    return [
      name,
      {
        corner: cornerLocation(stickerIndex([x, -1, z], D_NORMAL)),
        edge: edgeLocation(stickerIndex([x, 0, z], [0, 0, z])),
      },
    ]
  }),
) as Record<SlotName, SlotHome>

// --- Reading pieces from a facelet state (colors relative to centers) -----------

const homeColors = (state: Facelets, sticker: number) => {
  const pos = STICKERS[sticker].pos
  return STICKERS.flatMap((s, i) => (s.pos.every((v, k) => v === pos[k]) ? [state[centerOf(faceOf(i))]] : []))
}

/** Current location of the corner whose home reference sticker is `homeSticker`. */
function trackCorner(state: Facelets, home: number): number {
  const sticker = CORNER_STICKERS[home]
  return cornerLocation(locatePiece(state, homeColors(state, sticker), state[centerOf(faceOf(sticker))]))
}

function trackEdge(state: Facelets, home: number): number {
  const sticker = EDGE_STICKERS[home]
  return edgeLocation(locatePiece(state, homeColors(state, sticker), state[centerOf(faceOf(sticker))]))
}

export function crossLocations(state: Facelets): number[] {
  return CROSS_HOMES.map((home) => trackEdge(state, home))
}

export function slotLocations(state: Facelets, slot: SlotName): SlotHome {
  const home = SLOT_HOMES[slot]
  return { corner: trackCorner(state, home.corner), edge: trackEdge(state, home.edge) }
}
