(() => {
 'use strict';
 const root=document.documentElement;
 const landscape=matchMedia('(orientation: landscape)');
 // A touchscreen does not make a laptop a phone.
 const isMobile=()=>navigator.userAgentData?.mobile===true||/Android|iPhone|iPod|iPad|Mobile/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 // Use physical orientation rather than the keyboard-resized CSS viewport.
 const editing=()=>Boolean(document.activeElement?.matches?.('input,textarea,[contenteditable="true"]')||document.body?.classList.contains('search-open'));
 function mode(){
  if(!isMobile())return 'desktop';
  const type=window.screen?.orientation?.type;
  if(type?.startsWith('portrait'))return 'portrait';
  if(type?.startsWith('landscape'))return 'landscape';
  if(typeof window.orientation==='number')return Math.abs(window.orientation)%180===90?'landscape':'portrait';
  const previous=root.dataset.touchLayout;
  if(editing()&&(previous==='portrait'||previous==='landscape'))return previous;
  const visual=window.visualViewport;
  if(previous==='portrait'&&visual&&visual.height<window.innerHeight*.8)return previous;
  return landscape.matches?'landscape':'portrait';
 }
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
 // Preserve the original Earth and planet sizes; use remaining scene area for the orbit.
 function expandDial(d,w,h,flat){
  const margin=flat?12:24;
  if(flat){const maxDiameter=Math.max(d.orbitW,Math.min(w-d.planet-margin,h-d.planet-38));d.orbitW=d.orbitH=maxDiameter;}
  else {d.orbitW=Math.max(d.orbitW,Math.min(w-d.planet*1.06-margin,Math.max(d.orbitW*1.18,d.earth*1.8)));d.orbitH=Math.max(d.orbitH,Math.min(h-d.planet*1.06-24,Math.max(d.orbitH*1.35,d.earth*.85)));}
  return d;
 }
 function fit(scene){const w=scene.clientWidth,h=scene.clientHeight;if(w<1||h<1)return;const d=dimensions(w,h,root.dataset.orbitDepth==='flat',root.dataset.touchLayout==='portrait');if(root.dataset.mainDial==='ten'&&scene.querySelectorAll('.project-planet').length>=10)expandDial(d,w,h,root.dataset.orbitDepth==='flat');scene.style.setProperty('--earth',d.earth+'px');scene.style.setProperty('--orbit-diameter',d.orbitW+'px');scene.style.setProperty('--orbit-height',d.orbitH+'px');root.style.setProperty('--ui-planet-size',d.planet+'px');}
 window.OneAGEHomeLayout=Object.freeze({mode,dimensions,expandDial,fit,depth:()=>root.dataset.orbitDepth==='spatial'});
 landscape.addEventListener('change',sync);window.addEventListener('resize',sync,{passive:true});window.addEventListener('pageshow',sync);window.addEventListener('orientationchange',sync);window.screen?.orientation?.addEventListener?.('change',sync);sync();
})();
