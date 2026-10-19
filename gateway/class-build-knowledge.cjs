/* Socrates class → skill → specialization → named gear graph.
 * Every edge is tied to an identifiable ChillyRoom notice/page.
 * This is an index of published descriptions; NOT a complete SS9 skill tree,
 * not proof a skill is equipped, and not a measured DPS calculator.
 */
(function(root,factory){
 const r=typeof module!=='undefined'&&module.exports?
 {roster:require('./ss9-class-roster.cjs'),classes:require('./class-catalog.cjs'),graph:require('./ss9-evidence-graph.cjs')}:
 {roster:root.SocratesClassRoster,classes:root.SocratesClassCatalog,graph:root.SocratesEvidenceGraph};
 const api=factory(r);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SocratesClassBuildKnowledge=api;
})(typeof globalThis!=='undefined'?globalThis:this,function({roster,classes,graph}){
'use strict';
if(!roster||!classes||!graph)throw Error('Missing Socrates source catalog');
const src=Object.freeze({
 spec:{url:'https://prequel.chillyroom.com/et/article/base/133',date:'2024-11-07',grade:'official-historical-specialization'},
 ranger:{url:'https://prequel.chillyroom.com/et/article/base/304',date:'2026-06-28',grade:'official-SS8-adjustment'},
 fix:{url:'https://prequel.chillyroom.com/et/article/base/358',date:'2026-09-21',grade:'official-SS9-hotfix'},
 patch:{url:'https://prequel.chillyroom.com/et/article/base/344',date:'2026-09-15',grade:'official-SS9-transition'}
});
const item=(id,owner,skill,name,category,condition,result,source)=>Object.freeze({
 id,owner,skill,name,category,condition,result,source:src[source].url,sourceDate:src[source].date,
 sourceGrade:src[source].grade,verifiedDamageFormula:false,scope:'named-skill-only',
 seasonScope:source==='spec'?'SS0 system explanation, verify current SS9 Codex':source==='ranger'?'SS8 text, recheck SS9 Codex':'SS9 patch/fix with dated scope'
});
const specs=Object.freeze([
 item('aegis-proficiency','Aegis','Shield Blitz','Proficiency','specialization','Equip Proficiency','Reduces base cooldown','spec'),
 item('aegis-concuss','Aegis','Shield Blitz','Concuss','specialization','Equip Concuss','Adds a chance to stun on hit','spec'),
 item('aegis-warleader','Aegis','Shield Blitz','Warleader','specialization','End of Shield Blitz dash with minions','Teleports minions to your location','spec'),
 item('aegis-redoubt','Aegis','Shield Blitz','Redoubt','specialization','Dash while holding Resolve stacks','Can block attacks and gain damage per Resolve stack','spec'),
 item('aegis-battlemaster','Aegis','Shield Blitz','Battlemaster','specialization','Shield Blitz deals damage','Chance to gain a Battlelust stack','spec'),
 item('aegis-blinkstrike','Aegis','Shield Blitz','Blinkstrike','specialization','Equip Blinkstrike','Converts skill to Light Damage; increases dash speed and shortens duration','spec'),
 item('aegis-skyfall','Aegis','Shield Blitz','Skyfall','specialization','Equip Skyfall','Leaps toward target, increases area and may cause Daze','spec'),
 item('aegis-temerity','Aegis','Shield Blitz','Temerity','specialization','Equip Temerity','Can dash without shield, moves through enemies and damages them','spec'),
 item('ranger-scattershot-exacting','Ranger','Scattershot','Exacting','specialization','Scattershot fragment generation','Fragments deal Piercing instead of Physical Extra Damage; increased damage but reduced chance to spawn','ranger'),
 item('nyxen-moonsear-ardor','Nyxen','Moonsear','Ardor','fix','Casting in Yellow Crucible','Bugged specialization behavior fixed on 2026-09-21; precise effect not described','fix'),
 item('nyxen-reventide-undulation','Nyxen','Reventide','Undulation','fix','Casting in Yellow Crucible','Bugged specialization behavior fixed on 2026-09-21; precise effect not described','fix'),
 item('astreon-starsigil-effulgence','Astreon','Amaranthine Starsigil','Effulgence','fix','Using Smartcast','Specialization should trigger after 2026-09-21 fix; effect values not described','fix'),
 item('astreon-starsigil-momentum','Astreon','Amaranthine Starsigil','Momentum','fix','Using Smartcast','Specialization should trigger after 2026-09-21 fix; effect values not described','fix'),
 item('astreon-starsigil-noesis','Astreon','Amaranthine Starsigil','Noesis','fix','Using Smartcast','Specialization should trigger after 2026-09-21 fix; effect values not described','fix'),
 item('pyroknight-matrix-ferrokinesis','Pyroknight','Fireblade Matrix','Ferrokinesis','fix','Activating Fireblade Matrix on some devices','Fix for specialization not taking effect on 2026-09-20; effect values not described','fix')
]);
const combos=Object.freeze([
 Object.freeze({owner:'Aegis',skill:'Shield Blitz',names:['Concuss','Skyfall'],
  condition:'Both specializations equipped on Shield Blitz',
  result:'Skyfall changes the charge into a leap; Concuss adds a chance to stun when the leap damages enemies',
  source:src.spec.url,sourceDate:src.spec.date,verifiedDamageFormula:false}),
 Object.freeze({owner:'Aegis',skill:'Shield Blitz',names:['Proficiency','Blinkstrike'],
  condition:'Both specializations equipped on Shield Blitz',
  result:'Proficiency reduces base cooldown while Blinkstrike converts damage to Light and adjusts dash movement',
  source:src.spec.url,sourceDate:src.spec.date,verifiedDamageFormula:false})
]);
const concordance=Object.freeze([
 ['Assassin',400],['Dark Ranger',100],['Soulkeeper',800],['Shinobi',400],
 ['Stormwarden',150],['Stormblade',800],['Stormshaman',250],['Elementalist',400]
].map(([owner,maxAwakeningPercent])=>Object.freeze({
 owner,maxAwakeningPercent,source:src.patch.url,sourceDate:src.patch.date,
 scope:'maximum Awakening-tier Class Concordance ONLY',
 empiricalValidated:false,currentTierUnknown:true
})));
const norm=roster.norm;
const exact=(str,name)=>Boolean(name)&&(' '+norm(str)+' ').includes(' '+norm(name)+' ');
const knownOwners=new Map(roster.all.map(r=>[norm(r.name),r]));
const relatedClasses=owner=>{
 const cls=knownOwners.get(norm(owner));
 if(!cls)return [owner];
 // Specializations on the base class can be inherited through a combined
 // class, but that never means those skills are actually selected.
 return [cls.name,...(cls.base||[])];
};
function coverage(){
 const mentioned=new Set([
  ...classes.rows.map(x=>norm(x.name)),
  ...graph.relations.filter(x=>['transition','updates'].includes(x.source)).map(x=>norm(x.owner)),
  ...specs.map(x=>norm(x.owner))
 ]);
 return {rosterCandidates:roster.all.length,officialClassProfiles:classes.rows.length,
  officialNamedSkills:classes.rows.reduce((n,r)=>n+r.active.length+r.passive.length,0),
  datedMechanicEdges:graph.relations.filter(x=>['transition','updates'].includes(x.source)).length,
  specializationOrFixRows:specs.length,concordanceRows:concordance.length,
  namedClassCoverage:mentioned.size,completeSS9Trees:0,empiricallyValidatedDPS:0};
}
function identify(q){
 const classesFromName=roster.identified(q);
 let cls=classesFromName[0]||null;
 const specsHit=specs.filter(x=>exact(q,x.skill)&&norm(x.skill).length>5||
   (exact(q,x.name)&&norm(x.name).length>6));
 const edges=graph.find(q).filter(x=>['transition','updates'].includes(x.source));
 let skill=null;
 for(const r of classes.rows){
  const n=[...r.active,...r.passive].find(x=>exact(q,x));
  if(n){skill={owner:r.name,name:n,kind:r.active.includes(n)?'active':'passive',source:r.source};break}
 }
 if(!cls&&(specsHit.length||edges.length||skill)){
  const owner=skill?.owner||specsHit[0]?.owner||edges[0]?.owner;
  cls=knownOwners.get(norm(owner))||null;
 }
 if(!cls)return {cls:null,skill,specs:[],edges:[],concordance:null,profile:null};
 const owners=relatedClasses(cls.name);
 const ownerMatches=x=>owners.some(c=>norm(c)===norm(x));
 const eligibleSpecs=specs.filter(x=>ownerMatches(x.owner));
 const eligibleEdges=graph.relations.filter(x=>ownerMatches(x.owner)&&
   ['transition','updates'].includes(x.source));
 const filteredSpecs=eligibleSpecs.filter(x=>exact(q,x.name)||exact(q,x.skill));
 const filteredEdges=eligibleEdges.filter(x=>exact(q,x.item)||exact(q,x.skill));
 return {cls,skill,profile:classes.rows.find(x=>norm(x.name)===norm(cls.name))||null,
  specs:filteredSpecs.length?filteredSpecs:eligibleSpecs,
  edges:filteredEdges.length?filteredEdges:eligibleEdges,
  concordance:concordance.find(x=>norm(x.owner)===norm(cls.name))||null,
  exactSkillQuery:Boolean(skill||filteredSpecs.length||filteredEdges.length),
  parentClasses:owners.slice(1)};
}
function overview(q){
 const c=coverage();
 const needed=/(?:tat ca|39|toan bo|bao nhieu|do phu|hoan thien|full).*(?:class|skill|ky nang|chuyen mon|specialization)|(?:cay ky nang|skill tree).*(?:39|tat ca|full)/.test(norm(q));
 if(!needed)return null;
 return {text:'Socrates có '+c.rosterCandidates+' tên class ứng viên, '+c.officialClassProfiles+
  ' trang hồ sơ class có '+c.officialNamedSkills+' tên kỹ năng, '+
  c.specializationOrFixRows+' quan hệ Specialization/hotfix có nguồn, '+
  c.datedMechanicEdges+' quan hệ cơ chế SS9/hotfix và '+c.concordanceRows+
  ' ghi chú Concordance tối đa cấp. Chưa có cây kỹ năng SS9 đầy đủ của class nào, cũng chưa có công thức DPS đã đo. '+
  'Nên mở một class cụ thể, chụp cây kỹ năng và tier trang bị trong Codex để xác minh từng nhánh.',
  kind:'mechanics',focus:'game',evidenceCoverage:c};
}
function answer(q){
 const all=overview(q);
 if(all)return all;
 const interest=/(?:build|ky nang|skills?|chieu|trang bi|fatebound|fatestone|combo|specialization|chuyen mon|concordance|co che|cay skill|active|passive|choi class|choi lop|thu skill|phep|tier)/;
 const detail=identify(q),{cls,profile}=detail;
 if(!cls||(!interest.test(norm(q))&&!detail.exactSkillQuery))return null;
 const explicitlyNamed=detail.specs.filter(x=>exact(q,x.name));
 const chosenSpecial=explicitlyNamed.length?explicitlyNamed:detail.specs.filter(x=>exact(q,x.skill));
 const chosenEdge=detail.edges.filter(x=>exact(q,x.item)||exact(q,x.skill));
 // A mixed-class question must never assign a class-specific skill to the
 // wrong character just because that skill name occurs in a separate source.
 const rawOffClass=graph.find(q).filter(x=>['transition','updates'].includes(x.source)&&
   !relatedClasses(cls.name).some(y=>norm(y)===norm(x.owner)));
 if(rawOffClass.length&&chosenEdge.length===0){
  return {text:'Có hai dữ kiện thuộc class khác nhau. '+cls.name+
    ' KHÔNG được chứng minh sử dụng '+rawOffClass[0].item+'/'+rawOffClass[0].skill+
    ' theo nguồn SS9. Hãy chọn một class và gửi màn hình kỹ năng của chính class đó.',
   kind:'mechanics',focus:'game',evidenceScope:'cross-class-guard'};
 }
 const askedList=/(?:cac|nhung|danh sach|liet ke|tat ca)/.test(norm(q))&&
   /(?:specialization|chuyen mon)/.test(norm(q));
 const limit=askedList?8:3;
 const chosen=chosenSpecial.length?chosenSpecial.slice(0,limit):
  detail.specs.slice(0,cls.name==='Aegis'?(askedList?8:5):2);
 const activeCombos=combos.filter(row=>
   relatedClasses(cls.name).some(owner=>norm(owner)===norm(row.owner))&&
   row.names.every(name=>exact(q,name)));
  const effects=chosenEdge.length?chosenEdge.slice(0,2):detail.edges.slice(0,2);
 let text='Hồ sơ build '+cls.name+' ['+cls.grade+']. '+cls.style+'.';
 if(profile){
  text+='\nActive đã thấy trong trang class: '+profile.active.join('; ')+'.';
  text+='\nPassive: '+profile.passive.join('; ')+'.';
 }else text+='\nChưa có cây Active/Passive hoàn chỉnh được xác thực cho lớp này.';
 if(chosen.length){
  text+='\nSpecialization/hotfix có nguồn:';
  for(const x of chosen)text+='\n• '+x.skill+' → '+x.name+
   ': '+x.result+'. Điều kiện: '+x.condition+'. ('+x.sourceDate+')';
 }
 if(activeCombos.length){
  for(const combo of activeCombos)
   text+='\nPhối hợp '+combo.names.join(' + ')+': '+combo.result+
    '. Điều kiện: '+combo.condition+' ('+combo.sourceDate+').';
 }
  if(effects.length){
  text+='\nKỹ năng ↔ trang bị/cơ chế SS9:';
  for(const x of effects)text+='\n• '+x.item+' → '+x.skill+
   ': '+x.trigger+'; '+x.effect+' ('+x.sourceDate+')';
 }
 if(detail.concordance)
  text+='\nConcordance: '+detail.concordance.maxAwakeningPercent+
   '% chỉ ở cấp Awakening tối đa theo patch '+detail.concordance.sourceDate+
   ', KHÔNG phải tổng DPS.';
 const reference=(chosen[0]?.source||effects[0]&&graph.sources[effects[0].source]?.url||
  profile?.source||cls.source);
 text+='\nNguồn để đối chiếu: '+reference+
  '\nChưa biết người chơi đã chọn skill, Specialization, tier và Fatebound nào. '+
  'Hãy gửi ảnh cây kỹ năng + trang bị ĐANG MẶC; thử một điều kiện mỗi lượt trước khi tính toán.';
 return {text:text.slice(0,2100),kind:'mechanics',focus:'game',source:reference,
  evidenceScope:'dated-source-not-measured',className:cls.name};
}
function evidence(q){
 const x=identify(q);
 if(!x.cls)return null;
 const byName=x.specs.filter(v=>exact(q,v.name));
 const chosenSpec=(byName.length?byName:x.specs.filter(v=>exact(q,v.skill))).slice(0,5);
 const chosenEdge=x.edges.filter(v=>exact(q,v.item)||exact(q,v.skill)).slice(0,3);
 if(!x.exactSkillQuery&&!/(?:build|ky nang|skill|trang bi|chuyen mon|specialization)/.test(norm(q)))return null;
 const data={
  className:x.cls.name,grade:x.cls.grade,completeSS9Tree:false,
  officialProfile:x.profile?{active:x.profile.active,passive:x.profile.passive,source:x.profile.source}:null,
  specializations:(chosenSpec.length?chosenSpec:x.specs.slice(0,3)).map(v=>({
   skill:v.skill,name:v.name,condition:v.condition,effect:v.result,
   source:v.source,sourceDate:v.sourceDate,seasonScope:v.seasonScope,
   formulaVerified:false
  })),
  mechanics:(chosenEdge.length?chosenEdge:x.edges.slice(0,2)).map(v=>({
   item:v.item,skill:v.skill,trigger:v.trigger,effect:v.effect,
   source:graph.sources[v.source]?.url,sourceDate:v.sourceDate,
   formulaVerified:false
  })),
  caveat:'Published names and trigger rules only; do NOT invent unlisted ranks, gear, skill trees or DPS.'
 };
 return data;
}
return {sources:src,specs,combos,concordance,coverage,identify,answer,evidence};
});
