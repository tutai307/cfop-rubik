import { useCallback, useState } from 'react'
import { CubeViewer } from '../../components/CubeViewer'
import { PlayerControls } from '../../components/PlayerControls'
import { StepTimeline } from '../../components/StepTimeline'
import { useSolutionPlayback } from '../../hooks/useSolutionPlayback'
import { useSolver } from '../../hooks/useSolver'
import { generateScramble, parseScramble } from '../../lib/scramble'

/** A new scramble plays from solved at this speed, faster than a solution. */
const SCRAMBLE_TEMPO = 2.5

export function SolverTab() {
  const [scramble, setScramble] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [scrambleError, setScrambleError] = useState<string | null>(null)
  const [pasted, setPasted] = useState('')
  const [copied, setCopied] = useState(false)
  const { state: solver, solve, cancel } = useSolver()

  const result = solver.status === 'done' ? solver.result : null
  const playback = useSolutionPlayback(result?.steps ?? null, { spaceToPlay: true })
  const { controller, current, playing, seek } = playback

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
          alg={result ? playback.solutionAlg : (scramble ?? '')}
          autoPlay={!result && scramble !== null}
          tempoScale={result ? 1 : SCRAMBLE_TEMPO}
          stickering={playback.stickering}
          controllerRef={controller}
          onMoveIndexChange={result ? playback.onMoveIndexChange : undefined}
          onPlayingChange={playback.setPlaying}
        />
        {result && <PlayerControls {...playback} />}
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
