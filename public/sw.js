const CACHE_NAME = 'terraquest-v2';

const PRECACHE_URLS = [
  '/',
  '/globo.png',
];

const CDN_CACHE = 'terraquest-cdn-v2';
const CDN_URLS = [
  'https://d3js.org/d3.v7.min.js',
  'https://cdn.jsdelivr.net/npm/topojson-client@3',
];

const DATA_CACHE = 'terraquest-data-v2';

// Install: precache shell + CDN libs
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
      caches.open(CDN_CACHE).then((cache) => cache.addAll(CDN_URLS)),
    ]).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, CDN_CACHE, DATA_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache-first for CDN libraries
  if (url.origin === 'https://d3js.org' || url.origin === 'https://cdn.jsdelivr.net') {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CDN_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
      )
    );
    return;
  }

  // Network-first for map data APIs
  if (url.hostname === 'servicodados.ibge.gov.br' ||
      (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('atlas'))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DATA_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for Wikimedia flag images
  if (url.hostname === 'commons.wikimedia.org' || url.hostname === 'upload.wikimedia.org') {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached || fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DATA_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 404 }))
      )
    );
    return;
  }

  // Network-first for same-origin app shell (HTML, JS, CSS)
  // This ensures users always get the latest version on deploy
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
