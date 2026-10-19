'use strict';
const assert=require('node:assert/strict');
const W=require('./web-companion.js');
const T=Date.UTC(2026,9,19,12);

assert.equal(W.STATE_KEY,'linh-companion-web-v1');
assert.equal(W.LEGACY_KEY,'linh-web-local-v02');
assert.equal(W.startVisit(null,T).visits,1);
let memory=W.startVisit(null,T);
let m2=W.startVisit(memory,T+60*1000);
assert.equal(m2.visits,1,'reload in same session must not inflate visits');
m2=W.startVisit(m2,T+33*60*1000);
assert.equal(m2.visits,2,'later visits are remembered');
assert.equal(W.tap(m2).taps,1);
assert.equal(W.sanitizeState({visits:-99,taps:'bad',lastVisit:Infinity,voice:'true'}).taps,0,
  'malformed local memory must be bounded');
assert.equal(W.sanitizeState({voice:true}).voice,true);
assert.ok(W.greeting(m2,14).includes('quay lại'));

const demo={version:2,selectedId:'a',
 games:[{id:'a',name:'Game mẫu · đổi tên hoặc tạo mới',
  observations:[{actual:1000,context:'A'},{actual:1250,context:'A'}],
  notes:[{kind:'Đã kiểm chứng'}],
  learning:{items:[{status:'accepted',tags:['burn']}]}}]};
assert.equal(W.readLegacy(JSON.stringify(demo)),null,'demo data must never be treated as played game');
assert.equal(W.readLegacy('{invalid'),null);
assert.equal(W.readLegacy(JSON.stringify({version:99,games:[]})),null);
assert.equal(W.readLegacy('x'.repeat(2*1024*1024+1)),null,'limit stored data size');

function game(observations=[],items=[],notes=[]){
  return {version:2,selectedId:'real',games:[{
    id:'real',name:'Soul Knight Prequel',observations,notes,
    learning:{items}
  }]};
}
const real=game([
  {actual:1000,context:'cùng mục tiêu'},{actual:1250,context:'cùng mục tiêu'}
],[
  {status:'rejected',tags:['poison']},
  {status:'pending',tags:['armor']},
  {status:'accepted',tags:['crit','hidden']},
  {status:'accepted',tags:['burn']}
],[{kind:'Giả thuyết'},{kind:'Đã kiểm chứng'}]);
const read=W.readLegacy(JSON.stringify(real));
assert.equal(read.name,'Soul Knight Prequel');
assert.equal(read.verifiedOCR,2);
assert.equal(read.awaitingOCR,1);
assert.equal(read.markedNotes,1);
assert.deepEqual(read.tags,['crit','burn'],'do not add rejected or unknown tags');
assert.match(read.comparison,/\+25%/);
assert.ok(W.suggestions(read).some(x=>x.kind==='memory'));
assert.ok(W.suggestions(read).some(x=>x.kind==='calculation'));
assert.ok(!W.suggestions(read).some(x=>x.text.includes('poison')),'rejected OCR excluded');

let thoughts=W.suggestions(read);
for(const item of thoughts){
  assert.ok(item.text.length>0&&item.text.length<=96,'short mobile-only thoughts');
  assert.doesNotMatch(item.text,/API_KEY|Bearer |chắc chắn tăng sát thương/i);
}
const next=W.nextThought({taps:1},read);
assert.equal(next.kind,'calculation','grounded arithmetic appears first');
assert.equal(W.nextThought({taps:1,lastIdea:next.key},read).key,'verified-ocr',
  'avoid immediate duplicate');

const different=game([{actual:1000,context:'boss A'}, {actual:1250,context:'boss B'}]);
assert.equal(W.readLegacy(JSON.stringify(different)).comparison,null,
  'two different targets are not mathematically comparable');
const badDamage=game([{actual:1000,context:''},{actual:1250,context:''}]);
assert.equal(W.readLegacy(JSON.stringify(badDamage)).comparison,null,
  'unlabeled damage must not be compared');
assert.equal(W.compareSameContext([{actual:1,context:'a'},{actual:1000,context:'a'}]),null,
  'wild OCR outliers are rejected');
assert.equal(W.compareSameContext([{actual:1000,context:'a'}]),null);

const rejectedOnly=W.readLegacy(JSON.stringify(game([],[
  {status:'rejected',tags:['burn']},{status:'pending',tags:['poison']}
])));
assert.equal(rejectedOnly.verifiedOCR,0);
assert.equal(rejectedOnly.tags.length,0);
assert.ok(W.suggestions(rejectedOnly).every(x=>x.kind==='suggestion'),
  'no invented insights without confirmed observations');

const neutral=W.nextThought({taps:1},null);
assert.equal(neutral.kind,'suggestion');
assert.doesNotMatch(neutral.text,/đã thấy game|đang xem màn hình/i);
console.log('PASS: Linh Web memory, safe legacy evidence, arithmetic, no invented OCR, short UI');
