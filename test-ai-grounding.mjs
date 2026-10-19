import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildEvidence,metadata,groundingNote} from './gateway/game-context.mjs';
import {makeHandler} from './gateway/handler.mjs';
const graph=readFileSync(new URL('./ss9-evidence-graph.js',import.meta.url),'utf8');
const gatewayGraph=readFileSync(new URL('./gateway/ss9-evidence-graph.cjs',import.meta.url),'utf8');
assert.equal(gatewayGraph,graph,'Private server graph must equal the public source-of-truth graph');
const webClasses=readFileSync(new URL('./class-catalog.js',import.meta.url),'utf8');
const serverClasses=readFileSync(new URL('./gateway/class-catalog.cjs',import.meta.url),'utf8');
assert.equal(serverClasses,webClasses,'Private AI class data must match the public official catalogue');
const webRoster=readFileSync(new URL('./ss9-class-roster.js',import.meta.url),'utf8');
const gatewayRoster=readFileSync(new URL('./gateway/ss9-class-roster.cjs',import.meta.url),'utf8');
assert.equal(gatewayRoster,webRoster,'Candidate 39-class roster must be synchronized byte-for-byte');
const clientClassBuild=readFileSync(new URL('./class-build-knowledge.js',import.meta.url),'utf8');
const gatewayClassBuild=readFileSync(new URL('./gateway/class-build-knowledge.cjs',import.meta.url),'utf8');
assert.equal(gatewayClassBuild,clientClassBuild,'Class build graph must be byte-identical in Web and private gateway');
const shieldSpec=buildEvidence('Shield Blitz + Skyfall và Concuss');
assert.equal(shieldSpec.skillBuildFacts.className,'Aegis');
assert.ok(shieldSpec.skillBuildFacts.specializations.some(x=>x.name==='Skyfall'));
assert.ok(shieldSpec.sources.some(x=>x.url==='https://prequel.chillyroom.com/et/article/base/133'));
assert.equal(shieldSpec.skillBuildFacts.completeSS9Tree,false);
const buildArt=buildEvidence('build Artillerist');
assert.equal(buildArt.skillBuildFacts.className,'Artillerist');
assert.ok(buildArt.skillBuildFacts.mechanics.some(x=>x.item==='Karmic Cinderpult'));
const classNeverComplete=buildEvidence('build Druid');
assert.equal(classNeverComplete.skillBuildFacts.completeSS9Tree,false);
assert.equal(classNeverComplete.skillBuildFacts.officialProfile,null);

const necro=buildEvidence('Necromancer');
assert.equal(necro.classFacts[0].name,'Necromancer');
assert.deepEqual(necro.classFacts[0].base,['Voidfarer','Animancer']);
const paragon=buildEvidence('Paragon');
assert.equal(paragon.rosterFacts[0].name,'Paragon');
assert.deepEqual(paragon.rosterFacts[0].base,['Aegis','Lightbringer']);
assert.ok(paragon.warnings.some(x=>x.includes('nguồn thứ cấp')));
const stormwarden=buildEvidence('Stormwarden');
assert.equal(stormwarden.rosterFacts[0].grade,'conflicting-sources');
assert.deepEqual(stormwarden.rosterFacts[0].base,[]);
assert.ok(stormwarden.warnings.some(x=>x.includes('mâu thuẫn')));
const nyxen=buildEvidence('Nyxen');
assert.equal(nyxen.rosterFacts[0].kind,'direct');
const list=buildEvidence('bao nhiêu class trong game?');
assert.equal(list.rosterOverview.basic.length,10);
assert.equal(list.rosterOverview.combined.length,25);
assert.equal(list.rosterOverview.direct.length,4);
assert.equal(list.rosterOverview.officialComplete,false);

const classEvidence=buildEvidence('Dark Ranger: Nightpiercer');
assert.ok(classEvidence.classFacts.some(x=>x.name==='Dark Ranger'));
assert.ok(classEvidence.classFacts.some(x=>x.base.join(' + ')==='Voidfarer + Archer'));
assert.ok(classEvidence.sources.some(x=>x.url==='https://prequel.chillyroom.com/et/class/3'));
assert.ok(classEvidence.warnings.some(x=>x.includes('không chứng minh hệ số SS9')));
const skillEvidence=buildEvidence('Excantation: Stellachroma');
assert.equal(skillEvidence.classFacts[0].name,'Astral Mage');

const k=buildEvidence('Karmic Cinderpult kích hoạt ra sao?');
assert.ok(k.sources.length>=2);
assert.ok(k.facts.some(x=>x.id==='artillerist-karmic'));
assert.ok(k.updates.some(x=>x.claim.includes('480%')));
assert.ok(k.facts.some(x=>x.figuresAtSourceDate.includes('360%')));
assert.ok(k.sources.some(x=>x.date==='2026-09-15'));
assert.ok(k.sources.some(x=>x.date==='2026-10-16'&&x.grade==='provisional'));
assert.ok(k.warnings.some(x=>x.includes('KHÔNG coi')));
assert.ok(k.warnings.some(x=>x.includes('Không cộng')));
assert.equal(k.facts[0].verifiedDamageFormula,false);
assert.match(groundingNote(k),/Chưa xác minh/);
assert.ok(!JSON.stringify(metadata(k)).includes('480%'),'Public evidence metadata must be concise');
const legacy=buildEvidence('Fatebound Nodes');
assert.equal(legacy.sources.length,0,'Legacy community wiki is disabled');
const community=buildEvidence("Wei Martial's Lash");
assert.equal(community.sources.length,0,'Unverified community-only data is not a model citation');
assert.equal(buildEvidence('Chào bạn có khỏe không?').sources.length,0);
assert.equal(buildEvidence('Cảm ơn nhiều!').sources.length,0);
assert.equal(buildEvidence('Karmic Cinderpult','history not array').sources.length>=2,true);
const follow=buildEvidence('Nên chọn món nào?',[
 {role:'assistant',text:'Charred Aperture'},
 {role:'user',text:'Karmic Cinderpult là đồ tôi đang hỏi'}
]);
assert.equal(follow.retrieval,'explicit-user-history');
assert.ok(follow.facts.some(x=>x.id==='artillerist-karmic'));
const ignoreAssist=buildEvidence('Nên chọn món nào?',[
 {role:'assistant',text:'Karmic Cinderpult'}
]);
assert.equal(ignoreAssist.retrieval,'none');
const noBacktrack=buildEvidence('Xin chào',[{role:'user',text:'Karmic Cinderpult'}]);
assert.equal(noBacktrack.retrieval,'none');
const origin='https://hoaianhdoan0209-hue.github.io';
let seen=null,calls=0;
const fake=async(url,init)=>{
 calls++;
 const j=JSON.parse(init.body);
 seen={url,system:j.systemInstruction.parts[0].text,body:JSON.parse(j.contents[0].parts[0].text)};
 return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Karmic Cinderpult có điều kiện cokerize; chưa có số đo.'}]}}]})};
};
const h=makeHandler({GEMINI_API_KEY:'fake-key',LINH_ACCESS_TOKEN:'long-enough-token',LINH_ALLOWED_ORIGIN:origin},fake);
const post=(data)=>h(new Request('https://my-gateway.example/chat',{
 method:'POST',
 headers:{origin,'content-type':'application/json','x-linh-access':'long-enough-token'},
 body:JSON.stringify({version:1,gameName:'Soul Knight Prequel',...data})
}));
let res=await post({question:'Karmic Cinderpult gây sát thương thế nào?'});
assert.equal(res.status,200);
let body=await res.json();
assert.match(body.reply,/cokerize/);
assert.match(body.reply,/Đối chiếu dữ liệu game/);
assert.equal(body.evidence.season,'SS9');
assert.ok(body.evidence.sources.some(x=>x.id==='artillerist-karmic'));
assert.ok(seen.body.groundedGameEvidence.facts.some(x=>x.id==='artillerist-karmic'));
assert.ok(seen.system.includes('phần trăm'));
assert.equal(calls,1);
res=await post({question:'Shield Blitz có Skyfall và Concuss thì sao?'});
body=await res.json();
assert.ok(seen.body.groundedGameEvidence.skillBuildFacts?.specializations.some(x=>x.name==='Skyfall'));
assert.ok(body.evidence.sources.some(x=>x.url==='https://prequel.chillyroom.com/et/article/base/133'));

res=await post({question:'Nightpiercer là kỹ năng class nào?'});
body=await res.json();
assert.ok(body.evidence.sources.some(x=>x.url==='https://prequel.chillyroom.com/et/class/3'));
assert.ok(seen.body.groundedGameEvidence.classFacts[0].active.includes('Nightpiercer'));

res=await post({question:'Xin chào, bạn có khỏe không?'});
body=await res.json();
assert.equal(body.evidence.retrieval,'none');
assert.equal(seen.body.groundedGameEvidence,undefined);
res=await post({question:'Nên chọn món nào?',history:[{role:'user',text:'Karmic Cinderpult'}]});
body=await res.json();
assert.equal(body.evidence.retrieval,'explicit-user-history');
assert.ok(seen.body.groundedGameEvidence?.facts?.length);
const outsider=makeHandler({GEMINI_API_KEY:'fake-key',LINH_ACCESS_TOKEN:'long-enough-token',LINH_ALLOWED_ORIGIN:origin},fake);
const nonGame=await outsider(new Request('https://my-gateway.example/chat',{
 method:'POST',headers:{origin,'content-type':'application/json','x-linh-access':'long-enough-token'},
 body:JSON.stringify({version:1,gameName:'Chess',question:'Karmic Cinderpult'})
}));
assert.equal(nonGame.status,200);
assert.equal(seen.body.groundedGameEvidence,undefined);
assert.ok(!JSON.stringify((await nonGame.json()).evidence).includes('360%'));
console.log('PASS: 25 synced SS9 graph records, grounded retrieval, patch conflicts, one-hop real model injection and no stale/off-game citations');
