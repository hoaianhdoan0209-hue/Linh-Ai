// Socrates Web 1.5: cache public static assets only; never private screenshots or saved game data.
const CACHE='linh-site-2.11.1';
const ASSETS=['./fantasy-chat.css?v=2.11.1','./fantasy-chat.js?v=2.11.1','./fantasy-night.png','./fantasy-guide.png','./stat-schema.js?v=2.11.1','./build-systems.js?v=2.11.1','./ss9-evidence-graph.js?v=2.11.1','./class-catalog.js?v=2.11.1','./ss9-class-roster.js?v=2.11.1','./class-build-knowledge.js?v=2.11.1','./rotation-lab.js?v=2.11.1','./rotation-commands.js?v=2.11.1','./thinking-guard.js?v=2.11.1','./prompt-strategy.js?v=2.11.1','./game-coach.js?v=2.11.1','./season-knowledge.js?v=2.11.1','./','./index.html','./web-ai-bridge.js?v=2.11.1','./web-vision-upload.js?v=2.11.1','./vision-evidence.js?v=2.11.1','./web-companion.js','./web-dialogue.js','./web-image-memory.js?v=2.11.1','./web-game-brain.js?v=2.11.1','./web-game-experiments.js?v=2.11.1','./legacy-dashboard.html','./vision-engine.js?v=2.11.1','./assistant-engine.js','./assistant-ui.js','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',ev=>{ev.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',ev=>{ev.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('linh-site-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',ev=>{
const req=ev.request,url=new URL(req.url);
if(req.method!=='GET'||url.origin!==self.location.origin)return;
ev.respondWith(fetch(req).then(res=>{if(res.ok){const clone=res.clone();ev.waitUntil(caches.open(CACHE).then(c=>c.put(req,clone)));}return res;}).catch(()=>caches.match(req).then(v=>v||(req.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});