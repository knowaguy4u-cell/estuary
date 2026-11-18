import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createEstuaryCore,stepEstuaryCommandBuffer as step,readEstuarySnapshot} from '../game/wasm-bridge.js';
import {readBasinCrowdSnapshot as read} from '../game/snapshot-reader.js';
import {voyageCommands,replayFixture} from '../game/shots.js';
import {checkEstuaryBoot} from '../game/boot.js';
const bytes=readFileSync(new URL('../game/vendor/estuary-core.wasm',import.meta.url));
const create=()=>createEstuaryCore(41,bytes);
const lines=[];function log(s){lines.push(s);console.log(s);}
const core=await create();log(JSON.stringify(checkEstuaryBoot(core)));
let s=read(readEstuarySnapshot(core)),offers=0,last=0,ledger=[],hashes=[];
for(let n=0;n<300000;n++){
 const commands=voyageCommands(s);if(commands.length)ledger.push({tick:core.tick+1,commands});
 s=read(step(core,commands));assert.equal(s.sea+s.basins.reduce((a,b)=>a+b.depth,0),60000);assert(s.enemies.length<=400);assert.equal(s.overflow,0);
 assert(s.pressure<=s.cap);if(s.state===2&&last!==2){assert.equal(new Set(s.offers).size,3);assert(s.offers.every(i=>s.ranks[i]<3));offers++;}
 if(s.tick%1000===0)hashes.push(core.api.state_hash());last=s.state;if(s.state>=4)break;
}
assert.equal(s.state,4);assert.equal(s.wave,18);assert.equal(offers,17);assert.equal(s.choices,17);
log(`WIN: ticks=${s.tick}, score=${s.score}, integrity=${s.integrity}, kills=${s.kills}, salvage=${s.recovered}, offers=${offers}, hash=${core.api.state_hash()}`);
const finalHash=core.api.state_hash(),finalTick=s.tick;
core.api.init(41);core.tick=0;let cursor=0,repeated=[];
for(let t=1;t<=finalTick;t++){const commands=ledger[cursor]?.tick===t?ledger[cursor++].commands:[];step(core,commands);if(t%1000===0)repeated.push(core.api.state_hash());}
assert.deepEqual(repeated,hashes);assert.equal(core.api.state_hash(),finalHash);log(`DETERMINISM: replayed ${ledger.length} command batches, ${hashes.length} intermediate hashes + final hash all identical; same-instance init reset also equivalent`);
const loss=await create();s=read(step(loss,[[5]]));for(let n=0;n<100000&&s.state!==5;n++){s=read(step(loss,s.state===2?[[4,s.offers[0]]]:s.state===3?[[5]]:[]));}
assert.equal(s.state,5);assert.equal(s.integrity,0);log(`LOSS: wave=${s.wave}, tick=${s.tick}, integrity=0`);
const frozen=await create();let f=read(step(frozen));for(let i=0;i<100;i++)step(frozen);let f2=read(readEstuarySnapshot(frozen));assert.equal(f2.age,0);assert.equal(f2.scrap,f.scrap);assert.deepEqual(f2.basins,f.basins);log('PAUSE/READY: 100 idle ticks leave rules, resources and water unchanged');
const tick=frozen.tick,hash=frozen.api.state_hash();assert.equal(frozen.api.step(tick,0),0);assert.equal(frozen.api.state_hash(),hash);log('ABI: duplicate tick rejected atomically');
for(let choice=0;choice<3;choice++){const c=await create();s=replayFixture(c,'boon');const id=s.offers[choice],rank=s.ranks[id];s=read(step(c,[[4,id]]));assert.equal(s.ranks[id],rank+1);assert.equal(s.state,3);}log('CHOICES: all three buttons apply one rank and enter harbor break');
const invalid=await create();let buffer=new Uint32Array(invalid.api.memory.buffer,invalid.api.command_ptr(),96);buffer.set([5,0,0,8,0,0]);const before=invalid.api.state_hash();assert.equal(invalid.api.step(1,2),0);assert.equal(invalid.api.state_hash(),before);log('ABI: invalid mixed command batch rejected atomically');
const choiceCore=await create();let choiceState=replayFixture(choiceCore,'boon');for(let n=0;n<120;n++)step(choiceCore);const afterChoice=read(readEstuarySnapshot(choiceCore));assert.equal(afterChoice.age,choiceState.age);assert.deepEqual(afterChoice.basins,choiceState.basins);assert.equal(afterChoice.pressure,choiceState.pressure);log('CHOICE FREEZE: 120 ticks preserve water, combat age and Pressure');
const fixtures={};for(const scene of ['title','boon','boss','victory']){const c=await create();const a=replayFixture(c,scene);fixtures[scene]={tick:a.tick,wave:a.wave,state:a.state,score:a.score,scrap:a.scrap,pressure:a.pressure,integrity:a.integrity,boss:a.boss,bossMax:a.bossMax,active:a.enemies.length,depth:a.basins.map(b=>b.depth),offers:a.offers,hash:c.api.state_hash()};log(`FIXTURE ${scene}: ${JSON.stringify(fixtures[scene])}`);}
writeFileSync(new URL('../../estuary-verification.txt',import.meta.url),lines.join('\n')+'\n');
writeFileSync(new URL('../../estuary-fixtures.json',import.meta.url),JSON.stringify(fixtures,null,2));
