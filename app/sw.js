/* PCG de poche — service worker : tout est mis en cache à l'installation, l'application fonctionne hors ligne.
   La ligne VERSION est réécrite par scripts/build.py à chaque construction ; un changement déclenche la mise à jour. */
const VERSION = "a8f7b84741";
const CACHE = "pcg-" + VERSION;
const ASSETS = [
  "./", "./index.html", "./installer.html", "./styles.css", "./app.js", "./data.js", "./fonts.css",
  "./manifest.webmanifest",
  "./fonts/plex-sans.woff2", "./fonts/plex-mono-500.woff2", "./fonts/plex-mono-600.woff2",
  "./logos/lagarde.png", "./logos/ac.png",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png", "./icons/favicon-64.png", "./icons/qr.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => null)))));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("message", e => { if (e.data === "skipWaiting") self.skipWaiting(); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => req.mode === "navigate" ? caches.match("./index.html") : undefined)));
});
