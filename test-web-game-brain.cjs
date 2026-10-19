'use strict';
const assert=require('node:assert/strict');
const B=require('./web-game-brain.js');
const M=require('./web-image-memory.js');
const now=Date.now()-1000;
const has=(x,w)=>assert.ok(x?.text?.includes(w),'Expected '+JSON.stringify(x?.text)+' to include '+w);
const raw=JSON.stringify({version:1,items:[
 {kind:'chỉ số',facts:[{key:'critChance',value:35},{key:'critDamage',value:50}],
  tags:['crit'],at:now}
]});
const images=M.sanitize(raw);
assert.equal(images.length,1);
assert.deepEqual(B.pairedCrit(images),{chance:35,bonus:50,kind:'chỉ số'});
const crit=B.calcCrit(images,1000);
assert.equal(crit.average,1175);
assert.equal(crit.critical,1500);
assert.equal(B.calcCrit(images).multiplier,1.175);
has(B.answer('tính chí mạng với sát thương thường 1000',images,[]),'1.175');
assert.match(B.answer('tính chí mạng với sát thương thường 1000',images).text,/chưa xác minh/);
assert.equal(B.calcCrit([{facts:[{key:'critChance',value:35}],tags:[]},
                        {facts:[{key:'critDamage',value:50}],tags:[]}]),null,
 'Never combine different screenshot versions or gear into crit estimate');
assert.equal(B.calcCrit([]),null);

const r=B.compareBuffs(20,30,1000);
assert.equal(r.add,1.5);
assert.equal(r.multiply,1.56);
assert.equal(r.addDamage,1500);
assert.equal(r.multiplyDamage,1560);
assert.match(B.answer('Tính sát thương 1000 với 20% và 30%',images).text,/1\.500.*1\.560/);
assert.match(B.answer('20% cộng 30% hay nhân',images).text,/50%.*56%/);
assert.match(B.answer('20% và 30% với 40%',images).text,/hơn hai hệ số/);
assert.equal(B.compareBuffs(10000,30),null);
assert.equal(B.answer('xin chào',images),null, 'Normal dialogue must remain independent');
assert.match(B.answer('tính chí mạng',[]).text,/Chưa có đủ tỷ lệ/);

assert.deepEqual(B.sanitize('broken'),[]);
assert.deepEqual(B.sanitize({version:50,items:[]}),[]);
let add=B.addNote([],'Boss rắn có thể kháng độc',now);
assert.equal(add.added,true);
assert.match(add.reason,/Chưa kiểm chứng/);
assert.equal(add.items.length,1);
assert.equal(add.items[0].status,'chưa kiểm chứng');
assert.equal(B.addNote(add.items,'boss rắn có thể KHÁNG ĐỘC',now+100).added,false);
assert.equal(B.addNote(add.items,'Tôi tên là A',now+100).added,false);
assert.equal(B.addNote(add.items,'Game mật khẩu: 12345',now+100).added,false);
assert.equal(B.addNote(add.items,'Game server https://example.com',now+100).added,false);
const saved=B.answer('Ghi nhớ game: boss rắn có thể kháng độc',images,[]);
assert.equal(saved.action,'save-note');
has(saved,'Đã lưu');
assert.ok(saved.notes?.length===1);
const loaded=B.sanitize(B.payload(saved.notes));
assert.equal(loaded.length,1);
const sum=B.answer('Socrates đã học gì',images,loaded,{observationCount:4,verifiedOCR:2});
has(sum,'1 ảnh OCR');
has(sum,'1 ghi chú');
has(sum,'4 phép đo');
assert.match(sum.text,/chưa kiểm chứng/i);
has(B.answer('so sánh phép đo sát thương',images,loaded,{comparison:'1000 → 1200 (+20%). Chưa rõ nguyên nhân.'}),
 '1000');
assert.equal(B.answer('quên ghi chú game').action,'confirm-clear-notes');
assert.match(B.nextStudyPrompt(images,loaded),/kiểm chứng/);
assert.match(B.nextStudyPrompt(images,[]),/tỷ lệ chí mạng/);
assert.equal(B.nextStudyPrompt([],[]),null);

let notes=[];
for(let i=0;i<34;i++)notes=B.addNote(notes,'Boss '+i+' có thể kháng độc',now+i).items;
assert.equal(notes.length,B.MAX_NOTES,'Bounded local memory');
assert.equal(B.sanitize({version:1,items:[{text:'Game trạng thái cũ',at:now-366*24*3600*1000}]}).length,0);
assert.equal(B.parseDamageBase('Tính 1000 với 20% 30%'),1000);
assert.equal(B.parseDamageBase('Tính 20% 30%'),null);
assert.ok(B.answer('Tính sát thương 1000 với 20% và 30%',images).text.length<=230);
console.log('PASS: local Socrates math, conservative critical calculations, approved OCR + unverified bounded notes');
