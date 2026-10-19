/* Curated SS9 mechanic evidence graph.
 * Source = developer-authored patch descriptions, NOT observed fight telemetry.
 * Patch numbers apply only to named ranks/scopes at the listed date.
 * No global DPS, invisible procs, OCR equipment certainty, or network calls.
 */
(function(root,factory){
 const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SocratesEvidenceGraph=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const sources=Object.freeze({
 transition:{url:'https://prequel.chillyroom.com/et/article/base/344',date:'2026-09-15',grade:'official-season-transition'},
 updates:{url:'https://prequel.chillyroom.com/et/article/base/358',date:'2026-09-24',grade:'official-hotfix'},
 artillerist:{url:'https://prequel.chillyroom.com/et/article/base/239',date:'2025-11-21',grade:'official-older-season'},
 wiki:{url:'https://soulknightprequel.wiki.gg/wiki/Fatebound_Nodes',date:null,grade:'community-legacy'},
 community:{url:'https://www.reddit.com/r/SoulKnightPrequel/comments/1ww0her/extra_skill_points_quick_tutorial_101_ss9/',date:'2026-10-02',grade:'community-observation'}
});
const row=(id,owner,item,skill,trigger,effect,ref,details={})=>Object.freeze({
 id,season:ref==='artillerist'?'SS5-background':'SS9-reference',
 owner,item,skill,trigger,effect,source:ref,sourceDate:sources[ref].date,
 claimLevel:ref==='updates'?'developer-reported-fix':ref==='community'?'community-unverified':'developer-described',
 scope:details.scope||'named-skill-only',numbers:details.numbers||null,
 requiresTest:details.requiresTest||'Compare one changed condition on the same target and skill; record hit count and duration.',
 validatedDamageFormula:false});
const relations=Object.freeze([
row('artillerist-bombadier','Artillerist','Bomb Voyage! - Bombadier','Bomb Voyage!',
 'Consumes Embers and restores HP','AoE Total DMG bonus; stacking up to 10 times; each stack lasts 10s','transition',{scope:'Ember consumption, specialization ranks 1-5',numbers:'15/22.5/30/37.5/45% AoE Total DMG per listed rank'}),
row('artillerist-cloudburst','Artillerist','Cloudburst Polybolos','Rain of Arrows: Geddon',
 'Damage-over-time effects already exist','Single event derived from accumulated DoT; not a global bonus','transition',{scope:'single damage event derived from all DoT',numbers:'400% of all DoT in transition notice'}),
row('artillerist-karmic','Artillerist','Karmic Cinderpult','Adhesive Gunpowder',
 'Heatwave from Bomb Voyage! has scorched the target',
 'Target takes enhanced Total DMG from Adhesive Gunpowder only','transition',
 {scope:'target affected by specific heatwave and one skill',numbers:'350%→360% in 2026-09-15 transition; check live game/latest hotfix'}),
row('warliege-bounding','Warliege','Bounding Shield - Oscillation','Bounding Shield',
 'Attempts to trigger Calamitous Multishot','Interaction prohibited after SS9 adjustment','transition',
 {scope:'explicit non-trigger relationship'}),
row('warliege-enswathe','Warliege','Colossal Might - Enswathe','Colossal Might',
 'Consuming Battlelust while Colossal Might is active',
 'AoE Total DMG buff may stack five times; each stack lasts 3s','transition',
 {scope:'Battlelust consumption only',numbers:'AoE Total DMG +60% at listed specialization'}),
row('warliege-lethean','Warliege','Lethean Knell','Warcry',
 'Mana is consumed by Warcry','Skill-specific Total DMG increase per mana consumed, capped','transition',
 {scope:'Warcry consumed mana only',numbers:'max mana consumption 20; +20% per point (transition notice)'}),
row('tempest-poised','Tempest Archer','Poised','Projectiles',
 'Gain Poised stacks through its stated gameplay',
 'Each stack grants Projectile Total DMG; loses one stack every 5s in combat','transition',
 {scope:'projectile damage / Poised only',numbers:'up to 3 stacks, +5% Projectile Total DMG per stack'}),
row('stormwarden-frostwrath','Stormwarden','Frostwrath','Thundersledge',
 'Frost Essence is held','Total DMG increase of Thundersledge at max tier','transition',
 {scope:'Frost Essence + Thundersledge, max Legendary tier',numbers:'15%→24%'}),
row('wildwalker-golden','Wildwalker','Golden Resonance','Leafstorm',
 'Picks up a Lifesprig','Chance to generate Toxic Bloom damage event','transition',
 {scope:'Leafstorm triggered on Lifesprig pickup, not all skills',numbers:'Toxic Bloom instance Total DMG 100%→88%'}),
row('hellion-tarta-disappointment','Hellion',"Tarta's Disappointment",'Hellscream',
 'Four-piece set; shriek consumes Brand','Bonus damage per Brand stack from Hellscream','transition',
 {scope:'4-piece, Brand stack consumption',numbers:'200%→300% of Hellscream per Brand'}),
row('astral-charred','Astral Mage','Charred Aperture','Excantation: Iridescence',
 'Legendary effect tied to Iridescence','Total DMG increase for Iridescence','transition',
 {scope:'Iridescence only, max Legendary tier',numbers:'85%→88% in 2026-09-15 transition; verify live Codex'}),
row('artillerist-build-reference','Artillerist','Bomb Voyage! build','Adhesive Gunpowder',
 'Choose Bomb Voyage! as main damaging skill','Adhesive Gunpowder serves as support damage amplifier','artillerist',
 {scope:'SS5 official build explanation, not SS9 balance numbers'}),
row('pyroknight-colossus-cd','Pyroknight','Searing Colossus','Searing Colossus',
 'Using the skill','Cooldown starts immediately when cast after 2026-09-18 optimization','updates',
 {scope:'cooldown start event, not damage amount'}),
row('assassin-galeflash-cd','Assassin','Gale Flash','Gale Flash',
 'Consumes one Battlelust stack','Cooldown reset works after 2026-09-20 bug fix','updates',
 {scope:'on Battlelust consumption / reset event'}),
row('astreon-smartcast','Astreon','Amaranthine Starsigil','Amaranthine Starsigil',
 'Use Smartcast','Effulgence, Momentum and Noesis specs correctly trigger after 2026-09-21 fix','updates',
 {scope:'named specializations in Smartcast'}),
row('astreon-syzygial','Astreon','Syzygial Passage','Amaranthine Starsigil',
 'Use Smartcast','Named Legendary interaction fixed in 2026-09-20 notes','updates',
 {scope:'specific item trigger in Smartcast'}),
row('nyxen-moonsear','Nyxen','The Orrery','Moonsear',
 'Lumine Flux stacks and Moonsear action','Lumine Flux now has an expanded stack cap; each stack affects AoE Total DMG','transition',
 {scope:'Moonsear and Lumine Flux; original stack-clear rule unchanged',numbers:'The Orrery 310%→320%; Lumine Flux cap +2→+5 stacks; AoE Total DMG +5% per stack'}),
row('nyxen-vortex','Nyxen',"Nyax's Embrace 4pc",'Reventide / Tidesurge',
 'Tidesurge generates a Vortex after the 4-piece change','Vortex is DoT-type damage with repeated ticks; not one instantaneous hit','transition',
 {scope:'Nyax Embrace 4pc, Tidesurge-created Vortex',numbers:'Vortex 65% of Tidesurge every 0.5s for 4s; Tidesurge 320%→140%'}),
row('ranger-razorward','Ranger','Razorward - Gyral','Razorward',
 'Blades dwell 1s before return','Slash damage occurs repeatedly in a 2m area; event timing must be preserved','transition',
 {scope:'Razorward-Gyral blade Slash events',numbers:'one hit every 0.25s after 1s dwell; Slash direct damage ratio changed'}),
row('warliege-iron','Warliege','Iron Maidenfan','Whirlwind Slash',
 'Whirlwind Slash equipped with its named Insane weapon',
 'Affects only Whirlwind Slash Total DMG increase','transition',
 {scope:'max-tier named Legendary effect / Whirlwind Slash',numbers:'180%→200%'}),
row('fatebound-multishot','All classes','Multishot','Projectiles',
 'Matching Fatebound tier and projectile-skill eligibility',
 'Changes projectile count and per-hit Total DMG; Calamitous variant replaces extra shots with one Grievous Strike','transition',
 {scope:'tier 1/2/3 and special Calamitous transformation; never auto-multiply by hit count',
 numbers:'count +1/+1/+2; Total DMG -35/-25/-40% depending on tier'}),
row('fatebound-onslaught','All classes','Onslaught','Damage-over-time skills',
 'DoT effect exists','Changes only DoT-related damage effect as listed for the tier','transition',
 {scope:'Fatebound tier 1/2/3, damage-over-time only',numbers:'DoT +10/+25/+50%'}),
row('fatebound-deadly-tempo','All classes','Deadly Tempo','Rage',
 'Critical strike with minimum trigger interval; using a skill consumes all accumulated Rage',
 'Temporary skill damage increase for 2s, with rank-dependent Rage cap','transition',
 {scope:'crit→Rage→next skill; not all damage or permanent buff',
 numbers:'Rage +1 per crit, 0.1/0.08/0.05s interval; cap 8/10/10; +3/+5/+10% Skill DMG per consumed Rage for 2s'}),
row('fatebound-legacy','All classes','Fatebound Nodes','Fatebounds',
 'Older wiki describes 2- and 3-piece nodes','Historical reference, must verify against SS9 Fatestones and current Codex','wiki',
 {scope:'LEGACY_ONLY; never treat set thresholds as current SS9',numbers:null}),
row('celesturgic-ss9-community','All classes',"Wei Martial's Lash / Wu Emperor's Axe / Martyr-Emperor Zhaolie's Banner",'Skill levels',
 'Community post claims gear-slot-specific Celesturgic bonuses','Claimed Attack/Passive/Support skill level boosts; requires in-game confirmation','community',
 {scope:'weapon / armor / accessories respectively; unverified community claims'})
]);
const normalize=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d')
 .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const mention=(text,name)=>{
 const n=normalize(name);
 if(n.length<6)return false;
 return (' '+normalize(text)+' ').includes(' '+n+' ');
};
function find(input,{allowLegacy=false,includeCommunity=false}={}){
 const q=String(input??'').slice(0,1200);
 const matched=relations.filter(r=>{
  if(r.source==='wiki'&&!allowLegacy)return false;
  if(r.source==='community'&&!includeCommunity)return false;
  return r.item.split(/\s+\/\s+/).some(name=>mention(q,name))||mention(q,r.skill)||
   // Avoid finding a whole class merely from class name; precision matters.
   (r.id==='artillerist-build-reference'&&mention(q,'Bomb Voyage! build'));
 });
 return matched.slice(0,5);
}
function explain(input,options={}){
 const matched=find(input,options);
 if(!matched.length)return null;
 const ordered=matched.filter(x=>x.source==='transition'||x.source==='updates');
 const result=(ordered.length?ordered:matched)[0],src=sources[result.source];
 const text=[
  result.owner+' · '+result.item+' → '+result.skill+'.',
  'Điều kiện: '+result.trigger+'.',
  'Phạm vi hiệu ứng: '+result.effect+'.',
  result.numbers?'Thông số được công bố tại thời điểm nguồn: '+result.numbers+'.':'Không có hệ số sát thương đủ căn cứ trong nguồn này.',
  'Nguồn: '+src.grade+', '+(src.date||'chưa xác định ngày')+'.',
  'Đây là quan hệ được mô tả, CHƯA phải công thức DPS kiểm chứng trong game.',
  'Kiểm tra tiếp: '+result.requiresTest
 ].join('\n');
 return {text:text.slice(0,1300),kind:'mechanics',focus:'game',sourceUrl:src.url,
  confidence:result.claimLevel,scope:result.scope,id:result.id,empiricalValidated:false};
}
return {sources,relations,find,explain,normalize};
});
