/* Socrates Vision v0.3: local, deterministic OCR-text interpretation. Not a generative AI. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.LinhVision=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const schema=typeof module!=='undefined'&&module.exports?require('./stat-schema.js'):globalThis.SocratesStats;
const patterns=[
['critChance','Tỷ lệ chí mạng',/(?:tỷ|tỉ)\s*lệ\s*chí\s*mạng|crit(?:ical)?\s*(?:rate|chance)/i],
['critDamage','ST chí mạng tăng thêm',/sát\s*thương\s*chí\s*mạng|crit(?:ical)?\s*(?:damage|dmg)/i],
['attack','Tăng công',/tăng\s*công|công\s*kích\s*tăng|attack\s*bonus/i],
['armorPen','Xuyên giáp',/xuyên\s*giáp|armor\s*penetration/i],
['resistPen','Xuyên kháng',/xuyên\s*kháng|resistance\s*penetration/i]
];
const extraPatterns=[
 ['baseDamage',/^(?:sát thương (?:đòn )?thường|normal (?:hit )?damage|base damage)\s*[:=：]?\s*([\d., ]+)/i,''],
 ['attackPower',/^(?:công kích|tấn công|sức tấn công|attack power|atk|attack)\s*[:=：]?\s*([\d., ]+)/i,''],
 ['spellPower',/^(?:sức mạnh phép|phép thuật|spell power|magic power)\s*[:=：]?\s*([\d., ]+)/i,''],
 ['health',/^(?:máu|sinh lực|hp|health|max hp)\s*[:=：]?\s*([\d., ]+)/i,''],
 ['defense',/^(?:giáp|phòng thủ|defense|def|armor)\s*[:=：]?\s*([\d., ]+)/i,''],
 ['attackSpeed',/^(?:nhịp đánh|attack rate|attacks per second|tốc độ đánh)\s*[:=：]?\s*(\d+(?:[.,]\d+)?)/i,'rate'],
 ['cooldown',/^(?:hồi chiêu|cooldown)(?:\s+(?:kỹ năng|time))?\s*[:=：]?\s*(\d+(?:[.,]\d+)?)/i,'seconds'],
 ['duration',/^(?:thời lượng|duration|kéo dài|thời gian hiệu lực)\s*[:=：]?\s*(\d+(?:[.,]\d+)?)/i,'seconds'],
 ['maxStacks',/^(?:số tầng tối đa|tối đa|maximum stacks|max stacks)\s*[:=：]?\s*(\d+)/i,'count'],
 ['skillDamage',/^(?:hệ số kỹ năng|skill damage)\s*[:=：]?\s*(\d+(?:[.,]\d+)?)/i,'percent'],
 ['damageBonus',/^(?:tăng sát thương|damage bonus)\s*[:=：]?\s*\+?(\d+(?:[.,]\d+)?)/i,'percent']
];
function extraStats(text){
 const out=[];
 for(const raw of String(text||'').slice(0,12000).split(/\r?\n|[;；]/)){
  const line=raw.trim();if(line.length>100)continue;
  for(const [key,re,unit] of extraPatterns){
   const m=line.match(re);if(!m)continue;
   const rest=line.slice(m[0].length).trim();
   if(unit==='percent'&&!/^%/.test(rest))continue;
   if(!unit&&/^%|[0-9]|[.,]/.test(rest))continue;
   if(unit==='rate'&&!/^(?:đòn\s*\/\s*s|lần\s*\/\s*s|hits?\s*\/\s*s|attacks?\s*\/\s*s|aps)\b/i.test(rest))continue;
   if(unit==='seconds'&&!/^(?:s\b|sec|seconds?|giây)/i.test(rest))continue;
   const number=m[1].trim();
   // Thousands grouping applies to absolute stats only, decimals to time/rates.
   let n=Number((!unit&&/^\d{1,3}(?:[., ]\d{3})+$/.test(number))?number.replace(/[., ]/g,''):number.replace(/ /g,'').replace(',','.'));
   if(schema.valid(key,n))out.push({key,label:schema.labels[key],value:n,source:line,confidence:'vừa'});
  }
 }
 return out;
}
function extractStats(text){
const out=extraStats(text);for(const line of String(text||'').slice(0,12000).split(/\r?\n/)){
if(line.length>92||/(?:mỗi|khi\s+(?:đánh|trúng|gây)|trong\s+\d|per\s+stack)/i.test(line))continue;
for(const [key,label,re] of patterns){const m=re.exec(line);if(!m||line.slice(0,m.index).trim().length>18)continue;const x=/^\s*[:=：]?\s*(?:tăng|\+)?\s*(\d+(?:[.,]\d+)?)\s*%/.exec(line.slice(m.index+m[0].length));if(!x)continue;const n=Number(x[1].replace(',','.'));if(Number.isFinite(n)&&schema.valid(key,n))out.push({key,label,value:n,source:line.trim(),confidence:'vừa'});}
}return [...new Map(out.map(f=>[f.key,f])).values()].slice(0,16);
}
function observe(text){
const raw=String(text||'').replace(/\r/g,'').slice(0,12000),low=raw.toLowerCase(),tags=[],questions=[],hypotheses=[],facts=extractStats(raw);
const signals=[['burn','thiêu đốt',/thiêu\s*đốt|đốt\s*cháy|burn|ignite/i],['poison','độc',/trúng\s*độc|nhiễm\s*độc|poison|venom/i],['crit','chí mạng',/chí\s*mạng|bạo\s*kích|critical|crit\b/i],['cooldown','hồi chiêu',/hồi\s*chiêu|cooldown/i],['armor','phòng thủ/giáp',/xuyên\s*giáp|phòng\s*thủ|giáp|armor/i],['duration','thời lượng',/kéo\s*dài|thời\s*gian|duration/i],['stack','cộng dồn',/cộng\s*dồn|tích\s*tầng|stack/i],['vuln','nhận thêm sát thương',/nhận\s*thêm(?:\s*\d+(?:[.,]\d+)?\s*%)?\s*sát\s*thương|damage\s*taken/i]];
for(const [key,label,re] of signals)if(re.test(low))tags.push({key,label});
const has=k=>tags.some(t=>t.key===k);
if((raw.match(/\d+(?:[.,]\d+)?\s*%/g)||[]).length>=2){hypotheses.push('Các hệ số % có thể cộng hoặc nhân. Phải đo sát thương để phân biệt.');questions.push('Hai hiệu ứng % có thuộc cùng nhóm cộng dồn không?');}
if(has('burn')&&has('vuln'))hypotheses.push('Thiêu đốt có thể tương tác với hiệu ứng nhận thêm sát thương; cần thử riêng từng hiệu ứng và thử chung.');
if(has('burn')&&has('poison'))hypotheses.push('Thiêu đốt và độc có thể tác dụng cùng lúc. Cần đo nhịp sát thương và số tầng.');
if(has('crit')&&!facts.some(f=>f.key==='critDamage'))questions.push('Chưa thấy sát thương chí mạng. Bệ hạ có thể mở bảng chi tiết không?');
if(has('cooldown')&&!has('duration'))questions.push('Thời gian hồi chiêu và thời lượng buff là bao nhiêu?');
if(has('stack'))questions.push('Hiệu ứng cộng được tối đa mấy tầng?');
if(raw.trim().length<28)questions.push('Ảnh chưa đủ chữ rõ; thử ảnh chi tiết hơn nhé.');
if(!hypotheses.length&&raw.length>=28)hypotheses.push('Chưa đủ chứng cứ để khẳng định công thức; cần thêm mô tả và phép đo.');
return{text:raw,facts,tags,questions:[...new Set(questions)].slice(0,3),hypotheses:[...new Set(hypotheses)].slice(0,3),confidence:raw.length<28?'thấp':'chưa xác minh'};
}
function answer(question,g,vision,math){
const q=String(question||'').toLowerCase().trim(),parts=[],effects=g.effects||[];
if(!q)return{reply:'Bệ hạ muốn hỏi gì về game ạ?',question:null};
if(vision?.facts?.length)parts.push('Từ ảnh đã chọn: '+vision.facts.map(f=>f.label+' '+f.value+'%').join(', ')+'. OCR có thể sai; cần kiểm tra.');
if(/combo|build|trang bị|kết hợp|phối|tối ưu|ưu tiên/.test(q)){
if(effects.length){const slots=Math.max(1,Math.min(12,Number(g.slots)||3)),best=math.optimize(g.stats,effects,g.modes,slots);parts.push('Theo mô hình giả định, combo '+slots+' ô: '+(best.items.map(x=>x.name).join(', ')||'không dùng hiệu ứng')+'. Sát thương kỳ vọng: '+Math.round(best.result.expected).toLocaleString('vi-VN')+'.');}
else parts.push('Chưa có dữ kiện kỹ năng rõ để so combo. Bệ hạ cho Socrates xem ảnh trang bị nhé.');
}
if(/chí mạng|crit|bạo kích/.test(q))parts.push('Hồ sơ có chí mạng '+(g.stats?.critChance||0)+'% và ST chí mạng cộng thêm '+(g.stats?.critDamage||0)+'%; công thức thực còn cần kiểm chứng.');
if(/cộng|nhân|công thức|xác minh/.test(q))parts.push(math.analyzeEvidence(g.observations||[]).message);
if(/ảnh|đọc|nhìn/.test(q)&&!vision)parts.push('Socrates chưa được Bệ hạ chọn ảnh game để xem.');
if(/ghi nhớ|kinh nghiệm|đã học/.test(q))parts.push('Đang lưu '+(g.notes||[]).length+' ghi nhớ và '+(g.observations||[]).length+' phép đo cho game '+g.name+'.');
if(!parts.length)parts.push(vision?.hypotheses?.[0]||'Chưa đủ bằng chứng để kết luận. Socrates cần thêm ảnh mô tả hoặc sát thương thực tế.');
return{reply:parts.join('\n\n'),question:vision?.questions?.[0]||((g.observations||[]).length<2?'Bệ hạ có thể cho Socrates xem đòn đánh không chí mạng để kiểm tra không?':null)};
}
return{extractStats,observe,answer};
});