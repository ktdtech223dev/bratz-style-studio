const CACHE_NAME = 'bratz-style-studio-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/characters/cloe/body.svg',
  '/assets/characters/cloe/face.svg',
  '/assets/characters/cloe/arms.svg',
  '/assets/characters/cloe/legs.svg',
  '/assets/characters/cloe/feet.svg',
  '/assets/characters/jade/body.svg',
  '/assets/characters/jade/face.svg',
  '/assets/characters/jade/arms.svg',
  '/assets/characters/jade/legs.svg',
  '/assets/characters/jade/feet.svg',
  '/assets/characters/sasha/body.svg',
  '/assets/characters/sasha/face.svg',
  '/assets/characters/sasha/arms.svg',
  '/assets/characters/sasha/legs.svg',
  '/assets/characters/sasha/feet.svg',
  '/assets/characters/yasmin/body.svg',
  '/assets/characters/yasmin/face.svg',
  '/assets/characters/yasmin/arms.svg',
  '/assets/characters/yasmin/legs.svg',
  '/assets/characters/yasmin/feet.svg',
  '/assets/gacha/machine.svg',
  '/assets/gacha/capsule_common.svg',
  '/assets/gacha/capsule_rare.svg',
  '/assets/gacha/capsule_epic.svg',
  '/assets/gacha/capsule_legendary.svg',
  '/assets/ui/coin.svg',
  '/assets/ui/gem.svg',
  '/assets/ui/star_filled.svg',
  '/assets/ui/star_empty.svg',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Cache what we can, skip failures
        return Promise.allSettled(
          STATIC_ASSETS.map((url) => cache.add(url).catch(() => {}))
        );
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API routes: network only (gacha must be server-authoritative)
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'You are offline. Some features require an internet connection.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Static assets: cache-first, then network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
