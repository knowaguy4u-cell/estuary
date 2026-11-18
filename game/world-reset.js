import {createEstuaryCore} from './wasm-bridge.js';
import {checkEstuaryBoot} from './boot.js';
export async function restoreEstuaryBaseline(app,seed){
 app.blocked=true;let cleanupFailure;
 try {app.audio.stop();app.effects.clear();app.pending.length=0;app.core=null;}
 catch(e){cleanupFailure=e;}
 finally {
  app.selected=0;app.socket=0;app.paused=false;app.tutorial=false;
  try{app.core=await createEstuaryCore(seed);app.checks=checkEstuaryBoot(app.core);if(cleanupFailure)throw cleanupFailure;app.blocked=false;}
  catch(e){app.failure=e.message;app.blocked=true;throw e;}
 }
}
