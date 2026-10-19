/* Official ChillyRoom class catalogue — names, pairings and visible skill labels.
 * Public pages describe only a subset of all classes. Not live SS9 DPS data.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SocratesClassCatalog=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const rows=Object.freeze([
 {name:'Voidfarer',category:'initial',base:[],id:1,
  active:['Hyperspace Ram','Starlight in the Everdark','Gaze of the Abyss','Interplanar Voyager'],
  passive:['Voidout','Dark Whispers'],
  core:'Hyperspace Ram: chạm và đi vào Void, gây Dark Damage sau một độ trễ; Voidout tiêu hao mana thay HP khi bị đánh và đưa nhân vật vào Void'},
 {name:'DreadKnight',category:'prestige',base:['Voidfarer','Warrior'],id:2,
  active:['Bloodcurdling Roar','Dark Commandment','Dark Maelstrom','Dark Covenant'],
  passive:['Bloodborne','Dreadnaught','Shadow Manifestation'],
  core:'Bloodcurdling Roar tiêu hao HP và Battlelust, tạo Blood Rosin gây Dark Damage và hồi HP; Bloodborne tích Battlelust và mana khi mất HP'},
 {name:'Dark Ranger',category:'prestige',base:['Voidfarer','Archer'],id:3,
  active:['Nightpiercer','Dark Symphony','Atrophic Barrage','Astral Pulse'],
  passive:['Planar Locator','Covered Reload','Closing Shadows'],
  core:'Nightpiercer bắn tên truy đuổi xuyên mục tiêu, tiêu hao Deadlock để kéo dài thời gian; Planar Locator liên quan Mark, Beacon và Void'},
 {name:'Astral Mage',category:'prestige',base:['Voidfarer','Tempest Mage'],id:4,
  active:['Excantation: Stellachroma','Excantation: Iridescence','Excantation: Astral Phenomena',"Excantation: Chiron’s Wake"],
  passive:['Fathomless Deep','Interminable Dark','Infinity Horizon'],
  core:'Excantation: Stellachroma sử dụng negative mana, đổi thành nguyên tố đối lập kỹ năng không phải Excantation vừa thi triển; Fathomless Deep thay đổi Dark Ailment'},
 {name:'Necromancer',category:'prestige',base:['Voidfarer','Animancer'],id:5,
  active:['Ghostrider','Lazarus Wave','Possess','Atrophic Torrent'],
  passive:['Reaping','Death Endures','Necromorphology'],
  core:'Ghostrider triệu hồi người cưỡi ngựa vô hình trợ chiến; Reaping thu Souls khi địch chết hoặc minion hết hạn, tiêu hao Souls để tăng sức mạnh minion'}
].map(r=>Object.freeze({...r,source:'https://prequel.chillyroom.com/et/class/'+r.id,
  seasonScope:'official-class-page; NOT SS9 tier balance',
  active:Object.freeze(r.active),passive:Object.freeze(r.passive)})));
const extra=Object.freeze(['Warliege','Ranger','Soulkeeper','Stormblade','Druid','Pyroknight','Elementalist',
 'Artillerist','Wildwalker','Tempest Archer','Nyxen','Astreon']);
const referenceExtra='https://prequel.chillyroom.com/et/article/base/133';
const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/ig,'d')
 .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const has=(q,word)=>word.length>3&&(' '+norm(q)+' ').includes(' '+norm(word)+' ');
function find(q){
 const str=String(q||'').slice(0,900),found=[];
 for(const r of rows){
  if(has(str,r.name)||r.active.some(n=>has(str,n))||r.passive.some(n=>has(str,n)))
    found.push(r);
 }
 return found.slice(0,2);
}
function answer(q){
 const text=norm(q);
 if(/(?:cac class|danh sach class|co nhung class nao|lop nhan vat|nhung lop nao|list class|class nao)/.test(text)){
  return {text:'Kho class chính thức đang có 5 trang chi tiết: '+rows.map(r=>r.name).join(', ')+
    '. Đã lập chỉ mục '+rows.reduce((a,r)=>a+r.active.length+r.passive.length,0)+
    ' tên kỹ năng chủ động/bị động. Các class khác mới có tên tham khảo như '+extra.slice(0,6).join(', ')+
    ', chưa có cây kỹ năng chi tiết xác nhận. Không phải danh sách toàn bộ SS9. Nguồn: https://prequel.chillyroom.com/et/class',
   kind:'mechanics',focus:'game',source:'official-partial-roster'};
 }
 const matched=find(q);
 if(!matched.length)return null;
 const r=matched[0],skill=[...r.active,...r.passive].find(n=>has(q,n));
 return {text:r.name+' ('+(r.category==='initial'?'Initial class':'Prestige: '+r.base.join(' + '))+').'+
  (skill?'\nKỹ năng được hỏi: '+skill+(r.active.includes(skill)?' [Active]':' [Passive]')+'.':'')+
  '\nActive: '+r.active.join('; ')+'.\nPassive: '+r.passive.join('; ')+
  '.\nQuan hệ được ChillyRoom mô tả: '+r.core+
  '.\nNguồn: '+r.source+
  '\nLưu ý: trang class không đủ chứng minh tier/hệ số hiện hành SS9; hãy kiểm tra Codex trong game.',
  kind:'mechanics',focus:'game',source:r.source};
}
return {rows,extra,find,answer,norm};
});
