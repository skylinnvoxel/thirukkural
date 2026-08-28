/**
 * droneService — a synthesized Tambura / Shruti-box style background drone.
 *
 * This is generated entirely with the Web Audio API (no external audio
 * files), so it works offline, has no licensing concerns, and layers under
 * the Kural narration / TTS at a low volume without needing any asset
 * pipeline. Two styles are offered:
 *
 *  - "shruti": a continuous sustained Sa–Pa–Sa drone, like a shruti box /
 *    harmonium drone reed. Smooth and unobtrusive — good default.
 *  - "tambura": four "strings" (Pa–Sa–Sa–Sa) that pluck and decay on a
 *    loose, slightly randomised cycle, approximating the shimmering,
 *    slowly-cycling character of a tambura.
 */

export type DroneStyle = 'shruti' | 'tambura'

// One octave of common Sa (root/tonic) choices, roughly tambura range.
export const DRONE_NOTES: { label: string; freq: number }[] = [
  { label: 'C3', freq: 130.81 },
  { label: 'C#3', freq: 138.59 },
  { label: 'D3', freq: 146.83 },
  { label: 'D#3', freq: 155.56 },
  { label: 'E3', freq: 164.81 },
  { label: 'F3', freq: 174.61 },
  { label: 'F#3', freq: 185.0 },
  { label: 'G3', freq: 196.0 },
]

const FIFTH_RATIO = 3 / 2 // Sa -> Pa

class DroneService {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private activeNodes: { stop: () => void }[] = []
  private pluckTimer: number | null = null
  private running = false
  private currentStyle: DroneStyle = 'shruti'
  private currentRootFreq = DRONE_NOTES[0].freq
  private currentVolume = 0.12

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0
      this.master.connect(this.ctx.destination)
    }
    return this.ctx
  }

  isRunning() {
    return this.running
  }

  setVolume(v: number) {
    this.currentVolume = Math.min(1, Math.max(0, v))
    if (this.master && this.ctx && this.running) {
      this.master.gain.linearRampToValueAtTime(this.currentVolume, this.ctx.currentTime + 0.4)
    }
  }

  private teardownVoices() {
    for (const n of this.activeNodes) n.stop()
    this.activeNodes = []
    if (this.pluckTimer) {
      window.clearTimeout(this.pluckTimer)
      this.pluckTimer = null
    }
  }

  private startShruti(rootFreq: number) {
    const ctx = this.ensureContext()
    const master = this.master!
    const freqs = [rootFreq, rootFreq * FIFTH_RATIO, rootFreq * 2]
    for (const f of freqs) {
      for (const detune of [-3, 0, 3]) {
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.value = f
        osc.detune.value = detune
        const filt = ctx.createBiquadFilter()
        filt.type = 'lowpass'
        filt.frequency.value = 900
        filt.Q.value = 0.4
        const gain = ctx.createGain()
        gain.gain.value = 0
        const target = f === rootFreq ? 0.5 : f > rootFreq * 1.9 ? 0.18 : 0.3
        gain.gain.linearRampToValueAtTime(target, ctx.currentTime + 1.6)

        // slow amplitude "breathing" so it doesn't feel static
        const lfo = ctx.createOscillator()
        lfo.frequency.value = 0.06 + Math.random() * 0.05
        const lfoGain = ctx.createGain()
        lfoGain.gain.value = target * 0.15
        lfo.connect(lfoGain)
        lfoGain.connect(gain.gain)
        lfo.start()

        osc.connect(filt)
        filt.connect(gain)
        gain.connect(master)
        osc.start()

        this.activeNodes.push({
          stop: () => {
            gain.gain.cancelScheduledValues(ctx.currentTime)
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
            osc.stop(ctx.currentTime + 0.6)
            lfo.stop(ctx.currentTime + 0.6)
          },
        })
      }
    }
  }

  private startTambura(rootFreq: number) {
    const ctx = this.ensureContext()
    const master = this.master!
    // Traditional tambura order: Pa (or Ma) – Sa – Sa – Sa (upper octave on last string)
    const strings = [rootFreq * FIFTH_RATIO, rootFreq, rootFreq, rootFreq * 2]

    const pluckOne = (freq: number, delaySec = 0) => {
      const t0 = ctx.currentTime + delaySec
      const fundamental = ctx.createOscillator()
      fundamental.type = 'triangle'
      fundamental.frequency.value = freq
      const overtone = ctx.createOscillator()
      overtone.type = 'sine'
      overtone.frequency.value = freq * 2.01 // slightly detuned octave = subtle "jivari" buzz
      const filt = ctx.createBiquadFilter()
      filt.type = 'lowpass'
      filt.frequency.value = 1800

      const gain = ctx.createGain()
      const overtoneGain = ctx.createGain()
      overtoneGain.gain.value = 0.25

      gain.gain.setValueAtTime(0, t0)
      gain.gain.linearRampToValueAtTime(0.55, t0 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 3.6)

      fundamental.connect(filt)
      overtone.connect(overtoneGain)
      overtoneGain.connect(filt)
      filt.connect(gain)
      gain.connect(master)

      fundamental.start(t0)
      overtone.start(t0)
      fundamental.stop(t0 + 3.8)
      overtone.stop(t0 + 3.8)
    }

    const cycle = () => {
      if (!this.running) return
      strings.forEach((f, i) => pluckOne(f, i * 0.18 + Math.random() * 0.03))
      // full cycle roughly every ~3.4-3.9s, like a real tambura's rolling pluck
      this.pluckTimer = window.setTimeout(cycle, 3400 + Math.random() * 500)
    }
    cycle()
  }

  async start(style: DroneStyle, rootFreq: number, volume: number) {
    const ctx = this.ensureContext()
    if (ctx.state === 'suspended') await ctx.resume()
    this.teardownVoices()
    this.currentStyle = style
    this.currentRootFreq = rootFreq
    this.currentVolume = volume
    this.running = true

    if (style === 'shruti') this.startShruti(rootFreq)
    else this.startTambura(rootFreq)

    this.master!.gain.cancelScheduledValues(ctx.currentTime)
    this.master!.gain.setValueAtTime(this.master!.gain.value, ctx.currentTime)
    this.master!.gain.linearRampToValueAtTime(volume, ctx.currentTime + 1.2)
  }

  stop() {
    if (!this.running) return
    this.running = false
    if (this.ctx && this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime)
      this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6)
    }
    window.setTimeout(() => this.teardownVoices(), 700)
  }

  /** Re-apply current settings (e.g. user changed note/style while playing). */
  restartIfRunning(style: DroneStyle, rootFreq: number, volume: number) {
    if (!this.running) return
    if (style === this.currentStyle && rootFreq === this.currentRootFreq) {
      this.setVolume(volume)
      return
    }
    this.start(style, rootFreq, volume)
  }
}

export const droneService = new DroneService()
