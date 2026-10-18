// Linh Web 0.3: cache same-origin static assets only, never private screenshots.
const CACHE='linh-site-0.7.0';
const ASSETS=['./','./index.html','./legacy-dashboard.html','./vision-engine.js','./assistant-engine.js','./assistant-ui.js','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',ev=>{ev.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',ev=>{ev.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('linh-site-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',ev=>{
const req=ev.request,url=new URL(req.url);
if(req.method!=='GET'||url.origin!==self.location.origin)return;
ev.respondWith(fetch(req).then(res=>{if(res.ok){const clone=res.clone();ev.waitUntil(caches.open(CACHE).then(c=>c.put(req,clone)));}return res;}).catch(()=>caches.match(req).then(v=>v||(req.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});