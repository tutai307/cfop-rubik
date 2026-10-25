import { useMemo } from 'react'
import { BLD_INTRO, BLD_SECTIONS, BLD_TIPS } from '../../bld/guide'
import { SETUPS, bufferLetters } from '../../bld/op'
import { CORNER_STICKER, EDGE_STICKER, type PieceKind } from '../../bld/speffz'
import { CubeNet } from '../../components/CubeNet'
import { solvedFacelets } from '../../cube'

const SOLVED = solvedFacelets()

const labelsOf = (letters: Map<string, number>) => new Map([...letters].map(([letter, sticker]) => [sticker, letter]))

function SetupTable({ kind }: { kind: PieceKind }) {
  const rows = [...SETUPS[kind].values()]
  return (
    <div className="table-wrap">
      <table className="setup-table">
        <caption>
          Setup {kind === 'edge' ? 'cạnh' : 'góc'} (buffer {bufferLetters(kind).join('/')} không có setup)
        </caption>
        <thead>
          <tr>
            <th scope="col">Chữ</th>
            <th scope="col">Setup</th>
            <th scope="col">Undo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.letter}>
              <th scope="row">{r.letter}</th>
              <td>
                <code>{r.setup || '—'}</code>
              </td>
              <td>
                <code>{r.undo || '—'}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function GuideTab() {
  const cornerLabels = useMemo(() => labelsOf(CORNER_STICKER), [])
  const edgeLabels = useMemo(() => labelsOf(EDGE_STICKER), [])
  const [lettering, ...sections] = BLD_SECTIONS

  return (
    <article className="bld-guide">
      {BLD_INTRO.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <h3>{lettering.title}</h3>
      {lettering.paragraphs.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <div className="net-pair">
        <figure>
          <CubeNet state={SOLVED} labels={cornerLabels} label="Bảng chữ Speffz cho góc" />
          <figcaption>Góc</figcaption>
        </figure>
        <figure>
          <CubeNet state={SOLVED} labels={edgeLabels} label="Bảng chữ Speffz cho cạnh" />
          <figcaption>Cạnh</figcaption>
        </figure>
      </div>
      {sections.map((s) => (
        <section key={s.title}>
          <h3>{s.title}</h3>
          {s.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          {s.alg && <p className="alg-text bld-alg">{s.alg}</p>}
          {s.setupTable && <SetupTable kind={s.setupTable} />}
        </section>
      ))}
      <h3>Mẹo</h3>
      <ul>
        {BLD_TIPS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </article>
  )
}
