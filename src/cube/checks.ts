import { centerOf, faceOf, stickersAt, type Facelets, type Vec3 } from './facelets'

// Every check compares stickers with the center of their face, so they hold
// after whole-cube rotations (the solver works with white on D after `z2`).

export type Slot = 'FR' | 'FL' | 'BR' | 'BL'
export const SLOTS: readonly Slot[] = ['FR', 'FL', 'BR', 'BL']

const CROSS_EDGES: readonly Vec3[] = [
  [0, -1, 1],
  [1, -1, 0],
  [0, -1, -1],
  [-1, -1, 0],
]

const SLOT_CUBIES: Record<Slot, readonly Vec3[]> = {
  FR: [[1, -1, 1], [1, 0, 1]],
  FL: [[-1, -1, 1], [-1, 0, 1]],
  BR: [[1, -1, -1], [1, 0, -1]],
  BL: [[-1, -1, -1], [-1, 0, -1]],
}

const stickerGroups = (cubies: readonly Vec3[]) => cubies.flatMap(stickersAt)
const CROSS_STICKERS = stickerGroups(CROSS_EDGES)
const SLOT_STICKERS = Object.fromEntries(
  SLOTS.map((slot) => [slot, stickerGroups(SLOT_CUBIES[slot])]),
) as Record<Slot, number[]>
const U_FACE = Array.from({ length: 9 }, (_, i) => i)

const allHome = (state: Facelets, stickers: readonly number[]) =>
  stickers.every((i) => state[i] === state[centerOf(faceOf(i))])

export function isSolved(state: Facelets): boolean {
  for (let i = 0; i < 54; i++) if (state[i] !== state[centerOf(faceOf(i))]) return false
  return true
}

/** Cross on the D face: four D edges placed and oriented. */
export function isCrossSolved(state: Facelets): boolean {
  return allHome(state, CROSS_STICKERS)
}

export function isSlotSolved(state: Facelets, slot: Slot): boolean {
  return allHome(state, SLOT_STICKERS[slot])
}

export function solvedSlots(state: Facelets): Slot[] {
  return SLOTS.filter((slot) => isSlotSolved(state, slot))
}

export function isF2LSolved(state: Facelets): boolean {
  return isCrossSolved(state) && SLOTS.every((slot) => isSlotSolved(state, slot))
}

/** Every U sticker has the U center color (last layer oriented). */
export function isTopOriented(state: Facelets): boolean {
  return allHome(state, U_FACE)
}
