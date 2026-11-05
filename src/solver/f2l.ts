import { AUF, findCase, recognizeF2L } from '../algorithms'
import { applyAlg, applyMove, isCrossSolved, isSlotSolved, parseAlg, simplify, type Facelets, type Move } from '../cube'
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

// --- Pair choice ------------------------------------------------------------------

export interface PairOption {
  slot: SlotName
  /** Quarter `y` turns needed to bring the slot to FR. */
  rotation: number
  moves: number
  /** Library case when the pair sits in a standard position, else `null`. */
  caseId: string | null
}

export interface PairSolution {
  /** Slot as seen in the orientation right after the cross (green in front). */
  slot: SlotName
  /** Quarter `y` turns applied before solving the pair. */
  rotation: number
  /** State with the pair rotated to FR, before `moves`. */
  before: Facelets
  moves: SearchMove[]
  /** Library case used, `null` for a free pair or one solved by search. */
  caseId: string | null
  /** Every pair still open at this point, the chosen one included. */
  options: PairOption[]
}

export interface F2LSolution {
  pairs: PairSolution[]
}

/** A slot emptied of a stuck piece before the pair it frees. */
export interface Extraction {
  /** Slot as seen in the orientation right after the cross. */
  slot: SlotName
  /** Quarter `y` turns bringing that slot to FR. */
  rotation: number
  moves: SearchMove[]
}

export interface PairSolution {
  /** Slot as seen in the orientation right after the cross (green in front). */
  slot: SlotName
  /** Taken first when no pair was in a standard position. */
  extraction?: Extraction
  /** Quarter `y` turns applied before solving the pair (after the extraction, if any). */
  rotation: number
  /** State with the pair rotated to FR, before `moves`. */
  before: Facelets
  moves: SearchMove[]
  /** Library case used, `null` for a free pair or one solved by search. */
  caseId: string | null
  /** Every pair still open at this point, the chosen one included. */
  options: PairOption[]
}

export interface F2LSolution {
  pairs: PairSolution[]
}

/** Extra moves a rotation is worth: the pair nearest the front wins a near tie, and `y2` costs most. */
export const ROTATION_COST = [0, 2, 3, 2]
const FACE_LETTERS = 'URFDLB'
/** Basic inserts that lift whatever sits in the FR slot to the U layer. */
const EXTRACTIONS = ["R U R'", "R U' R'", "R U2 R'", "F' U' F", "F' U F", "F' U2 F"]

const toSearchMoves = (moves: readonly Move[]): SearchMove[] =>
  moves.map(({ family, amount }) => ({ family, amount, face: FACE_LETTERS.indexOf(family) }))

const applySearchMoves = (state: Facelets, moves: readonly SearchMove[]) =>
  applyAlg(state, moves.map(({ family, amount }) => ({ family, amount })))

const keeps = (state: Facelets, solved: readonly SlotName[]) =>
  isCrossSolved(state) && solved.every((slot) => isSlotSolved(state, slot))

/** The library alg (with the AUF it needs) for the FR pair, if it keeps the cross and `solved` slots. */
function libraryPair(before: Facelets, solved: readonly SlotName[]): { caseId: string; moves: SearchMove[] } | null {
  const caseId = recognizeF2L(before)
  const algCase = caseId ? findCase(caseId) : undefined
  if (!caseId || !algCase) return null
  for (const auf of AUF) {
    const moves = simplify(`${auf} ${algCase.alg}`)
    const after = applyAlg(before, moves)
    if (isSlotSolved(after, 'FR') && keeps(after, solved)) return { caseId, moves: toSearchMoves(moves) }
  }
  return null
}

const score = (o: { rotation: number; moves: readonly SearchMove[] }) => o.moves.length + ROTATION_COST[o.rotation]

interface Candidate {
  slot: number
  rotation: number
  before: Facelets
  /** Solved slots by position once rotated. */
  solved: SlotName[]
  caseId: string | null
  moves: SearchMove[] | null
}

// Slot identity = its index in SLOT_NAMES right after the cross. After `r`
// y turns, slot k sits at position (k + r) mod 4; FR is position 0.
const rotationTo = (slot: number, r: number) => (8 - slot - r) % 4
const solvedPositions = (done: readonly number[], r: number) => done.map((id) => SLOT_NAMES[(id + r) % 4])

function candidates(state: Facelets, r: number, done: readonly number[]): Candidate[] {
  return [0, 1, 2, 3]
    .filter((slot) => !done.includes(slot))
    .map((slot) => {
      const rotation = rotationTo(slot, r)
      const before = rotation === 0 ? state : applyMove(state, 'y', rotation)
      const solved = solvedPositions(done, r + rotation)
      const library = libraryPair(before, solved)
      return { slot, rotation, before, solved, caseId: library?.caseId ?? null, moves: library?.moves ?? null }
    })
}

const easiest = (list: readonly Candidate[]) =>
  list
    .flatMap((c) => (c.moves ? [{ ...c, moves: c.moves }] : []))
    .sort((a, b) => score(a) - score(b))[0]

/**
 * Solves the pairs the way a learner would: a pair already in place is free; otherwise take
 * the easiest pair in a standard position (fewest moves of its library alg, counting the
 * rotation to reach it). When none is standard, a basic insert lifts a stuck piece out of
 * a slot first; only if that frees nothing does the shortest search solve a pair.
 */
export function solveF2L(afterCross: Facelets): F2LSolution {
  let state = afterCross
  let r = 0
  const done: number[] = []
  const pairs: PairSolution[] = []

  while (done.length < 4) {
    const free = [0, 1, 2, 3].find((slot) => !done.includes(slot) && isSlotSolved(state, SLOT_NAMES[(slot + r) % 4]))
    if (free !== undefined) {
      pairs.push({ slot: SLOT_NAMES[free], rotation: 0, before: state, moves: [], caseId: null, options: [] })
      done.push(free)
      continue
    }

    let open = candidates(state, r, done)
    let chosen = easiest(open)
    let extraction: Extraction | undefined
    if (!chosen) {
      let extracted = state
      let bestCost = Infinity
      for (const c of open) {
        for (const alg of EXTRACTIONS) {
          const moves = toSearchMoves(parseAlg(alg))
          const after = applySearchMoves(c.before, moves)
          if (!keeps(after, c.solved)) continue
          const r2 = (r + c.rotation) % 4
          const next = candidates(after, r2, done)
          const pick = easiest(next)
          const cost = pick ? ROTATION_COST[c.rotation] + moves.length + score(pick) : Infinity
          if (cost < bestCost) {
            bestCost = cost
            extraction = { slot: SLOT_NAMES[c.slot], rotation: c.rotation, moves }
            chosen = pick
            open = next
            extracted = after
          }
        }
      }
      if (extraction) {
        state = extracted
        r = (r + extraction.rotation) % 4
      }
    }

    const searched = new Map<number, SearchMove[]>()
    if (!chosen) {
      for (const c of open) {
        const moves = searchPair(c.before, c.solved, MAX_PAIR_DEPTH)
        if (moves) searched.set(c.slot, moves)
      }
      chosen = open
        .flatMap((c) => (searched.has(c.slot) ? [{ ...c, moves: searched.get(c.slot)!, caseId: null }] : []))
        .sort((a, b) => score(a) - score(b))[0]
      if (!chosen) throw new Error('Không tìm được lời giải F2L')
    }

    const options: PairOption[] = open.map((c) => ({
      slot: SLOT_NAMES[c.slot],
      rotation: c.rotation,
      moves: (c.moves ?? searched.get(c.slot) ?? []).length,
      caseId: c.caseId,
    }))
    pairs.push({
      slot: SLOT_NAMES[chosen.slot],
      ...(extraction ? { extraction } : {}),
      rotation: chosen.rotation,
      before: chosen.before,
      moves: chosen.moves,
      caseId: chosen.caseId,
      options,
    })
    state = applySearchMoves(chosen.before, chosen.moves)
    r = (r + chosen.rotation) % 4
    done.push(chosen.slot)
  }
  return { pairs }
}
