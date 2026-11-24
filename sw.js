// Service worker de Tendido: guarda la app para abrirla sin conexión y muestra los avisos.
const CACHE = 'tendido-v20';
const SIEMPRE_RED = /\/(index\.html|tendido\.js|manifest\.webmanifest|medalla\.js|mapa\.js|instalar\.js)?$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'index.html', 'tendido.js', 'medalla.js', 'mapa.js', 'instalar.js', 'icono-180.png', 'icono-192.png'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (r.mode === 'navigate' || SIEMPRE_RED.test(u.pathname)) {
    // La página y el arranque, de la red si hay; si no, lo guardado
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); return res; }).catch(() => caches.match(r).then(x => x || caches.match('index.html'))));
    return;
  }
  // El resto (wasm, datos, imágenes, medallas) no cambia de una versión a otra: primero lo guardado
  e.respondWith(caches.match(r).then(x => x || fetch(r).then(res => {
    if (res.ok) { const c = res.clone(); caches.open(CACHE).then(k => k.put(r, c)); }
    return res;
  })));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const d = (e.notification.data && e.notification.data.destino) || '';
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(l => {
    if (l.length) { l[0].postMessage({ destino: d }); return l[0].focus(); }
    return self.clients.openWindow(d ? './?d=' + encodeURIComponent(d) : './');
  }));
});
