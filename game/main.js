import {readEstuarySnapshot,stepEstuaryCommandBuffer} from './wasm-bridge.js';
import {readBasinCrowdSnapshot} from './snapshot-reader.js';
import {restoreEstuaryBaseline} from './world-reset.js';
import {advanceFixedTideSession} from './pacing.js';
import {enforceAmbientBudget} from './ambient.js';
import {screenFor} from './states.js';
import {loadSave,storeSave} from './save.js';
import {replayFixture,voyageCommands} from './shots.js';
import {summarizeRun} from './run-ledger.js';
import {createRenderer} from './renderer.js';
import {drawPressureThreatQueue} from './hud.js';
import {renderMenu} from './menus.js';
import {bindInput} from './input.js';
import {FeedbackPool} from './effects.js';
import {HarborAudio} from './audio.js';
const params=new URLSearchParams(location.search);
const parsedSeed=Number(params.get('seed')??41);
const seed=Number.isSafeInteger(parsedSeed)&&parsedSeed>=0?parsedSeed>>>0:41;
const canvas=document.querySelector('canvas'),ui=document.querySelector('#ui'),overlay=document.querySelector('#overlay');
const app={core:null,seed,screen:'title',checks:[],save:loadSave(),pending:[],selected:0,socket:0,paused:false,blocked:true,failure:'',effects:new FeedbackPool(),result:null};
app.audio=new HarborAudio(()=>app.snapshot);
app.read=()=>readBasinCrowdSnapshot(readEstuarySnapshot(app.core));
app.refresh=()=>{ui.innerHTML=app.snapshot?drawPressureThreatQueue(app.snapshot,app):'';overlay.innerHTML=renderMenu(app);};
app.send=c=>{app.fixture=false;if(!app.blocked && app.pending.length<32)app.pending.push(c);};
app.choose=i=>{if(app.screen==='boon')app.send([4,app.snapshot.offers[i]]);};
app.pause=()=>{if(['play','break'].includes(app.screen)){app.paused=!app.paused;app.refresh();}};
app.toggleMute=()=>{app.save.mute=!app.save.mute;app.audio.configure(app.save);storeSave(app.save);app.refresh();};
app.restartRequest=()=>{if(['victory','defeat'].includes(app.screen))start();else if(app.screen!=='title'){app.confirm=true;app.paused=true;app.refresh();}};
function endRun(){app.result=summarizeRun(app.snapshot,app.core.api.state_hash());app.audio.cue(app.snapshot.state===4?11:10);app.audio.stop();app.save.best=Math.max(app.save.best,app.result.score);app.save.records[app.snapshot.difficulty]=Math.max(app.save.records[app.snapshot.difficulty],app.result.score);app.save.won||=app.result.won;app.save.checkpoint=null;storeSave(app.save);
 restoreEstuaryBaseline(app,app.core.seed).then(()=>{app.snapshot=app.read();app.previous=app.snapshot;app.refresh();}).catch(e=>{app.failure=e.message;app.refresh();});
}
async function start({title=false,continued=false,voyage=false}={}){
 app.fixture=false;app.confirm=false;app.guide=false;app.failure='';app.result=null;app.blocked=true;app.screen='title';app.refresh();
 try{await restoreEstuaryBaseline(app,voyage?(Date.now()>>>0):seed);app.snapshot=app.read();app.previous=app.snapshot;
  if(!title){
   app.snapshot=readBasinCrowdSnapshot(stepEstuaryCommandBuffer(app.core,[[7,app.save.difficulty],[5]]));
   app.screen=screenFor(app.snapshot);app.tutorial=!continued;await app.audio.start(app.save).catch(()=>app.effects.push('Audio unavailable; silent watch'));
  }
  app.refresh();
 }catch(e){app.failure=e.message;app.blocked=true;app.refresh();}
}
// Checkpoints preserve the command ledger, including the exact selected Charters.
let commandLedger=[];
async function continueRun(){const cp=app.save.checkpoint;if(!cp)return;
 await start({title:true});if(app.blocked)return;
 try{if(cp.seed!==app.core.seed){await restoreEstuaryBaseline(app,cp.seed);}for(const row of cp.commands){while(app.core.tick<row.tick-1)stepEstuaryCommandBuffer(app.core);stepEstuaryCommandBuffer(app.core,row.commands);}
  while(app.core.tick<cp.tick)stepEstuaryCommandBuffer(app.core);
  if(app.core.api.state_hash()!==cp.hash)throw Error('Checkpoint hash mismatch');
  app.snapshot=app.read();app.screen=screenFor(app.snapshot);commandLedger=cp.commands.map(row=>({...row}));await app.audio.start(app.save);app.refresh();
 }catch(e){app.failure=e.message;app.blocked=true;app.refresh();}
}
const actions={start:()=>{commandLedger=[{tick:1,commands:[[7,app.save.difficulty],[5]]}];start();},restart:()=>{commandLedger=[{tick:1,commands:[[7,app.save.difficulty],[5]]}];start();},title:()=>start({title:true}),continue:continueRun,voyage:()=>{commandLedger=[];start({voyage:true});},gale:()=>{app.save.difficulty=1;commandLedger=[{tick:1,commands:[[7,1],[5]]}];storeSave(app.save);start();},guide:()=>{app.guide=!app.guide;app.refresh();},cancel:()=>{app.confirm=false;app.paused=false;app.refresh();},pause:app.pause,tutorial:()=>{app.tutorial=false;app.refresh();},next:()=>app.send([5]),choose:e=>app.choose(Number(e.dataset.value)),select:e=>{app.selected=Number(e.dataset.value);app.refresh();},gate:e=>{app.selected=Number(e.dataset.basin);app.send([0,app.selected,Number(e.dataset.value)]);},build:e=>app.send([1,app.selected*3+app.socket,Number(e.dataset.value)]),upgrade:()=>app.send([2,app.selected*3+app.socket]),repair:()=>app.send([3]),pump:()=>app.send([6,app.selected])};
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&!b.disabled)actions[b.dataset.action]?.(b);});
document.addEventListener('input',e=>{const p=e.target.dataset.pref;if(!p)return;app.save[p]=e.target.type==='checkbox'?e.target.checked:Number(e.target.value);app.audio.configure(app.save);storeSave(app.save);});
bindInput(app,canvas);
function fit(){document.querySelector('#stage').style.transform=`scale(${Math.min(innerWidth/1280,innerHeight/720)})`;}
addEventListener('resize',fit);fit();
try{
 const render=await createRenderer(canvas);await start({title:true});if(app.blocked)throw Error(app.failure);
 const shot=params.get('shot');if(['title','boon','boss','victory'].includes(shot)){
  app.snapshot=replayFixture(app.core,shot);app.previous=app.snapshot;app.screen=shot==='boss'?'play':shot;app.fixture=true;
  if(shot==='victory'){app.result=summarizeRun(app.snapshot,app.core.api.state_hash());await restoreEstuaryBaseline(app,seed);app.snapshot=app.read();app.previous=app.snapshot;}app.refresh();
 }
 document.body.dataset.boot='ready';
 advanceFixedTideSession(()=>{
  if(app.blocked||app.paused||app.guide||app.fixture||app.screen==='title'||['victory','defeat'].includes(app.screen))return;
  if(app.screen!=='play'&&app.pending.length===0)return;
  const commands=app.pending.splice(0);if(commands.length)commandLedger.push({tick:app.core.tick+1,commands});
  app.previous=app.snapshot;app.snapshot=readBasinCrowdSnapshot(stepEstuaryCommandBuffer(app.core,commands));
  const prior=app.screen;app.screen=screenFor(app.snapshot);app.effects.tick();
  for(const code of new Set(app.snapshot.events)){app.audio.cue(code);if(code===5)app.effects.push('WALL BREACH / JAM — inspect consoles');if(code===8)app.effects.push('SALVAGE OR MACHINE LOST');}
  app.audio.update(app.snapshot);
  if(app.screen==='break'&&prior!==app.screen){app.save.unlocked=Math.max(app.save.unlocked,Math.ceil(app.snapshot.wave/6));storeSave(app.save);}
  if(app.screen==='boon'&&prior!==app.screen){app.save.checkpoint={seed:app.core.seed,wave:app.snapshot.wave,tick:app.core.tick,commands:commandLedger,hash:app.core.api.state_hash()};storeSave(app.save);}
  if(['victory','defeat'].includes(app.screen)&&prior!==app.screen)endRun();
  if(app.snapshot.tick%12===0||prior!==app.screen||commands.length)app.refresh();
 },(alpha,cost)=>{
  if(!app.snapshot)return;const budget=enforceAmbientBudget(cost,app.save.reduced);render(app.snapshot,{selected:app.selected,socket:app.socket,alpha:app.fixture?1:alpha,previous:app.previous,reduced:!budget.motion,foam:budget.foam});
  document.querySelector('#feedback').textContent=app.effects.items.slice(-2).map(e=>e.text).join(' · ');
  document.querySelector('#performance').textContent=`60 Hz rules · ${cost.toFixed(1)} ms frame · ${app.snapshot.enemies.length}/400 entities`;
 });
}catch(e){app.failure=e.message;document.body.dataset.boot='failed';app.refresh();console.error(e);}
