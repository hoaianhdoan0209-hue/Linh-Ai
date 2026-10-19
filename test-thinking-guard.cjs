'use strict';
const assert=require('node:assert/strict');
const G=require('./thinking-guard.js');
let state=G.empty();
assert.equal(G.audit(state).status,'unknown');
state=G.observe(state,'Tarta 3 món Hellscream',{source:'unconfirmed-ocr'});
assert.equal(G.audit(state).status,'prerequisite-false');
assert.equal(G.audit(state).pieceCount,3);
assert.match(G.audit(state).blocking[0],/3\/4/);
state=G.observe(state,'Tarta 4 món',{source:'user-text'});
assert.equal(G.audit(state).status,'conflict');
assert.equal(G.audit(state).pieceCount,null);
assert.match(G.answer('nên chọn món nào',state).text,/mâu thuẫn/);
assert.equal(G.answer('cảm ơn',state),null,'Unrelated social chat not hijacked');
const n=G.observe(state,'Tarta 4 món',{source:'user-text'});
assert.equal(n.claims.length,2,'Repeated statement cannot erase contradiction');
state=G.observe(n,'đính chính Tarta 4 món',{source:'user-text'});
assert.equal(G.audit(state).status,'provisional');
assert.equal(G.audit(state).pieceCount,4);
assert.equal(G.audit(state).blocking.some(x=>/theo lời người chơi/.test(x)),true);
state=G.observe(state,'Karmic Cinderpult',{source:'user-text'});
assert.equal(state.mechanicId,'karmic');
assert.equal(state.claims.length,0,'New item is not combined with old set');
assert.equal(G.audit(state).status,'unverified');
assert.match(G.audit(state).nextTest,/Adhesive Gunpowder/);
const countBefore=state.revision;
state=G.observe(state,'Tôi cảm ơn Socrates',{source:'user-text'});
assert.equal(state.revision,countBefore);
assert.equal(G.observe(state,'Tarta 4 món',{replace:true,source:'unconfirmed-ocr'}).claims[0].source,'unconfirmed-ocr');
assert.equal(G.audit(G.observe(G.empty(),'Tarta',{source:'user-text'})).status,'unverified');
const c=[
 {id:'A',contextKey:'boss-1-same-cast-window',ratings:{dps:{value:90,evidence:'measured'},uptime:{value:40,evidence:'measured'}}},
 {id:'B',contextKey:'boss-1-same-cast-window',ratings:{dps:{value:75,evidence:'measured'},uptime:{value:85,evidence:'measured'}}}
];
const w=[{id:'dps',weight:2},{id:'uptime',weight:4}];
let comp=G.compareOptions(c,w);
assert.equal(comp.ok,true);
assert.equal(comp.ranked[0],'B');
assert.equal(comp.scope,'weighted-measurements-only');
assert.equal(G.compareOptions([c[0],{...c[1],contextKey:'different-boss'}],w).ok,false);
assert.equal(G.compareOptions([c[0],{...c[1],ratings:{dps:{value:75,evidence:'ocr'},uptime:c[1].ratings.uptime}}],w).ok,false);
assert.equal(G.compareOptions(c,[{id:'missing',weight:1}]).ok,false);
assert.equal(G.compareOptions(c,[{id:'dps',weight:0}]).ok,false);
assert.equal(G.compareOptions(c,[{id:'dps',weight:2},{id:'dps',weight:1}]).ok,false,
 'Duplicate criteria must not silently double-count a metric');
assert.equal(G.compareOptions(c,[{id:'dps',weight:2}]).ok,true);
assert.equal(G.compareOptions(c,[{id:'dps',weight:2}]).ranked[0],'A');
assert.equal(G.compareOptions(c,w).scores.B,81.67);
// A/B versions of the same set do not conflict with the equipped active build.
let alternatives=G.empty();
alternatives=G.observe(alternatives,'phương án A Tarta 3 món',{source:'user-text'});
alternatives=G.observe(alternatives,'phương án B Tarta 4 món',{source:'user-text'});
assert.equal(G.audit(alternatives).status,'unknown','Alternative evidence is not equipped active build');
assert.equal(G.auditAlternatives(alternatives).status,'separate-options');
assert.equal(G.auditAlternatives(alternatives).items.A.pieceCount,3);
assert.equal(G.auditAlternatives(alternatives).items.B.pieceCount,4);
assert.equal(G.answer('nên chọn phương án nào',alternatives).reason,'separate-builds');
assert.match(G.answer('so sánh A B',alternatives).text,/A: 3\/4/);
assert.match(G.answer('so sánh A B',alternatives).text,/B: người chơi khai báo 4\/4/);
assert.doesNotMatch(G.answer('so sánh A B',alternatives).text,/đang mâu thuẫn/);
assert.equal(G.answer('cảm ơn',alternatives),null);
let same=G.observe(alternatives,'phương án A Tarta 4 món',{source:'user-text'});
assert.equal(G.auditAlternatives(same).items.B.pieceCount,4,'Updating A must not alter B');
assert.equal(G.auditAlternatives(same).items.A.pieceCount,4);
const different=G.observe(same,'phương án B Karmic Cinderpult',{source:'user-text'});
assert.equal(G.auditAlternatives(different).status,'different-mechanics');
assert.equal(G.answer('so sánh hai phương án',different).reason,'non-comparable-builds');
assert.equal(G.auditAlternatives(G.empty()),null);
// Screenshot sequences are independent alternatives. Newest two form the pair.
let photos=G.observePhoto(G.empty(),'Tarta 3 món');
assert.equal(G.audit(photos).status,'prerequisite-false');
assert.equal(G.auditAlternatives(photos).status,'incomplete');
photos=G.observePhoto(photos,'Tarta 4 món');
assert.equal(G.audit(photos).status,'unknown','Two images do not establish currently equipped gear');
assert.equal(G.auditAlternatives(photos).status,'separate-options');
assert.equal(G.auditAlternatives(photos).items.A.pieceCount,3);
assert.equal(G.auditAlternatives(photos).items.B.pieceCount,4);
assert.match(G.answer('so sánh hai ảnh',photos).text,/A: 3\/4/);
photos=G.observePhoto(photos,'Tarta 2 món');
assert.equal(G.auditAlternatives(photos).items.A.pieceCount,4);
assert.equal(G.auditAlternatives(photos).items.B.pieceCount,2);
assert.equal(G.observePhoto(G.empty(),'không có chữ rõ').photoTail,null);
const double=G.observe(G.empty(),'phương án A Tarta 3 món; phương án B Tarta 4 món');
assert.equal(G.auditAlternatives(double).status,'separate-options');
assert.equal(double.variants.A.pieceCount,3);
assert.equal(double.variants.B.pieceCount,4);
const activeTarta=G.observe(G.empty(),'Tarta 3 món',{source:'user-text'});
assert.equal(G.audit(G.observe(activeTarta,'Tôi có 4 món đồ để hỏi giá')).pieceCount,3,
 'Unrelated item counts must not overwrite set status');
assert.equal(G.audit(G.observe(activeTarta,'4 món')).status,'conflict',
 'A short direct set count can remain a contextual followup');
const impossible=G.observe(G.empty(),'Tarta 5 món',{source:'user-text'});
assert.equal(G.audit(impossible).status,'invalid-count');
assert.equal(G.audit(impossible).pieceCount,null);
const diff=G.observe(double,'Anemoian Cortain',{source:'user-text'});
assert.equal(G.auditAlternatives(diff),null,'Unrelated mechanic must expire old comparison');
const imageProvenance=G.observePhoto(G.observePhoto(G.empty(),'Tarta 3 món'),'Tarta 4 món');
assert.match(G.answer('so sánh hai ảnh',imageProvenance).text,/OCR chưa xác nhận 4\/4/);
for(const [name,token] of [['Karmic Cinderpult','Adhesive Gunpowder'],
 ['Anemoian Cortain','Fortitude'],['Charred Aperture','Iridescence']]){
 const scenario=G.observe(G.empty(),name,{source:'user-text'});
 const advice=G.answer('vì sao không kích hoạt?',scenario);
 assert.equal(advice.reason,'unverified');
 assert.match(advice.text,new RegExp(token));
 assert.match(advice.text,/Phép thử tiếp theo/);
}
const tarta3=G.observe(G.empty(),'Tarta 3 món',{source:'user-text'});
assert.equal(G.answer('có đủ điều kiện không?',tarta3).reason,'prerequisite-false');
assert.match(G.answer('có đủ điều kiện không?',tarta3).text,/3\/4/);
console.log('PASS: session evidence, contradictions, corrected set counts, source provenance and conservative weighted decisions');
