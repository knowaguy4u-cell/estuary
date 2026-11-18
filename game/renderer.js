import {districtFor} from './districts.js';
import {makeGeometry,palette as p} from './sprites.js';
import {composeDepthCurrentPass} from './water-view.js';
import {drawInstancedEnemyFormations} from './crowd-view.js';
export async function createRenderer(canvas){
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:true});if(!gl)throw Error('WebGL2 required');
 async function program(v,f){const vs=await(await fetch(new URL(v,import.meta.url))).text(),fs=await(await fetch(new URL(f,import.meta.url))).text();
  const result=gl.createProgram();for(const [type,text] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){const shader=gl.createShader(type);gl.shaderSource(shader,text);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));gl.attachShader(result,shader);}
  gl.linkProgram(result);if(!gl.getProgramParameter(result,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(result));return result;
 }
 const solid=await program('./shaders/crowd-instance.vert','./shaders/pressure-contours.frag');
 const water=await program('./shaders/basin-surface.vert','./shaders/tidal-refraction.frag');
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 const draw=(program,g,time,foam=28)=>{gl.useProgram(program);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(g.data),gl.DYNAMIC_DRAW);
  for(const [name,size,offset] of [['position',2,0],['color',4,8],['material',4,24]]){const a=gl.getAttribLocation(program,name);if(a>=0){gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,size,gl.FLOAT,false,40,offset);}}
  gl.uniform1f(gl.getUniformLocation(program,'time'),time);gl.uniform1f(gl.getUniformLocation(program,'foamBudget'),foam/28);gl.drawArrays(gl.TRIANGLES,0,g.data.length/10);
 };
 gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 return function renderTidalCity(s,{selected=0,socket=0,alpha=1,previous=null,reduced=false,foam=28}={}){
  gl.viewport(0,0,1280,720);gl.clearColor(.035,.1,.14,1);gl.clear(gl.COLOR_BUFFER_BIT);
  const g=makeGeometry();
  // Skyline and inhabited embankments are stable authored silhouettes.
  for(let j=0;j<38;j++){const x=j*37,h=24+(j*23)%62;g.rect(x,285-h,30,h,'#27444b');g.rect(x+3,285-h+7,4,5,p.copper);}
  for(let i=0;i<3;i++){const x=44+i*400,b=s.basins[i];
   g.rect(x,292,392,252,p.stone);g.rect(x+10,302,372,228,p.navy);
   for(let k=0;k<12;k++)g.rect(x+14+k*31,536,25,5,p.edge);
   g.rect(x+13,392,366,1,'#576b6a');g.rect(x+13,472,366,1,'#576b6a');
   g.rect(x+373,310,5,220,p.copper);
   for(let j=0;j<3;j++){const m=s.machines[i*3+j],xx=x+120+districtFor(s.wave).sockets[j]*70;g.rect(xx-23,493,46,33,selected===i&&socket===j?p.copper:'#647d77');
    if(m.hp){g.rect(xx-15,475,30,25,p.teal);if(m.kind===2)g.rect(xx-2,456,4,30,p.ivory);if(m.kind===1)g.rect(xx-18,467,36,9,p.copper);if(m.kind===3){g.rect(xx-20,465,40,5,p.copper);g.rect(xx-20,465,3,20,p.copper);g.rect(xx+17,465,3,20,p.copper);}
     g.rect(xx-19,520,38*m.hp/(150+m.tier*0),3,m.hp<30?p.enemy:p.ivory);
     if(m.tier)g.circle(xx+19,479,4,p.copper);
    }
   }
   const wheelX=x+196,wheelY=601;g.circle(wheelX,wheelY,29,selected===i?p.ivory:p.copper);g.circle(wheelX,wheelY,23,p.navy);g.circle(wheelX,wheelY,7,p.copper);
   for(let a=0;a<4;a++){const angle=a*Math.PI/2+(reduced?0:s.tick/100)*(b.gate===1?1:b.gate===2?-1:0);g.rect(wheelX+Math.cos(angle)*15-3,wheelY+Math.sin(angle)*15-3,6,6,p.copper);}
   for(let k=0;k<Math.min(b.salvage,14);k++)g.rect(x+22+k*23,522-(k%2)*6,10,5,p.copper);
  }
  draw(solid,g,s.tick/60);
  const crowd=makeGeometry();drawInstancedEnemyFormations(crowd,s,alpha,previous);draw(solid,crowd,s.tick/60);
  const w=makeGeometry();composeDepthCurrentPass(w,s);draw(water,w,reduced?0:s.tick/60,foam);
  const top=makeGeometry();for(let i=0;i<3;i++){const b=s.basins[i],surface=530-b.depth/10000*230;if(b.depth>0)top.rect(54+i*400,surface,372,3,'#b2e3d3');}
  if(s.boss>0){const x=465,y=245;top.rect(x,y,350,32,p.copper,[0,0,0,1]);top.rect(x+10,y+5,330,18,p.navy);for(let i=0;i<10;i++)top.rect(x+i*36,y+27,17,25,p.copper);top.circle(640,y+10,24,p.enemy);top.circle(640,y+10,11,p.navy);}
  draw(solid,top,s.tick/60);
 };
}
