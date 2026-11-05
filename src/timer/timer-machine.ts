import type { Penalty } from './stats'

// Timer behaviour of cstimer / Stackmat: hold the trigger until it turns green, release
// to start, any key or touch stops. With inspection on, a first tap starts the 15 s WCA
// countdown; starting after 15 s costs +2, after 17 s the solve is a DNF.

export const HOLD_MS = 300
export const INSPECTION_MS = 15_000
export const INSPECTION_DNF_MS = 17_000

export type TimerPhase =
  | { phase: 'idle' }
  | { phase: 'inspecting'; inspectStart: number }
  | { phase: 'holding'; inspectStart: number | null }
  | { phase: 'ready'; inspectStart: number | null }
  | { phase: 'running'; start: number; penalty: Penalty }

export interface TimerState {
  current: TimerPhase
  /** The stopping press must not also start the next hold when it is released. */
  ignoreRelease: boolean
}

export type TimerEvent =
  | { type: 'press'; now: number }
  | { type: 'release'; now: number }
  /** The trigger has been held for HOLD_MS. */
  | { type: 'hold-elapsed' }
  | { type: 'cancel' }

export interface Finished {
  time: number
  penalty: Penalty
}

export const INITIAL_TIMER: TimerState = { current: { phase: 'idle' }, ignoreRelease: false }

export function inspectionPenalty(elapsed: number): Penalty {
  if (elapsed > INSPECTION_DNF_MS) return 'DNF'
  return elapsed > INSPECTION_MS ? '+2' : 'none'
}

/** Next state, plus the finished solve when this event stopped the timer. */
export function timerStep(
  state: TimerState,
  event: TimerEvent,
  inspection: boolean,
): { state: TimerState; finished?: Finished } {
  const { current } = state
  const to = (next: TimerPhase, ignoreRelease = state.ignoreRelease) => ({ state: { current: next, ignoreRelease } })

  switch (event.type) {
    case 'press':
      if (current.phase === 'running') {
        return {
          state: { current: { phase: 'idle' }, ignoreRelease: true },
          finished: { time: event.now - current.start, penalty: current.penalty },
        }
      }
      if (current.phase === 'idle' && !inspection) return to({ phase: 'holding', inspectStart: null })
      if (current.phase === 'inspecting') return to({ phase: 'holding', inspectStart: current.inspectStart })
      return { state }

    case 'hold-elapsed':
      return current.phase === 'holding' ? to({ phase: 'ready', inspectStart: current.inspectStart }) : { state }

    case 'release':
      if (state.ignoreRelease) return to(current, false)
      if (current.phase === 'idle' && inspection) return to({ phase: 'inspecting', inspectStart: event.now })
      if (current.phase === 'holding') {
        return to(current.inspectStart === null ? { phase: 'idle' } : { phase: 'inspecting', inspectStart: current.inspectStart })
      }
      if (current.phase === 'ready') {
        const penalty = current.inspectStart === null ? 'none' : inspectionPenalty(event.now - current.inspectStart)
        return to({ phase: 'running', start: event.now, penalty })
      }
      return { state }

    case 'cancel':
      return current.phase === 'running' ? { state } : to({ phase: 'idle' }, false)
  }
}
