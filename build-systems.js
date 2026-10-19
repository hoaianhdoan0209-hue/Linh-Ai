/* Socrates SS9 build constraints 1.0.
 * Season-aware, explainable rule graph. Never infers a complete build from
 * screenshot OCR; never promotes item names into measured player performance.
 * No network, DOM, persistence, model/API calls, screenshots or speech.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SocratesBuildSystems=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const RELEASE='SS9';
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const compact=s=>String(s??'').replace(/\s+/g,' ').trim().slice(0,230);
const official={
 transition:'https://prequel.chillyroom.com/et/article/base/344',
 builds:'https://prequel.chillyroom.com/et/article/base/239',
 hotfix:'https://prequel.chillyroom.com/et/article/base/358'
};
const systems=Object.freeze([
 {id:'class',label:'Lớp nhân vật và Concordance',terms:['artillerist','wildwalker','pyroknight','assassin','astreon','nyxen','dark ranger','elementalist','shinobi','necromancer','ranger','class concordance','lop nhan vat','he phai']},
 {id:'skills',label:'Kỹ năng chủ lực, Specialization và Awakened Skill',terms:['adhesive gunpowder','breath of the wild','karmic cinderpult','anemoian cortain','charred aperture','hellscream','earthspike','awakened skill','specialization','ky nang','skill','chieu','soulforce']},
 {id:'legendary',label:'Hiệu ứng Legendary theo 5 cấp SS9',terms:['legendary','insane','tier','hieu ung trang bi','trang bi','vu khi','set','bo do','bo trang bi']},
 {id:'fatestone',label:'Fatestone / Calamity Fatebound và preset',terms:['fatestone','fatebound','calamity','calamitous','canh gioi','khac menh']},
 {id:'affix',label:'Forged Affix và Celesturgic Affix',terms:['forged','celesturgic','affix','affixia','forging replace','forging replacement','recast','replacement','phu to','duc']},
 {id:'sacred',label:'Sacred Soul và tương tác kỹ năng',terms:['sacred soul','sacred souls','thanh hon','linh hon']},
 {id:'eidolon',label:'Eidolon, thiên phú và mức phát triển',terms:['eidolon','wolong','yueying','器灵','khi linh']},
 {id:'axial',label:'Axial Incarnate, Boss Set, Core và Potency',terms:['axial','incarnate','boss set','potency','core','echo']},
 {id:'rotation',label:'Vòng xoay chiêu, nội tại, hồi chiêu và tài nguyên',terms:['hoi chieu','cooldown','rotation','buff','stack','tang','proc','soulforce','ember','mana','fortitude','nhiet','sac','nhan','co che']},
 {id:'target',label:'Mục tiêu, kháng, cơ chế boss và chiến trường',terms:['boss','farm','map','thu thanh','crucible','proving','enigm','resist','khang','phong thu','dreadmarch','labyrinth']},
 {id:'measurements',label:'Phép đo cùng điều kiện và kiểm chứng',terms:['do sat thuong','damage test','thuc do','dps','so sanh','thu nghiem','test','kiem chung']}
]);
const mechanics=Object.freeze([
 {id:'karmic',aliases:['karmic cinderpult'],label:'Karmic Cinderpult',
  requirement:'Cần xác minh mục tiêu đang bị cokerize và sát thương thực do Adhesive Gunpowder gây.',
  limitation:'Mức +480% chỉ áp dụng vào tương tác này ở cấp hiệu ứng nêu trong bản vá, không cộng vào toàn bộ build.',
  test:'Đo riêng Adhesive Gunpowder trên cùng mục tiêu: khi có và không có điều kiện cokerize.'},
 {id:'anemoian',aliases:['anemoian cortain'],label:'Anemoian Cortain',
  requirement:'Cần biết cấp hiệu ứng, Breath of the Wild, tốc đánh, cách tạo airburst và duy trì Fortitude.',
  limitation:'Không thể lấy riêng +160% làm hệ số DPS tổng; nhịp cyclone/airburst và phạm vi đã thay đổi.',
  test:'So sát thương trong cùng 20 giây, số lần airburst và độ ổn định Fortitude.'},
 {id:'tarta',aliases:['tarta s commendation','tarta'],label:'Tarta’s Commendation',
  requirement:'Cần kiểm tra đã trang bị đủ 4 món, Hellscream và số Earthspike thực sự được kích nổ.',
  limitation:'Mức +320% là cơ chế kích nổ ở đủ 4 món, không áp khi chỉ có 2–3 món.',
  test:'Thử cùng mục tiêu khi chưa đủ và khi đủ 4 món; đếm số Earthspike trúng mục tiêu.'},
 {id:'charred',aliases:['charred aperture'],label:'Charred Aperture',
  requirement:'Cần xem Excantation: Iridescence và số lượt concentrated attacks kích hoạt.',
  limitation:'Mức +120% áp vào kỹ năng liên quan, không mặc định tăng mọi đòn đánh.',
  test:'Ghi sát thương riêng kỹ năng trước/sau, cùng số lần kích hoạt concentrated attacks.'}
]);
function pickMechanics(input){
 const q=' '+norm(input)+' ';
 return mechanics.filter(r=>r.aliases.some(a=>q.includes(' '+norm(a)+' '))).slice(0,3);
}
function pickSystems(input){
 const q=' '+norm(input)+' ';
 return systems.filter(s=>s.terms.some(t=>q.includes(' '+norm(t)+' '))).map(s=>s.id);
}
function pieceCount(input){
 const q=norm(input);
 const patterns=[/(?:du|full|co|mac|set|bo)\s+([1-6])\s+(?:mon|pieces?)/, /([1-6])\s*(?:\/\s*4|mon|pieces?)/];
 for(const re of patterns){const m=q.match(re);if(m)return +m[1];}
 return null;
}
function inspect(raw,opts={}){
 const text=String(raw??'').slice(0,12000);
 const found=pickMechanics(text),dimensions=pickSystems(text);
 if(!found.length&&!dimensions.length)return null;
 return {season:RELEASE,source:opts.source==='image'?'unconfirmed-ocr':'user-text',
  systemIds:dimensions.slice(0,11),mechanicIds:found.map(m=>m.id),
  pieceCount:pieceCount(text),verified:false};
}
const getMechanic=id=>mechanics.find(x=>x.id===id);
function assess(input,opts={}){
 const raw=String(input??'').slice(0,600);
 const context=opts.context?.season===RELEASE?opts.context:null;
 const found=pickMechanics(raw);
 const selected=found.length?found:(context?.mechanicIds||[]).map(getMechanic).filter(Boolean);
 const ids=[...new Set([...(context?.systemIds||[]),...pickSystems(raw)])];
 const q=norm(raw);
 const asksBuild=/(build|phoi do|phoi bo|phoi skill|chieu nao|set nao|mon nao|chon gi|co manh|toi uu|nen dung|nen chon|nen thay|tuong tac|co che|tai sao|vi sao|phan tich|so sanh|huong dan|fatebound|fatestone|forged|celesturgic|sacred soul|eidolon|concordance|thiet lap)/.test(q);
 if(!asksBuild&&!selected.length)return null;
 const n=pieceCount(raw)??context?.pieceCount??null;
 const lines=[],unknown=[],checks=[];
 if(selected.length){
  const m=selected[0];
  lines.push(m.label+': '+m.requirement);
  checks.push(m.test);
  if(m.id==='tarta'&&n!==null&&n<4){
   lines.push('Mới có '+n+'/4 món: KHÔNG được lấy hệ số kích nổ đủ 4 món để so đồ.');
  }else if(m.id==='tarta'&&n===4){
   lines.push('Đủ 4/4 món theo lời mô tả, nhưng cần kiểm tra Hellscream và Earthspike có thực sự kích nổ.');
  }else lines.push(m.limitation);
 }else{
  lines.push('Không thể xếp hạng build chỉ từ công kích, chí mạng hoặc điểm trang bị.');
  if(/fatestone|fatebound/.test(q))
   lines.push('SS8 chuyển sang Fatestone; SS9 còn thay cân bằng Fatebound. Phải kiểm tra hệ thống và cấp hiệu ứng đúng mùa, không lấy bảng 2/3 món cũ áp thẳng.');
  else if(/forged|celesturgic|affix/.test(q))
   lines.push('Forged và Celesturgic là những lớp affix khác nhau; phải đối chiếu từng dòng, cấp và khả năng chuyển/thay trước khi tối ưu.');
  else if(/legendary|trang bi|set|bo do/.test(q))
   lines.push('SS9 có 5 cấp Legendary Effect. Đổi một món có thể làm mất bộ, cấp hiệu ứng, hoặc điều kiện kích hoạt.');
  else lines.push('Thứ tự cần xác định: nguồn sát thương chính → điều kiện kích hoạt → hệ thống hỗ trợ → nhịp dùng chiêu → phép đo thật.');
 }
 if(!ids.includes('class'))unknown.push('lớp nhân vật / Specialization');
 if(!ids.includes('skills'))unknown.push('kỹ năng gây sát thương chính');
 if(!ids.includes('fatestone'))unknown.push('Fatestone/Fatebound đang áp dụng');
 if(!ids.includes('affix'))unknown.push('Forged và Celesturgic Affixes');
 if(!ids.includes('sacred'))unknown.push('Sacred Soul');
 if(!ids.includes('eidolon'))unknown.push('Eidolon đang dùng');
 if(!ids.includes('rotation'))unknown.push('vòng xoay chiêu, tài nguyên và điều kiện kích hoạt');
 if(!ids.includes('measurements'))unknown.push('phép đo thực tế cùng điều kiện');
 if(selected[0]?.id==='tarta'&&n===null)unknown.unshift('số món Tarta đang kích hoạt (0–4)');
 const shortlist=unknown.slice(0,3);
 if(shortlist.length)lines.push('Thiếu để kết luận: '+shortlist.join('; ')+'.');
 if(checks.length)lines.push('Phép thử: '+checks[0]);
 else lines.push('Bắt đầu từ ảnh kỹ năng chính và trang Fatestone/affix; sau đó mới đối chiếu cả bộ.');
 if(context?.source==='unconfirmed-ocr'&&!found.length)lines.push('Tên và trạng thái lấy từ OCR chưa xác nhận, không được xem là bằng chứng đã trang bị.');
 return {text:compact(lines.join('\n')),kind:'mechanics',focus:'game',
   season:RELEASE,mechanic:selected[0]?.id||null,missing:unknown,
   systemIds:ids,confidence:'needs-build-evidence',source:official.transition};
}
return {RELEASE,official,systems,mechanics,norm,inspect,assess,pickMechanics,pickSystems,pieceCount};
});
