import { useMemo, useState } from 'react'
import { averageSeries, formatSolve, formatTime, type Penalty, type Solve } from '../timer/stats'

const PENALTY_OPTIONS: readonly [Penalty, string][] = [
  ['none', 'OK'],
  ['+2', '+2'],
  ['DNF', 'DNF'],
]

const DATE_FORMAT = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' })

interface SolveListProps {
  solves: readonly Solve[]
  onPenalty: (id: string, penalty: Penalty) => void
  onRemove: (id: string) => void
  /** Opens the solve's scramble on the 3D review cube. */
  onReview: (id: string) => void
}

/** Newest first; a row opens to show its scramble and edit the penalty. */
export function SolveList({ solves, onPenalty, onRemove, onReview }: SolveListProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const ao5 = useMemo(() => averageSeries(solves, 5), [solves])

  if (solves.length === 0) return <p className="muted">Chưa có lần giải nào.</p>

  return (
    <ol className="solve-list" reversed>
      {solves
        .map((solve, i) => ({ solve, i }))
        .reverse()
        .map(({ solve, i }) => {
          const open = openId === solve.id
          return (
            <li key={solve.id} className="solve-row" data-open={open || undefined}>
              <button
                type="button"
                className="solve-summary"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : solve.id)}
              >
                <span className="solve-index">{i + 1}</span>
                <span className="solve-time">{formatSolve(solve)}</span>
                <span className="solve-ao5">ao5 {formatTime(ao5[i])}</span>
              </button>
              {open && (
                <div className="solve-detail">
                  {solve.caseId && <p className="muted">Ca: {solve.caseId}</p>}
                  <p className="alg-text">{solve.scramble || '(không có scramble)'}</p>
                  <p className="muted">{DATE_FORMAT.format(solve.at)}</p>
                  <button type="button" className="primary" onClick={() => onReview(solve.id)}>
                    Xem lời giải trên khối 3D
                  </button>
                  <div className="button-row">
                    {PENALTY_OPTIONS.map(([penalty, label]) => (
                      <button
                        key={penalty}
                        type="button"
                        aria-pressed={solve.penalty === penalty}
                        onClick={() => onPenalty(solve.id, penalty)}
                      >
                        {label}
                      </button>
                    ))}
                    <button type="button" className="danger" onClick={() => onRemove(solve.id)}>
                      Xoá
                    </button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
    </ol>
  )
}
