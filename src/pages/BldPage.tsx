import { useState } from 'react'
import { hrefFor } from '../lib/hash-route'
import { BlindTab } from './bld/BlindTab'
import { GuideTab } from './bld/GuideTab'
import { LettersTab } from './bld/LettersTab'
import { MemoTab } from './bld/MemoTab'
import { ScrambleBar } from './bld/ScrambleBar'
import './BldPage.css'

const BLD_PAGE = 'bld'

const TABS = [
  { id: 'tai-lieu', label: 'Tài liệu OP' },
  { id: 'bang-chu', label: 'Bảng chữ cái' },
  { id: 'memo', label: 'Luyện memo' },
  { id: 'bit-mat', label: 'Bịt mắt' },
] as const

interface BldPageProps {
  /** Hash segments after the page id: `[tab]`. */
  path: string[]
}

export function BldPage({ path }: BldPageProps) {
  const tab = TABS.find((t) => t.id === path[0]) ?? TABS[0]
  // Shared by the memo and blindfold tabs so you can memo, then solve the same scramble.
  const [scramble, setScramble] = useState<string | null>(null)

  return (
    <div className="bld">
      <nav className="tabs" aria-label="BLD">
        {TABS.map((t) => (
          <a key={t.id} href={hrefFor(BLD_PAGE, t.id)} aria-current={t === tab ? 'page' : undefined}>
            {t.label}
          </a>
        ))}
      </nav>
      {(tab.id === 'memo' || tab.id === 'bit-mat') && <ScrambleBar scramble={scramble} onChange={setScramble} />}
      {tab.id === 'tai-lieu' && <GuideTab />}
      {tab.id === 'bang-chu' && <LettersTab />}
      {tab.id === 'memo' && <MemoTab scramble={scramble} />}
      {tab.id === 'bit-mat' && <BlindTab scramble={scramble} />}
    </div>
  )
}
