(() => {
 'use strict';
 const root=document.documentElement;
 const landscape=matchMedia('(orientation: landscape)');
 // A touchscreen does not make a laptop a phone.
 const isMobile=()=>navigator.userAgentData?.mobile===true||/Android|iPhone|iPod|iPad|Mobile/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 const mode=()=>isMobile()?(landscape.matches?'landscape':'portrait'):'desktop';
 function sync(){const next=mode();if(root.dataset.touchLayout===next)return;root.dataset.touchLayout=next;root.dataset.orbitDepth=next==='portrait'&&root.dataset.homeSite==='search'?'flat':'spatial';window.dispatchEvent(new Event('1age-layout-change'));}
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 function dimensions(w,h,flat,portrait){
  if(flat){const p=clamp(w*.13,44,76),d=Math.max(80,Math.min(w-p-24,h-p-55));return {planet:p,orbitW:d,orbitH:d,earth:Math.min(d-p-18,w*.58)};}
  const p=clamp(Math.min(w*.075,h*.17),44,98);
  const earth=Math.max(84,Math.min(h*.73,w*(portrait?.62:.48),620));
  const orbitW=Math.max(earth+Math.min(p,32),Math.min(w-p*1.35-18,w*(portrait?.82:.74),earth*2.25));
  const orbitH=Math.min(h-p-30,earth*.57);
  return {planet:p,orbitW,orbitH,earth};
 }
 function fit(scene){const w=scene.clientWidth,h=scene.clientHeight;if(w<1||h<1)return;const d=dimensions(w,h,root.dataset.orbitDepth==='flat',root.dataset.touchLayout==='portrait');scene.style.setProperty('--earth',d.earth+'px');scene.style.setProperty('--orbit-diameter',d.orbitW+'px');scene.style.setProperty('--orbit-height',d.orbitH+'px');root.style.setProperty('--ui-planet-size',d.planet+'px');}
 window.OneAGEHomeLayout=Object.freeze({mode,dimensions,fit,depth:()=>root.dataset.orbitDepth==='spatial'});
 landscape.addEventListener('change',sync);window.addEventListener('resize',sync,{passive:true});window.addEventListener('pageshow',sync);sync();
})();
