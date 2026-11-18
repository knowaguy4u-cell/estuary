export function composeDepthCurrentPass(g,s){for(let i=0;i<3;i++){const b=s.basins[i],x=54+i*400,h=b.depth/10000*230;
 if(h>0)g.rect(x,530-h,372,h,'#2c8792',[530-h,b.gate===2?-3:2,0,0],.72);
}}
