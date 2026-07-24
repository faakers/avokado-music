// Avokado Bar — müzik cache service worker
// mp3'ler dosya adıyla sabit olduğu için "cache-first": ilk çalışta indirir, sonra hep diskten verir.
// manifest.json ve index.html cache'lenmez → playlist güncellemesi anında yansır.
const CACHE = 'avokado-muzik-v1';

self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // sadece kendi origin'imizdeki muzik/ altındaki ses dosyalarını cache'le
  if (event.request.method === 'GET' && url.origin === self.location.origin && /\/muzik\/.+\.(mp3|m4a|ogg|wav)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(event.request);
      if (hit) return hit;
      try {
        const resp = await fetch(event.request);
        if (resp && resp.ok) cache.put(event.request, resp.clone());
        return resp;
      } catch (err) {
        const anyHit = await cache.match(event.request);
        if (anyHit) return anyHit;
        throw err;
      }
    })());
  }
  // diğer istekler (manifest.json, index.html) normal ağ
});
