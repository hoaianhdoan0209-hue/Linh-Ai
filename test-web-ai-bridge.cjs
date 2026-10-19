'use strict';
(async()=>{
const assert=require('node:assert/strict');
const A=require('./web-ai-bridge.js');
let agent=A.create();
assert.equal(agent.status().ready,false);
for(const url of ['http://api.example/chat','https://example.com/other',
 'https://user:password@example.com/chat','https://host/chat?key=SECRET']){
 assert.throws(()=>A.endpoint(url),url);
}
assert.throws(()=>agent.configure('https://example.com/chat','short'));
let state=agent.configure('https://own.example/chat','session-only-access-token');
assert.equal(state.ready,true);
assert.equal(agent.status().turns,0);
assert.ok(!JSON.stringify(agent.status()).includes('session-only-access-token'));
let calls=0;
const post=async(url,args)=>{
 calls++;
 assert.equal(url,'https://own.example/chat');
 assert.equal(args.headers['X-Linh-Access'],'session-only-access-token');
 assert.equal(args.credentials,'omit');
 assert.equal(args.mode,'cors');
 assert.ok(!args.body.includes('session-only-access-token'));
 assert.equal(JSON.parse(args.body).question,'Tarta và Karmic khác nhau?');
 return {ok:true,json:async()=>({reply:'Cần kiểm tra điều kiện kích hoạt riêng.'})};
};
let result=await agent.ask('Tarta và Karmic khác nhau?',{confirm:()=>false,remoteFetch:post});
assert.equal(result.cancelled,true);assert.equal(calls,0);
result=await agent.ask('Tarta và Karmic khác nhau?',{confirm:({body,endpoint})=>{
 assert.equal(endpoint,'https://own.example/chat');
 const j=JSON.parse(body);assert.deepEqual(j.history,[]);
 assert.deepEqual(Object.keys(j).sort(),['gameName','history','question','version']);
 return true;
},remoteFetch:post});
assert.equal(result.ok,true);
assert.equal(calls,1);
assert.equal(agent.status().turns,2);
assert.ok(!JSON.stringify(agent.status()).includes('Cần kiểm tra'));
const second=await agent.ask('Tarta và Karmic khác nhau?',{
 confirm:({body})=>{const j=JSON.parse(body);assert.deepEqual(j.history.map(z=>z.role),['user','assistant']);return false},
 remoteFetch:post
});
assert.equal(second.cancelled,true);
agent.clear();assert.equal(agent.status().turns,0);
agent.disconnect();assert.equal(agent.status().ready,false);
assert.equal(agent.status().turns,0);
assert.equal((await agent.ask('Hello',{confirm:()=>true,remoteFetch:post})).ok,false);
// A late upstream response cannot restore history after a user disconnects.
agent.configure('https://own.example/chat','session-only-access-token');
let finish;
const waiting=agent.ask('Tarta và Karmic khác nhau?',{
 confirm:()=>true,
 remoteFetch:()=>new Promise(resolve=>{finish=resolve;})
});
await Promise.resolve();
agent.disconnect();
finish({ok:true,json:async()=>({reply:'This stale response must be discarded'})});
const stale=await waiting;
assert.equal(stale.cancelled,true);
assert.equal(agent.status().turns,0);
assert.equal(agent.status().ready,false);
console.log('PASS: AI external call requires per-request exact preview and never stores auth or private screenshots');

})().catch(error=>{console.error(error);process.exitCode=1;});
