import {readEstuarySnapshot,stepEstuaryCommandBuffer} from './wasm-bridge.js';
import {boons,enemies,equipment} from './catalog.js';
export function checkEstuaryBoot(core){
 const assert=(ok,label)=>{if(!ok)throw Error(label);};
 const baseline=readEstuarySnapshot(core);
 assert(boons.length===12 && enemies.length===7 && equipment.length===3,'Content references');
 stepEstuaryCommandBuffer(core,[[5],[0,0,1],[0,1,1],[0,2,1]]);
 const filled=readEstuarySnapshot(core);
 assert([32,38,44].every(i=>filled[i]>0),'Fill routes');
 const drained=stepEstuaryCommandBuffer(core,[[0,0,2],[0,1,2],[0,2,2]]);
 assert([32,38,44].every(i=>drained[i]<filled[i]),'Drain routes');
 for(const s of [baseline,filled,drained])assert(s[24]+s[32]+s[38]+s[44]===60000,'City balance');
 assert(core.api.step(core.tick,0)===0,'Duplicate tick');
 core.api.init(core.seed);core.tick=0;
 assert(readEstuarySnapshot(core).every((v,i)=>v===baseline[i]),'Seed reset');
 return ['CITY BALANCE / READY','ROUTES + ABI / READY','CONTENT + SEED / READY','SOUND / READY ON GESTURE'];
}
