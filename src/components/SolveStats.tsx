import { bestAverage, bestSingle, currentAverage, effectiveTime, formatTime, meanTime, type Solve } from '../timer/stats'

const AVERAGES = [5, 12, 100] as const

interface SolveStatsProps {
  solves: readonly Solve[]
}

export function SolveStats({ solves }: SolveStatsProps) {
  const last = solves.at(-1)
  const rows = [
    { label: 'Single', current: last ? effectiveTime(last) : null, best: bestSingle(solves) },
    ...AVERAGES.map((n) => ({ label: `ao${n}`, current: currentAverage(solves, n), best: bestAverage(solves, n) })),
  ]
  const finished = solves.filter((s) => s.penalty !== 'DNF').length

  return (
    <div className="solve-stats">
      <table>
        <thead>
          <tr>
            <th scope="col" />
            <th scope="col">Hiện tại</th>
            <th scope="col">Tốt nhất</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{formatTime(row.current)}</td>
              <td>{formatTime(row.best)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">
        Trung bình (mean): {formatTime(meanTime(solves))} · Đã giải {finished}/{solves.length}
      </p>
    </div>
  )
}
