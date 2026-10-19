/* Socrates evidence and decision guard.
 * Independently authored, inspired by public architecture of
 * mordiaky/thinking-tools (MIT): hypothesis/assumption/contradiction/decision.
 * No upstream source copied. Browser-local session only, no persistence,
 * network, model calls, raw OCR history, or invented probability.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SocratesThinkingGuard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const B=typeof module!=='undefined'&&module.exports?require('./build-systems.js'):globalThis.SocratesBuildSystems;
const norm=B.norm;
function empty(){return {season:'SS9',mechanicId:null,claims:[],conflicts:[],revision:0};}
function bounded(state){
 if(!state||state.season!=='SS9')return empty();
 return {season:'SS9',mechanicId:state.mechanicId||null,
  claims:(state.claims||[]).slice(-8).map(c=>({mechanicId:c.mechanicId,value:c.value,source:c.source})),
  conflicts:(state.conflicts||[]).slice(-3).map(c=>({mechanicId:c.mechanicId,values:c.values.slice(0,3)})),
  revision:Math.min(1000,Math.max(0,state.revision||0))};
}
function observe(state,input,options={}){
 const base=options.replace?empty():bounded(state);
 const q=norm(String(input??'').slice(0,900));
 const detected=B.inspect(input,{source:options.source==='unconfirmed-ocr'?'image':'user-text'});
 const nextId=detected?.mechanicIds?.[0]||base.mechanicId;
 if(!nextId)return base;
 // A change of named item starts a separate hypothesis. This is never
 // interpreted as the same equipment set being worn simultaneously.
 if(base.mechanicId&&base.mechanicId!==nextId){
  base.claims=[];base.conflicts=[];
 }
 base.mechanicId=nextId;
 const rawCount=B.pieceCount(input);
 const relevant=nextId==='tarta'&&rawCount!==null&&/(\bmon\b|\bpieces?\b)/.test(q);
 if(!relevant)return base;
 const correction=/\b(dinh chinh|sua lai|nham|thuc ra|noi lai)\b/.test(q);
 const source=options.source==='unconfirmed-ocr'?'unconfirmed-ocr':'user-reported';
 if(correction){base.claims=[];base.conflicts=[];}
 const previous=base.claims.filter(c=>c.mechanicId===nextId);
 if(!previous.some(c=>c.value===rawCount&&c.source===source)){
  base.claims.push({mechanicId:nextId,value:rawCount,source});
  base.claims=base.claims.slice(-8);
  base.revision++;
 }
 const vals=[...new Set(base.claims.filter(c=>c.mechanicId===nextId).map(c=>c.value))];
 base.conflicts=vals.length>1?[{mechanicId:nextId,values:vals.slice(0,3)}]:[];
 return base;
}
function audit(state){
 const s=bounded(state);
 if(!s.mechanicId)return {status:'unknown',blocking:[],nextTest:null,pieceCount:null};
 if(s.conflicts.length){
  const c=s.conflicts[0];
  return {status:'conflict',
   blocking:['Số món '+c.mechanicId+' mâu thuẫn: '+c.values.join(' và ')+'.'],
   nextTest:'Kiểm tra lại trang trang bị rồi nói “đính chính Tarta 4 món” nếu đúng.',
   pieceCount:null};
 }
 const claims=s.claims.filter(c=>c.mechanicId===s.mechanicId);
 const claim=claims[claims.length-1]||null;
 const count=claim?.value??null;
 if(s.mechanicId==='tarta'){
  if(count===null)return {status:'unverified',blocking:['Chưa biết đủ 4 món Tarta hay chưa.'],
   nextTest:'Đếm số món Tarta đang mặc trước khi xét Hellscream/Earthspike.',pieceCount:null};
  if(count<4)return {status:'prerequisite-false',
   blocking:['Chỉ có '+count+'/4 món Tarta, không kích hoạt mức thưởng đủ 4 món.'],
   nextTest:'So số món đã trang bị, rồi kiểm tra kích nổ Earthspike.',pieceCount:count};
  return {status:'provisional',blocking:['Đủ 4 món chỉ theo '+(claim.source==='unconfirmed-ocr'?'OCR chưa xác nhận':'lời người chơi')+'; chưa chứng minh Hellscream/Earthspike kích hoạt.'],
    nextTest:'Thử Hellscream với cùng mục tiêu và đếm các lần Earthspike kích nổ.',pieceCount:count};
 }
 if(s.mechanicId==='karmic')return {status:'unverified',
   blocking:['Chưa xác minh cokerize trên mục tiêu và đòn Adhesive Gunpowder.'],
   nextTest:'Giữ cùng mục tiêu, so hit Adhesive Gunpowder khi có/không có cokerize.',pieceCount:null};
 return {status:'unverified',blocking:['Chưa có điều kiện kích hoạt và phép đo đầy đủ.'],
  nextTest:'Giữ cùng mục tiêu, so riêng một thay đổi trong hai lượt đo.',pieceCount:null};
}
function answer(input,state){
 const s=bounded(state),q=norm(String(input??'').slice(0,400)),a=audit(s);
 const topical=/(so sanh|chon|nen|thay|test|thu|xac minh|tai sao|vi sao|loi|dung|tarta|karmic|build|boss|farm)/.test(q);
 if(!topical||a.status!=='conflict')return null;
 return {kind:'question',focus:'game',reason:'contradiction',
  text:'Dữ liệu build đang mâu thuẫn: '+a.blocking[0]+
    ' Thần chưa kết luận nên chọn món nào hoặc áp hệ số thưởng. '+a.nextTest};
}
/* Multi-criteria comparison is allowed only on same-environment measured
 * evidence with every mandatory criterion present for both candidates.
 * Missing values are NOT silently zero and OCR is NOT a measurement.
 */
function compareOptions(options,criteria){
 if(!Array.isArray(options)||options.length!==2||!Array.isArray(criteria)||!criteria.length||
    criteria.length>8)return {ok:false,reason:'Cần đúng hai phương án và tiêu chí có trọng số.'};
 if(!options.every(x=>x&&typeof x.id==='string'&&x.id.length<=50))return {ok:false,reason:'Phương án thiếu định danh.'};
 if(!criteria.every(x=>x&&typeof x.id==='string'&&Number.isFinite(x.weight)&&x.weight>0&&x.weight<=10))
  return {ok:false,reason:'Trọng số không hợp lệ.'};
 if(options[0].id===options[1].id)return {ok:false,reason:'Hai phương án phải khác nhau.'};
 const context=options[0].contextKey;
 if(typeof context!=='string'||!context||context.length>120||options[1].contextKey!==context)
  return {ok:false,reason:'Hai phép đo không cùng mục tiêu và điều kiện.'};
 const breakdown=[];
 for(const c of criteria){
  const a=options[0].ratings?.[c.id],b=options[1].ratings?.[c.id];
  if(![a,b].every(r=>r&&r.evidence==='measured'&&Number.isFinite(r.value)&&r.value>=0&&r.value<=100))
   return {ok:false,reason:'Thiếu số đo xác thực cùng tiêu chí: '+c.id+'.'};
  breakdown.push({id:c.id,weight:c.weight,a:a.value,b:b.value});
 }
 const weight=breakdown.reduce((v,x)=>v+x.weight,0);
 const score=x=>breakdown.reduce((v,b)=>v+b[x]*b.weight,0)/weight;
 const a=score('a'),b=score('b');
 return {ok:true,ranked:b>a?[options[1].id,options[0].id]:[options[0].id,options[1].id],
  scores:{[options[0].id]:Math.round(a*100)/100,[options[1].id]:Math.round(b*100)/100},
  tie:a===b,scope:'weighted-measurements-only',
  warning:'Chỉ là bảng so tiêu chí đã đo, không tự chứng minh hiệu quả tổng build hay quan hệ nhân quả.'};
}
return {empty,observe,audit,answer,compareOptions};
});
