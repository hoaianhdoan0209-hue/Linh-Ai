'use strict';
const assert=require('node:assert/strict');
const M=require('./web-image-memory.js');
const V=require('./vision-engine.js');
const NOW=Date.UTC(2026,9,19,3);
const imageText='Tỷ lệ chí mạng: 35%\nThiêu đốt mục tiêu\nKỹ năng hồi chiêu 8 giây';
const v=V.observe(imageText);
const candidate=M.candidate(imageText,v);
assert.ok(candidate,'OCR of photographed stats should yield structured candidate');
assert.equal(candidate.kind,'kỹ năng','a skill screenshot should be marked tentative skill');
assert.ok(candidate.facts.some(f=>f.key==='critChance'&&f.value===35));
assert.ok(candidate.tags.includes('burn'));
assert.ok(candidate.tags.includes('cooldown'));
assert.match(M.describe(candidate),/Bệ hạ xác nhận/);
assert.equal(M.candidate('Một bức tranh không có chữ rõ',V.observe('Một bức tranh không có chữ rõ')),null,
 'arbitrary image must not hallucinate any facts');
assert.equal(M.candidate('',{facts:[{key:'admin',value:100}],tags:[{key:'private'}]}),null);
assert.equal(M.candidate('',{facts:[{key:'critChance',value:100000}],tags:[]}),null);

let saved=M.approve([],candidate,NOW);
assert.equal(saved.added,true,'memory only saved after explicit approval');
assert.equal(saved.items.length,1);
const raw=JSON.stringify(saved.items);
assert.doesNotMatch(raw,/Thiêu đốt mục tiêu|Kỹ năng hồi chiêu 8 giây|base64|image\/png/,
 'Raw OCR text and screenshots are not stored');
const duplicate=M.approve(saved.items,candidate,NOW+12000);
assert.equal(duplicate.added,false);
assert.equal(duplicate.items.length,1);
assert.match(M.recall(saved.items),/35%/);
assert.match(M.recall([]),/chưa lưu/);

const payload=M.payload(saved.items);
const restored=M.sanitize(payload,NOW);
assert.equal(restored.length,1);
assert.ok(!Object.hasOwn(restored[0],'text'));
assert.ok(!Object.hasOwn(restored[0],'image'));
assert.equal(M.sanitize('{',NOW).length,0);
assert.equal(M.sanitize('x'.repeat(180001),NOW).length,0);
assert.equal(M.sanitize(JSON.stringify({version:2,items:saved.items}),NOW).length,0);
assert.equal(M.sanitize({version:1,items:[
 {kind:'hiệu ứng',facts:[],tags:['private'],at:NOW}
]},NOW).length,0);
assert.equal(M.sanitize({version:1,items:[
 {kind:'chỉ số',facts:[{key:'critChance',value:37}],tags:[],at:NOW-366*24*3600*1000}
]},NOW).length,0);

let many=[];
for(let i=1;i<=51;i++){
 const c={kind:'chỉ số',facts:[{key:'critChance',value:i}],tags:[]};
 many=M.approve(many,c,NOW+i).items;
}
assert.equal(many.length,M.LIMIT,'storage must be bounded');
assert.match(M.recall(many),/51%/);
console.log('PASS: opt-in OCR memory, no screenshot/text persistence, duplicate and privacy controls');
