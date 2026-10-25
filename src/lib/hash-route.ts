import { useSyncExternalStore } from 'react'

// Navigation lives in the URL hash (`#/thu-vien/oll`), no router dependency.

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

const getHash = () => window.location.hash

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/** Path segments of the current hash, e.g. `#/thu-vien/oll` → ['thu-vien', 'oll']. */
export function useHashPath(): string[] {
  const hash = useSyncExternalStore(subscribe, getHash)
  return hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(safeDecode)
}

export function hrefFor(...segments: string[]): string {
  return `#/${segments.map(encodeURIComponent).join('/')}`
}
