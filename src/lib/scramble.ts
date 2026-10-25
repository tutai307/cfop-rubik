import { formatAlg, parseAlg } from '../cube'

/** Random-state 3x3 scramble following WCA regulations (cubing.js). */
export async function generateScramble(): Promise<string> {
  const { randomScrambleForEvent } = await import('cubing/scramble')
  return (await randomScrambleForEvent('333')).toString()
}

/** Validates a pasted scramble: face turns only, normalised notation. Throws a Vietnamese message. */
export function parseScramble(text: string): string {
  const moves = parseAlg(text)
  if (moves.length === 0) throw new Error('Scramble đang trống.')
  if (moves.some((m) => !'URFDLB'.includes(m.family))) {
    throw new Error('Scramble chỉ được gồm các nước mặt U D L R F B.')
  }
  return formatAlg(moves)
}
