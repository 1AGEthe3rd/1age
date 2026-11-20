(() => {
 'use strict';
 const $=selector=>document.querySelector(selector),brand=$('.brand'),wings=$('.header-wings');
 let group='closed',links={socials:[],contact_email:null};
 const paths={social:'<circle cx="20" cy="19" r="6"/><circle cx="44" cy="19" r="6"/><circle cx="32" cy="43" r="6"/><path d="m24 22 6 15m10-15-6 15M26 19h12"/>',about:'<circle cx="32" cy="32" r="24"/><path d="M32 29v18M32 18v2"/>',store:'<path d="M12 24h40l-4 30H16zM22 24v-7a10 10 0 0 1 20 0v7"/>',blog:'<rect x="10" y="10" width="44" height="44" rx="4"/><path d="M20 21h24M20 31h24M20 41h16"/>',contact:'<rect x="8" y="14" width="48" height="36" rx="6"/><path d="m9 16 23 18 23-18"/>'};
 document.body.insertAdjacentHTML('beforeend','<dialog class="header-contact"><form method="dialog"><button aria-label="Close contact">×</button></form><h2>Contact 1AGE</h2><p class="contact-copy"></p><a class="contact-link" hidden></a><a href="/updates/">Development updates ↗</a></dialog>');
 function contact(){const a=$('.contact-link');a.hidden=!links.contact_email;$('.contact-copy').textContent=links.contact_email?'Get in touch.':'Official contact details will appear here.';if(links.contact_email){a.textContent=links.contact_email;a.href='mailto:'+links.contact_email;}$('.header-contact').showModal();}
 function header(next){
  group=next;if(!brand||!wings)return;wings.classList.add('header-slider');wings.setAttribute('role','navigation');wings.setAttribute('aria-label',next==='social'?'Social links':'1AGE menu');wings.hidden=next==='closed';wings.replaceChildren();brand.setAttribute('aria-expanded',String(next!=='closed'));
  if(next==='closed')return;
  const items=next==='social'?links.socials:[{name:'Store',icon:'store',url:'https://1age.store/'},{name:'Blog',icon:'blog',url:'https://1age.blog/'},{name:'Social',icon:'social',action:()=>header('social')},{name:'Contact',icon:'contact',action:contact},{name:'About',icon:'about',url:'/about/'}];
  const tracks=[document.createElement('div'),document.createElement('div')];
  tracks.forEach((track,i)=>{track.className='header-slider-track';track.dataset.side=i?'right':'left';track.tabIndex=0;track.setAttribute('aria-label',i?'More menu options':'Menu options');wings.append(track);});
  const split=next==='main'?2:Math.ceil(items.length/2);
  items.forEach((item,index)=>{const node=document.createElement(item.url?'a':'button');node.className='header-planet';node.style.setProperty('--slot',String((index%2?-1:1)*(Math.floor(index/2)+1)));
   if(item.url){node.href=item.url;if(next==='social'){node.target='_blank';node.rel='noopener noreferrer';}}else{node.type='button';if(item.action)node.addEventListener('click',item.action);else{node.disabled=true;node.title='Official link not added yet';}}
   const circle=document.createElement('span');circle.className='header-planet-circle';if(item.icon)circle.innerHTML=`<svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">${paths[item.icon]}</svg>`;else circle.textContent=item.symbol;
   const label=document.createElement('span');label.textContent=item.name;node.append(circle,label);tracks[index<split?0:1].appendChild(node);
  });
  tracks.forEach(track=>{track.scrollLeft=0;});
 }
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
 fetch('/data/header-links.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{links.socials=(data.socials||[]).filter(item=>item&&typeof item.name==='string').map(item=>{let url=null;try{if(new URL(item.url).protocol==='https:')url=item.url;}catch(_){}return {name:item.name,symbol:item.symbol||item.name[0],url};});links.contact_email=typeof data.contact_email==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email)?data.contact_email:null;if(group==='social')header('social');}).catch(()=>{links.socials=[{name:'GitHub',symbol:'GH',url:'https://github.com/1AGEthe3rd/1age'}];});
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
 globe.addEventListener('click',()=>{if(dragged||multi){dragged=false;return;}highlight=!highlight;sync();});
 globe.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();reset();window.dispatchEvent(new CustomEvent('1age-world-turn',{detail:e.key==='ArrowLeft'?-.04:.04}));});
 function fit(){
 if(document.visibilityState==='hidden'||document.body.classList.contains('results-open')||document.body.classList.contains('information-open')||document.activeElement?.matches('input,textarea,[contenteditable="true"]'))return;
 const w=scene.clientWidth,h=scene.clientHeight;if(w<1||h<1)return;
 wings?.style.setProperty('--menu-circle-size',brand.querySelector('.brand-circle').offsetWidth+'px');
 const landscape=matchMedia('(orientation:landscape) and (max-height:600px)').matches;
 const pc=document.documentElement.dataset.touchLayout!=='landscape' && matchMedia('(min-width:700px) and (orientation:landscape)').matches;
 const d=pc?Math.max(40,Math.min(92,h*.12)):landscape?Math.max(42,Math.min(56,h*.19)):Math.max(44,Math.min(72,w*.14,innerHeight*.095));
 // Portrait uses the existing studio homepage proportions.
 const compact=document.documentElement.dataset.touchLayout==='landscape';
 const ry=Math.max(42,h/2-d/2-(pc?32:28));
 const rx=compact?Math.min(w*.31,Math.max(280,Math.min(520,(innerWidth-464)/2)),Math.max(42,(w-220)/2)):pc?Math.max(42,Math.min(w/2-d/2-30,ry)):Math.max(42,Math.min(w/2-d/2-16,ry));
 const earth=compact?Math.min(innerHeight*.65,Math.max(300,Math.min(520,innerWidth*.5-250))):pc?Math.min(640,rx*1.42):Math.max(80,Math.min(rx-d/2-15,w*.25))*2;
 // Add breathing room around the same-sized globe on phone portrait.
 const portrait=matchMedia('(orientation:portrait)').matches;
 const dialRadius=portrait?Math.min(rx+8,w/2-d/2-8,ry):rx;
 scene.style.setProperty('--earth',earth+'px');scene.style.setProperty('--orbit-diameter',dialRadius*2+'px');scene.style.setProperty('--orbit-height',dialRadius*2+'px');document.documentElement.style.setProperty('--ui-planet-size',d+'px');}

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
 window.addEventListener('1age-layout-change',scheduleFit);
 window.addEventListener('orientationchange', scheduleFit);
 window.visualViewport?.addEventListener('resize', scheduleFit);
 document.fonts?.ready.then(scheduleFit);
 scheduleFit();
 sync();
})();
