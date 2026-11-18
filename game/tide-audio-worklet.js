class TideTexture extends AudioWorkletProcessor {
 constructor(){super();this.seed=17;this.smooth=0;}
 process(inputs,outputs){for(const channel of outputs[0])for(let i=0;i<channel.length;i++){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;this.smooth=.97*this.smooth+.03*(this.seed/4294967296*2-1);channel[i]=this.smooth*.2;}return true;}
}
registerProcessor('tide-texture',TideTexture);
