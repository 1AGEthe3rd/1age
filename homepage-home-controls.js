(() => {
 'use strict';
 const $=selector=>document.querySelector(selector),brand=$('.brand'),wings=$('.header-wings');
 let group='closed';
 const paths={social:'<circle cx="20" cy="19" r="6"/><circle cx="44" cy="19" r="6"/><circle cx="32" cy="43" r="6"/><path d="m24 22 6 15m10-15-6 15M26 19h12"/>',about:'<circle cx="32" cy="32" r="24"/><path d="M32 29v18M32 18v2"/>',store:'<path d="M12 24h40l-4 30H16zM22 24v-7a10 10 0 0 1 20 0v7"/>',blog:'<rect x="10" y="10" width="44" height="44" rx="4"/><path d="M20 21h24M20 31h24M20 41h16"/>',contact:'<rect x="8" y="14" width="48" height="36" rx="6"/><path d="m9 16 23 18 23-18"/>'};
 let socials=[{name:'GitHub',symbol:'GH',url:'https://github.com/1AGEthe3rd/1age'}];
 const extraApps=[{"name":"Store","url":"https://1age.store/","art":"<path d=\"M12 24h40l-4 30H16z M22 24v-7a10 10 0 0 1 20 0v7\"/>"},{"name":"Plus","url":"https://1age.plus/","art":"<path d=\"M32 12v40M12 32h40\"/>"}];
 function header(next){
  if(!brand||!wings)return;
  const hub=wings.parentElement,restoreFocus=document.activeElement===brand;
  if(wings.contains(brand))hub.append(brand);
  group=next;
  wings.classList.add('header-slider');wings.setAttribute('role','navigation');wings.setAttribute('aria-label','1AGE menu');
  wings.hidden=next==='closed';wings.replaceChildren();brand.setAttribute('aria-expanded',String(next!=='closed'));
  if(next==='closed'){if(restoreFocus)brand.focus({preventScroll:true});return;}
  const items=next==='social'?[{name:'Back',symbol:'‹',action:()=>header('main')},...socials]:[...extraApps,{name:'Social',art:paths.social,action:()=>header('social')}];
  const track=document.createElement('div');track.className='header-slider-track';track.tabIndex=0;track.setAttribute('aria-label','Slide menu horizontally');wings.append(track);
  const portrait=document.documentElement.dataset.touchLayout==='portrait'||document.body.classList.contains('results-open');
  const split=portrait?Math.ceil(items.length/2):items.length;
  items.forEach((item,index)=>{
   if(index===split)track.append(brand);
   const node=document.createElement(item.url?'a':'button');node.className='header-planet';
   if(item.url){node.href=item.url;if(next==='social'){node.target='_blank';node.rel='noopener noreferrer';}}else{node.type='button';if(item.action)node.addEventListener('click',item.action);else node.disabled=true;}
   const circle=document.createElement('span');circle.className='header-planet-circle';
   if(item.art)circle.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">'+item.art+'</svg>';else circle.textContent=item.symbol;
   const label=document.createElement('span');label.textContent=item.name;node.append(circle,label);track.append(node);
  });
  if(!track.contains(brand))track.append(brand);
  requestAnimationFrame(()=>{if(group==='closed'||!track.isConnected)return;track.scrollLeft=portrait?brand.offsetLeft-(track.clientWidth-brand.offsetWidth)/2:track.scrollWidth;});
  if(restoreFocus)brand.focus({preventScroll:true});
 }
 fetch('/data/header-links.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{socials=(data.socials||[]).filter(item=>{try{return new URL(item.url).protocol==='https:';}catch{return false;}}).map(item=>({name:item.name,symbol:item.symbol||item.name[0],url:item.url}));if(group==='social')header('social');}).catch(()=>{});
 window.addEventListener('1age-layout-change',()=>{if(group!=='closed')header(group);});
 window.addEventListener('1age-header-close',()=>header('closed'));

 brand?.addEventListener('click',()=>header(group==='closed'?'main':group==='social'?'main':'closed'));brand?.addEventListener('keydown',e=>{if(e.key==='Escape')header('closed');});
 if(wings){
  wings.addEventListener('keydown',e=>{
   const nodes=[...wings.querySelectorAll('a,button:not(:disabled)')];
   const current=nodes.indexOf(document.activeElement);
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
   e.preventDefault();
   const index=e.key==='Home'?0:e.key==='End'?nodes.length-1:Math.max(0,Math.min(nodes.length-1,current+(e.key==='ArrowRight'?1:-1)));
   nodes[index]?.focus();nodes[index]?.scrollIntoView({block:'nearest',inline:'nearest'});
  });
  let slide=null;
  wings.addEventListener('pointerdown',e=>{const track=e.target.closest('.header-slider-track');if(track&&e.pointerType==='mouse'&&e.button===0)slide={track,x:e.clientX,left:track.scrollLeft,moved:false};});
  wings.addEventListener('pointermove',e=>{if(!slide)return;if(Math.abs(e.clientX-slide.x)>8){slide.moved=true;slide.track.scrollLeft=slide.left+slide.x-e.clientX;}});
  wings.addEventListener('click',e=>{if(slide?.moved){e.preventDefault();e.stopImmediatePropagation();}slide=null;},true);
  wings.addEventListener('pointerleave',()=>{slide=null;});
  wings.addEventListener('dragstart',e=>e.preventDefault());
 }
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&group!=='closed'){header('closed');brand.focus();}});
 document.addEventListener('pointerdown',e=>{if(group!=='closed'&&!e.target.closest('.header-hub'))header('closed');});

 const scene=$('.world-scene'),globe=$('.world-globe');if(!scene||!globe)return;
 const entry=$('.world-entry');
 let highlight=false,hover=false,drag=null,dragged=false,multi=false;const touches=new Set();
 globe.insertAdjacentHTML('beforeend','<span class="world-letter" aria-hidden="true">1AGE World</span>');
 function sync(){scene.classList.toggle('globe-selected',highlight);scene.classList.toggle('globe-hover',hover);globe.setAttribute('aria-pressed',String(highlight));globe.setAttribute('aria-label','1AGE World. Drag to turn; press to highlight and reveal Enter.');}
 function reset(){highlight=false;sync();}
 for(const node of [globe,entry]){node.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hover=true;sync();}});node.addEventListener('pointerleave',e=>{if(!e.relatedTarget?.closest('.world-globe,.world-entry')){hover=false;sync();}});}
 globe.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){touches.add(e.pointerId);hover=false;}if(touches.size>1){drag=null;multi=true;scene.classList.remove('globe-pressed');return;}if(e.button!==0)return;multi=false;dragged=false;drag={id:e.pointerId,x:e.clientX,start:e.clientX};scene.classList.add('globe-pressed');globe.setPointerCapture(e.pointerId);});
 globe.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;if(Math.abs(e.clientX-drag.start)>6)dragged=true;if(dragged){reset();window.dispatchEvent(new CustomEvent('1age-world-turn',{detail:-(e.clientX-drag.x)/Math.max(1,globe.clientWidth)}));}drag.x=e.clientX;});
 function release(e){touches.delete(e.pointerId);if(drag?.id===e.pointerId)drag=null;scene.classList.remove('globe-pressed');}
 globe.addEventListener('pointerup',release);globe.addEventListener('pointercancel',e=>{release(e);multi=true;});
 globe.addEventListener('lostpointercapture',release);
 function resetGlobeInput(){
  const id=drag?.id;drag=null;touches.clear();dragged=false;multi=false;
  if(id!==undefined&&globe.hasPointerCapture(id))globe.releasePointerCapture(id);
  scene.classList.remove('globe-pressed');
 }
 window.addEventListener('orientationchange',resetGlobeInput);
 window.addEventListener('blur',resetGlobeInput);
 window.addEventListener('pagehide',resetGlobeInput);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)resetGlobeInput();});
 globe.addEventListener('click',()=>{if(dragged||multi){dragged=false;return;}const portrait=document.documentElement.dataset.touchLayout==='portrait';highlight=portrait?globe.getAttribute('aria-expanded')!=='true':!highlight;sync();window.dispatchEvent(new CustomEvent('1age-orbit-visibility',{detail:highlight}));window.dispatchEvent(new Event('1age-globe-activated'));});
 globe.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();reset();window.dispatchEvent(new CustomEvent('1age-world-turn',{detail:e.key==='ArrowLeft'?-.04:.04}));});
 function fit(){
 if(document.visibilityState==='hidden'||document.body.classList.contains('results-open')||document.body.classList.contains('information-open')||document.activeElement?.matches('input,textarea,[contenteditable="true"]'))return;
 const w=scene.clientWidth,h=scene.clientHeight;if(w<1||h<1)return;
 wings?.style.setProperty('--menu-circle-size',brand.querySelector('.brand-circle').offsetWidth+'px');
 window.OneAGEHomeLayout.fit(scene);}


 let fitFrame = 0, restoreFrame = 0, restoreTimer = 0;
 function scheduleFit() {
   cancelAnimationFrame(fitFrame);
   fitFrame = requestAnimationFrame(fit);
 }
 // Back/Forward cache restores do not rerun load or necessarily emit resize.
 // Measure again after restored styles and browser toolbars have settled.
 function restoreFit() {
   scheduleFit();
   cancelAnimationFrame(restoreFrame);
   restoreFrame=requestAnimationFrame(()=>{restoreFrame=0;scheduleFit();});
   clearTimeout(restoreTimer);
   restoreTimer=setTimeout(scheduleFit,180);
 }
 window.addEventListener('pageshow',restoreFit);
 window.addEventListener('1age-home-restored',restoreFit);
 document.addEventListener('focusout',event=>{
   if(event.target.matches('input,textarea,[contenteditable="true"]'))restoreFit();
 });
 document.addEventListener('visibilitychange',()=>{
   if(document.visibilityState==='visible')restoreFit();
 });
 window.addEventListener('pagehide',()=>{
   cancelAnimationFrame(fitFrame);cancelAnimationFrame(restoreFrame);
   clearTimeout(restoreTimer);
 });
 new ResizeObserver(scheduleFit).observe(scene);
 window.addEventListener('load', scheduleFit, {once:true});
 window.addEventListener('resize', scheduleFit, {passive:true});
 window.addEventListener('1age-layout-change',()=>{resetGlobeInput();highlight=false;hover=false;sync();restoreFit();});
 window.addEventListener('orientationchange', scheduleFit);
 window.visualViewport?.addEventListener('resize', scheduleFit);
 document.fonts?.ready.then(scheduleFit);
 scheduleFit();
 sync();
})();
