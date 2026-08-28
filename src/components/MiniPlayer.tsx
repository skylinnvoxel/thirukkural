import { useNavigate } from 'react-router-dom'
import { usePlayback } from '../store/PlaybackContext'

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function MiniPlayer() {
  const pb = usePlayback()
  const navigate = useNavigate()
  if (!pb.miniPlayerVisible || !pb.currentKural) return null

  const isTimerMode = pb.mode === 'timer' || pb.mode === 'random'

  return (
    <button
      onClick={() => navigate(`/kural/${pb.currentNumber}`)}
      className="fixed left-2 right-2 z-30 bottom-[calc(56px+env(safe-area-inset-bottom)+8px)] rounded-2xl bg-maroon-800 text-cream-50 shadow-lg shadow-maroon-900/30 px-3 py-2.5 flex items-center gap-3 text-left"
      aria-label="இயக்கியை திற"
    >
      <div className="h-10 w-10 shrink-0 rounded-full bg-gold-500/90 flex items-center justify-center text-maroon-900 font-bold text-sm">
        {String(pb.currentNumber).padStart(4, '0').slice(-3)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gold-300 font-medium">குறள் {String(pb.currentNumber).padStart(4, '0')}</p>
        <p className="truncate text-sm font-serif-ta leading-tight">
          {pb.currentKural.kuralTamil.split('\n')[0]}
        </p>
        {isTimerMode && (
          <p className="text-[11px] text-cream-200/70 mt-0.5">{fmt(pb.timerRemainingSeconds)} மீதம்</p>
        )}
      </div>
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <IconBtn label="முந்தைய" onClick={pb.previous}>
          <path d="M17 5v14L7 12z" />
          <rect x="5" y="5" width="1.6" height="14" />
        </IconBtn>
        <IconBtn label={pb.isPlaying ? 'இடைநிறுத்து' : 'இயக்கு'} onClick={pb.togglePlayPause} primary>
          {pb.isPlaying ? (
            <>
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </>
          ) : (
            <path d="M7 5v14l12-7z" />
          )}
        </IconBtn>
        <IconBtn label="அடுத்தது" onClick={pb.next}>
          <path d="M7 5v14l10-7z" />
          <rect x="17.4" y="5" width="1.6" height="14" />
        </IconBtn>
        <IconBtn label="நிறுத்து" onClick={pb.stopSession}>
          <rect x="6" y="6" width="12" height="12" rx="1.5" />
        </IconBtn>
      </div>
    </button>
  )
}

function IconBtn({
  children,
  onClick,
  label,
  primary,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`h-8 w-8 rounded-full flex items-center justify-center ${
        primary ? 'bg-gold-500 text-maroon-900' : 'bg-white/10 text-cream-50'
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        {children}
      </svg>
    </button>
  )
}
