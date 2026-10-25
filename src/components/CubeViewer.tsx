import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import type { TwistyPlayer } from 'cubing/twisty'
import { appliedMoves } from '../lib/timeline'

// Thin wrapper around cubing.js' TwistyPlayer. The library is imported
// dynamically so its ~2 MB stays out of the initial bundle.

export type Stickering = 'full' | 'Cross' | 'F2L' | 'OLL' | 'PLL'

// cubing.js masks select pieces by identity in WCA orientation (`U` pieces are
// the white ones), while we solve with white on D after `z2`. So the last layer
// here is the original D pieces. Piece order: EDGES UF UR UB UL DF DR DB DL FR FL BR BL,
// CORNERS UFR URB UBL ULF DRF DFL DLB DBR, CENTERS U L F R B D.
// '-' regular, 'D' dim, 'I' ignored, 'O' only the U-color sticker, 'P' permutation.
const MASKS: Record<Stickering, string> = {
  full: 'EDGES:------------,CORNERS:--------,CENTERS:------',
  Cross: 'EDGES:----IIIIIIII,CORNERS:IIIIIIII,CENTERS:------',
  F2L: 'EDGES:----IIII----,CORNERS:----IIII,CENTERS:-----I',
  OLL: 'EDGES:DDDDOOOODDDD,CORNERS:DDDDOOOO,CENTERS:DDDDD-',
  PLL: 'EDGES:DDDDPPPPDDDD,CORNERS:DDDDPPPP,CENTERS:DDDDDD',
}

export interface CubeController {
  jumpToStart(): void
  jumpToEnd(): void
  play(): void
  pause(): void
  /** Shows the state after `index` moves of `alg`, animating from the current position. */
  goToMove(index: number, animate?: boolean): Promise<void>
}

interface CubeViewerProps {
  setupAlg?: string
  alg?: string
  /** Which CFOP stage to highlight (white cross, yellow last layer). */
  stickering?: Stickering
  /** Start at the end of `alg` instead of the beginning. */
  startAtEnd?: boolean
  /** Animate `alg` from its start whenever it changes (e.g. a new scramble). */
  autoPlay?: boolean
  /** Playback speed, 1 = cubing.js default. */
  tempoScale?: number
  controllerRef?: Ref<CubeController>
  /** Number of moves of `alg` already applied, reported while playing or seeking. */
  onMoveIndexChange?: (index: number) => void
  onPlayingChange?: (playing: boolean) => void
  className?: string
}

const MOVE_ANIMATION_MS = 260

type Timestamp = Parameters<TwistyPlayer['experimentalModel']['timestampRequest']['set']>[0]

interface SeekRefs {
  /** Bumped by every command; a seek gives up when it is no longer the latest. */
  commandRef: { current: number }
  tweenRef: { current: number }
}

/** Moves the player to the state after `index` moves, tweening the timestamp when `animate`. */
async function seekPlayer(player: TwistyPlayer, index: number, animate: boolean, { commandRef, tweenRef }: SeekRefs) {
  cancelAnimationFrame(tweenRef.current)
  const id = ++commandRef.current
  player.pause()
  const model = player.experimentalModel
  const indexer = await model.indexer.get()
  const from = (await model.detailedTimelineInfo.get()).timestamp
  if (id !== commandRef.current) return // a newer command took over
  const count = indexer.numAnimatedLeaves()
  const clamped = Math.max(0, Math.min(index, count))
  const target = clamped >= count ? indexer.algDuration() : indexer.indexToMoveStartTimestamp(clamped as never)
  if (!animate || from === target) {
    model.timestampRequest.set(target as Timestamp)
    return
  }
  const moves = Math.max(1, Math.abs(appliedMoves(indexer, from, false) - clamped))
  const duration = MOVE_ANIMATION_MS * Math.min(moves, 3)
  const start = performance.now()
  const step = (now: number) => {
    if (id !== commandRef.current) return
    const t = Math.min(1, (now - start) / duration)
    model.timestampRequest.set((from + (target - from) * t) as Timestamp)
    if (t < 1) tweenRef.current = requestAnimationFrame(step)
  }
  tweenRef.current = requestAnimationFrame(step)
}

export function CubeViewer({
  setupAlg = '',
  alg = '',
  stickering = 'full',
  startAtEnd = false,
  autoPlay = false,
  tempoScale = 1,
  controllerRef,
  onMoveIndexChange,
  onPlayingChange,
  className,
}: CubeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // Kept in a ref: TwistyPlayer is a mutable custom element, not React state.
  // `generation` changes whenever a new player is mounted so effects re-apply.
  const playerRef = useRef<TwistyPlayer | null>(null)
  const [generation, setGeneration] = useState(0)
  const [error, setError] = useState(false)
  const tweenRef = useRef(0)
  /** Bumped by every seek or playback command; stale async work checks it. */
  const commandRef = useRef(0)
  /** Bumped whenever the alg changes; timeline reports for older algs are dropped. */
  const algVersionRef = useRef(0)
  /** A `goToMove` requested before the player finished loading. */
  const pendingSeekRef = useRef<number | null>(null)
  const callbacks = useRef({ onMoveIndexChange, onPlayingChange })
  useEffect(() => {
    callbacks.current = { onMoveIndexChange, onPlayingChange }
  })

  useEffect(() => {
    let cancelled = false
    let created: TwistyPlayer | null = null
    // Cleanup must see the latest command and tween, so keep the ref objects.
    const commands = commandRef
    const tweens = tweenRef
    import('cubing/twisty')
      .then(({ TwistyPlayer }) => {
        if (cancelled || !containerRef.current) return
        created = new TwistyPlayer({
          puzzle: '3x3x3',
          visualization: '3D',
          controlPanel: 'none',
          background: 'none',
          hintFacelets: 'none',
          experimentalSetupAnchor: 'start',
        })
        created.style.width = '100%'
        created.style.height = '100%'
        containerRef.current.appendChild(created)
        playerRef.current = created
        setGeneration((g) => g + 1)
      })
      .catch(() => setError(true))
    return () => {
      cancelled = true
      commands.current++ // abandon seeks still awaiting the old player
      cancelAnimationFrame(tweens.current)
      created?.remove()
      playerRef.current = null
    }
  }, [])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    algVersionRef.current++
    commandRef.current++
    cancelAnimationFrame(tweenRef.current)
    player.experimentalSetupAlg = setupAlg
    player.alg = alg
    if (autoPlay) {
      player.jumpToStart()
      player.play()
    } else if (startAtEnd) {
      player.jumpToEnd()
    } else {
      player.jumpToStart()
    }
    const pending = pendingSeekRef.current
    pendingSeekRef.current = null
    if (pending !== null) void seekPlayer(player, pending, false, { commandRef, tweenRef })
  }, [generation, setupAlg, alg, startAtEnd, autoPlay])

  useEffect(() => {
    if (playerRef.current) playerRef.current.tempoScale = tempoScale
  }, [generation, tempoScale])

  useEffect(() => {
    if (playerRef.current) playerRef.current.experimentalStickeringMaskOrbits = MASKS[stickering]
  }, [generation, stickering])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    const model = player.experimentalModel
    const onTimeline = async (info: { timestamp: number; atEnd: boolean }) => {
      const version = algVersionRef.current
      const indexer = await model.indexer.get()
      if (version !== algVersionRef.current) return
      callbacks.current.onMoveIndexChange?.(appliedMoves(indexer, info.timestamp, info.atEnd))
    }
    const onCoarse = (info: { playing: boolean }) => callbacks.current.onPlayingChange?.(info.playing)
    model.detailedTimelineInfo.addFreshListener(onTimeline)
    model.coarseTimelineInfo.addFreshListener(onCoarse)
    return () => {
      model.detailedTimelineInfo.removeFreshListener(onTimeline)
      model.coarseTimelineInfo.removeFreshListener(onCoarse)
    }
  }, [generation])

  useImperativeHandle(controllerRef, (): CubeController => {
    const player = playerRef.current
    const command = () => {
      cancelAnimationFrame(tweenRef.current)
      return ++commandRef.current
    }
    return {
      jumpToStart: () => {
        command()
        player?.jumpToStart()
      },
      jumpToEnd: () => {
        command()
        player?.jumpToEnd()
      },
      play: () => {
        command()
        player?.play()
      },
      pause: () => {
        command()
        player?.pause()
      },
      goToMove: async (index, animate = true) => {
        if (!player) {
          // Not loaded yet: applied once the player shows this alg.
          pendingSeekRef.current = index
          return
        }
        await seekPlayer(player, index, animate, { commandRef, tweenRef })
      },
    }
  })

  return (
    <div className={`cube-viewer ${className ?? ''}`} ref={containerRef}>
      {generation === 0 && !error && <p className="cube-viewer-status">Đang tải khối 3D…</p>}
      {error && <p className="cube-viewer-status">Không tải được khối 3D. Hãy tải lại trang.</p>}
    </div>
  )
}
