import sample from './thirukkural.sample.json'
import type { Kural, ChapterSummary } from './types'
import { TOTAL_CHAPTERS } from './types'

/**
 * Data access layer for the Thirukkural corpus.
 *
 * This app ships with a small VERIFIED sample (Chapter 1 — கடவுள் வாழ்த்து,
 * Kurals 1–10), reproduced from the public-domain Thirukkural text.
 *
 * To go live with all 1,330 Kurals:
 *   1. Source a verified/public-domain dataset (e.g. an open Thirukkural
 *      JSON/CSV corpus with Tamil text + meanings, cross-checked against a
 *      trusted print edition).
 *   2. Replace/extend the array below (or point KURAL_DATA_URL at a hosted
 *      JSON file / API) so it matches the `Kural[]` shape in `./types.ts`.
 *   3. Nothing else in the app needs to change — every screen reads through
 *      this repository module.
 */
const KURAL_DATA: Kural[] = sample as Kural[]

// Optional: point this at a hosted JSON endpoint (Cloudflare KV, R2, a
// static file, a CMS, etc.) containing the full verified dataset. When set,
// it is merged on top of the bundled sample at startup.
const KURAL_DATA_URL = import.meta.env.VITE_KURAL_DATA_URL as string | undefined

let cache: Kural[] = KURAL_DATA
let loadPromise: Promise<Kural[]> | null = null

export function loadKuralData(): Promise<Kural[]> {
  if (!KURAL_DATA_URL) return Promise.resolve(cache)
  if (loadPromise) return loadPromise
  loadPromise = fetch(KURAL_DATA_URL)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad response'))))
    .then((full: Kural[]) => {
      const byNumber = new Map<number, Kural>()
      for (const k of cache) byNumber.set(k.number, k)
      for (const k of full) byNumber.set(k.number, k)
      cache = Array.from(byNumber.values()).sort((a, b) => a.number - b.number)
      return cache
    })
    .catch(() => cache)
  return loadPromise
}

export function getAllKurals(): Kural[] {
  return cache
}

export function getKuralByNumber(number: number): Kural | undefined {
  return cache.find((k) => k.number === number)
}

export function getKuralsByChapter(chapterNumber: number): Kural[] {
  return cache.filter((k) => k.chapterNumber === chapterNumber)
}

export function getFirstAvailableKural(): Kural | undefined {
  return cache[0]
}

export function searchKurals(query: string): Kural[] {
  const q = query.trim()
  if (!q) return []
  const numeric = q.replace(/^0+/, '')
  if (/^\d+$/.test(numeric)) {
    const n = Number(numeric || '0')
    const exact = cache.filter((k) => k.number === n)
    if (exact.length) return exact
  }
  const lower = q.toLowerCase()
  return cache.filter(
    (k) =>
      k.kuralTamil.includes(q) ||
      k.meaningTamil.includes(q) ||
      k.chapterNameTamil.includes(q) ||
      k.sectionNameTamil.includes(q) ||
      k.tags.some((t) => t.includes(q)) ||
      String(k.number).includes(lower)
  )
}

/**
 * Chapter directory for all 133 chapters. Chapters present in the loaded
 * dataset show their real Tamil name; chapters not yet loaded are shown as
 * placeholders so the browsing UI/architecture supports the complete work
 * without fabricating names that haven't been verified yet.
 */
export function getChapterDirectory(): ChapterSummary[] {
  const known = new Map<number, Kural[]>()
  for (const k of cache) {
    const arr = known.get(k.chapterNumber) ?? []
    arr.push(k)
    known.set(k.chapterNumber, arr)
  }
  const result: ChapterSummary[] = []
  for (let ch = 1; ch <= TOTAL_CHAPTERS; ch++) {
    const kurals = known.get(ch)
    if (kurals && kurals.length) {
      const numbers = kurals.map((k) => k.number)
      result.push({
        chapterNumber: ch,
        chapterNameTamil: kurals[0].chapterNameTamil,
        sectionNameTamil: kurals[0].sectionNameTamil,
        bookNameTamil: kurals[0].bookNameTamil,
        kuralStart: Math.min(...numbers),
        kuralEnd: Math.max(...numbers),
        hasData: true,
      })
    } else {
      result.push({
        chapterNumber: ch,
        chapterNameTamil: null,
        sectionNameTamil: null,
        bookNameTamil: null,
        kuralStart: 0,
        kuralEnd: 0,
        hasData: false,
      })
    }
  }
  return result
}
