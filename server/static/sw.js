const APP_VERSION = '__APP_VERSION__';
const STATIC_CACHE = `adhan-dz-static-v${APP_VERSION}`;
const RUNTIME_CACHE = `adhan-dz-runtime-v${APP_VERSION}`;
const VERSION_PARAM = `?v=${encodeURIComponent(APP_VERSION)}`;
const API_PATHS = new Set(['/cities', '/prayerTimes', '/hijriGeoDate']);

const STATIC_ASSET_PATHS = [
  '/index.css',
  '/index.js',
  '/manifest.webmanifest',
  '/pwa-icons/logo.png',
  '/pwa-icons/favicon-16x16.png',
  '/pwa-icons/favicon-32x32.png',
  '/pwa-icons/favicon.ico',
  '/pwa-icons/apple-touch-icon-180x180.png',
  '/pwa-icons/icon-192x192.png',
  '/pwa-icons/icon-512x512.png',
  '/api.css',
  '/api-test.css',
  '/api-test.js',
  '/icons/fajr.svg',
  '/icons/sunrise.svg',
  '/icons/dhuhr.svg',
  '/icons/asr.svg',
  '/icons/maghrib.svg',
  '/icons/isha.svg'
];

const STATIC_ASSETS = [
  '/',
  '/index.html',
  `/index.html${VERSION_PARAM}`,
  '/api.html',
  `/api.html${VERSION_PARAM}`,
  '/api-test.html',
  `/api-test.html${VERSION_PARAM}`,
  ...STATIC_ASSET_PATHS.flatMap((assetPath) => [assetPath, `${assetPath}${VERSION_PARAM}`]),
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

  if (url.pathname === '/sw.js') {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      networkFirst(event.request, RUNTIME_CACHE)
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  if (API_PATHS.has(url.pathname)) {
    event.respondWith(networkFirst(event.request, RUNTIME_CACHE));
    return;
  }

  event.respondWith(cacheFirst(event.request, STATIC_CACHE));
});
