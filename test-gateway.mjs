import assert from 'node:assert/strict';
import {makeHandler,sanitizeRequest} from './gateway/handler.mjs';
const origin='https://hoaianhdoan0209-hue.github.io';
const content=sanitizeRequest({version:1,question:'Combo nào tốt?',gameName:'Game X',unauthorized:'secret',
 confirmedOCR:[{tags:['burn'],facts:[{label:'Crit',value:25}]}]});
assert.equal(content.unauthorized,undefined);
assert.equal(content.confirmedOCR.length,1);
let calls=0;
const fake=async (url,args)=>{calls++;assert.ok(url.includes('generateContent'));assert.equal(args.headers['x-goog-api-key'],'fake-secret');return{ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Đây là giả thuyết, cần kiểm chứng.'}]}}]})};};
const handle=makeHandler({GEMINI_API_KEY:'fake-secret',LINH_ACCESS_TOKEN:'access',LINH_ALLOWED_ORIGIN:origin},fake);
const send=(o,access)=>handle(new Request('https://host.local/chat',{method:'POST',headers:{origin:o,'x-linh-access':access,'content-type':'application/json'},body:JSON.stringify({version:1,question:'Xin phân tích game'})}));
assert.equal((await send('https://evil.example','access')).status,403);
assert.equal((await send(origin,'wrong')).status,401);
let valid=await send(origin,'access');
assert.equal(valid.status,200);
assert.match((await valid.json()).reply,/giả thuyết/);
assert.equal(calls,1);
console.log('PASS: server auth, CORS, payload sanitization, no real paid API calls');
