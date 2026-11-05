import { describe, expect, it } from 'vitest'
import {
  averageSeries,
  bestAverage,
  bestSingle,
  currentAverage,
  effectiveTime,
  formatSolve,
  formatTime,
  meanTime,
  trimmedAverage,
  type Penalty,
  type Solve,
} from './stats'

const solve = (time: number, penalty: Penalty = 'none'): Solve => ({ id: String(time), time, penalty, scramble: '', at: 0 })

describe('effectiveTime', () => {
  it('adds two seconds for +2 and makes DNF infinite', () => {
    expect(effectiveTime(solve(10000))).toBe(10000)
    expect(effectiveTime(solve(10000, '+2'))).toBe(12000)
    expect(effectiveTime(solve(10000, 'DNF'))).toBe(Infinity)
  })
})

describe('trimmedAverage', () => {
  it('drops the best and worst of five', () => {
    expect(trimmedAverage([10, 20, 30, 40, 1000])).toBe(30)
  })

  it('drops five from each side of a hundred', () => {
    const times = Array.from({ length: 100 }, (_, i) => i + 1)
    expect(trimmedAverage(times)).toBe(50.5)
  })

  it('tolerates one DNF in ao5 but not two', () => {
    expect(trimmedAverage([10, 20, 30, 40, Infinity])).toBe(30)
    expect(trimmedAverage([10, 20, 30, Infinity, Infinity])).toBe(Infinity)
  })
})

describe('averages over solves', () => {
  const solves = [12000, 11000, 13000, 10000, 14000, 9000].map((t) => solve(t))

  it('is null until there are enough solves', () => {
    expect(currentAverage(solves.slice(0, 4), 5)).toBeNull()
    expect(bestAverage(solves.slice(0, 4), 5)).toBeNull()
  })

  it('averages the latest window and finds the best one', () => {
    expect(currentAverage(solves, 5)).toBe((11000 + 13000 + 10000) / 3)
    expect(averageSeries(solves, 5)).toEqual([null, null, null, null, 12000, (11000 + 13000 + 10000) / 3])
    expect(bestAverage(solves, 5)).toBe((11000 + 13000 + 10000) / 3)
  })

  it('takes penalties into account for singles and mean', () => {
    const withPenalties = [solve(8000, 'DNF'), solve(9000, '+2'), solve(12000)]
    expect(bestSingle(withPenalties)).toBe(11000)
    expect(meanTime(withPenalties)).toBe(11500)
    expect(meanTime([solve(1, 'DNF')])).toBeNull()
  })
})

describe('formatting', () => {
  it('truncates to hundredths and adds minutes past 60 seconds', () => {
    expect(formatTime(9879)).toBe('9.87')
    expect(formatTime(62350)).toBe('1:02.35')
    expect(formatTime(Infinity)).toBe('DNF')
    expect(formatTime(null)).toBe('–')
  })

  it('marks penalties on a single', () => {
    expect(formatSolve(solve(12340, '+2'))).toBe('14.34+')
    expect(formatSolve(solve(12340, 'DNF'))).toBe('DNF')
  })
})
