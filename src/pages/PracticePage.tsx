import { hrefFor } from '../lib/hash-route'
import type { TrainerStage } from '../trainer/stage-scramble'
import { SolverTab } from './practice/SolverTab'
import { TimerTab } from './practice/TimerTab'
import './PracticePage.css'
import './practice/TimerTab.css'

const PRACTICE_PAGE = 'luyen-tap'

const TABS = [
  { id: 'giai', label: 'Giải theo CFOP' },
  { id: 'bam-gio', label: 'Bấm giờ' },
  { id: 'tung-phan', label: 'Luyện từng phần' },
] as const

const STAGES: readonly { id: TrainerStage; label: string }[] = [
  { id: 'cross', label: 'Cross' },
  { id: 'f2l', label: 'F2L' },
  { id: 'oll', label: 'OLL' },
  { id: 'pll', label: 'PLL' },
]

interface PracticePageProps {
  /** Hash segments after the page id: `[tab, stage]`. */
  path: string[]
}

export function PracticePage({ path }: PracticePageProps) {
  const tab = TABS.find((t) => t.id === path[0]) ?? TABS[0]
  const stage = STAGES.find((s) => s.id === path[1]) ?? STAGES[0]

  return (
    <div className="practice-page">
      <nav className="tabs" aria-label="Luyện tập">
        {TABS.map((t) => (
          <a key={t.id} href={hrefFor(PRACTICE_PAGE, t.id)} aria-current={t === tab ? 'page' : undefined}>
            {t.label}
          </a>
        ))}
      </nav>
      {tab.id === 'giai' && <SolverTab />}
      {tab.id === 'bam-gio' && <TimerTab key="333" session="333" />}
      {tab.id === 'tung-phan' && (
        <>
          <nav className="stage-tabs" aria-label="Chặng luyện">
            {STAGES.map((s) => (
              <a
                key={s.id}
                className={`stage-${s.id}`}
                href={hrefFor(PRACTICE_PAGE, tab.id, s.id)}
                aria-current={s === stage ? 'page' : undefined}
              >
                {s.label}
              </a>
            ))}
          </nav>
          <TimerTab key={stage.id} session={stage.id} />
        </>
      )}
    </div>
  )
}
