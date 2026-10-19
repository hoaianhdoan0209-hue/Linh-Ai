/* Socrates: evidence-bounded discrete-event rotation sandbox.
 * NOT an official Soul Knight Prequel DPS formula. Everything numeric must be
 * supplied by the player/test evidence. No hidden coefficients or game access.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SocratesRotationLab=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const EPS=1e-7,MAX_EVENTS=5000;
const numeric=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const safeId=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,40}$/.test(x);
const finiteRound=v=>Math.round(v*100)/100;
const bad=message=>({ok:false,error:message});
function validate(raw){
 if(!raw||typeof raw!=='object'||!numeric(raw.duration,1,300))
  return bad('Cần thời lượng mô phỏng 1–300 giây.');
 if(!Array.isArray(raw.skills)||raw.skills.length<1||raw.skills.length>8)
  return bad('Cần 1–8 kỹ năng do người chơi khai báo.');
 const ids=new Set(),skills=[];
 for(const s of raw.skills){
  if(!s||!safeId(s.id)||ids.has(s.id)||!numeric(s.cooldown,0.1,120)||
      !numeric(s.castTime??0,0,20)||!numeric(s.cost??0,0,100000)||
      !numeric(s.firstCast??0,0,300)||!Array.isArray(s.hits)||s.hits.length>12)
   return bad('Kỹ năng có ID trùng, hồi chiêu/tiêu hao sai hoặc hơn 12 đòn.');
  ids.add(s.id);
  const hits=[];
  for(const h of s.hits){
   if(!h||!numeric(h.delay??0,0,30)||!numeric(h.damage,0,1e9)||
      (h.status!==undefined&&!safeId(h.status))||
      (h.status!==undefined&&!numeric(h.statusDuration,0.01,300))||
      (h.statusStacks!==undefined&&!numeric(h.statusStacks,1,100)))
    return bad('Đòn đánh phải có damage không âm; trạng thái cần thời lượng hợp lệ.');
   hits.push({delay:h.delay??0,damage:h.damage,status:h.status,
    statusDuration:h.statusDuration,statusStacks:h.statusStacks??1});
  }
  skills.push({id:s.id,cooldown:s.cooldown,castTime:s.castTime??0,cost:s.cost??0,
    firstCast:s.firstCast??0,hits,priority:s.priority??skills.length});
 }
 const resource=raw.resource||{initial:0,max:0,regen:0};
 if(!numeric(resource.initial,0,1e6)||!numeric(resource.max,0,1e6)||
    !numeric(resource.regen??0,0,1e5)||resource.initial>resource.max)
  return bad('Tài nguyên đầu trận, giới hạn và tốc độ hồi không hợp lệ.');
 if(!numeric(raw.globalCooldown??0,0,20))return bad('Global cooldown không hợp lệ.');
 if(!numeric(raw.targetCount??1,1,50)||!Number.isInteger(raw.targetCount??1))
  return bad('Số mục tiêu phải là số nguyên 1–50.');
 if(!Array.isArray(raw.effects??[])||(raw.effects||[]).length>16)
  return bad('Không dùng quá 16 hiệu ứng trong một mô hình.');
 const effects=[];
 for(const e of raw.effects||[]){
  if(!e||!safeId(e.id)||!ids.has(e.skill)||!numeric(e.factor,0,100)||
    !['measured','assumed'].includes(e.evidence)||!
    (!e.status||safeId(e.status))||!numeric(e.minStacks??1,1,100)||
    !numeric(e.setPieces??0,0,8)||!numeric(e.requiresPieces??0,0,8)||
    (e.targetType!==undefined&&!['boss','mob'].includes(e.targetType)))
    return bad('Hiệu ứng cần kỹ năng, hệ số do người chơi nhập và điều kiện hợp lệ.');
  effects.push({id:e.id,skill:e.skill,status:e.status||null,minStacks:e.minStacks??1,
   factor:e.factor,evidence:e.evidence,setPieces:e.setPieces??0,
   requiresPieces:e.requiresPieces??0,targetType:e.targetType??null});
 }
 const targetType=raw.targetType??'boss';
 if(!['boss','mob'].includes(targetType))return bad('Loại mục tiêu không hợp lệ.');
 return {ok:true,model:{duration:raw.duration,skills,resource:{...resource,regen:resource.regen??0},
  effects,globalCooldown:raw.globalCooldown??0,targetCount:raw.targetCount??1,targetType}};
}
function run(raw){
 const verified=validate(raw);
 if(!verified.ok)return verified;
 const m=verified.model,queue=[],statuses=new Map(),nextReady=new Map(),hitsPerSkill={},
    warnings=[],events=[],castCounts={},blocked={};
 let idSeq=0,resource=m.resource.initial,resourceAt=0,globalReady=0,total=0,
     appliedHits=0,activeTime=0,unknownStacking=0;
 const push=(type,t,payload)=>{if(t<=m.duration+EPS&&queue.length<MAX_EVENTS)
   queue.push({type,t,seq:idSeq++,...payload});};
 const priority={hit:0,cast:1};
 for(const s of m.skills){
  nextReady.set(s.id,s.firstCast);hitsPerSkill[s.id]=0;castCounts[s.id]=0;
  blocked[s.id]=0;push('cast',s.firstCast,{skill:s.id});
 }
 function resAt(t){resource=Math.min(m.resource.max,resource+(t-resourceAt)*m.resource.regen);resourceAt=t;}
 function livingStatus(key,t){
  const x=statuses.get(key);
  return x&&x.until>t+EPS?x:null;
 }
 let processed=0;
 while(queue.length&&processed<MAX_EVENTS){
  queue.sort((a,b)=>a.t-b.t||priority[a.type]-priority[b.type]||a.seq-b.seq);
  const e=queue.shift();processed++;
  if(e.t>m.duration+EPS)break;
  resAt(e.t);
  if(e.type==='hit'){
   const skill=e.skill,hit=e.hit;
   const validEffects=m.effects.filter(x=>x.skill===skill&&
     x.setPieces>=x.requiresPieces&&(!x.targetType||x.targetType===m.targetType)&&
     (!x.status||((livingStatus(x.status,e.t)?.stacks||0)>=x.minStacks)));
   let factor=1;
   if(validEffects.length===1){factor=validEffects[0].factor;activeTime++;}
   if(validEffects.length>1){
    unknownStacking++;
    if(!warnings.includes('Nhiều hiệu ứng cùng trúng đòn: chưa biết quy tắc cộng/nhân; không tự gộp.'))
     warnings.push('Nhiều hiệu ứng cùng trúng đòn: chưa biết quy tắc cộng/nhân; không tự gộp.');
   }
   const damage=hit.damage*factor;
   total+=damage;
   hitsPerSkill[skill]=(hitsPerSkill[skill]||0)+1;
   appliedHits++;
   if(hit.status){
    const existing=livingStatus(hit.status,e.t);
    statuses.set(hit.status,{stacks:Math.min(100,(existing?.stacks||0)+hit.statusStacks),
      until:e.t+hit.statusDuration});
   }
   if(events.length<40)events.push({time:finiteRound(e.t),kind:'hit',skill,
    damage:finiteRound(damage),status:hit.status||null,applied:validEffects.length===1?validEffects[0].id:null});
   continue;
  }
  const s=m.skills.find(x=>x.id===e.skill);if(!s)continue;
  const ready=Math.max(e.t,nextReady.get(s.id)||0,globalReady);
  if(ready>e.t+EPS){push('cast',ready,{skill:s.id});continue;}
  if(resource+EPS<s.cost){
   blocked[s.id]++;
   if(m.resource.regen===0){continue;}
   const wait=(s.cost-resource)/m.resource.regen;
   push('cast',e.t+Math.max(wait,0.00001),{skill:s.id});continue;
  }
  resource-=s.cost;castCounts[s.id]++;
  globalReady=e.t+Math.max(s.castTime,m.globalCooldown);
  for(const hit of s.hits)push('hit',e.t+hit.delay,{skill:s.id,hit});
  const next=e.t+s.cooldown;
  nextReady.set(s.id,next);
  // No resources => no repeated spam, but retain a blocked counter.
  push('cast',next,{skill:s.id});
  if(events.length<40)events.push({time:finiteRound(e.t),kind:'cast',skill:s.id});
 }
 if(processed>=MAX_EVENTS||queue.length>=MAX_EVENTS)return bad('Mô hình vượt giới hạn 5.000 sự kiện, hãy giảm tần suất.');
 if(!appliedHits)warnings.push('Không có đòn gây sát thương trong cửa sổ mô phỏng.');
 if(m.effects.some(x=>x.evidence==='assumed'))warnings.push('Có hệ số giả định người chơi nhập, chưa phải sát thương đo trong game.');
 if(m.effects.length)warnings.push('Sát thương đầu vào là con số cho từng hit trước tương tác; mô hình chưa biết giáp/kháng/chí mạng thực.');
 return {ok:true,duration:m.duration,totalDamage:finiteRound(total),
  modelDps:finiteRound(total/m.duration),hits:appliedHits,hitsPerSkill,castCounts,
  blocked,conditionalHits:activeTime,unknownStacking,resourceLeft:finiteRound(resource),
  warnings,events,source:'user-parameterized-model',officialDps:false};
}
function compare(model){
 const withEffects=run(model);
 if(!withEffects.ok)return withEffects;
 const noEffects=run({...model,effects:[]});
 if(!noEffects.ok)return noEffects;
 return {ok:true,baseline:noEffects,scenario:withEffects,
  deltaDamage:finiteRound(withEffects.totalDamage-noEffects.totalDamage),
  note:'Cùng nhịp thi triển và thông số tự nhập. Chỉ khác hiệu ứng khai báo; đây là phép thử giả định, không chứng minh công thức Soul Knight Prequel.'};
}
return {validate,run,compare};
});
