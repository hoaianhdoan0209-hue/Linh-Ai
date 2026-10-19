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
assert.equal(G.compareOptions(c,[{id:'dps',weight:2},{id:'dps',weight:1}]).ok,true,
 'Repeated criterion does not produce an unsupported decision, but callers should dedupe inputs');
assert.equal(G.compareOptions(c,[{id:'dps',weight:2}]).ok,true);
assert.equal(G.compareOptions(c,[{id:'dps',weight:2}]).ranked[0],'A');
assert.equal(G.compareOptions(c,w).scores.B,81.67);
console.log('PASS: session evidence, contradictions, corrected set counts, source provenance and conservative weighted decisions');
