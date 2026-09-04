// AR Expenses Tracker - cache refresh enabled
const CACHE = 'ledger-v3';
const ASSETS = [
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Never intercept Google API / authentication calls.
  if (url.hostname.includes('google') || url.hostname.includes('gstatic')) return;

  // Always prefer the latest HTML from GitHub Pages. Cache is only a fallback
  // when the device is offline.
  const isPage = e.request.mode === 'navigate' ||
                 url.pathname.endsWith('index.html') ||
                 url.pathname.endsWith('/');

  if (isPage) {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for static assets.
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
    })
  );
});
