import { STICKERS, centerOf, stickerIndex, stickersAt, type Facelets, type Vec3 } from './facelets'

// Pure geometry for case diagrams: the component only turns polygons into SVG.

export const STICKER_COLORS = ['#ffffff', '#d6281f', '#16a34a', '#fdd300', '#ff7a00', '#1d5fd1'] as const
export const MASKED_COLOR = '#7c7c84'

export type DiagramView = 'top' | 'iso'
/** `oll`: only U-colored stickers; `f2l`: grey last layer except the FR pair; `full`: everything. */
export type DiagramMask = 'oll' | 'f2l' | 'full'

export interface DiagramPolygon {
  points: string
  fill: string
}

export interface Diagram {
  viewBox: string
  polygons: DiagramPolygon[]
}

const fmt = (n: number) => Number(n.toFixed(3))

function visibleColor(state: Facelets, index: number, mask: DiagramMask, pairStickers: Set<number>): string {
  const color = state[index]
  if (mask === 'oll') return color === state[centerOf(0)] ? STICKER_COLORS[color] : MASKED_COLOR
  if (mask === 'f2l' && STICKERS[index].pos[1] === 1 && index !== centerOf(0) && !pairStickers.has(index)) {
    return MASKED_COLOR
  }
  return STICKER_COLORS[color]
}

/** Stickers of the corner and edge whose colors match the FR slot centers. */
function frPairStickers(state: Facelets): Set<number> {
  const pieceColors = [
    [state[centerOf(3)], state[centerOf(2)], state[centerOf(1)]],
    [state[centerOf(2)], state[centerOf(1)]],
  ]
  const result = new Set<number>()
  const seen = new Set<string>()
  for (const s of STICKERS) {
    const key = s.pos.join()
    if (seen.has(key)) continue
    seen.add(key)
    const stickers = stickersAt(s.pos)
    for (const colors of pieceColors) {
      if (stickers.length === colors.length && stickers.every((i) => colors.includes(state[i]))) {
        stickers.forEach((i) => result.add(i))
      }
    }
  }
  return result
}

const rect = (x: number, y: number, w: number, h: number) =>
  [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(([a, b]) => `${fmt(a)},${fmt(b)}`).join(' ')

function topView(state: Facelets, mask: DiagramMask): Diagram {
  const gap = 0.08
  const strip = 0.32
  const inset = 0.05
  const polygons: DiagramPolygon[] = []
  const pair = new Set<number>()
  const add = (pos: Vec3, normal: Vec3, x: number, y: number, w: number, h: number) => {
    const index = stickerIndex(pos, normal)
    polygons.push({ points: rect(x + inset, y + inset, w - 2 * inset, h - 2 * inset), fill: visibleColor(state, index, mask, pair) })
  }
  for (let a = -1; a <= 1; a++) {
    for (let b = -1; b <= 1; b++) add([a, 1, b], [0, 1, 0], a + 1, b + 1, 1, 1)
    add([a, 1, -1], [0, 0, -1], a + 1, -gap - strip, 1, strip)
    add([a, 1, 1], [0, 0, 1], a + 1, 3 + gap, 1, strip)
    add([-1, 1, a], [-1, 0, 0], -gap - strip, a + 1, strip, 1)
    add([1, 1, a], [1, 0, 0], 3 + gap, a + 1, strip, 1)
  }
  const margin = gap + strip + 0.05
  return { viewBox: `${fmt(-margin)} ${fmt(-margin)} ${fmt(3 + 2 * margin)} ${fmt(3 + 2 * margin)}`, polygons }
}

const COS30 = Math.cos(Math.PI / 6)

function project([x, y, z]: Vec3): [number, number] {
  return [(x - z) * COS30, (x + z) * 0.5 - y]
}

function isoView(state: Facelets, mask: DiagramMask): Diagram {
  const pair = mask === 'f2l' ? frPairStickers(state) : new Set<number>()
  const half = 0.45
  const polygons: DiagramPolygon[] = []
  STICKERS.forEach((s, index) => {
    const axis = s.normal.findIndex((v) => v !== 0)
    if (s.normal[axis] < 0) return // only U, R, F are visible
    const [u, v] = [0, 1, 2].filter((a) => a !== axis)
    const center = s.pos.map((p, i) => p + 0.5 * s.normal[i])
    const corner = (du: number, dv: number) => {
      const p = [...center] as [number, number, number]
      p[u] += du
      p[v] += dv
      return project(p)
    }
    const points = [corner(half, half), corner(half, -half), corner(-half, -half), corner(-half, half)]
      .map(([px, py]) => `${fmt(px)},${fmt(py)}`)
      .join(' ')
    polygons.push({ points, fill: visibleColor(state, index, mask, pair) })
  })
  const w = 3 * COS30 + 0.1
  return { viewBox: `${fmt(-w)} ${fmt(-3.1)} ${fmt(2 * w)} 6.2`, polygons }
}

export function renderDiagram(state: Facelets, view: DiagramView, mask: DiagramMask): Diagram {
  return view === 'top' ? topView(state, mask) : isoView(state, mask)
}

export interface NetSticker {
  index: number
  x: number
  y: number
  fill: string
}

// Face offsets (in stickers) of the cross-shaped net, faces in U R F D L B order.
const NET_OFFSETS: [number, number][] = [[3, 0], [6, 3], [3, 3], [3, 6], [0, 3], [9, 3]]

/** Unfolded net: U on top, L F R B in a row, D below F. Each sticker is a 1×1 cell at (x, y). */
export function renderNet(state: Facelets): { width: number; height: number; stickers: NetSticker[] } {
  const stickers = Array.from({ length: 54 }, (_, index) => {
    const [ox, oy] = NET_OFFSETS[Math.floor(index / 9)]
    return { index, x: ox + (index % 3), y: oy + Math.floor((index % 9) / 3), fill: STICKER_COLORS[state[index]] }
  })
  return { width: 12, height: 9, stickers }
}

