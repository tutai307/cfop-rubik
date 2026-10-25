import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CubeViewer, type CubeController, type Stickering } from '../components/CubeViewer'
import { StepTimeline } from '../components/StepTimeline'
import { useSolver } from '../hooks/useSolver'
import { generateScramble, parseScramble } from '../lib/scramble'
import { stepStarts, timelineMoves } from '../lib/timeline'
import type { SolveStep } from '../solver/types'
import './PracticePage.css'

const STAGE_STICKERING: Record<Exclude<SolveStep['stage'], 'Xoay'>, Stickering> = {
  Cross: 'Cross',
  F2L: 'F2L',
  OLL: 'OLL',
  PLL: 'PLL',
}

/** A new scramble plays from solved at this speed, faster than a solution. */
const SCRAMBLE_TEMPO = 2.5

export function PracticePage() {
  const [scramble, setScramble] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [scrambleError, setScrambleError] = useState<string | null>(null)
  const [pasted, setPasted] = useState('')
  const [copied, setCopied] = useState(false)
  // Moves applied, tagged with the solution they belong to so a new solution starts at 0.
  const [position, setPosition] = useState<{ of: unknown; index: number }>({ of: null, index: 0 })
  const [playing, setPlaying] = useState(false)
  const controller = useRef<CubeController>(null)
  const { state: solver, solve, cancel } = useSolver()

  const result = solver.status === 'done' ? solver.result : null
  const moves = useMemo(() => (result ? timelineMoves(result.steps) : []), [result])
  const starts = useMemo(() => (result ? [...new Set(stepStarts(result.steps))] : []), [result])
  const solutionAlg = useMemo(() => moves.map((m) => m.token).join(' '), [moves])
  const current = result && position.of === result ? Math.min(position.index, moves.length) : 0

  const applyScramble = useCallback(
    (next: string) => {
      cancel()
      setScramble(next)
      setScrambleError(null)
      setCopied(false)
    },
    [cancel],
  )

  const onGenerate = async () => {
    setGenerating(true)
    setScrambleError(null)
    try {
      applyScramble(await generateScramble())
    } catch {
      setScrambleError('Không tạo được scramble. Hãy thử lại.')
    } finally {
      setGenerating(false)
    }
  }

  const onPaste = () => {
    try {
      applyScramble(parseScramble(pasted))
      setPasted('')
    } catch (error) {
      setScrambleError(error instanceof Error ? error.message : 'Scramble không hợp lệ.')
    }
  }

  const onCopy = async () => {
    if (!scramble) return
    try {
      await navigator.clipboard.writeText(scramble)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const seek = useCallback(
    (index: number) => {
      void controller.current?.goToMove(Math.max(0, Math.min(index, moves.length)))
    },
    [moves.length],
  )

  const togglePlay = useCallback(() => {
    if (!result) return
    if (playing) {
      controller.current?.pause()
    } else {
      if (current >= moves.length) controller.current?.jumpToStart()
      controller.current?.play()
    }
  }, [result, playing, current, moves.length])

  useEffect(() => {
    if (!result) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.altKey || event.ctrlKey || event.metaKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      // A focused button already handles Space itself.
      if (event.key === ' ' && target.tagName === 'BUTTON') return
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
  }, [result, current, starts, moves.length, seek, togglePlay])

  // Highlight the stage of the next move (rotations take the stage that follows).
  let stickering: Stickering = 'full'
  if (result && current > 0 && current < moves.length) {
    const next = result.steps.slice(moves[current].step).find((s) => s.stage !== 'Xoay')
    if (next && next.stage !== 'Xoay') stickering = STAGE_STICKERING[next.stage]
  }

  return (
    <div className="practice">
      <section className="panel scramble-panel" aria-label="Scramble">
        <h3>Scramble</h3>
        <button type="button" className="primary" onClick={onGenerate} disabled={generating}>
          {generating ? 'Đang tạo…' : 'Tạo scramble'}
        </button>
        {scramble ? (
          <>
            <p className="scramble-text">{scramble}</p>
            <div className="button-row">
              <button type="button" onClick={onCopy}>
                {copied ? 'Đã sao chép' : 'Sao chép'}
              </button>
              {!result && (
                <button
                  type="button"
                  onClick={() => {
                    controller.current?.jumpToStart()
                    controller.current?.play()
                  }}
                >
                  Phát lại scramble
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="muted">Scramble random-state chuẩn WCA, cầm trắng trên, xanh lá trước. Lần đầu có thể mất vài giây.</p>
        )}
        <label className="paste">
          Hoặc dán scramble
          <textarea rows={2} value={pasted} placeholder="R U R' U' …" onChange={(e) => setPasted(e.target.value)} />
        </label>
        <button type="button" onClick={onPaste} disabled={!pasted.trim()}>
          Dùng scramble này
        </button>
        {scrambleError && (
          <p className="error" role="alert">
            {scrambleError}
          </p>
        )}
      </section>

      <section className="cube-stage" aria-label="Khối 3D">
        <CubeViewer
          className="practice-cube"
          setupAlg={result && scramble ? scramble : ''}
          alg={result ? solutionAlg : (scramble ?? '')}
          autoPlay={!result && scramble !== null}
          tempoScale={result ? 1 : SCRAMBLE_TEMPO}
          stickering={stickering}
          controllerRef={controller}
          onMoveIndexChange={result ? (index) => setPosition({ of: result, index }) : undefined}
          onPlayingChange={setPlaying}
        />
        {result && (
          <div className="player-controls" role="group" aria-label="Điều khiển lời giải">
            <button type="button" onClick={() => seek(0)} aria-label="Về đầu" title="Về đầu">
              ⏮
            </button>
            <button type="button" onClick={() => seek(current - 1)} aria-label="Lui 1 nước" title="Lui 1 nước (←)">
              ◀
            </button>
            <button type="button" className="primary" onClick={togglePlay} aria-label={playing ? 'Dừng' : 'Phát'} title="Phát/dừng (Space)">
              {playing ? '⏸' : '▶'}
            </button>
            <button type="button" onClick={() => seek(current + 1)} aria-label="Tới 1 nước" title="Tới 1 nước (→)">
              ▶❘
            </button>
            <button type="button" onClick={() => seek(moves.length)} aria-label="Đến cuối" title="Đến cuối">
              ⏭
            </button>
            <span className="move-counter">
              {current}/{moves.length}
            </span>
          </div>
        )}
      </section>

      <section className="panel solution-panel" aria-label="Lời giải CFOP" data-scroll-container>
        <h3>Lời giải CFOP</h3>
        {solver.status !== 'solving' && (
          <button type="button" className="primary" disabled={!scramble} onClick={() => scramble && solve(scramble)}>
            Giải theo CFOP
          </button>
        )}
        {!scramble && <p className="muted">Tạo hoặc dán một scramble để bắt đầu.</p>}
        {solver.status === 'solving' && (
          <div className="solving">
            <p>Đang tìm lời giải…</p>
            <button type="button" onClick={cancel}>
              Huỷ
            </button>
          </div>
        )}
        {solver.status === 'error' && (
          <p className="error" role="alert">
            {solver.message}
          </p>
        )}
        {result && (
          <>
            <p className="solution-summary">
              Tổng <strong>{result.totalMoves}</strong> nước (HTM, không tính xoay khối) · {Math.round(result.elapsedMs)} ms
            </p>
            {result.approximate && (
              <p className="muted">Hết thời gian tìm thứ tự cặp F2L tốt nhất; đây là lời giải tốt nhất tìm được.</p>
            )}
            <p className="muted">Phím tắt: ← → từng nước, ↑ ↓ từng chặng, Space phát/dừng.</p>
            <StepTimeline steps={result.steps} current={current} playing={playing} onSeek={seek} />
          </>
        )}
      </section>
    </div>
  )
}
