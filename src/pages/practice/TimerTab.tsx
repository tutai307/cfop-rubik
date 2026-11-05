import { useCallback, useEffect, useMemo, useState } from 'react'
import { CASES_BY_SET } from '../../algorithms'
import { CaseSelector } from '../../components/CaseSelector'
import { CubeNet } from '../../components/CubeNet'
import { SolveList } from '../../components/SolveList'
import { SolveStats } from '../../components/SolveStats'
import { StageReference } from '../../components/StageReference'
import { TimeChart } from '../../components/TimeChart'
import { stateOf } from '../../cube'
import { useStoredState } from '../../lib/storage'
import { generateScramble } from '../../lib/scramble'
import { generateStageScramble, type StageScramble } from '../../trainer/stage-scramble'
import { formatSolve, formatTime } from '../../timer/stats'
import { INSPECTION_DNF_MS, INSPECTION_MS, type Finished } from '../../timer/timer-machine'
import { useSolves, type TimerSession } from '../../timer/useSolves'
import { useTimer } from '../../timer/useTimer'

const SESSION_INFO: Record<TimerSession, { title: string; task: string }> = {
  '333': { title: 'Bấm giờ cả khối', task: 'Giải cả khối.' },
  cross: { title: 'Luyện Cross', task: 'Khối ngẫu nhiên: chỉ giải cross trắng rồi dừng đồng hồ.' },
  f2l: { title: 'Luyện F2L', task: 'Cross đã xong sẵn: giải 4 cặp F2L rồi dừng đồng hồ.' },
  oll: { title: 'Luyện OLL', task: 'F2L đã xong sẵn: định hướng tầng cuối (mặt vàng) rồi dừng đồng hồ.' },
  pll: { title: 'Luyện PLL', task: 'Mặt vàng đã xong sẵn: hoán vị tầng cuối rồi dừng đồng hồ.' },
}

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === 'string')
const NO_CASES: string[] = []

interface TimerTabProps {
  session: TimerSession
}

export function TimerTab({ session }: TimerTabProps) {
  const info = SESSION_INFO[session]
  const caseSet = session === 'oll' ? 'OLL' : session === 'pll' ? 'PLL' : null
  const { solves, add, setPenalty, remove, clear } = useSolves(session)
  const [inspection, setInspection] = useStoredState('timer.inspection', false, isBoolean)
  const [caseIds, setCaseIds] = useStoredState(`cases.${caseSet ?? 'none'}`, NO_CASES, isStringList)
  const cases = useMemo(
    () => (caseSet ? CASES_BY_SET[caseSet].filter((c) => caseIds.includes(c.id)) : []),
    [caseSet, caseIds],
  )

  // A scramble belongs to the request (and case selection) it was made for; until the
  // latest one arrives there is no current scramble, so a slow result never replaces a newer one.
  const [request, setRequest] = useState(0)
  const [generated, setGenerated] = useState<{ token: string; scramble?: StageScramble; error?: string }>()
  const token = `${request}|${caseIds.join(',')}`
  const current = generated?.token === token ? (generated.scramble ?? null) : null
  const error = generated?.token === token ? (generated.error ?? null) : null
  const nextScramble = useCallback(() => setRequest((r) => r + 1), [])

  useEffect(() => {
    const generate = session === '333' ? async () => ({ scramble: await generateScramble() }) : () => generateStageScramble(session, cases)
    let stale = false
    generate().then(
      (scramble) => stale || setGenerated({ token, scramble }),
      () => stale || setGenerated({ token, error: 'Không tạo được scramble. Hãy thử lại.' }),
    )
    return () => {
      stale = true
    }
  }, [session, cases, token])

  const onFinish = useCallback(
    ({ time, penalty }: Finished) => {
      if (!current) return
      add({ time, penalty, scramble: current.scramble, ...(current.caseId ? { caseId: current.caseId } : {}) })
      nextScramble()
    },
    [add, current, nextScramble],
  )

  const { phase, elapsed, inspected, areaRef } = useTimer({ inspection, enabled: current !== null, onFinish })
  const running = phase === 'running'
  const last = solves.at(-1)

  let display: string
  if (running) display = formatTime(elapsed)
  else if (inspected !== null) {
    const t = inspected
    display = t > INSPECTION_DNF_MS ? 'DNF' : t > INSPECTION_MS ? '+2' : String(Math.ceil((INSPECTION_MS - t) / 1000))
  } else display = phase === 'idle' && last ? formatSolve(last) : formatTime(0)

  const preview = useMemo(() => (current ? stateOf(current.scramble) : null), [current])

  return (
    <div className="trainer" data-running={running || undefined}>
      <section className="panel trainer-scramble hide-while-running" aria-label="Scramble">
        <div className="trainer-head">
          <h3>{info.title}</h3>
          <button type="button" onClick={nextScramble} disabled={!current && !error}>
            Scramble mới
          </button>
        </div>
        <p className="muted">
          {info.task} Scramble cầm trắng trên, xanh lá trước như WCA
          {session === '333' ? '.' : '; sau đó lật trắng xuống đáy (z2).'}
        </p>
        {current ? (
          <p className="scramble-text">{current.scramble}</p>
        ) : error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : (
          <p className="scramble-text muted">Đang tạo scramble…</p>
        )}
        {preview && <CubeNet state={preview} label="Khối sau khi làm theo scramble" className="trainer-net" />}
        {caseSet && <CaseSelector set={caseSet} selected={caseIds} onChange={setCaseIds} />}
      </section>

      <section className="timer-stage" aria-label="Đồng hồ">
        <div
          ref={areaRef}
          className="timer-display"
          data-phase={phase}
          data-inspecting={inspected !== null || undefined}
          role="timer"
          aria-live="off"
        >
          {display}
        </div>
        <p className="muted timer-hint hide-while-running">
          {inspection
            ? 'Bấm Space (hoặc chạm đồng hồ) để bắt đầu 15 giây quan sát, giữ đến khi số chuyển xanh rồi thả để bắt đầu giải.'
            : 'Giữ Space (hoặc chạm giữ đồng hồ) đến khi số chuyển xanh, thả ra để bắt đầu.'}{' '}
          Phím bất kỳ hoặc chạm màn hình để dừng. Esc huỷ quan sát.
        </p>
        <label className="toggle hide-while-running">
          <input type="checkbox" checked={inspection} onChange={(e) => setInspection(e.target.checked)} />
          Quan sát 15 giây (WCA: quá 15 giây +2, quá 17 giây DNF)
        </label>
        {last && phase === 'idle' && (
          <div className="last-solve hide-while-running">
            <div className="button-row" role="group" aria-label="Phạt lần vừa giải">
              <button type="button" aria-pressed={last.penalty === 'none'} onClick={() => setPenalty(last.id, 'none')}>
                OK
              </button>
              <button type="button" aria-pressed={last.penalty === '+2'} onClick={() => setPenalty(last.id, '+2')}>
                +2
              </button>
              <button type="button" aria-pressed={last.penalty === 'DNF'} onClick={() => setPenalty(last.id, 'DNF')}>
                DNF
              </button>
              <button type="button" className="danger" onClick={() => remove(last.id)}>
                Xoá
              </button>
            </div>
            <details>
              <summary>Lời giải tham khảo cho lần vừa rồi{last.caseId ? ` (${last.caseId})` : ''}</summary>
              <p className="alg-text">{last.scramble}</p>
              <StageReference scramble={last.scramble} session={session} />
            </details>
          </div>
        )}
      </section>

      <section className="panel trainer-stats hide-while-running" aria-label="Thống kê">
        <div className="trainer-head">
          <h3>Thống kê</h3>
          <button
            type="button"
            className="danger"
            disabled={solves.length === 0}
            onClick={() => {
              if (window.confirm(`Xoá toàn bộ ${solves.length} lần giải của "${info.title}"?`)) clear()
            }}
          >
            Xoá phiên
          </button>
        </div>
        <SolveStats solves={solves} />
        <TimeChart solves={solves} />
        <h4>Các lần giải</h4>
        <SolveList solves={solves} onPenalty={setPenalty} onRemove={remove} />
      </section>
    </div>
  )
}
