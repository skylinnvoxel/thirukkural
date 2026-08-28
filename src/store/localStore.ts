export interface HistoryEntry {
  number: number
  playedAt: number // epoch ms
  seconds: number
}

export interface AppSettings {
  playbackRate: number
  autoPlayExplanation: boolean
  repeatKural: boolean
  gapSeconds: number
  defaultTimerMinutes: number
  autoNext: boolean
  fontSize: 'sm' | 'md' | 'lg' | 'xl'
  darkMode: boolean
  tamilOnly: boolean
  englishAssist: boolean
  voiceName?: string
  droneEnabled: boolean
  droneStyle: 'shruti' | 'tambura'
  droneNote: string // e.g. 'C3'
  droneVolume: number // 0..1
}

const KEYS = {
  favorites: 'tk.favorites',
  bookmarks: 'tk.bookmarks',
  history: 'tk.history',
  settings: 'tk.settings',
  lastPlayed: 'tk.lastPlayed',
} as const

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable (private mode / quota) — fail silently
  }
}

export const defaultSettings: AppSettings = {
  playbackRate: 1,
  autoPlayExplanation: true,
  repeatKural: false,
  gapSeconds: 2,
  defaultTimerMinutes: 30,
  autoNext: true,
  fontSize: 'lg',
  darkMode: false,
  tamilOnly: true,
  englishAssist: false,
  droneEnabled: false,
  droneStyle: 'shruti',
  droneNote: 'C3',
  droneVolume: 0.12,
}

export const localStore = {
  getFavorites(): number[] {
    return read(KEYS.favorites, [])
  },
  toggleFavorite(n: number): number[] {
    const cur = new Set(this.getFavorites())
    cur.has(n) ? cur.delete(n) : cur.add(n)
    const arr = Array.from(cur).sort((a, b) => a - b)
    write(KEYS.favorites, arr)
    return arr
  },
  getBookmarks(): number[] {
    return read(KEYS.bookmarks, [])
  },
  toggleBookmark(n: number): number[] {
    const cur = new Set(this.getBookmarks())
    cur.has(n) ? cur.delete(n) : cur.add(n)
    const arr = Array.from(cur).sort((a, b) => a - b)
    write(KEYS.bookmarks, arr)
    return arr
  },
  getHistory(): HistoryEntry[] {
    return read(KEYS.history, [])
  },
  logListen(number: number, seconds: number) {
    const hist = this.getHistory()
    hist.unshift({ number, playedAt: Date.now(), seconds })
    write(KEYS.history, hist.slice(0, 500))
    write(KEYS.lastPlayed, number)
  },
  clearHistory() {
    write(KEYS.history, [])
  },
  getLastPlayed(): number | null {
    return read<number | null>(KEYS.lastPlayed, null)
  },
  getSettings(): AppSettings {
    return { ...defaultSettings, ...read(KEYS.settings, {}) }
  },
  saveSettings(partial: Partial<AppSettings>): AppSettings {
    const merged = { ...this.getSettings(), ...partial }
    write(KEYS.settings, merged)
    return merged
  },
  resetAll() {
    write(KEYS.favorites, [])
    write(KEYS.bookmarks, [])
    write(KEYS.history, [])
    write(KEYS.settings, defaultSettings)
  },
  todayStats(): { count: number; minutes: number } {
    const hist = this.getHistory()
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const today = hist.filter((h) => h.playedAt >= startOfDay.getTime())
    const seconds = today.reduce((sum, h) => sum + h.seconds, 0)
    return { count: today.length, minutes: Math.round(seconds / 60) }
  },
}
