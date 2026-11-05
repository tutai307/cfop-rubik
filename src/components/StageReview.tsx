import { useEffect, useMemo, useState } from 'react'
import { useSolutionPlayback } from '../hooks/useSolutionPlayback'
import { useSolver } from '../hooks/useSolver'
import { stagePlan } from '../lib/timeline'
import type { TimerSession } from '../timer/useSolves'
import { CubeViewer } from './CubeViewer'
import { PlayerControls } from './PlayerControls'
import { StepTimeline } from './StepTimeline'

interface StageReviewProps {
  scramble: string
  session: TimerSession
  /** Show only the cube until asked, for a scramble not solved yet. */
  hideSolution?: boolean
}

/** 3D cube at the start of the trained stage, stepping through the app's CFOP solution. */
export function StageReview({ scramble, session, hideSolution = false }: StageReviewProps) {
  const { state, solve } = useSolver()
  const [revealed, setRevealed] = useState(!hideSolution)
  useEffect(() => solve(scramble), [scramble, solve])

  const plan = useMemo(() => (state.status === 'done' ? stagePlan(state.result.steps, session) : null), [state, session])
  const shown = revealed && plan ? plan.steps : null
  const playback = useSolutionPlayback(shown, { spaceToPlay: false })
  const moveCount = plan ? plan.steps.reduce((sum, s) => sum + s.moveCount, 0) : 0

  if (state.status === 'error') return <p className="error">{state.message}</p>

  return (
    <div className="stage-review">
      <div className="review-cube">
        <CubeViewer
          className="review-viewer"
          setupAlg={plan ? `${scramble} ${plan.setup}` : ''}
          alg={shown ? playback.solutionAlg : ''}
          stickering={playback.stickering}
          controllerRef={playback.controller}
          onMoveIndexChange={shown ? playback.onMoveIndexChange : undefined}
          onPlayingChange={playback.setPlaying}
        />
        {shown && <PlayerControls {...playback} spaceToPlay={false} />}
      </div>
      <div className="review-steps" data-scroll-container>
        {!plan ? (
          <p className="muted">Đang tìm lời giải…</p>
        ) : (
          <>
            <p className="muted">
              Khối bắt đầu ở đầu chặng, cầm trắng dưới, xanh lá trước (đã xoay z2 sau scramble).
              {shown && ` Lời giải ${moveCount} nước · ← → từng nước, ↑ ↓ từng bước.`}
            </p>
            {shown ? (
              <StepTimeline steps={shown} current={playback.current} playing={playback.playing} onSeek={playback.seek} />
            ) : (
              <button type="button" onClick={() => setRevealed(true)}>
                Hiện lời giải
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
