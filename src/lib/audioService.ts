import type { Kural } from '../data/types'

export type AudioSegmentKind = 'kural' | 'explanation' | 'chime'

export interface PlaybackSettings {
  rate: number // 0.75 | 1 | 1.25 | 1.5
  volume: number // 0..1
  gapSeconds: number // pause between kural and explanation / between kurals
  autoPlayExplanation: boolean
  voiceName?: string
}

type EndedHandler = () => void
type ErrorHandler = (message: string) => void

/**
 * audioService — the single abstraction every screen goes through to play
 * sound. Today it plays prerecorded audio when a Kural has audioKuralUrl /
 * audioExplanationUrl, and falls back to Tamil (ta-IN) text-to-speech via
 * the Web Speech API otherwise. Swapping in a professional recorded-audio
 * library later only means populating those URLs in the dataset — no UI
 * or calling code needs to change.
 */
class AudioService {
  private htmlAudio: HTMLAudioElement | null = null
  private settings: PlaybackSettings = {
    rate: 1,
    volume: 1,
    gapSeconds: 2,
    autoPlayExplanation: true,
  }
  private stopped = false

  updateSettings(partial: Partial<PlaybackSettings>) {
    this.settings = { ...this.settings, ...partial }
  }

  getSettings() {
    return this.settings
  }

  listTamilVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return []
    return window.speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('ta'))
  }

  private pickVoice(): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null
    const voices = window.speechSynthesis.getVoices()
    if (!voices.length) return null
    if (this.settings.voiceName) {
      const named = voices.find((v) => v.name === this.settings.voiceName)
      if (named) return named
    }
    const ta = voices.find((v) => v.lang?.toLowerCase().startsWith('ta'))
    if (ta) return ta
    const hi = voices.find((v) => v.lang?.toLowerCase().startsWith('hi'))
    return ta ?? hi ?? voices[0] ?? null
  }

  /** Preload the next segment's audio element so transitions feel seamless. */
  preload(url: string | null) {
    if (!url) return
    const a = new Audio()
    a.preload = 'auto'
    a.src = url
  }

  stop() {
    this.stopped = true
    if (this.htmlAudio) {
      this.htmlAudio.pause()
      this.htmlAudio.src = ''
      this.htmlAudio = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  pause() {
    if (this.htmlAudio) this.htmlAudio.pause()
    if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
      window.speechSynthesis.pause()
    }
  }

  resume() {
    if (this.htmlAudio) this.htmlAudio.play().catch(() => {})
    if (typeof window !== 'undefined' && window.speechSynthesis?.paused) {
      window.speechSynthesis.resume()
    }
  }

  private playUrl(url: string, onEnded: EndedHandler, onError: ErrorHandler): void {
    const audio = new Audio(url)
    audio.playbackRate = this.settings.rate
    audio.volume = this.settings.volume
    this.htmlAudio = audio
    audio.onended = () => onEnded()
    audio.onerror = () => onError('ஆடியோ கிடைக்கவில்லை. தமிழ் குரல் மூலம் கேட்க முயற்சிக்கிறோம்...')
    audio.play().catch(() => onError('ஆடியோ கிடைக்கவில்லை. தமிழ் குரல் மூலம் கேட்க முயற்சிக்கிறோம்...'))
  }

  private speak(text: string, onEnded: EndedHandler, onError: ErrorHandler): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onError('ஆடியோ தற்போது கிடைக்கவில்லை. பின்னர் முயற்சிக்கவும்.')
      return
    }
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ta-IN'
    utter.rate = this.settings.rate
    utter.volume = this.settings.volume
    const voice = this.pickVoice()
    if (voice) utter.voice = voice
    utter.onend = () => onEnded()
    utter.onerror = () => onError('ஆடியோ தற்போது கிடைக்கவில்லை. பின்னர் முயற்சிக்கவும்.')
    window.speechSynthesis.speak(utter)
  }

  private wait(seconds: number): Promise<void> {
    return new Promise((resolve) => {
      if (seconds <= 0) return resolve()
      const id = window.setTimeout(resolve, seconds * 1000)
      // allow stop() to short-circuit the wait via a cheap poll
      const check = window.setInterval(() => {
        if (this.stopped) {
          window.clearTimeout(id)
          window.clearInterval(check)
          resolve()
        }
      }, 100)
      window.setTimeout(() => window.clearInterval(check), seconds * 1000 + 50)
    })
  }

  private playSegment(url: string | null | undefined, text: string): Promise<{ ok: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (this.stopped) return resolve({ ok: false })
      const onEnded = () => resolve({ ok: true })
      const onError = (message: string) => {
        // fall back to TTS once, then give up gracefully
        this.speak(text, () => resolve({ ok: true }), () => resolve({ ok: false, error: message }))
      }
      if (url) {
        this.playUrl(url, onEnded, onError)
      } else {
        this.speak(text, onEnded, (message) => resolve({ ok: false, error: message }))
      }
    })
  }

  /**
   * Plays a full Kural "program": the couplet, a short pause, then the
   * Tamil explanation (if enabled). Resolves when playback of this Kural
   * is fully finished (or has failed permanently).
   */
  async playKuralProgram(
    kural: Kural,
    opts: { onError?: ErrorHandler; onStage?: (stage: 'kural' | 'explanation' | 'done') => void } = {}
  ): Promise<void> {
    this.stopped = false
    opts.onStage?.('kural')
    const kuralResult = await this.playSegment(kural.audioKuralUrl, kural.kuralTamil)
    if (!kuralResult.ok) {
      if (kuralResult.error) opts.onError?.(kuralResult.error)
      return
    }
    if (this.stopped) return

    if (this.settings.autoPlayExplanation) {
      await this.wait(this.settings.gapSeconds)
      if (this.stopped) return
      opts.onStage?.('explanation')
      const explResult = await this.playSegment(kural.audioExplanationUrl, kural.meaningTamil)
      if (!explResult.ok && explResult.error) opts.onError?.(explResult.error)
    }
    opts.onStage?.('done')
  }
}

export const audioService = new AudioService()
