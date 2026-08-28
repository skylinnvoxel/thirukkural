import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Kural } from '../data/types'
import { getAllKurals, getKuralByNumber, getKuralsByChapter } from '../data/kuralRepository'
import { audioService } from '../lib/audioService'
import { droneService, DRONE_NOTES } from '../lib/droneService'
import { localStore } from '../store/localStore'

function rootFreqFor(noteLabel: string): number {
  return DRONE_NOTES.find((n) => n.label === noteLabel)?.freq ?? DRONE_NOTES[0].freq
}

export type ListeningMode = 'single' | 'chapter' | 'section' | 'timer' | 'random'
export type PlaybackStage = 'idle' | 'kural' | 'explanation' | 'paused' | 'finished'

interface PlaybackState {
  currentNumber: number
  mode: ListeningMode
  stage: PlaybackStage
  isPlaying: boolean
  isSessionActive: boolean
  timerTotalSeconds: number
  timerRemainingSeconds: number
  progressCount: number // kurals played this session
  errorMessage: string | null
  miniPlayerVisible: boolean
}

interface PlaybackApi extends PlaybackState {
  currentKural: Kural | undefined
  playSingle: (number: number) => void
  togglePlayPause: () => void
  next: () => void
  previous: () => void
  replay: () => void
  stopSession: () => void
  startTimerSession: (minutes: number, startNumber?: number) => void
  startChapterSession: (chapterNumber: number) => void
  startRandomSession: (minutes: number) => void
  dismissError: () => void
}

const PlaybackContext = createContext<PlaybackApi | null>(null)

function randomKuralNumber(exclude?: number): number {
  const all = getAllKurals()
  if (!all.length) return 1
  let pick = all[Math.floor(Math.random() * all.length)].number
  if (all.length > 1) {
    while (pick === exclude) pick = all[Math.floor(Math.random() * all.length)].number
  }
  return pick
}

export function PlaybackProvider({ children }: { children: ReactNode }) {
  const settings = localStore.getSettings()
  const [state, setState] = useState<PlaybackState>({
    currentNumber: localStore.getLastPlayed() ?? getAllKurals()[0]?.number ?? 1,
    mode: 'single',
    stage: 'idle',
    isPlaying: false,
    isSessionActive: false,
    timerTotalSeconds: 0,
    timerRemainingSeconds: 0,
    progressCount: 0,
    errorMessage: null,
    miniPlayerVisible: false,
  })

  const timerRef = useRef<number | null>(null)
  const listenStartRef = useRef<number>(0)
  const chapterQueueRef = useRef<number[] | null>(null)
  const modeRef = useRef<ListeningMode>('single')

  useEffect(() => {
    audioService.updateSettings({
      rate: settings.playbackRate,
      gapSeconds: settings.gapSeconds,
      autoPlayExplanation: settings.autoPlayExplanation,
      voiceName: settings.voiceName,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clearTicker = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const logCurrentListen = useCallback(() => {
    if (listenStartRef.current) {
      const seconds = Math.round((Date.now() - listenStartRef.current) / 1000)
      if (seconds > 1) localStore.logListen(state.currentNumber, seconds)
    }
    listenStartRef.current = 0
  }, [state.currentNumber])

  const updateMediaSession = useCallback((kural: Kural | undefined, playing: boolean) => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !kural) return
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `குறள் ${String(kural.number).padStart(4, '0')}`,
        artist: kural.chapterNameTamil,
        album: 'திருக்குறள்',
      })
      navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
    } catch {
      // MediaSession not fully supported — non-fatal
    }
  }, [])

  const pickNextNumber = useCallback((current: number): number | null => {
    const mode = modeRef.current
    if (mode === 'random') return randomKuralNumber(current)
    if (mode === 'chapter' && chapterQueueRef.current) {
      const idx = chapterQueueRef.current.indexOf(current)
      const nxt = chapterQueueRef.current[idx + 1]
      return nxt ?? null
    }
    const all = getAllKurals()
    const idx = all.findIndex((k) => k.number === current)
    if (idx === -1 || idx === all.length - 1) return null
    return all[idx + 1].number
  }, [])

  const playToken = useRef(0)

  const runProgram = useCallback(
    (number: number) => {
      const kural = getKuralByNumber(number)
      if (!kural) return
      const myToken = ++playToken.current
      listenStartRef.current = Date.now()
      setState((s) => ({ ...s, currentNumber: number, isPlaying: true, stage: 'kural', errorMessage: null }))
      updateMediaSession(kural, true)

      const s = localStore.getSettings()
      if (s.droneEnabled) {
        if (!droneService.isRunning()) {
          droneService.start(s.droneStyle, rootFreqFor(s.droneNote), s.droneVolume)
        } else {
          droneService.setVolume(s.droneVolume)
        }
      }

      // preload the likely-next segment for a seamless transition
      const upcoming = pickNextNumber(number)
      if (upcoming) {
        const nk = getKuralByNumber(upcoming)
        if (nk?.audioKuralUrl) audioService.preload(nk.audioKuralUrl)
      }

      audioService.playKuralProgram(kural, {
        onStage: (stage) => {
          if (playToken.current !== myToken) return
          setState((s) => ({ ...s, stage: stage === 'done' ? 'finished' : stage }))
        },
        onError: (message) => {
          if (playToken.current !== myToken) return
          setState((s) => ({ ...s, errorMessage: message }))
        },
      }).then(() => {
        if (playToken.current !== myToken) return
        logCurrentListen()
        setState((s) => ({ ...s, progressCount: s.progressCount + 1 }))

        const isSession = modeRef.current !== 'single'
        if (!isSession) {
          droneService.stop()
          setState((s) => ({ ...s, isPlaying: false, stage: 'finished' }))
          updateMediaSession(kural, false)
          return
        }
        const nextNum = pickNextNumber(number)
        if (!nextNum) {
          droneService.stop()
          setState((s) => ({ ...s, isPlaying: false, isSessionActive: false, stage: 'finished' }))
          updateMediaSession(kural, false)
          return
        }
        runProgram(nextNum)
      })
    },
    [logCurrentListen, pickNextNumber, updateMediaSession]
  )

  const stopSession = useCallback(() => {
    playToken.current++
    audioService.stop()
    droneService.stop()
    clearTicker()
    logCurrentListen()
    setState((s) => ({
      ...s,
      isPlaying: false,
      isSessionActive: false,
      stage: 'idle',
      timerRemainingSeconds: 0,
      timerTotalSeconds: 0,
      miniPlayerVisible: false,
    }))
  }, [logCurrentListen])

  const playSingle = useCallback(
    (number: number) => {
      modeRef.current = 'single'
      chapterQueueRef.current = null
      clearTicker()
      setState((s) => ({
        ...s,
        mode: 'single',
        isSessionActive: false,
        timerTotalSeconds: 0,
        timerRemainingSeconds: 0,
        miniPlayerVisible: false,
      }))
      runProgram(number)
    },
    [runProgram]
  )

  const startTimerSession = useCallback(
    (minutes: number, startNumber?: number) => {
      modeRef.current = 'timer'
      chapterQueueRef.current = null
      const totalSeconds = Math.max(1, Math.round(minutes * 60))
      clearTicker()
      setState((s) => ({
        ...s,
        mode: 'timer',
        isSessionActive: true,
        progressCount: 0,
        timerTotalSeconds: totalSeconds,
        timerRemainingSeconds: totalSeconds,
        miniPlayerVisible: true,
      }))
      timerRef.current = window.setInterval(() => {
        setState((s) => {
          const remaining = s.timerRemainingSeconds - 1
          if (remaining <= 0) {
            clearTicker()
            playToken.current++
            audioService.stop()
            droneService.stop()
            logCurrentListen()
            return { ...s, timerRemainingSeconds: 0, isPlaying: false, isSessionActive: false, stage: 'finished' }
          }
          return { ...s, timerRemainingSeconds: remaining }
        })
      }, 1000)
      runProgram(startNumber ?? state.currentNumber)
    },
    [runProgram, state.currentNumber, logCurrentListen]
  )

  const startChapterSession = useCallback(
    (chapterNumber: number) => {
      const kurals = getKuralsByChapter(chapterNumber)
      if (!kurals.length) return
      modeRef.current = 'chapter'
      chapterQueueRef.current = kurals.map((k) => k.number)
      clearTicker()
      setState((s) => ({ ...s, mode: 'chapter', isSessionActive: true, progressCount: 0, miniPlayerVisible: true }))
      runProgram(kurals[0].number)
    },
    [runProgram]
  )

  const startRandomSession = useCallback(
    (minutes: number) => {
      modeRef.current = 'random'
      chapterQueueRef.current = null
      const totalSeconds = Math.max(1, Math.round(minutes * 60))
      clearTicker()
      setState((s) => ({
        ...s,
        mode: 'random',
        isSessionActive: true,
        progressCount: 0,
        timerTotalSeconds: totalSeconds,
        timerRemainingSeconds: totalSeconds,
        miniPlayerVisible: true,
      }))
      timerRef.current = window.setInterval(() => {
        setState((s) => {
          const remaining = s.timerRemainingSeconds - 1
          if (remaining <= 0) {
            clearTicker()
            playToken.current++
            audioService.stop()
            droneService.stop()
            logCurrentListen()
            return { ...s, timerRemainingSeconds: 0, isPlaying: false, isSessionActive: false, stage: 'finished' }
          }
          return { ...s, timerRemainingSeconds: remaining }
        })
      }, 1000)
      runProgram(randomKuralNumber())
    },
    [runProgram, logCurrentListen]
  )

  const togglePlayPause = useCallback(() => {
    setState((s) => {
      const willPlay = !s.isPlaying
      if (willPlay) {
        audioService.resume()
        if (droneService.isRunning()) droneService.setVolume(localStore.getSettings().droneVolume)
      } else {
        audioService.pause()
        if (droneService.isRunning()) droneService.setVolume(0)
      }
      updateMediaSession(getKuralByNumber(s.currentNumber), willPlay)
      return { ...s, isPlaying: willPlay, stage: willPlay ? s.stage : 'paused' }
    })
  }, [updateMediaSession])

  const next = useCallback(() => {
    const nextNum = pickNextNumber(state.currentNumber) ?? state.currentNumber + 1
    playToken.current++
    audioService.stop()
    logCurrentListen()
    runProgram(nextNum)
  }, [pickNextNumber, runProgram, state.currentNumber, logCurrentListen])

  const previous = useCallback(() => {
    const all = getAllKurals()
    const idx = all.findIndex((k) => k.number === state.currentNumber)
    const prevNum = idx > 0 ? all[idx - 1].number : state.currentNumber
    playToken.current++
    audioService.stop()
    logCurrentListen()
    runProgram(prevNum)
  }, [state.currentNumber, runProgram, logCurrentListen])

  const replay = useCallback(() => {
    playToken.current++
    audioService.stop()
    runProgram(state.currentNumber)
  }, [state.currentNumber, runProgram])

  const dismissError = useCallback(() => setState((s) => ({ ...s, errorMessage: null })), [])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    try {
      navigator.mediaSession.setActionHandler('play', () => togglePlayPause())
      navigator.mediaSession.setActionHandler('pause', () => togglePlayPause())
      navigator.mediaSession.setActionHandler('nexttrack', () => next())
      navigator.mediaSession.setActionHandler('previoustrack', () => previous())
    } catch {
      // ignore unsupported actions
    }
  }, [togglePlayPause, next, previous])

  const currentKural = useMemo(() => getKuralByNumber(state.currentNumber), [state.currentNumber])

  const value: PlaybackApi = {
    ...state,
    currentKural,
    playSingle,
    togglePlayPause,
    next,
    previous,
    replay,
    stopSession,
    startTimerSession,
    startChapterSession,
    startRandomSession,
    dismissError,
  }

  return <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>
}

export function usePlayback() {
  const ctx = useContext(PlaybackContext)
  if (!ctx) throw new Error('usePlayback must be used within PlaybackProvider')
  return ctx
}
