import { solve } from './solve'
import type { SolveResult } from './types'

export type SolverRequest = { scramble: string }
export type SolverResponse = { ok: true; result: SolveResult } | { ok: false; error: string }

self.onmessage = (event: MessageEvent<SolverRequest>) => {
  let response: SolverResponse
  try {
    response = { ok: true, result: solve(event.data.scramble) }
  } catch (error) {
    response = { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
  self.postMessage(response)
}
