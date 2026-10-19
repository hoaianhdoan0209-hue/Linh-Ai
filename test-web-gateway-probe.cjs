'use strict';
(async()=>{
const assert=require('node:assert/strict');
const bridge=require('./web-ai-bridge.js');
assert.equal(bridge.healthUrl('https://my-service.onrender.com/chat'),
 'https://my-service.onrender.com/health');
assert.equal(bridge.healthUrl('https://my-service.onrender.com/chat/'),
 'https://my-service.onrender.com/health');
let count=0,called='';
const fake=async(url,options)=>{
 count++;called=url;
 assert.equal(options.method,'GET');
 assert.equal(options.credentials,'omit');
 assert.equal(options.headers,undefined,'Health must not transmit the user access token');
 return {ok:true,json:async()=>({service:'socrates-gateway',status:'online',configured:true,providerTested:false})};
};
const good=await bridge.probe('https://my-service.onrender.com/chat',{remoteFetch:fake});
assert.equal(good.ok,true);
assert.equal(good.configured,true);
assert.match(good.reason,/Chưa xác minh Gemini/);
assert.equal(called,'https://my-service.onrender.com/health');
assert.equal(count,1);
let result=await bridge.probe('https://my-service.onrender.com/chat',{
 remoteFetch:async()=>({ok:true,json:async()=>({service:'socrates-gateway',status:'online',configured:false})})
});
assert.equal(result.ok,false);assert.equal(result.online,true);assert.match(result.reason,/chưa đủ cấu hình/);
result=await bridge.probe('https://my-service.onrender.com/chat',{
 remoteFetch:async()=>({ok:false,status:404})
});
assert.equal(result.ok,false);assert.match(result.reason,/Deploy latest commit/);
result=await bridge.probe('https://my-service.onrender.com/chat',{
 remoteFetch:async()=>{throw new TypeError('Failed to fetch')}
});
assert.equal(result.ok,false);assert.match(result.reason,/Render đang Live/);
result=await bridge.probe('https://my-service.onrender.com/chat',{
 remoteFetch:async()=>({ok:true,json:async()=>({status:'online',service:'other-host',configured:true})})
});
assert.equal(result.ok,false);assert.match(result.reason,/không phải gateway Socrates/);
assert.throws(()=>bridge.healthUrl('http://my-service.onrender.com/chat'));
console.log('PASS: gateway liveness probe verifies server, requires no access token, diagnoses stale deployments and outages');
})().catch(error=>{console.error(error);process.exitCode=1});
