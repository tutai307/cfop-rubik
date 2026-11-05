import { describeFrPair, findCase } from '../algorithms'
import { STICKERS, centerOf, faceOf, formatAlg, simplify, type Facelets } from '../cube'
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

const ROTATION_NAMES = ['', 'y', 'y2', "y'"]

/**
 * Why this pair now and how it goes. `next` is the pair solved after it, for look ahead;
 * `afterCross` names pairs by color as seen right after the cross.
 */
export function pairReasons(pair: PairSolution, afterCross: Facelets, next?: PairSolution): string[] {
  if (pair.moves.length === 0) return ['Cặp này đã tự vào khe nhờ các nước trước đó, không cần giải.']
  const reasons: string[] = []
  const name = (slot: SlotName) => pairName(afterCross, slot)

  if (pair.options.length > 1) {
    const list = pair.options
      .map((o) => {
        const rotation = o.rotation ? ` + xoay ${ROTATION_NAMES[o.rotation]}` : ''
        const what = o.caseId ? `${o.caseId}, ${o.moves} nước${rotation}` : 'kẹt ở khe khác'
        return `${name(o.slot)} (${what})${o.slot === pair.slot ? ' ← chọn' : ''}`
      })
      .join('; ')
    reasons.push(`Các cặp lúc này: ${list}.`)
  } else {
    reasons.push('Cặp cuối cùng còn lại.')
  }

  const found = pair.caseId ? findCase(pair.caseId) : undefined
  if (pair.caseId && found) {
    if (pair.options.length > 1) {
      reasons.push(
        `Chọn cặp ${name(pair.slot)} vì dễ nhất: đang ở dạng ca chuẩn và ít nước nhất${pair.rotation ? ' (tính cả xoay khối)' : ', không cần xoay khối'}.`,
      )
    }
    reasons.push(`Nhận diện: ${describeFrPair(pair.before).toLowerCase()} (${pair.caseId}).`)
    const strategy = GROUP_STRATEGY[found.group]
    if (strategy) reasons.push(strategy)
    reasons.push(
      formatAlg(pair.moves) === formatAlg(simplify(found.alg))
        ? `Dùng đúng công thức thư viện ${found.alg}.`
        : `Dùng công thức thư viện ${found.alg}, chỉnh nước U đầu để căn cặp về đúng vị trí như hình.`,
    )
  } else {
    reasons.push(
      "Không cặp nào ở dạng ca chuẩn (góc hoặc cạnh đều kẹt ở khe khác), nên chọn cặp lấy ra nhanh nhất. Đoạn này do máy tìm nên không giống công thức; khi tự giải, hãy đưa mảnh bị kẹt lên tầng trên bằng R U R' (hoặc tương tự) rồi giải như ca thường.",
    )
  }

  const insert = insertion(formatAlg(pair.moves))
  if (insert && pair.moves.length === 3) reasons.push(`Cặp đã sẵn sàng: ${insert} chèn thẳng vào khe.`)
  else if (insert) reasons.push(`3 nước cuối ${insert} chèn cặp đã ghép vào khe; các nước trước đó để ghép cặp.`)

  if (next) {
    reasons.push(
      `Look ahead: trong lúc làm cặp này, đưa mắt tìm góc và cạnh của cặp ${name(next.slot)} (cặp giải tiếp theo) để chuyển sang ngay, không phải dừng lại tìm.`,
    )
  }
  return reasons
}

export function rotationReasons(rotation: string): string[] {
  return [`Xoay ${rotation} để khe cần giải về trước-phải: cùng góc nhìn với hình trong thư viện, chỉ cần R U F.`]
}

export function extractionReasons(pair: PairSolution, afterCross: Facelets): string[] {
  const extraction = pair.extraction!
  return [
    'Không cặp nào ở dạng ca chuẩn: góc hoặc cạnh của các cặp còn lại đều kẹt trong khe khác.',
    `Rút mảnh kẹt ra tầng trên bằng ${formatAlg(extraction.moves)}, sau đó cặp ${pairName(afterCross, pair.slot)} thành ca chuẩn${pair.caseId ? ` (${pair.caseId})` : ''}.`,
    'Khi tự giải: chọn khe sao cho mảnh rút ra không làm hỏng cặp đang nhìn thấy, ưu tiên rút ở khe trước để dễ quan sát.',
  ]
}
