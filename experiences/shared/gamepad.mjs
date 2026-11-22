import {PadReader,emptyInput,mergeInput,stick} from './gamepad-model.mjs';
const listeners=new Set();export function subscribeInput(fn){listeners.add(fn);return()=>listeners.delete(fn);}
if(typeof window!=='undefined'&&typeof document!=='undefined'&&!document.getElementById('oneage-controller')){
 const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href=new URL('./gamepad.css',import.meta.url).href;document.head.append(sheet);
 const root=document.createElement('div');root.id='oneage-controller';root.setAttribute('role','group');root.setAttribute('aria-label','1AGE gamepad');
 const touch=emptyInput(),reader=new PadReader(),owners=new Map();let last=0,wasMoving=false,nextNav=0;
 function release(button){const role=button.dataset.axis;touch[role]={x:0,y:0};button.firstChild.style.transform='translate(-50%,-50%)';}
 function reset(){reader.reset();owners.clear();root.querySelectorAll('button').forEach(release);for(const fn of listeners)fn(emptyInput(),0);wasMoving=false;}
 for(const [axis,label] of [['move','L'],['look','R']]){
  const button=document.createElement('button');button.type='button';button.className='oneage-stick';button.dataset.axis=axis;button.setAttribute('aria-label',axis==='move'?'Left movement joystick':'Right look joystick');
  const knob=document.createElement('span');knob.className='oneage-knob';knob.textContent=label;button.append(knob);root.append(button);
  function set(event){const r=button.getBoundingClientRect(),radius=r.width*.45;touch[axis]=stick((event.clientX-r.left-r.width/2)/radius,(event.clientY-r.top-r.height/2)/radius,.08);const v=touch[axis];knob.style.transform=`translate(calc(-50% + ${v.x*radius*.65}px),calc(-50% + ${v.y*radius*.65}px))`;}
  button.addEventListener('pointerdown',event=>{if(event.button!==0||[...owners.values()].includes(button))return;event.preventDefault();event.stopPropagation();owners.set(event.pointerId,button);button.setPointerCapture(event.pointerId);set(event);});
  button.addEventListener('pointermove',event=>{if(owners.get(event.pointerId)===button)set(event);});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>{if(owners.get(event.pointerId)!==button)return;owners.delete(event.pointerId);release(button);});
  button.addEventListener('keydown',event=>{const keys={ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1}};if(keys[event.key]){event.preventDefault();touch[axis]=keys[event.key];}});button.addEventListener('keyup',()=>release(button));button.addEventListener('blur',()=>release(button));
 }
 document.body.append(root);
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
