import {entityDestinations,destinationPage} from './search-orbit-model.mjs';
const COLORS={community:0xc18bff,social:0x50e3d4,opportunity:0xffc85c,tool:0x4bb5ff,documentation:0x4bb5ff,website:0x1bfd9c,content:0xe2ffdc};
let activeClose;
export async function openEntityOrbit(entity,records,trigger) {
 activeClose?.();
 const allNodes=entityDestinations(entity,records,{limit:Infinity});
 let page=0,category='all',nodes=[];
 const dialog=document.createElement('dialog');dialog.className='entity-orbit';dialog.setAttribute('aria-labelledby','entity-orbit-title');
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const header=el('header'),title=el('h2',entity.name),close=el('button','Close');title.id='entity-orbit-title';close.type='button';header.append(title,close);
 const description=el('p',entity.description),body=el('div');body.className='orbit-body';
 const stage=el('section');stage.className='orbit-stage';stage.setAttribute('aria-label','3D entity explorer');
 const viewport=el('div');viewport.className='orbit-canvas';
 const controls=el('div');controls.className='orbit-controls';
 const help=el('p','Drag horizontally to turn. Tap a sphere to select it, then use its link below. The destination buttons provide the same access.');help.className='orbit-help';
 const status=el('p','Loading 3D view. Destination buttons are ready.');status.className='orbit-status';status.setAttribute('role','status');
 const side=el('section'),list=el('div'),selection=el('div');list.className='orbit-destinations';list.setAttribute('aria-label','Entity destinations');selection.className='orbit-selection';selection.setAttribute('aria-live','polite');
 const filterLabel=el('label','Destination type'),filter=el('select');filter.setAttribute('aria-label','Destination type');
 for(const type of ['all',...new Set(allNodes.map(node=>node.type))]){const option=el('option',type==='all'?'All types':type);option.value=type;filter.append(option);}filterLabel.append(filter);
 const pager=el('div'),previous=el('button','Previous destinations'),next=el('button','Next destinations'),pageStatus=el('p');pager.className='orbit-pager';pageStatus.setAttribute('role','status');previous.type=next.type='button';pager.append(previous,next,pageStatus);
 side.append(el('h3','Connected destinations'),filterLabel,list,pager,selection);stage.append(viewport,controls,help,status);body.append(stage,side);dialog.append(header,description,body);document.body.append(dialog);
 let disposed=false,cleanup=()=>{},select3D=()=>{},rotate=()=>{},zoom=()=>{},reset=()=>{},rebuild3D=()=>{};
 function finish(){if(disposed)return;disposed=true;cleanup();dialog.remove();if(activeClose===finish)activeClose=null;trigger?.isConnected&&trigger.focus();}
 activeClose=finish;close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',finish,{once:true});
 dialog.showModal();close.focus();
 const buttons=[];
 function select(index){
  const node=nodes[index];if(!node)return;
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  selection.replaceChildren(el('h3',node.name),el('p',node.type));
  const link=el('a','Open destination');link.href=node.url;link.target='_blank';link.rel='noopener noreferrer';selection.append(link);
  if(node.evidence){const evidence=el('a','Relationship source');evidence.href=node.evidence;evidence.target='_blank';evidence.rel='noopener noreferrer';selection.append(evidence);}
  selection.append(el('p','External destinations open their existing website. A resource link is not a safety endorsement.'));
  select3D(index);
 }
 function showPage(){
  const result=destinationPage(allNodes,{page,category});page=result.page;nodes=result.nodes;
  list.replaceChildren();buttons.length=0;
  nodes.forEach((node,i)=>{const b=el('button',node.name);b.type='button';b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>select(i));buttons.push(b);list.append(b);});
  previous.disabled=page===0;next.disabled=page===result.pages-1;
  pageStatus.textContent=result.total?`${result.start}–${result.end} of ${result.total} destinations · Page ${page+1} of ${result.pages}`:'No destinations for this type.';
  rebuild3D();
  if(nodes.length)select(0);else selection.replaceChildren(el('p','No public destination links are recorded yet.'));
 }
 previous.addEventListener('click',()=>{page--;showPage();if(previous.disabled)next.focus();});
 next.addEventListener('click',()=>{page++;showPage();if(next.disabled)previous.focus();});
 filter.addEventListener('change',()=>{category=filter.value;page=0;showPage();});
 showPage();
 for(const [text,act] of [['Rotate left',()=>rotate(-.3)],['Rotate right',()=>rotate(.3)],['Zoom in',()=>zoom(-1)],['Zoom out',()=>zoom(1)],['Reset view',()=>reset()]]){const b=el('button',text);b.type='button';b.addEventListener('click',act);controls.append(b);}
 try {
  const THREE=await import('./experiences/shared/vendor/three.module.js');if(disposed)return;
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,.1,100),group=new THREE.Group();scene.add(group);
  camera.position.set(0,3.8,10);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight(0xe2ffdc,0x091b14,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(3,6,5);scene.add(light);
  const central=new THREE.Mesh(new THREE.IcosahedronGeometry(1.05,2),new THREE.MeshStandardMaterial({color:0x093f2a,emissive:0x074529,metalness:.45,roughness:.35}));scene.add(central);
  const outline=new THREE.Mesh(new THREE.IcosahedronGeometry(1.07,1),new THREE.MeshBasicMaterial({color:0x1bfd9c,wireframe:true}));scene.add(outline);
  const orbit=new THREE.Mesh(new THREE.TorusGeometry(3.05,.012,6,100),new THREE.MeshBasicMaterial({color:0x16784e}));orbit.rotation.x=Math.PI/2;group.add(orbit);
  function label(text){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d');ctx.fillStyle='#000d';ctx.fillRect(0,0,512,96);ctx.font='bold 30px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#E2FFDC';ctx.fillText(text.slice(0,30),256,48,490);const texture=new THREE.CanvasTexture(canvas);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));sprite.scale.set(2.2,.42,1);return sprite;}
  const name=label(entity.name);name.position.set(0,1.65,0);scene.add(name);
  let meshes=[];
  const destinations=new THREE.Group();group.add(destinations);
  function disposeTree(root){root.traverse(o=>{o.geometry?.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];for(const mat of mats){mat?.map?.dispose();mat?.dispose();}});}
  rebuild3D=()=>{
   disposeTree(destinations);destinations.clear();
   meshes=nodes.map((node,i)=>{const angle=i/Math.max(1,nodes.length)*Math.PI*2;const mesh=new THREE.Mesh(new THREE.SphereGeometry(.32,20,14),new THREE.MeshStandardMaterial({color:COLORS[node.type]||0x1bfd9c,metalness:.5,roughness:.25,emissive:COLORS[node.type]||0x1bfd9c,emissiveIntensity:.18}));mesh.position.set(Math.sin(angle)*3.05,0,Math.cos(angle)*3.05);mesh.userData.index=i;destinations.add(mesh);const caption=label(node.name);caption.position.copy(mesh.position);caption.position.y=.65;destinations.add(caption);return mesh;});
  };
  rebuild3D();
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',entity.name+' 3D relationship view. Use arrow keys to turn, plus and minus to zoom; use destination buttons to select.');viewport.append(canvas);
  function draw(){if(disposed||document.hidden)return;const w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera);}
  rotate=delta=>{group.rotation.y+=delta;draw();};zoom=delta=>{camera.position.multiplyScalar(delta<0?.9:1.1);camera.position.clampLength(6,16);draw();};reset=()=>{group.rotation.y=0;camera.position.set(0,3.8,10);draw();};
  select3D=i=>{meshes.forEach((m,n)=>{m.scale.setScalar(n===i?1.4:1);m.material.emissiveIntensity=n===i?.65:.18;});draw();};
  const raycaster=new THREE.Raycaster();let pointer=null;
  const down=e=>{if(e.button!==0)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,drag:false};};
  const move=e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.startX,dy=e.clientY-pointer.startY;if(!pointer.drag){if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;if(e.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx)){pointer=null;return;}pointer.drag=true;canvas.setPointerCapture(e.pointerId);}rotate((e.clientX-pointer.x)*.008);pointer.x=e.clientX;};
  const up=e=>{if(!pointer||pointer.id!==e.pointerId)return;const tap=!pointer.drag;pointer=null;if(!tap)return;const rect=canvas.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);const hit=raycaster.intersectObjects(meshes)[0];if(hit)select(hit.object.userData.index);};
  const cancel=()=>{pointer=null;};
  const key=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();rotate(e.key==='ArrowLeft'?-.3:.3);}if(e.key==='Home'){e.preventDefault();reset();}if(['+','=','-','_'].includes(e.key)){e.preventDefault();zoom(['-','_'].includes(e.key)?1:-1);}};
  const lost=e=>{e.preventDefault();status.textContent='3D is unavailable. Use the destination buttons.';canvas.hidden=true;};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',cancel);canvas.addEventListener('keydown',key);canvas.addEventListener('webglcontextlost',lost);
  const observer=new ResizeObserver(draw);observer.observe(viewport);document.addEventListener('visibilitychange',draw);
  cleanup=()=>{observer.disconnect();document.removeEventListener('visibilitychange',draw);disposeTree(scene);renderer.dispose();canvas.remove();};
  // Render on interaction only: no perpetual animation, including reduced-motion devices.
  status.textContent='3D ready. Spheres are symbolic destinations, not replicas of external applications.';
  select3D(0);draw();
 }catch{status.textContent='3D could not load on this device. All recorded destinations remain available below.';controls.hidden=true;viewport.hidden=true;}
}
