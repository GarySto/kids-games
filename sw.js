/* Kids Games offline helper. Keeps a copy of the games on the device so they work without the internet.
   Online, everything comes fresh from the website (so a new version never mixes with an old one, which Safari
   on iPad was doing). Offline, the saved copy is used. Redirected responses are never saved, because Safari
   refuses to show them from a saved copy. Fonts never change, so they are served from the saved copy first. */
const CACHE = "kids-games-v7";
const CORE = ["./", "./shared.js", "./shared.css", "./seek/", "./pegs/", "./paint/", "./spell/", "./spell/words.js",
  "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u =>
    fetch(new Request(u, { cache: "reload" })).then(r => { if (r.ok && !r.redirected) return c.put(u, r); }).catch(() => {})
  ))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("kids-games-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const keyFor = url => url.pathname.replace(/index\.html$/, "");   // seek/ and seek/index.html are the same page
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url), same = url.origin === location.origin;
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })));
    return;
  }
  if (!same || !(url.pathname.startsWith(new URL(self.registration.scope).pathname))) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok && !res.redirected) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(keyFor(url), copy)); }
    return res;
  }).catch(() => caches.match(keyFor(url), { ignoreSearch: true }).then(hit => hit || (req.mode === "navigate" ? caches.match("./") : Response.error()))));
});
