import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getKuralByNumber } from '../data/kuralRepository'
import { localStore } from '../store/localStore'

function pad(n: number) {
  return String(n).padStart(4, '0')
}

type Tab = 'favorites' | 'recent' | 'bookmarks' | 'most'

export default function Mine() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('favorites')
  const favorites = localStore.getFavorites()
  const bookmarks = localStore.getBookmarks()
  const history = localStore.getHistory()
  const todayStats = localStore.todayStats()

  const recentNumbers = Array.from(new Set(history.map((h) => h.number))).slice(0, 30)

  const countByNumber = new Map<number, number>()
  for (const h of history) countByNumber.set(h.number, (countByNumber.get(h.number) ?? 0) + 1)
  const mostListened = Array.from(countByNumber.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([n]) => n)

  const listFor: Record<Tab, number[]> = {
    favorites,
    recent: recentNumbers,
    bookmarks,
    most: mostListened,
  }

  const totalMinutes = Math.round(history.reduce((s, h) => s + h.seconds, 0) / 60)

  return (
    <div className="min-h-full bg-cream-100 pb-28">
      <header className="px-5 pt-6 pb-4">
        <h1 className="font-serif-ta text-2xl font-bold text-maroon-800">எனது குறள்கள்</h1>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="இன்று" value={`${todayStats.count}`} />
          <Stat label="மொத்த நிமிடங்கள்" value={`${totalMinutes}`} />
          <Stat label="கேட்டவை" value={`${history.length}`} />
        </div>
      </header>

      <div className="px-5 flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ['favorites', 'விருப்பம்'],
            ['bookmarks', 'குறிப்புகள்'],
            ['recent', 'சமீபத்தியவை'],
            ['most', 'அதிகம் கேட்டவை'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold ${
              tab === key ? 'bg-maroon-700 text-cream-50' : 'bg-white text-maroon-700 border border-gold-400/30'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="px-5 mt-4 space-y-2">
        {listFor[tab].length === 0 && (
          <p className="text-sm text-charcoal-800/50 py-6 text-center">இதுவரை எதுவும் இல்லை.</p>
        )}
        {listFor[tab].map((n) => {
          const k = getKuralByNumber(n)
          if (!k) return null
          return (
            <li key={n}>
              <button
                onClick={() => navigate(`/kural/${n}`)}
                className="w-full text-left rounded-xl bg-white border border-gold-400/30 p-3.5"
              >
                <p className="text-xs font-semibold text-gold-600">
                  {pad(n)} — {k.chapterNameTamil}
                </p>
                <p className="font-serif-ta text-sm text-maroon-900 mt-0.5">{k.kuralTamil.split('\n')[0]}</p>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white border border-gold-400/30 py-2.5">
      <p className="text-lg font-bold text-maroon-800">{value}</p>
      <p className="text-[10px] text-charcoal-800/50">{label}</p>
    </div>
  )
}
