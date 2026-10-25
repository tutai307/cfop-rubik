import { useMemo, useState } from 'react'
import {
  CASES_BY_SET,
  CROSS_INTRO,
  CROSS_SITUATIONS,
  CROSS_TIPS,
  SOLVING_ORIENTATION,
  findCase,
  type AlgSet,
} from '../algorithms'
import { AlgCard } from '../components/AlgCard'
import { CaseModal } from '../components/CaseModal'
import type { Stickering } from '../components/CubeViewer'
import { formatAlg, invert, parseAlg } from '../cube'
import { LIBRARY_TABS, libraryHref, type LibraryTabId } from '../lib/library-routes'
import './LibraryPage.css'

const STICKERING: Record<AlgSet, Stickering> = {
  F2L: 'F2L',
  OLL: 'OLL',
  OLL2: 'OLL',
  PLL: 'PLL',
  PLL2: 'PLL',
}

const solvingSetup = (moves: string) => formatAlg([...parseAlg(SOLVING_ORIENTATION), ...parseAlg(moves)])

interface LibraryPageProps {
  /** Hash segments after the page id: `[tab, caseId]`. */
  path: string[]
}

export function LibraryPage({ path }: LibraryPageProps) {
  const [tabId, openId] = path
  const tab = LIBRARY_TABS.find((t) => t.id === tabId) ?? LIBRARY_TABS[0]

  return (
    <div className="library">
      <nav className="tabs" aria-label="Bộ công thức">
        {LIBRARY_TABS.map((t) => (
          <a key={t.id} href={libraryHref(t.id)} aria-current={t === tab ? 'page' : undefined}>
            {t.label}
            {'set' in t && <span className="tab-count">{CASES_BY_SET[t.set].length}</span>}
          </a>
        ))}
      </nav>
      {'set' in tab ? (
        <CaseGrid key={tab.id} tabId={tab.id} set={tab.set} openId={openId} />
      ) : (
        <CrossGuide openIndex={openId} />
      )}
    </div>
  )
}

function CaseGrid({ tabId, set, openId }: { tabId: LibraryTabId; set: AlgSet; openId?: string }) {
  const cases = CASES_BY_SET[set]
  const groups = useMemo(() => [...new Set(cases.map((c) => c.group))], [cases])
  const [group, setGroup] = useState('')
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLowerCase()
  const visible = cases.filter(
    (c) =>
      (!group || c.group === group) &&
      (!normalized || c.id.toLowerCase().includes(normalized) || c.name.toLowerCase().includes(normalized)),
  )
  const open = openId ? findCase(openId) : undefined

  return (
    <>
      <div className="filters">
        <label>
          Nhóm
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">Tất cả ({cases.length})</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tìm
          <input type="search" value={query} placeholder="Số hoặc tên ca" onChange={(e) => setQuery(e.target.value)} />
        </label>
        <span className="filters-count">{visible.length} ca</span>
      </div>
      <div className="case-grid">
        {visible.map((c) => (
          <AlgCard key={c.id} algCase={c} href={libraryHref(tabId, c.id)} />
        ))}
      </div>
      {visible.length === 0 && <p className="empty">Không có ca nào khớp bộ lọc.</p>}
      {open && open.set === set && (
        <CaseModal
          key={open.id}
          title={`${open.id} · ${open.name}`}
          setupAlg={solvingSetup(formatAlg(invert(open.alg)))}
          alg={open.alg}
          stickering={STICKERING[set]}
          onClose={() => (window.location.hash = libraryHref(tabId))}
        >
          {open.alternatives && <p className="muted">Thay thế: {open.alternatives.join(' · ')}</p>}
          {open.note && <p className="muted">{open.note}</p>}
        </CaseModal>
      )}
    </>
  )
}

function CrossGuide({ openIndex }: { openIndex?: string }) {
  const open = openIndex === undefined ? undefined : CROSS_SITUATIONS[Number(openIndex)]
  return (
    <article className="cross-guide">
      {CROSS_INTRO.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <h3>Bốn tình huống cạnh cơ bản</h3>
      <div className="cross-situations">
        {CROSS_SITUATIONS.map((s, i) => (
          <a key={s.title} className="cross-situation" href={libraryHref('cross', String(i))}>
            <strong>{s.title}</strong>
            <span>{s.description}</span>
            <code>{s.alg}</code>
          </a>
        ))}
      </div>
      <h3>Mẹo lên kế hoạch</h3>
      <ul>
        {CROSS_TIPS.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      {open && (
        <CaseModal
          title={open.title}
          setupAlg={solvingSetup(open.setup)}
          alg={open.alg}
          stickering="Cross"
          onClose={() => (window.location.hash = libraryHref('cross'))}
        >
          <p className="muted">{open.description}</p>
        </CaseModal>
      )}
    </article>
  )
}
