import { useRef, useState } from 'react'
import { hasParity } from '../../bld/op'
import { stateOf } from '../../cube'
import { generateScramble, parseScramble } from '../../lib/scramble'

type ParityChoice = 'any' | 'parity' | 'no-parity'

const PARITY_OPTIONS: readonly [ParityChoice, string][] = [
  ['any', 'Bất kỳ'],
  ['parity', 'Có parity'],
  ['no-parity', 'Không parity'],
]

/** About half of random states have parity, so 30 tries fail with probability ~1e-9. */
const MAX_TRIES = 30

interface ScrambleBarProps {
  scramble: string | null
  onChange: (scramble: string) => void
}

export function ScrambleBar({ scramble, onChange }: ScrambleBarProps) {
  const [generating, setGenerating] = useState(false)
  const [pasted, setPasted] = useState('')
  const [parity, setParity] = useState<ParityChoice>('any')
  const [error, setError] = useState<string | null>(null)
  /** Bumped on every new scramble so a slow generation cannot replace a newer paste. */
  const requestRef = useRef(0)

  const generate = async () => {
    const request = ++requestRef.current
    setGenerating(true)
    setError(null)
    try {
      // Still random-state: rejecting the unwanted half keeps the rest uniform.
      for (let tries = 0; tries < MAX_TRIES; tries++) {
        const candidate = await generateScramble()
        if (request !== requestRef.current) return
        if (parity === 'any' || hasParity(stateOf(candidate)) === (parity === 'parity')) {
          onChange(candidate)
          return
        }
      }
      setError('Không tìm được scramble đúng yêu cầu parity. Hãy thử lại.')
    } catch {
      setError('Không tạo được scramble. Hãy thử lại.')
    } finally {
      if (request === requestRef.current) setGenerating(false)
    }
  }

  const applyPasted = () => {
    try {
      const next = parseScramble(pasted)
      requestRef.current++
      setGenerating(false)
      onChange(next)
      setPasted('')
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scramble không hợp lệ.')
    }
  }

  return (
    <div className="scramble-bar">
      <div className="button-row">
        <button type="button" className="primary" onClick={generate} disabled={generating}>
          {generating ? 'Đang tạo…' : 'Tạo scramble'}
        </button>
        <label className="parity-select">
          Parity
          <select value={parity} onChange={(e) => setParity(e.target.value as ParityChoice)}>
            {PARITY_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="button-row">
        <input
          aria-label="Dán scramble"
          value={pasted}
          placeholder="hoặc dán scramble…"
          onChange={(e) => setPasted(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && pasted.trim() && applyPasted()}
        />
        <button type="button" onClick={applyPasted} disabled={!pasted.trim()}>
          Dùng
        </button>
      </div>
      {scramble && <p className="scramble-text">{scramble}</p>}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
