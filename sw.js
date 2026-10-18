// Linh Web: cache chỉ các tệp công khai của ứng dụng; dữ liệu game nằm trong localStorage.
const CACHE = "linh-site-0.2.1";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("linh-site-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const req = event.request;
  if(req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(fetch(req).then(res => {
    if(res.ok) { const copy = res.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(req, copy))); }
    return res;
  }).catch(() => caches.match(req).then(cached => cached || (req.mode === "navigate" ? caches.match("./index.html") : Response.error()))));
});