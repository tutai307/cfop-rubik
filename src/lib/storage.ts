import { useCallback, useSyncExternalStore } from 'react'

// Everything the app remembers lives in localStorage under this prefix. Storage can be
// missing or full (private mode, quota), so reads fall back and writes keep the value in
// memory for the rest of the visit.

const PREFIX = 'cfop-rubik.'
const memory = new Map<string, unknown>()
const listeners = new Set<() => void>()

function read<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
  if (memory.has(key)) return memory.get(key) as T
  let value: T = fallback
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw)
      if (isValid(parsed)) value = parsed
    }
  } catch {
    // Unreadable or blocked storage: start from the fallback.
  }
  memory.set(key, value)
  return value
}

function write(key: string, value: unknown) {
  memory.set(key, value)
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Kept in memory only.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** State persisted in localStorage and shared by every component using the same key. */
export function useStoredState<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): [T, (next: T | ((current: T) => T)) => void] {
  const value = useSyncExternalStore(subscribe, () => read(key, fallback, isValid))
  const setValue = useCallback(
    (next: T | ((current: T) => T)) => {
      const current = read(key, fallback, isValid)
      write(key, typeof next === 'function' ? (next as (current: T) => T)(current) : next)
    },
    [key, fallback, isValid],
  )
  return [value, setValue]
}
