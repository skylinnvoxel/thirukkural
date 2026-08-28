import { useNavigate, useParams } from 'react-router-dom'
import { getKuralsByChapter } from '../data/kuralRepository'
import { usePlayback } from '../store/PlaybackContext'
import KuralLines from '../components/KuralLines'

function pad(n: number) {
  return String(n).padStart(4, '0')
}

export default function ChapterDetail() {
  const { chapterNumber } = useParams()
  const navigate = useNavigate()
  const pb = usePlayback()
  const kurals = getKuralsByChapter(Number(chapterNumber))

  if (!kurals.length) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-6 text-center bg-cream-100">
        <p className="text-charcoal-800/60 text-sm">இந்த அதிகாரத்திற்கான தரவு இன்னும் ஏற்றப்படவில்லை.</p>
        <button onClick={() => navigate('/chapters')} className="mt-4 rounded-xl bg-maroon-700 text-cream-50 px-5 py-2.5 text-sm font-semibold">
          அதிகாரங்களுக்குச் செல்க
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-cream-100 pb-28">
      <header className="px-5 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-sm text-maroon-700 mb-2">← பின்</button>
        <p className="text-xs text-gold-600 font-semibold">{kurals[0].bookNameTamil} · {kurals[0].sectionNameTamil}</p>
        <h1 className="font-serif-ta text-2xl font-bold text-maroon-800">{kurals[0].chapterNameTamil}</h1>
        <button
          onClick={() => {
            pb.startChapterSession(kurals[0].chapterNumber)
            navigate(`/kural/${kurals[0].number}`)
          }}
          className="mt-3 rounded-xl bg-maroon-700 text-cream-50 px-4 py-2.5 text-sm font-semibold"
        >
          ▶ இந்த அதிகாரத்தை கேட்க
        </button>
      </header>
      <ul className="px-5 space-y-2">
        {kurals.map((k) => (
          <li key={k.number}>
            <button
              onClick={() => navigate(`/kural/${k.number}`)}
              className="w-full text-left rounded-xl bg-white border border-gold-400/30 p-3.5"
            >
              <p className="text-xs font-semibold text-gold-600">குறள் {pad(k.number)}</p>
              <KuralLines
                text={k.kuralTamil}
                className="font-serif-ta text-maroon-900 mt-0.5"
                size="clamp(0.85rem, 4vw, 0.95rem)"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
