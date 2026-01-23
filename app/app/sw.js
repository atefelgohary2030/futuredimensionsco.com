const CACHE = "fd-app-shell-v1"

const APP_ASSETS = [
  "/app/",
  "/app/index.html",
  "/app/manifest.webmanifest",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/apple-touch-icon.png",
  "/sw.js"
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_ASSETS))
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  if (url.origin !== location.origin) return

  const isAppShell =
    url.pathname.startsWith("/app/") ||
    url.pathname === "/sw.js" ||
    url.pathname === "/android-chrome-192x192.png" ||
    url.pathname === "/android-chrome-512x512.png" ||
    url.pathname === "/apple-touch-icon.png"

  if (!isAppShell) {
    event.respondWith(fetch(event.request))
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  )
})
