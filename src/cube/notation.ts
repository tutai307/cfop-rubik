import { solvedFacelets, type Facelets } from './facelets'
import { applyMove, isMoveFamily, type MoveFamily } from './moves'

export interface Move {
  readonly family: MoveFamily
  /** Quarter turns clockwise: 1, 2 or 3 (3 is written as prime). */
  readonly amount: 1 | 2 | 3
}

const MAX_GROUP_REPEAT = 99

export class NotationError extends Error {
  readonly position: number

  constructor(message: string, position: number) {
    super(`${message} (vị trí ${position + 1})`)
    this.position = position
  }
}

const MOVE_PATTERN = /([UDRLFBudrlfbMESxyz])(w?)(\d*)(['’′]?)/y
const GROUP_SUFFIX = /(\d*)(['’′]?)/y

function normalizeAmount(n: number): 0 | 1 | 2 | 3 {
  return (((n % 4) + 4) % 4) as 0 | 1 | 2 | 3
}

/**
 * Parses Singmaster notation. Accepts wide moves as `r` or `Rw`, slices,
 * rotations and parenthesised groups with an optional repeat count `(R U)2`.
 */
export function parseAlg(text: string): Move[] {
  const stack: Move[][] = [[]]
  const openPositions: number[] = []
  let i = 0
  while (i < text.length) {
    const ch = text[i]
    if (/\s/.test(ch)) {
      i++
      continue
    }
    if (ch === '(') {
      stack.push([])
      openPositions.push(i)
      i++
      continue
    }
    if (ch === ')') {
      if (stack.length === 1) throw new NotationError('Thừa dấu ")"', i)
      i++
      GROUP_SUFFIX.lastIndex = i
      const [suffix, digits, prime] = GROUP_SUFFIX.exec(text)!
      const times = digits ? Number(digits) : 1
      if (times > MAX_GROUP_REPEAT) throw new NotationError(`Số lần lặp tối đa là ${MAX_GROUP_REPEAT}`, i)
      i += suffix.length
      const group = stack.pop()!
      openPositions.pop()
      const body = prime ? invert(group) : group
      for (let t = 0; t < times; t++) stack[stack.length - 1].push(...body)
      continue
    }
    MOVE_PATTERN.lastIndex = i
    const match = MOVE_PATTERN.exec(text)
    if (!match) throw new NotationError(`Ký hiệu không hợp lệ "${ch}"`, i)
    const [token, letter, wide, digits, prime] = match
    let family = letter
    if (wide) {
      if (!/[UDRLFB]/.test(letter)) throw new NotationError(`Ký hiệu không hợp lệ "${token}"`, i)
      family = letter.toLowerCase()
    }
    if (!isMoveFamily(family)) throw new NotationError(`Ký hiệu không hợp lệ "${token}"`, i)
    const amount = normalizeAmount((digits ? Number(digits) : 1) * (prime ? -1 : 1))
    if (amount !== 0) stack[stack.length - 1].push({ family, amount })
    i += token.length
  }
  if (stack.length > 1) throw new NotationError('Thiếu dấu ")"', openPositions[openPositions.length - 1])
  return stack[0]
}

export function formatMove({ family, amount }: Move): string {
  return family + (amount === 1 ? '' : amount === 2 ? '2' : "'")
}

export function formatAlg(moves: readonly Move[]): string {
  return moves.map(formatMove).join(' ')
}

const toMoves = (alg: string | readonly Move[]) => (typeof alg === 'string' ? parseAlg(alg) : alg)

export function invert(alg: string | readonly Move[]): Move[] {
  return [...toMoves(alg)].reverse().map(({ family, amount }) => ({
    family,
    amount: (4 - amount) as Move['amount'],
  }))
}

/** Merges adjacent moves of the same family, dropping those that cancel. */
export function simplify(alg: string | readonly Move[]): Move[] {
  const result: Move[] = []
  for (const move of toMoves(alg)) {
    const last = result[result.length - 1]
    if (last && last.family === move.family) {
      const amount = normalizeAmount(last.amount + move.amount)
      if (amount === 0) result.pop()
      else result[result.length - 1] = { family: move.family, amount }
    } else {
      result.push(move)
    }
  }
  return result
}

const isRotation = (family: MoveFamily) => family === 'x' || family === 'y' || family === 'z'
const isSlice = (family: MoveFamily) => family === 'M' || family === 'E' || family === 'S'

/** Half-turn metric: rotations are free, slice moves count as two face turns. */
export function countMoves(alg: string | readonly Move[]): number {
  return toMoves(alg).reduce(
    (total, { family }) => total + (isRotation(family) ? 0 : isSlice(family) ? 2 : 1),
    0,
  )
}

export function applyAlg(state: Facelets, alg: string | readonly Move[]): Facelets {
  return toMoves(alg).reduce((s, { family, amount }) => applyMove(s, family, amount), state)
}

/** State reached by applying `alg` to a solved cube. */
export function stateOf(alg: string | readonly Move[]): Facelets {
  return applyAlg(solvedFacelets(), alg)
}
