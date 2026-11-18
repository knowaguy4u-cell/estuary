import {sequenceDockwork} from './music.js';
import {playCue} from './sfx.js';
export class HarborAudio {
 constructor(getState){this.getState=getState;this.ctx=null;this.voices=new Set();this.generation=0;}
 async start(prefs){
  if(!this.ctx)this.ctx=new AudioContext();await this.ctx.resume();
  if(this.running){this.configure(prefs);return;}this.running=true;const generation=++this.generation;
  const ctx=this.ctx;this.music=ctx.createGain();this.effects=ctx.createGain();this.texture=ctx.createGain();this.filter=ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=1800;
  this.music.connect(this.filter).connect(ctx.destination);this.effects.connect(ctx.destination);this.texture.connect(this.filter);this.texture.gain.value=.18;
  this.configure(prefs);this.stopMusic=sequenceDockwork(ctx,this.music,this.getState);
  try{await ctx.audioWorklet.addModule(new URL('./tide-audio-worklet.js',import.meta.url));if(generation!==this.generation)return;this.water=new AudioWorkletNode(ctx,'tide-texture');this.water.connect(this.texture);}
  catch{if(generation!==this.generation)return;const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const d=buffer.getChannelData(0);let n=21;for(let i=0;i<d.length;i++){n=(Math.imul(n,1664525)+1013904223)>>>0;d[i]=(n/4294967296*2-1)*.08;}this.water=ctx.createBufferSource();this.water.buffer=buffer;this.water.loop=true;this.water.connect(this.texture);this.water.start();}
 }
 configure(p){if(!this.music)return;this.music.gain.value=p.mute?0:p.music;this.effects.gain.value=p.mute?0:p.effects;this.texture.gain.value=p.mute?0:p.music*.2;}
 update(s){if(this.filter)this.filter.frequency.setTargetAtTime(s.basins.reduce((n,b)=>n+b.depth,0)>15000?500:2400,this.ctx.currentTime,.2);}
 cue(code){if(!this.running||this.voices.size>=12)return;const o=playCue(this.ctx,this.effects,code);this.voices.add(o);o.onended=()=>this.voices.delete(o);}
 stop(){this.generation++;this.running=false;this.stopMusic?.();this.stopMusic=null;for(const n of this.voices){try{n.stop();}catch{}}this.voices.clear();try{this.water?.stop?.();}finally{this.water?.disconnect();this.water=null;this.music?.disconnect();this.effects?.disconnect();this.texture?.disconnect();this.filter?.disconnect();}}
}
