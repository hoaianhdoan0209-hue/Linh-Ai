/* SS9 roster: user-supplied candidate names, checked against dated public
 * evidence. NOT a complete official in-game Codex or verified tier list.
 * Keep user submissions separate from corroborated and contradictory pairs.
 */
(function(root,factory){
 const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SocratesClassRoster=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const source={
 user:'user-supplied-2026-10-19',
 developer:'https://prequel.chillyroom.com/et/class/5',
 classListing:'https://prequel.chillyroom.com/et/class',
 legacy:'https://soulknightprequel.wiki.gg/wiki/Classes',
 tier:'https://www.pocketgamer.com/soul-knight-prequel/tier-list/',
 oldPairings:'https://w.atwiki.jp/soulknightprequel_jp/pages/17.html',
 nyxen:'https://prequel.chillyroom.com/et/article/base/313',
 astreon:'https://prequel.chillyroom.com/et/article/base/358',
 hellion:'https://prequel.chillyroom.com/et/article/base/292',
 tempestArcher:'https://apps.apple.com/us/app/soul-knight-prequel/id6469258709'
};
const basics=[
 ['Warrior','Cận chiến vật lý, kiếm/khiên và sức chống chịu'],
 ['Thief','Cơ động, tấn công nhanh và chí mạng'],
 ['Archer','Tầm xa vật lý, bắn cung và giữ khoảng cách'],
 ['Pyromancer','Sát thương lửa và thiêu đốt'],
 ['Tempest Mage','Phép băng/lôi và khống chế'],
 ['Aegis','Phòng ngự, khiên và phản đòn'],
 ['Animancer','Triệu hồi đơn vị chiến đấu'],
 ['Herbalist','Độc, thảo dược, hồi phục'],
 ['Voidfarer','Dark Damage và cơ chế Void'],
 ['Lightbringer','Sát thương và hỗ trợ theo ánh sáng']
].map(([name,style])=>Object.freeze({name,kind:'basic',style,base:[],
 source:name==='Voidfarer'?source.classListing:source.tier,
 grade:name==='Voidfarer'?'developer-page':'secondary-current',
 verifiedEffect:false}));
const combined=[
 ['Assassin','Warrior','Thief','Ám sát và sát thương chí mạng'],
 ['Warliege','Warrior','Aegis','Cận chiến, khiên và sinh tồn'],
 ['Pyroknight','Warrior','Pyromancer','Cận chiến lửa'],
 ['Stormwarden','Aegis','Tempest Mage','Băng/lôi và chống chịu'],
 ['Ranger','Archer','Thief','Đòn bắn tầm xa liên tục'],
 ['Bastion','Archer','Aegis','Bắn xa kết hợp phòng ngự'],
 ['Artillerist','Archer','Pyromancer','Đòn nổ và kỹ năng hệ lửa'],
 ['Farstrider','Archer','Herbalist','Tầm xa và hệ thực vật'],
 ['Dark Ranger','Archer','Voidfarer','Cung thủ Dark Damage'],
 ['Stormblade','Thief','Tempest Mage','Cơ động kết hợp sét'],
 ['Shinobi','Thief','Animancer','Phân thân và triệu hồi'],
 ['Wildwalker','Warrior','Herbalist','Lối chơi thiên nhiên và cận chiến'],
 ['Elementalist','Pyromancer','Tempest Mage','Kết hợp lửa, băng và lôi'],
 ['Heretic','Pyromancer','Animancer','Triệu hồi kết hợp lửa'],
 ['Soulkeeper','Aegis','Animancer','Triệu hồi và phòng thủ'],
 ['Stormshaman','Tempest Mage','Herbalist','Thiên nhiên và lôi'],
 ['Druid','Animancer','Herbalist','Hóa hình và phép thiên nhiên'],
 ['Dreadknight','Warrior','Voidfarer','Cận chiến bóng tối'],
 ['Astral Mage','Tempest Mage','Voidfarer','Kỹ năng không gian và tinh tú'],
 ['Necromancer','Animancer','Voidfarer','Triệu hồi linh hồn và souls'],
 ['Lifebinder','Herbalist','Lightbringer','Hồi phục và hỗ trợ quang'],
 ['Paragon','Aegis','Lightbringer','Giáp và phép ánh sáng'],
 ['Vindicator','Thief','Lightbringer','Tấn công nhanh bằng ánh sáng'],
 ['Heliomancer','Pyromancer','Lightbringer','Lửa kết hợp ánh sáng'],
 ['Riftvoker','Voidfarer','Lightbringer','Dark/Light và không gian']
].map(([name,a,b,style])=>{
 const official=['Dark Ranger','Dreadknight','Astral Mage','Necromancer'].includes(name);
 const historical=['Assassin','Warliege','Pyroknight','Ranger','Bastion','Artillerist',
   'Stormblade','Shinobi','Elementalist','Heretic','Soulkeeper'].includes(name);
 const current=['Paragon','Vindicator','Lifebinder','Heliomancer','Riftvoker'].includes(name);
 const tentative=['Farstrider','Wildwalker','Stormshaman','Druid'].includes(name);
 const conflict=name==='Stormwarden';
 return Object.freeze({name,kind:'combined',base:conflict?[]:[a,b],style,
  // The roster is a lookup table, not proof that a class formula is available
  // in any player's particular version/region.
  grade:official?'developer-page':conflict?'conflicting-sources':
    historical?'legacy-correlated':current?'secondary-current':
    tentative?'community-historical':'user-provided',
  source:official?('https://prequel.chillyroom.com/et/class/'+({
    'Dreadknight':2,'Dark Ranger':3,'Astral Mage':4,'Necromancer':5
  }[name])):historical?source.legacy:current?source.tier:
   tentative?source.oldPairings:conflict?source.legacy:source.user,
  unresolved:conflict?Object.freeze([
   {base:['Aegis','Tempest Mage'],source:source.legacy},
   {base:['Herbalist','Tempest Mage'],source:source.tier}
  ]):null,
  submittedPair:name==='Necromancer'?['Pyromancer','Voidfarer']:
   name==='Paragon'?['Warrior','Lightbringer']:
   name==='Wildwalker'?['Thief','Herbalist']:
   name==='Stormwarden'?['Warrior','Tempest Mage']:null,
  verifiedEffect:false});
});
const direct=[
 ['Tempest Archer','2026-02','Cung thủ chuyên kỹ năng gió/bão',source.tempestArcher,'secondary-patch'],
 ['Hellion','2026-04','Cơ chế tự gây hại, tấn công Dark',source.hellion,'developer-update'],
 ['Nyxen','2026-07','Kỹ năng Moonsear, Lumine Flux và đòn thủy triều',source.nyxen,'developer-update'],
 ['Astreon','2026-09','Kỹ năng xoay quanh Stellene và tinh tú',source.astreon,'developer-hotfix']
].map(([name,release,style,url,grade])=>Object.freeze({name,kind:'direct',
  release,style,base:[],source:url,grade,verifiedEffect:false}));
const all=Object.freeze([...basics,...combined,...direct]);
const aliases=Object.freeze({
 'lightbinder':'Lightbringer','pyroshot':'Artillerist',
 'dread knight':'Dreadknight','dreadknight':'Dreadknight',
 'farstrider':'Farstrider','fastrider':'Farstrider','windwalker':'Wildwalker',
 'soul keeper':'Soulkeeper','tempest archer':'Tempest Archer'
});
const norm=x=>String(x??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
 .replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const identified=q=>{
 const n=norm(String(q||'').slice(0,850)),p=' '+n+' ';
 const hits=[];
 for(const r of all){
  if(p.includes(' '+norm(r.name)+' '))hits.push(r);
 }
 for(const [alias,canonical] of Object.entries(aliases)){
  if(p.includes(' '+alias+' ')){
   const match=all.find(r=>r.name===canonical);
   if(match&&!hits.includes(match))hits.push(match);
  }
 }
 return hits.slice(0,4);
};
function explain(r){
 if(!r)return null;
 const type=r.kind==='basic'?'Cơ bản':r.kind==='combined'?'Kết hợp':'Độc lập';
 let description=r.name+' — '+type+'. '+r.style+'.';
 if(r.kind==='combined')description+='\nGhép lớp: '+
   (r.base.length?r.base.join(' + '):'đang có nguồn mâu thuẫn, chưa xác nhận')+'.';
 if(r.grade==='conflicting-sources')
  description+='\nDữ liệu mâu thuẫn: một nguồn cũ ghi Aegis + Tempest Mage, nguồn tổng hợp 2026 ghi Herbalist + Tempest Mage. Chưa chốt công thức.';
 if(r.submittedPair&&r.base.length&&
    r.submittedPair.join('|')!==r.base.join('|'))
  description+='\nBảng được cung cấp ghi '+r.submittedPair.join(' + ')+
  '; nguồn đối chiếu hiện có ghi '+r.base.join(' + ')+'.';
 description+='\nĐộ tin cậy: '+({
  'developer-page':'có trang class chính thức','developer-update':'có thông báo nhà phát triển',
  'developer-hotfix':'có hotfix nhà phát triển','secondary-patch':'ghi chú phiên bản',
  'secondary-current':'nguồn tổng hợp cập nhật 2026','legacy-correlated':'wiki game các mùa cũ',
  'community-historical':'danh mục cộng đồng lịch sử','conflicting-sources':'đang mâu thuẫn',
  'user-provided':'người chơi cung cấp, chưa xác minh'
 }[r.grade]||'chưa rõ')+'.';
 return {text:description+'\nNguồn: '+r.source+
   '\nChưa đủ dữ liệu để kết luận chỉ số và build SS9 hiện hành.',kind:'mechanics',focus:'game'};
}
const listingPattern=/(?:cac class|tat ca class|class nao|danh sach class|bao nhieu class|so luong class|class trong game|lop nhan vat|lop doc lap|class co ban|class ket hop|direct classes|basic classes|combined classes)/;
function answer(input){
 const q=norm(input);
 if(listingPattern.test(q)){
  return {text:'Danh mục tra cứu SS9 hiện gồm '+basics.length+' tên cơ bản, '+
    combined.length+' tên kết hợp và '+direct.length+' tên độc lập (tổng '+all.length+
    ' mục). Danh mục người chơi cung cấp và nguồn công khai đã đối chiếu có thể chưa hoàn chỉnh, không phải xác nhận đầy đủ từ Codex SS9.'+
    '\nĐộc lập có Tempest Archer, Hellion, Nyxen, Astreon.'+
    '\nBa công thức được ghi khác với bản bệ hạ cung cấp là Necromancer, Paragon, Wildwalker; Stormwarden vẫn cần xác minh nguồn mâu thuẫn.'+
    '\nHỏi tên class cụ thể để xem công thức, nguồn và độ tin cậy.',
   kind:'mechanics',focus:'game'};
 }
 const matches=identified(input);
 return matches.length?explain(matches[0]):null;
}
return {basics:Object.freeze(basics),combined:Object.freeze(combined),
 direct:Object.freeze(direct),all,identified,answer,explain,norm,source};
});
