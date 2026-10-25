import { useCallback, useEffect, useRef, useState } from 'react'
import type { SolverResponse } from '../solver/solver.worker'
import type { SolveResult } from '../solver/types'

export type SolverState =
  | { status: 'idle' }
  | { status: 'solving' }
  | { status: 'done'; result: SolveResult }
  | { status: 'error'; message: string }

/** Runs the CFOP solver in a Web Worker; cancelling terminates the worker. */
export function useSolver() {
  const [state, setState] = useState<SolverState>({ status: 'idle' })
  const workerRef = useRef<Worker | null>(null)

  const stop = useCallback(() => {
    workerRef.current?.terminate()
    workerRef.current = null
  }, [])

  const cancel = useCallback(() => {
    stop()
    setState({ status: 'idle' })
  }, [stop])

  const solve = useCallback(
    (scramble: string) => {
      stop()
      const worker = new Worker(new URL('../solver/solver.worker.ts', import.meta.url), { type: 'module' })
      workerRef.current = worker
      setState({ status: 'solving' })
      worker.onmessage = (event: MessageEvent<SolverResponse>) => {
        if (workerRef.current !== worker) return
        setState(event.data.ok ? { status: 'done', result: event.data.result } : { status: 'error', message: event.data.error })
        stop()
      }
      worker.onerror = () => {
        if (workerRef.current !== worker) return
        setState({ status: 'error', message: 'Bộ giải gặp lỗi khi chạy.' })
        stop()
      }
      worker.postMessage({ scramble })
    },
    [stop],
  )

  useEffect(() => stop, [stop])

  return { state, solve, cancel }
}
