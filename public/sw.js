// Senecurare PWA Service Worker
const CACHE_NAME = 'senecurare-pwa-v1'

const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon-32x32.png',
  '/favicon-64x64.png',
  '/logo-192.png',
  '/logo-512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Ignora falha de precache pontual em ambiente de desenvolvimento
      })
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Ignora chamadas externas de APIs (Supabase, APIs de pagamento, websockets, extensões)
  if (
    event.request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/realtime/')
  ) {
    return
  }

  // Requisições de navegação SPA: tenta rede com fallback para o index em cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const indexCache = await caches.match('/')
        if (indexCache) return indexCache
        return caches.match(event.request)
      })
    )
    return
  }

  // Recursos estáticos locais: tenta rede primeiro, salva em cache ou recupera cache se offline
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {})
            })
          }
          return networkResponse
        })
        .catch(() => cachedResponse)

      return cachedResponse || fetchPromise
    })
  )
})
