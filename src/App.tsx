import { Route, Routes } from 'react-router-dom'
import { PlaybackProvider } from './store/PlaybackContext'
import BottomNav from './components/BottomNav'
import MiniPlayer from './components/MiniPlayer'
import ErrorBanner from './components/ErrorBanner'
import Home from './screens/Home'
import KuralDetail from './screens/KuralDetail'
import Chapters from './screens/Chapters'
import ChapterDetail from './screens/ChapterDetail'
import RangeView from './screens/RangeView'
import Search from './screens/Search'
import Mine from './screens/Mine'
import Settings from './screens/Settings'

export default function App() {
  return (
    <PlaybackProvider>
      <div className="min-h-dvh bg-cream-100 text-charcoal-900">
        <ErrorBanner />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/kural/:number" element={<KuralDetail />} />
          <Route path="/chapters" element={<Chapters />} />
          <Route path="/chapter/:chapterNumber" element={<ChapterDetail />} />
          <Route path="/range/:range" element={<RangeView />} />
          <Route path="/search" element={<Search />} />
          <Route path="/mine" element={<Mine />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <MiniPlayer />
        <BottomNav />
      </div>
    </PlaybackProvider>
  )
}
