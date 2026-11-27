import {subscribeInput} from '../../experiences/shared/gamepad.mjs';
export function createWalker(camera,canvas,{radius=10,eyeHeight=1.75,obstacles=[],spawn=[0,1.68,7],paused=()=>false,onTap=()=>{}}={}){
 const keys=new Set();let pad={move:{x:0,y:0},look:{x:0,y:0}},yaw=0,pitch=0,drag=null;
 const reset=()=>{camera.position.set(spawn[0],eyeHeight,spawn[2]);yaw=0;pitch=0;camera.rotation.set(0,0,0,'YXZ');};
 reset();
 const clear=()=>{keys.clear();drag=null;pad={move:{x:0,y:0},look:{x:0,y:0}};};
 subscribeInput(input=>{pad=input;});
 const movementKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight']);
 addEventListener('keydown',e=>{if(paused()||e.target?.closest?.('input,select,textarea,[contenteditable]'))return;if(e.code.startsWith('Arrow')&&e.target?.closest?.('button,a'))return;if(movementKeys.has(e.code)){e.preventDefault();keys.add(e.code);}});
 addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
 canvas.addEventListener('pointerdown',e=>{if(paused()||drag||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,d:0};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||paused())return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;drag.d+=Math.hypot(dx,dy);if(drag.d>5){yaw-=dx*.003;pitch-=dy*.003;}});
 canvas.addEventListener('pointerup',e=>{if(drag?.id!==e.pointerId)return;const tap=drag.d<=5;drag=null;if(tap&&!paused())onTap(e);});
 for(const type of ['pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{drag=null;});
 const valid=(x,z)=>Math.hypot(x,z)<=radius&&obstacles.every(o=>Math.hypot(x-o.x,z-o.z)>o.r+.32);
 function update(dt){if(paused()){keys.clear();return;}dt=Math.min(.05,dt);
 yaw-=((pad.look.x||0)+Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')))*dt*1.9;
 pitch-=((pad.look.y||0)+Number(keys.has('ArrowDown'))-Number(keys.has('ArrowUp')))*dt*1.35;
 pitch=Math.max(-1.25,Math.min(1.25,pitch));camera.rotation.set(pitch,yaw,0,'YXZ');
 let x=(pad.move.x||0)+Number(keys.has('KeyD'))-Number(keys.has('KeyA')),z=(pad.move.y||0)+Number(keys.has('KeyS'))-Number(keys.has('KeyW'));const len=Math.max(1,Math.hypot(x,z));x/=len;z/=len;
 const speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?4.6:2.8)*dt,dx=(x*Math.cos(yaw)+z*Math.sin(yaw))*speed,dz=(-x*Math.sin(yaw)+z*Math.cos(yaw))*speed;
 const p=camera.position;if(valid(p.x+dx,p.z))p.x+=dx;if(valid(p.x,p.z+dz))p.z+=dz;
 }
 return {update,reset,clear};
}
