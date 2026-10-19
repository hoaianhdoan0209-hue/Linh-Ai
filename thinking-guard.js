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
function empty(){return {season:'SS9',mechanicId:null,claims:[],conflicts:[],variants:{},photoTail:null,revision:0};}
function bounded(state){
 if(!state||state.season!=='SS9')return empty();
 return {season:'SS9',mechanicId:state.mechanicId||null,
  claims:(state.claims||[]).slice(-8).map(c=>({mechanicId:c.mechanicId,value:c.value,source:c.source})),
  conflicts:(state.conflicts||[]).slice(-3).map(c=>({mechanicId:c.mechanicId,values:c.values.slice(0,3)})),
  variants:Object.fromEntries(['A','B'].filter(k=>state.variants?.[k])
    .map(k=>[k,{mechanicId:state.variants[k].mechanicId,
      pieceCount:state.variants[k].pieceCount??null,
      source:state.variants[k].source||'unconfirmed'}])),
  photoTail:state.photoTail?{mechanicId:state.photoTail.mechanicId,
    pieceCount:state.photoTail.pieceCount??null,source:'unconfirmed-ocr'}:null,
  revision:Math.min(1000,Math.max(0,state.revision||0))};
}
function observe(state,input,options={}){
 const base=options.replace?empty():bounded(state);
 const q=norm(String(input??'').slice(0,900));
 const detected=B.inspect(input,{source:options.source==='unconfirmed-ocr'?'image':'user-text'});
 const nextId=detected?.mechanicIds?.[0]||base.mechanicId;
 if(!nextId)return base;
 const source=options.source==='unconfirmed-ocr'?'unconfirmed-ocr':'user-reported';
 // Support both alternatives in one message, but never infer an A/B variant
 // without a label. This is a *declaration* of alternatives, not current gear.
 const pairs=[...q.matchAll(/(?:phuong an|anh|bo|mon)\s+([ab])\s+(?:(?:co|du|dang mac)\s+)?(?:tarta\s+)?([0-6])\s*(?:\/\s*4\s*)?mon\b/g)];
 if(nextId==='tarta'&&pairs.length>=2){
  for(const match of pairs){
    const key=match[1].toUpperCase(),count=Number(match[2]);
    base.variants[key]={mechanicId:nextId,pieceCount:count,source};
  }
  base.revision++;
  return base;
 }
 // Explicit A/B are ALTERNATIVES, not contradictory reports of one build.
 const named=options.scenario||q.match(/(?:^|\s)(?:phuong an|phuong an so|anh|bo|mon)\s+([ab])(?:\s|$)/)?.[1]?.toUpperCase();
 const label=typeof named==='string'?named.toUpperCase():null;
 const selected=(label==='A'||label==='B')?label:null;
 if(selected){
  const value=B.pieceCount(input);
  const old=base.variants[selected];
  // A new named hypothesis supersedes that option alone; never mutates
  // the other alternative or the active player build.
  base.variants[selected]={mechanicId:nextId,pieceCount:value,
    source};
  if(!old||JSON.stringify(old)!==JSON.stringify(base.variants[selected]))base.revision++;
  return base;
 }
 // A change of named item starts a separate hypothesis. This is never
 // interpreted as the same equipment set being worn simultaneously.
 if(base.mechanicId&&base.mechanicId!==nextId){
  base.claims=[];base.conflicts=[];
 }
 // A new unrelated mechanic invalidates stale comparison hypotheses.
 if(!selected&&base.variants.A&&
   ![base.variants.A.mechanicId,base.variants.B?.mechanicId].includes(nextId))
  base.variants={};
 if(base.photoTail&&base.photoTail.mechanicId!==nextId)base.photoTail=null;
 base.mechanicId=nextId;
 const rawCount=B.pieceCount(input);
 const relevant=nextId==='tarta'&&rawCount!==null&&/(\bmon\b|\bpieces?\b)/.test(q);
 if(!relevant)return base;
 const correction=/\b(dinh chinh|sua lai|nham|thuc ra|noi lai)\b/.test(q);
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
  if(count>4)return {status:'invalid-count',
   blocking:['Bộ Tarta chỉ xét 4 món; số '+count+' cần xác minh, không suy được hiệu ứng.'],
   nextTest:'Đếm lại đúng các món thuộc Tarta và nhập một số từ 1 đến 4.',pieceCount:null};
  if(count<4)return {status:'prerequisite-false',
   blocking:['Chỉ có '+count+'/4 món Tarta, không kích hoạt mức thưởng đủ 4 món.'],
   nextTest:'So số món đã trang bị, rồi kiểm tra kích nổ Earthspike.',pieceCount:count};
  return {status:'provisional',blocking:['Đủ 4 món chỉ theo '+(claim.source==='unconfirmed-ocr'?'OCR chưa xác nhận':'lời người chơi')+'; chưa chứng minh Hellscream/Earthspike kích hoạt.'],
    nextTest:'Thử Hellscream với cùng mục tiêu và đếm các lần Earthspike kích nổ.',pieceCount:count};
 }
 if(s.mechanicId==='karmic')return {status:'unverified',
   blocking:['Chưa xác minh cokerize trên mục tiêu và đòn Adhesive Gunpowder.'],
   nextTest:'Giữ cùng mục tiêu, so hit Adhesive Gunpowder khi có/không có cokerize.',pieceCount:null};
 if(s.mechanicId==='anemoian')return {status:'unverified',
   blocking:['Chưa xác minh Breath of the Wild, Fortitude và số lần airburst kích hoạt.'],
   nextTest:'Giữ cùng mục tiêu và 20 giây, đo số airburst, độ ổn định Fortitude và lượng sát thương trúng.',pieceCount:null};
 if(s.mechanicId==='charred')return {status:'unverified',
   blocking:['Chưa xác minh Iridescence và số lượt concentrated attacks kích hoạt Charred Aperture.'],
   nextTest:'Giữ cùng mục tiêu, đếm concentrated attacks và đo sát thương chiêu khi bật/tắt hiệu ứng.',pieceCount:null};
 return {status:'unverified',blocking:['Chưa có điều kiện kích hoạt và phép đo đầy đủ.'],
  nextTest:'Giữ cùng mục tiêu, so riêng một thay đổi trong hai lượt đo.',pieceCount:null};
}
// The two most recent screenshots are always different alternatives, not
// independent confirmations that the player has equipped both simultaneously.
function observePhoto(state,raw){
 const previous=bounded(state);
 const latest=observe(empty(),raw,{source:'unconfirmed-ocr'});
 const now=latest.mechanicId?{mechanicId:latest.mechanicId,
   pieceCount:latest.claims[latest.claims.length-1]?.value??null,
   source:'unconfirmed-ocr'}:null;
 const out=empty();
 if(previous.photoTail){
  out.variants.A={...previous.photoTail};
  if(now)out.variants.B=now;
  out.photoTail=now;
  out.revision=previous.revision+1;
 }else if(now){
  out.variants.A=now;
  out.photoTail=now;
  // One screenshot can still be corrected by the player, but is not confirmed.
  out.mechanicId=latest.mechanicId;
  out.claims=latest.claims;
  out.revision=previous.revision+1;
 }
 return out;
}
function auditAlternatives(state){
 const s=bounded(state),a=s.variants.A,b=s.variants.B;
 if(!a&&!b)return null;
 if(!a||!b)return {status:'incomplete',nextTest:'Cần cả hai phương án A và B, có ghi rõ số món đang kích hoạt.',
  items:{A:a||null,B:b||null}};
 if(a.mechanicId!==b.mechanicId)return {status:'different-mechanics',
  nextTest:'Hai phương án thuộc cơ chế khác nhau; so ảnh bộ kỹ năng, điều kiện kích hoạt và phép đo cùng mục tiêu.',
  items:{A:a,B:b}};
 const describe=(x,label)=>{
  if(x.mechanicId==='tarta'){
   if(x.pieceCount===null)return label+': chưa biết số món Tarta.';
   if(x.pieceCount>4)return label+': số món Tarta '+x.pieceCount+' không hợp lệ (tối đa 4).';
   if(x.pieceCount<4)return label+': '+x.pieceCount+'/4 Tarta, chưa đạt điều kiện 4 món.';
   const provenance=x.source==='unconfirmed-ocr'?'OCR chưa xác nhận':'người chơi khai báo';
   return label+': '+provenance+' '+x.pieceCount+'/4 Tarta; còn phải xác minh Hellscream/Earthspike.';
  }
  return label+': có tên cơ chế nhưng chưa có đủ trạng thái kích hoạt.';
 };
 return {status:'separate-options',items:{A:a,B:b},
  lines:[describe(a,'A'),describe(b,'B')],
  nextTest:'Chỉ so hiệu quả sau khi giữ cùng mục tiêu, thời lượng, rotation và kiểm tra điều kiện từng bộ.'};
}
function answer(input,state){
 const s=bounded(state),q=norm(String(input??'').slice(0,400)),a=audit(s);
 const topical=/(so sanh|chon|nen|thay|test|thu|xac minh|tai sao|vi sao|loi|dung|tarta|karmic|build|boss|farm|kich hoat|dieu kien|du set)/.test(q);
 if(!topical)return null;
 const ab=auditAlternatives(s);
 const compare=/(so sanh|chon|nen lay|nen dung|manh hon|tot hon|anh nao|mon nao|phuong an)/.test(q);
 if(compare&&ab?.status==='separate-options')
  return {kind:'suggestion',focus:'game',reason:'separate-builds',
    text:'Hai phương án là hai build riêng, không phải số liệu mâu thuẫn. '+ab.lines.join(' ')+' '+ab.nextTest+' Chưa thể chọn món thắng chỉ từ số món.'};
 if(compare&&ab?.status==='different-mechanics')
  return {kind:'question',focus:'game',reason:'non-comparable-builds',
    text:'Hai phương án dùng các cơ chế khác nhau. '+ab.nextTest};
 if(a.status!=='conflict'){
  const diagnose=/(khong kich hoat|vi sao khong|tai sao khong|sao khong|thu dieu kien|kiem tra dieu kien|co du dieu kien|du set|da kich hoat|da du mon)/.test(q);
  if(!diagnose||!s.mechanicId)return null;
  return {kind:'question',focus:'game',reason:a.status,
    text:'Kiểm tra điều kiện '+s.mechanicId+': '+a.blocking.join(' ')+
      ' Phép thử tiếp theo: '+a.nextTest+
      ' Thần chưa xác nhận hiệu quả bằng chiến đấu thực tế.'};
 }
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
 if(new Set(criteria.map(x=>x.id)).size!==criteria.length)
  return {ok:false,reason:'Tiêu chí trùng lặp; không được cộng trọng số hai lần.'};
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
return {empty,observe,observePhoto,audit,auditAlternatives,answer,compareOptions};
});
