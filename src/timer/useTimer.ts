import { useCallback, useEffect, useRef, useState } from 'react'
import { HOLD_MS, INITIAL_TIMER, timerStep, type Finished, type TimerEvent, type TimerState } from './timer-machine'

interface TimerOptions {
  inspection: boolean
  /** When false a new hold cannot begin (e.g. no scramble yet); a running solve still stops. */
  enabled: boolean
  onFinish: (finished: Finished) => void
}

/** Fields that need the keyboard for typing; a focused checkbox or button must not swallow Space. */
const isTextField = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  ((target instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit', 'reset'].includes(target.type)) ||
    ['TEXTAREA', 'SELECT'].includes(target.tagName) ||
    target.isContentEditable)

/**
 * Drives the timer from the keyboard (Space to hold, any key to stop) and from
 * touch/mouse: press the timer area to hold, anywhere to stop.
 */
export function useTimer({ inspection, enabled, onFinish }: TimerOptions) {
  const [state, setState] = useState<TimerState>(INITIAL_TIMER)
  const [now, setNow] = useState(() => performance.now())
  const areaRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef(state)
  const options = useRef({ inspection, enabled, onFinish })
  useEffect(() => {
    options.current = { inspection, enabled, onFinish }
  })

  const dispatch = useCallback((event: TimerEvent) => {
    const { inspection, enabled, onFinish } = options.current
    const phase = stateRef.current.current.phase
    if (event.type === 'press' && !enabled && (phase === 'idle' || phase === 'inspecting')) return
    const step = timerStep(stateRef.current, event, inspection)
    if (step.state !== stateRef.current) {
      stateRef.current = step.state
      setState(step.state)
    }
    if (step.finished) onFinish(step.finished)
  }, [])

  const phase = state.current.phase

  useEffect(() => {
    if (phase !== 'holding') return
    const id = setTimeout(() => dispatch({ type: 'hold-elapsed' }), HOLD_MS)
    return () => clearTimeout(id)
  }, [phase, dispatch])

  useEffect(() => {
    if (phase === 'idle') return
    let frame = requestAnimationFrame(function tick(t) {
      setNow(t)
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [phase])

  useEffect(() => {
    const running = () => stateRef.current.current.phase === 'running'
    // A release only matters after a press we handled: a hold in progress, or the stop.
    const awaitingRelease = () => {
      const { current, ignoreRelease } = stateRef.current
      return ignoreRelease || current.phase === 'holding' || current.phase === 'ready'
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTextField(event.target) || event.ctrlKey || event.metaKey || event.altKey) return
      if (running()) {
        event.preventDefault()
        if (!event.repeat) dispatch({ type: 'press', now: performance.now() })
      } else if (event.key === ' ') {
        // Also keeps a focused button from being clicked by Space.
        event.preventDefault()
        if (!event.repeat) dispatch({ type: 'press', now: performance.now() })
      } else if (event.key === 'Escape') {
        dispatch({ type: 'cancel' })
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (isTextField(event.target)) return
      if (event.key === ' ') event.preventDefault()
      if (event.key === ' ' || awaitingRelease()) dispatch({ type: 'release', now: performance.now() })
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      const inArea = areaRef.current?.contains(event.target as Node) ?? false
      if (running() || inArea) dispatch({ type: 'press', now: performance.now() })
    }
    const onPointerUp = () => {
      if (awaitingRelease()) dispatch({ type: 'release', now: performance.now() })
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [dispatch])

  const current = state.current
  const inspectStart = 'inspectStart' in current ? current.inspectStart : null
  return {
    phase: current.phase,
    /** Milliseconds on the running clock. */
    elapsed: current.phase === 'running' ? Math.max(0, now - current.start) : 0,
    /** Milliseconds since inspection began, or `null` outside inspection. */
    inspected: inspectStart === null ? null : Math.max(0, now - inspectStart),
    areaRef,
  }
}
