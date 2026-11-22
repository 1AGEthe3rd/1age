export const emptyInput=()=>({move:{x:0,y:0},look:{x:0,y:0},buttons:[]});
export function stick(x=0,y=0,deadzone=.18){x=Number.isFinite(x)?x:0;y=Number.isFinite(y)?y:0;const length=Math.hypot(x,y);if(length<=deadzone)return {x:0,y:0};const scale=Math.min(1,(length-deadzone)/(1-deadzone))/length;return {x:x*scale,y:y*scale};}
export function mergeInput(touch,pad){const output=emptyInput();for(const key of ['move','look']){const x=(touch[key]?.x||0)+(pad[key]?.x||0),y=(touch[key]?.y||0)+(pad[key]?.y||0),length=Math.max(1,Math.hypot(x,y));output[key]={x:x/length,y:y/length};}output.buttons=pad.buttons||[];return output;}
export class PadReader{
 constructor(){this.reset();}
 reset(){this.index=null;this.previous=[];this.armed=false;}
 sample(pads,active=true){
  const output=emptyInput();if(!active){this.reset();return {...output,edges:[]};}
  const supported=Array.from(pads||[]).filter(p=>p?.connected&&p.mapping==='standard');
  const pad=supported.find(p=>p.index===this.index)||supported[0];if(!pad){this.reset();return {...output,edges:[]};}
  const buttons=pad.buttons.map(b=>!!b.pressed),move=stick(pad.axes[0],pad.axes[1]),look=stick(pad.axes[2],pad.axes[3]);
  if(this.index!==pad.index){this.index=pad.index;this.armed=false;this.previous=buttons;}
  if(!this.armed){this.previous=buttons;this.armed=!buttons.some(Boolean)&&!move.x&&!move.y&&!look.x&&!look.y;return {...output,edges:[]};}
  const edges=buttons.flatMap((pressed,i)=>pressed&&!this.previous[i]?[i]:[]);this.previous=buttons;return {move,look,buttons,edges};
 }
}
