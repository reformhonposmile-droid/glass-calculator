const CACHE_NAME = 'glass-calculator-v2';

const APP_SHELL = [
  './',
  './index.html',
  './estimate_app.html',
  './product-catalog.html',
  './index_float_chat.html',
  './index_float_chat_wrapper.html',
  './products.js',
  './qa.js',
  './script.js',
  './styles.css',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    // Online: always request the latest version, then refresh the local cache.
    // Offline: fall back to the last successfully cached version.
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }

        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('./estimate_app.html');
          }
          return new Response('', { status: 503, statusText: 'Offline' });
        })
      )
  );
});
