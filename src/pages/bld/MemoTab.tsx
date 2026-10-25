import { useMemo, useState } from 'react'
import { memoSolves, pairUp, traceMemo } from '../../bld/op'
import type { PieceKind } from '../../bld/speffz'
import { CubeNet } from '../../components/CubeNet'
import { stateOf } from '../../cube'

const toLetters = (text: string) => [...text.toUpperCase().replace(/[^A-Z]/g, '')]

interface MemoTabProps {
  scramble: string | null
}

export function MemoTab({ scramble }: MemoTabProps) {
  // Reset answers whenever the scramble changes.
  return scramble ? <MemoQuiz key={scramble} scramble={scramble} /> : <p className="muted">Tạo hoặc dán một scramble để bắt đầu memo.</p>
}

function MemoQuiz({ scramble }: { scramble: string }) {
  const state = useMemo(() => stateOf(scramble), [scramble])
  const reference = useMemo(() => ({ edge: traceMemo(state, 'edge'), corner: traceMemo(state, 'corner') }), [state])
  const [input, setInput] = useState<Record<PieceKind, string>>({ edge: '', corner: '' })
  const [checked, setChecked] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const result = (kind: PieceKind) => memoSolves(state, kind, toLetters(input[kind]))
  const field = (kind: PieceKind, label: string) => (
    <div className="memo-field">
      <label htmlFor={`memo-${kind}`}>{label}</label>
      <input
        id={`memo-${kind}`}
        aria-describedby={`memo-${kind}-result`}
        value={input[kind]}
        placeholder="VD: AC JK P"
        autoComplete="off"
        onChange={(e) => {
          setInput({ ...input, [kind]: e.target.value })
          setChecked(false)
        }}
      />
      <span id={`memo-${kind}-result`} role="status" className={checked ? (result(kind) ? 'ok' : 'error') : undefined}>
        {checked && (result(kind) ? 'Đúng: memo này giải được hết' : 'Chưa đúng') + (kind === 'edge' ? ' cạnh' : ' góc')}
      </span>
    </div>
  )

  return (
    <div className="bld-memo">
      <CubeNet className="bld-memo-net" state={state} label="Khối sau scramble, trắng trên, xanh lá trước" />
      <form
        className="memo-form"
        onSubmit={(e) => {
          e.preventDefault()
          setChecked(true)
          setRevealed(true) // show the app's memo next to the grade
        }}
      >
        {field('edge', 'Memo cạnh (buffer B)')}
        {field('corner', 'Memo góc (buffer A)')}
        <div className="button-row">
          <button type="submit" className="primary">
            Chấm
          </button>
          <button type="button" onClick={() => setRevealed((r) => !r)}>
            {revealed ? 'Ẩn đáp án' : 'Xem đáp án'}
          </button>
        </div>
        <p className="muted">
          Chấm bằng cách mô phỏng từng lượt đổi chỗ, nên mọi cách cycle break hợp lệ đều được tính đúng.
        </p>
      </form>
      {revealed && (
        <div className="memo-answer">
          <p>
            Cạnh ({reference.edge.length} chữ): <code>{pairUp(reference.edge) || '— (đã xong)'}</code>
          </p>
          <p>
            Góc ({reference.corner.length} chữ): <code>{pairUp(reference.corner) || '— (đã xong)'}</code>
          </p>
          <p className="muted">
            {reference.edge.length % 2 === 1 ? 'Có parity: số chữ cạnh lẻ.' : 'Không có parity.'} Cycle break chọn chữ nhỏ nhất chưa xong.
          </p>
        </div>
      )}
    </div>
  )
}
