import { applyAlg, applyMove, isSlotSolved, type Facelets } from '../cube'
import {
  CROSS_HOMES,
  F2L_MOVES,
  SLOT_HOMES,
  SLOT_NAMES,
  buildMoveTables,
  crossLocations,
  slotLocations,
  type MoveTables,
  type SearchMove,
  type SlotName,
} from './cubie'
import { buildCrossTable, buildPairTable, crossIndex } from './pruning'

const MAX_PAIR_DEPTH = 14

interface F2LTables {
  moves: MoveTables
  cross: Int8Array
  /** Pair tables indexed like SLOT_NAMES. */
  pairs: Int8Array[]
}

let cached: F2LTables | undefined

function f2lTables(): F2LTables {
  if (!cached) {
    const moves = buildMoveTables(F2L_MOVES)
    cached = {
      moves,
      cross: buildCrossTable(moves, F2L_MOVES.length, CROSS_HOMES),
      pairs: SLOT_NAMES.map((slot) => buildPairTable(moves, F2L_MOVES.length, SLOT_HOMES[slot])),
    }
  }
  return cached
}

/**
 * IDA* for the FR pair while keeping the cross and the `solved` slots.
 * Every table is an exact distance for a subset of pieces under the same
 * move group, so the max is admissible and the result is optimal in <U R F L>.
 */
function searchPair(state: Facelets, solved: readonly SlotName[], maxDepth: number): SearchMove[] | null {
  const { moves: tables, cross, pairs } = f2lTables()
  const target = slotLocations(state, 'FR')
  const others = solved.map((slot) => ({ table: pairs[SLOT_NAMES.indexOf(slot)], ...slotLocations(state, slot) }))
  // Edge layout: 4 cross edges, target edge, solved edges; corners: target, solved.
  const edgeCount = 5 + others.length
  const cornerCount = 1 + others.length
  const edges = new Int8Array((maxDepth + 1) * edgeCount)
  const corners = new Int8Array((maxDepth + 1) * cornerCount)
  crossLocations(state).forEach((e, i) => (edges[i] = e))
  edges[4] = target.edge
  corners[0] = target.corner
  others.forEach((o, i) => {
    edges[5 + i] = o.edge
    corners[1 + i] = o.corner
  })
  const frTable = pairs[0]
  const otherTables = others.map((o) => o.table)

  const heuristic = (e: number, c: number) => {
    let h = cross[crossIndex(edges[e], edges[e + 1], edges[e + 2], edges[e + 3])]
    const pair = frTable[corners[c] * 24 + edges[e + 4]]
    if (pair > h) h = pair
    for (let k = 0; k < otherTables.length; k++) {
      const d = otherTables[k][corners[c + 1 + k] * 24 + edges[e + 5 + k]]
      if (d > h) h = d
    }
    return h
  }

  const path: number[] = []
  const moveCount = F2L_MOVES.length
  const edgeTable = tables.edge
  const cornerTable = tables.corner

  const dfs = (depth: number, bound: number, lastFace: number): boolean => {
    const e = depth * edgeCount
    const c = depth * cornerCount
    const h = heuristic(e, c)
    if (h === 0) return true
    if (depth + h > bound) return false
    const ne = e + edgeCount
    const nc = c + cornerCount
    for (let m = 0; m < moveCount; m++) {
      const face = F2L_MOVES[m].face
      // Same face twice, or opposite faces in the non-canonical order, is redundant.
      if (face === lastFace || ((face + 3) % 6 === lastFace && face < lastFace)) continue
      const base = m * 24
      for (let i = 0; i < edgeCount; i++) edges[ne + i] = edgeTable[base + edges[e + i]]
      for (let i = 0; i < cornerCount; i++) corners[nc + i] = cornerTable[base + corners[c + i]]
      path.push(m)
      if (dfs(depth + 1, bound, face)) return true
      path.pop()
    }
    return false
  }

  for (let bound = heuristic(0, 0); bound <= maxDepth; bound++) {
    if (dfs(0, bound, -1)) return path.map((m) => F2L_MOVES[m])
  }
  return null
}

// --- Pair order -------------------------------------------------------------------

export interface PairSolution {
  /** Slot as seen in the orientation right after the cross (green in front). */
  slot: SlotName
  /** Quarter `y` turns applied before solving the pair. */
  rotation: number
  /** State with the pair rotated to FR, before `moves`. */
  before: Facelets
  moves: SearchMove[]
}

export interface F2LSolution {
  pairs: PairSolution[]
  approximate: boolean
}

const length = (pairs: readonly PairSolution[]) => pairs.reduce((sum, p) => sum + p.moves.length, 0)

function rotate(state: Facelets, turns: number): Facelets {
  return turns === 0 ? state : applyMove(state, 'y', turns)
}

const applySearchMoves = (state: Facelets, moves: readonly SearchMove[]) =>
  applyAlg(state, moves.map(({ family, amount }) => ({ family, amount })))

/**
 * Solves the four pairs, trying every order (greedy first, then a depth-first
 * search over orders that prunes when it cannot beat the best total).
 * After `deadline` the best solution found so far is returned as approximate.
 */
export function solveF2L(afterCross: Facelets, deadline: number, now: () => number = () => performance.now()): F2LSolution {
  // Slot identity = its index in SLOT_NAMES right after the cross. After `r`
  // y turns, slot k sits at position (k + r) mod 4; FR is position 0.
  const step = (state: Facelets, r: number, slot: number, solvedIds: readonly number[], maxDepth: number) => {
    if (isSlotSolved(state, SLOT_NAMES[(slot + r) % 4])) {
      // Free pair: no rotation, no moves.
      return { pair: { slot: SLOT_NAMES[slot], rotation: 0, before: state, moves: [] }, state, r }
    }
    const turns = (8 - slot - r) % 4
    const r2 = (r + turns) % 4
    const before = rotate(state, turns)
    const solvedPositions = solvedIds.map((id) => SLOT_NAMES[(id + r2) % 4])
    const moves = searchPair(before, solvedPositions, maxDepth)
    if (!moves) return null
    const pair: PairSolution = { slot: SLOT_NAMES[slot], rotation: turns, before, moves }
    return { pair, state: applySearchMoves(before, moves), r: r2 }
  }

  // Greedy: always take the cheapest next pair.
  let best: PairSolution[] = []
  {
    let state = afterCross
    let r = 0
    const done: number[] = []
    while (done.length < 4) {
      let chosen: ReturnType<typeof step> = null
      let chosenSlot = -1
      for (let slot = 0; slot < 4; slot++) {
        if (done.includes(slot)) continue
        const result = step(state, r, slot, done, MAX_PAIR_DEPTH)
        if (result && (!chosen || result.pair.moves.length < chosen.pair.moves.length)) {
          chosen = result
          chosenSlot = slot
        }
      }
      if (!chosen) throw new Error('Không tìm được lời giải F2L')
      best.push(chosen.pair)
      done.push(chosenSlot)
      state = chosen.state
      r = chosen.r
    }
  }

  let approximate = false
  const current: PairSolution[] = []
  const explore = (state: Facelets, r: number, done: number[], total: number) => {
    if (done.length === 4) {
      if (total < length(best)) best = [...current]
      return
    }
    if (now() > deadline) {
      approximate = true
      return
    }
    for (let slot = 0; slot < 4; slot++) {
      if (done.includes(slot)) continue
      const bound = length(best) - total - 1
      if (bound < 0) return
      const result = step(state, r, slot, done, Math.min(MAX_PAIR_DEPTH, bound))
      if (!result) continue
      current.push(result.pair)
      explore(result.state, result.r, [...done, slot], total + result.pair.moves.length)
      current.pop()
    }
  }
  explore(afterCross, 0, [], 0)
  return { pairs: best, approximate }
}

