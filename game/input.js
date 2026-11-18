import {districtFor} from './districts.js';
export function bindInput(app,canvas){
 window.addEventListener('keydown',e=>{
  if(e.target.matches('input,select,button'))return;
  const k=e.key.toLowerCase();
  if([' ','escape','1','2','3','q','e','z','x','c','p','u','f','r','m','arrowleft','arrowright'].includes(k))e.preventDefault();
  if(k==='m'){app.toggleMute();return;}
  if(k==='escape'){app.pause();return;}
  if(k==='r'){app.restartRequest();return;}
  if(app.screen==='boon' && ['1','2','3'].includes(k)){app.choose(Number(k)-1);return;}
  if(['1','2','3'].includes(k))app.selected=Number(k)-1;
  if(!['play','break'].includes(app.screen))return;
  if(k==='arrowleft'||k==='arrowright'){app.socket=(app.socket+(k==='arrowleft'?2:1))%3;app.refresh();}
  const gate={q:1,e:2,' ':0}[k];if(gate!==undefined)app.send([0,app.selected,gate]);
  const kind={z:1,x:2,c:3}[k];if(kind)app.send([1,app.selected*3+app.socket,kind]);
  if(k==='u')app.send([2,app.selected*3+app.socket]);
  if(k==='f')app.send([3]);if(k==='p')app.send([6,app.selected]);
 });
 canvas.addEventListener('pointerdown',e=>{
  if(!['play','break'].includes(app.screen))return;
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*1280/r.width,y=(e.clientY-r.top)*720/r.height;
  const b=Math.floor((x-44)/400);if(b<0||b>2)return;app.selected=b;
  if(y>570){app.send([0,b,(app.snapshot.basins[b].gate+1)%3]);}
  else if(y>400 && y<550)app.socket=districtFor(app.snapshot.wave).sockets.indexOf(Math.max(0,Math.min(2,Math.floor((x-(44+b*400)-110)/70))));
 });
}
