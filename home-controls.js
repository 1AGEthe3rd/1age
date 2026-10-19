(() => {
 'use strict';
 const $=selector=>document.querySelector(selector),brand=$('.brand'),wings=$('.header-wings');
 let group='closed',links={socials:[],contact_email:null};
 const paths={social:'<circle cx="20" cy="19" r="6"/><circle cx="44" cy="19" r="6"/><circle cx="32" cy="43" r="6"/><path d="m24 22 6 15m10-15-6 15M26 19h12"/>',about:'<circle cx="32" cy="32" r="24"/><path d="M32 29v18M32 18v2"/>',contact:'<rect x="8" y="14" width="48" height="36" rx="6"/><path d="m9 16 23 18 23-18"/>'};
 document.body.insertAdjacentHTML('beforeend','<dialog class="header-contact"><form method="dialog"><button aria-label="Close contact">×</button></form><h2>Contact 1AGE</h2><p class="contact-copy"></p><a class="contact-link" hidden></a><a href="/updates/">Development updates ↗</a></dialog>');
 function contact(){const a=$('.contact-link');a.hidden=!links.contact_email;$('.contact-copy').textContent=links.contact_email?'Get in touch.':'Official contact details will appear here.';if(links.contact_email){a.textContent=links.contact_email;a.href='mailto:'+links.contact_email;}$('.header-contact').showModal();}
 function header(next){
  group=next;if(!brand||!wings)return;wings.hidden=next==='closed';wings.replaceChildren();brand.setAttribute('aria-expanded',String(next!=='closed'));brand.querySelector('img').src=next==='closed'?'/assets/1age-logo.svg':'/assets/1age-logo-active.svg';
  if(next==='closed')return;
  const items=next==='social'?links.socials:[{name:'Social',icon:'social',action:()=>header('social')},{name:'About',icon:'about',url:'/about/'},{name:'Contact',icon:'contact',action:contact},{name:'Help',symbol:'?',action:()=>document.querySelector('.gesture-guide')?.showModal()}];
  items.forEach((item,index)=>{const node=document.createElement(item.url?'a':'button');node.className='header-planet';node.style.setProperty('--slot',String((index%2?-1:1)*(Math.floor(index/2)+1)));
   if(item.url){node.href=item.url;if(next==='social'){node.target='_blank';node.rel='noopener noreferrer';}}else{node.type='button';if(item.action)node.addEventListener('click',item.action);else{node.disabled=true;node.title='Official link not added yet';}}
   const circle=document.createElement('span');circle.className='header-planet-circle';if(item.icon)circle.innerHTML=`<svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">${paths[item.icon]}</svg>`;else circle.textContent=item.symbol;
   const label=document.createElement('span');label.textContent=item.name;node.append(circle,label);wings.appendChild(node);
  });
 }
 brand?.addEventListener('click',()=>header(group==='closed'?'main':group==='social'?'main':'closed'));brand?.addEventListener('keydown',e=>{if(e.key==='Escape')header('closed');});
 fetch('/data/header-links.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{links.socials=(data.socials||[]).filter(item=>item&&typeof item.name==='string').map(item=>{let url=null;try{if(new URL(item.url).protocol==='https:')url=item.url;}catch(_){}return {name:item.name,symbol:item.symbol||item.name[0],url};});links.contact_email=typeof data.contact_email==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email)?data.contact_email:null;if(group==='social')header('social');}).catch(()=>{links.socials=[{name:'GitHub',symbol:'GH',url:'https://github.com/1AGEthe3rd/1age'}];});
 const scene=$('.world-scene'),globe=$('.world-globe');if(!scene||!globe)return;
 const orbit=$('.project-orbit'),entry=$('.world-entry'),planets=[...orbit.querySelectorAll('.project-planet')],slugs=['page','space','games','exchange','quest','cash'];
 let selected=null,highlight=false,hover=false,drag=null,dragged=false,multi=false;const touches=new Set();
 globe.insertAdjacentHTML('beforeend','<span class="world-letter" aria-hidden="true">1AGE World</span><img class="project-peek" alt="" hidden>');
 scene.insertAdjacentHTML('beforeend','<button class="preview-expand" type="button" aria-label="Enlarge selected project preview" aria-haspopup="dialog" hidden>⤢</button>');
 document.body.insertAdjacentHTML('beforeend','<dialog class="preview-view" aria-label="Enlarged project preview"><img alt=""><form method="dialog"><button aria-label="Close enlarged preview">×</button></form></dialog><dialog class="gesture-guide" aria-labelledby="gesture-guide-title"><h2 id="gesture-guide-title">Your World, one screen.</h2><div class="gesture-visual" aria-hidden="true">← <span class="demo-globe">✦</span> →</div><p>Drag the globe to turn it.<br>Swipe the planets to explore.<br>Press a planet for a glimpse. Tap to open.<br>Hold for options. L / R open more destinations.<br>Tap the globe to return, then tap again to reveal Enter.</p><label><input type="checkbox" id="hide-gesture-guide"> Don’t show again</label><button type="button" data-dismiss-guide>Let’s explore</button></dialog>');
 const peek=globe.querySelector('.project-peek'),expand=$('.preview-expand'),viewer=$('.preview-view'),guide=$('.gesture-guide');
 function sync(){const preview=selected!==null;scene.classList.toggle('showing-peek',preview);scene.classList.toggle('globe-selected',!preview&&highlight);scene.classList.toggle('globe-hover',!preview&&hover);peek.hidden=expand.hidden=!preview;entry.hidden=preview;globe.setAttribute('aria-pressed',String(!preview&&highlight));globe.setAttribute('aria-label',preview?'Project preview. Press to return to 1AGEWorld.':'1AGEWorld. Drag to turn; press to highlight and reveal Enter.');planets.forEach((node,i)=>node.classList.toggle('is-selected',i===selected));}
 function reset(){selected=null;highlight=false;sync();}
 window.addEventListener('1age-project-preview',event=>{if(!slugs[event.detail])return;selected=event.detail;highlight=false;peek.src=`/assets/world-previews/${slugs[selected]}.svg`;peek.alt=`${slugs[selected]} virtual destination concept`;sync();});
 expand.addEventListener('click',()=>{if(selected===null)return;viewer.querySelector('img').src=peek.src;viewer.querySelector('img').alt=peek.alt;viewer.showModal();});
 for(const node of [globe,entry]){node.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hover=true;sync();}});node.addEventListener('pointerleave',e=>{if(!e.relatedTarget?.closest('.world-globe,.world-entry')){hover=false;sync();}});}
 globe.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){touches.add(e.pointerId);hover=false;}if(touches.size>1){drag=null;multi=true;scene.classList.remove('globe-pressed');return;}if(e.button!==0)return;multi=false;dragged=false;drag={id:e.pointerId,x:e.clientX,start:e.clientX};if(selected===null)scene.classList.add('globe-pressed');globe.setPointerCapture(e.pointerId);});
 globe.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;if(Math.abs(e.clientX-drag.start)>6)dragged=true;if(dragged){reset();window.dispatchEvent(new CustomEvent('1age-world-turn',{detail:-(e.clientX-drag.x)/Math.max(1,globe.clientWidth)}));}drag.x=e.clientX;});
 function release(e){touches.delete(e.pointerId);if(drag?.id===e.pointerId)drag=null;scene.classList.remove('globe-pressed');}
 globe.addEventListener('pointerup',release);globe.addEventListener('pointercancel',e=>{release(e);multi=true;});
 globe.addEventListener('click',()=>{if(dragged||multi){dragged=false;return;}if(selected!==null){reset();return;}highlight=!highlight;sync();});
 globe.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();reset();window.dispatchEvent(new CustomEvent('1age-world-turn',{detail:e.key==='ArrowLeft'?-.04:.04}));});
 $('[data-dismiss-guide]').addEventListener('click',()=>{try{if($('#hide-gesture-guide').checked)localStorage.setItem('1age-hide-guide','1');}catch(_){}guide.close();});let hide=false;try{hide=localStorage.getItem('1age-hide-guide')==='1';}catch(_){}if(!hide)guide.showModal();
 function fit(){const w=scene.clientWidth,h=scene.clientHeight;if(w<1||h<1)return;
 const landscape=matchMedia('(orientation:landscape) and (max-height:600px)').matches;
 const d=landscape?Math.max(42,Math.min(56,h*.19)):Math.max(44,Math.min(72,w*.14,innerHeight*.095));
 const ry=Math.max(42,h/2-d/2-28),rx=landscape?Math.min(w*.33,w/2-d/2-30):Math.min(w/2-d/2-16,ry);
 const earth=landscape?Math.max(112,Math.min(h*.70,240,rx*1.03)):Math.max(80,Math.min(rx-d/2-15,w*.25))*2;
 scene.style.setProperty('--earth',earth+'px');scene.style.setProperty('--orbit-diameter',rx*2+'px');scene.style.setProperty('--orbit-height',(landscape?Math.max(46,ry)*2:rx*2)+'px');document.documentElement.style.setProperty('--ui-planet-size',d+'px');}

 new ResizeObserver(fit).observe(scene);fit();sync();
})();
