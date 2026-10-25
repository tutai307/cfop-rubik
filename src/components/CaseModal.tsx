import { useEffect, useRef, type ReactNode } from 'react'
import { CubeViewer, type CubeController, type Stickering } from './CubeViewer'

interface CaseModalProps {
  title: string
  setupAlg: string
  alg: string
  stickering: Stickering
  onClose: () => void
  children?: ReactNode
}

/** Dialog with the single 3D viewer of the library page. */
export function CaseModal({ title, setupAlg, alg, stickering, onClose, children }: CaseModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const controller = useRef<CubeController>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="case-modal"
      aria-label={title}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current.close()
      }}
    >
      <div className="case-modal-body">
        <header className="case-modal-header">
          <h3>{title}</h3>
          <button type="button" className="icon-button" aria-label="Đóng" onClick={() => dialogRef.current?.close()}>
            ✕
          </button>
        </header>
        <CubeViewer className="case-modal-cube" setupAlg={setupAlg} alg={alg} stickering={stickering} controllerRef={controller} />
        <div className="button-row">
          <button type="button" onClick={() => controller.current?.jumpToStart()}>
            Về đầu
          </button>
          <button type="button" className="primary" onClick={() => {
            controller.current?.jumpToStart()
            controller.current?.play()
          }}>
            Phát thuật toán
          </button>
          <button type="button" onClick={() => controller.current?.jumpToEnd()}>
            Đến cuối
          </button>
        </div>
        <p className="alg-text">{alg}</p>
        {children}
      </div>
    </dialog>
  )
}
