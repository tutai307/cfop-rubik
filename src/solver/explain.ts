import { describeFrPair, findCase } from '../algorithms'
import { STICKERS, centerOf, countMoves, faceOf, formatAlg, type Facelets } from '../cube'
import { CROSS_HOMES, crossLocations, edgeSticker, type SlotName } from './cubie'
import type { PairSolution } from './f2l'

// Sentences under each step that say why the app solves it this way, so a learner
// can follow the thinking and not only the moves. Orientation: white D, green F.

const COLOR_NAMES = ['trắng', 'đỏ', 'xanh lá', 'vàng', 'cam', 'xanh dương']
const [U, R, F, D, L, B] = [0, 1, 2, 3, 4, 5]
const colorOf = (state: Facelets, face: number) => COLOR_NAMES[state[centerOf(face)]]

/** Side faces of each cross edge, order DF DR DB DL like CROSS_HOMES. */
const CROSS_SIDES = [F, R, B, L]
const SLOT_FACES: Record<SlotName, [number, number]> = { FR: [F, R], FL: [F, L], BL: [B, L], BR: [B, R] }

/** Pair name by its side colors, e.g. "xanh lá-cam", read from the centers of `state`. */
export function pairName(state: Facelets, slot: SlotName): string {
  const [a, b] = SLOT_FACES[slot]
  return `${colorOf(state, a)}-${colorOf(state, b)}`
}

function crossEdgeWhere(location: number, home: number): string {
  if (location === home) return 'đã đúng chỗ'
  const sticker = edgeSticker(location)
  const layer = STICKERS[sticker].pos[1]
  const face = faceOf(sticker)
  if (layer === -1) return face === D ? 'ở đáy nhưng sai chỗ' : 'ở đáy nhưng bị lật'
  if (layer === 0) return 'ở tầng giữa'
  return face === U ? 'ở tầng trên, trắng hướng lên' : 'ở tầng trên, trắng hướng ngang'
}

/** `state` is the cube before the cross, white on D. */
export function crossReasons(state: Facelets, moveCount: number): string[] {
  const edges = crossLocations(state).map(
    (location, i) => `Cạnh trắng-${colorOf(state, CROSS_SIDES[i])}: ${crossEdgeWhere(location, CROSS_HOMES[i])}.`,
  )
  return [
    `Đây là cross ngắn nhất (${moveCount} nước): app thử mọi cách đặt 4 cạnh chứ không giải lần lượt từng cạnh, vì một nước có thể đưa nhiều cạnh về cùng lúc.`,
    ...edges,
    'Khi tự giải: dùng 15 giây quan sát để lên kế hoạch cả cross, ưu tiên cạnh đã đúng chỗ hoặc chỉ cần 1–2 nước, mỗi cạnh phải khớp màu với tâm bên cạnh.',
  ]
}

const GROUP_STRATEGY: Record<string, string> = {
  'Cả hai ở tầng trên': 'Cả góc và cạnh ở tầng trên: dùng U để đặt chúng thành cặp (đứng cạnh nhau, cùng màu) rồi chèn vào khe.',
  'Góc trong khe': 'Góc đã ở khe: đưa cạnh đến chỗ khớp với góc, rồi lấy góc ra cùng cạnh và chèn lại một lần.',
  'Cạnh trong khe': 'Cạnh ở khe: lấy cạnh ra tầng trên (thường kèm góc), ghép thành cặp rồi chèn lại.',
  'Cả hai trong khe': 'Góc và cạnh đã ở khe nhưng sai hướng: phải lấy ra tầng trên rồi ghép lại.',
}

/** The last three moves when they insert a ready pair into the FR slot. */
function insertion(moves: string): string | null {
  const last = moves.split(' ').slice(-3)
  if (last.length < 3 || !/^U/.test(last[1])) return null
  const [a, , c] = last
  return (a === 'R' && c === "R'") || (a === "F'" && c === 'F') || (a === "R'" && c === 'R') || (a === 'F' && c === "F'")
    ? last.join(' ')
    : null
}

interface PairContext {
  pair: PairSolution
  caseId: string | null
  /** State right after the cross, for naming pairs by color. */
  afterCross: Facelets
  /** First pair with moves: also explains how the order was chosen. */
  first: boolean
  total: number
  greedyMoves: number
}

export function pairReasons({ pair, caseId, afterCross, first, total, greedyMoves }: PairContext): string[] {
  if (pair.moves.length === 0) return ['Cặp này đã tự vào khe nhờ các nước trước đó, không cần giải.']
  const reasons: string[] = []
  const name = (slot: SlotName) => pairName(afterCross, slot)

  if (first) {
    reasons.push(
      greedyMoves > total
        ? `Thứ tự 4 cặp: app thử cả 24 thứ tự và lấy tổng ngắn nhất (${total} nước); nếu lần nào cũng chọn cặp ngắn nhất trước thì tổng là ${greedyMoves} nước.`
        : `Thứ tự 4 cặp: app thử cả 24 thứ tự; chọn cặp ngắn nhất ở mỗi lượt cũng cho tổng ngắn nhất (${total} nước).`,
    )
  }

  const options = [...pair.options].sort((a, b) => a.moves - b.moves)
  if (options.length > 1) {
    const list = options.map((o) => `${name(o.slot)} ${o.moves} nước${o.slot === pair.slot ? ' (chọn)' : ''}`).join(', ')
    reasons.push(`Các cặp còn lại nếu giải ngay: ${list}.`)
    const cheapest = options[0]
    if (cheapest.moves < pair.moves.length) {
      reasons.push(
        `Không chọn cặp ngắn nhất (${name(cheapest.slot)}) vì giải cặp ${name(pair.slot)} trước làm các cặp sau ngắn hơn, tổng F2L ít nước hơn.`,
      )
    } else {
      reasons.push(`Chọn cặp ${name(pair.slot)} vì đang cần ít nước nhất.`)
    }
  } else if (options.length === 1) {
    reasons.push('Cặp cuối cùng còn lại.')
  }

  const moves = formatAlg(pair.moves)
  const found = caseId ? findCase(caseId) : undefined
  if (caseId && found) {
    reasons.push(`Nhận diện: ${describeFrPair(pair.before).toLowerCase()} (${caseId}).`)
    const strategy = GROUP_STRATEGY[found.group]
    if (strategy) reasons.push(strategy)
    const libraryCount = countMoves(found.alg)
    if (libraryCount > pair.moves.length) {
      reasons.push(
        `Công thức thư viện cho ca này là ${found.alg} (${libraryCount} nước, có thể cần U trước); app tìm được cách ngắn hơn ${libraryCount - pair.moves.length} nước. Người mới nên học công thức thư viện trước, quen rồi mới tối ưu.`,
      )
    }
  } else {
    reasons.push('Góc hoặc cạnh đang ở khe khác: phải đưa ra tầng trên trước, nên không theo đúng ca chuẩn và tốn thêm nước.')
  }

  const insert = insertion(moves)
  if (insert && pair.moves.length === 3) reasons.push(`Cặp đã sẵn sàng: ${insert} chèn thẳng vào khe.`)
  else if (insert) reasons.push(`3 nước cuối ${insert} chèn cặp đã ghép vào khe; các nước trước đó để ghép cặp.`)
  return reasons
}

export function rotationReasons(): string[] {
  return ['Xoay y để khe cần giải về trước-phải: cùng góc nhìn với hình trong thư viện, chỉ cần R U F.']
}
