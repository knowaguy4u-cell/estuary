#version 300 es
precision highp float;
in vec2 position;
in vec4 color;
in vec4 material;
out vec4 tint;
out vec4 shape;
out vec2 point;
void main(){point=position;tint=color;shape=material;gl_Position=vec4(position/vec2(640.,-360.)+vec2(-1.,1.),0.,1.);}
