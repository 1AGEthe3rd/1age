(() => {
 'use strict';
 const scene=document.querySelector('.world-scene'),globe=document.querySelector('.world-globe');
 if(!scene||!globe)return;
 const planets=[...scene.querySelectorAll('.project-planet')];
 const projects=[['page','1AGE Page','Your identity, profile and personal room.'],['space','1AGE Space','A social destination for the Solana community.'],['games','1AGE Games','Discover games and explore the training complex.'],['exchange','1AGE Exchange','The marketplace and home of ecosystem payments.'],['quest','1AGE Quest','Learn, participate and discover new possibilities.'],['design','1AGE.design','Building 1AGE should feel like playing 1AGE.']];
 globe.insertAdjacentHTML('beforeend','<span class="world-letter" aria-hidden="true">1AGE World</span><img class="project-peek" alt="" hidden><span class="peek-caption" hidden></span>');
 scene.insertAdjacentHTML('beforeend','<button class="peek-info" type="button" aria-haspopup="dialog" aria-label="About selected project" hidden>i</button><button class="world-help" type="button" aria-label="Show gesture guide">?</button>');
 document.body.insertAdjacentHTML('beforeend',`<dialog class="project-info" aria-labelledby="project-info-title"><form method="dialog"><button class="dialog-close" aria-label="Close project information">×</button></form><h2 id="project-info-title"></h2><p id="project-info-description"></p><p class="concept-note">World destination in development</p><a class="project-info-link" href="/ecosystem/">Open project ↗</a></dialog><dialog class="gesture-guide" aria-labelledby="gesture-guide-title"><h2 id="gesture-guide-title">Your World, one screen.</h2><div class="gesture-visual" aria-hidden="true"><span>←</span><span class="demo-globe">✦</span><span>→</span></div><p>Drag the globe to turn it.<br>Swipe around the planets to explore.<br>Tap a planet for a glimpse inside.</p><label><input type="checkbox" id="hide-gesture-guide"> Don’t show again</label><button type="button" data-dismiss-guide>Let’s explore</button></dialog>`);
 const peek=globe.querySelector('.project-peek'),caption=globe.querySelector('.peek-caption'),info=scene.querySelector('.peek-info');
 const infoDialog=document.querySelector('.project-info'),guide=document.querySelector('.gesture-guide');
 const reset=()=>{scene.classList.remove('showing-peek');peek.hidden=caption.hidden=info.hidden=true;planets.forEach(p=>p.classList.remove('is-selected'));};
 window.addEventListener('1age-project-preview',event=>{
  const index=event.detail,project=projects[index];if(!project)return;
  peek.src=`/assets/world-previews/${project[0]}.svg`;peek.alt=`${project[1]} virtual destination concept`;
  caption.textContent=`${project[1]} · CONCEPT`;peek.hidden=caption.hidden=info.hidden=false;
  scene.classList.add('showing-peek');planets.forEach((p,i)=>p.classList.toggle('is-selected',i===index));
  document.querySelector('#project-info-title').textContent=project[1];
  document.querySelector('#project-info-description').textContent=project[2];
  document.querySelector('.project-info-link').href=planets[index].href;
 });
 info.addEventListener('click',()=>infoDialog.showModal());
 scene.querySelector('.world-help').addEventListener('click',()=>guide.showModal());
 document.querySelector('[data-dismiss-guide]').addEventListener('click',()=>{
  try{if(document.querySelector('#hide-gesture-guide').checked)localStorage.setItem('1age-hide-guide','1');}catch(_){}
  guide.close();
 });
 let guideHidden=false;try{guideHidden=localStorage.getItem('1age-hide-guide')==='1';}catch(_){}
 if(!guideHidden)guide.showModal();
 let drag=null,dragged=false;const touches=new Set();
 globe.addEventListener('pointerdown',event=>{
  if(event.pointerType==='touch')touches.add(event.pointerId);
  if(touches.size>1){drag=null;return;}if(event.button!==0)return;
  drag={id:event.pointerId,x:event.clientX,start:event.clientX};dragged=false;globe.setPointerCapture(event.pointerId);
 });
 globe.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  if(Math.abs(event.clientX-drag.start)>6)dragged=true;
  if(dragged){reset();window.dispatchEvent(new CustomEvent('1age-world-turn',{detail:-(event.clientX-drag.x)/Math.max(1,globe.clientWidth)}));}
  drag.x=event.clientX;
 });
 const release=event=>{touches.delete(event.pointerId);if(drag?.id===event.pointerId)drag=null;};
 globe.addEventListener('pointerup',release);globe.addEventListener('pointercancel',release);
 globe.addEventListener('click',()=>{if(!dragged)reset();dragged=false;});
 globe.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();reset();
  window.dispatchEvent(new CustomEvent('1age-world-turn',{detail:event.key==='ArrowLeft'?-.04:.04}));
 });
 reset();
})();
