import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllKurals, getFirstAvailableKural } from '../data/kuralRepository'
import { TOTAL_KURALS } from '../data/types'
import { usePlayback } from '../store/PlaybackContext'
import { localStore } from '../store/localStore'
import TimerSheet from '../components/TimerSheet'
import KuralLines from '../components/KuralLines'
import BirthdayKural from '../components/BirthdayKural'

function pad(n: number) {
  return String(n).padStart(4, '0')
}

// Deterministic date -> kural mapping so "today's Kural" is consistent all day.
function todaysKuralNumber(): number {
  const all = getAllKurals()
  if (!all.length) return 1
  const start = new Date(2024, 0, 1).getTime()
  const days = Math.floor((Date.now() - start) / 86400000)
  return all[((days % all.length) + all.length) % all.length].number
}

export default function Home() {
  const navigate = useNavigate()
  const pb = usePlayback()
  const [input, setInput] = useState('')
  const [showTimer, setShowTimer] = useState(false)
  const todayNum = useMemo(todaysKuralNumber, [])
  const todayStats = localStore.todayStats()
  const first = getFirstAvailableKural()

  const openKural = (n: number) => {
    if (!Number.isFinite(n)) return
    navigate(`/kural/${n}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const n = Number(input.replace(/^0+/, '') || '0')
    if (n >= 1 && n <= TOTAL_KURALS) openKural(n)
  }

  const ranges = Array.from({ length: Math.ceil(TOTAL_KURALS / 100) }, (_, i) => {
    const s = i * 100 + 1
    const e = Math.min(s + 99, TOTAL_KURALS)
    return { s, e }
  })

  return (
    <div className="min-h-full bg-cream-100 pb-32">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-b-[2.25rem] text-cream-50 pb-10 min-h-[27rem]">
        <div className="absolute inset-0">
          <img
            src="/images/hero-thiruvalluvar.jpg"
            alt="திருவள்ளுவர்"
            className="h-full w-full object-cover object-[30%_28%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-maroon-900/50 via-transparent to-maroon-900" />
          <div className="absolute inset-0 bg-gradient-to-r from-maroon-900/30 via-transparent to-transparent" />
        </div>

        <div className="relative flex items-start justify-between px-5 pt-6">
          <div className="flex items-center gap-2">
            <PalmLeafMark />
            <span className="font-serif-ta text-lg font-bold tracking-wide text-cream-50/90">திருக்குறள்</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/search')}
              aria-label="தேடல்"
              className="h-9 w-9 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m20 20-4.35-4.35" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={() => navigate('/settings')}
              aria-label="அமைப்புகள்"
              className="h-9 w-9 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 13a7.97 7.97 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a8 8 0 0 0-1.7-1L14.9 3h-4l-.4 2.9a8 8 0 0 0-1.7 1l-2.5-1-2 3.5L6.4 11a7.97 7.97 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a8 8 0 0 0 1.7 1l.4 2.9h4l.4-2.9a8 8 0 0 0 1.7-1l2.5 1 2-3.5z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="relative flex flex-col items-center px-5 pt-6 text-center">
          <h1 className="font-serif-ta text-4xl font-bold tracking-wide text-gold-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            திருக்குறள்
          </h1>
          <p className="mt-2 max-w-[22rem] text-sm text-cream-50/80">
            1330 குறள்கள் · 133 அதிகாரங்கள் — கேட்டு அறிந்து கற்போம்
          </p>
        </div>

        <div className="relative mt-6 flex justify-center gap-3 px-5">
          <button
            onClick={() => openKural(pb.currentNumber || (first?.number ?? 1))}
            className="rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-cream-50 backdrop-blur-md shadow-lg active:bg-white/20"
          >
            🎧 இப்போதே கேட்க
          </button>
          <button
            onClick={() => navigate('/chapters')}
            className="rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-cream-50 backdrop-blur-md shadow-lg active:bg-white/20"
          >
            📖 அதிகாரங்கள்
          </button>
        </div>
      </header>

      {/* Number entry — floats over the hero's lower edge */}
      <section className="px-5 -mt-8 relative z-10">
        <form onSubmit={handleSubmit} className="rounded-2xl bg-cream-50 p-4 shadow-xl border border-gold-400/20">
          <label className="text-xs font-semibold text-maroon-700" htmlFor="kuralnum">
            குறள் எண்ணை உள்ளிடுங்கள்
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              id="kuralnum"
              inputMode="numeric"
              placeholder="0001"
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
              className="w-24 rounded-xl border-2 border-gold-400/50 bg-white px-3 py-2.5 text-center text-xl font-bold text-maroon-800 outline-none focus:border-maroon-600"
            />
            <button
              type="submit"
              className="flex-1 rounded-xl bg-maroon-700 py-2.5 font-semibold text-cream-50 active:bg-maroon-800"
            >
              குறளை கேட்க
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => openKural(Math.max(1, pb.currentNumber - 1))}
              className="rounded-lg bg-gold-100 py-2 font-medium text-maroon-700"
            >
              ⏮ முந்தையது
            </button>
            <button
              type="button"
              onClick={() => openKural(Math.min(TOTAL_KURALS, pb.currentNumber + 1))}
              className="rounded-lg bg-gold-100 py-2 font-medium text-maroon-700"
            >
              அடுத்தது ⏭
            </button>
            <button
              type="button"
              onClick={() => {
                const all = getAllKurals()
                const pick = all[Math.floor(Math.random() * all.length)]
                if (pick) openKural(pick.number)
              }}
              className="rounded-lg bg-gold-100 py-2 font-medium text-maroon-700"
            >
              🎲 சீரற்றது
            </button>
          </div>
        </form>
      </section>

      {/* Primary CTAs */}
      <section className="px-5 mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => first && openKural(first.number)}
          className="rounded-2xl bg-white border border-gold-400/30 p-4 text-left shadow-sm"
        >
          <span className="text-2xl">🔍</span>
          <p className="mt-2 font-semibold text-maroon-800">குறளை தேடுங்கள்</p>
          <p className="text-xs text-charcoal-800/50">எண், சொல் அல்லது அதிகாரம்</p>
        </button>
        <button
          onClick={() => setShowTimer(true)}
          className="rounded-2xl bg-maroon-700 text-cream-50 p-4 text-left shadow-sm"
        >
          <span className="text-2xl">⏱️</span>
          <p className="mt-2 font-semibold">தொடர்ந்து கேட்க</p>
          <p className="text-xs text-gold-300">15–120 நிமிடங்கள்</p>
        </button>
      </section>

      <BirthdayKural />

      {/* Today's kural */}
      <section className="px-5 mt-5">
        <div className="rounded-2xl bg-gradient-to-br from-gold-400 to-gold-500 p-4 shadow-sm">
          <p className="text-xs font-bold text-maroon-800/80">இன்றைய குறள்</p>
          {(() => {
            const k = getAllKurals().find((k) => k.number === todayNum)
            if (!k) return null
            return (
              <>
                <KuralLines
                  text={k.kuralTamil}
                  className="mt-1 font-serif-ta font-bold text-maroon-900"
                  size="clamp(0.95rem, 4.5vw, 1.15rem)"
                />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-maroon-800/70">குறள் {pad(k.number)} · {k.chapterNameTamil}</span>
                  <button
                    onClick={() => openKural(k.number)}
                    className="rounded-full bg-maroon-800 text-cream-50 px-4 py-1.5 text-xs font-semibold"
                  >
                    ▶ கேட்க
                  </button>
                </div>
              </>
            )
          })()}
        </div>
      </section>

      {/* Today stats */}
      {todayStats.count > 0 && (
        <section className="px-5 mt-4">
          <div className="rounded-2xl bg-white border border-gold-400/30 p-4 flex items-center justify-around text-center">
            <div>
              <p className="text-xl font-bold text-maroon-800">{todayStats.count}</p>
              <p className="text-[11px] text-charcoal-800/50">குறள்கள் கேட்டீர்கள்</p>
            </div>
            <div className="h-8 w-px bg-gold-400/30" />
            <div>
              <p className="text-xl font-bold text-maroon-800">{todayStats.minutes}</p>
              <p className="text-[11px] text-charcoal-800/50">நிமிடங்கள்</p>
            </div>
          </div>
        </section>
      )}

      {/* Quick access ranges */}
      <section className="px-5 mt-6">
        <h2 className="font-serif-ta text-base font-bold text-maroon-800 mb-3">குறள் தொகுப்புகள்</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {ranges.map(({ s, e }) => (
            <button
              key={s}
              onClick={() => navigate(`/range/${s}-${e}`)}
              className="rounded-xl bg-white border border-gold-400/30 py-3 text-sm font-semibold text-maroon-700 active:bg-gold-100"
            >
              குறள் {pad(s)}–{pad(e)}
            </button>
          ))}
        </div>
      </section>

      {showTimer && (
        <TimerSheet
          onClose={() => setShowTimer(false)}
          onStart={(min) => {
            setShowTimer(false)
            pb.startTimerSession(min, pb.currentNumber)
            navigate(`/kural/${pb.currentNumber}`)
          }}
        />
      )}

      {/* Footer credit */}
      <footer className="px-5 mt-8 text-center">
        <div className="mx-auto h-px w-16 bg-gold-400/30" />
        <p className="mt-4 text-[11px] leading-relaxed text-charcoal-800/45">
          Developed and Maintained by
          <br />
          <span className="font-semibold text-charcoal-800/60">SKYLINN VOXEL STUDIO PRIVATE LIMITED</span>
          <br />
          Chengalpattu, Tamil Nadu
        </p>
      </footer>
    </div>
  )
}

function PalmLeafMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 21c0-6 0-12 6-16-4 6-2 11 0 16M12 21c0-6 0-12-6-16 4 6 2 11 0 16"
        stroke="#dcb35c"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
