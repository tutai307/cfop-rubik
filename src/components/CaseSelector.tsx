import { CASES_BY_SET, type AlgCase } from '../algorithms'
import { CaseDiagram } from './CaseDiagram'

interface CaseSelectorProps {
  set: 'OLL' | 'PLL'
  /** Chosen case ids; empty means every case at its natural frequency. */
  selected: readonly string[]
  onChange: (ids: string[]) => void
}

function groupCases(cases: readonly AlgCase[]): [string, AlgCase[]][] {
  const groups = new Map<string, AlgCase[]>()
  for (const c of cases) groups.set(c.group, [...(groups.get(c.group) ?? []), c])
  return [...groups]
}

export function CaseSelector({ set, selected, onChange }: CaseSelectorProps) {
  const cases = CASES_BY_SET[set]
  const chosen = new Set(selected)
  const toggle = (ids: string[], on: boolean) =>
    onChange(cases.map((c) => c.id).filter((id) => (ids.includes(id) ? on : chosen.has(id))))

  return (
    <details className="case-selector">
      <summary>
        Chọn ca {set}:{' '}
        <strong>{chosen.size === 0 ? 'ngẫu nhiên tất cả' : `${chosen.size}/${cases.length} ca`}</strong>
      </summary>
      <p className="muted">
        Không chọn ca nào thì scramble là trạng thái ngẫu nhiên thật, mỗi ca xuất hiện theo đúng xác suất khi giải.
        Chọn một số ca thì mỗi ca được chọn ra đều nhau.
      </p>
      <div className="button-row">
        <button type="button" onClick={() => onChange([])} disabled={chosen.size === 0}>
          Bỏ chọn hết
        </button>
      </div>
      {groupCases(cases).map(([group, groupCases]) => {
        const ids = groupCases.map((c) => c.id)
        const all = ids.every((id) => chosen.has(id))
        return (
          <fieldset key={group} className="case-group">
            <legend>
              <label>
                <input type="checkbox" checked={all} onChange={() => toggle(ids, !all)} /> {group}
              </label>
            </legend>
            <div className="case-grid">
              {groupCases.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="case-toggle"
                  aria-pressed={chosen.has(c.id)}
                  onClick={() => toggle([c.id], !chosen.has(c.id))}
                >
                  <CaseDiagram algCase={c} size={56} />
                  <span>{c.id.replace(`${set} `, '')}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )
      })}
    </details>
  )
}
