'use strict';
const assert=require('node:assert/strict');
const C=require('./cloud-connector.js');
assert.equal(C.checkEndpoint('http://wrong.test/chat'),null);
assert.equal(C.checkEndpoint('https://user:secret@host.test/chat'),null);
assert.equal(C.checkEndpoint('https://127.0.0.1/chat'),null);
assert.ok(C.checkEndpoint('https://assistant.example.com/chat'));
const g={name:'Game X',stats:{attack:25,critChance:30},effects:[{name:'Burn',type:'damagePercent',value:20}],learning:{items:[
 {status:'rejected',tags:['burn'],facts:[{label:'Tăng công',value:300}]},
 {status:'pending',tags:['poison'],facts:[]},
 {status:'accepted',tags:['crit'],facts:[{label:'Chí mạng',value:30}]}
]},notes:[{kind:'Giả thuyết',text:'A+B nhân sát thương'},{kind:'Đã kiểm chứng',text:'A mạnh hơn B'}]};
const only=C.prepare('Nên phối gì?',g);
assert.deepEqual(Object.keys(only),['version','question','gameName']);
assert.equal(JSON.stringify(only).includes('300'),false);
const selected=C.prepare('Nên phối gì?',g,{confirmed:true,stats:true});
assert.equal(selected.stats.attack,25);
assert.equal(selected.confirmedOCR.length,1);
assert.equal(selected.confirmedNotes.length,1);
assert.equal(JSON.stringify(selected).includes('A+B'),false);
const withHyp=C.prepare('Có gì chưa rõ?',g,{hypotheses:true});
assert.equal(withHyp.unverifiedNotes.length,1);
assert.equal(C.readReply({reply:' Chưa đủ chứng cứ. '}).reply,'Chưa đủ chứng cứ.');
(async()=>{
 const fake=async (url,init)=>{assert.equal(init.method,'POST');assert.equal(init.credentials,'omit');assert.equal(init.headers['X-Linh-Access'],'temporary-access');return{ok:true,json:async()=>({reply:'Thử riêng từng buff rồi thử kết hợp.'})};};
 const out=await C.send('https://linh.example.com/chat','temporary-access',only,fake);
 assert.match(out.reply,/Thử riêng/);
 let called=false;
 try{await C.send('http://unsafe.test','temporary-access',only,()=>{called=true;});assert.fail('should reject');}catch(e){assert.match(e.message,/HTTPS/);}
 assert.equal(called,false);
 console.log('PASS: explicit opt-in, confirmed-only payload, endpoint security, gateway contract');
})().catch(e=>{console.error(e);process.exitCode=1;});
