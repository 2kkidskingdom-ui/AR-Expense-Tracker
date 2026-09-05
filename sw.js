const CACHE = 'ledger-v7';
const ASSETS = ['manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return;
  if(req.mode === 'navigate') {
    event.respondWith(fetch(req, {cache:'no-cache'}).then(r=>{
      if(r.ok){ const copy=r.clone(); caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{}); }
      return r;
    }).catch(()=>caches.match(req)));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(r=>{
    if(r.ok && ['script','style','image'].includes(req.destination)){ const copy=r.clone(); caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{}); }
    return r;
  })));
});
