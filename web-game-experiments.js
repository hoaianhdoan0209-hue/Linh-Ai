/* Socrates 1.4 local experiment ledger.
 * Measurements are entered explicitly by the player, never inferred from OCR.
 * A shared text label does not prove identical equipment or game conditions.
 */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.SocratesExperiments=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='socrates-game-measurements-v1',MAX=40,AGE=365*24*3600*1000;
  const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()
    .replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
  const contextual=s=>/boss|quai|game|skill|ky nang|trang bi|combo|build|muc tieu|damage|sat thuong|tap luyen|training|fatebound/.test(norm(s));
  const sensitive=s=>/https?:\/\/|www\.|@/.test(s)||
    /mat khau|password|token|otp|email|so dien thoai/.test(norm(s))||
    /\b\d{9,}\b/.test(s);
  const fmt=x=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:1}).format(x);
  function valid(value,now=Date.now()){
    if(!value||typeof value!=='object'||typeof value.context!=='string')return null;
    const label=value.context.trim().replace(/\s+/g,' ').slice(0,50);
    const amount=Number(value.damage);
    if(label.length<4||!contextual(label)||sensitive(label)||!Number.isFinite(amount)||
      amount<1||amount>100000000||!Number.isInteger(amount)||
      !Number.isFinite(value.at)||value.at<now-AGE||value.at>now+60000)return null;
    return {context:label,damage:amount,at:value.at,source:'user-measured'};
  }
  function sanitize(raw,now=Date.now()){
    let s=raw;
    if(typeof raw==='string'){
      if(raw.length>20000)return [];
      try{s=JSON.parse(raw)}catch(_){return []}
    }
    if(!s||s.version!==1||!Array.isArray(s.items))return [];
    return s.items.slice(-MAX).map(x=>valid(x,now)).filter(Boolean);
  }
  const payload=items=>JSON.stringify({version:1,items:sanitize({version:1,items})});
  function parse(raw,now=Date.now()){
    const input=String(raw??'').trim().slice(0,300);
    const m=input.match(/^(?:đo|do)\s*(?:sát\s*thương|sat\s*thuong|damage)\s+(.{4,55}?)\s*[:=]\s*(\d{1,9}|\d{1,3}(?:[.,]\d{3}){1,3})\s*$/iu);
    if(!m)return null;
    const n=Number(m[2].replace(/[.,]/g,''));
    return valid({context:m[1],damage:n,at:now},now);
  }
  function compare(items){
    const a=sanitize({version:1,items});
    if(a.length<2)return null;
    const last=a.at(-1);
    const earlier=a.slice(0,-1).reverse().find(x=>norm(x.context)===norm(last.context));
    if(!earlier)return null;
    const change=(last.damage/earlier.damage-1)*100;
    if(!Number.isFinite(change)||Math.abs(change)>300)return null;
    const rounded=Math.round(change*10)/10;
    return {before:earlier.damage,after:last.damage,percent:rounded,
      context:last.context,text:'Cùng nhãn "'+last.context+'": '+fmt(earlier.damage)+' → '+
       fmt(last.damage)+' ('+(rounded>0?'+':'')+fmt(rounded)+'%). Chưa rõ nguyên nhân.'};
  }
  function record(items,raw,now=Date.now()){
    const measured=parse(raw,now);
    if(!measured)return null;
    const old=sanitize({version:1,items},now);
    const next=[...old,measured].slice(-MAX);
    const delta=compare(next);
    return {items:next,added:true,
      text:delta?('Đã lưu lần đo. '+delta.text).slice(0,230):
        ('Đã lưu '+fmt(measured.damage)+' sát thương ở "'+measured.context+
          '". So tiếp với cùng nhãn để thấy chênh lệch; nhớ giữ nguyên điều kiện.').slice(0,230),
      kind:delta?'calculation':'memory',focus:'game',action:'save-measurement'};
  }
  function answer(raw,items){
    const q=norm(raw),saved=sanitize({version:1,items});
    if(/^(quen so do|xoa so do|xoa phep do)$/.test(q))
      return {text:'Xóa toàn bộ số đo sát thương đã ghi trên máy?',kind:'question',
        focus:'game',action:'confirm-clear-measurements'};
    if(!/(so do|phep do|do sat thuong|do damage|so sanh sat thuong)/.test(q))return null;
    if(saved.length===0)return {text:'Chưa lưu số đo nào. Ví dụ: "đo sát thương boss rắn: 1000".',
      kind:'question',focus:'game'};
    const delta=compare(saved);
    return {text:(delta?
      'Đã lưu '+saved.length+' lần đo. '+delta.text:
      'Đã lưu '+saved.length+' số đo, nhưng chưa có hai lần cùng nhãn để so sánh.').slice(0,230),
      focus:'game',kind:delta?'calculation':'memory'};
  }
  return {KEY,MAX,norm,valid,sanitize,payload,parse,compare,record,answer};
});
