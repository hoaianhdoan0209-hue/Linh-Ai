'use strict';
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const html=fs.readFileSync('./index.html','utf8');
const block=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(m=>m[1]).find(s=>s.includes('Linh Learning 0.4:'));
assert.ok(block,'Missing embedded learning engine');
const mod={exports:{}};
vm.runInNewContext(block,{module:mod,globalThis:{}});
const L=mod.exports;
const vision={text:'Chí mạng: 25%\nThiêu đốt mục tiêu',tags:[{key:'crit'},{key:'burn'}],
 facts:[{key:'critChance',label:'Tỷ lệ chí mạng',value:25}],
 hypotheses:['Có thể kết hợp'],questions:['Thiêu đốt kéo dài bao lâu?']};
let m=L.sanitize({enabled:false,items:[]});
assert.equal(L.addObservation(m,vision,'now','a').added,false,'permission required');
m.enabled=true;
assert.equal(L.addObservation(m,vision,'now','a').added,true);
assert.equal(L.addObservation(m,vision,'now','b').reason,'duplicate');
assert.equal(L.summary(m).pending,1);
assert.equal(L.feedback(m,'a','accepted'),true);
assert.equal(L.summary(m).accepted,1);
assert.ok(L.recall(m,'Linh đã học được gì?').reply.includes('25%'));
assert.equal(L.feedback(m,'a','rejected'),true);
assert.equal(L.summary(m).signals.length,0,'OCR rejected by user must be excluded');
const clean=L.sanitize({enabled:true,items:[{id:'z',signature:'ok',tags:['burn','hidden-data'],facts:[{key:'critChance',value:30},{key:'private',value:99}]}]});
assert.equal(clean.items[0].facts.length,1);
assert.equal(clean.items[0].tags.length,1);
assert.ok(!JSON.stringify(L.addObservation({enabled:true,items:[]},vision,'now','q')).includes(vision.text),'never persist raw OCR');
console.log('PASS: permission, deduplication, OCR review, safe memory, recap');
