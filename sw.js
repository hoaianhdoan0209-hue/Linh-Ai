// Socrates Web 1.5: cache public static assets only; never private screenshots or saved game data.
const CACHE='linh-site-1.6.1';
const ASSETS=['./stat-schema.js?v=1.6.1','./game-coach.js?v=1.6.1','./season-knowledge.js?v=1.6.1','./','./index.html','./web-companion.js','./web-dialogue.js','./web-image-memory.js?v=1.6.1','./web-game-brain.js?v=1.6.1','./web-game-experiments.js?v=1.6.1','./legacy-dashboard.html','./vision-engine.js?v=1.6.1','./assistant-engine.js','./assistant-ui.js','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',ev=>{ev.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',ev=>{ev.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('linh-site-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',ev=>{
const req=ev.request,url=new URL(req.url);
if(req.method!=='GET'||url.origin!==self.location.origin)return;
ev.respondWith(fetch(req).then(res=>{if(res.ok){const clone=res.clone();ev.waitUntil(caches.open(CACHE).then(c=>c.put(req,clone)));}return res;}).catch(()=>caches.match(req).then(v=>v||(req.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});