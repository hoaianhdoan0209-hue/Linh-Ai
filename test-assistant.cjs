'use strict';
const assert=require('node:assert/strict');
const A=require('./assistant-engine.js');
const fakeMath={
 simulate:()=>({normal:1000,critical:1500,expected:1200}),
 optimize:()=>({items:[{name:'Thiêu đốt'},{name:'Khuếch đại'}],result:{expected:1800},tested:6}),
 analyzeEvidence:()=>({message:'Dữ liệu đang nghiêng về cách nhân, chưa đủ kết luận.'})
};
const base={name:'Trò chơi A',stats:{},effects:[{name:'Thiêu đốt'}],modes:{},observations:[],notes:[],learning:{items:[]}};
let r=A.analyze('Combo nào tốt?',base,null,fakeMath);
assert.equal(r.intent,'combo');
assert.match(r.reply,/1\.800/);
assert.ok(r.unknown.length);
r=A.analyze('Làm sao kiểm chứng cộng hay nhân?',base,null,fakeMath);
assert.equal(r.intent,'test');assert.match(r.reply,/chỉ bật A/);
r=A.analyze('Linh thấy gì từ ảnh?',base,{facts:[{label:'Chí mạng',value:35}],hypotheses:['Có thể nhân buff'],questions:['Buff kéo dài mấy giây?']},fakeMath);
assert.equal(r.intent,'image');assert.match(r.reply,/35%/);assert.equal(r.next.length,1);
r=A.analyze('Đã học được gì?',base,null,fakeMath);assert.match(r.reply,/0 ảnh OCR/);
const wrong={...base,learning:{items:[{status:'rejected',tags:['burn']},{status:'pending',tags:['poison']},{status:'accepted',tags:['crit']}]}};
r=A.analyze('Cơ chế burn và poison?',wrong,null,fakeMath);
assert.ok(!r.reply.includes('thiêu đốt, độc'),'rejected item is not evidence');
assert.match(r.evidence.join(' '),/1 quan sát OCR đã được xác nhận/);
r=A.analyze('đánh boss lâu',base,null,fakeMath,{focus:'combo'});assert.match(r.reply,/boss đánh lâu/);
r=A.analyze('Đúng',base,null,fakeMath,{focus:'combo'});assert.match(r.reply,/phối combo/);
assert.doesNotMatch(JSON.stringify(A.analyze('X',base,null,fakeMath)),/api_key|Bearer /i);
console.log('PASS: intent, combo math, experiment plan, image context, memory separation, correction');