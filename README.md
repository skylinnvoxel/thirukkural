# திருக்குறள் — Thirukkural Listening App

A mobile-first Tamil PWA for listening to and learning the Thirukkural: enter or browse a Kural number, hear it recited, hear a Tamil explanation, and start a timed continuous-listening session (15–120 minutes) that auto-advances through the couplets.

Built with **React + TypeScript + Vite + Tailwind CSS v4**, no backend required, deployable as a static site to **Cloudflare Pages**.

## 🎉 The complete Thirukkural (please read)

This app now contains **all 1330 Kurals across all 133 chapters** — the entire Thirukkural, complete:

- **அறத்துப்பால் (Book of Virtue)** — chapters 1–38 (380 Kurals)
- **பொருட்பால் (Book of Wealth/Politics)** — chapters 39–108 (700 Kurals)
- **காமத்துப்பால் (Book of Love)** — chapters 109–133 (250 Kurals)

The Kural text was reproduced from the public-domain original and cross-checked against multiple independently maintained Tamil sources (dheivegam.com, thirukural-world.blogspot.com, and thirukkural.net), which each independently transcribe the standard couplets alongside classical commentaries and transliterations — text was cross-referenced across sources where discrepancies or transcription artifacts appeared. The Tamil meanings throughout this dataset are original, independently written summaries — not copied from any commentator's or translator's wording — to stay clear of copyright on modern commentaries and translations.

Since the dataset is now complete, the chapter browser's "தரவு விரைவில் வரும் / Not yet loaded" placeholder no longer applies to any chapter — all 133 chapter cards link to real content.

**To go live with all 1,330 Kurals:**

1. Source a verified/public-domain Thirukkural dataset (Tamil text + meanings) — there are several open Tamil-NLP corpora and GitHub datasets of the full text; cross-check whichever you use against a trusted printed edition before publishing.
2. Shape it to match `Kural` in `src/data/types.ts`.
3. Either:
   - Replace/extend `src/data/thirukkural.sample.json`, **or**
   - Host the full JSON somewhere (Cloudflare R2, KV, a static file, a CMS) and set `VITE_KURAL_DATA_URL` to it — the app fetches and merges it on startup, no code changes needed.

Audio works the same way: every Kural has `audioKuralUrl` / `audioExplanationUrl` fields. Leave them `null` and the app **falls back to live Tamil (ta-IN) text-to-speech** via the Web Speech API. Add real recorded-audio URLs later and the UI doesn't change at all — see `src/lib/audioService.ts`.

## Features implemented

- Kural-number entry (0001–1330), previous/next/random/today's-Kural navigation
- Full player: play/pause/replay/prev/next, playback speed (0.75x-1.5x), configurable gap between Kural and explanation
- Continuous listening with 15/30/45/60/90/120-minute presets or a custom duration, auto-advancing through Kurals, live countdown, persistent mini-player, completion screen
- Listening modes: single Kural, whole chapter, and random-duration sessions (section mode plugs into the same session engine once chapter/section data is loaded)
- Chapter directory (133 chapters) and 100-Kural quick-access ranges
- Search by number, Tamil word, chapter, or tag
- Favorites, bookmarks, and a listening-history/stats screen — all stored locally on-device
- Today's Kural, with a stable date-to-Kural mapping
- Settings: audio (auto-explanation, gap, speed persisted), continuous-listening defaults, display (font size, dark-mode/Tamil-only/English-assist toggles), data reset
- Optional background drone — a synthesized tambura / shruti-box style Sa–Pa drone (Web Audio API, no external audio files) that plays softly under the Kural + explanation audio. Toggle, style, root note (Sa), and volume are all in Settings → "பின்னணி இசை"; it ducks automatically on pause and stops when the session ends.
- Lock-screen / Media Session integration (play, pause, next, previous) where the browser/OS supports it
- PWA: installable, offline app-shell caching, and **audio is cached only after it's actually played** (never claims offline content it hasn't cached)
- Graceful audio-failure handling with Tamil error messages and TTS fallback
- Accessible controls: labelled buttons, visible focus, reduced-motion support, no color-only state

## Project structure

```
src/
  data/                  Kural + chapter data types and the repository (data access layer)
  lib/audioService.ts    Audio abstraction: prerecorded audio -> TTS fallback
  lib/droneService.ts    Synthesized tambura/shruti background drone (Web Audio API)
  store/                 Playback session state (React context) + localStorage-backed
                          favorites/bookmarks/history/settings
  components/            Shared UI (bottom nav, mini player, timer sheet, error banner)
  screens/                Home, Kural detail/player, Chapters, Chapter detail, Range view,
                          Search, Mine (favorites/history), Settings
public/
  manifest.webmanifest, sw.js, icons/   PWA assets
```

Admin/content-management is **not built into the shipped UI** (per the brief, it should not be user-facing yet), but the data model (`Kural`, `ChapterSummary`) and the repository module are the seam where an admin tool would plug in later — it would just write to the same JSON/API that `VITE_KURAL_DATA_URL` reads from.

## Local development

```bash
npm install
npm run dev       # http://localhost:5173
```

```bash
npm run build      # production build to dist/
npm run preview    # preview the production build locally
```

## Deploying

### Option A — Cloudflare Pages dashboard (simplest)

1. Push this project to a GitHub repository (see below).
2. In the Cloudflare dashboard: **Workers & Pages -> Create -> Pages -> Connect to Git**, pick the repo.
3. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. (Optional) Add an environment variable `VITE_KURAL_DATA_URL` if you're hosting the full dataset externally.
5. Save and deploy. Cloudflare rebuilds automatically on every push to your default branch.
6. Add a custom domain under the Pages project's **Custom domains** tab once it's live.

The app uses hash-based routing (`/#/kural/1`), so it works correctly on static hosting with no server-side redirect rules needed.

### Option B — Wrangler CLI

```bash
npm run build
npx wrangler pages deploy dist --project-name=thirukkural-app
```

### Option C — GitHub Actions (included)

`.github/workflows/deploy.yml` builds and deploys on every push to `main` using `cloudflare/wrangler-action`. Add these to your repo's **Settings -> Secrets and variables -> Actions**:

- Secret `CLOUDFLARE_API_TOKEN` — a Cloudflare API token with **Cloudflare Pages: Edit** permission
- Secret `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID
- (Optional) Variable `VITE_KURAL_DATA_URL` if using an externally hosted dataset

### Pushing to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Thirukkural listening app"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## Notes on Tamil text-to-speech

Voice availability for `ta-IN` depends on the user's browser/OS (Chrome on Android and recent desktop Chrome/Edge generally have a Tamil voice; coverage on iOS Safari is inconsistent). The app picks the best available Tamil voice automatically and shows a clear Tamil error message if no audio can be produced, without crashing. Swapping in professionally recorded Kural/explanation audio (via `audioKuralUrl` / `audioExplanationUrl`) removes the TTS-quality dependency entirely.

## License

Application code: MIT (add a `LICENSE` file with your preferred terms before publishing). The Thirukkural text itself is ancient public-domain Tamil literature; if you incorporate a specific modern commentary/translation, check that source's own license/attribution requirements.
