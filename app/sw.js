const CACHE_NAME = "fd-app-v4"
const CORE = [
  "/app/",
  "/app/index.html",
  "/app/manifest.webmanifest",
  "/app/logo.png",
  "/app/android-chrome-192x192.png",
  "/app/android-chrome-512x512.png",
  "/app/apple-touch-icon.png"
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
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  const url = new URL(req.url)

  if (url.origin !== location.origin) return

  if (url.pathname.startsWith("/app/")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchAndCache = fetch(req).then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {})
          return res
        }).catch(() => cached || Response.error())

        return cached || fetchAndCache
      })
    )
  }
})
