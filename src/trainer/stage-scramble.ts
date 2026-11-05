import type { KPattern, KPatternData } from 'cubing/kpuzzle'
import { AUF, recognizePll, type AlgCase } from '../algorithms'
import { applyAlg, formatAlg, invert, isF2LSolved, isTopOriented, stateOf } from '../cube'
import { generateScramble, parseScramble } from '../lib/scramble'

export type TrainerStage = 'cross' | 'f2l' | 'oll' | 'pll'

export type Rng = () => number

export interface StageScramble {
  scramble: string
  /** Case drilled when training a case selection. */
  caseId?: string
}

// cubing.js 3x3 piece order, WCA orientation (white U, green F):
// edges UF UR UB UL DF DR DB DL FR FL BR BL, corners UFR URB UBL ULF DRF DFL DLB DBR.
// Training a stage means every piece of the earlier stages is home; the white
// layer is U here, so the last layer is the D layer until the solver turns `z2`.
const range = (from: number, to: number) => Array.from({ length: to - from }, (_, i) => from + i)
const LAST_LAYER = { edges: range(4, 8), corners: range(4, 8) }
const FREE_PIECES = {
  f2l: { edges: range(4, 12), corners: range(0, 8) },
  oll: LAST_LAYER,
  pll: LAST_LAYER,
} as const

const randomInt = (rng: Rng, n: number) => Math.floor(rng() * n)

function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function isOddPermutation(pieces: readonly number[]): boolean {
  const seen = new Set<number>()
  let odd = false
  for (let start = 0; start < pieces.length; start++) {
    let length = 0
    for (let i = start; !seen.has(i); i = pieces[i]) {
      seen.add(i)
      length++
    }
    if (length > 0 && length % 2 === 0) odd = !odd
  }
  return odd
}

const cloneData = (data: KPatternData): KPatternData => structuredClone(data)

/**
 * Shuffles the pieces among `positions`. `twist` gives fresh random orientations whose
 * total stays solvable; otherwise each position keeps its orientation (an OLL shape
 * keeps its look under any permutation). Call `fixParity` after both orbits.
 */
function shuffleOrbit(
  orbit: KPatternData[string],
  positions: readonly number[],
  modulus: number,
  twist: boolean,
  rng: Rng,
) {
  const moved = shuffle(positions.map((p) => orbit.pieces[p]), rng)
  positions.forEach((p, i) => (orbit.pieces[p] = moved[i]))
  if (!twist) return
  let total = 0
  positions.forEach((p, i) => {
    const value = i === positions.length - 1 ? (modulus - (total % modulus)) % modulus : randomInt(rng, modulus)
    orbit.orientation[p] = value
    total += value
  })
}

/** Corner and edge permutations must share parity; swapping two edges fixes a mismatch. */
function fixParity(data: KPatternData, edgePositions: readonly number[]) {
  if (isOddPermutation(data.EDGES.pieces) === isOddPermutation(data.CORNERS.pieces)) return
  const [a, b] = edgePositions
  const { pieces } = data.EDGES
  ;[pieces[a], pieces[b]] = [pieces[b], pieces[a]]
}

/** Uniformly random state among those where every piece of the earlier stages is solved. */
export function randomStageData(solved: KPatternData, stage: Exclude<TrainerStage, 'cross'>, rng: Rng): KPatternData {
  const data = cloneData(solved)
  const free = FREE_PIECES[stage]
  const twist = stage !== 'pll'
  shuffleOrbit(data.EDGES, free.edges, 2, twist, rng)
  shuffleOrbit(data.CORNERS, free.corners, 3, twist, rng)
  fixParity(data, free.edges)
  return data
}

/** The last layer of an OLL case with a random permutation: shapes stay, pieces move. */
export function permuteLastLayer(data: KPatternData, rng: Rng): KPatternData {
  const result = cloneData(data)
  shuffleOrbit(result.EDGES, LAST_LAYER.edges, 2, false, rng)
  shuffleOrbit(result.CORNERS, LAST_LAYER.corners, 3, false, rng)
  fixParity(result, LAST_LAYER.edges)
  return result
}

const ROTATIONS = ['', 'y', 'y2', "y'"].flatMap((y) => ['', 'x', 'x2', "x'", 'z', "z'"].map((x) => `${x} ${y}`.trim()))

/** Turns the whole cube so every center is home (slice and wide moves shift them). */
export function withCentersHome(pattern: KPattern): KPattern {
  for (const rotation of ROTATIONS) {
    const rotated = pattern.applyAlg(rotation)
    if (rotated.patternData.CENTERS.pieces.every((piece, i) => piece === i)) return rotated
  }
  throw new Error('Không đưa được tâm về vị trí')
}

/** Alg (WCA orientation) that sets up a case from solved, with random AUF around it. */
export function caseSetupAlg(algCase: AlgCase, rng: Rng): string {
  const before = algCase.set === 'PLL' ? AUF[randomInt(rng, 4)] : ''
  const after = AUF[randomInt(rng, 4)]
  return ['z2', before, formatAlg(invert(algCase.alg)), after, 'z2'].filter(Boolean).join(' ')
}

/** Whether the stage is already done on this scramble, so training it would be a skip. */
export function isStageSkip(stage: TrainerStage, scramble: string): boolean {
  const state = applyAlg(stateOf(scramble), 'z2')
  if (stage === 'f2l') return isF2LSolved(state)
  if (stage === 'oll') return isTopOriented(state)
  if (stage === 'pll') return recognizePll(state)?.caseId == null
  return false
}

async function loadCubing() {
  const [{ cube3x3x3 }, { KPattern }, search] = await Promise.all([
    import('cubing/puzzles'),
    import('cubing/kpuzzle'),
    import('cubing/search'),
  ])
  const kpuzzle = await cube3x3x3.kpuzzle()
  return { kpuzzle, KPattern, solve: search.experimentalSolve3x3x3IgnoringCenters }
}

let cubing: ReturnType<typeof loadCubing> | undefined

/** A skip is rare (1 in 216 for OLL, 1 in 72 for PLL); give up after this many in a row. */
const MAX_TRIES = 20

/**
 * Random-state scramble for training one stage: the earlier stages come solved.
 * The state is solved with cubing.js and the solution inverted, so the scramble is
 * short and does not reveal the case alg. `cases` limits OLL/PLL to a selection.
 */
export async function generateStageScramble(
  stage: TrainerStage,
  cases: readonly AlgCase[] = [],
  rng: Rng = Math.random,
): Promise<StageScramble> {
  if (stage === 'cross') return { scramble: await generateScramble() }
  cubing ??= loadCubing()
  const { kpuzzle, KPattern, solve } = await cubing
  const solved = kpuzzle.defaultPattern()

  for (let tries = 0; tries < MAX_TRIES; tries++) {
    const algCase = stage !== 'f2l' && cases.length > 0 ? cases[randomInt(rng, cases.length)] : undefined
    let data: KPatternData
    if (!algCase) {
      data = randomStageData(solved.patternData, stage, rng)
    } else {
      const setup = withCentersHome(solved.applyAlg(caseSetupAlg(algCase, rng))).patternData
      data = stage === 'oll' ? permuteLastLayer(setup, rng) : setup
    }
    const solution = await solve(new KPattern(kpuzzle, data))
    const scramble = solution.toString() ? parseScramble(solution.invert().toString()) : ''
    if (scramble && !isStageSkip(stage, scramble)) return algCase ? { scramble, caseId: algCase.id } : { scramble }
  }
  throw new Error('Không tạo được scramble cho chặng này.')
}
