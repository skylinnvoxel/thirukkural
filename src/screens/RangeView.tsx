import { useNavigate, useParams } from 'react-router-dom'
import { getAllKurals } from '../data/kuralRepository'

function pad(n: number) {
  return String(n).padStart(4, '0')
}

export default function RangeView() {
  const { range } = useParams()
  const navigate = useNavigate()
  const [s, e] = (range ?? '1-100').split('-').map(Number)
  const kurals = getAllKurals().filter((k) => k.number >= s && k.number <= e)

  return (
    <div className="min-h-full bg-cream-100 pb-28">
      <header className="px-5 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="text-sm text-maroon-700 mb-2">← பின்</button>
        <h1 className="font-serif-ta text-2xl font-bold text-maroon-800">
          குறள் {pad(s)}–{pad(e)}
        </h1>
      </header>
      {kurals.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-charcoal-800/50">
          இந்த தொகுப்பிற்கான குறள்கள் இன்னும் ஏற்றப்படவில்லை. மாதிரி தரவில் குறள் 0001–0010 மட்டுமே உள்ளது.
        </div>
      ) : (
        <ul className="px-5 space-y-2">
          {kurals.map((k) => (
            <li key={k.number}>
              <button
                onClick={() => navigate(`/kural/${k.number}`)}
                className="w-full text-left rounded-xl bg-white border border-gold-400/30 p-3.5"
              >
                <p className="text-xs font-semibold text-gold-600">குறள் {pad(k.number)}</p>
                <p className="font-serif-ta text-sm text-maroon-900 mt-0.5">{k.kuralTamil.split('\n')[0]}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
