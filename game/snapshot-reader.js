export function readBasinCrowdSnapshot(s) {
  return {raw:s,tick:s[1],state:s[2],wave:s[3],age:s[4],integrity:s[5],scrap:s[6],pressure:s[7],cap:s[8],score:s[9],kills:s[10],recovered:s[11],lost:s[12],washed:s[13],boss:s[14],bossMax:s[15],phase:s[16],spawned:s[17],total:s[18],overflow:s[21],choices:s[22],difficulty:s[23],sea:s[24],
    basins:Array.from({length:3},(_,i)=>({depth:s[32+i*6],gate:s[33+i*6],jam:s[34+i*6],salvage:s[35+i*6]})),
    ranks:Array.from(s.slice(50,62)),offers:Array.from(s.slice(62,65)),
    machines:Array.from({length:9},(_,i)=>({kind:s[65+i*3],hp:s[66+i*3],tier:s[67+i*3]})),
    enemies:Array.from({length:s[27]},(_,i)=>{const p=128+i*8;return {id:s[p],kind:s[p+1],basin:s[p+2],x:s[p+3],hp:s[p+4],max:s[p+5],row:s[p+6],breach:s[p+7]};}),
    events:Array.from(s.slice(96,96+s[20]))};
}
