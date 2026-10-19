(() => {
 'use strict';
 const bus=window.OneAGEInput;if(!bus||!navigator.getGamepads)return;
 const empty=()=>({move:{x:0,y:0},look:{x:0,y:0},buttons:{}});
 const emit=(name,detail)=>window.dispatchEvent(new CustomEvent(name,{detail}));
 let selected=null,previous=[],focus=null,nextNav=0,blocked=false;
 const radial=(x=0,y=0)=>{const n=Math.hypot(x,y);if(n<=.18)return {x:0,y:0};const scale=Math.min(1,(n-.18)/.82)/n;return {x:x*scale,y:y*scale};};
 function candidates(){const scope=document.querySelector('dialog[open]')||document;return [...scope.querySelectorAll('a[href],button,[role="button"],input')].filter(n=>!n.disabled&&!n.closest('[hidden]')&&n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden'&&!n.closest('.console-controls'));}
 function point(n){focus?.classList.remove('gamepad-focus');focus=n;if(n){n.classList.add('gamepad-focus');n.focus({preventScroll:true});}}
 function navigate(dir){const items=candidates();if(!items.length)return;point(items[(Math.max(-1,items.indexOf(focus))+dir+items.length)%items.length]);}
 const pressed=(pad,i)=>!!pad.buttons[i]?.pressed;
 function back(){const dialog=document.querySelector('dialog[open]');if(dialog){dialog.close();return;}window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));document.querySelector('.world-globe')?.click();point(document.querySelector('.world-globe'));}
 function tick(now){
  let pads=[];try{pads=Array.from(navigator.getGamepads()||[]);}catch(_){}
  const pad=pads.find(p=>p?.connected&&p.index===selected)||pads.find(p=>p?.connected&&p.mapping==='standard');
  if(!pad||document.hidden||!document.hasFocus()){bus.setGamepad(empty());previous=[];selected=null;blocked=true;requestAnimationFrame(tick);return;}
  const buttons=pad.buttons.map(b=>!!b.pressed);
  if(pad.index!==selected||blocked){selected=pad.index;previous=buttons;blocked=false;bus.setGamepad(empty());requestAnimationFrame(tick);return;}
  const edge=i=>buttons[i]&&!previous[i];
  const dialog=!!document.querySelector('dialog[open]'),typing=document.activeElement?.matches('input,textarea,[contenteditable="true"]');
  const input=empty();if(!dialog&&!typing){input.move=radial(pad.axes[0],pad.axes[1]);input.look=radial(pad.axes[2],pad.axes[3]);['A','B','X','Y'].forEach((key,i)=>input.buttons[key]=pressed(pad,i));input.buttons.up=pressed(pad,5);input.buttons.down=pressed(pad,4);input.buttons.sprint=pressed(pad,10);}
  bus.setGamepad(input);
  // A world using the input bus owns its own actions; home navigation stays here.
  if(!document.body.classList.contains('virtual-environment')){
   const direction=pressed(pad,12)||pressed(pad,14)?-1:pressed(pad,13)||pressed(pad,15)?1:0;
   if(direction&&now>=nextNav){navigate(direction);nextNav=now+230;}if(!direction)nextNav=0;
   if(edge(0)){if(!focus||!focus.isConnected||!candidates().includes(focus))point(document.querySelector('dialog[open] button')||document.querySelector('.world-globe'));focus?.click();}
   if(edge(1))back();
   if(!dialog&&!typing){if(edge(4))emit('1age-orbit-step',-1);if(edge(5))emit('1age-orbit-step',1);if(edge(2))document.querySelector('.search-circle')?.click();if(edge(3))document.querySelector('.brand')?.click();if(edge(9))document.querySelector('.console-menu')?.click();}
  }
  previous=buttons;requestAnimationFrame(tick);
 }
 window.addEventListener('blur',()=>{blocked=true;bus.setGamepad(empty());});
 window.addEventListener('gamepaddisconnected',e=>{if(e.gamepad.index===selected){selected=null;previous=[];bus.setGamepad(empty());point(null);}});
 const style=document.createElement('style');style.textContent='.gamepad-focus{outline:3px solid #1BFD9C!important;outline-offset:5px!important}';document.head.append(style);
 requestAnimationFrame(tick);
})();
