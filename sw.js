// Avokado Bar — müzik cache service worker
// mp3'ler dosya adıyla sabit. İlk çalışta TAM dosyayı (Range'siz, 200) indirir, cache'ler.
// <audio> parça parça (Range/206) istese bile biz tam dosyayı verdiğimiz için cache'lenebilir.
// manifest.json ve index.html cache'lenmez → playlist güncellemesi anında yansır.
const CACHE = 'avokado-muzik-v2';

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method === 'GET'
      && url.origin === self.location.origin
      && /\/muzik\/.+\.(mp3|m4a|ogg|wav)$/i.test(url.pathname)) {
    event.respondWith(handleAudio(url.pathname));
  }
  // diğer istekler (manifest.json, index.html) normal ağ
});

async function handleAudio(path){
  const cache = await caches.open(CACHE);
  const cached = await cache.match(path);
  if (cached) return cached;                 // tekrar çalışta: diskten, tam dosya (200)
  try {
    const resp = await fetch(path);          // Range'siz → tam dosya (200)
    if (resp && resp.status === 200) {
      cache.put(path, resp.clone()).catch(()=>{});
    }
    return resp;
  } catch (err) {
    const anyHit = await cache.match(path);
    if (anyHit) return anyHit;
    throw err;
  }
}
