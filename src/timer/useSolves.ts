import { useCallback } from 'react'
import { useStoredState } from '../lib/storage'
import type { TrainerStage } from '../trainer/stage-scramble'
import type { Penalty, Solve } from './stats'

/** Full solves or one CFOP stage; each keeps its own list of solves. */
export type TimerSession = '333' | TrainerStage

const PENALTIES: readonly Penalty[] = ['none', '+2', 'DNF']

function isSolve(value: unknown): value is Solve {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return (
    typeof s.id === 'string' &&
    typeof s.time === 'number' &&
    PENALTIES.includes(s.penalty as Penalty) &&
    typeof s.scramble === 'string' &&
    typeof s.at === 'number'
  )
}

const isSolveList = (value: unknown): value is Solve[] => Array.isArray(value) && value.every(isSolve)
const NO_SOLVES: Solve[] = []

export function useSolves(session: TimerSession) {
  const [solves, setSolves] = useStoredState(`solves.${session}`, NO_SOLVES, isSolveList)

  const add = useCallback(
    (solve: Omit<Solve, 'id' | 'at'>) => {
      const at = Date.now()
      setSolves((list) => [...list, { ...solve, id: `${at}-${Math.random().toString(36).slice(2, 8)}`, at }])
    },
    [setSolves],
  )
  const setPenalty = useCallback(
    (id: string, penalty: Penalty) => setSolves((list) => list.map((s) => (s.id === id ? { ...s, penalty } : s))),
    [setSolves],
  )
  const remove = useCallback((id: string) => setSolves((list) => list.filter((s) => s.id !== id)), [setSolves])
  const clear = useCallback(() => setSolves(NO_SOLVES), [setSolves])

  return { solves, add, setPenalty, remove, clear }
}
