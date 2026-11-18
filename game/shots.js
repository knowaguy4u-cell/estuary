import {stepEstuaryCommandBuffer} from './wasm-bridge.js';
import {readBasinCrowdSnapshot} from './snapshot-reader.js';
// Reproducible command policy, also used by the verification harness. No state writes.
export function voyageCommands(s){
 const c=[];
 if(s.state===0)c.push([5]);
 if(s.state===2)c.push([4,s.offers.reduce((a,b)=>s.ranks[a]<=s.ranks[b]?a:b)]);
 if(s.state===3)c.push([5]);
 if(s.state===1 || s.state===3){
  for(let i=0;i<9;i++){if(!s.machines[i].hp && s.scrap>=45)c.push([1,i,2]);else if(s.machines[i].hp && !s.machines[i].tier && s.scrap>=50)c.push([2,i]);}
  for(let i=0;i<3;i++)if(s.basins[i].gate!==0)c.push([0,i,0]);
  if(s.integrity<90 && s.scrap>=25 && s.tick%120===0)c.push([3]);
 }
 return c;
}
export function replayFixture(core,scene){
 let s=readBasinCrowdSnapshot(new Uint32Array(core.api.memory.buffer,core.api.snapshot_ptr(),4096).slice());
 if(scene==='title')return s;
 for(let i=0;i<3000000;i++){
  if(scene==='boon' && s.state===2 && s.wave===5)return s;
  if(scene==='boss' && s.wave===18 && s.boss>0 && s.boss*100/s.bossMax<=58)return s;
  if(s.state===4 || s.state===5){if(s.state===5)throw Error(`Fixture replay lost at wave ${s.wave}`);return s;}
  const commands=voyageCommands(s);
  if(scene==='boss' && s.wave===18){
   for(let i=commands.length-1;i>=0;i--)if(commands[i][0]===0)commands.splice(i,1);
   if(s.age===1)commands.push([0,0,1],[0,1,1],[0,2,1]);
   if(s.age===95)commands.push([0,2,0]);
   if(s.age===280)commands.push([0,1,0]);
   if(s.age===600)commands.push([0,1,2]);
  }
  s=readBasinCrowdSnapshot(stepEstuaryCommandBuffer(core,commands));
 }
 throw Error('Fixture replay exceeded tick budget');
}
