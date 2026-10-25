import { useEffect, useMemo, useRef, useState } from 'react'
import { pairUp, solveOp, stepMoves, type OpStep } from '../../bld/op'
import { CubeViewer, type CubeController } from '../../components/CubeViewer'
import { parseAlg, stateOf } from '../../cube'

interface BlindTabProps {
  scramble: string | null
}

export function BlindTab({ scramble }: BlindTabProps) {
  return scramble ? (
    <BlindSession key={scramble} scramble={scramble} />
  ) : (
    <p className="muted">Tạo hoặc dán một scramble, tự memo trên khối thật, rồi bắt đầu bịt mắt.</p>
  )
}

const stepTitle = (step: OpStep) =>
  step.kind === 'parity' ? 'Parity' : `${step.kind === 'edge' ? 'Cạnh' : 'Góc'} ${step.letter}`

function BlindSession({ scramble }: { scramble: string }) {
  const solution = useMemo(() => solveOp(stateOf(scramble)), [scramble])
  const algs = useMemo(() => solution.steps.map(stepMoves), [solution])
  /** Move index at the end of each step. */
  const ends = useMemo(
    () => algs.reduce<number[]>((acc, alg) => [...acc, (acc.at(-1) ?? 0) + parseAlg(alg).length], []),
    [algs],
  )
  const [blind, setBlind] = useState(false)
  const [done, setDone] = useState(0)
  // Hidden by default: you are meant to work from your own memo.
  const [hints, setHints] = useState(false)
  const controller = useRef<CubeController>(null)
  const total = solution.steps.length

  const goTo = (steps: number) => {
    const clamped = Math.max(0, Math.min(steps, total))
    setDone(clamped)
    void controller.current?.goToMove(clamped === 0 ? 0 : ends[clamped - 1])
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.altKey || event.ctrlKey || event.metaKey || target.isContentEditable) return
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === 'ArrowRight') goTo(done + 1)
      else if (event.key === 'ArrowLeft') goTo(done - 1)
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const step = solution.steps[done]

  return (
    <div className="bld-blind">
      <div className="bld-blind-cube">
        <CubeViewer className="bld-cube" setupAlg={scramble} alg={algs.join(' ')} controllerRef={controller} />
        {blind && (
          <div className="blindfold" aria-live="polite">
            <span aria-hidden="true">🙈</span>
            <p>Đang bịt mắt</p>
          </div>
        )}
      </div>

      <div className="panel bld-blind-panel">
        <label className="hint-toggle">
          <input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} />
          Hiện gợi ý (memo và thuật toán từng lượt)
        </label>
        {hints && (
          <p className="muted">
            Memo: cạnh <code>{pairUp(solution.edges) || '—'}</code> · góc <code>{pairUp(solution.corners) || '—'}</code>
            {solution.parity && ' · có parity'}
          </p>
        )}
        <div className="button-row">
          {blind ? (
            <button type="button" className="primary" onClick={() => setBlind(false)}>
              Mở mắt
            </button>
          ) : (
            <button type="button" className="primary" onClick={() => {
              setBlind(true)
              goTo(0)
            }}>
              Bắt đầu bịt mắt
            </button>
          )}
          <button type="button" onClick={() => goTo(done - 1)} disabled={done === 0}>
            ◀ Bước trước
          </button>
          <button type="button" onClick={() => goTo(done + 1)} disabled={done === total}>
            Xong bước này ▶
          </button>
          <span className="move-counter">
            {done}/{total}
          </span>
        </div>

        {step && !hints ? (
          <p className="bld-step" aria-live="polite">
            Bước {done + 1}/{total}: làm lượt tiếp theo trong memo của bạn rồi bấm "Xong bước này".
          </p>
        ) : step ? (
          <div className="bld-step" aria-live="polite">
            <h4>
              Bước {done + 1}: {stepTitle(step)}
            </h4>
            {step.kind === 'parity' ? (
              <p className="alg-text">{step.alg}</p>
            ) : (
              <dl>
                <dt>Setup</dt>
                <dd>
                  <code>{step.setup || '(không cần)'}</code>
                </dd>
                <dt>{step.kind === 'edge' ? 'T-perm' : 'Đổi góc'}</dt>
                <dd>
                  <code>{step.alg}</code>
                </dd>
                <dt>Undo</dt>
                <dd>
                  <code>{step.undo || '(không cần)'}</code>
                </dd>
              </dl>
            )}
          </div>
        ) : (
          <p className="bld-finished" role="status">
            {total === 0
              ? 'Khối đã giải sẵn, không cần lượt nào.'
              : blind
                ? 'Đã làm hết các lượt. Mở mắt để kiểm tra!'
                : 'Hoàn thành: khối đã về trạng thái giải.'}
          </p>
        )}

        <ol className="bld-step-list">
          {solution.steps.map((s, i) => (
            <li key={i} data-done={i < done || undefined} aria-current={i === done ? 'step' : undefined}>
              <button type="button" onClick={() => goTo(i)}>
                {hints ? stepTitle(s) : i + 1}
              </button>
            </li>
          ))}
        </ol>
        <p className="muted">Phím ← → để lùi/tới từng lượt. Khối 3D đi theo từng lượt phía sau tấm che.</p>
      </div>
    </div>
  )
}
