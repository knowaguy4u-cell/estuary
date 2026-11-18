#version 300 es
precision highp float;
in vec4 tint;
in vec4 surface;
in vec2 world;
uniform float time;
uniform float foamBudget;
out vec4 pixel;
void main(){
 float d=max(0.,world.y-surface.x);
 float band=floor(d/24.)/8.;
 float ripple=sin(world.x*.07+time*1.8+sin(d*.06))*sin(d*.09-time);
 float foam=smoothstep(.86,1.,sin(world.x*.12+time*surface.y))*exp(-d*.09);
 vec3 water=mix(tint.rgb,vec3(.02,.12,.19),clamp(band,0.,.65));
 pixel=vec4(water+ripple*.025+foam*.25*foamBudget,tint.a);
}
