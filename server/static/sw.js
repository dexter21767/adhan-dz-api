const STATIC_CACHE = 'adhan-dz-static-v1';
const RUNTIME_CACHE = 'adhan-dz-runtime-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/index.js',
  '/manifest.webmanifest',
  '/api.html',
  '/api.css',
  '/api-test.html',
  '/api-test.css',
  '/api-test.js',
  '/icons/fajr.svg',
  '/icons/sunrise.svg',
  '/icons/dhuhr.svg',
  '/icons/asr.svg',
  '/icons/maghrib.svg',
  '/icons/isha.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (_) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw _;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      networkFirst(event.request, RUNTIME_CACHE)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  if (url.pathname === '/cities' || url.pathname === '/prayerTimes') {
    event.respondWith(networkFirst(event.request, RUNTIME_CACHE));
    return;
  }

  event.respondWith(cacheFirst(event.request, STATIC_CACHE));
});
