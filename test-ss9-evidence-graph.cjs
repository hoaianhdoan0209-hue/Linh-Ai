'use strict';
const assert=require('node:assert/strict');
const G=require('./ss9-evidence-graph.js');
assert.equal(G.relations.length,18);
assert.equal(new Set(G.relations.map(x=>x.id)).size,G.relations.length);
for(const row of G.relations){
 assert.equal(row.validatedDamageFormula,false,row.id);
 assert.ok(G.sources[row.source]?.url.startsWith('https://'),row.id);
 assert.ok(['SS9-reference','SS5-background'].includes(row.season));
 assert.ok(row.trigger.length>12&&row.scope.length>10&&row.effect.length>12);
}
let k=G.find('Karmic Cinderpult');
assert.equal(k[0].id,'artillerist-karmic');
assert.equal(k[0].sourceDate,'2026-09-15');
assert.match(k[0].numbers,/360%/);
assert.doesNotMatch(k[0].effect,/global DPS/i);
assert.match(G.explain('Karmic Cinderpult').text,/CHƯA phải công thức DPS/);
assert.equal(G.explain('Karmic Cinderpult').empiricalValidated,false);
assert.equal(G.explain('Karmic Cinderpult').confidence,'developer-described');
assert.match(G.explain('Cloudburst Polybolos').text,/400% of all DoT/);
assert.match(G.explain('Colossal Might - Enswathe').text,/Battlelust/);
assert.match(G.explain('Searing Colossus').text,/Cooldown starts immediately/);
assert.equal(G.explain('Searing Colossus').confidence,'developer-reported-fix');
assert.equal(G.find("Tarta's Commendation").length,0,
 'Do not substitute Tarta Disappointment for the separate Commendation set');
assert.equal(G.find("Tarta's Disappointment")[0].id,'hellion-tarta-disappointment');
assert.equal(G.find('Stormwarden').length,0,'Class name alone must not match');
assert.equal(G.find('Hi Socrates!').length,0);
assert.equal(G.find('Fatebound Nodes').length,0,'Pre-SS9 wiki not active by default');
assert.equal(G.find('Fatebound Nodes',{allowLegacy:true})[0].source,'wiki');
assert.equal(G.find("Wei Martial's Lash").length,0,'Community claims opt-in only');
assert.equal(G.find("Wei Martial's Lash",{includeCommunity:true})[0].source,'community');
assert.ok(!G.explain('Tôi buồn'), 'Natural language conversation should not be hijacked');
assert.match(G.explain('Syzygial Passage').text,/Smartcast/);
assert.match(G.explain('Gale Flash').text,/Battlelust/);
console.log('PASS: 18 official/community provenance-scoped skill+gear relations; old sources excluded and no fake empirical DPS');
