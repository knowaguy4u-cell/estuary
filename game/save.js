const key='estuary-save-v1';
const defaults=()=>({version:1,best:0,records:[0,0],unlocked:1,won:false,difficulty:0,music:.35,effects:.55,mute:false,reduced:false,checkpoint:null});
function validCheckpoint(cp){
 if(!cp||!Number.isSafeInteger(cp.seed)||cp.seed<0||cp.seed>4294967295||!Number.isInteger(cp.wave)||cp.wave<1||cp.wave>18||!Number.isInteger(cp.tick)||cp.tick<1||cp.tick>3000000||!Number.isInteger(cp.hash)||!Array.isArray(cp.commands)||cp.commands.length>20000)return false;
 let last=0;for(const row of cp.commands){if(!Number.isInteger(row.tick)||row.tick<=last||row.tick>cp.tick||!Array.isArray(row.commands)||row.commands.length>32||row.commands.some(c=>!Array.isArray(c)||c.length>3||c.some(n=>!Number.isInteger(n)||n<0||n>11)))return false;last=row.tick;}return true;
}
export function loadSave(){try{const s=JSON.parse(localStorage.getItem(key));if(s?.version!==1)return defaults();
 return {...defaults(),records:[0,1].map(i=>Number.isSafeInteger(s.records?.[i])&&s.records[i]>=0?s.records[i]:0),best:Number.isSafeInteger(s.best)&&s.best>=0?s.best:0,records:[0,0],unlocked:[1,2,3].includes(s.unlocked)?s.unlocked:1,won:s.won===true,difficulty:s.difficulty===1?1:0,music:Math.max(0,Math.min(1,Number(s.music)||0)),effects:Math.max(0,Math.min(1,Number(s.effects)||0)),mute:s.mute===true,reduced:s.reduced===true,checkpoint:validCheckpoint(s.checkpoint)?s.checkpoint:null};
 }catch{return defaults();}}
export function storeSave(save){try{localStorage.setItem(key,JSON.stringify(save));return true;}catch{return false;}}
