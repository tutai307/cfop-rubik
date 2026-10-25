import { STICKERS } from '../cube'

// Speffz lettering: faces U L F R B D get A–D, E–H, I–L, M–P, Q–T, U–X, each
// face lettered clockwise from its top-left as seen in the standard net. Our
// facelet faces use the same net orientation, only in U R F D L B order.

const SPEFFZ_FACES = [0, 4, 2, 1, 5, 3] // U L F R B D in facelet face indices
const CORNER_CELLS = [0, 2, 8, 6]
const EDGE_CELLS = [1, 5, 7, 3]

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWX'

function buildLetters(cells: number[]): Map<string, number> {
  const map = new Map<string, number>()
  SPEFFZ_FACES.forEach((face, f) => cells.forEach((cell, k) => map.set(LETTERS[f * 4 + k], face * 9 + cell)))
  return map
}

/** Letter → facelet index of that sticker. */
export const CORNER_STICKER = buildLetters(CORNER_CELLS)
export const EDGE_STICKER = buildLetters(EDGE_CELLS)

const invert = (map: Map<string, number>) => new Map([...map].map(([letter, sticker]) => [sticker, letter]))
const CORNER_LETTER = invert(CORNER_STICKER)
const EDGE_LETTER = invert(EDGE_STICKER)

export type PieceKind = 'corner' | 'edge'

export function letterOf(sticker: number): { letter: string; kind: PieceKind } | null {
  const corner = CORNER_LETTER.get(sticker)
  if (corner) return { letter: corner, kind: 'corner' }
  const edge = EDGE_LETTER.get(sticker)
  return edge ? { letter: edge, kind: 'edge' } : null
}

export function stickerOf(kind: PieceKind, letter: string): number {
  return (kind === 'corner' ? CORNER_STICKER : EDGE_STICKER).get(letter)!
}

/** The other stickers of the same piece, in clockwise order seen from outside (corners). */
export function pieceStickers(sticker: number): number[] {
  const { pos } = STICKERS[sticker]
  const others = STICKERS.flatMap((s, i) => (i !== sticker && s.pos.every((v, k) => v === pos[k]) ? [i] : []))
  if (others.length < 2) return others
  // Order the two others so (sticker, a, b) turns the same way around every corner.
  const n = STICKERS[sticker].normal
  const m = STICKERS[others[0]].normal
  const cross = [n[1] * m[2] - n[2] * m[1], n[2] * m[0] - n[0] * m[2], n[0] * m[1] - n[1] * m[0]]
  const handed = cross[0] * pos[0] + cross[1] * pos[1] + cross[2] * pos[2] > 0
  return handed ? others : [others[1], others[0]]
}
