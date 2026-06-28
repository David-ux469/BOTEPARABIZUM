const CACHE = 'bote-bizum-v3';
const ASSETS = [
  'index.html',
  'privacy.html',
  'css/styles.css',
  'js/config.js',
  'js/storage.js',
  'js/auth.js',
  'js/bizum-bridge.js',
  'js/render.js',
  'js/webapp.js',
  'js/app.js',
  'manifest.json',
  'icons/icon-192.svg',
  'icons/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.allSettled(ASSETS.map((url) => cache.add(url)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request).catch(() => caches.match('index.html'))
    )
  );
});
