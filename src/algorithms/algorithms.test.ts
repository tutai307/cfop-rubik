import { describe, expect, it } from 'vitest'
import {
  SLOTS,
  STICKERS,
  applyAlg,
  applyMove,
  centerOf,
  isCrossSolved,
  isF2LSolved,
  isSlotSolved,
  isSolved,
  isTopOriented,
  moveDestinations,
  parseAlg,
  rotate,
  stateOf,
  stickerIndex,
  stickersAt,
  type Facelets,
  type Vec3,
} from '../cube'
import {
  CROSS_SITUATIONS,
  F2L,
  OLL,
  OLL2,
  PLL,
  PLL2,
  SOLVING_ORIENTATION,
  caseState,
  f2lKey,
  findCase,
  ollKey,
  pllKey,
  recognizeF2L,
  recognizeOll,
  recognizePll,
  type AlgCase,
} from '.'

const SOLVED = stateOf(SOLVING_ORIENTATION)
const U_COLOR = SOLVED[centerOf(0)]
const allAlgs = (c: AlgCase) => [c.alg, ...(c.alternatives ?? [])]
const withAuf = (state: Facelets, goal: (s: Facelets) => boolean) =>
  [0, 1, 2, 3].some((t) => goal(applyMove(state, 'U', t)))

const U_LAYER = STICKERS.flatMap((s, i) => (s.pos[1] === 1 ? [i] : []))
const isHome = (state: Facelets, i: number) => state[i] === state[centerOf(Math.floor(i / 9))]
const U_EDGE_STICKERS = [1, 3, 5, 7]
const U_CORNER_POSITIONS: Vec3[] = [[1, 1, 1], [1, 1, -1], [-1, 1, -1], [-1, 1, 1]]
const U_EDGE_POSITIONS: Vec3[] = [[0, 1, 1], [1, 1, 0], [0, 1, -1], [-1, 1, 0]]
const edgesOriented = (s: Facelets) => U_EDGE_STICKERS.every((i) => s[i] === s[centerOf(0)])
const cornersPermuted = (s: Facelets) =>
  withAuf(s, (t) => U_CORNER_POSITIONS.flatMap(stickersAt).every((i) => isHome(t, i)))

function expectDistinct(keys: string[], ids: string[]) {
  const seen = new Map<string, string>()
  keys.forEach((key, i) => {
    expect(seen.get(key), `${ids[i]} trùng ca với ${seen.get(key)}`).toBeUndefined()
    seen.set(key, ids[i])
  })
}

function expectCoverage(caseKeys: string[], allKeys: Set<string>, solvedKey: string) {
  const missing = [...allKeys].filter((k) => k !== solvedKey && !caseKeys.includes(k))
  expect(missing, 'trạng thái chưa có ca').toEqual([])
  expect(caseKeys.filter((k) => !allKeys.has(k)), 'ca không hợp lệ').toEqual([])
}

describe('dữ liệu', () => {
  it('có đủ số ca và id duy nhất', () => {
    expect([F2L.length, OLL.length, PLL.length, OLL2.length, PLL2.length]).toEqual([41, 57, 21, 10, 6])
    for (const c of [...F2L, ...OLL, ...PLL, ...OLL2, ...PLL2]) expect(findCase(c.id)).toBe(c)
  })

  it.each([...F2L, ...OLL, ...PLL, ...OLL2, ...PLL2].map((c) => [c.id, c] as const))(
    '%s parse được và không để lại xoay khối',
    (_, c) => {
      for (const alg of allAlgs(c)) {
        const state = stateOf(alg)
        for (let face = 0; face < 6; face++) expect(state[centerOf(face)]).toBe(face)
      }
    },
  )

  it('minh hoạ ở hướng giải: vàng trên, trắng đáy', () => {
    const s = caseState(OLL[26])
    expect(s[centerOf(0)]).toBe(3)
    expect(s[centerOf(3)]).toBe(0)
  })
})

describe('F2L', () => {
  it.each(F2L.map((c) => [c.id, c] as const))('%s giải khe FR, giữ cross và 3 khe còn lại', (_, c) => {
    const setup = caseState(c)
    expect(isCrossSolved(setup)).toBe(true)
    expect(isSlotSolved(setup, 'FR')).toBe(false)
    for (const slot of SLOTS.slice(1)) expect(isSlotSolved(setup, slot)).toBe(true)
    for (const alg of allAlgs(c)) expect(isF2LSolved(applyAlg(setup, alg)), alg).toBe(true)
  })

  it('41 ca phân biệt và phủ mọi vị trí của cặp', () => {
    const keys = F2L.map((c) => f2lKey(caseState(c)).key)
    expectDistinct(keys, F2L.map((c) => c.id))
    const cornerSpots = [...U_CORNER_POSITIONS, [1, -1, 1] as Vec3].flatMap(stickersAt)
    const edgeSpots = [...U_EDGE_POSITIONS, [1, 0, 1] as Vec3].flatMap(stickersAt)
    const uDest = [0, 1, 2, 3].map((t) => (t === 0 ? null : moveDestinations('U', t as 1 | 2 | 3)))
    const all = new Set<string>()
    for (const c of cornerSpots) {
      for (const e of edgeSpots) {
        const variants = uDest.map((d) => (d ? `${d[c]},${d[e]}` : `${c},${e}`))
        all.add(variants.reduce((a, b) => (b < a ? b : a)))
      }
    }
    expect(all.size).toBe(42)
    expectCoverage(keys, all, f2lKey(SOLVED).key)
  })

  it('nhận diện lại đúng ca', () => {
    for (const c of F2L) expect(recognizeF2L(applyMove(caseState(c), 'U', 1))).toBe(c.id)
  })
})

// Last-layer states built directly from piece twists / permutations.

function cornerStickerCycle(pos: Vec3): number[] {
  const stickers = stickersAt(pos)
  const up = stickers.find((i) => STICKERS[i].normal[1] === 1)!
  const others = stickers.filter((i) => i !== up)
  const [a, b] = [STICKERS[up].normal, STICKERS[others[0]].normal]
  const cross: Vec3 = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  // Same handedness for every corner; the sum-of-twists rule holds in either direction.
  const handed = cross[0] * pos[0] + cross[1] * pos[1] + cross[2] * pos[2] > 0
  return handed ? [up, others[0], others[1]] : [up, others[1], others[0]]
}

function orientationStates(): Facelets[] {
  const states: Facelets[] = []
  for (let twists = 0; twists < 27; twists++) {
    const t = [twists % 3, Math.floor(twists / 3) % 3, Math.floor(twists / 9) % 3]
    t.push((6 - t[0] - t[1] - t[2]) % 3)
    for (let flips = 0; flips < 8; flips++) {
      const f = [flips & 1, (flips >> 1) & 1, (flips >> 2) & 1]
      f.push((f[0] + f[1] + f[2]) % 2)
      const s = SOLVED.slice()
      for (const i of U_LAYER) if (i !== centerOf(0)) s[i] = 9
      U_CORNER_POSITIONS.forEach((p, k) => (s[cornerStickerCycle(p)[t[k]]] = U_COLOR))
      U_EDGE_POSITIONS.forEach((p, k) => {
        const [up, side] = [...stickersAt(p)].sort((a) => (STICKERS[a].normal[1] === 1 ? -1 : 1))
        s[f[k] ? side : up] = U_COLOR
      })
      states.push(s)
    }
  }
  return states
}

function permutations(n: number): number[][] {
  if (n === 1) return [[0]]
  return permutations(n - 1).flatMap((p) => Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]))
}

const parity = (p: number[]) => {
  let swaps = 0
  for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) if (p[i] > p[j]) swaps++
  return swaps % 2
}

/** Places piece `perm[i]` (by U-layer cycle index) at position `i`, keeping U stickers up. */
function placePieces(state: Facelets, cycle: Vec3[], perm: number[]): void {
  const source = state.slice()
  perm.forEach((piece, target) => {
    for (const i of stickersAt(cycle[piece])) {
      let { pos, normal } = STICKERS[i]
      for (let k = 0; k < (target - piece + 4) % 4; k++) {
        pos = rotate(pos, 1, -1)
        normal = rotate(normal, 1, -1)
      }
      state[stickerIndex(pos, normal)] = source[i]
    }
  })
}

// Clockwise (seen from above) cycles so that rotating one step maps index k to k + 1.
const CORNER_CYCLE: Vec3[] = [[1, 1, 1]]
const EDGE_CYCLE: Vec3[] = [[0, 1, 1]]
for (let k = 1; k < 4; k++) {
  CORNER_CYCLE.push(rotate(CORNER_CYCLE[k - 1], 1, -1))
  EDGE_CYCLE.push(rotate(EDGE_CYCLE[k - 1], 1, -1))
}

function permutationStates(): Facelets[] {
  const states: Facelets[] = []
  const perms = permutations(4)
  for (const cp of perms) {
    for (const ep of perms) {
      if (parity(cp) !== parity(ep)) continue
      const s = SOLVED.slice()
      placePieces(s, CORNER_CYCLE, cp)
      placePieces(s, EDGE_CYCLE, ep)
      states.push(s)
    }
  }
  return states
}

describe('OLL', () => {
  it.each(OLL.map((c) => [c.id, c] as const))('%s định hướng tầng cuối, giữ F2L', (_, c) => {
    const setup = caseState(c)
    expect(isF2LSolved(setup)).toBe(true)
    expect(isTopOriented(setup)).toBe(false)
    for (const alg of allAlgs(c)) {
      const after = applyAlg(setup, alg)
      expect(isF2LSolved(after) && isTopOriented(after), alg).toBe(true)
    }
  })

  it('57 ca phân biệt và phủ mọi trạng thái định hướng', () => {
    const keys = OLL.map((c) => ollKey(caseState(c)))
    expectDistinct(keys, OLL.map((c) => c.id))
    const all = new Set(orientationStates().map(ollKey))
    expect(all.size).toBe(58)
    expectCoverage(keys, all, ollKey(SOLVED))
  })

  it('nhận diện mọi trạng thái định hướng hợp lệ', () => {
    for (const s of orientationStates()) {
      const match = recognizeOll(s)
      if (!match) {
        expect(isTopOriented(s)).toBe(true)
        continue
      }
      expect(isTopOriented(applyAlg(s, `${match.preAuf} ${match.alg}`))).toBe(true)
    }
  })
})

describe('PLL', () => {
  it.each(PLL.map((c) => [c.id, c] as const))('%s giải khối (kèm AUF)', (_, c) => {
    const setup = caseState(c)
    expect(isF2LSolved(setup) && isTopOriented(setup)).toBe(true)
    for (const alg of allAlgs(c)) expect(withAuf(applyAlg(setup, alg), isSolved), alg).toBe(true)
  })

  it('21 ca phân biệt và phủ mọi hoán vị', () => {
    const keys = PLL.map((c) => pllKey(caseState(c)))
    expectDistinct(keys, PLL.map((c) => c.id))
    const states = permutationStates()
    expect(states.length).toBe(288)
    const all = new Set(states.map(pllKey))
    expect(all.size).toBe(22)
    expectCoverage(keys, all, pllKey(SOLVED))
  })

  it('nhận diện mọi hoán vị hợp lệ', () => {
    for (const s of permutationStates()) {
      const match = recognizePll(s)
      const alg = match ? `${match.preAuf} ${match.alg} ${match.postAuf}` : ''
      expect(isSolved(applyAlg(s, alg))).toBe(true)
    }
  })
})

describe('2-look', () => {
  const edgeCases = OLL2.filter((c) => c.group.startsWith('Bước 1'))
  const cornerCases = OLL2.filter((c) => c.group.startsWith('Bước 2'))
  const pllCorner = PLL2.filter((c) => c.group.startsWith('Bước 1'))
  const pllEdge = PLL2.filter((c) => c.group.startsWith('Bước 2'))

  it('chia đúng số ca mỗi bước', () => {
    expect([edgeCases.length, cornerCases.length, pllCorner.length, pllEdge.length]).toEqual([3, 7, 2, 4])
  })

  it.each(edgeCases.map((c) => [c.id, c] as const))('%s tạo chữ thập vàng', (_, c) => {
    const setup = caseState(c)
    expect(isF2LSolved(setup) && !edgesOriented(setup)).toBe(true)
    expect(edgesOriented(applyAlg(setup, c.alg))).toBe(true)
  })

  it.each(cornerCases.map((c) => [c.id, c] as const))('%s định hướng góc khi đã có chữ thập', (_, c) => {
    const setup = caseState(c)
    expect(isF2LSolved(setup) && edgesOriented(setup) && !isTopOriented(setup)).toBe(true)
    expect(isTopOriented(applyAlg(setup, c.alg))).toBe(true)
  })

  it.each(pllCorner.map((c) => [c.id, c] as const))('%s hoán vị góc', (_, c) => {
    const setup = caseState(c)
    expect(isTopOriented(setup) && !cornersPermuted(setup)).toBe(true)
    expect(cornersPermuted(applyAlg(setup, c.alg))).toBe(true)
  })

  it.each(pllEdge.map((c) => [c.id, c] as const))('%s hoán vị cạnh khi góc đã đúng', (_, c) => {
    const setup = caseState(c)
    expect(cornersPermuted(setup)).toBe(true)
    expect(withAuf(applyAlg(setup, c.alg), isSolved)).toBe(true)
  })

  it('các ca mỗi bước phân biệt', () => {
    expectDistinct(edgeCases.map((c) => ollKey(caseState(c))), edgeCases.map((c) => c.id))
    expectDistinct(cornerCases.map((c) => ollKey(caseState(c))), cornerCases.map((c) => c.id))
    expectDistinct(pllCorner.map((c) => pllKey(caseState(c))), pllCorner.map((c) => c.id))
    expectDistinct(pllEdge.map((c) => pllKey(caseState(c))), pllEdge.map((c) => c.id))
  })
})

describe('hướng dẫn Cross', () => {
  it.each(CROSS_SITUATIONS.map((s) => [s.title, s] as const))('%s', (_, situation) => {
    const setup = applyAlg(SOLVED, situation.setup)
    expect(isCrossSolved(setup)).toBe(false)
    expect(isCrossSolved(applyAlg(setup, parseAlg(situation.alg)))).toBe(true)
  })
})
