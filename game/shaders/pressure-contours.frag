#version 300 es
precision highp float;
in vec4 tint;
in vec4 shape;
in vec2 point;
uniform float time;
out vec4 pixel;
void main(){
 if(shape.z>0.){vec2 q=(point-shape.xy)/shape.z;if(dot(q,q)>1.)discard;}
 float contour=shape.w>0.?step(.91,fract((point.y+point.x*.15)/18.)):0.;
 pixel=vec4(tint.rgb+contour*.09,tint.a);
}
