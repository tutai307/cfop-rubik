import { describe, expect, it } from 'vitest'
import { applyAlg, faceletsEqual, parseAlg, solvedFacelets, stateOf } from '../cube'
import scrambles from '../solver/fixtures/scrambles-100.json'
import { SETUPS, bufferLetters, hasParity, memoSolves, pairUp, solveOp, stepMoves, traceMemo } from './op'
import { CORNER_STICKER, EDGE_STICKER, LETTERS, letterOf } from './speffz'

describe('Speffz', () => {
  it('gán 24 chữ cho 24 sticker góc và 24 sticker cạnh khác nhau', () => {
    expect(new Set(CORNER_STICKER.values()).size).toBe(24)
    expect(new Set(EDGE_STICKER.values()).size).toBe(24)
  })

  it('khớp các vị trí quen thuộc', () => {
    // U face: A top-left (ULB), C bottom-right (UFR); edges B = UR, D = UL.
    expect(CORNER_STICKER.get('A')).toBe(0)
    expect(CORNER_STICKER.get('C')).toBe(8)
    expect(EDGE_STICKER.get('B')).toBe(5)
    expect(EDGE_STICKER.get('D')).toBe(3)
    // P = R face bottom-left (RDF), U = D face top-left (DFL).
    expect(CORNER_STICKER.get('P')).toBe(9 + 6)
    expect(CORNER_STICKER.get('U')).toBe(27 + 0)
    expect(letterOf(9 + 1)).toEqual({ letter: 'M', kind: 'edge' })
  })
})

describe('setup', () => {
  it('có cho mọi chữ trừ mảnh buffer, chỉ dùng nước được phép', () => {
    expect(bufferLetters('edge').sort()).toEqual(['B', 'M'])
    expect(bufferLetters('corner').sort()).toEqual(['A', 'E', 'R'])
    expect(SETUPS.edge.size).toBe(22)
    expect(SETUPS.corner.size).toBe(21)
    for (const { setup } of SETUPS.edge.values()) expect(setup).toMatch(/^([LDldME]['2]? ?)*$/)
    for (const { setup } of SETUPS.corner.values()) expect(setup).toMatch(/^([RDF]['2]? ?)*$/)
    for (const entry of [...SETUPS.edge.values(), ...SETUPS.corner.values()]) {
      expect(parseAlg(entry.setup).length).toBeLessThanOrEqual(4)
    }
  })
})

describe('Old Pochmann', () => {
  it.each(scrambles)('giải về solved: %s', (scramble) => {
    const state = stateOf(scramble)
    const solution = solveOp(state)
    expect(solution.edges.length % 2).toBe(solution.corners.length % 2)
    expect(solution.parity).toBe(solution.edges.length % 2 === 1)
    const after = applyAlg(state, solution.steps.map(stepMoves).join(' '))
    expect(faceletsEqual(after, solvedFacelets())).toBe(true)
  })

  it('chấm memo bằng mô phỏng: memo đúng qua, memo sai trượt', () => {
    const state = stateOf(scrambles[0])
    for (const kind of ['edge', 'corner'] as const) {
      const memo = traceMemo(state, kind)
      expect(memoSolves(state, kind, memo)).toBe(true)
      expect(memoSolves(state, kind, memo.slice(0, -1))).toBe(false)
      expect(memoSolves(state, kind, [...memo, bufferLetters(kind)[0]])).toBe(false)
    }
  })

  it.each([
    ['superflip', 'U R2 F B R B2 R U2 L B2 R U\' D\' R2 F R\' L B2 U2 F2'],
    ['2 cạnh lật tại chỗ', "M' U M' U M' U M' U M U M U M U M U"],
    ['2 góc xoắn tại chỗ', "R' D' R D R' D' R D U R' D' R D R' D' R D R' D' R D R' D' R D U'"],
    ['buffer cạnh lật tại chỗ', "U M' U M' U M' U M' U M U M U M U M U U'"],
    ['buffer góc xoắn tại chỗ', "U' R' D' R D R' D' R D U R' D' R D R' D' R D R' D' R D R' D' R D U' U"],
  ])('xử lý mảnh lật/xoắn tại chỗ: %s', (_, alg) => {
    const state = stateOf(alg)
    const solution = solveOp(state)
    expect(faceletsEqual(applyAlg(state, solution.steps.map(stepMoves).join(' ')), solvedFacelets())).toBe(true)
  })

  it('chấp nhận memo dùng cycle break khác của app', () => {
    for (const scramble of scrambles.slice(0, 20)) {
      const state = stateOf(scramble)
      for (const kind of ['edge', 'corner'] as const) {
        const last = traceMemo(state, kind, (candidates) => candidates[candidates.length - 1])
        expect(memoSolves(state, kind, last)).toBe(true)
      }
    }
  })

  it('memo rỗng chỉ đúng khi loại mảnh đó đã xong', () => {
    expect(memoSolves(stateOf(scrambles[0]), 'edge', [])).toBe(false)
    expect(memoSolves(solvedFacelets(), 'corner', [])).toBe(true)
  })

  it('nhận biết parity: khớp với bước parity của lời giải, có cả hai loại trong fixture', () => {
    const flags = scrambles.map((s) => {
      const state = stateOf(s)
      expect(hasParity(state)).toBe(solveOp(state).parity)
      return hasParity(state)
    })
    expect(flags).toContain(true)
    expect(flags).toContain(false)
    expect(hasParity(stateOf("R U R' U' R' F R2 U' R' U' R U R' F'"))).toBe(true)
  })

  it('khối đã giải không cần memo', () => {
    expect(solveOp(solvedFacelets()).steps).toEqual([])
  })

  it('ghép cặp chữ để đọc', () => {
    expect(pairUp(['A', 'B', 'C'])).toBe('AB C')
    expect(pairUp([])).toBe('')
    expect([...LETTERS].length).toBe(24)
  })
})
