// Socrates Web 1.5: cache public static assets only; never private screenshots or saved game data.
const CACHE='linh-site-2.7.0';
const ASSETS=['./stat-schema.js?v=2.7.0','./build-systems.js?v=2.7.0','./ss9-evidence-graph.js?v=2.7.0','./rotation-lab.js?v=2.7.0','./rotation-commands.js?v=2.7.0','./thinking-guard.js?v=2.7.0','./prompt-strategy.js?v=2.7.0','./game-coach.js?v=2.7.0','./season-knowledge.js?v=2.7.0','./','./index.html','./web-ai-bridge.js?v=2.7.0','./web-vision-upload.js?v=2.7.0','./vision-evidence.js?v=2.7.0','./web-companion.js','./web-dialogue.js','./web-image-memory.js?v=2.7.0','./web-game-brain.js?v=2.7.0','./web-game-experiments.js?v=2.7.0','./legacy-dashboard.html','./vision-engine.js?v=2.7.0','./assistant-engine.js','./assistant-ui.js','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',ev=>{ev.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',ev=>{ev.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('linh-site-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',ev=>{
const req=ev.request,url=new URL(req.url);
if(req.method!=='GET'||url.origin!==self.location.origin)return;
ev.respondWith(fetch(req).then(res=>{if(res.ok){const clone=res.clone();ev.waitUntil(caches.open(CACHE).then(c=>c.put(req,clone)));}return res;}).catch(()=>caches.match(req).then(v=>v||(req.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});