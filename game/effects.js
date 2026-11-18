export class FeedbackPool {
 constructor(){this.items=[];}
 push(text,basin=1){if(this.items.length===12)this.items.shift();this.items.push({text,basin,life:90});}
 tick(){for(const e of this.items)e.life--;this.items=this.items.filter(e=>e.life>0);}
 clear(){this.items.length=0;}
}
