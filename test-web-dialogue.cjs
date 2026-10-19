'use strict';
const assert=require('node:assert/strict');
const D=require('./web-dialogue.js');
const good=r=>{
  assert.equal(typeof r.text,'string');
  assert.ok(r.text.length>5 && r.text.length<=D.MAX_REPLY,
    'Mobile bubble reply must be bounded');
  assert.doesNotMatch(r.text,/đang xem màn hình game|đã nhìn thấy game|đã chụp màn hình/i,
    'No fake game observation');
  return r;
};
assert.match(good(D.respond('Chào Linh')).text,/Linh đây/);
assert.match(good(D.respond('Linh là ai')).text,/quy tắc cục bộ/);
assert.match(good(D.respond('Linh có xem game không')).text,/không nhìn được/);
assert.match(good(D.respond('Hôm nay tôi buồn quá')).text,/nghe/);
assert.equal(D.respond('có', {focus:'support'}).focus,'support');
assert.match(good(D.respond('không',{focus:'support'})).text,/không gặng hỏi/);
assert.match(good(D.respond('Kể một chuyện vui')).text,/slime/);
const story=good(D.respond('kể chuyện'));
assert.equal(story.focus,'story');
assert.match(good(D.respond('tiếp đi',{focus:story.focus})).text,/kiếm thuật|né đòn|slime/);
assert.match(good(D.respond('có',{focus:story.focus})).text,/né đòn/);
assert.equal(D.respond('combo nào ngon').focus,'game');
assert.equal(D.respond('boss',{focus:'game'}).focus,'game');
assert.match(good(D.respond('sát thương và chí mạng')).text,/chí mạng/);
assert.match(good(D.respond('Linh có thông minh không')).text,/quy tắc/);
assert.match(good(D.respond('tạm biệt')).text,/chào/);
assert.match(good(D.respond('nói về điều bí mật')).text,/chưa hiểu/);
assert.match(good(D.respond('xóa hội thoại')).text,/xóa ngữ cảnh/);
const prior={focus:'game'}, snapshot=JSON.stringify(prior);
D.respond('tiếp',prior);
assert.equal(JSON.stringify(prior),snapshot,'Context must be pure and safe to discard');
assert.equal(D.norm('Đã  HỌC?'),'da hoc');
assert.ok(D.respond('x'.repeat(1500)).text.length<=D.MAX_REPLY);

const legacy={name:'Soul Knight Prequel',hasData:true,verifiedOCR:3,observationCount:5};
assert.match(good(D.respond('nhớ gì về game',{},legacy)).text,/5 phép đo/);
assert.match(good(D.respond('game có gì',{},null)).text,/chưa nhìn game/i);
for(const q of [
  'hello','bạn khỏe không','tôi vui quá','mệt','tôi cô đơn',
  'Cảm ơn','Linh không cần xem màn hình','farm quái',
  'trang bị','đừng xem game','có','không','tiếp đi','ngủ ngon',
  'Bệ hạ chơi Soul Knight Prequel','tối ưu build farm',
]) good(D.respond(q,{focus:'game'},legacy));
console.log('PASS: two-way local dialogue, session followups, support, story, game and honest limits');
