import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchKurals } from '../data/kuralRepository'

function pad(n: number) {
  return String(n).padStart(4, '0')
}

export default function Search() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const results = useMemo(() => searchKurals(q), [q])

  return (
    <div className="min-h-full bg-cream-100 pb-28">
      <header className="px-5 pt-6 pb-4">
        <h1 className="font-serif-ta text-2xl font-bold text-maroon-800 mb-3">தேடல்</h1>
        <div className="relative">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="எண், சொல், அதிகாரம் அல்லது தலைப்பு..."
            className="w-full rounded-2xl border-2 border-gold-400/40 bg-white px-4 py-3 text-sm outline-none focus:border-maroon-600"
          />
        </div>
      </header>

      {q.trim() === '' ? (
        <p className="px-5 text-sm text-charcoal-800/50">
          எ.கா. <span className="font-serif-ta">அகர</span>, <span className="font-serif-ta">பகவன்</span>, 1, 0001
        </p>
      ) : results.length === 0 ? (
        <p className="px-5 text-sm text-charcoal-800/50">முடிவுகள் இல்லை.</p>
      ) : (
        <ul className="px-5 space-y-2">
          {results.map((k) => (
            <li key={k.number}>
              <button
                onClick={() => navigate(`/kural/${k.number}`)}
                className="w-full text-left rounded-xl bg-white border border-gold-400/30 p-3.5"
              >
                <p className="text-xs font-semibold text-gold-600">
                  {pad(k.number)} — {k.chapterNameTamil}
                </p>
                <p className="font-serif-ta text-sm text-maroon-900 mt-0.5">{k.kuralTamil.split('\n')[0]}...</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
