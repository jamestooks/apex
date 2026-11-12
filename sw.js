// Offline support: precache the whole app; cache Google Fonts as they load. Regenerate the list with: npm run sw
const CACHE = 'apex-1xnkuly';
const PRECACHE = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './src/app.js',
  './src/art/props.js',
  './src/art/raptor.js',
  './src/art/world.js',
  './src/data/chapters/1-rage.js',
  './src/data/chapters/2-overwhelm.js',
  './src/data/chapters/3-distraction.js',
  './src/data/chapters/4-energy.js',
  './src/data/chapters/5-impulse.js',
  './src/data/chapters/6-finale.js',
  './src/data/chapters/index.js',
  './src/data/signs.js',
  './src/engine/audio.js',
  './src/engine/canvas.js',
  './src/engine/input.js',
  './src/engine/kinds/ambush.js',
  './src/engine/kinds/moment.js',
  './src/engine/kinds/practice.js',
  './src/engine/kinds/repair.js',
  './src/engine/kinds/run.js',
  './src/engine/kinds/teachNip.js',
  './src/engine/kinds/track.js',
  './src/engine/meter.js',
  './src/engine/scene.js',
  './src/engine/setpieces.js',
  './src/engine/tools/burstRest.js',
  './src/engine/tools/index.js',
  './src/engine/tools/longExhale.js',
  './src/engine/tools/oneThing.js',
  './src/engine/tools/parkIt.js',
  './src/engine/tools/waitSignal.js',
  './src/main.js',
  './src/model/progress.js',
  './src/model/session.js',
  './src/play/runner.js',
  './src/store.js',
  './src/ui/den.js',
  './src/ui/dom.js',
  './src/ui/grownups-model.js',
  './src/ui/grownups.js',
  './src/ui/home.js',
  './src/ui/plancard.js',
  './src/ui/profiles.js',
  './src/ui/signs.js',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !font) return;
  e.respondWith(caches.match(req, { ignoreSearch: url.origin === location.origin }).then(hit => {
    if (hit) return hit;
    return fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
  }));
});
