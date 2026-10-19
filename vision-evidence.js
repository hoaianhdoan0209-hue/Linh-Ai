/* Private, user-approved structured vision label evidence.
 * Model guesses never become game facts or equipped gear automatically.
 */
(function(root,factory){
 const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SocratesVisionEvidence=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='socrates-vision-evidence-v1',MAX_RECORDS=20,MAX_AGE=180*86400000;
const KINDS=new Set(['skill','equipment','fatebound','fatestone','affix','specialization','status','other']);
const PANELS=new Set(['equipped','inventory','codex','skills','combat','unknown']);
const STATES=new Set(['equipped','not-equipped','unknown']);
const CONF=new Set(['low','medium','high']);
const clean=x=>String(x??'').replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').replace(/\s+/g,' ').trim().slice(0,65);
const cleanName=x=>{
 const s=clean(x);
 if(s.length<3||!/[\p{L}]/u.test(s)||/https?:|www\.|@|#\d{6,}|ignore previous|system prompt|api.?key|password|<script/i.test(s))return '';
 return s;
};
function parse(text){
 const raw=String(text??'').trim();
 if(raw.length>7500)return null;
 const body=raw.replace(/^\x60{3}(?:json)?\s*/i,'').replace(/\s*\x60{3}$/,'');
 let obj;try{obj=JSON.parse(body)}catch{return null}
 if(!obj||Array.isArray(obj)||obj.schema!=='socrates-vision-v1'||!PANELS.has(obj.panel)||
   !STATES.has(obj.equipState)||!Array.isArray(obj.observations))return null;
 const seen=new Set(),observations=[];
 for(const f of obj.observations.slice(0,20)){
  if(!f||!KINDS.has(f.kind)||!CONF.has(f.confidence))continue;
  const name=cleanName(f.name),key=f.kind+':'+name.toLowerCase();
  if(!name||seen.has(key))continue;
  seen.add(key);
  observations.push({kind:f.kind,name,confidence:f.confidence,
   ...(Number.isInteger(f.legendaryTier)&&f.legendaryTier>=1&&f.legendaryTier<=5?{legendaryTier:f.legendaryTier}:{}),
   ...(Number.isInteger(f.setPieces)&&f.setPieces>=0&&f.setPieces<=4?{setPieces:f.setPieces}:{})});
  if(observations.length===8)break;
 }
 return {schema:'socrates-vision-v1',panel:obj.panel,
  equipState:obj.panel==='equipped'?obj.equipState:'unknown',observations,
  unclear:Array.isArray(obj.unclear)?obj.unclear.slice(0,2).map(cleanName).filter(Boolean):[],
  confirmed:false,source:'ai-vision-unverified'};
}
function annotate(p,graph){
 if(!p)return null;
 return {...p,observations:p.observations.map(o=>{
  const matches=(graph?.find?.(o.name)||[]).filter(r=>typeof graph?.normalize==='function'&&
   (graph.normalize(r.item)===graph.normalize(o.name)||graph.normalize(r.skill)===graph.normalize(o.name)));
  const r=matches.length===1?matches[0]:null;
  return {...o,relation:r?{id:r.id,source:r.source,sourceDate:r.sourceDate,
   scope:r.scope,empiricalValidated:r.validatedDamageFormula===true}:null};
 })};
}
function summary(p){
 if(!p)return 'AI không trả về hồ sơ ảnh đúng cấu trúc. Chưa lưu dữ kiện.';
 const panels={equipped:'màn hình trang bị',inventory:'túi đồ',codex:'Codex tham khảo',
  skills:'bảng kỹ năng',combat:'chiến đấu',unknown:'chưa rõ'};
 let out='AI xem ảnh — CHƯA XÁC NHẬN: '+panels[p.panel]+
  '. Trang bị đang mặc: '+(p.equipState==='equipped'?'AI suy đoán có (cần xác nhận)':p.equipState==='not-equipped'?'không':'chưa rõ')+'.';
 for(const x of p.observations.slice(0,6))out+='\n• '+x.name+' ('+x.kind+', '+x.confidence+
  (x.legendaryTier?' / tier '+x.legendaryTier:'')+(x.setPieces!==undefined?' / '+x.setPieces+' món':'')+
  ')'+(x.relation?' · có nguồn '+x.relation.sourceDate+', chưa chứng minh DPS':'');
 if(!p.observations.length)out+='\nKhông đọc được tên nào đủ rõ.';
 if(p.unclear.length)out+='\nChưa rõ: '+p.unclear.join(', ')+'.';
 return (out+'\nXác nhận chữ đọc đúng không đồng nghĩa xác nhận cơ chế chiến đấu.').slice(0,1450);
}
function sanitize(raw,now=Date.now()){
 let x=raw;if(typeof x==='string'){if(x.length>22000)return [];try{x=JSON.parse(x)}catch{return []}}
 if(!x||x.version!==1||!Array.isArray(x.items))return [];
 const out=[],seen=new Set();
 for(const item of x.items.slice(-MAX_RECORDS*2)){
  if(item?.confirmed!==true||!Number.isFinite(item.at)||item.at<now-MAX_AGE||item.at>now+60000)continue;
  const p=parse(JSON.stringify({schema:'socrates-vision-v1',panel:item.panel,
   equipState:item.equipState,observations:item.observations,unclear:[]}));
  if(!p?.observations.length)continue;
  const key=p.panel+'|'+p.observations.map(z=>z.kind+':'+z.name+':'+(z.legendaryTier||'')).join('|');
  if(seen.has(key))continue;seen.add(key);
  out.push({...p,confirmed:true,source:'user-confirmed-image-labels',at:item.at});
 }
 return out.slice(-MAX_RECORDS);
}
function approve(items,preview,now=Date.now()){
 const previous=sanitize({version:1,items},now);
 if(!preview?.observations?.length)return {items:previous,added:false};
 const clean=parse(JSON.stringify({schema:'socrates-vision-v1',panel:preview.panel,
  equipState:preview.equipState,observations:preview.observations,unclear:[]}));
 if(!clean?.observations.length)return {items:previous,added:false};
 const result=sanitize({version:1,items:[...previous,{...clean,confirmed:true,at:now}]},now);
 return {items:result,added:result.some(x=>x.at===now)};
}
const payload=items=>JSON.stringify({version:1,items:sanitize({version:1,items})});
const namesForBuild=record=>record?.confirmed&&record.panel==='equipped'&&record.equipState==='equipped'?
 record.observations.filter(x=>x.confidence!=='low').map(x=>x.name):[];
return {KEY,parse,annotate,summary,sanitize,approve,payload,namesForBuild};
});
