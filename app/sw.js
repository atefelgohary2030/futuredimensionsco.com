// Future Dimensions PWA Service Worker (v4.0.3)
const VERSION = "fd-pwa-v4.0.3"
const CACHE_NAME = VERSION

const scopeURL = () => {
  try { return new URL(self.registration.scope) } catch { return new URL(self.location) }
}

const toScopeURL = (p) => {
  try { return new URL(p, scopeURL()).toString() } catch { return p }
}

const APP_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sw.js",
  "./logo.png",
  "./android-chrome-192x192.png",
  "./android-chrome-512x512.png",
  "./apple-touch-icon.png"
].map(toScopeURL)

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS)).catch(() => {})
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

const isNavigation = (req) => req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")

self.addEventListener("fetch", (event) => {
  const req = event.request

  if (req.method !== "GET") return

  // Do not cache cross-origin requests (Supabase, CDN, signed URLs, etc.)
  try{
    const u = new URL(req.url)
    const scope = scopeURL()
    if (u.origin !== scope.origin) {
      event.respondWith(fetch(req))
      return
    }
  }catch{}

  if (isNavigation(req)) {
    // Network first, fallback to cache
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {})
          return res
        })
        .catch(async () => {
          const cached = await caches.match(req)
          if (cached) return cached
          return caches.match(toScopeURL("./index.html"))
        })
    )
    return
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone()
      caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {})
      return res
    }))
  )
})
