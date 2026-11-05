import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CubeController, Stickering } from '../components/CubeViewer'
import { stepStarts, timelineMoves } from '../lib/timeline'
import type { SolveStep } from '../solver/types'

const STAGE_STICKERING: Record<Exclude<SolveStep['stage'], 'Xoay'>, Stickering> = {
  Cross: 'Cross',
  F2L: 'F2L',
  OLL: 'OLL',
  PLL: 'PLL',
}

interface PlaybackOptions {
  /** Space plays/pauses; off where Space belongs to the timer. Arrow keys always seek. */
  spaceToPlay: boolean
}

/** Step-by-step playback of a solution on a CubeViewer, with keyboard shortcuts. */
export function useSolutionPlayback(steps: readonly SolveStep[] | null, { spaceToPlay }: PlaybackOptions) {
  // Moves applied, tagged with the steps they belong to so a new solution starts at 0.
  const [position, setPosition] = useState<{ of: unknown; index: number }>({ of: null, index: 0 })
  const [playing, setPlaying] = useState(false)
  const controller = useRef<CubeController>(null)

  const moves = useMemo(() => (steps ? timelineMoves(steps) : []), [steps])
  const starts = useMemo(() => (steps ? [...new Set(stepStarts(steps))] : []), [steps])
  const solutionAlg = useMemo(() => moves.map((m) => m.token).join(' '), [moves])
  const current = steps && position.of === steps ? Math.min(position.index, moves.length) : 0

  const seek = useCallback(
    (index: number) => {
      void controller.current?.goToMove(Math.max(0, Math.min(index, moves.length)))
    },
    [moves.length],
  )

  const togglePlay = useCallback(() => {
    if (!steps) return
    if (playing) {
      controller.current?.pause()
    } else {
      if (current >= moves.length) controller.current?.jumpToStart()
      controller.current?.play()
    }
  }, [steps, playing, current, moves.length])

  const onMoveIndexChange = useCallback((index: number) => setPosition({ of: steps, index }), [steps])

  useEffect(() => {
    if (!steps) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.altKey || event.ctrlKey || event.metaKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      // A focused button already handles Space itself.
      if (event.key === ' ' && (!spaceToPlay || target.tagName === 'BUTTON')) return
      const actions: Record<string, () => void> = {
        ArrowLeft: () => seek(current - 1),
        ArrowRight: () => seek(current + 1),
        ArrowUp: () => seek([...starts].reverse().find((s) => s < current) ?? 0),
        ArrowDown: () => seek(starts.find((s) => s > current) ?? moves.length),
        ' ': togglePlay,
      }
      const action = actions[event.key]
      if (!action) return
      event.preventDefault()
      action()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [steps, current, starts, moves.length, seek, togglePlay, spaceToPlay])

  // Highlight the stage of the next move (rotations take the stage that follows).
  let stickering: Stickering = 'full'
  if (steps && current > 0 && current < moves.length) {
    const next = steps.slice(moves[current].step).find((s) => s.stage !== 'Xoay')
    if (next && next.stage !== 'Xoay') stickering = STAGE_STICKERING[next.stage]
  }

  return { controller, solutionAlg, total: moves.length, current, playing, setPlaying, onMoveIndexChange, seek, togglePlay, stickering }
}
