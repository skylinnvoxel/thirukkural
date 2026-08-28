// Thirukkural App — service worker
// Caches the app shell for offline use. Kural audio is NOT pre-cached here —
// only audio the user has actually played gets cached (see AUDIO_CACHE below),
// so the app never claims content is offline unless it truly is.

const SHELL_CACHE = 'tk-shell-v1'
const AUDIO_CACHE = 'tk-audio-v1'

const SHELL_ASSETS = ['/', '/index.html', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== AUDIO_CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Audio files: cache-on-play, so previously listened Kurals work offline.
  if (/\.(mp3|m4a|aac|ogg|wav)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const cached = await cache.match(request)
        if (cached) return cached
        try {
          const res = await fetch(request)
          if (res.ok) cache.put(request, res.clone())
          return res
        } catch {
          return cached || Response.error()
        }
      })
    )
    return
  }

  // App shell: network-first, falling back to cache for offline app boot.
  if (request.mode === 'navigate' || SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, res.clone()))
          return res
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/index.html')))
    )
    return
  }

  // Static assets (JS/CSS/fonts/icons): stale-while-revalidate.
  event.respondWith(
    caches.open(SHELL_CACHE).then(async (cache) => {
      const cached = await cache.match(request)
      const network = fetch(request)
        .then((res) => {
          if (res.ok) cache.put(request, res.clone())
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
