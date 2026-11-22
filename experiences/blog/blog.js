import {validatePublications,filterPublications,storyURL} from './blog-model.js';
const $=s=>document.querySelector(s),gallery=$('#gallery'),status=$('#gallery-status'),dialog=$('#publication');
let records=[],viewer=null,archive=null,selectedButton=null,generation=0,skipCloseURL=false,loading=false;
const text=(tag,copy)=>{const e=document.createElement(tag);e.textContent=copy;return e;};
function safeMedia(src){const url=new URL(src,location.href),shared=new URL('../shared/',location.href),media=new URL('./media/',location.href);if(url.origin!==location.origin||(!url.pathname.startsWith(shared.pathname)&&!url.pathname.startsWith(media.pathname))||! /\.(glb|gltf|svg|png|jpe?g|webp|mp4|webm)$/i.test(url.pathname))throw Error('Media must be a packaged image, video or model');return url.href;}
function clearMedia(){generation++;viewer?.dispose();viewer=null;const video=$('#publication-video');video.pause();video.removeAttribute('src');$('#publication-image').removeAttribute('src');}
async function open(record,button,update=true){
 clearMedia();const ownGeneration=generation;selectedButton=button||gallery.querySelector('button');
 if(!dialog.open)dialog.showModal();
 $('#publication-media-status').textContent='';$('#publication-title').textContent=record.title;$('#publication-title').focus();
 $('#publication-meta').textContent=[record.date,record.type,record.status,...(record.categories||[])].join(' · ');
 $('#publication-description').textContent=record.description;$('#publication-body').replaceChildren(...record.body.map(p=>text('p',p)));$('#publication-technical').textContent=record.technical;
 $('#publication-permalink').href=storyURL(location.href,record.id).href;
 $('#related-stories').replaceChildren();for(const id of record.related||[]){const r=records.find(x=>x.id===id);const b=text('button',r.title);b.type='button';b.addEventListener('click',()=>open(r,selectedButton));$('#related-stories').append(b);}
 $('#related-note').hidden=!(record.related||[]).length;
 if(update)history.pushState({blogStory:record.id},'',storyURL(location.href,record.id));
 const scene=dialog.querySelector('.scene'),image=$('#publication-image'),video=$('#publication-video');image.onerror=video.onerror=()=>{$('#publication-media-status').textContent='This media could not load. The article and related stories remain available.';};scene.hidden=!['procedural','gltf'].includes(record.media.kind);image.hidden=record.media.kind!=='image';video.hidden=record.media.kind!=='video';
 try{
  if(record.media.kind==='image'){image.src=safeMedia(record.media.src);image.alt=record.media.alt||record.title;image.style.width='100%';}
  if(record.media.kind==='video'){video.src=safeMedia(record.media.src);video.style.width='100%';}
  if(['procedural','gltf'].includes(record.media.kind)){
   const {createViewer}=await import('../shared/viewer.js');if(ownGeneration!==generation||!dialog.open)return;
   const own=createViewer(dialog.querySelector('.viewport'),{model:record.media.model||'property'});viewer=own;
   if(record.media.kind==='gltf'){await own.loadGLTF(safeMedia(record.media.src));if(ownGeneration!==generation)own.dispose();}
  }
 }catch{if(ownGeneration===generation){dialog.querySelector('.fallback-note').textContent='Media unavailable. The article and related stories remain accessible.';$('#publication-media-status').textContent='This media could not load. The article remains available.';}}
}
$('#close-publication').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{clearMedia();archive?.refresh();selectedButton?.isConnected&&selectedButton.focus();if(skipCloseURL){skipCloseURL=false;return;}if(new URL(location.href).searchParams.has('story')){history.replaceState(null,'',storyURL(location.href,null));}});
function fromURL(){const id=new URL(location.href).searchParams.get('story');if(id){const row=records.find(x=>x.id===id);if(row)open(row,null,false);else{if(dialog.open){skipCloseURL=true;dialog.close();}status.textContent='That story is not in this archive. Browse the available publications below.';}}else if(dialog.open){skipCloseURL=true;dialog.close();}}
window.addEventListener('popstate',fromURL);
function render(){const shown=filterPublications(records,$('#story-query').value);archive?.dispose();archive=null;gallery.replaceChildren();
 for(const row of shown){const button=text('button',row.title);button.className='story-node';button.type='button';button.dataset.story=row.id;button.append(text('span',row.status));button.setAttribute('aria-label','Read '+row.title);button.addEventListener('click',()=>open(row,button));gallery.append(button);}
 status.textContent=shown.length?`${shown.length} visual ${shown.length===1?'publication':'publications'}. Select a story to inspect or read. Concepts retain their development labels.`:'No matching publications. Try Space, Pocket or identity.';
 const revision=++render.revision;
 if(!shown.length){document.body.classList.add('archive-fallback');return;}
 import('./story-scene.js').then(({createStoryScene})=>{if(revision!==render.revision)return;archive=createStoryScene($('#story-universe'),shown,[...gallery.querySelectorAll('button')],row=>open(row,gallery.querySelector(`[data-story="${row.id}"]`)));document.body.classList.remove('archive-fallback');archive.layout($('#layout-toggle').getAttribute('aria-pressed')==='true');}).catch(()=>{if(revision===render.revision){document.body.classList.add('archive-fallback');status.textContent+=' 3D unavailable; all story buttons remain usable.';}});
}render.revision=0;
$('#story-query').addEventListener('input',render);
$('#layout-toggle').addEventListener('click',()=>{const enabled=$('#layout-toggle').getAttribute('aria-pressed')!=='true';$('#layout-toggle').setAttribute('aria-pressed',String(enabled));$('#layout-toggle').textContent=enabled?'Orbital gallery':'Story constellation';archive?.layout(enabled);});
for(const b of document.querySelectorAll('[data-orbit]'))b.addEventListener('click',()=>archive?.turn(b.dataset.orbit));
const menu=$('#logo-menu');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));$('#destinations').hidden=!open;});
async function load(){if(loading)return;loading=true;$('#retry-gallery').hidden=true;try{const response=await fetch('./publications.json');if(!response.ok)throw Error();records=validatePublications(await response.json());render();fromURL();}catch{status.textContent='The archive could not load. Retry to retrieve the existing publications.';$('#retry-gallery').hidden=false;}finally{loading=false;}}
$('#retry-gallery').addEventListener('click',load);load();
window.addEventListener('pagehide',e=>{if(!e.persisted){archive?.dispose();clearMedia();}});
