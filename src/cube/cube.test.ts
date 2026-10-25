import { cube3x3x3 } from 'cubing/puzzles'
import type { KPattern } from 'cubing/kpuzzle'
import { describe, expect, it } from 'vitest'
import {
  MOVE_FAMILIES,
  NotationError,
  countMoves,
  faceletsEqual,
  formatAlg,
  invert,
  isCrossSolved,
  isF2LSolved,
  isSlotSolved,
  isSolved,
  isTopOriented,
  parseAlg,
  simplify,
  solvedFacelets,
  stateOf,
  stickerIndex,
  type Facelets,
  type Move,
  type Vec3,
} from '.'

const sameState = (a: string, b: string) => faceletsEqual(stateOf(a), stateOf(b))
// Exact identity, unlike isSolved which also accepts whole-cube rotations.
const isIdentity = (alg: string | Move[]) => faceletsEqual(stateOf(alg), solvedFacelets())

describe('moves', () => {
  it('returns to solved after the order of each move', () => {
    for (const family of MOVE_FAMILIES) {
      expect(isIdentity(`${family} ${family} ${family} ${family}`)).toBe(true)
      expect(isIdentity(family)).toBe(false)
      expect(isSolved(stateOf(family))).toBe(family === 'x' || family === 'y' || family === 'z')
    }
    expect(isIdentity("(R U R' U')6")).toBe(true)
    expect(isIdentity("(R U R' U')5")).toBe(false)
  })

  it('undoes any alg with its inverse', () => {
    const alg = "R U2 r' D M2 x F' S E' y2 b l' z' d u2 B L'"
    expect(isIdentity([...parseAlg(alg), ...invert(alg)])).toBe(true)
  })

  it('composes wide moves and rotations from face and slice turns', () => {
    expect(sameState('x', "R M' L'")).toBe(true)
    expect(sameState('y', "U E' D'")).toBe(true)
    expect(sameState('z', "F S B'")).toBe(true)
    expect(sameState('r', "R M'")).toBe(true)
    expect(sameState('Rw', 'r')).toBe(true)
    expect(sameState('u', "U E'")).toBe(true)
    expect(sameState('f', 'F S')).toBe(true)
  })

  it('moves the F face onto U with R', () => {
    const state = stateOf('R')
    // Right column of U now holds green (front) stickers.
    for (const i of [2, 5, 8]) expect(state[i]).toBe(2)
  })
})

describe('notation', () => {
  it('parses and formats amounts, primes and groups', () => {
    expect(formatAlg(parseAlg("R U2 R' Rw2' (U R)2 F3"))).toBe("R U2 R' r2 U R U R F'")
    expect(parseAlg('R4 U0')).toEqual([])
    expect(formatAlg(parseAlg("(R U2 F)' R′"))).toBe("F' U2 R' R'")
    expect(formatAlg(parseAlg("((R U)2 F')2"))).toBe("R U R U F' R U R U F'")
  })

  it('reports the position of invalid tokens', () => {
    expect(() => parseAlg('R U Q')).toThrow(NotationError)
    try {
      parseAlg('R U Q')
    } catch (error) {
      expect((error as NotationError).position).toBe(4)
    }
    expect(() => parseAlg('(R U')).toThrow(/Thiếu/)
    expect(() => parseAlg('R)')).toThrow(/Thừa/)
    expect(() => parseAlg('(R)100')).toThrow(/lặp/)
    expect(() => parseAlg('Mw')).toThrow(NotationError)
  })

  it('simplifies adjacent moves of the same family', () => {
    expect(formatAlg(simplify("R R U U' U2 F F' R'"))).toBe("R2 U2 R'")
    expect(formatAlg(simplify("R U U' R'"))).toBe('')
  })

  it('counts moves in HTM', () => {
    expect(countMoves("R U R' U'")).toBe(4)
    expect(countMoves('x y2 R2 M')).toBe(3)
  })
})

describe('checks', () => {
  it('recognises stage goals', () => {
    expect(isF2LSolved(stateOf("R U R' U'"))).toBe(false)
    expect(isCrossSolved(stateOf("R U R' U'"))).toBe(true)
    expect(isSlotSolved(stateOf("R U R' U'"), 'FL')).toBe(true)
    expect(isSlotSolved(stateOf("R U R' U'"), 'FR')).toBe(false)
    // Sune keeps F2L and is a last layer orientation case.
    const sune = stateOf("R U R' U R U2 R'")
    expect(isF2LSolved(sune)).toBe(true)
    expect(isTopOriented(sune)).toBe(false)
    expect(isTopOriented(stateOf("R U R' U' R' F R2 U' R' U' R U R' F'"))).toBe(true)
  })

  it('compares with centers so rotations keep a solved cube solved', () => {
    expect(isF2LSolved(stateOf('z2 y'))).toBe(true)
    expect(isCrossSolved(stateOf("z2 R U R'"))).toBe(true)
    expect(isCrossSolved(stateOf('z2 R'))).toBe(false)
  })
})

// --- Cross-check against cubing.js -------------------------------------------

const FACE_NORMALS: Record<string, Vec3> = {
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
}
const FACE_COLOR: Record<string, number> = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 }
const ORBIT_SLOTS: Record<string, string[]> = {
  EDGES: ['UF', 'UR', 'UB', 'UL', 'DF', 'DR', 'DB', 'DL', 'FR', 'FL', 'BR', 'BL'],
  CORNERS: ['UFR', 'URB', 'UBL', 'ULF', 'DRF', 'DFL', 'DLB', 'DBR'],
  CENTERS: ['U', 'L', 'F', 'R', 'B', 'D'],
}

function cubiePosition(name: string): Vec3 {
  const sum = [0, 0, 0]
  for (const letter of name) FACE_NORMALS[letter].forEach((v, axis) => (sum[axis] += v))
  return sum as unknown as Vec3
}

function patternToFacelets(pattern: KPattern): Facelets {
  const state = new Uint8Array(54)
  for (const [orbit, slots] of Object.entries(ORBIT_SLOTS)) {
    const { pieces, orientation } = pattern.patternData[orbit]
    slots.forEach((slot, position) => {
      const piece = slots[pieces[position]]
      const twist = orbit === 'CENTERS' ? 0 : orientation[position]
      for (let k = 0; k < slot.length; k++) {
        const sticker = stickerIndex(cubiePosition(slot), FACE_NORMALS[slot[k]])
        state[sticker] = FACE_COLOR[piece[(k + twist) % slot.length]]
      }
    })
  }
  return state
}

function randomAlg(seed: number, length: number): string {
  let s = seed
  // 32-bit LCG; the high bits are the well-mixed ones.
  const next = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) >>> 16
  return Array.from({ length }, () => {
    const family = MOVE_FAMILIES[next() % MOVE_FAMILIES.length]
    return family + ['', '2', "'"][next() % 3]
  }).join(' ')
}

describe('agreement with cubing/kpuzzle', async () => {
  const kpuzzle = await cube3x3x3.kpuzzle()

  it('maps the solved pattern to the solved cube', () => {
    expect(faceletsEqual(patternToFacelets(kpuzzle.defaultPattern()), solvedFacelets())).toBe(true)
  })

  it.each(MOVE_FAMILIES)('agrees on single move %s', (family) => {
    const expected = patternToFacelets(kpuzzle.defaultPattern().applyAlg(family))
    expect(Array.from(stateOf(family))).toEqual(Array.from(expected))
  })

  it.each(Array.from({ length: 20 }, (_, i) => randomAlg(i + 1, 30)))('agrees on %s', (alg) => {
    const expected = patternToFacelets(kpuzzle.defaultPattern().applyAlg(alg))
    expect(Array.from(stateOf(alg))).toEqual(Array.from(expected))
  })
})
