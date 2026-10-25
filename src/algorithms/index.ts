import { F2L } from './f2l'
import { OLL } from './oll'
import { PLL } from './pll'
import { OLL2, PLL2 } from './two-look'
import type { AlgCase, AlgSet } from './types'

export * from './types'
export * from './case-state'
export * from './recognize'
export * from './cross-guide'
export { F2L, OLL, PLL, OLL2, PLL2 }

export const CASES_BY_SET: Record<AlgSet, readonly AlgCase[]> = { F2L, OLL, PLL, OLL2, PLL2 }

const BY_ID = new Map(Object.values(CASES_BY_SET).flat().map((c) => [c.id, c]))

export function findCase(id: string): AlgCase | undefined {
  return BY_ID.get(id)
}
