'use strict';
const assert=require('node:assert/strict');
const R=require('./ss9-class-roster.js');
assert.equal(R.basics.length,10);
assert.equal(R.combined.length,25);
assert.equal(R.direct.length,4);
assert.equal(R.all.length,39);
assert.equal(new Set(R.all.map(x=>R.norm(x.name))).size,39);
for(const r of R.all){
 assert.ok(r.grade&&r.source&&r.style);
 assert.equal(r.verifiedEffect,false);
 if(r.kind==='combined')assert.ok(r.base.length===0||r.base.length===2);
}
assert.equal(R.identified('Necromancer')[0].base.join('+'),'Animancer+Voidfarer');
assert.equal(R.identified('Paragon')[0].base.join('+'),'Aegis+Lightbringer');
assert.equal(R.identified('Lightbinder')[0].name,'Lightbringer');
assert.equal(R.identified('Pyroshot')[0].name,'Artillerist');
assert.equal(R.identified('Dread Knight')[0].name,'Dreadknight');
assert.equal(R.identified('Wildwalker')[0].base.join('+'),'Warrior+Herbalist');
assert.equal(R.identified('Stormwarden')[0].grade,'conflicting-sources');
assert.deepEqual(R.identified('Stormwarden')[0].base,[]);
assert.equal(R.identified('Stormwarden')[0].unresolved.length,2);
assert.ok(R.identified('Nyxen')[0].kind==='direct');
const result=R.answer('có bao nhiêu class trong game?');
assert.match(result.text,/10 tên cơ bản, 25 tên kết hợp và 4 tên độc lập/);
assert.match(result.text,/39 mục/);
assert.match(result.text,/chưa hoàn chỉnh/);
assert.match(R.answer('Necromancer').text,/Bảng được cung cấp ghi Pyromancer \+ Voidfarer/);
assert.match(R.answer('Stormwarden').text,/đang có nguồn mâu thuẫn/);
assert.match(R.answer('Astreon').text,/Độc lập/);
assert.equal(R.answer('Xin chào Socrates'),null);
assert.equal(R.answer('món trang bị tôi đang dùng'),null);
console.log('PASS: SS9 10+25+4 provisional roster, Nyxen, aliases, source flags, 4 disputed/corrected pairings');

for (const [query,name] of [["pháp sư tử linh","Necromancer"],["chiến binh","Warrior"],["pháp sư nguyên tố","Elementalist"]]) {
 const roster=require("./ss9-class-roster.js");
 require("node:assert/strict").equal(roster.identified(query)[0]?.name,name);
 require("node:assert/strict").equal(require("./gateway/ss9-class-roster.cjs").identified(query)[0]?.name,name);
}
