const gallery=document.querySelector('#gallery'),status=document.querySelector('#gallery-status'),dialog=document.querySelector('#publication');
let viewer=null,selectedButton=null;
const text=(tag,copy)=>{const e=document.createElement(tag);e.textContent=copy;return e;};
function safeMedia(src){const url=new URL(src,location.href);if(url.origin!==location.origin)throw Error('Media must be packaged with this build');return url.href;}
async function open(record,button){
 selectedButton=button;dialog.showModal();
 document.querySelector('#publication-title').textContent=record.title;document.querySelector('#publication-title').focus();
 document.querySelector('#publication-meta').textContent=`${record.date} · ${record.status}`;
 document.querySelector('#publication-description').textContent=record.description;
 document.querySelector('#publication-body').replaceChildren(...record.body.map(p=>text('p',p)));
 document.querySelector('#publication-technical').textContent=record.technical;
 const scene=dialog.querySelector('.scene'),image=document.querySelector('#publication-image'),video=document.querySelector('#publication-video');
 scene.hidden=!['procedural','gltf'].includes(record.media.kind);image.hidden=record.media.kind!=='image';video.hidden=record.media.kind!=='video';video.pause();video.removeAttribute('src');
 if(record.media.kind==='image'){image.src=safeMedia(record.media.src);image.alt=record.media.alt;image.style.width='100%';}
 if(record.media.kind==='video'){video.src=safeMedia(record.media.src);video.style.width='100%';}
 if(['procedural','gltf'].includes(record.media.kind)){
  try{const {createViewer}=await import('../shared/viewer.js');if(!viewer)viewer=createViewer(dialog.querySelector('.viewport'),{model:record.media.model});else viewer.setModel(record.media.model||'property');
   if(record.media.kind==='gltf')await viewer.loadGLTF(safeMedia(record.media.src));}
  catch{dialog.querySelector('.fallback-note').textContent='2D view · Model description remains available.';}
 }
}
document.querySelector('#close-publication').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{document.querySelector('#publication-video').pause();selectedButton?.focus();});
fetch('./publications.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(records=>{
 for(const r of records){
  const button=document.createElement('button');button.className='exhibit';button.type='button';
  const thumbnail=document.createElement('span');thumbnail.className='thumbnail';
  if(r.media.kind==='image'||r.media.model==='brand'){const img=document.createElement('img');img.alt='';img.loading='lazy';img.src=r.media.kind==='image'?safeMedia(r.media.src):'../shared/1age-logo.svg';thumbnail.append(img);}
  else{const model=document.createElement('span');model.className='mini-object'+(r.media.model==='property'?' building':'');model.setAttribute('aria-hidden','true');thumbnail.append(model);}
  const copy=document.createElement('div');copy.className='card-copy';const tag=text('span',r.status);tag.className='tag';copy.append(tag,text('h3',r.title),text('p',r.description),text('p',`${r.date} · ${r.type}`));button.append(thumbnail,copy);button.addEventListener('click',()=>open(r,button));gallery.append(button);
 }
 status.textContent='Four visual studies. Select one to inspect or read.';
}).catch(()=>{status.textContent='The gallery could not load. Reload to try again.';});
