// Facelet model: 54 stickers, faces in Kociemba order U R F D L B, each face
// indexed 0..8 row by row as seen in the standard unfolded net.
// A sticker's value is its color; color n is the color of face n in the WCA
// scramble orientation (white top, green front).

export type Facelets = Uint8Array

export const FACES = ['U', 'R', 'F', 'D', 'L', 'B'] as const
export type Face = (typeof FACES)[number]

export const Color = {
  White: 0,
  Red: 1,
  Green: 2,
  Yellow: 3,
  Orange: 4,
  Blue: 5,
} as const

export type Vec3 = readonly [number, number, number]

export interface Sticker {
  /** Cubie position, each axis in -1..1 (x right, y up, z front). */
  pos: Vec3
  /** Outward normal of the sticker. */
  normal: Vec3
}

function stickerOf(face: number, row: number, col: number): Sticker {
  const a = col - 1
  const b = 1 - row
  switch (face) {
    case 0: return { pos: [a, 1, row - 1], normal: [0, 1, 0] } // U: back row on top
    case 1: return { pos: [1, b, -a], normal: [1, 0, 0] } // R: front column on the left
    case 2: return { pos: [a, b, 1], normal: [0, 0, 1] } // F
    case 3: return { pos: [a, -1, 1 - row], normal: [0, -1, 0] } // D: front row on top
    case 4: return { pos: [-1, b, a], normal: [-1, 0, 0] } // L: back column on the left
    default: return { pos: [-a, b, -1], normal: [0, 0, -1] } // B: right column on the left
  }
}

export const STICKERS: readonly Sticker[] = Array.from({ length: 54 }, (_, i) =>
  stickerOf(Math.floor(i / 9), Math.floor((i % 9) / 3), i % 3),
)

const stickerKey = (pos: Vec3, normal: Vec3) => `${pos.join(',')}|${normal.join(',')}`
const STICKER_INDEX = new Map(STICKERS.map((s, i) => [stickerKey(s.pos, s.normal), i]))

export function stickerIndex(pos: Vec3, normal: Vec3): number {
  const index = STICKER_INDEX.get(stickerKey(pos, normal))
  if (index === undefined) throw new Error(`Không có sticker tại ${stickerKey(pos, normal)}`)
  return index
}

/** Indices of every sticker on the cubie at `pos`. */
export function stickersAt(pos: Vec3): number[] {
  const result: number[] = []
  STICKERS.forEach((s, i) => {
    if (s.pos[0] === pos[0] && s.pos[1] === pos[1] && s.pos[2] === pos[2]) result.push(i)
  })
  return result
}

export const faceOf = (index: number) => Math.floor(index / 9)
export const centerOf = (face: number) => face * 9 + 4

export function solvedFacelets(): Facelets {
  return Uint8Array.from({ length: 54 }, (_, i) => faceOf(i))
}

export function faceletsEqual(a: Facelets, b: Facelets): boolean {
  for (let i = 0; i < 54; i++) if (a[i] !== b[i]) return false
  return true
}
