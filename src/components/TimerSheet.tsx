import { useState } from 'react'

const PRESETS = [15, 30, 45, 60, 90, 120]

export default function TimerSheet({
  onClose,
  onStart,
}: {
  onClose: () => void
  onStart: (minutes: number) => void
}) {
  const [custom, setCustom] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal-900/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-3xl bg-cream-50 p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] animate-[slideup_.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-gold-400/50" />
        <h2 className="font-serif-ta text-lg font-bold text-maroon-800 mb-1">தொடர்ந்து கேட்கும் நேரம்</h2>
        <p className="text-sm text-charcoal-800/60 mb-4">எவ்வளவு நேரம் தொடர்ந்து கேட்க விரும்புகிறீர்கள்?</p>
        <div className="grid grid-cols-3 gap-2.5">
          {PRESETS.map((m) => (
            <button
              key={m}
              onClick={() => onStart(m)}
              className="rounded-xl border-2 border-gold-400/40 bg-white py-3 text-center font-semibold text-maroon-800 active:bg-gold-100"
            >
              {m} நிமிடங்கள்
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <input
            type="number"
            min={1}
            placeholder="தனிப்பயன் நிமிடங்கள்"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="flex-1 rounded-xl border-2 border-gold-400/40 bg-white px-3 py-2.5 text-sm outline-none focus:border-maroon-600"
          />
          <button
            disabled={!custom || Number(custom) <= 0}
            onClick={() => onStart(Number(custom))}
            className="rounded-xl bg-maroon-700 px-4 py-2.5 text-sm font-semibold text-cream-50 disabled:opacity-40"
          >
            தொடங்கு
          </button>
        </div>
        <button onClick={onClose} className="mt-4 w-full text-center text-sm text-charcoal-800/50 py-2">
          ரத்து செய்க
        </button>
      </div>
    </div>
  )
}
