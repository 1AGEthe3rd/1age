import {PadReader,emptyInput,mergeInput} from './experiences/shared/gamepad-model.mjs';
const listeners=new Set();export function subscribeInput(fn){listeners.add(fn);return()=>listeners.delete(fn);}
if(typeof window!=='undefined'&&typeof document!=='undefined'&&!document.getElementById('oneage-controller')){
 // Homepage uses homepage-console-controls.js for its only visual joystick pair.
 // This module handles external controllers only and never creates joystick DOM.
 const touch=emptyInput(),reader=new PadReader();let last=0,wasMoving=false,nextNav=0;
 function reset(){reader.reset();for(const fn of listeners)fn(emptyInput(),0);wasMoving=false;}
 function controls(){const scope=document.querySelector('dialog[open]')||document;return [...scope.querySelectorAll('a[href],button,input,select')].filter(n=>!n.disabled&&!n.closest('#oneage-controller')&&!n.closest('[hidden]')&&n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden');}
 function nav(direction){const nodes=controls();if(!nodes.length)return;nodes[(Math.max(-1,nodes.indexOf(document.activeElement))+direction+nodes.length)%nodes.length].focus({preventScroll:true});}
 function tick(now){
  const dt=Math.min(.05,Math.max(0,(now-last)/1000||0));last=now;const active=!document.hidden&&document.hasFocus(),typing=document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');let pads=[];try{pads=navigator.getGamepads?.()||[];}catch{}
  const pad=reader.sample(pads,active&&!typing),input=mergeInput(touch,pad);
  const modal=!!document.querySelector('dialog[open]');if(!active||typing||modal){input.move={x:0,y:0};input.look={x:0,y:0};}
  const moving=!!(input.move.x||input.move.y||input.look.x||input.look.y);if(moving||wasMoving)for(const fn of listeners)fn(input,dt);wasMoving=moving;
  if(active&&!typing){const direction=pad.buttons[12]||pad.buttons[14]?-1:pad.buttons[13]||pad.buttons[15]?1:0;if(direction&&now>=nextNav){nav(direction);nextNav=now+230;}if(!direction)nextNav=0;
   for(const edge of pad.edges){if(edge===0){const n=document.activeElement;if(n?.matches('button,a[href]')&&!n.closest('#oneage-controller')&&!n.disabled)n.click();}if(edge===1){const dialog=document.querySelector('dialog[open]');if(dialog)dialog.close();else document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));}if(edge===9)document.querySelector('button[aria-label="1AGE menu"],.brand')?.click();}
  }
  requestAnimationFrame(tick);
 }
 addEventListener('blur',reset);addEventListener('gamepaddisconnected',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});addEventListener('orientationchange',reset);addEventListener('pagehide',reset);requestAnimationFrame(tick);
}
