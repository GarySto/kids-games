/* Kids Games offline helper. Keeps a copy of the games on the device so they work without the internet.
   Pages: try the network first (so updates arrive), fall back to the saved copy when offline.
   Everything else: use the saved copy straight away and refresh it in the background. */
const CACHE = "kids-games-v2";
const CORE = ["./", "./shared.js", "./shared.css", "./seek/", "./pegs/", "./paint/",
  "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("kids-games-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url), same = url.origin === location.origin;
  const fonts = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!(same && (url.pathname.startsWith(new URL(self.registration.scope).pathname))) && !fonts) return;
  if (req.mode === "navigate") {
    const key = url.pathname.replace(/index\.html$/, "");   // seek/ and seek/index.html are the same page
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); return res; })
      .catch(() => caches.match(key, { ignoreSearch: true }).then(r => r || caches.match("./"))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: same }).then(hit => {
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => hit);
    return hit || net;
  }));
});
