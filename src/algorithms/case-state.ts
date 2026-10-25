import {
  STICKERS,
  centerOf,
  faceOf,
  invert,
  parseAlg,
  stateOf,
  stickersAt,
  type Facelets,
  type Vec3,
} from '../cube'

/** Solving orientation: yellow on U, white on D, green in front. */
export const SOLVING_ORIENTATION = 'z2'

/** The state a case alg solves, seen in the solving orientation. */
export function caseState(algCase: { alg: string }): Facelets {
  return stateOf([...parseAlg(SOLVING_ORIENTATION), ...invert(algCase.alg)])
}

const CUBIE_POSITIONS: Vec3[] = []
for (const s of STICKERS) {
  if (!CUBIE_POSITIONS.some((p) => p.every((v, i) => v === s.pos[i]))) CUBIE_POSITIONS.push(s.pos)
}
const nonZero = (p: Vec3) => p.filter((v) => v !== 0).length
const CORNER_STICKERS = CUBIE_POSITIONS.filter((p) => nonZero(p) === 3).map(stickersAt)
const EDGE_STICKERS = CUBIE_POSITIONS.filter((p) => nonZero(p) === 2).map(stickersAt)

/** Sticker index currently holding `refColor` on the piece with exactly `colors`. */
export function locatePiece(state: Facelets, colors: readonly number[], refColor: number): number {
  const groups = colors.length === 3 ? CORNER_STICKERS : EDGE_STICKERS
  for (const group of groups) {
    if (group.every((i) => colors.includes(state[i]))) {
      const ref = group.find((i) => state[i] === refColor)
      if (ref !== undefined) return ref
    }
  }
  throw new Error('Không tìm thấy mảnh với màu đã cho')
}

const [U, R, F, D] = [0, 1, 2, 3]

/** Locations of the FR slot pair: the corner's D-color sticker and the edge's F-color sticker. */
export function frPairLocation(state: Facelets): [corner: number, edge: number] {
  const d = state[centerOf(D)]
  const f = state[centerOf(F)]
  const r = state[centerOf(R)]
  return [locatePiece(state, [d, f, r], d), locatePiece(state, [f, r], f)]
}

const isTop = (sticker: number) => STICKERS[sticker].pos[1] === 1

/** Short Vietnamese description of where the FR pair is, e.g. "Góc trắng lên, cặp tách rời". */
export function describeFrPair(state: Facelets): string {
  const [corner, edge] = frPairLocation(state)
  const cornerFace = faceOf(corner)
  const edgeFace = faceOf(edge)
  if (!isTop(corner) && !isTop(edge)) {
    const c = cornerFace === D ? 'Góc đúng' : cornerFace === F ? 'Góc xoắn, trắng ra trước' : 'Góc xoắn, trắng sang phải'
    return `${c}, cạnh ${edgeFace === F ? 'đúng' : 'lật'} trong khe`
  }
  if (!isTop(corner)) {
    const c = cornerFace === D ? 'Góc đúng trong khe' : cornerFace === F ? 'Góc trong khe, trắng ra trước' : 'Góc trong khe, trắng sang phải'
    return `${c}, cạnh ${edgeFace === U ? 'màu trước ở trên' : 'màu phải ở trên'}`
  }
  const c = cornerFace === U ? 'Góc trắng lên' : 'Góc trắng ngang'
  if (!isTop(edge)) return `${c}, cạnh ${edgeFace === F ? 'đúng' : 'lật'} trong khe`
  return `${c}, ${pairRelation(state, corner, edge)}`
}

/** Whether a corner and an edge in the U layer sit side by side, and with matching colors. */
function pairRelation(state: Facelets, corner: number, edge: number): string {
  const cornerPos = STICKERS[corner].pos
  const edgePos = STICKERS[edge].pos
  const distance = cornerPos.reduce((sum, v, i) => sum + Math.abs(v - edgePos[i]), 0)
  if (distance !== 1) return 'cặp tách rời'
  // Adjacent: matched when every shared side face shows the same color on both pieces.
  const cornerStickers = stickersAt(cornerPos)
  const matched = stickersAt(edgePos).every((e) => {
    const twin = cornerStickers.find((c) => faceOf(c) === faceOf(e))
    return twin !== undefined && state[twin] === state[e]
  })
  return matched ? 'cặp đã ghép' : 'cặp ghép sai'
}
