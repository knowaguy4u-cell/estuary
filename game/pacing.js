export function advanceFixedTideSession(tick,render){
 let previous,accumulator=0,cost=0;
 function frame(now){const start=performance.now();if(previous!==undefined)accumulator+=Math.min((now-previous)/1000,.1);previous=now;
 while(accumulator>=1/60){tick();accumulator-=1/60;}render(accumulator*60,cost);cost=cost*.95+(performance.now()-start)*.05;requestAnimationFrame(frame);}
 requestAnimationFrame(frame);
}
