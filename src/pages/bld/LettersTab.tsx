import { useEffect, useRef, useState } from 'react'
import { LETTERS, stickerOf, type PieceKind } from '../../bld/speffz'
import { CubeNet } from '../../components/CubeNet'
import { solvedFacelets } from '../../cube'

type Mode = PieceKind | 'both'

interface Question {
  kind: PieceKind
  letter: string
}

const SOLVED = solvedFacelets()

function randomQuestion(mode: Mode, previous?: Question): Question {
  for (;;) {
    const kind: PieceKind = mode === 'both' ? (Math.random() < 0.5 ? 'corner' : 'edge') : mode
    const letter = LETTERS[Math.floor(Math.random() * LETTERS.length)]
    if (!previous || previous.kind !== kind || previous.letter !== letter) return { kind, letter }
  }
}

export function LettersTab() {
  const [mode, setMode] = useState<Mode>('both')
  const [question, setQuestion] = useState<Question>(() => randomQuestion('both'))
  const [answer, setAnswer] = useState<{ given: string; correct: boolean } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef(0)
  const modeRef = useRef(mode)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const next = (nextMode = modeRef.current) => {
    clearTimeout(timerRef.current)
    modeRef.current = nextMode
    setQuestion((q) => randomQuestion(nextMode, q))
    setAnswer(null)
    inputRef.current?.focus()
  }

  const submit = (given: string) => {
    const letter = given.toUpperCase()
    if (!LETTERS.includes(letter) || answer) return
    const correct = letter === question.letter
    setAnswer({ given: letter, correct })
    if (correct) timerRef.current = window.setTimeout(() => next(), 600)
  }

  return (
    <div className="bld-letters">
      <fieldset className="segmented">
        <legend>Luyện chữ cho</legend>
        {(
          [
            ['both', 'Cả hai'],
            ['corner', 'Góc'],
            ['edge', 'Cạnh'],
          ] as const
        ).map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name="letter-mode"
              checked={mode === value}
              onChange={() => {
                setMode(value)
                next(value)
              }}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <p className="bld-question">
        Sticker <strong>{question.kind === 'corner' ? 'góc' : 'cạnh'}</strong> được tô viền có chữ gì?
      </p>
      <CubeNet
        className="bld-letters-net"
        state={SOLVED}
        highlight={stickerOf(question.kind, question.letter)}
        label={`Sticker ${question.kind === 'corner' ? 'góc' : 'cạnh'} cần đoán chữ`}
      />
      <div className="button-row">
        <input
          ref={inputRef}
          className="letter-input"
          aria-label="Chữ cái"
          maxLength={1}
          value={answer?.given ?? ''}
          onChange={(e) => submit(e.target.value)}
          autoFocus
        />
        {answer && !answer.correct && (
          <button type="button" className="primary" onClick={() => next()}>
            Tiếp
          </button>
        )}
      </div>
      <p className="bld-feedback" role="status">
        {answer?.correct && 'Đúng!'}
        {answer && !answer.correct && (
          <>
            Chưa đúng: đây là <strong>{question.letter}</strong>, bạn gõ {answer.given}.
          </>
        )}
      </p>
    </div>
  )
}
