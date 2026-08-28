import { usePlayback } from '../store/PlaybackContext'

export default function ErrorBanner() {
  const pb = usePlayback()
  if (!pb.errorMessage) return null
  return (
    <div className="fixed top-2 inset-x-2 z-50 rounded-xl bg-maroon-900 text-cream-50 px-4 py-3 text-sm shadow-lg flex items-start gap-2">
      <span className="mt-0.5">⚠️</span>
      <p className="flex-1">{pb.errorMessage}</p>
      <button onClick={pb.dismissError} aria-label="மூடு" className="text-gold-300 font-bold px-1">
        ✕
      </button>
    </div>
  )
}
