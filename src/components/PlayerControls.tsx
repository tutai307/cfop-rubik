interface PlayerControlsProps {
  current: number
  total: number
  playing: boolean
  seek: (index: number) => void
  togglePlay: () => void
  /** Whether Space plays/pauses here, for the button title. */
  spaceToPlay?: boolean
}

export function PlayerControls({ current, total, playing, seek, togglePlay, spaceToPlay = true }: PlayerControlsProps) {
  return (
    <div className="player-controls" role="group" aria-label="Điều khiển lời giải">
      <button type="button" onClick={() => seek(0)} aria-label="Về đầu" title="Về đầu">
        ⏮
      </button>
      <button type="button" onClick={() => seek(current - 1)} aria-label="Lui 1 nước" title="Lui 1 nước (←)">
        ◀
      </button>
      <button
        type="button"
        className="primary"
        onClick={togglePlay}
        aria-label={playing ? 'Dừng' : 'Phát'}
        title={spaceToPlay ? 'Phát/dừng (Space)' : 'Phát/dừng'}
      >
        {playing ? '⏸' : '▶'}
      </button>
      <button type="button" onClick={() => seek(current + 1)} aria-label="Tới 1 nước" title="Tới 1 nước (→)">
        ▶❘
      </button>
      <button type="button" onClick={() => seek(total)} aria-label="Đến cuối" title="Đến cuối">
        ⏭
      </button>
      <span className="move-counter">
        {current}/{total}
      </span>
    </div>
  )
}
