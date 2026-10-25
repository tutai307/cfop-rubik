import type { MoveTables, SlotHome } from './cubie'

// Exact distance tables built by breadth-first search from the goal.

export const CROSS_STATES = 24 ** 4

export const crossIndex = (e0: number, e1: number, e2: number, e3: number) => ((e0 * 24 + e1) * 24 + e2) * 24 + e3

/** Distance of every placement of the four cross edges to `homes`, using `moveCount` moves. */
export function buildCrossTable(tables: MoveTables, moveCount: number, homes: readonly number[]): Int8Array {
  const dist = new Int8Array(CROSS_STATES).fill(-1)
  const queue = new Int32Array(CROSS_STATES)
  const goal = crossIndex(homes[0], homes[1], homes[2], homes[3])
  dist[goal] = 0
  queue[0] = goal
  let head = 0
  let tail = 1
  const edge = tables.edge
  while (head < tail) {
    const index = queue[head++]
    const e3 = index % 24
    const e2 = Math.floor(index / 24) % 24
    const e1 = Math.floor(index / 576) % 24
    const e0 = Math.floor(index / 13824)
    const next = dist[index] + 1
    for (let m = 0; m < moveCount; m++) {
      const base = m * 24
      const n = crossIndex(edge[base + e0], edge[base + e1], edge[base + e2], edge[base + e3])
      if (dist[n] < 0) {
        dist[n] = next
        queue[tail++] = n
      }
    }
  }
  return dist
}

/** Distance of every (corner, edge) placement of one slot's pair to its home. */
export function buildPairTable(tables: MoveTables, moveCount: number, home: SlotHome): Int8Array {
  const dist = new Int8Array(576).fill(-1)
  const queue: number[] = [home.corner * 24 + home.edge]
  dist[queue[0]] = 0
  for (let head = 0; head < queue.length; head++) {
    const index = queue[head]
    const corner = Math.floor(index / 24)
    const edge = index % 24
    for (let m = 0; m < moveCount; m++) {
      const n = tables.corner[m * 24 + corner] * 24 + tables.edge[m * 24 + edge]
      if (dist[n] < 0) {
        dist[n] = dist[index] + 1
        queue.push(n)
      }
    }
  }
  return dist
}
