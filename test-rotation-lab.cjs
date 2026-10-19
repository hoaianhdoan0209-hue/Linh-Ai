'use strict';
const assert=require('node:assert/strict');
const L=require('./rotation-lab.js');
const basic={duration:6,skills:[{id:'shot',cooldown:2,hits:[{damage:100}]}]};
let x=L.run(basic);
assert.equal(x.ok,true);
assert.equal(x.castCounts.shot,4);
assert.equal(x.totalDamage,400);
assert.equal(x.modelDps,66.67);
assert.equal(x.source,'user-parameterized-model');
assert.equal(x.officialDps,false);
const status={duration:5,skills:[
 {id:'scorch',cooldown:5,hits:[{damage:0,status:'cokerize',statusDuration:3}]},
 {id:'adhesive',cooldown:2,hits:[{damage:100}]}
 ],effects:[{id:'karmic',skill:'adhesive',status:'cokerize',factor:5.8,evidence:'assumed'}]};
x=L.compare(status);
assert.equal(x.ok,true);
assert.equal(x.baseline.totalDamage,300);
assert.equal(x.scenario.totalDamage,1260); // t=0,2 buff; t=4 unbuff: 580+580+100
assert.equal(x.scenario.conditionalHits,2);
assert.equal(x.deltaDamage,960);
assert.match(x.note,/không chứng minh công thức/);
const target={...status,targetType:'mob',effects:[{...status.effects[0],targetType:'boss'}]};
assert.equal(L.run(target).totalDamage,300,'Boss-only effect cannot apply to mobs');
const set3={...status,effects:[{...status.effects[0],setPieces:3,requiresPieces:4}]};
assert.equal(L.run(set3).totalDamage,300,'Four-piece bonus cannot activate with three');
const set4={...status,effects:[{...status.effects[0],setPieces:4,requiresPieces:4}]};
assert.equal(L.run(set4).totalDamage,1260);
const two={...status,effects:[status.effects[0],{...status.effects[0],id:'additional',factor:2}]};
x=L.run(two);
assert.equal(x.totalDamage,300,'Unknown stacking must not be applied silently');
assert.equal(x.unknownStacking,2);
assert.match(x.warnings.join(' '),/cộng\/nhân/);
const noResource={duration:4,resource:{initial:20,max:20,regen:0},skills:[
 {id:'cast',cooldown:1,cost:10,hits:[{damage:100}]}
]};
x=L.run(noResource);
assert.equal(x.totalDamage,200);
assert.equal(x.blocked.cast,1);
const regen={...noResource,resource:{initial:0,max:10,regen:5}};
x=L.run(regen);
assert.equal(x.totalDamage,200,'At t=2 and 4 only');
const delayed={duration:4,skills:[
 {id:'delayed',cooldown:3,castTime:0.5,hits:[{damage:100,delay:1}]},
 {id:'quick',cooldown:2,hits:[{damage:10}]}
]};
x=L.run(delayed);
assert.ok(x.events.some(e=>e.time===1&&e.skill==='delayed'&&e.kind==='hit'));
assert.equal(L.run({...basic,duration:0}).ok,false);
assert.equal(L.run({...basic,skills:[basic.skills[0],basic.skills[0]]}).ok,false);
assert.equal(L.run({...basic,effects:[{id:'x',skill:'shot',factor:5.8}]}).ok,false,
 'Never use an unverified effect without evidence type');
assert.equal(L.run({...basic,skills:[{id:'s',cooldown:0,hits:[]}]}).ok,false);
assert.equal(L.run({...basic,targetCount:0}).ok,false);
assert.ok(x.events.length<=40);
assert.equal(x.warnings.length,0);
console.log('PASS: event-driven rotation lab cooldown/status expiry/resource/set gates, uncertain stacking and conservative modeling');
