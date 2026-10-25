import type { AlgCase } from '../algorithms'
import { CaseDiagram } from './CaseDiagram'

interface AlgCardProps {
  algCase: AlgCase
  href: string
}

export function AlgCard({ algCase, href }: AlgCardProps) {
  return (
    <a className="alg-card" href={href} title="Xem trên khối 3D">
      <CaseDiagram algCase={algCase} size={104} />
      <div className="alg-card-text">
        <div className="alg-card-title">
          <strong>{algCase.id}</strong>
          <span>{algCase.name}</span>
        </div>
        <code className="alg-main">{algCase.alg}</code>
        {algCase.alternatives?.map((alt) => (
          <code key={alt} className="alg-alt">
            {alt}
          </code>
        ))}
        {algCase.note && <p className="alg-note">{algCase.note}</p>}
      </div>
    </a>
  )
}
