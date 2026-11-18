export function sequenceDockwork(ctx,bus,getState){
 let timer,next=ctx.currentTime,beat=0,bossStem=false;const nodes=new Set();
 const noise=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.08),ctx.sampleRate);let seed=9;const samples=noise.getChannelData(0);for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;samples[i]=(seed/4294967296*2-1)*(1-i/samples.length);}
 function percussion(start){const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=noise;filter.type='highpass';filter.frequency.value=2200;gain.gain.value=.09;source.connect(filter).connect(gain).connect(bus);source.start(start);nodes.add(source);source.onended=()=>nodes.delete(source);}
 function note(freq,start,length,type,gain){const o=ctx.createOscillator(),a=ctx.createGain();o.type=type;o.frequency.value=freq;a.gain.setValueAtTime(0,start);a.gain.linearRampToValueAtTime(gain,start+.012);a.gain.exponentialRampToValueAtTime(.001,start+length);o.connect(a).connect(bus);o.start(start);o.stop(start+length+.02);nodes.add(o);o.onended=()=>nodes.delete(o);}
 timer=setInterval(()=>{while(next<ctx.currentTime+.15){const s=getState();if(beat%16===0)bossStem=s?.boss>0;const boss=bossStem,root=[65.41,73.42,87.31,65.41][Math.floor(beat/16)%4];
  note(root*(beat%4===2?1.5:1),next,.25,'triangle',.2);
  if(beat%2===0)note(root*[4,5,6,5][beat%4],next,.4,'sine',.11);
  if(boss && beat%2===1)note(root*3,next,.08,'square',.025);
  if(beat%2===1)percussion(next);
  if(beat%4===0)note(55,next,.06,'sine',.16);
  next+=60/96/2;beat++;
 }},40);
 return ()=>{clearInterval(timer);for(const n of nodes){try{n.stop();}catch{}}nodes.clear();};
}
