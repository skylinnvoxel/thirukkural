import { useNavigate } from 'react-router-dom'
import { getChapterDirectory } from '../data/kuralRepository'
import { usePlayback } from '../store/PlaybackContext'

function pad(n: number) {
  return String(n).padStart(4, '0')
}

export default function Chapters() {
  const navigate = useNavigate()
  const pb = usePlayback()
  const chapters = getChapterDirectory()

  return (
    <div className="min-h-full bg-cream-100 pb-28">
      <header className="px-5 pt-6 pb-4">
        <h1 className="font-serif-ta text-2xl font-bold text-maroon-800">அதிகாரங்கள்</h1>
        <p className="text-sm text-charcoal-800/60">133 அதிகாரங்கள் · 1330 குறள்கள்</p>
      </header>
      <ul className="px-5 space-y-2.5">
        {chapters.map((c) => (
          <li key={c.chapterNumber}>
            <div
              className={`rounded-2xl border p-4 flex items-center justify-between ${
                c.hasData ? 'bg-white border-gold-400/30' : 'bg-white/50 border-gold-400/15'
              }`}
            >
              <button
                className="flex-1 text-left"
                onClick={() => c.hasData && navigate(`/chapter/${c.chapterNumber}`)}
                disabled={!c.hasData}
              >
                <p className="text-xs text-gold-600 font-semibold">{String(c.chapterNumber).padStart(2, '0')}</p>
                <p className={`font-serif-ta text-base font-bold ${c.hasData ? 'text-maroon-800' : 'text-charcoal-800/40'}`}>
                  {c.chapterNameTamil ?? 'தரவு விரைவில் வரும்'}
                </p>
                {c.hasData ? (
                  <p className="text-xs text-charcoal-800/50 mt-0.5">
                    குறள் {pad(c.kuralStart)}–{pad(c.kuralEnd)}
                  </p>
                ) : (
                  <p className="text-xs text-charcoal-800/30 mt-0.5">Not yet loaded</p>
                )}
              </button>
              {c.hasData && (
                <button
                  onClick={() => {
                    pb.startChapterSession(c.chapterNumber)
                    navigate(`/kural/${c.kuralStart}`)
                  }}
                  aria-label="அதிகாரத்தை கேட்க"
                  className="h-10 w-10 rounded-full bg-maroon-700 flex items-center justify-center shrink-0 ml-3"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#faf3e6">
                    <path d="M7 5v14l12-7z" />
                  </svg>
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
