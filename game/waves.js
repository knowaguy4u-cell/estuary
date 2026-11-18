import {enemies,bosses} from './catalog.js';
export function threatQueue(s){
 const district=Math.floor((s.wave-1)/6);
 return Array.from({length:3},(_,i)=>{const n=s.spawned+i;const kind=s.wave===1?(n%3===0?1:0):s.wave===2?(n%3===0?2:1):(n+s.wave+district)%7;
 return {kind,label:enemies[kind][0],icon:enemies[kind][1],seconds:Math.max(0,((s.wave%6===0?35:55)*(i+1)-s.age%(s.wave%6===0?35:55))/60)};});
}
export function bossName(wave){return bosses[Math.min(2,Math.floor(wave/6)-1)]??'Outer channel';}
