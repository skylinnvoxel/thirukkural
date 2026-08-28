import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getKuralByNumber } from '../data/kuralRepository'
import KuralLines from './KuralLines'

function pad(n: number) {
  return String(n).padStart(4, '0')
}

// Reduces any positive whole number to a single digit by repeated digit
// summing (e.g. 1981 -> 1+9+8+1=19 -> 1+9=10 -> 1+0=1), the same "digital
// root" every manual numerology reduction converges to.
function digitalRoot(n: number): number {
  const a = Math.abs(Math.trunc(n))
  if (a === 0) return 0
  return 1 + ((a - 1) % 9)
}

type Result = { dayDigit: number; monthDigit: number; yearDigit: number; kuralNumber: number }

export default function BirthdayKural() {
  const navigate = useNavigate()
  const [dob, setDob] = useState('')
  const [result, setResult] = useState<Result | null>(null)

  const compute = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dob) return
    const [yStr, mStr, dStr] = dob.split('-')
    const y = Number(yStr)
    const m = Number(mStr)
    const d = Number(dStr)
    if (!y || !m || !d) return
    const dayDigit = digitalRoot(d)
    const monthDigit = digitalRoot(m)
    const yearDigit = digitalRoot(y)
    const kuralNumber = Number(`${dayDigit}${monthDigit}${yearDigit}`)
    setResult({ dayDigit, monthDigit, yearDigit, kuralNumber })
  }

  const kural = result ? getKuralByNumber(result.kuralNumber) : null

  return (
    <section className="px-5 mt-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-maroon-800 to-maroon-900 p-5 text-cream-50 shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gold-400/10" />
        <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-gold-400/10" />

        <p className="relative text-xs font-bold uppercase tracking-wide text-gold-300">
          🎂 உங்கள் பிறந்தநாள் குறள்
        </p>
        <p className="relative mt-1 text-sm text-cream-50/70">
          உங்கள் பிறந்த தேதியை உள்ளிடுங்கள் — அதிலிருந்து உங்களுக்கே உரிய ஒரு குறளைக் கண்டறியலாம்
        </p>

        <form onSubmit={compute} className="relative mt-4 flex items-center gap-2">
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            aria-label="பிறந்த தேதி"
            className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-cream-50 outline-none [color-scheme:dark] focus:border-gold-400"
          />
          <button
            type="submit"
            disabled={!dob}
            className="shrink-0 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-maroon-900 active:bg-gold-400 disabled:opacity-40"
          >
            கண்டறிக
          </button>
        </form>

        {result && (
          <div className="relative mt-4">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-gold-300">
              <span className="rounded-full bg-white/10 px-2.5 py-1">நாள் {result.dayDigit}</span>
              <span className="text-cream-50/40">+</span>
              <span className="rounded-full bg-white/10 px-2.5 py-1">மாதம் {result.monthDigit}</span>
              <span className="text-cream-50/40">+</span>
              <span className="rounded-full bg-white/10 px-2.5 py-1">ஆண்டு {result.yearDigit}</span>
              <span className="text-cream-50/40">→</span>
              <span className="rounded-full bg-gold-500 px-2.5 py-1 font-bold text-maroon-900">
                குறள் {result.kuralNumber}
              </span>
            </div>

            {kural ? (
              <div className="mt-3 rounded-2xl bg-cream-50 p-4 text-maroon-900">
                <KuralLines
                  text={kural.kuralTamil}
                  className="font-serif-ta text-maroon-900"
                  size="clamp(0.9rem, 4vw, 1.05rem)"
                />
                <p className="mt-2 text-xs leading-relaxed text-charcoal-800/70">{kural.meaningTamil}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-maroon-800/60">
                    குறள் {pad(kural.number)} · {kural.chapterNameTamil}
                  </span>
                  <button
                    onClick={() => navigate(`/kural/${kural.number}`)}
                    className="shrink-0 rounded-full bg-maroon-700 px-4 py-1.5 text-xs font-semibold text-cream-50 active:bg-maroon-800"
                  >
                    முழுமையாகக் கேட்க
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-cream-50/70">குறள் {result.kuralNumber} கிடைக்கவில்லை.</p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
