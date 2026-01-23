const CACHE_NAME = "fd-app-v1"
const CORE_ASSETS = [
  "/app/",
  "/app/index.html",
  "/app/manifest.webmanifest",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/apple-touch-icon.png"
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached

      return fetch(req).then((res) => {
        const copy = res.clone()
        if (req.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy))
        }
        return res
      }).catch(() => caches.match("/app/"))
    })
  )
})
