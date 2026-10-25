import type { Facelets } from '../cube'
import { CROSS_HOMES, FACE_MOVES, buildMoveTables, crossLocations, type SearchMove } from './cubie'
import { buildCrossTable, crossIndex } from './pruning'

let tables: ReturnType<typeof buildMoveTables> | undefined
let distances: Int8Array | undefined

function crossTables() {
  tables ??= buildMoveTables(FACE_MOVES)
  distances ??= buildCrossTable(tables, FACE_MOVES.length, CROSS_HOMES)
  return { tables, distances }
}

/** Optimal (HTM) cross on D. The table is exact, so following it never backtracks. */
export function solveCross(state: Facelets): SearchMove[] {
  const { tables, distances } = crossTables()
  let edges = crossLocations(state)
  const path: SearchMove[] = []
  let remaining = distances[crossIndex(edges[0], edges[1], edges[2], edges[3])]
  while (remaining > 0) {
    for (let m = 0; m < FACE_MOVES.length; m++) {
      const next = edges.map((e) => tables.edge[m * 24 + e])
      if (distances[crossIndex(next[0], next[1], next[2], next[3])] === remaining - 1) {
        path.push(FACE_MOVES[m])
        edges = next
        remaining--
        break
      }
    }
  }
  return path
}

/** Exact optimal cross length for tests. */
export function crossDistance(state: Facelets): number {
  const { distances } = crossTables()
  const e = crossLocations(state)
  return distances[crossIndex(e[0], e[1], e[2], e[3])]
}
