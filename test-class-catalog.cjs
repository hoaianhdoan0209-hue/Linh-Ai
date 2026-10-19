'use strict';
const assert=require('node:assert/strict');
const C=require('./class-catalog.js');
const expected=['Voidfarer','DreadKnight','Dark Ranger','Astral Mage','Necromancer'];
assert.deepEqual(C.rows.map(x=>x.name),expected);
assert.equal(C.rows.length,5);
assert.equal(C.rows.reduce((sum,x)=>sum+x.active.length+x.passive.length,0),34);
for(const c of C.rows){
 assert.equal(c.active.length,4,c.name);
 assert.ok(c.passive.length>=2,c.name);
 assert.ok(c.source==='https://prequel.chillyroom.com/et/class/'+c.id);
 assert.match(c.seasonScope,/NOT SS9 tier balance/);
 assert.ok(!/[0-9]+%/.test(c.core),'No invented skill multipliers');
}
assert.deepEqual(C.find('DreadKnight đang dùng Dark Covenant').map(x=>x.name),['DreadKnight']);
assert.equal(C.find('Starlight in the Everdark')[0].name,'Voidfarer');
assert.equal(C.find('Excantation: Iridescence')[0].name,'Astral Mage');
assert.equal(C.find('Atrophic Torrent')[0].name,'Necromancer');
assert.match(C.answer('DreadKnight là class gì?').text,/Voidfarer \+ Warrior/);
assert.match(C.answer('Các class trong Soul Knight Prequel?').text,/Không phải danh sách toàn bộ SS9/);
assert.match(C.answer('Chọn class nào?').text,/Không phải danh sách toàn bộ SS9/);
assert.equal(C.answer('Xin chào!'),null);
assert.equal(C.answer('Tôi muốn mua đồ'),null);
assert.match(C.answer('DreadKnight').text,/https:\/\/prequel.chillyroom.com\/et\/class\/2/);
assert.equal(C.find('toàn bộ class đã có').length,0);
console.log('PASS: 5 source-grounded ChillyRoom classes, 34 named skills and no fake SS9 formulas or complete-roster claims');
