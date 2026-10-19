/* Socrates 1.4: transparent local calculations and approved gameplay memory.
 * A percentage comparison is a MODEL, not a confirmed game formula.
 * User-written game notes are CLAIMS, not measurements or proof.
 * Nothing uploads, reads other apps, or stores private screenshots/chat logs.
 */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.SocratesGameBrain=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const seasons=typeof module!=='undefined'&&module.exports?require('./season-knowledge.js'):globalThis.SocratesSeasonKnowledge;
  const KEY='socrates-game-notes-v1', VERSION=1, MAX_NOTES=25;
  const AGE=365*24*60*60*1000;
  const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()
    .replace(/[^a-z0-9%+.-]+/g,' ').replace(/\s+/g,' ').trim();
  const fmt=n=>Number.isFinite(n)?new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(n):'—';
  const pct=n=>fmt(Math.round(n*100)/100)+'%';
  const reply=(text,kind='calculation')=>({text:String(text).slice(0,230),focus:'game',kind});
  const gameTopic=t=>/game|boss|combo|build|skill|ky nang|trang bi|fatebound|sat thuong|crit|chi mang|hoi chieu|buff|giam giap|xuyen giap|phong thu|thieu dot|doc|mana|dps|farm|hp|helxar|quai|hieu ung|cong don|trang thai/.test(norm(t));
  function cleanNote(x,now=Date.now()){
    if(!x||typeof x!=='object'||typeof x.text!=='string')return null;
    const text=x.text.trim().replace(/\s+/g,' ').slice(0,140);
    if(text.length<7||!gameTopic(text)||
       /https?:\/\/|www\.|@/i.test(text)||
       /\b(?:token|mat khau|password|api key|ma otp|so dien thoai|email|dia chi)\b/.test(norm(text))||
       /\b\d{8,}\b/.test(text))return null;
    if(!Number.isFinite(x.at)||x.at>now+60000||x.at<now-AGE)return null;
    return {text,at:x.at,source:'user-note',status:'chưa kiểm chứng'};
  }
  function sanitize(raw,now=Date.now()){
    let data=raw;
    if(typeof raw==='string'){
      if(raw.length>18000)return [];
      try{data=JSON.parse(raw)}catch(_){return []}
    }
    if(!data||data.version!==VERSION||!Array.isArray(data.items))return [];
    const seen=new Set(),out=[];
    for(const value of data.items.slice(-MAX_NOTES*3).reverse()){
      const note=cleanNote(value,now);
      if(!note)continue;
      const id=norm(note.text);
      if(seen.has(id))continue;
      seen.add(id);
      out.push(note);
      if(out.length>=MAX_NOTES)break;
    }
    return out.reverse();
  }
  const payload=items=>JSON.stringify({version:VERSION,items:sanitize({version:VERSION,items})});
  function addNote(items,raw,now=Date.now()){
    const old=sanitize({version:VERSION,items},now);
    const candidate=cleanNote({text:String(raw??''),at:now},now);
    if(!candidate)return {items:old,added:false,reason:'Chỉ ghi nhớ ghi chú về game, không lưu thông tin cá nhân hay dữ liệu bí mật.'};
    if(old.some(x=>norm(x.text)===norm(candidate.text)))
      return {items:old,added:false,reason:'Socrates đã có ghi chú này rồi.'};
    return {items:[...old,candidate].slice(-MAX_NOTES),added:true,
      reason:'Đã lưu ghi chú do Bệ hạ cung cấp. Chưa kiểm chứng trong game.'};
  }
  const asItems=xs=>Array.isArray(xs)?xs.slice(-40).filter(x=>x&&Array.isArray(x.facts)&&Array.isArray(x.tags)):[];
  function pairedCrit(items){
    // BOTH fields must originate from the SAME user-confirmed screenshot,
    // never splice attributes from unrelated equipment/builds.
    for(const item of asItems(items).reverse()){
      const chance=item.facts.find(x=>x.key==='critChance')?.value;
      const bonus=item.facts.find(x=>x.key==='critDamage')?.value;
      if(Number.isFinite(chance)&&chance>=0&&chance<=100 &&
         Number.isFinite(bonus)&&bonus>=0&&bonus<=1000)
        return {chance,bonus,kind:item.kind};
    }
    return null;
  }
  function parseDamageBase(original){
    const noPercents=String(original).replace(/[+-]?\d+(?:[.,]\d+)?\s*%/g,' ');
    const m=noPercents.match(/\b\d+(?:[.,]\d+)?\b/g)||[];
    const raw=m.find(x=>Number(x.replace(',','.'))>=1);
    if(!raw)return null;
    const value=Number(raw.replace(',','.'));
    return Number.isFinite(value)&&value>=1&&value<=100000000?value:null;
  }
  function compareBuffs(a,b,base=null){
    if(![a,b].every(x=>Number.isFinite(x)&&x>=-100&&x<=500))return null;
    const plus=1+(a+b)/100,product=(1+a/100)*(1+b/100);
    if(plus<0||product<0)return null;
    return {add:plus,multiply:product,
      difference:product-plus,
      ...(base!==null?{addDamage:base*plus,multiplyDamage:base*product}:{})};
  }
  function calcCrit(items,base=null){
    const pair=pairedCrit(items);
    if(!pair)return null;
    const multiplier=1+(pair.chance/100)*(pair.bonus/100);
    if(!Number.isFinite(multiplier))return null;
    return {...pair,multiplier,...(base===null?{}:{average:base*multiplier,normal:base,
      critical:base*(1+pair.bonus/100)})};
  }
  function summary(images,notes,legacy,measurements=[]){
    const numImages=asItems(images).length, clean=sanitize({version:VERSION,items:notes});
    const measured=legacy?.observationCount||0,oldOCR=legacy?.verifiedOCR||0;
    const typed=Array.isArray(measurements)?measurements.slice(-40).filter(x=>x&&x.source==='user-measured').length:0;
    const intro='Trên máy: '+numImages+' ảnh OCR đã xác nhận, '+clean.length+
      ' ghi chú Bệ hạ cung cấp, '+typed+' số đo nhập tại đây, '+measured+
      ' phép đo cũ, '+oldOCR+' OCR từ hồ sơ cũ.';
    const recent=clean.at(-1)?.text;
    const detail=recent?' Ghi chú gần nhất: '+recent+' (chưa kiểm chứng).':'';
    return reply(intro+detail,'memory');
  }
  const percentsIn=s=>/[0-9]\s*%/.test(s);
  function answer(original,images=[],notes=[],legacy=null,measurements=[]){
    const raw=String(original??'').trim().slice(0,300),q=norm(raw);
    if(!raw)return null;
    const parsedSave=raw.match(/^\s*(?:ghi\s*nhớ|ghi\s*nho|lưu\s*ghi\s*chú|luu\s*ghi\s*chu|nhớ\s*giúp|nho\s*giup)\s*(?:game)?\s*[:：-]\s*(.{1,220})$/iu);
    if(parsedSave){
      const result=addNote(notes,parsedSave[1]);
      return {...reply(result.reason,'memory'),action:result.added?'save-note':'none',notes:result.items};
    }
    if(/^(quen ghi chu|xoa ghi chu)( game)?$/.test(q))
      return {...reply('Bệ hạ có muốn xóa tất cả ghi chú game do mình nhập không?','question'),
        action:'confirm-clear-notes'};
    if(/^(ghi chu game|ghi chu da luu|xem ghi chu|nho gi ve game|da hoc gi|hoc duoc gi|nho duoc gi|tri nho game|bo nho game)$/.test(q) ||
       (/^(socrates )?(da hoc|nho) (duoc )?gi/.test(q)))
      return summary(images,notes,legacy,measurements);
    if(/(so sanh|chenh lech|thay doi|phep do)/.test(q)&&/sat thuong|do|phep do|damage/.test(q)&&legacy?.comparison)
      return reply('Hai phép đo cùng ngữ cảnh đã lưu: '+legacy.comparison+
        ' Đây là chênh lệch, chưa chứng minh nguyên nhân.','calculation');
    const patch=seasons?.lookup(raw)||[];
    if(patch.length&&!percentsIn(raw))return {text:patch[0].text,focus:'game',kind:'official-patch'};
    // Only compute explicitly supplied percentages. Never invent in-game buff
    // stacking, energy, skill timing or DPS from a static picture.
    const percents=[...raw.matchAll(/([+-]?\d+(?:[.,]\d+)?)\s*%/g)]
      .map(x=>Number(x[1].replace(',','.')));
    const wantsMath=/(tinh|cong|nhan|so sanh|combo|phoi|ghep|tong|sat thuong|buff|hieu ung|khac nhau|chenh lech|%)/.test(q);
    if(wantsMath&&percents.length>=2){
      if(percents.length>2)return reply('Có hơn hai hệ số %. Bệ hạ hãy chọn hai hệ số để Socrates so cộng và nhân.','question');
      const result=compareBuffs(percents[0],percents[1],parseDamageBase(raw));
      if(!result)return reply('Các hệ số chưa hợp lệ để so sánh. Bệ hạ kiểm tra lại dấu % và con số nhé.','question');
      const basic='Nếu cộng: '+pct((result.add-1)*100)+
        '; nếu nhân: '+pct((result.multiply-1)*100)+'.';
      const values=('addDamage'in result)?' Với sát thương gốc '+fmt(parseDamageBase(raw))+
        ': '+fmt(result.addDamage)+' hoặc '+fmt(result.multiplyDamage)+'.':'';
      return reply(basic+values+' Đây là hai giả định, chưa biết game dùng cách nào.');
    }
    if(/(tinh|uoc tinh|chi mang|crit|sat thuong|dps|trung binh)/.test(q)){
      const c=calcCrit(images,parseDamageBase(raw));
      if(c&&/(chi mang|crit|sat thuong|tinh|uoc tinh)/.test(q)){
        let s='Cùng một ảnh đã xác nhận: chí mạng '+pct(c.chance)+
          ', thưởng chí mạng '+pct(c.bonus)+'.';
        s+=' Nếu thưởng áp lên đòn thường, hệ số trung bình ≈ '+fmt(c.multiplier)+'×.';
        if('average'in c)s+=' Với '+fmt(c.normal)+' sát thương gốc: ≈ '+fmt(c.average)+'.';
        return reply(s+' Chỉ là mô hình, chưa xác minh.');
      }
      if(/chi mang|crit/.test(q)){
        return reply('Chưa có đủ tỷ lệ và thưởng chí mạng từ CÙNG một ảnh đã xác nhận. Hãy gửi ảnh đủ hai chỉ số hoặc nhập trực tiếp hai hệ số %.','question');
      }
      if(/combo|dps/.test(q)){
        return reply('Chưa đủ dữ liệu nhịp đánh, hồi chiêu và hiệu ứng để tính DPS/combo thật. Bộ tính hồ sơ chi tiết vẫn ở trang phân tích cũ.','question');
      }
    }
    if(/(nho|hoc|ghi nho|du lieu|da luu)/.test(q) && /(game|anh|hinh|chi so|combo|hieu ung)/.test(q))
      return summary(images,notes,legacy,measurements);
    return null;
  }
  // In-session follow-up for an explicitly requested SS9 fact, not a
  // free-floating recommendation and never saved as player evidence.
  function followup(raw,priorPatch){
    const q=norm(String(raw??'').slice(0,300));
    if(!priorPatch||typeof priorPatch.text!=='string')return null;
    if(!/^(nen dung|nen dung khong|co nen dung|co nen dung khong|dung duoc khong|co manh hon khong|manh hon khong|co hop boss|co hop farm|danh boss duoc khong|farm duoc khong|nen thay khong|co nen thay khong)$/.test(q))return null;
    const topic=priorPatch.text.split(/[:.;]/,1)[0].trim().slice(0,60);
    const goal=/boss/.test(q)?'đánh boss':/farm/.test(q)?'farm':'build hiện tại';
    return reply('Về '+topic+': chưa thể khuyên dùng chỉ từ ghi chú bản vá. Cần xem điều kiện kích hoạt và chỉ số của '+goal+' để so với món đang dùng. Gửi bảng chỉ số hoặc 2 phép đo cùng mục tiêu nhé.','suggestion');
  }
  function nextStudyPrompt(images,notes){
    const items=asItems(images), saved=sanitize({version:VERSION,items:notes});
    if(saved.length){
      const t=saved.at(-1).text;
      return 'Socrates nhớ ghi chú về game: '+t.slice(0,94)+'. Bệ hạ đã kiểm chứng điều đó chưa?';
    }
    if(items.length){
      const recent=items.at(-1),topics=recent.tags||[],facts=recent.facts||[];
      if(topics.includes('burn')&&topics.includes('poison'))
        return 'Ảnh cũ có độc và thiêu đốt. Bệ hạ có muốn thử riêng hai hiệu ứng để kiểm chứng không?';
      if(facts.some(x=>x.key==='critChance'))
        return 'Ảnh trước có tỷ lệ chí mạng. Ta cần sát thương thường và thưởng chí mạng để tính chính xác hơn.';
      return 'Socrates đã ghi nhớ dấu hiệu từ ảnh. Bệ hạ muốn kiểm chứng hiệu ứng nào trước?';
    }
    return null;
  }
  return {KEY,MAX_NOTES,norm,sanitize,payload,addNote,pairedCrit,calcCrit,compareBuffs,
    parseDamageBase,summary,answer,followup,nextStudyPrompt};
});
