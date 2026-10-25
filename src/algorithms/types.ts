export type AlgSet = 'F2L' | 'OLL' | 'PLL' | 'OLL2' | 'PLL2'

export interface AlgCase {
  /** Unique id shown to users, e.g. `OLL 21`, `PLL Ua`, `F2L 7`. */
  readonly id: string
  readonly set: AlgSet
  readonly group: string
  readonly name: string
  readonly alg: string
  readonly alternatives?: readonly string[]
  readonly note?: string
}

/** Builds cases of one set; the id is `${set label} ${key}`. */
export function defineCases(
  set: AlgSet,
  label: string,
  rows: readonly (readonly [key: string | number, group: string, name: string, alg: string, alternatives?: readonly string[], note?: string])[],
): AlgCase[] {
  return rows.map(([key, group, name, alg, alternatives, note]) => ({
    id: `${label} ${key}`,
    set,
    group,
    name,
    alg,
    ...(alternatives && alternatives.length > 0 ? { alternatives } : {}),
    ...(note ? { note } : {}),
  }))
}
