// Caché sencilla: la app abre sin conexión; las canchas se actualizan cuando hay red.
const CACHE = 'la-tirada-v1';
const CORE = ['./', 'index.html', 'styles.css', 'app.js', 'data/canchas.geojson',
  'vendor/leaflet.js', 'vendor/leaflet.css', 'assets/logo-mark.svg', 'assets/apple-touch-icon.png'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys()
  .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // teselas y fuentes: directo a la red
  e.respondWith(fetch(e.request).then((r) => {
    const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request)));
});
