import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getKuralByNumber } from '../data/kuralRepository'
import { TOTAL_KURALS } from '../data/types'
import { usePlayback } from '../store/PlaybackContext'
import { localStore } from '../store/localStore'
import { audioService } from '../lib/audioService'
import TimerSheet from '../components/TimerSheet'
import KuralLines from '../components/KuralLines'

function pad(n: number) {
  return String(n).padStart(4, '0')
}

const SPEEDS = [0.75, 1, 1.25, 1.5]

export default function KuralDetail() {
  const { number } = useParams()
  const n = Number(number)
  const navigate = useNavigate()
  const pb = usePlayback()
  const kural = getKuralByNumber(n)
  const settings = localStore.getSettings()
  const [rate, setRate] = useState(settings.playbackRate)
  const [showTransliteration, setShowTransliteration] = useState(settings.englishAssist)
  const [favorites, setFavorites] = useState(localStore.getFavorites())
  const [bookmarks, setBookmarks] = useState(localStore.getBookmarks())
  const [showTimer, setShowTimer] = useState(false)

  useEffect(() => {
    audioService.updateSettings({ rate })
    localStore.saveSettings({ playbackRate: rate })
  }, [rate])

  // During continuous/chapter/random playback, the main screen must follow
  // whichever Kural is actually playing — otherwise the dominant display
  // stays frozen on the Kural that was tapped while audio has already
  // moved on. The mini-player alone updating isn't enough.
  useEffect(() => {
    if (!pb.isSessionActive) return
    if (pb.currentNumber === n) return
    navigate(`/kural/${pb.currentNumber}`, { replace: true })
  }, [pb.isSessionActive, pb.currentNumber, n, navigate])

  if (!kural) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 text-center bg-cream-100">
        <p className="text-lg font-semibold text-maroon-800">குறள் {pad(n || 0)} கிடைக்கவில்லை</p>
        <p className="mt-2 text-sm text-charcoal-800/60">
          இந்த குறளுக்கான தரவு இன்னும் ஏற்றப்படவில்லை. மாதிரி தரவில் குறள் 0001–0010 மட்டுமே உள்ளது.
        </p>
        <button onClick={() => navigate('/')} className="mt-5 rounded-xl bg-maroon-700 text-cream-50 px-5 py-2.5 text-sm font-semibold">
          முகப்புக்குச் செல்க
        </button>
      </div>
    )
  }

  const isActive = pb.currentNumber === kural.number
  const isFav = favorites.includes(kural.number)
  const isBookmarked = bookmarks.includes(kural.number)

  return (
    <div className="min-h-full bg-cream-100 pb-40">
      <header className="sticky top-0 z-20 bg-cream-100/90 backdrop-blur px-4 py-3 flex items-center justify-between">
        <button onClick={() => navigate(-1)} aria-label="பின்செல்க" className="h-9 w-9 rounded-full bg-white flex items-center justify-center shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7a1f1a" strokeWidth="2">
            <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-sm font-semibold text-maroon-800">குறள் {pad(kural.number)}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setFavorites(localStore.toggleFavorite(kural.number))}
            aria-label="விருப்பம்"
            className="h-9 w-9 rounded-full bg-white flex items-center justify-center shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isFav ? '#7a1f1a' : 'none'} stroke="#7a1f1a" strokeWidth="1.8">
              <path d="M12 20s-7-4.35-9.5-8.8C.7 8 2 4.5 5.4 4c2-.3 3.7.6 4.6 2.3C10.9 4.6 12.6 3.7 14.6 4c3.4.5 4.7 4 3 7.2C19 15.65 12 20 12 20Z" />
            </svg>
          </button>
          <button
            onClick={() => setBookmarks(localStore.toggleBookmark(kural.number))}
            aria-label="குறிப்பு"
            className="h-9 w-9 rounded-full bg-white flex items-center justify-center shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isBookmarked ? '#c8983a' : 'none'} stroke="#c8983a" strokeWidth="1.8">
              <path d="M6 3.5h12v18l-6-4-6 4z" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </header>

      <main className="px-5">
        <p className="text-xs font-semibold text-gold-600 uppercase tracking-wide">
          {kural.bookNameTamil} · {kural.sectionNameTamil}
        </p>
        <p className="text-sm text-charcoal-800/60">{kural.chapterNameTamil}</p>

        <div className="mt-4 rounded-3xl bg-white border border-gold-400/30 p-6 shadow-sm text-center">
          <KuralLines
            text={kural.kuralTamil}
            className="font-serif-ta text-maroon-900"
            size="clamp(1.05rem, 5vw, 1.5rem)"
          />
          {showTransliteration && (
            <p className="mt-3 text-center text-xs italic text-charcoal-800/40">
              (English transliteration is not yet available in this sample dataset.)
            </p>
          )}
        </div>

        {isActive && pb.stage !== 'idle' && (
          <p className="mt-3 text-center text-xs font-medium text-maroon-700">
            {pb.stage === 'kural' && 'குறள் ஒலிக்கிறது…'}
            {pb.stage === 'explanation' && 'விளக்கம் ஒலிக்கிறது…'}
            {pb.stage === 'paused' && 'இடைநிறுத்தப்பட்டது'}
            {pb.stage === 'finished' && 'நிறைவடைந்தது'}
          </p>
        )}

        {/* Main play button */}
        <div className="mt-6 flex flex-col items-center">
          <button
            onClick={() => {
              if (isActive && pb.isPlaying) pb.togglePlayPause()
              else if (isActive && pb.stage === 'paused') pb.togglePlayPause()
              else pb.playSingle(kural.number)
            }}
            className={`h-24 w-24 rounded-full flex items-center justify-center shadow-lg ${
              isActive && pb.isPlaying ? 'bg-maroon-800 animate-pulse-ring' : 'bg-maroon-700'
            }`}
            aria-label="குறளை கேட்க"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#faf3e6">
              {isActive && pb.isPlaying ? (
                <>
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </>
              ) : (
                <path d="M7 5v14l12-7z" />
              )}
            </svg>
          </button>
          <p className="mt-2 text-sm font-semibold text-maroon-800">
            {isActive && pb.isPlaying ? 'இயக்கத்தில்' : 'குறளை கேட்க'}
          </p>
        </div>

        {/* Transport controls */}
        <div className="mt-5 flex items-center justify-center gap-4">
          <CtrlBtn label="முந்தையது" onClick={() => navigate(`/kural/${Math.max(1, kural.number - 1)}`)}>
            <path d="M17 5v14L7 12z" /><rect x="5" y="5" width="1.6" height="14" />
          </CtrlBtn>
          <CtrlBtn label="மீண்டும்" onClick={pb.replay}>
            <path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" />
          </CtrlBtn>
          <CtrlBtn label="அடுத்தது" onClick={() => navigate(`/kural/${Math.min(TOTAL_KURALS, kural.number + 1)}`)}>
            <path d="M7 5v14l10-7z" /><rect x="17.4" y="5" width="1.6" height="14" />
          </CtrlBtn>
        </div>

        {/* Speed */}
        <div className="mt-6">
          <p className="text-xs font-semibold text-charcoal-800/60 mb-2">இயக்க வேகம்</p>
          <div className="flex gap-2">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => setRate(s)}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold border-2 ${
                  rate === s ? 'bg-maroon-700 text-cream-50 border-maroon-700' : 'bg-white text-maroon-700 border-gold-400/40'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Meaning */}
        <div className="mt-6 rounded-2xl bg-gold-50 border border-gold-300 p-5" style={{ backgroundColor: '#fbf3e0' }}>
          <p className="text-xs font-bold text-maroon-700 mb-2">பொருள்</p>
          <p className="text-base leading-relaxed text-charcoal-900">{kural.meaningTamil}</p>
        </div>

        {kural.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {kural.tags.map((t) => (
              <span key={t} className="rounded-full bg-white border border-gold-400/30 px-3 py-1 text-xs text-maroon-700">
                #{t}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={() => setShowTimer(true)}
          className="mt-6 w-full rounded-xl bg-maroon-800 text-cream-50 py-3 font-semibold"
        >
          🎧 இங்கிருந்து தொடர்ந்து கேட்க
        </button>

        <button
          onClick={() => setShowTransliteration((v) => !v)}
          className="mt-3 w-full text-center text-xs text-charcoal-800/50 underline"
        >
          {showTransliteration ? 'ஆங்கில எழுத்துப்பெயர்ப்பை மறை' : 'ஆங்கில எழுத்துப்பெயர்ப்பைக் காட்டு'}
        </button>
      </main>

      {showTimer && (
        <TimerSheet
          onClose={() => setShowTimer(false)}
          onStart={(min) => {
            setShowTimer(false)
            pb.startTimerSession(min, kural.number)
          }}
        />
      )}
    </div>
  )
}

function CtrlBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} className="h-12 w-12 rounded-full bg-white border border-gold-400/40 flex items-center justify-center shadow-sm">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#7a1f1a">
        {children}
      </svg>
    </button>
  )
}
