(() => {
 'use strict';
 const root=document.documentElement;
 const coarse=matchMedia('(any-pointer: coarse)');
 const orientation=matchMedia('(orientation: landscape)');
 let observedTouch=false;
 function sync(){
  const touch=observedTouch || navigator.maxTouchPoints>0 || coarse.matches;
  const next=touch?(orientation.matches?'landscape':'portrait'):'desktop';
  if(root.dataset.touchLayout===next)return;
  root.dataset.touchLayout=next;
  window.dispatchEvent(new Event('1age-layout-change'));
 }
 coarse.addEventListener('change',sync);
 orientation.addEventListener('change',sync);
 window.addEventListener('resize',sync,{passive:true});
 window.addEventListener('pageshow',sync);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync();});
 window.screen?.orientation?.addEventListener('change',sync);
 window.addEventListener('pointerdown',event=>{
  if(event.pointerType==='touch'&&!observedTouch){observedTouch=true;sync();}
 },{passive:true,capture:true});
 sync();
})();
