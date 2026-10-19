/* Socrates Web Image Memory 1.2: voluntary, bounded, structured OCR learning.
 * No screenshots, base64 images or raw OCR text are persisted.
 * Facts represent user-confirmed OCR transcription, NOT proven game mechanics.
 */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.LinhImageMemory=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='linh-web-image-memory-v1', LIMIT=40, MAX_AGE=365*24*3600*1000;
  const LABELS=Object.freeze({
    critChance:'Tỷ lệ chí mạng',critDamage:'ST chí mạng',
    attack:'Tăng công',armorPen:'Xuyên giáp',resistPen:'Xuyên kháng'
  });
  const TOPICS=Object.freeze({
    burn:'thiêu đốt',poison:'độc',crit:'chí mạng',cooldown:'hồi chiêu',
    armor:'giáp',duration:'thời lượng',stack:'cộng dồn',stacks:'cộng dồn',
    vuln:'nhận thêm sát thương',vulnerable:'nhận thêm sát thương'
  });
  const KINDS=['chỉ số','kỹ năng','trang bị','hiệu ứng','chưa rõ'];
  const normalizeText=s=>String(s??'').slice(0,12000);
  const unique=xs=>[...new Set(xs)];
  function classify(text){
    const s=normalizeText(text).toLowerCase();
    if(/trang bị|equipment|weapon|armor|mũ|giày|vũ khí/i.test(s))return 'trang bị';
    if(/kỹ năng|skill|cooldown|hồi chiêu/i.test(s))return 'kỹ năng';
    if(/tầng|hiệu ứng|stack|fatebound|poison|thiêu đốt|burn/i.test(s))return 'hiệu ứng';
    if(/sát thương|chí mạng|crit|xuyên giáp|attack|tăng công/i.test(s))return 'chỉ số';
    return 'chưa rõ';
  }
  function candidate(raw,vision){
    const text=normalizeText(raw),v=vision&&typeof vision==='object'?vision:{};
    const facts=unique((Array.isArray(v.facts)?v.facts:[]).map(f=>{
      if(!f||!Object.hasOwn(LABELS,f.key))return null;
      const n=Number(f.value);
      return Number.isFinite(n)&&n>=0&&n<=1000?{key:f.key,value:Math.round(n*100)/100}:null;
    }).filter(Boolean).map(f=>JSON.stringify(f))).slice(0,8).map(x=>JSON.parse(x));
    const tags=unique((Array.isArray(v.tags)?v.tags:[]).map(t=>t?.key)
      .filter(t=>typeof t==='string'&&Object.hasOwn(TOPICS,t))).slice(0,10);
    if(!facts.length&&!tags.length)return null;
    return {kind:classify(text),facts,tags};
  }
  function signature(c){
    if(!c)return '';
    return JSON.stringify({kind:c.kind,facts:c.facts,tags:c.tags});
  }
  function validEntry(item,now=Date.now()){
    if(!item||typeof item!=='object'||!KINDS.includes(item.kind)||
       !Number.isFinite(item.at)||item.at<now-MAX_AGE||item.at>now+60000)return null;
    const clean=candidate('',{facts:item.facts,tags:(item.tags||[]).map(key=>({key}))});
    if(!clean)return null;
    clean.kind=item.kind;
    return {kind:clean.kind,facts:clean.facts,tags:clean.tags,at:item.at,
      id:signature(clean).slice(0,250)};
  }
  function sanitize(value,now=Date.now()){
    let obj=value;
    if(typeof value==='string'){
      if(value.length>180000)return [];
      try{obj=JSON.parse(value)}catch(_){return []}
    }
    if(!obj||obj.version!==1||!Array.isArray(obj.items))return [];
    const entries=obj.items.slice(-LIMIT*2).map(x=>validEntry(x,now)).filter(Boolean);
    const seen=new Set(),out=[];
    for(const x of entries.reverse()){
      if(seen.has(x.id))continue;
      seen.add(x.id);out.push(x);
      if(out.length===LIMIT)break;
    }
    return out.reverse();
  }
  function approve(saved,preview,now=Date.now()){
    if(!preview)return {items:sanitize({version:1,items:saved},now),added:false};
    // Do not accept arbitrary preview fields, sanitize through known OCR keys.
    const obj={kind:KINDS.includes(preview.kind)?preview.kind:'chưa rõ',
      facts:preview.facts,tags:preview.tags,at:now};
    const entry=validEntry(obj,now);
    const prior=sanitize({version:1,items:saved},now);
    if(!entry)return {items:prior,added:false};
    if(prior.some(x=>x.id===entry.id))return {items:prior,added:false};
    return {items:[...prior,entry].slice(-LIMIT),added:true};
  }
  const payload=items=>JSON.stringify({version:1,items:sanitize({version:1,items})});
  function describe(preview){
    if(!preview)return 'Socrates chưa đọc rõ chỉ số hoặc từ khóa. Chưa có gì để ghi nhớ.';
    const v=[];
    for(const f of preview.facts||[]){
      if(Object.hasOwn(LABELS,f.key))v.push(LABELS[f.key]+': '+f.value+'%');
    }
    for(const t of preview.tags||[]){
      if(Object.hasOwn(TOPICS,t))v.push(TOPICS[t]);
    }
    const first=v.slice(0,4).join(' · ');
    return 'Ảnh có vẻ là '+preview.kind+'. OCR: '+first+'. Bệ hạ xác nhận chữ đã đọc đúng chứ?';
  }
  function recall(saved){
    const items=sanitize({version:1,items:saved});
    if(!items.length)return 'Socrates chưa lưu kiến thức từ ảnh nào được xác nhận.';
    const last=items.at(-1);
    const facts=last.facts.map(x=>LABELS[x.key]+' '+x.value+'%').slice(0,2);
    const tags=last.tags.map(x=>TOPICS[x]).slice(0,2);
    const line=[...facts,...tags].join(', ');
    return 'Socrates nhớ '+items.length+' ảnh đã xác nhận chữ. Gần nhất: '+
      last.kind+(line?' ('+line+')':'')+'. Chưa chứng minh cơ chế game.';
  }
  return {KEY,LIMIT,LABELS,TOPICS,classify,candidate,sanitize,approve,payload,describe,recall};
});
