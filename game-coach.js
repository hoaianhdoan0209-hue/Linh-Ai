/* Contextual local analysis. Uses numeric evidence; no generative model or network. */
(function(root,f){const api=f();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.SocratesCoach=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const local=typeof module!=='undefined'&&module.exports;
const V=local?require('./vision-engine.js'):globalThis.LinhVision;
const S=local?require('./stat-schema.js'):globalThis.SocratesStats;
const K=local?require('./season-knowledge.js'):globalThis.SocratesSeasonKnowledge;
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[^a-z0-9%+.,-]+/g,' ').trim();
const fmt=S.fmt;
const result=(text,kind='calculation')=>({text,kind,focus:'game'});
function clean(item){
 if(!item)return null;
 const facts=(item.facts||[]).filter(f=>S.valid(f.key,f.value)).map(({key,value})=>({key,value}));
 const duplicates=new Set();
 // Conflicting same-key values in one source need a new, unambiguous image.
 for(const f of facts){if(duplicates.has(f.key))return null;duplicates.add(f.key);}
 return facts.length||item.tags?.length?{facts,tags:(item.tags||[]).filter(t=>typeof t==='string').slice(0,10),kind:item.kind||'chỉ số'}:null;
}
const values=item=>Object.fromEntries((item?.facts||[]).map(x=>[x.key,x.value]));
function metrics(item,critMode){
 const f=values(item);let base=f.baseDamage,model=false;
 if(base===undefined&&f.attackPower!==undefined&&f.skillDamage!==undefined){base=f.attackPower*f.skillDamage/100;model=true;}
 let multiplier;
 if(f.critChance!==undefined&&f.critDamage!==undefined&&critMode){
  const bonus=critMode==='total'?f.critDamage/100-1:f.critDamage/100;
  if(bonus>=0)multiplier=1+f.critChance/100*bonus;
 }
 return {f,base,model,multiplier,average:base!==undefined&&multiplier!==undefined?base*multiplier:undefined};
}
function analyze(item,{critMode=null,goal=null,unconfirmed=false}={}){
 item=clean(item);if(!item)return result('Chưa đọc được chỉ số rõ. Bệ hạ gửi ảnh bảng chỉ số hoặc nhập “công kích: 1000; tỷ lệ chí mạng: 30%”.','question');
 const m=metrics(item,critMode),f=m.f,parts=[];
 parts.push((unconfirmed?'OCR chưa xác nhận: ':'Số liệu đang dùng: ')+item.facts.map(S.format).join(' · ')+'.');
 if(m.base!==undefined)parts.push(m.model?'Mô hình trước phòng thủ: '+fmt(f.attackPower)+' × '+fmt(f.skillDamage)+'% = '+fmt(m.base)+'. Chưa xác minh kỹ năng thực sự dùng ATK này.':'Đòn thường được cung cấp: '+fmt(m.base)+'.');
 if(f.critChance!==undefined&&f.critDamage!==undefined){
  if(critMode){
   parts.push('Chí mạng '+(critMode==='total'?'là tổng hệ số':'là phần thưởng cộng thêm')+': hệ số trung bình = 1 + '+fmt(f.critChance/100)+' × '+fmt(critMode==='total'?f.critDamage/100-1:f.critDamage/100)+' = '+fmt(m.multiplier)+'×.');
   if(m.average!==undefined)parts.push('Sát thương trung bình mỗi đòn ≈ '+fmt(m.average)+(m.model?' trước giáp/kháng.':', giả định chỉ khác kết quả chí mạng.'));
  }else{
   const total=1+f.critChance/100*(f.critDamage/100-1),bonus=1+f.critChance/100*f.critDamage/100;
   parts.push('ST chí mạng '+fmt(f.critDamage)+'% chưa rõ nghĩa: '+(total>=1?'nếu là tổng hệ số → '+fmt(total)+'×; ':'')+'nếu là phần cộng thêm → '+fmt(bonus)+'× trung bình.');
  }
 }
 if(f.attackSpeed!==undefined&&m.average!==undefined)parts.push('DPS mô hình ≈ '+fmt(m.average)+' × '+fmt(f.attackSpeed)+' = '+fmt(m.average*f.attackSpeed)+'. Chưa tính thời gian di chuyển, trượt đòn hay buff.');
 if(f.cooldown>0&&f.duration!==undefined)parts.push('Buff '+fmt(f.duration)+'s / hồi '+fmt(f.cooldown)+'s: độ phủ tối đa '+fmt(Math.min(1,f.duration/f.cooldown)*100)+'%, khoảng trống '+fmt(Math.max(0,f.cooldown-f.duration))+'s, nếu dùng ngay khi hồi xong.');
 if(goal==='boss')parts.push('Với boss: ưu tiên chỉ số làm tăng sát thương trung bình và giữ buff liên tục; đo trên cùng một boss để kiểm tra giáp/kháng.');
 if(goal==='farm')parts.push('Với farm: ưu tiên diện rộng, hồi chiêu và thời gian dọn một nhóm quái; bảng chỉ số chưa đo được tốc độ dọn map.');
 if(f.critChance!==undefined&&f.critDamage!==undefined&&!critMode)parts.push('Dòng ST chí mạng là tổng hệ số hay phần cộng thêm? Bệ hạ trả lời “tổng” hoặc “cộng thêm”.');
 else if(m.base===undefined)parts.push(f.attackPower!==undefined?'Công kích không phải sát thương thực. Kỹ năng dùng hệ số bao nhiêu %, hoặc một đòn thường gây bao nhiêu sát thương?':'Một đòn thường cùng mục tiêu gây bao nhiêu sát thương?');
 else if(!goal)parts.push('Bệ hạ muốn tối ưu đánh boss hay farm?');
 else if(m.average===undefined)parts.push('Cần tỷ lệ và ST chí mạng để tính sát thương trung bình đầy đủ.');
 return result(parts.join('\n\n'),unconfirmed?'question':'calculation');
}
// Treat two screenshots as separate alternatives. Never merge their values.
function compareImages(first,second,{critMode=null,goal=null,unconfirmed=false}={}){
 const a=clean(first),b=clean(second);
 if(!a||!b)return result('Cần hai ảnh có dữ kiện rõ để so sánh.','question');
 const av=values(a),bv=values(b);
 const shared=Object.keys(av).filter(k=>bv[k]!==undefined);
 const changed=shared.filter(k=>av[k]!==bv[k]);
 const lines=['So sánh riêng hai ảnh (A: trước, B: mới):'];
 if(changed.length)for(const key of changed.slice(0,7)){
  lines.push(S.labels[key]+': A '+fmt(av[key])+' → B '+fmt(bv[key])+'.');
 }else if(shared.length)lines.push('Các chỉ số trùng nhãn đang bằng nhau.');
 else lines.push('Hai ảnh chưa có chỉ số cùng nhãn để đối chiếu.');
 const ma=metrics(a,critMode),mb=metrics(b,critMode);
 let advantage=null;
 if(critMode&&ma.average!==undefined&&mb.average!==undefined&&ma.average>0){
  const bothSpeed=Number.isFinite(av.attackSpeed)&&Number.isFinite(bv.attackSpeed)&&av.attackSpeed>0&&bv.attackSpeed>0;
  const valueA=ma.average*(bothSpeed?av.attackSpeed:1),valueB=mb.average*(bothSpeed?bv.attackSpeed:1);
  const name=bothSpeed?'DPS giả định':'sát thương trung bình mỗi đòn giả định';
  lines.push(name+': A ≈ '+fmt(valueA)+'; B ≈ '+fmt(valueB)+' ('+(valueB>=valueA?'+':'')+fmt((valueB/valueA-1)*100)+'%).');
  advantage=valueB>valueA?'B':valueA>valueB?'A':null;
  lines.push(advantage?'Nếu cùng kỹ năng, mục tiêu và điều kiện, mô hình nghiêng về '+advantage+'.':'Theo mô hình hai phương án ngang nhau.');
 }else{
  if(ma.base!==undefined&&mb.base!==undefined){
   lines.push('Sát thương cơ sở trong ảnh: A '+fmt(ma.base)+'; B '+fmt(mb.base)+'. Chưa đủ hệ số chí mạng để xếp hạng hiệu quả tổng.');
  }
  lines.push('Chưa đủ dữ kiện đồng nhất để khẳng định A hay B mạnh hơn.');
 }
 if(goal==='farm')lines.push('Đánh farm cần thêm tầm đánh, diện rộng và thời gian dọn nhóm quái.');
 else if(goal==='boss')lines.push('Đánh boss cần thêm hồi chiêu và số đo trên cùng boss.');
 else lines.push('Bệ hạ định đánh boss hay farm để thần chọn tiêu chí phù hợp?');
 if(unconfirmed)lines.push('Các số vừa đọc bằng OCR chưa xác nhận; đừng xem đây là kết quả đo thực tế.');
 return result(lines.join('\n'),'suggestion');
}
function create(){
 let current=null,previous=null,critMode=null,goal=null,unconfirmed=false;
 function reset(){current=previous=null;critMode=goal=null;unconfirmed=false;}
 function image(item,confirmed=false){
  const next=clean(item);if(!next)return analyze(null);
  // A new picture replaces the active build; never silently combine two pictures.
  if(confirmed&&current&&JSON.stringify(current.facts)===JSON.stringify(next.facts)){unconfirmed=false;return analyze(current,{critMode,goal});}
  previous=current;current=next;critMode=null;unconfirmed=!confirmed;
  if(previous)return compareImages(previous,current,{critMode,goal,unconfirmed});
  return analyze(current,{critMode,goal,unconfirmed});
 }
 function reply(input,saved=[]){
  const raw=String(input??'').slice(0,700),q=norm(raw);
  if(/^(xoa hoi thoai|quen cuoc tro chuyen|xoa tro chuyen)$/.test(q)){reset();return null;}
  const simple=raw.trim().match(/^(?:tính\s*)?(-?\d+(?:[.,]\d+)?)\s*([+*/×÷-])\s*(-?\d+(?:[.,]\d+)?)\s*=?\s*$/iu);
  if(simple){const a=Number(simple[1].replace(',','.')),b=Number(simple[3].replace(',','.')),op=simple[2];const n=op==='+'?a+b:op==='-'?a-b:(op==='*'||op==='×')?a*b:a/b;return result(Number.isFinite(n)?fmt(a)+' '+op+' '+fmt(b)+' = '+fmt(n):'Không thể chia cho 0.');}
  // Memory commands belong to the durable ledgers, not this temporary context.
  if(/^(ghi nho|luu ghi chu|nho giup|xoa ghi chu|quen ghi chu|do sat thuong|do damage|xoa so do)/.test(q))return null;
  if(!current&&saved.length)current=clean(saved.at(-1));
  if(/\bboss\b/.test(q))goal='boss';else if(/\bfarm\b|don quai/.test(q))goal='farm';
  if(/^(tong|tong he so|la tong|chi mang la tong)/.test(q))critMode='total';
  if(/^(cong them|phan cong them|la cong them|thuong chi mang)/.test(q))critMode='bonus';
  const recognized=V.observe(raw.replace(/;\s*/g,'\n')).facts||[];
  const correction=q.match(/(?:tang|doi|sua)?\s*(ty le chi mang|chi mang|crit chance|crit rate|sat thuong chi mang|st chi mang|crit damage|cong kich|hoi chieu)\s*(?:len|thanh|la|them)\s*(\d+(?:[.,]\d+)?)\s*(%|s|giay)?/);
  if(correction){
   const key=/sat thuong|st chi mang|crit damage/.test(correction[1])?'critDamage':/cong kich/.test(correction[1])?'attackPower':/hoi chieu/.test(correction[1])?'cooldown':'critChance';
   let value=Number(correction[2].replace(',','.'));
   if(/\bthem\b/.test(correction[0])){const old=values(current)[key];if(old===undefined)return result('Chưa có giá trị gốc để cộng thêm. Bệ hạ nhập giá trị hiện tại trước nhé.','question');value+=old;}
   if(S.valid(key,value))recognized.push({key,value});
  }
  if(recognized.length){
   const next=clean({facts:recognized,tags:[],kind:'chỉ số'});
   if(next){
    previous=current;
    // Typed fields are explicit corrections to the active build.
    const merged={...values(current),...values(next)};
    current={facts:Object.entries(merged).map(([key,value])=>({key,value})),tags:current?.tags||[],kind:'chỉ số'};
    // Do not mark unconfirmed OCR as approved because one typed field was added.
    return analyze(current,{critMode,goal,unconfirmed});
   }
  }
  const patch=K.lookup(raw);if(patch.length)return null;
  if(/^(tong|tong he so|la tong|chi mang la tong|cong them|phan cong them|la cong them|thuong chi mang)$/.test(q)&&current)return analyze(current,{critMode,goal,unconfirmed});
  if(!/(anh|hinh|chi so|tinh|phan tich|sat thuong|dps|build|goi y|toi uu|nen|tang|doi|manh|yeu|boss|farm|trang bi|ky nang|tiep|vi sao|tai sao|so sanh|cong kich|chi mang|crit|hoi chieu)/.test(q))return null;
  if(!current)return result('Thần chưa có chỉ số để tính. Bệ hạ gửi ảnh bảng chỉ số; thần sẽ đọc số, lập phép tính và hỏi đúng phần còn thiếu. Ảnh được phân tích ngay, chỉ lưu khi ngài chọn ghi nhớ.','question');
  if(/so sanh|anh truoc|mon truoc|chon (mon|cai|anh) nao|cai nao (manh|tot)|mon nao (manh|tot)|anh (1|2) (hay|voi) anh (1|2)|nen giu (mon|anh) nao|nen lay (mon|anh) nao/.test(q)){
   if(!previous)return result('Thần mới có một phương án. Bệ hạ gửi ảnh món thứ hai để so sánh và cho biết đánh boss hay farm.','question');
   return compareImages(previous,current,{critMode,goal,unconfirmed});
  }
  if(/goi y|toi uu|nen tang|uu tien|manh hon/.test(q)){
   const f=values(current),lines=[];
   if(f.critChance!==undefined&&f.critDamage!==undefined&&critMode){
    const d=critMode==='total'?f.critDamage/100-1:f.critDamage/100;
    const baseline=1+f.critChance/100*d;
    const chance=(Math.min(100,f.critChance+10)-f.critChance)/100*d;
    const damage=f.critChance/100*0.1;
    lines.push('Giả sử hai lựa chọn cùng chi phí và chỉ đổi một chỉ số: +10 điểm % tỷ lệ chí mạng → tăng '+fmt(chance/baseline*100)+'% sát thương trung bình; +10 điểm % ST chí mạng → tăng '+fmt(damage/baseline*100)+'%.');
    lines.push(chance>damage?'Theo mô hình này, ưu tiên tỷ lệ chí mạng.':chance<damage?'Theo mô hình này, ưu tiên ST chí mạng.':'Hai lựa chọn ngang nhau theo mô hình.');
   }
   if(f.cooldown>0&&f.duration!==undefined&&f.duration<f.cooldown)lines.push('Buff đang trống '+fmt(f.cooldown-f.duration)+'s mỗi chu kỳ. Giảm hồi chiêu hoặc tăng thời lượng sẽ giúp ổn định hơn; cần biết chi phí từng lựa chọn.');
   if(current.tags.includes('burn')&&current.tags.includes('poison'))lines.push('Ảnh có độc và thiêu đốt: thử cùng mục tiêu với từng hiệu ứng riêng rồi kết hợp, so tổng sát thương trong cùng 10 giây.');
   if(lines.length)return result(lines.join('\n\n')+'\n\n'+(unconfirmed?'Các số OCR vẫn cần Bệ hạ xác nhận. ':'')+'Đây là gợi ý từ dữ kiện hiện có, chưa phải kết luận build tốt nhất.','suggestion');
  }
  return analyze(current,{critMode,goal,unconfirmed});
 }
 return {image,reply,reset};
}
return {create,analyze,metrics,compareImages};
});
