const $=s=>document.querySelector(s),trigger=$('#plus-trigger'),panel=$('#membership'),menu=$('#logo-menu');
let reveal3D=()=>{};
function show(open){panel.hidden=!open;trigger.setAttribute('aria-expanded',String(open));document.body.classList.toggle('member-open',open);reveal3D(open);if(open)$('#membership-title').focus();else trigger.focus();}
trigger.addEventListener('click',()=>show(true));$('#close-membership').addEventListener('click',()=>show(false));
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));$('#destinations').hidden=!open;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!panel.hidden){show(false);e.preventDefault();}else if(!$('#destinations').hidden){$('#destinations').hidden=true;menu.setAttribute('aria-expanded','false');menu.focus();}}});
try {
 const {subscribeInput}=await import('../shared/gamepad.mjs');
 const THREE=await import('../shared/vendor/three.module.js');
 const host=$('#universe'),renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,(navigator.hardwareConcurrency||4)<=4?1:1.5));renderer.setClearColor(0x000000);host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.1,50);camera.position.set(0,.35,8);camera.lookAt(0,.35,0);
 scene.add(new THREE.HemisphereLight(0xe2ffdc,0x052219,3));const light=new THREE.DirectionalLight(0xffffff,4);light.position.set(2,4,5);scene.add(light);
 const plus=new THREE.Group(),material=new THREE.MeshStandardMaterial({color:0x1bfd9c,emissive:0x1bfd9c,emissiveIntensity:.3,metalness:.5,roughness:.2});
 plus.add(new THREE.Mesh(new THREE.BoxGeometry(.32,1.45,.32),material),new THREE.Mesh(new THREE.BoxGeometry(1.45,.32,.32),material));plus.position.y=-.8;scene.add(plus);
 const halo=new THREE.Mesh(new THREE.TorusGeometry(1.05,.012,6,80),new THREE.MeshBasicMaterial({color:0x125b3d}));halo.position.copy(plus.position);scene.add(halo);
 const texture=await new THREE.TextureLoader().loadAsync('../shared/1age-logo.svg');texture.colorSpace=THREE.SRGBColorSpace;
 const logo=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.8),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide}));logo.position.y=1.5;scene.add(logo);
 const stars=new THREE.BufferGeometry(),points=[];let seed=73;
 for(let i=0;i<160;i++){seed=(seed*16807)%2147483647;const x=seed/2147483647*24-12;seed=(seed*16807)%2147483647;const y=seed/2147483647*18-9;points.push(x,y,-8);}
 stars.setAttribute('position',new THREE.Float32BufferAttribute(points,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0x93b7a1,size:.025,transparent:true,opacity:.65})));
 $('#fallback').hidden=true;let yaw=.16,pitch=.08,drag=null,frame=0,last=0,disposed=false,lastWidth=0,lastHeight=0;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 function draw(t=0){if(disposed||document.hidden)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;if(w!==lastWidth||h!==lastHeight){renderer.setSize(w,h,false);lastWidth=w;lastHeight=h;}camera.aspect=w/h;camera.updateProjectionMatrix();plus.rotation.set(pitch,yaw,0);plus.position.y=-.8+(reduced.matches?0:Math.sin(t*.0007)*.035);halo.position.y=plus.position.y;
  const center=plus.position.clone().project(camera);trigger.style.left=(center.x*.5+.5)*w+'px';trigger.style.top=(-center.y*.5+.5)*h+'px';const size=Math.min(w*.32,h*.24,150);trigger.style.width=size+'px';trigger.style.height=size+'px';const caption=new THREE.Vector3(0,plus.position.y-1.2,0).project(camera);$('#invitation').style.top=Math.min(h-85,(-caption.y*.5+.5)*h)+'px';renderer.render(scene,camera);
 }
 function tick(t){frame=requestAnimationFrame(tick);if(t-last<33)return;last=t;draw(t);}
 function motion(){cancelAnimationFrame(frame);draw();if(!reduced.matches&&!document.hidden)frame=requestAnimationFrame(tick);}
 reveal3D=open=>{material.emissiveIntensity=open?.9:.3;halo.material.color.set(open?0x1bfd9c:0x125b3d);draw();};
 const canvas=renderer.domElement;
 canvas.addEventListener('pointerdown',e=>{if(e.button===0)drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};});
 canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;if(!drag.moved){if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;if(e.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx)){drag=null;return;}drag.moved=true;canvas.setPointerCapture(e.pointerId);}yaw+=(e.clientX-drag.x)*.006;pitch=Math.max(-.4,Math.min(.4,pitch+(e.clientY-drag.y)*.003));drag.x=e.clientX;drag.y=e.clientY;draw();});
 const rays=new THREE.Raycaster();canvas.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const tap=!drag.moved;drag=null;if(!tap)return;const b=canvas.getBoundingClientRect();rays.setFromCamera(new THREE.Vector2((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1),camera);if(rays.intersectObjects(plus.children).length)show(true);});
 for(const type of ['pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{drag=null;});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);canvas.hidden=true;$('#fallback').hidden=false;$('#view-status').textContent='3D unavailable. Select Plus to access the same membership information.';});
 const unpad=subscribeInput((input,dt)=>{yaw+=(input.move.x+input.look.x)*dt;pitch=Math.max(-.4,Math.min(.4,pitch+input.look.y*dt));draw();});
 const observer=new ResizeObserver(()=>draw());observer.observe(host);document.addEventListener('visibilitychange',motion);reduced.addEventListener('change',motion);
 window.addEventListener('pagehide',e=>{cancelAnimationFrame(frame);if(e.persisted)return;disposed=true;unpad();observer.disconnect();document.removeEventListener('visibilitychange',motion);reduced.removeEventListener('change',motion);scene.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});renderer.dispose();});window.addEventListener('pageshow',motion);
 motion();
}catch{$('#view-status').textContent='2D fallback. Select Plus to access membership information and test checkout.';}
