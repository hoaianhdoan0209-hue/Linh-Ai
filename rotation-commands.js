/* Conservative small text protocol for asking the bounded rotation lab.
 * The user must supply each skill's measured/assumed base hit and cooldown.
 * We never infer official Soul Knight game formulas from patch text or OCR.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SocratesRotationCommands=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const L=typeof module!=='undefined'&&module.exports?require('./rotation-lab.js'):globalThis.SocratesRotationLab;
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().trim();
const v=x=>Number(String(x).replace(',','.'));
const MAX_LENGTH=900;
const guide='Ví dụ phép thử giả định: mô phỏng 20s; skill shot damage 1000 cooldown 2s; skill bomb damage 3000 cooldown 8s. Với hiệu ứng: effect boost skill shot factor 1,3 assumed.';
function parse(original){
 const input=norm(String(original??'').slice(0,MAX_LENGTH));
 if(!/^mo phong\b|^tinh vong chieu\b|^thu rotation\b|^rotation\b/.test(input))return null;
 const pieces=input.split(/\s*;\s*/).map(x=>x.trim()).filter(Boolean);
 const first=pieces.shift()||'',d=first.match(/(\d+(?:[.,]\d+)?)\s*(s|giay|seconds?)\b/);
 if(!d)return {error:'Chưa có thời lượng 1–300s. '+guide};
 const skills=[],effects=[];
 for(const part of pieces){
  const skill=part.match(/^(?:skill|ky nang)\s+([a-z0-9_-]+)\s+(?:damage|sat thuong)\s+(\d+(?:[.,]\d+)?)\s+(?:cooldown|hoi(?: chieu)?)\s+(\d+(?:[.,]\d+)?)\s*(?:s|giay)?(?:\s+(.*))?$/);
  if(skill){
   const id=skill[1],extra=skill[4]||'';
   const data={id,cooldown:v(skill[3]),hits:[{damage:v(skill[2])}]};
   const cost=extra.match(/\bcost\s+(\d+(?:[.,]\d+)?)/);
   if(cost)data.cost=v(cost[1]);
   const status=extra.match(/\b(?:status|trang thai)\s+([a-z0-9_-]+)\s+(\d+(?:[.,]\d+)?)\s*(?:s|giay)/);
   if(status){data.hits[0].status=status[1];data.hits[0].statusDuration=v(status[2]);}
   skills.push(data);
   continue;
  }
  const effect=part.match(/^effect\s+([a-z0-9_-]+)\s+skill\s+([a-z0-9_-]+)\s+factor\s+(\d+(?:[.,]\d+)?)\s+(assumed|measured)(?:\s+(.*))?$/);
  if(effect){
   const e={id:effect[1],skill:effect[2],factor:v(effect[3]),evidence:effect[4]};
   const extra=effect[5]||'';
   const status=extra.match(/\b(?:if|khi)\s+([a-z0-9_-]+)/);
   if(status)e.status=status[1];
   const pieces=extra.match(/\bset\s+(\d+)\s*\/\s*(\d+)/);
   if(pieces){e.setPieces=v(pieces[1]);e.requiresPieces=v(pieces[2]);}
   effects.push(e);continue;
  }
  return {error:'Dòng chưa đúng cú pháp: '+part.slice(0,80)+'. '+guide};
 }
 if(!skills.length)return {error:'Chưa có kỹ năng và sát thương cơ sở. '+guide};
 const model={duration:v(d[1]),skills,effects};
 const valid=L.validate(model);
 return valid.ok?{model}:{error:valid.error};
}
function answer(input){
 const p=parse(input);
 if(!p)return null;
 if(p.error)return {text:p.error,kind:'question',focus:'game'};
 const r=L.compare(p.model);
 if(!r.ok)return {text:r.error,kind:'question',focus:'game'};
 const fmt=n=>n.toLocaleString('vi-VN',{maximumFractionDigits:2});
 const s=r.scenario,b=r.baseline;
 let t='Phép thử mô phỏng '+fmt(s.duration)+'s (nhịp kỹ năng theo số do Bệ hạ khai báo).';
 t+='\nKhông hiệu ứng: '+fmt(b.totalDamage)+' sát thương, trung bình '+fmt(b.modelDps)+'/s.';
 if(p.model.effects.length)t+='\nCó điều kiện: '+fmt(s.totalDamage)+'; chênh '+fmt(r.deltaDamage)+'; kích hoạt trên '+s.conditionalHits+' hit.';
 t+='\nSố lần dùng chiêu: '+Object.entries(s.castCounts).map(([k,n])=>k+' '+n).join(', ')+'.';
 if(s.unknownStacking)t+='\n'+s.unknownStacking+' hit chưa rõ cách gộp hiệu ứng.';
 if(s.warnings.length)t+='\n'+s.warnings[0];
 t+='\nChỉ là mô hình theo đầu vào, chưa phản ánh giáp, kháng, proc ẩn, chuyển động hoặc sát thương thực của Soul Knight Prequel.';
 return {text:t.slice(0,1300),kind:'calculation',focus:'game',model:true};
}
return {parse,answer,guide};
});
