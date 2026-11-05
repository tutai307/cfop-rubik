import { describe, expect, it } from 'vitest'
import { INITIAL_TIMER, timerStep, type Finished, type TimerEvent, type TimerState } from './timer-machine'

/** Runs events in order, collecting finished solves. */
function run(events: TimerEvent[], inspection = false): { state: TimerState; finished: Finished[] } {
  let state = INITIAL_TIMER
  const finished: Finished[] = []
  for (const event of events) {
    const step = timerStep(state, event, inspection)
    state = step.state
    if (step.finished) finished.push(step.finished)
  }
  return { state, finished }
}

const press = (now: number): TimerEvent => ({ type: 'press', now })
const release = (now: number): TimerEvent => ({ type: 'release', now })
const held: TimerEvent = { type: 'hold-elapsed' }

describe('timer without inspection', () => {
  it('starts on release after a long enough hold and stops on the next press', () => {
    const { state, finished } = run([press(0), held, release(400), press(12_400), release(12_500)])
    expect(finished).toEqual([{ time: 12_000, penalty: 'none' }])
    expect(state.current.phase).toBe('idle')
  })

  it('a short tap does not start the timer', () => {
    expect(run([press(0), release(100)]).state.current.phase).toBe('idle')
  })

  it('the release of the stopping press does not start a new hold', () => {
    const { state } = run([press(0), held, release(400), press(5000), release(5100), press(6000)])
    expect(state.current.phase).toBe('holding')
  })
})

describe('timer with WCA inspection', () => {
  const solveAfterInspecting = (inspected: number) =>
    run([press(0), release(50), press(50 + inspected - 400), held, release(50 + inspected), press(50 + inspected + 9000)], true)
      .finished[0]

  it('a tap starts inspection, then hold and release starts the solve', () => {
    expect(solveAfterInspecting(8000)).toEqual({ time: 9000, penalty: 'none' })
  })

  it('starting after 15 s is +2, after 17 s is DNF', () => {
    expect(solveAfterInspecting(16_000).penalty).toBe('+2')
    expect(solveAfterInspecting(17_500).penalty).toBe('DNF')
  })

  it('a short tap during inspection keeps inspecting', () => {
    const { state } = run([press(0), release(50), press(1000), release(1100)], true)
    expect(state.current).toEqual({ phase: 'inspecting', inspectStart: 50 })
  })

  it('cancel ends inspection but never a running solve', () => {
    expect(run([press(0), release(50), { type: 'cancel' }], true).state.current.phase).toBe('idle')
    expect(run([press(0), held, release(400), { type: 'cancel' }]).state.current.phase).toBe('running')
  })
})
