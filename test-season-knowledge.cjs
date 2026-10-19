const assert=require('node:assert/strict');
const fs=require('node:fs');
assert.equal(fs.readFileSync('gateway/season-knowledge.cjs','utf8'),fs.readFileSync('season-knowledge.js','utf8'));
const k=require('./season-knowledge.js'),b=require('./web-game-brain.js');
assert.match(b.answer('Karmic Cinderpult sát thương thế nào?').text,/480%/);
assert.match(b.answer('Anemoian Cortain').text,/160%/);
assert.match(b.answer('Charred Aperture').text,/120%/);
assert.match(b.answer('Tarta 4 món').text,/320%/);
assert.match(b.answer('Searing Colossus hồi chiêu').text,/ngay khi/);
assert.equal(k.lookup('Genshin Karmic Cinderpult').length,0);
assert.equal(k.lookup('Karmic Cinderpult','Diablo').length,0);
assert.equal(k.lookup('đã học gì').length,0);
assert.doesNotMatch(b.summary([],[],null).text,/SS9|480|Karmic/);
assert.equal(b.nextStudyPrompt([],[]),null);
assert.equal(b.answer('Karmic Cinderpult').action,undefined);
assert.match(b.answer('tính 20% và 30%').text,/56%/);
const html=fs.readFileSync('index.html','utf8').replace(/<script[\s\S]*?<\/script>/g,'');
assert.doesNotMatch(html,/SS9|Karmic Cinderpult|Three Kingdoms/);
const swift=fs.readFileSync('ios/LinhCompanion/Sources/SeasonKnowledge.swift','utf8');
for(const q of ['Karmic Cinderpult','Anemoian Cortain','Charred Aperture','Tarta'])assert.ok(swift.includes(k.lookup(q)[0].text));
// Some SS9 item-name screenshots contain no generic stat/keyword: OCR still
// identifies the named mechanic and the Web should reply, not silently drop it.
const V=require('./vision-engine.js'),M=require('./web-image-memory.js');
for(const name of ['Karmic Cinderpult','Wolong','Conquer the Pass']){
  assert.equal(M.candidate(name,V.observe(name)),null,'No false numeric facts from '+name);
  assert.ok(k.lookup(name).length,'Internal named knowledge exists for '+name);
}
const page=fs.readFileSync('index.html','utf8');
assert.ok(page.includes("if(named.length){\n       coach.reset();"),
  'Image without numeric OCR must still answer recognized SS9 names');
assert.ok(page.includes("ảnh không được ghi nhớ."),
  'Name-only OCR must not be saved as a verified photo');
assert.ok(page.includes("const named=window.SocratesSeasonKnowledge?.lookup(raw)||[];"),
  'Season lookup must run independently from numeric OCR candidate');
assert.ok(page.includes('const patchFollowup=gameBrain.followup(message,lastPatch);'),
  'Image/patch conversation needs a contextual follow-up route');
assert.ok(page.includes('lastPatch=named[0]||null;'),
  'OCR patch fact should live in the current conversation only');
assert.ok(page.includes('if(clear)lastPatch=null;'),
  'Clearing chat must forget temporary SS9 conversation context');
console.log('PASS: SS9 scoped knowledge, image-only named patch fallback, no UI/summary/automatic speech exposure');
