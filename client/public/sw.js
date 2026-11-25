/* Minimal offline-first service worker for the bubble shooter PWA.
   Caches the app shell so levels remain playable offline.
   Network-first for API calls; cache-first for static assets. */

const CACHE = 'bshooter-shell-v1';
const APP_SHELL = ['/', '/index.html', '/favicon.svg', '/icon-192.svg', '/icon-512.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache API traffic — always hit network, fall back gracefully.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ offline: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503,
    })));
    return;
  }

  // Cache-first for everything else (app shell / static assets).
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});
