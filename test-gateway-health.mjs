import assert from 'node:assert/strict';
import {makeHandler} from './gateway/handler.mjs';
const origin='https://hoaianhdoan0209-hue.github.io';
let modelCalls=0;
const neverModel=async()=>{modelCalls++;throw Error('Health must not call a model')};
const ready=makeHandler({GEMINI_API_KEY:'do-not-disclose-real-value',
 GEMINI_MODEL:'gemini-3.5-flash-lite',LINH_ACCESS_TOKEN:'secret-gateway-token',
 LINH_ALLOWED_ORIGIN:origin},neverModel);
const req=(method,url,headers)=>new Request(url,{method,headers});
const result=await ready(req('GET','https://private.example/health',{}));
assert.equal(result.status,200,'Health must work in a normal browser without Origin');
assert.equal(result.headers.get('access-control-allow-origin'),origin);
const data=await result.json();
assert.equal(data.service,'socrates-gateway');
assert.equal(data.status,'online');
assert.equal(data.configured,true);
assert.equal(data.providerTested,false);
assert.equal(JSON.stringify(data).includes('do-not-disclose-real-value'),false);
assert.equal(JSON.stringify(data).includes('secret-gateway-token'),false);
assert.equal(JSON.stringify(data).includes('gemini-3.5-flash-lite'),false);
assert.equal(modelCalls,0);
const blank=makeHandler({LINH_ACCESS_TOKEN:'secret-gateway-token'},neverModel);
const health=await blank(req('GET','https://private.example/health',{}));
assert.equal(health.status,200);
assert.equal((await health.json()).configured,false);
assert.equal(modelCalls,0);
const options=await ready(req('OPTIONS','https://private.example/chat',{origin}));
assert.equal(options.status,204);
assert.equal(options.headers.get('access-control-allow-origin'),origin);
const oldWrong=await ready(req('POST','https://private.example/chat',{
 origin,'x-linh-access':'wrong','content-type':'application/json'}));
assert.equal(oldWrong.status,401);
assert.equal(modelCalls,0);
console.log('PASS: anonymous read-only Render /health without secret leakage, no AI calls, existing CORS and auth unaffected');
