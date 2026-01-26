const CACHE_NAME = "fd-app-v12"
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./logo.png",
  "./android-chrome-192x192.png",
  "./android-chrome-512x512.png",
  "./apple-touch-icon.png"
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
      self.clients.claim()
    ])
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  const url = new URL(req.url)

  if (url.origin !== self.location.origin) return

  const scopePath = new URL(self.registration.scope).pathname
  if (!url.pathname.startsWith(scopePath)) return

  const isNav = req.mode === "navigate"
  if (isNav) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((c) => c.put(req, copy))
          return res
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME)
          const cached = await cache.match("./index.html")
          return cached || cache.match(req) || Response.error()
        })
    )
    return
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        const copy = res.clone()
        caches.open(CACHE_NAME).then((c) => c.put(req, copy))
        return res
      }).catch(() => cached)
      return cached || fetchPromise
    })
  )
})
