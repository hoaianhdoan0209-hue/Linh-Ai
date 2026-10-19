'use strict';
const assert=require('node:assert/strict');
const S=require('./prompt-strategy.js');
const B=require('./build-systems.js');
assert.equal(S.plan('Chào Socrates'),null);
assert.equal(S.answer('Tôi buồn'),null);
assert.equal(S.answer('xóa hội thoại'),null);
assert.equal(S.answer('Mô phỏng 10s; skill a damage 10 cooldown 2s'),null);
assert.equal(S.plan('nên chọn không?'),null,'No unknown referent without a build');
const t=B.inspect('Tarta 3 món Hellscream',{source:'image'});
const p=S.plan('Có nên đổi món này không?',{context:t});
assert.equal(p.intent,'compare');
assert.equal(p.mechanicId,'tarta');
assert.ok(p.prompt.includes('Tarta'));
assert.ok(p.prompt.includes('3/4'));
assert.equal(p.confidence,'insufficient-real-game-evidence');
assert.equal(p.source,'unconfirmed-ocr');
const reply=S.answer('Có nên đổi món này không?',{context:t});
assert.match(reply.text,/chưa đủ điều kiện kích hoạt/i);
assert.match(reply.text,/hai phương án|2 phương án/i);
const evaluated=S.evaluateResponse('Có nên đổi món này không?',reply,{context:t});
assert.equal(evaluated.score,100,JSON.stringify(evaluated));
const misleading=S.evaluateResponse('Có nên đổi món này không?', 'Chắc chắn món này mạnh nhất, cứ đổi.',{context:t});
assert.ok(misleading.score<=40);
assert.ok(misleading.flags.includes('ignores-set-prerequisite'));
const karmic=B.inspect('Karmic Cinderpult',{source:'user-text'});
const d=S.answer('Tại sao không kích hoạt?',{context:karmic});
assert.match(d.text,/cokerize/);
assert.match(S.answer('Làm sao kiểm chứng?',{context:karmic}).text,/Adhesive Gunpowder/);
const v=S.plan('Làm sao kiểm chứng?',{context:karmic});
assert.equal(v.intent,'verify');
assert.ok(v.prompt.includes('Karmic Cinderpult'));
assert.equal(S.plan('Cảm ơn Bệ hạ',{context:karmic}),null);
const generic=S.plan('Tối ưu build thế nào?');
assert.equal(generic.intent,'optimize');
assert.ok(generic.missing.some(x=>x.includes('Fatestone')));
assert.match(S.answer('Tối ưu build thế nào?').text,/kỹ năng chủ lực/);
const testcases=[
 {name:'Set gate after OCR',prompt:'Nên đổi món này không?',context:t,intent:'compare',snippet:'4'},
 {name:'Failure diagnosis',prompt:'Vì sao yếu?',context:karmic,intent:'diagnose',snippet:'cokerize'},
 {name:'Mechanic test',prompt:'Cách đo thực tế?',context:karmic,intent:'verify',snippet:'Adhesive'},
 {name:'General optimization',prompt:'Tối ưu build',context:null,intent:'optimize',snippet:'điều kiện'},
 {name:'General talk immunity',prompt:'xin chào',context:karmic,intent:null},
 {name:'Simulation command immunity',prompt:'rotation 10s',context:karmic,intent:null}
];
let total=0;
for(const c of testcases){
 const p=S.plan(c.prompt,{context:c.context});
 assert.equal(p?.intent||null,c.intent,c.name);
 if(c.snippet)assert.ok(S.answer(c.prompt,{context:c.context}).text.includes(c.snippet),c.name);
 total++;
}
assert.equal(total,6);
console.log('PASS: prompt strategy intent planning, scenario-driven evaluation, set-gate OCR and no false generative claims');
