export type Penalty = 'none' | '+2' | 'DNF'

export interface Solve {
  id: string
  /** Raw timer reading in milliseconds, before any penalty. */
  time: number
  penalty: Penalty
  scramble: string
  /** Epoch milliseconds when the solve finished. */
  at: number
  /** Case drilled, for OLL/PLL training with a case selection. */
  caseId?: string
}

/** Time that counts for statistics: +2 adds two seconds, DNF is infinitely slow. */
export function effectiveTime(solve: Solve): number {
  if (solve.penalty === 'DNF') return Infinity
  return solve.penalty === '+2' ? solve.time + 2000 : solve.time
}

/**
 * WCA-style average: drop the best and worst 5% (at least one each), mean the rest.
 * More DNFs than dropped slow results make the whole average a DNF (Infinity).
 */
export function trimmedAverage(times: readonly number[]): number {
  const trim = Math.max(1, Math.ceil(times.length * 0.05))
  const sorted = [...times].sort((a, b) => a - b)
  const kept = sorted.slice(trim, sorted.length - trim)
  if (kept.some((t) => t === Infinity)) return Infinity
  return kept.reduce((sum, t) => sum + t, 0) / kept.length
}

/** Average of the last `n` solves, or `null` when there are fewer. */
export function currentAverage(solves: readonly Solve[], n: number): number | null {
  if (solves.length < n) return null
  return trimmedAverage(solves.slice(-n).map(effectiveTime))
}

/** Rolling average of `n` ending at each solve; `null` before the first full window. */
export function averageSeries(solves: readonly Solve[], n: number): (number | null)[] {
  const times = solves.map(effectiveTime)
  return times.map((_, i) => (i + 1 < n ? null : trimmedAverage(times.slice(i + 1 - n, i + 1))))
}

/** Best average of `n` consecutive solves, or `null` when there are fewer. */
export function bestAverage(solves: readonly Solve[], n: number): number | null {
  const series = averageSeries(solves, n).filter((a): a is number => a !== null)
  return series.length === 0 ? null : Math.min(...series)
}

export function bestSingle(solves: readonly Solve[]): number | null {
  return solves.length === 0 ? null : Math.min(...solves.map(effectiveTime))
}

/** Mean of every finished (non-DNF) solve. */
export function meanTime(solves: readonly Solve[]): number | null {
  const finished = solves.map(effectiveTime).filter((t) => t !== Infinity)
  return finished.length === 0 ? null : finished.reduce((sum, t) => sum + t, 0) / finished.length
}

/** `9.87`, `1:02.35` or `DNF`; truncated to hundredths like WCA timers. */
export function formatTime(ms: number | null): string {
  if (ms === null) return '–'
  if (ms === Infinity) return 'DNF'
  const centis = Math.floor(ms / 10)
  const minutes = Math.floor(centis / 6000)
  const seconds = Math.floor((centis % 6000) / 100)
  const hundredths = String(centis % 100).padStart(2, '0')
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}.${hundredths}` : `${seconds}.${hundredths}`
}

/** A single as shown in lists: `12.34`, `14.34+` or `DNF`. */
export function formatSolve(solve: Solve): string {
  if (solve.penalty === 'DNF') return 'DNF'
  return solve.penalty === '+2' ? `${formatTime(solve.time + 2000)}+` : formatTime(solve.time)
}
