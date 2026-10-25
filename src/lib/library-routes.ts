import type { AlgSet } from '../algorithms'
import { hrefFor } from './hash-route'

export const LIBRARY_PAGE = 'thu-vien'

export const LIBRARY_TABS = [
  { id: 'cross', label: 'Cross' },
  { id: 'f2l', label: 'F2L', set: 'F2L' },
  { id: 'oll', label: 'OLL', set: 'OLL' },
  { id: 'pll', label: 'PLL', set: 'PLL' },
  { id: 'oll-2-look', label: '2-look OLL', set: 'OLL2' },
  { id: 'pll-2-look', label: '2-look PLL', set: 'PLL2' },
] as const satisfies readonly { id: string; label: string; set?: AlgSet }[]

export type LibraryTabId = (typeof LIBRARY_TABS)[number]['id']

export function libraryHref(tab: LibraryTabId, caseId?: string): string {
  return caseId ? hrefFor(LIBRARY_PAGE, tab, caseId) : hrefFor(LIBRARY_PAGE, tab)
}

export function caseHref(set: AlgSet, caseId: string): string {
  const tab = LIBRARY_TABS.find((t) => 'set' in t && t.set === set)!
  return libraryHref(tab.id, caseId)
}
