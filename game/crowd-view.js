import {palette as p} from './sprites.js';
export function drawInstancedEnemyFormations(g,s,alpha,previous){
 const old=new Map(previous?.enemies.map(e=>[e.id,e])??[]);
 for(const e of s.enemies){const x0=old.get(e.id)?.x??e.x;const distance=x0+(e.x-x0)*alpha;
  const x=66+e.basin*400+distance/12000*330,y=438-e.row*26;
  const surface=530-s.basins[e.basin].depth/10000*230;
  const yy=e.kind===2?Math.min(y,surface-12):e.kind===6?Math.min(y,surface+25):y;
  const size=e.kind===5?12:e.kind===1?9:7;
  if(e.kind===2){g.circle(x,yy,11,p.copper);g.circle(x,yy,6,p.enemy);}
  else if(e.kind===6){g.rect(x-13,yy-3,23,6,p.enemy);g.rect(x+6,yy-7,4,14,p.enemy);}
  else if(e.kind===4){g.rect(x-8,yy-3,16,6,p.ivory);g.rect(x-3,yy-8,6,16,p.ivory);}
  else{g.rect(x-size,yy-size,size*2,size*2,p.enemy);g.rect(x-size+2,yy-size+2,size*2-4,3,e.kind===1?p.copper:p.navy);}
  if(e.kind===3){g.rect(x-12,yy-4,5,9,p.copper);}
  if(e.hp<e.max)g.rect(x-size,yy-size-5,size*2*e.hp/e.max,2,p.ivory);
 }
}
