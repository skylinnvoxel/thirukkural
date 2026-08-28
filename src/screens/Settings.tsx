import { useState } from 'react'
import { localStore } from '../store/localStore'
import type { AppSettings } from '../store/localStore'
import { audioService } from '../lib/audioService'
import { droneService, DRONE_NOTES } from '../lib/droneService'

const GAP_OPTIONS = [1, 2, 3, 5]
const TIMER_OPTIONS = [15, 30, 45, 60, 90, 120]

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(localStore.getSettings())
  const [confirmReset, setConfirmReset] = useState(false)

  const update = (partial: Partial<AppSettings>) => {
    const next = localStore.saveSettings(partial)
    setSettings(next)
    audioService.updateSettings({
      rate: next.playbackRate,
      gapSeconds: next.gapSeconds,
      autoPlayExplanation: next.autoPlayExplanation,
      voiceName: next.voiceName,
    })

    const rootFreq = DRONE_NOTES.find((n) => n.label === next.droneNote)?.freq ?? DRONE_NOTES[0].freq
    if ('droneEnabled' in partial) {
      if (next.droneEnabled) previewDrone(next)
      else droneService.stop()
    } else if (droneService.isRunning()) {
      droneService.restartIfRunning(next.droneStyle, rootFreq, next.droneVolume)
    }
  }

  const previewDrone = (s: AppSettings) => {
    const rootFreq = DRONE_NOTES.find((n) => n.label === s.droneNote)?.freq ?? DRONE_NOTES[0].freq
    droneService.start(s.droneStyle, rootFreq, s.droneVolume)
  }

  return (
    <div className="min-h-full bg-cream-100 pb-28">
      <header className="px-5 pt-6 pb-4">
        <h1 className="font-serif-ta text-2xl font-bold text-maroon-800">அமைப்புகள்</h1>
      </header>

      <Section title="ஆடியோ">
        <Row label="விளக்கத்தை தானாக இயக்கு">
          <Toggle checked={settings.autoPlayExplanation} onChange={(v) => update({ autoPlayExplanation: v })} />
        </Row>
        <Row label="குறளை மீண்டும் இயக்கு">
          <Toggle checked={settings.repeatKural} onChange={(v) => update({ repeatKural: v })} />
        </Row>
        <Row label="குறள்களுக்கு இடையில் இடைவெளி">
          <select
            value={settings.gapSeconds}
            onChange={(e) => update({ gapSeconds: Number(e.target.value) })}
            className="rounded-lg border border-gold-400/40 bg-white px-2 py-1 text-sm"
          >
            {GAP_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g} வினாடி
              </option>
            ))}
          </select>
        </Row>
      </Section>

      <Section title="பின்னணி இசை (தம்புரா / சுருதி பெட்டி)">
        <Row label="பின்னணி இசையை இயக்கு">
          <Toggle checked={settings.droneEnabled} onChange={(v) => update({ droneEnabled: v })} />
        </Row>
        <Row label="பாணி">
          <select
            value={settings.droneStyle}
            onChange={(e) => update({ droneStyle: e.target.value as AppSettings['droneStyle'] })}
            className="rounded-lg border border-gold-400/40 bg-white px-2 py-1 text-sm"
          >
            <option value="shruti">சுருதி பெட்டி (தொடர் ஒலி)</option>
            <option value="tambura">தம்புரா (மீட்டும் நரம்பு)</option>
          </select>
        </Row>
        <Row label="ஸ்வரம் (Sa)">
          <select
            value={settings.droneNote}
            onChange={(e) => update({ droneNote: e.target.value })}
            className="rounded-lg border border-gold-400/40 bg-white px-2 py-1 text-sm"
          >
            {DRONE_NOTES.map((n) => (
              <option key={n.label} value={n.label}>
                {n.label}
              </option>
            ))}
          </select>
        </Row>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-charcoal-900">ஒலி அளவு</span>
            <span className="text-xs text-charcoal-800/50">{Math.round(settings.droneVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.4}
            step={0.01}
            value={settings.droneVolume}
            onChange={(e) => update({ droneVolume: Number(e.target.value) })}
            className="w-full accent-maroon-700"
          />
        </div>
        <p className="px-4 pb-3 text-xs text-charcoal-800/45">
          குறள் மற்றும் விளக்கத்துடன் மென்மையாக இயங்கும் பின்னணி இசை. கேட்கும்போது தானாக இயங்கும்/நிற்கும்.
        </p>
      </Section>

      <Section title="தொடர்ந்து கேட்பது">
        <Row label="இயல்புநிலை நேரம்">
          <select
            value={settings.defaultTimerMinutes}
            onChange={(e) => update({ defaultTimerMinutes: Number(e.target.value) })}
            className="rounded-lg border border-gold-400/40 bg-white px-2 py-1 text-sm"
          >
            {TIMER_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t} நிமிடங்கள்
              </option>
            ))}
          </select>
        </Row>
        <Row label="தானாக அடுத்த குறளுக்கு செல்">
          <Toggle checked={settings.autoNext} onChange={(v) => update({ autoNext: v })} />
        </Row>
      </Section>

      <Section title="காட்சி">
        <Row label="எழுத்துரு அளவு">
          <select
            value={settings.fontSize}
            onChange={(e) => update({ fontSize: e.target.value as AppSettings['fontSize'] })}
            className="rounded-lg border border-gold-400/40 bg-white px-2 py-1 text-sm"
          >
            <option value="sm">சிறியது</option>
            <option value="md">நடுத்தரம்</option>
            <option value="lg">பெரியது</option>
            <option value="xl">மிகப் பெரியது</option>
          </select>
        </Row>
        <Row label="இருண்ட பயன்முறை">
          <Toggle checked={settings.darkMode} onChange={(v) => update({ darkMode: v })} />
        </Row>
        <Row label="தமிழ் மட்டும் பயன்முறை">
          <Toggle checked={settings.tamilOnly} onChange={(v) => update({ tamilOnly: v })} />
        </Row>
        <Row label="ஆங்கில உதவி">
          <Toggle checked={settings.englishAssist} onChange={(v) => update({ englishAssist: v })} />
        </Row>
      </Section>

      <Section title="தரவு">
        <button
          onClick={() => {
            localStore.clearHistory()
            alert('கேட்ட வரலாறு அழிக்கப்பட்டது.')
          }}
          className="w-full text-left rounded-xl bg-white border border-gold-400/30 px-4 py-3 text-sm text-maroon-700 font-medium"
        >
          கேட்ட வரலாற்றை அழிக்க
        </button>
        <button
          onClick={() => setConfirmReset(true)}
          className="w-full text-left rounded-xl bg-white border border-gold-400/30 px-4 py-3 text-sm text-maroon-700 font-medium"
        >
          அமைப்புகளை மீட்டமைக்க
        </button>
      </Section>

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/50 px-6" onClick={() => setConfirmReset(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-cream-50 p-5" onClick={(e) => e.stopPropagation()}>
            <p className="font-semibold text-maroon-800">அனைத்து அமைப்புகள், விருப்பங்கள் மற்றும் வரலாறு அழிக்கப்படும். தொடரவா?</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirmReset(false)} className="flex-1 rounded-xl bg-gold-100 py-2.5 text-sm font-semibold text-maroon-700">
                ரத்து
              </button>
              <button
                onClick={() => {
                  localStore.resetAll()
                  setSettings(localStore.getSettings())
                  setConfirmReset(false)
                }}
                className="flex-1 rounded-xl bg-maroon-700 py-2.5 text-sm font-semibold text-cream-50"
              >
                மீட்டமைக்க
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-5 mt-4">
      <h2 className="text-xs font-bold uppercase tracking-wide text-gold-600 mb-2">{title}</h2>
      <div className="rounded-2xl bg-white border border-gold-400/30 divide-y divide-gold-400/15 overflow-hidden">
        {children}
      </div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm text-charcoal-900">{label}</span>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`h-6 w-11 rounded-full transition-colors relative ${checked ? 'bg-maroon-700' : 'bg-gold-400/30'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
